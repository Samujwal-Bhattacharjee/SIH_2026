"""
Land Acquisition Workflow Constants — SIH26017
===============================================
Defines the canonical Land Acquisition workflow stages for the Ministry of
Rural Development as per the Land Acquisition, Rehabilitation and
Resettlement Act (LARR Act), 2013.

This is the single source of truth for stage names, expected durations,
and stage criticality weights. Import these constants throughout the backend
rather than scattering string literals.
"""

from typing import Dict, List

# ============================================================
# CANONICAL STAGE SEQUENCE
# ============================================================
# Ordered list of stages in the standard LA workflow.
LAND_ACQUISITION_STAGES: List[str] = [
    "Project Initiation",
    "Land Identification",
    "Preliminary Notification",
    "Survey and Verification",
    "Ownership Verification",
    "Objection and Legal Review",
    "Compensation Assessment",
    "Compensation Disbursement",
    "R&R and Rehabilitation",
    "Final Acquisition",
    "Possession and Handover",
]

# ============================================================
# EXPECTED STAGE DURATION (Days)
# Based on LARR Act, 2013 and typical state government practice.
# These are the baseline targets — deviations are measured against them.
# ============================================================
STAGE_EXPECTED_DAYS: Dict[str, int] = {
    "Project Initiation":           15,
    "Land Identification":          30,
    "Preliminary Notification":     30,   # Section 11 notification publication
    "Survey and Verification":      45,   # Section 12: Preliminary survey
    "Ownership Verification":       30,   # Title verification, revenue records
    "Objection and Legal Review":   60,   # Section 15: objection hearing period
    "Compensation Assessment":      60,   # Section 26–29: market rate determination
    "Compensation Disbursement":    90,   # Section 38: payment and deposit
    "R&R and Rehabilitation":       120,  # LARR Schedule II
    "Final Acquisition":            30,   # Section 19: gazette notification
    "Possession and Handover":      30,   # Section 38: physical possession
}

# Total expected duration across full workflow
TOTAL_EXPECTED_DAYS: int = sum(STAGE_EXPECTED_DAYS.values())

# ============================================================
# STAGE CRITICALITY WEIGHTS (1-10)
# Higher weight → more impact on delay probability when overdue.
# Used by bottleneck engine and risk scorer.
# ============================================================
STAGE_CRITICALITY_WEIGHTS: Dict[str, int] = {
    "Project Initiation":           2,
    "Land Identification":          3,
    "Preliminary Notification":     5,
    "Survey and Verification":      6,
    "Ownership Verification":       8,    # Most common bottleneck
    "Objection and Legal Review":   9,    # Legal disputes are high risk
    "Compensation Assessment":      7,
    "Compensation Disbursement":    9,    # Compensation delay = critical
    "R&R and Rehabilitation":       8,
    "Final Acquisition":            7,
    "Possession and Handover":      6,
}

# ============================================================
# STAGE INDEX (for ordering / comparison)
# ============================================================
STAGE_INDEX: Dict[str, int] = {
    stage: idx for idx, stage in enumerate(LAND_ACQUISITION_STAGES)
}

# ============================================================
# DELAY FACTOR LABELS
# Human-readable labels for each measurable delay factor.
# ============================================================
DELAY_FACTOR_LABELS: Dict[str, str] = {
    "documentation_completeness":   "Documentation Completeness (%)",
    "legal_dispute":                "Legal Dispute Active",
    "ownership_conflict":           "Ownership Conflict",
    "compensation_pending_days":    "Compensation Pending (Days)",
    "inter_dept_dependency":        "Inter-Department Dependency",
    "rr_delay_days":                "R&R Delay (Days)",
    "project_age_days":             "Project Age (Days)",
    "number_of_delayed_stages":     "Delayed Stages Count",
}

# ============================================================
# RISK LEVEL THRESHOLDS (Delay Probability 0.0–1.0)
# ============================================================
RISK_THRESHOLD_LOW_MAX: float       = 0.30     # < 0.30   → LOW
RISK_THRESHOLD_MEDIUM_MAX: float    = 0.59     # 0.30–0.59 → MEDIUM
RISK_THRESHOLD_HIGH_MAX: float      = 0.79     # 0.60–0.79 → HIGH
RISK_THRESHOLD_CRITICAL_MIN: float  = 0.80     # >= 0.80  → CRITICAL

# ============================================================
# RECOMMENDATION THRESHOLDS
# ============================================================
DOCUMENTATION_WARNING_THRESHOLD: float   = 80.0   # % — below this → warning
DOCUMENTATION_CRITICAL_THRESHOLD: float  = 60.0   # % — below this → critical
COMPENSATION_WARNING_DAYS: int           = 30     # Days pending → warning
COMPENSATION_CRITICAL_DAYS: int          = 60     # Days pending → critical
STAGE_OVERDUE_WARNING_DAYS: int          = 7      # Days over expected → warning
STAGE_OVERDUE_CRITICAL_DAYS: int         = 15     # Days over expected → critical


def get_risk_level_from_probability(probability: float) -> str:
    """Convert a delay probability (0.0–1.0) to a risk level label."""
    if probability >= RISK_THRESHOLD_CRITICAL_MIN:  # >= 0.80
        return "CRITICAL"
    elif probability >= 0.60:                       # 0.60–0.79
        return "HIGH"
    elif probability >= RISK_THRESHOLD_LOW_MAX:     # 0.30–0.59
        return "MEDIUM"
    else:                                           # < 0.30
        return "LOW"


def get_stage_index(stage_name: str) -> int:
    """Return the 0-based index of a stage in the canonical workflow.
    Returns -1 if the stage is unknown."""
    return STAGE_INDEX.get(stage_name, -1)


def get_next_stage(current_stage: str) -> str | None:
    """Return the next stage after the current one, or None if at the end."""
    idx = get_stage_index(current_stage)
    if idx == -1 or idx >= len(LAND_ACQUISITION_STAGES) - 1:
        return None
    return LAND_ACQUISITION_STAGES[idx + 1]


def get_expected_days(stage_name: str) -> int:
    """Return the expected duration in days for a given stage."""
    return STAGE_EXPECTED_DAYS.get(stage_name, 30)  # default 30 days
