"""
ML Model Training Script — Land Acquisition Delay Prediction
=============================================================
SIH26017 — Ministry of Rural Development

Trains a RandomForestClassifier on the synthetic historical dataset.
Produces:
  - model.joblib          (trained classification model)
  - metrics.json          (evaluation metrics, NOT hardcoded)
  - feature_importance.json (per-feature importance scores)

Run:
    cd backend
    python -m app.services.prediction.train

Requirements:
    pip install scikit-learn joblib

DO NOT call this script from API request handlers.
The API should load the pre-trained model via model_loader.py.
"""
import os
import sys
import json
import logging

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

# Add backend root to Python path when running as script
_backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

MODEL_DIR = os.path.dirname(__file__)
DATA_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(MODEL_DIR))),
    "data", "historical_projects.csv"
)
MODEL_PATH = os.path.join(MODEL_DIR, "model.joblib")
METRICS_PATH = os.path.join(MODEL_DIR, "metrics.json")
FEATURE_IMPORTANCE_PATH = os.path.join(MODEL_DIR, "feature_importance.json")

MODEL_VERSION = "land-delay-rf-v1"
RANDOM_STATE = 42


def train():
    """
    Full training pipeline:
    1. Load dataset (generate if missing)
    2. Validate columns
    3. Train/test split
    4. Train RandomForestClassifier
    5. Evaluate (accuracy, precision, recall, F1, ROC-AUC)
    6. Save model artifact
    7. Save metrics JSON
    8. Print feature importance
    """
    try:
        import pandas as pd
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.model_selection import train_test_split
        from sklearn.metrics import (
            accuracy_score, precision_score, recall_score,
            f1_score, roc_auc_score
        )
        import joblib
    except ImportError as e:
        logger.error(f"Missing dependency: {e}")
        logger.error("Install with: pip install scikit-learn joblib pandas")
        sys.exit(1)

    from app.services.prediction.features import FEATURE_NAMES, TARGET_COLUMN

    # ============================================================
    # Step 1: Load or generate dataset
    # ============================================================
    if not os.path.exists(DATA_PATH):
        logger.info(f"Dataset not found at {DATA_PATH}")
        logger.info("Generating synthetic dataset...")
        # Run generator
        data_dir = os.path.dirname(DATA_PATH)
        generator_path = os.path.join(data_dir, "generate_land_projects.py")
        import subprocess
        result = subprocess.run(
            [sys.executable, generator_path],
            capture_output=True, text=True
        )
        if result.returncode != 0:
            logger.error(f"Dataset generation failed:\n{result.stderr}")
            sys.exit(1)
        logger.info(result.stdout)

    logger.info(f"Loading dataset from: {DATA_PATH}")
    df = pd.read_csv(DATA_PATH)
    logger.info(f"Dataset shape: {df.shape}")

    # ============================================================
    # Step 2: Validate columns — CRITICAL anti-leakage check
    # ============================================================
    missing = [f for f in FEATURE_NAMES + [TARGET_COLUMN] if f not in df.columns]
    if missing:
        logger.error(f"Missing columns in dataset: {missing}")
        sys.exit(1)

    # Confirm no target-leaking columns in features
    forbidden = {"target_delayed", "target_delay_days"}
    leaking = [f for f in FEATURE_NAMES if f in forbidden]
    if leaking:
        logger.error(f"DATA LEAKAGE DETECTED! Feature list contains target columns: {leaking}")
        sys.exit(1)

    logger.info("✓ Anti-leakage check passed: no target columns in feature list")

    # ============================================================
    # Step 3: Prepare X and y
    # ============================================================
    X = df[FEATURE_NAMES].copy()
    y = df[TARGET_COLUMN].copy()

    # Handle any missing values with safe defaults
    X = X.fillna(0)

    logger.info(f"Class distribution: delayed={y.sum()} ({100*y.mean():.1f}%), "
                f"on-track={len(y)-y.sum()} ({100*(1-y.mean()):.1f}%)")

    # ============================================================
    # Step 4: Train/test split (80/20, stratified, reproducible)
    # ============================================================
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.20,
        stratify=y,
        random_state=RANDOM_STATE,
    )
    logger.info(f"Train: {len(X_train)}, Test: {len(X_test)}")

    # ============================================================
    # Step 5: Train model
    # ============================================================
    logger.info("Training RandomForestClassifier...")
    clf = RandomForestClassifier(
        n_estimators=200,
        max_depth=12,
        min_samples_split=5,
        min_samples_leaf=2,
        class_weight="balanced",    # Handle class imbalance
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )
    clf.fit(X_train, y_train)
    logger.info("Training complete.")

    # ============================================================
    # Step 6: Evaluate — DO NOT hardcode these values
    # ============================================================
    y_pred = clf.predict(X_test)
    y_proba = clf.predict_proba(X_test)[:, 1]

    accuracy  = float(accuracy_score(y_test, y_pred))
    precision = float(precision_score(y_test, y_pred, zero_division=0))
    recall    = float(recall_score(y_test, y_pred, zero_division=0))
    f1        = float(f1_score(y_test, y_pred, zero_division=0))
    roc_auc   = float(roc_auc_score(y_test, y_proba))

    metrics = {
        "model_version":    MODEL_VERSION,
        "accuracy":         round(accuracy, 4),
        "precision":        round(precision, 4),
        "recall":           round(recall, 4),
        "f1":               round(f1, 4),
        "roc_auc":          round(roc_auc, 4),
        "train_samples":    len(X_train),
        "test_samples":     len(X_test),
        "n_features":       len(FEATURE_NAMES),
        "n_estimators":     clf.n_estimators,
        "random_state":     RANDOM_STATE,
        "trained_at":       __import__("datetime").datetime.utcnow().isoformat(),
        "dataset_size":     len(df),
        "delayed_pct":      round(100 * float(y.mean()), 1),
        "disclaimer":       "Trained on synthetic prototype data. Not validated on real government project data.",
    }

    logger.info("=" * 50)
    logger.info("MODEL EVALUATION RESULTS:")
    logger.info(f"  Accuracy:  {metrics['accuracy']:.4f}")
    logger.info(f"  Precision: {metrics['precision']:.4f}")
    logger.info(f"  Recall:    {metrics['recall']:.4f}")
    logger.info(f"  F1:        {metrics['f1']:.4f}")
    logger.info(f"  ROC-AUC:   {metrics['roc_auc']:.4f}")
    logger.info("=" * 50)

    # ============================================================
    # Step 7: Save model
    # ============================================================
    import joblib
    joblib.dump(clf, MODEL_PATH)
    logger.info(f"Model saved to: {MODEL_PATH}")

    # ============================================================
    # Step 8: Save metrics
    # ============================================================
    with open(METRICS_PATH, "w") as f:
        json.dump(metrics, f, indent=2)
    logger.info(f"Metrics saved to: {METRICS_PATH}")

    # ============================================================
    # Step 9: Feature importance
    # ============================================================
    importances = {
        feature: round(float(imp), 6)
        for feature, imp in zip(FEATURE_NAMES, clf.feature_importances_)
    }
    sorted_importances = dict(
        sorted(importances.items(), key=lambda x: x[1], reverse=True)
    )

    with open(FEATURE_IMPORTANCE_PATH, "w") as f:
        json.dump(sorted_importances, f, indent=2)
    logger.info(f"Feature importance saved to: {FEATURE_IMPORTANCE_PATH}")

    logger.info("\nFEATURE IMPORTANCE (top features the model found informative):")
    logger.info("NOTE: Importance ≠ causality. These are model-internal metrics.")
    for feat, imp in sorted_importances.items():
        bar = "█" * int(imp * 50)
        logger.info(f"  {feat:<35} {imp:.4f}  {bar}")

    logger.info("\nTraining complete. Run the FastAPI server to use predictions.")
    return clf, metrics


if __name__ == "__main__":
    train()
