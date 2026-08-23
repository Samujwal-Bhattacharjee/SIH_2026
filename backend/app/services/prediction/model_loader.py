"""
Model Loader — Singleton model loading for inference.
======================================================
SIH26017 — Ministry of Rural Development

The trained model is loaded ONCE at startup and reused for all predictions.
This avoids re-loading the model on every API request.
"""
import os
import json
import logging
from typing import Optional, Any, Dict

logger = logging.getLogger(__name__)

_MODEL_DIR = os.path.dirname(__file__)
_MODEL_PATH = os.path.join(_MODEL_DIR, "model.joblib")
_METRICS_PATH = os.path.join(_MODEL_DIR, "metrics.json")
_FEATURE_IMPORTANCE_PATH = os.path.join(_MODEL_DIR, "feature_importance.json")

# Singleton instances
_model: Optional[Any] = None
_metrics: Optional[Dict] = None
_feature_importance: Optional[Dict] = None
MODEL_VERSION = "land-delay-rf-v1"


def load_model() -> Optional[Any]:
    """
    Load the trained RandomForest model from disk.
    Returns None if the model file doesn't exist yet (needs training).
    """
    global _model
    if _model is not None:
        return _model

    if not os.path.exists(_MODEL_PATH):
        logger.warning(
            f"Model file not found at {_MODEL_PATH}. "
            "Run: python -m app.services.prediction.train"
        )
        return None

    try:
        import joblib
        _model = joblib.load(_MODEL_PATH)
        logger.info(f"ML model loaded successfully from {_MODEL_PATH}")
        return _model
    except Exception as e:
        logger.error(f"Failed to load ML model: {e}")
        return None


def get_metrics() -> Dict:
    """Return the training metrics dict, or an empty dict if not available."""
    global _metrics
    if _metrics is not None:
        return _metrics

    if os.path.exists(_METRICS_PATH):
        try:
            with open(_METRICS_PATH) as f:
                _metrics = json.load(f)
            return _metrics
        except Exception:
            pass

    return {}


def get_feature_importance() -> Dict:
    """Return feature importance dict, or empty dict if not available."""
    global _feature_importance
    if _feature_importance is not None:
        return _feature_importance

    if os.path.exists(_FEATURE_IMPORTANCE_PATH):
        try:
            with open(_FEATURE_IMPORTANCE_PATH) as f:
                _feature_importance = json.load(f)
            return _feature_importance
        except Exception:
            pass

    return {}


def is_model_ready() -> bool:
    """Return True if the model has been trained and is ready for inference."""
    return os.path.exists(_MODEL_PATH)


def reset_cache():
    """Clear the singleton cache. Mainly for testing."""
    global _model, _metrics, _feature_importance
    _model = None
    _metrics = None
    _feature_importance = None
