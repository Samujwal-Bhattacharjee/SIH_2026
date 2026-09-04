"""
Model Training, Evaluation, and Persistence for Procurement ML Benchmark
========================================================================
SIH26100 — Ministry of Finance / GeM — Decoupled AI Architecture

Trains TWO independent, decoupled Random Forest models:
1. Procurement Compliance Classifier (+ Regressor for 0-100 score)
2. Procurement Integrity Classifier (+ Regressor for 0-100 score)

Guarantees:
- Strictly held-out 80/20 stratified train/test split (seed=42).
- Never evaluates on training data.
- Real unrounded scikit-learn metrics computed on held-out test data.
- Top 10 real feature importances extracted from feature_importances_.
- Models and benchmark metadata persisted to backend/models/.
- Strict anti-leakage invariants verified before training.
- Explicit honesty annotations (SYNTHETIC, HELD_OUT_TEST_SET, FAIR_BID_RULE_BASED_BENCHMARK).
"""
from __future__ import annotations

from datetime import datetime, timezone
import json
import os
from pathlib import Path
from typing import Any, Dict, List, Tuple

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    mean_absolute_error,
    mean_squared_error,
    precision_score,
    r2_score,
    recall_score,
)
from sklearn.model_selection import train_test_split

from app.services.ground_truth.dataset_generator import (
    BENCHMARK_RANDOM_SEED,
    TARGET_DATASET_SIZE,
    generate_benchmark_dataset,
)
from app.services.ground_truth.features import (
    COMPLIANCE_FEATURE_NAMES,
    INTEGRITY_FEATURE_NAMES,
    assert_no_target_leakage,
    build_compliance_dataset,
    build_integrity_dataset,
)

# Standard target path constants
_BASE_DIR = Path(__file__).resolve().parents[3]  # root of backend
MODELS_DIR = _BASE_DIR / "models"

COMPLIANCE_MODEL_PATH = MODELS_DIR / "procurement_compliance_rf.joblib"
INTEGRITY_MODEL_PATH = MODELS_DIR / "procurement_integrity_rf.joblib"
BENCHMARK_JSON_PATH = MODELS_DIR / "procurement_ml_benchmark.json"

MODEL_VERSION = "1.0.0"
DATASET_VERSION = "1.0.0"


def _compute_classification_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    classes: List[str],
) -> Dict[str, Any]:
    """Compute held-out classification metrics using standard scikit-learn functions."""
    acc = float(accuracy_score(y_true, y_pred))
    prec = float(precision_score(y_true, y_pred, average="macro", zero_division="warn"))
    rec = float(recall_score(y_true, y_pred, average="macro", zero_division="warn"))
    f1 = float(f1_score(y_true, y_pred, average="macro", zero_division="warn"))
    cm = confusion_matrix(y_true, y_pred, labels=classes).tolist()

    return {
        "accuracy": acc,
        "precision_macro": prec,
        "recall_macro": rec,
        "f1_macro": f1,
        "confusion_matrix": {
            "classes": classes,
            "matrix": cm,
        },
    }


def _compute_regression_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
) -> Dict[str, float]:
    """Compute held-out regression metrics."""
    mae = float(mean_absolute_error(y_true, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    r2 = float(r2_score(y_true, y_pred))
    return {
        "mae": mae,
        "rmse": rmse,
        "r2": r2,
    }


def _get_top_features(
    model: RandomForestClassifier,
    feature_names: List[str],
    top_k: int = 10,
) -> List[Dict[str, Any]]:
    """Extract real feature importances sorted descending."""
    importances = model.feature_importances_
    pairs = sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True)
    return [
        {"feature": name, "importance": float(imp)}
        for name, imp in pairs[:top_k]
    ]


def train_and_evaluate_all(
    dataset_size: int = TARGET_DATASET_SIZE,
    seed: int = BENCHMARK_RANDOM_SEED,
    output_dir: Path = MODELS_DIR,
) -> Dict[str, Any]:
    """
    Main training & evaluation pipeline.
    1. Generates 600 synthetic benchmark cases (seed=42).
    2. Builds compliance & integrity feature matrices.
    3. Splits 80/20 train/test with stratification.
    4. Trains separate RandomForest models.
    5. Evaluates strictly on held-out test data.
    6. Persists joblib bundles and machine-readable benchmark JSON.
    """
    output_dir.mkdir(parents=True, exist_ok=True)

    # ────────────────────────────────────────────────────────────
    # 1. GENERATE BENCHMARK DATASET
    # ────────────────────────────────────────────────────────────
    cases = generate_benchmark_dataset(dataset_size, seed)

    # ────────────────────────────────────────────────────────────
    # 2. COMPLIANCE MODEL TRAINING & EVALUATION
    # ────────────────────────────────────────────────────────────
    X_comp, y_comp_class, y_comp_score, comp_feat_names, comp_ids = build_compliance_dataset(cases)
    assert_no_target_leakage(comp_feat_names)

    # 80/20 Stratified Split
    indices_comp = np.arange(len(cases))
    train_idx_c, test_idx_c = train_test_split(
        indices_comp,
        test_size=0.20,
        random_state=seed,
        stratify=y_comp_class,
    )

    # Assert zero overlap between train and test
    assert len(set(train_idx_c).intersection(set(test_idx_c))) == 0, "Train/Test overlap in Compliance!"

    X_comp_train, X_comp_test = X_comp[train_idx_c], X_comp[test_idx_c]
    y_comp_train_class, y_comp_test_class = y_comp_class[train_idx_c], y_comp_class[test_idx_c]
    y_comp_train_score, y_comp_test_score = y_comp_score[train_idx_c], y_comp_score[test_idx_c]
    test_comp_ids = [comp_ids[i] for i in test_idx_c]

    # Train Compliance Classifier
    comp_clf = RandomForestClassifier(
        n_estimators=200,
        random_state=seed,
        class_weight="balanced",
    )
    comp_clf.fit(X_comp_train, y_comp_train_class)

    # Train Compliance Regressor (Optional score predictor)
    comp_reg = RandomForestRegressor(
        n_estimators=100,
        random_state=seed,
    )
    comp_reg.fit(X_comp_train, y_comp_train_score)

    # Held-out predictions
    comp_test_preds = comp_clf.predict(X_comp_test)
    comp_test_probs = comp_clf.predict_proba(X_comp_test)
    comp_test_reg_preds = comp_reg.predict(X_comp_test)

    comp_classes = list(comp_clf.classes_)
    comp_clf_metrics = _compute_classification_metrics(y_comp_test_class, comp_test_preds, comp_classes)
    comp_reg_metrics = _compute_regression_metrics(y_comp_test_score, comp_test_reg_preds)
    comp_top_feats = _get_top_features(comp_clf, comp_feat_names, top_k=10)

    # Build per-sample held-out comparison for compliance
    comp_sample_evals: List[Dict[str, Any]] = []
    for i in range(len(test_idx_c)):
        cid = test_comp_ids[i]
        gt_cls = str(y_comp_test_class[i])
        pred_cls = str(comp_test_preds[i])
        gt_sc = float(y_comp_test_score[i])
        pred_sc = float(comp_test_reg_preds[i])
        probs = {comp_classes[j]: float(comp_test_probs[i][j]) for j in range(len(comp_classes))}
        comp_sample_evals.append({
            "case_id": cid,
            "ground_truth_class": gt_cls,
            "predicted_class": pred_cls,
            "correct": bool(gt_cls == pred_cls),
            "ground_truth_score": gt_sc,
            "predicted_score": pred_sc,
            "score_error": round(abs(gt_sc - pred_sc), 2),
            "class_probabilities": probs,
        })

    # ────────────────────────────────────────────────────────────
    # 3. INTEGRITY MODEL TRAINING & EVALUATION
    # ────────────────────────────────────────────────────────────
    X_integ, y_integ_class, y_integ_score, integ_feat_names, integ_ids = build_integrity_dataset(cases)
    assert_no_target_leakage(integ_feat_names)

    # 80/20 Stratified Split
    indices_integ = np.arange(len(cases))
    train_idx_i, test_idx_i = train_test_split(
        indices_integ,
        test_size=0.20,
        random_state=seed,
        stratify=y_integ_class,
    )

    # Assert zero overlap
    assert len(set(train_idx_i).intersection(set(test_idx_i))) == 0, "Train/Test overlap in Integrity!"

    X_integ_train, X_integ_test = X_integ[train_idx_i], X_integ[test_idx_i]
    y_integ_train_class, y_integ_test_class = y_integ_class[train_idx_i], y_integ_class[test_idx_i]
    y_integ_train_score, y_integ_test_score = y_integ_score[train_idx_i], y_integ_score[test_idx_i]
    test_integ_ids = [integ_ids[i] for i in test_idx_i]

    # Train Integrity Classifier
    integ_clf = RandomForestClassifier(
        n_estimators=200,
        random_state=seed,
        class_weight="balanced",
    )
    integ_clf.fit(X_integ_train, y_integ_train_class)

    # Train Integrity Regressor
    integ_reg = RandomForestRegressor(
        n_estimators=100,
        random_state=seed,
    )
    integ_reg.fit(X_integ_train, y_integ_train_score)

    # Held-out predictions
    integ_test_preds = integ_clf.predict(X_integ_test)
    integ_test_probs = integ_clf.predict_proba(X_integ_test)
    integ_test_reg_preds = integ_reg.predict(X_integ_test)

    integ_classes = list(integ_clf.classes_)
    integ_clf_metrics = _compute_classification_metrics(y_integ_test_class, integ_test_preds, integ_classes)
    integ_reg_metrics = _compute_regression_metrics(y_integ_test_score, integ_test_reg_preds)
    integ_top_feats = _get_top_features(integ_clf, integ_feat_names, top_k=10)

    # Build per-sample held-out comparison for integrity
    integ_sample_evals: List[Dict[str, Any]] = []
    for i in range(len(test_idx_i)):
        cid = test_integ_ids[i]
        gt_cls = str(y_integ_test_class[i])
        pred_cls = str(integ_test_preds[i])
        gt_sc = float(y_integ_test_score[i])
        pred_sc = float(integ_test_reg_preds[i])
        probs = {integ_classes[j]: float(integ_test_probs[i][j]) for j in range(len(integ_classes))}
        integ_sample_evals.append({
            "case_id": cid,
            "ground_truth_class": gt_cls,
            "predicted_class": pred_cls,
            "correct": bool(gt_cls == pred_cls),
            "ground_truth_score": gt_sc,
            "predicted_score": pred_sc,
            "score_error": round(abs(gt_sc - pred_sc), 2),
            "class_probabilities": probs,
        })

    # ────────────────────────────────────────────────────────────
    # 4. PERSISTENCE OF JOBLIB MODEL BUNDLES
    # ────────────────────────────────────────────────────────────
    trained_timestamp = datetime.now(timezone.utc).isoformat()

    comp_bundle = {
        "model_name": "procurement_compliance_rf",
        "version": MODEL_VERSION,
        "model": comp_clf,
        "regressor": comp_reg,
        "feature_names": comp_feat_names,
        "classes": comp_classes,
        "training_seed": seed,
        "dataset_version": DATASET_VERSION,
        "train_samples": len(train_idx_c),
        "test_samples": len(test_idx_c),
        "metrics": comp_clf_metrics,
        "trained_at": trained_timestamp,
    }

    integ_bundle = {
        "model_name": "procurement_integrity_rf",
        "version": MODEL_VERSION,
        "model": integ_clf,
        "regressor": integ_reg,
        "feature_names": integ_feat_names,
        "classes": integ_classes,
        "training_seed": seed,
        "dataset_version": DATASET_VERSION,
        "train_samples": len(train_idx_i),
        "test_samples": len(test_idx_i),
        "metrics": integ_clf_metrics,
        "trained_at": trained_timestamp,
    }

    joblib.dump(comp_bundle, output_dir / "procurement_compliance_rf.joblib")
    joblib.dump(integ_bundle, output_dir / "procurement_integrity_rf.joblib")

    # ────────────────────────────────────────────────────────────
    # 5. ASSEMBLE HONEST BENCHMARK JSON
    # ────────────────────────────────────────────────────────────
    benchmark_data = {
        "benchmark_metadata": {
            "dataset_type": "SYNTHETIC",
            "evaluation_type": "HELD_OUT_TEST_SET",
            "ground_truth": "FAIR_BID_RULE_BASED_BENCHMARK",
            "feature_leakage_check": "PASSED",
            "metric_description": "Held-out synthetic procurement benchmark accuracy",
            "honesty_notice": "The ML model predicts the benchmark risk class; it does not prove corruption.",
            "total_dataset_samples": len(cases),
            "train_samples": len(train_idx_c),
            "test_samples": len(test_idx_c),
            "train_test_split_ratio": "80/20",
            "random_seed": seed,
            "trained_at": trained_timestamp,
            "dataset_version": DATASET_VERSION,
        },
        "compliance": {
            "model_name": "procurement_compliance_rf",
            "version": MODEL_VERSION,
            "train_samples": len(train_idx_c),
            "test_samples": len(test_idx_c),
            "feature_count": len(comp_feat_names),
            "feature_names": comp_feat_names,
            "classes": comp_classes,
            "accuracy": comp_clf_metrics["accuracy"],
            "precision": comp_clf_metrics["precision_macro"],
            "recall": comp_clf_metrics["recall_macro"],
            "f1_macro": comp_clf_metrics["f1_macro"],
            "confusion_matrix": comp_clf_metrics["confusion_matrix"],
            "regression_metrics": comp_reg_metrics,
            "top_features": comp_top_feats,
            "sample_held_out_predictions": comp_sample_evals[:15],
        },
        "integrity": {
            "model_name": "procurement_integrity_rf",
            "version": MODEL_VERSION,
            "train_samples": len(train_idx_i),
            "test_samples": len(test_idx_i),
            "feature_count": len(integ_feat_names),
            "feature_names": integ_feat_names,
            "classes": integ_classes,
            "accuracy": integ_clf_metrics["accuracy"],
            "precision": integ_clf_metrics["precision_macro"],
            "recall": integ_clf_metrics["recall_macro"],
            "f1_macro": integ_clf_metrics["f1_macro"],
            "confusion_matrix": integ_clf_metrics["confusion_matrix"],
            "regression_metrics": integ_reg_metrics,
            "top_features": integ_top_feats,
            "sample_held_out_predictions": integ_sample_evals[:15],
        },
    }

    with open(output_dir / "procurement_ml_benchmark.json", "w", encoding="utf-8") as f:
        json.dump(benchmark_data, f, indent=2)

    return benchmark_data


if __name__ == "__main__":
    print("Training decoupled Procurement Compliance & Integrity ML models...")
    result = train_and_evaluate_all()
    print("Training complete!")
    print(f"Compliance Held-out Accuracy: {result['compliance']['accuracy']:.4f}, F1: {result['compliance']['f1_macro']:.4f}")
    print(f"Integrity Held-out Accuracy:  {result['integrity']['accuracy']:.4f}, F1: {result['integrity']['f1_macro']:.4f}")
