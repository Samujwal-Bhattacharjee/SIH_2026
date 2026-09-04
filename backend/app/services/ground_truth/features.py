"""
Feature Extraction and Anti-Leakage Validation for Procurement ML Benchmark
=============================================================================
SIH26100 — Ministry of Finance / GeM — Decoupled AI Architecture

Extracts strictly observable procurement compliance and integrity features
from structured procurement cases, with automated anti-leakage verification.

CRITICAL ANTI-LEAKAGE INVARIANTS:
1. Target variables (ground_truth_score, ground_truth_class, raw_score) are NEVER features.
2. Case identifiers (case_id, tender_id, filenames, PDF titles) are excluded.
3. Scenario type / archetype IDs are excluded.
4. Input features represent solely pre-evaluation observable evidence.
"""
from __future__ import annotations

import re
from typing import Any, Dict, List, Optional, Set, Tuple
import numpy as np

# =====================================================================
# 1. FEATURE DEFINITIONS
# =====================================================================

COMPLIANCE_FEATURE_NAMES: List[str] = [
    "gst_status_score",
    "pan_status_score",
    "oem_status_score",
    "turnover_status_score",
    "blacklisting_status_score",
    "udyam_status_score",
    "local_content_status_score",
    "completeness_status_score",
    "mandatory_passed_count",
    "mandatory_failed_count",
    "mandatory_review_count",
    "non_mandatory_passed_count",
    "non_mandatory_failed_count",
    "evidence_present_count",
    "discrepancy_count_total",
    "discrepancy_count_critical",
    "discrepancy_count_high",
    "mean_check_confidence",
    "has_mandatory_fail",
]

INTEGRITY_FEATURE_NAMES: List[str] = [
    "bidder_count",
    "valid_quotes_count",
    "bid_price_spread_pct",
    "bid_to_estimate_min_ratio",
    "bid_to_estimate_mean_ratio",
    "near_estimate_count",
    "has_price_anomaly_finding",
    "has_rotation_finding",
    "has_related_bidder_finding",
    "has_common_director_finding",
    "has_traceability_gap_finding",
    "has_repeated_winner_finding",
    "has_losing_bid_finding",
    "has_identity_doc_finding",
    "has_narrow_competition_finding",
    "findings_count_total",
    "findings_count_critical",
    "findings_count_high",
    "findings_count_medium",
    "unique_signal_types_count",
    "related_bidders_involved_count",
]

# Explicit blacklist of forbidden leakage column names
FORBIDDEN_LEAKAGE_TERMS: Set[str] = {
    "compliance_ground_truth_class",
    "compliance_ground_truth_score",
    "compliance_class",
    "compliance_score",
    "compliance_raw_score",
    "integrity_ground_truth_class",
    "integrity_ground_truth_score",
    "integrity_class",
    "integrity_score",
    "integrity_raw_score",
    "ground_truth",
    "case_id",
    "tender_id",
    "archetype_id",
    "scenario_type",
    "label",
    "target",
}


def assert_no_leakage(feature_names: List[str]) -> None:
    """
    Asserts that no target column or identifier is present in feature names.
    Raises ValueError if any prohibited term is detected.
    """
    for name in feature_names:
        clean = name.strip().lower()
        if clean in FORBIDDEN_LEAKAGE_TERMS:
            raise ValueError(f"CRITICAL LEAKAGE ERROR: Prohibited target/identifier '{name}' in features!")
        for term in ("ground_truth", "class", "target", "archetype", "label"):
            if term in clean and "class" in clean and not ("status" in clean or "unique" in clean):
                raise ValueError(f"CRITICAL LEAKAGE ERROR: Suspicious term '{term}' in feature '{name}'!")


# =====================================================================
# 2. COMPLIANCE FEATURE EXTRACTOR
# =====================================================================

_STATUS_SCORE_MAP = {
    "COMPLIANT": 100.0,
    "NOT_APPLICABLE": 100.0,
    "NEEDS_REVIEW": 60.0,
    "PENDING": 20.0,
    "UNVERIFIED": 0.0,
    "NON_COMPLIANT": 0.0,
    "EXPIRED": 10.0,
}

_FAIL_STATUSES = {"NON_COMPLIANT", "EXPIRED", "UNVERIFIED"}


def extract_compliance_features(case_dict: Dict[str, Any]) -> Dict[str, float]:
    """
    Extract observable compliance features from a structured procurement case.
    Does not access any ground-truth fields.
    """
    checks = case_dict.get("compliance_check_results") or []
    discrepancies = case_dict.get("compliance_discrepancies") or []

    # Map by requirement ID
    check_by_req: Dict[str, Dict[str, Any]] = {}
    for c in checks:
        req_id = c.get("requirement_id", "")
        check_by_req[req_id] = c

    def _get_status_score(req_id: str, default: float = 20.0) -> float:
        if req_id in check_by_req:
            st = check_by_req[req_id].get("status", "PENDING")
            return _STATUS_SCORE_MAP.get(st, default)
        return default

    # Individual check scores
    gst_score = _get_status_score("GST_REQUIRED")
    pan_score = _get_status_score("PAN_REQUIRED")
    oem_score = _get_status_score("OEM_AUTHORIZATION")
    turnover_score = _get_status_score("TURNOVER_THRESHOLD")
    bl_score = _get_status_score("NON_BLACKLISTING")
    udyam_score = _get_status_score("UDYAM_REQUIRED")
    lc_score = _get_status_score("LOCAL_CONTENT")
    complete_score = _get_status_score("APPLICATION_COMPLETENESS_EVALUATION")

    # Aggregations across checks
    mandatory_passed = 0
    mandatory_failed = 0
    mandatory_review = 0
    non_mandatory_passed = 0
    non_mandatory_failed = 0
    evidence_count = 0
    confidences: List[float] = []

    for c in checks:
        is_mand = c.get("is_mandatory", False)
        status = c.get("status", "PENDING")
        conf = float(c.get("confidence", 0.0))
        confidences.append(conf)

        if c.get("evidence_available") or c.get("evidence_value") is not None:
            evidence_count += 1

        if is_mand:
            if status in ("COMPLIANT", "NOT_APPLICABLE"):
                mandatory_passed += 1
            elif status in _FAIL_STATUSES:
                mandatory_failed += 1
            elif status == "NEEDS_REVIEW":
                mandatory_review += 1
        else:
            if status in ("COMPLIANT", "NOT_APPLICABLE"):
                non_mandatory_passed += 1
            elif status in _FAIL_STATUSES:
                non_mandatory_failed += 1

    # Discrepancy counts
    crit_disc = sum(1 for d in discrepancies if str(d.get("severity", "")).upper() == "CRITICAL")
    high_disc = sum(1 for d in discrepancies if str(d.get("severity", "")).upper() == "HIGH")

    return {
        "gst_status_score": gst_score,
        "pan_status_score": pan_score,
        "oem_status_score": oem_score,
        "turnover_status_score": turnover_score,
        "blacklisting_status_score": bl_score,
        "udyam_status_score": udyam_score,
        "local_content_status_score": lc_score,
        "completeness_status_score": complete_score,
        "mandatory_passed_count": float(mandatory_passed),
        "mandatory_failed_count": float(mandatory_failed),
        "mandatory_review_count": float(mandatory_review),
        "non_mandatory_passed_count": float(non_mandatory_passed),
        "non_mandatory_failed_count": float(non_mandatory_failed),
        "evidence_present_count": float(evidence_count),
        "discrepancy_count_total": float(len(discrepancies)),
        "discrepancy_count_critical": float(crit_disc),
        "discrepancy_count_high": float(high_disc),
        "mean_check_confidence": float(np.mean(confidences)) if confidences else 0.0,
        "has_mandatory_fail": 1.0 if mandatory_failed > 0 else 0.0,
    }


# =====================================================================
# 3. INTEGRITY FEATURE EXTRACTOR
# =====================================================================

def extract_integrity_features(case_dict: Dict[str, Any]) -> Dict[str, float]:
    """
    Extract observable procurement integrity features from a structured procurement case.
    Does not access any ground-truth fields.
    """
    cohort = case_dict.get("cohort_metrics") or {}
    findings = case_dict.get("integrity_findings") or []

    # Telemetry and cohort quotes
    bidder_count = float(cohort.get("bidder_count", 0))
    valid_quotes = float(cohort.get("valid_quotes_count", 0))
    spread_pct = float(cohort.get("bid_price_spread_pct", 0.0))
    ratio_min = float(cohort.get("bid_to_estimate_min_ratio", 1.0))
    ratio_mean = float(cohort.get("bid_to_estimate_mean_ratio", 1.0))
    near_est = float(cohort.get("near_estimate_count", 0))

    # Signal flags from cohort / findings
    has_price_anomaly = float(cohort.get("has_price_anomaly_finding", 0))
    has_rotation = float(cohort.get("has_rotation_finding", 0))
    has_related = float(cohort.get("has_related_bidder_finding", 0))
    has_common_dir = float(cohort.get("has_common_director_finding", 0))
    has_traceability = float(cohort.get("has_traceability_gap_finding", 0))
    has_rep_winner = float(cohort.get("has_repeated_winner_finding", 0))
    has_losing_bid = float(cohort.get("has_losing_bid_finding", 0))
    has_identity_doc = float(cohort.get("has_identity_doc_finding", 0))
    has_narrow_comp = float(cohort.get("has_narrow_competition_finding", 0))

    # Finding severities and diversity
    crit_count = 0
    high_count = 0
    med_count = 0
    signal_types: Set[str] = set()
    related_ids: Set[str] = set()

    for f in findings:
        sev = str(f.get("severity", "")).upper()
        if sev == "CRITICAL":
            crit_count += 1
        elif sev == "HIGH":
            high_count += 1
        elif sev == "MEDIUM":
            med_count += 1

        sig = str(f.get("signal_type", ""))
        if sig:
            signal_types.add(sig)

        for r in f.get("related_bidder_ids") or []:
            related_ids.add(str(r))

    return {
        "bidder_count": bidder_count,
        "valid_quotes_count": valid_quotes,
        "bid_price_spread_pct": spread_pct,
        "bid_to_estimate_min_ratio": ratio_min,
        "bid_to_estimate_mean_ratio": ratio_mean,
        "near_estimate_count": near_est,
        "has_price_anomaly_finding": has_price_anomaly,
        "has_rotation_finding": has_rotation,
        "has_related_bidder_finding": has_related,
        "has_common_director_finding": has_common_dir,
        "has_traceability_gap_finding": has_traceability,
        "has_repeated_winner_finding": has_rep_winner,
        "has_losing_bid_finding": has_losing_bid,
        "has_identity_doc_finding": has_identity_doc,
        "has_narrow_competition_finding": has_narrow_comp,
        "findings_count_total": float(len(findings)),
        "findings_count_critical": float(crit_count),
        "findings_count_high": float(high_count),
        "findings_count_medium": float(med_count),
        "unique_signal_types_count": float(len(signal_types)),
        "related_bidders_involved_count": float(len(related_ids)),
    }


# =====================================================================
# 4. MATRIX BUILDERS WITH ANTI-LEAKAGE CHECKS
# =====================================================================

def build_compliance_dataset(
    cases: List[Dict[str, Any]]
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, List[str], List[str]]:
    """
    Build numerical feature matrix X, classification target y_class,
    and regression target y_score for the Compliance model.
    
    Returns:
        X: (N, D) feature array
        y_class: (N,) string array of risk classes
        y_score: (N,) float array of benchmark scores
        feature_names: List of D feature names
        case_ids: List of case IDs (for held-out tracking, NOT in X)
    """
    assert_no_leakage(COMPLIANCE_FEATURE_NAMES)
    
    X_rows = []
    y_class_rows = []
    y_score_rows = []
    case_ids = []

    for case in cases:
        feat_dict = extract_compliance_features(case)
        row = [feat_dict[name] for name in COMPLIANCE_FEATURE_NAMES]
        X_rows.append(row)
        
        gt = case["ground_truth"]
        y_class_rows.append(gt["compliance_class"])
        y_score_rows.append(float(gt["compliance_score"]))
        case_ids.append(case["case_id"])

    return (
        np.array(X_rows, dtype=np.float64),
        np.array(y_class_rows),
        np.array(y_score_rows, dtype=np.float64),
        COMPLIANCE_FEATURE_NAMES.copy(),
        case_ids,
    )


def build_integrity_dataset(
    cases: List[Dict[str, Any]]
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, List[str], List[str]]:
    """
    Build numerical feature matrix X, classification target y_class,
    and regression target y_score for the Integrity model.
    
    Returns:
        X: (N, D) feature array
        y_class: (N,) string array of risk classes
        y_score: (N,) float array of benchmark scores
        feature_names: List of D feature names
        case_ids: List of case IDs (for held-out tracking, NOT in X)
    """
    assert_no_leakage(INTEGRITY_FEATURE_NAMES)

    X_rows = []
    y_class_rows = []
    y_score_rows = []
    case_ids = []

    for case in cases:
        feat_dict = extract_integrity_features(case)
        row = [feat_dict[name] for name in INTEGRITY_FEATURE_NAMES]
        X_rows.append(row)
        
        gt = case["ground_truth"]
        y_class_rows.append(gt["integrity_class"])
        y_score_rows.append(float(gt["integrity_score"]))
        case_ids.append(case["case_id"])

    return (
        np.array(X_rows, dtype=np.float64),
        np.array(y_class_rows),
        np.array(y_score_rows, dtype=np.float64),
        INTEGRITY_FEATURE_NAMES.copy(),
        case_ids,
    )
