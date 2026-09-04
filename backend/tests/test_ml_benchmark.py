"""
Tests for Procurement ML Benchmark — Decoupled Compliance & Integrity Models
=============================================================================
SIH26100 — Ministry of Finance / GeM — Task 2 Validation Suite

Verifies:
1. Dataset generation is deterministic.
2. Train/test split is deterministic.
3. Train and test IDs do not overlap.
4. Target columns are excluded from features (anti-leakage).
5. Compliance model trains successfully.
6. Integrity model trains successfully.
7. Predictions contain valid classes.
8. Accuracy is computed strictly on held-out data.
9. Metrics are reproducible across runs.
10. Model persistence and joblib load works.
11. Feature importance exists and is sorted descending.
12. Benchmark JSON artifact is valid and contains honesty metadata.
13. API endpoint GET /api/v1/procurement/ml/benchmark returns results.
14. Per-sample held-out comparison structure is valid.
"""
import json
from pathlib import Path
import pytest
import numpy as np
import joblib
from sklearn.model_selection import train_test_split

from app.services.ground_truth.dataset_generator import (
    generate_benchmark_dataset,
    TARGET_DATASET_SIZE,
    BENCHMARK_RANDOM_SEED,
)
from app.services.ground_truth.features import (
    COMPLIANCE_FEATURE_NAMES,
    INTEGRITY_FEATURE_NAMES,
    assert_no_leakage,
    build_compliance_dataset,
    build_integrity_dataset,
)
from app.services.ground_truth.trainer import (
    MODELS_DIR,
    COMPLIANCE_MODEL_PATH,
    INTEGRITY_MODEL_PATH,
    BENCHMARK_JSON_PATH,
    train_and_evaluate_all,
)


# =====================================================================
# 1. DATASET DETERMINISM
# =====================================================================

def test_dataset_generation_is_deterministic():
    """Generating the benchmark dataset with fixed seed 42 must yield identical results."""
    data1 = generate_benchmark_dataset(100, seed=42)
    data2 = generate_benchmark_dataset(100, seed=42)

    assert len(data1) == 100
    assert len(data2) == 100

    for c1, c2 in zip(data1, data2):
        assert c1["case_id"] == c2["case_id"]
        assert c1["ground_truth"]["compliance_score"] == c2["ground_truth"]["compliance_score"]
        assert c1["ground_truth"]["compliance_class"] == c2["ground_truth"]["compliance_class"]
        assert c1["ground_truth"]["integrity_score"] == c2["ground_truth"]["integrity_score"]
        assert c1["ground_truth"]["integrity_class"] == c2["ground_truth"]["integrity_class"]


# =====================================================================
# 2. SPLIT DETERMINISM
# =====================================================================

def test_train_test_split_is_deterministic():
    """Splits with random_state=42 must produce identical indices across invocations."""
    cases = generate_benchmark_dataset(100, seed=42)
    X, y, _, _, ids = build_compliance_dataset(cases)

    train_ids_1, test_ids_1 = train_test_split(ids, test_size=0.20, random_state=42, stratify=y)
    train_ids_2, test_ids_2 = train_test_split(ids, test_size=0.20, random_state=42, stratify=y)

    assert train_ids_1 == train_ids_2
    assert test_ids_1 == test_ids_2


# =====================================================================
# 3. NO TRAIN / TEST OVERLAP
# =====================================================================

def test_train_and_test_ids_do_not_overlap():
    """Train and test sets must have zero intersecting case IDs."""
    cases = generate_benchmark_dataset(200, seed=42)

    # Compliance
    _, y_comp, _, _, ids_comp = build_compliance_dataset(cases)
    train_c, test_c = train_test_split(ids_comp, test_size=0.20, random_state=42, stratify=y_comp)
    assert len(set(train_c).intersection(set(test_c))) == 0
    assert len(train_c) == 160
    assert len(test_c) == 40

    # Integrity
    _, y_integ, _, _, ids_integ = build_integrity_dataset(cases)
    train_i, test_i = train_test_split(ids_integ, test_size=0.20, random_state=42, stratify=y_integ)
    assert len(set(train_i).intersection(set(test_i))) == 0
    assert len(train_i) == 160
    assert len(test_i) == 40


# =====================================================================
# 4. ANTI-LEAKAGE VERIFICATION
# =====================================================================

def test_target_columns_are_excluded_from_features():
    """Verify that features contain no target labels, scores, or identifiers."""
    # Compliance features check
    assert_no_leakage(COMPLIANCE_FEATURE_NAMES)
    forbidden = [
        "compliance_score", "compliance_class", "ground_truth",
        "case_id", "tender_id", "archetype_id", "scenario_type"
    ]
    for col in forbidden:
        assert col not in COMPLIANCE_FEATURE_NAMES

    # Integrity features check
    assert_no_leakage(INTEGRITY_FEATURE_NAMES)
    for col in forbidden:
        assert col not in INTEGRITY_FEATURE_NAMES

    # Leakage validator must raise ValueError if forbidden column injected
    with pytest.raises(ValueError, match="CRITICAL LEAKAGE ERROR"):
        assert_no_leakage(["gst_status_score", "compliance_ground_truth_class"])

    with pytest.raises(ValueError, match="CRITICAL LEAKAGE ERROR"):
        assert_no_leakage(["bid_price_spread_pct", "archetype_id"])


# =====================================================================
# 5 & 6. MODEL TRAINING SUCCESS
# =====================================================================

def test_compliance_and_integrity_models_train_successfully(tmp_path: Path):
    """Both models must fit and expose classes, estimators, and predictions."""
    res = train_and_evaluate_all(dataset_size=120, seed=42, output_dir=tmp_path)

    assert "compliance" in res
    assert "integrity" in res

    comp = res["compliance"]
    integ = res["integrity"]

    assert comp["model_name"] == "procurement_compliance_rf"
    assert integ["model_name"] == "procurement_integrity_rf"
    assert comp["train_samples"] == 96
    assert comp["test_samples"] == 24
    assert integ["train_samples"] == 96
    assert integ["test_samples"] == 24


# =====================================================================
# 7. VALID CLASS PREDICTIONS
# =====================================================================

def test_predictions_contain_valid_classes():
    """Predictions on held-out data must only belong to valid risk classes."""
    valid_classes = {"LOW", "MEDIUM", "HIGH", "CRITICAL"}
    bundle_c = joblib.load(COMPLIANCE_MODEL_PATH)
    bundle_i = joblib.load(INTEGRITY_MODEL_PATH)

    assert set(bundle_c["classes"]) == valid_classes
    assert set(bundle_i["classes"]) == valid_classes

    # Predict on dummy zero-vector
    dummy_c = np.zeros((1, len(bundle_c["feature_names"])))
    pred_c = bundle_c["model"].predict(dummy_c)
    assert pred_c[0] in valid_classes

    dummy_i = np.zeros((1, len(bundle_i["feature_names"])))
    pred_i = bundle_i["model"].predict(dummy_i)
    assert pred_i[0] in valid_classes


# =====================================================================
# 8. HELD-OUT EVALUATION ACCURACY
# =====================================================================

def test_accuracy_is_computed_on_held_out_data():
    """Benchmark metrics must reflect strictly held-out test data samples."""
    with open(BENCHMARK_JSON_PATH, "r", encoding="utf-8") as f:
        bench = json.load(f)

    meta = bench["benchmark_metadata"]
    assert meta["evaluation_type"] == "HELD_OUT_TEST_SET"
    assert meta["test_samples"] == 120
    assert meta["train_samples"] == 480

    comp = bench["compliance"]
    assert 0.0 <= comp["accuracy"] <= 1.0
    assert 0.0 <= comp["f1_macro"] <= 1.0
    assert comp["test_samples"] == 120

    integ = bench["integrity"]
    assert 0.0 <= integ["accuracy"] <= 1.0
    assert 0.0 <= integ["f1_macro"] <= 1.0
    assert integ["test_samples"] == 120


# =====================================================================
# 9. METRIC REPRODUCIBILITY
# =====================================================================

def test_metrics_are_reproducible(tmp_path: Path):
    """Two complete training passes with seed 42 must generate identical held-out metrics."""
    res1 = train_and_evaluate_all(dataset_size=120, seed=42, output_dir=tmp_path / "run1")
    res2 = train_and_evaluate_all(dataset_size=120, seed=42, output_dir=tmp_path / "run2")

    assert res1["compliance"]["accuracy"] == res2["compliance"]["accuracy"]
    assert res1["compliance"]["f1_macro"] == res2["compliance"]["f1_macro"]
    assert res1["integrity"]["accuracy"] == res2["integrity"]["accuracy"]
    assert res1["integrity"]["f1_macro"] == res2["integrity"]["f1_macro"]


# =====================================================================
# 10. MODEL PERSISTENCE & LOAD
# =====================================================================

def test_model_persistence_and_load():
    """Persisted joblib files must load and support predict and predict_proba."""
    assert COMPLIANCE_MODEL_PATH.exists()
    assert INTEGRITY_MODEL_PATH.exists()

    comp_bundle = joblib.load(COMPLIANCE_MODEL_PATH)
    assert "model" in comp_bundle
    assert "feature_names" in comp_bundle
    assert "classes" in comp_bundle
    assert hasattr(comp_bundle["model"], "predict")
    assert hasattr(comp_bundle["model"], "predict_proba")

    integ_bundle = joblib.load(INTEGRITY_MODEL_PATH)
    assert "model" in integ_bundle
    assert "feature_names" in integ_bundle
    assert "classes" in integ_bundle
    assert hasattr(integ_bundle["model"], "predict")
    assert hasattr(integ_bundle["model"], "predict_proba")


# =====================================================================
# 11. FEATURE IMPORTANCE VALIDATION
# =====================================================================

def test_feature_importance_exists_and_sorted():
    """Models must expose top-10 feature importances sorted descending."""
    with open(BENCHMARK_JSON_PATH, "r", encoding="utf-8") as f:
        bench = json.load(f)

    for domain in ("compliance", "integrity"):
        top_feats = bench[domain]["top_features"]
        assert len(top_feats) == 10
        importances = [tf["importance"] for tf in top_feats]
        # Assert strictly non-increasing order
        assert importances == sorted(importances, reverse=True)
        assert sum(importances) > 0.0


# =====================================================================
# 12. BENCHMARK JSON HONESTY METADATA
# =====================================================================

def test_benchmark_json_honesty_metadata():
    """Benchmark JSON must carry mandatory honesty declarations."""
    with open(BENCHMARK_JSON_PATH, "r", encoding="utf-8") as f:
        bench = json.load(f)

    meta = bench["benchmark_metadata"]
    assert meta["dataset_type"] == "SYNTHETIC"
    assert meta["evaluation_type"] == "HELD_OUT_TEST_SET"
    assert meta["ground_truth"] == "FAIR_BID_RULE_BASED_BENCHMARK"
    assert "Held-out synthetic procurement benchmark" in meta["metric_description"]
    assert "does not prove corruption" in meta["honesty_notice"]


# =====================================================================
# 13. API ENDPOINT VERIFICATION
# =====================================================================

def test_api_procurement_ml_benchmark():
    """GET /api/v1/procurement/ml/benchmark must return 200 with benchmark structure."""
    from fastapi.testclient import TestClient
    from app.main import app

    client = TestClient(app)
    resp = client.get("/api/v1/procurement/ml/benchmark")
    assert resp.status_code == 200

    data = resp.json()
    assert "benchmark_metadata" in data
    assert data["benchmark_metadata"]["dataset_type"] == "SYNTHETIC"
    assert "compliance" in data
    assert "integrity" in data
    assert "accuracy" in data["compliance"]
    assert "accuracy" in data["integrity"]


# =====================================================================
# 14. SAMPLE HELD-OUT EVALUATIONS
# =====================================================================

def test_sample_held_out_evaluations_structure():
    """Per-sample predictions must contain all required comparison fields."""
    with open(BENCHMARK_JSON_PATH, "r", encoding="utf-8") as f:
        bench = json.load(f)

    for domain in ("compliance", "integrity"):
        samples = bench[domain]["sample_held_out_predictions"]
        assert len(samples) >= 10
        for s in samples:
            assert "case_id" in s
            assert "ground_truth_class" in s
            assert "predicted_class" in s
            assert "correct" in s
            assert "ground_truth_score" in s
            assert "predicted_score" in s
            assert "score_error" in s
            assert "class_probabilities" in s
            assert isinstance(s["class_probabilities"], dict)
