"""
Constants and Configuration for the Case Intelligence & Risk Engine.

All operational thresholds, weight distributions, and classification boundaries
are defined here to ensure transparency, explainability, and easy configurability.
"""

# ============================================================
# 1. RISK SCORE THRESHOLDS (0 - 100)
# ============================================================
# Standard 4-tier operational classification
RISK_THRESHOLD_LOW_MAX = 29
RISK_THRESHOLD_MEDIUM_MAX = 49
RISK_THRESHOLD_HIGH_MAX = 69
RISK_THRESHOLD_CRITICAL_MIN = 70

# Level names
RISK_LEVEL_LOW = "LOW"
RISK_LEVEL_MEDIUM = "MEDIUM"
RISK_LEVEL_HIGH = "HIGH"
RISK_LEVEL_CRITICAL = "CRITICAL"

# ============================================================
# 2. DEADLINE PROXIMITY THRESHOLDS (Days Remaining)
# ============================================================
DEADLINE_THRESHOLD_SAFE_MIN = 31       # > 30 days
DEADLINE_THRESHOLD_WATCH_MIN = 16      # 16 - 30 days
DEADLINE_THRESHOLD_HIGH_MIN = 8        # 8 - 15 days
DEADLINE_THRESHOLD_CRITICAL_MIN = 1    # 1 - 7 days
DEADLINE_THRESHOLD_DUE_TODAY = 0       # 0 days
# < 0 is OVERDUE

DEADLINE_STATUS_SAFE = "SAFE"
DEADLINE_STATUS_WATCH = "WATCH"
DEADLINE_STATUS_HIGH = "HIGH"
DEADLINE_STATUS_CRITICAL = "CRITICAL"
DEADLINE_STATUS_DUE_TODAY = "DUE_TODAY"
DEADLINE_STATUS_OVERDUE = "OVERDUE"
DEADLINE_STATUS_UNKNOWN = "UNKNOWN"

# ============================================================
# 3. STAGE DURATION & STAGNATION THRESHOLDS (Days)
# ============================================================
STAGE_WARNING_DAYS = 7        # Flagged as potential delay / high watch
STAGE_CRITICAL_DAYS = 15      # Flagged as critical stagnation / bottleneck
DEFAULT_STAGE_BASELINE_DAYS = 3.0

# Baseline expected processing days per stage
STAGE_BASELINE_DAYS = {
    "Application Received": 1.0,
    "Document Verification": 3.0,
    "Department Assignment": 2.0,
    "Officer Review": 5.0,
    "Legal Review": 4.0,
    "Approval": 3.0,
    "Closure": 1.0,
    # Standard litigation stage aliases
    "ORDER_RECEIVED": 1.0,
    "DEPARTMENT_REVIEW": 4.0,
    "LEGAL_OPINION": 5.0,
    "DECISION": 3.0,
    "APPEAL": 5.0,
    "COMPLIANCE": 4.0,
    "CLOSED": 0.0,
}

# Stage criticality weights for risk scoring (0 - 10)
STAGE_CRITICALITY_WEIGHTS = {
    "Legal Review": 8,
    "Officer Review": 5,
    "Document Verification": 4,
    "Approval": 6,
    "Closure": 2,
    "Application Received": 1,
    "Department Assignment": 2,
    # Extended litigation aliases
    "LEGAL_REVIEW": 8,
    "LEGAL_OPINION": 9,
    "DECISION": 6,
    "APPEAL": 7,
    "COMPLIANCE": 5,
    "ORDER_RECEIVED": 3,
    "DEPARTMENT_REVIEW": 4,
    "CLOSED": 0,
}

# ============================================================
# 4. SCORING FACTOR WEIGHTS
# ============================================================
# Maximum possible contributions per factor (Base score is sum, capped at 100)
WEIGHT_DEADLINE_MAX = 50.0
WEIGHT_OVERDUE_BONUS = 30.0
WEIGHT_STAGNATION_MAX = 20.0
WEIGHT_LEGAL_OPINION_OVERDUE = 15.0
WEIGHT_LEGAL_OPINION_APPROACHING = 8.0
WEIGHT_STAGE_CRITICALITY_MAX = 10.0
WEIGHT_REWORK_MOVEMENT_MAX = 5.0

# ============================================================
# 5. PRIORITY & DELAY CLASSIFICATIONS
# ============================================================
PRIORITY_IMMEDIATE = "IMMEDIATE"
PRIORITY_URGENT = "URGENT"
PRIORITY_ROUTINE = "ROUTINE"

DELAY_STATUS_ON_TRACK = "ON_TRACK"
DELAY_STATUS_MONITOR = "MONITOR"
DELAY_STATUS_AT_RISK = "AT_RISK"
DELAY_STATUS_DELAYED = "DELAYED"
DELAY_STATUS_OVERDUE = "OVERDUE"
DELAY_STATUS_UNKNOWN = "UNKNOWN"

BOTTLENECK_SEVERITY_LOW = "LOW"
BOTTLENECK_SEVERITY_MODERATE = "MODERATE"
BOTTLENECK_SEVERITY_CRITICAL = "CRITICAL"

# Terminal statuses that should not accumulate operational delay risk
TERMINAL_CASE_STATUSES = {
    "DISPOSED",
    "APPROVED",
    "REJECTED",
    "RESOLVED",
    "CLOSED",
}
