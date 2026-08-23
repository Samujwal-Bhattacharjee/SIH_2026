"""
Case Intelligence & Risk Engine Package.

Provides transparent, deterministic rule-based analysis for:
- Statutory limitation deadline calculation & urgency classification
- File stagnation & workflow bottleneck detection
- Explainable risk scoring with feature-level point attribution
- Operational recommendations for administrative action
- Multi-factor case prioritization & executive dashboard aggregation
"""

from app.services.intelligence.constants import (
    # Risk Levels
    RISK_LEVEL_LOW,
    RISK_LEVEL_MEDIUM,
    RISK_LEVEL_HIGH,
    RISK_LEVEL_CRITICAL,
    # Deadline Statuses
    DEADLINE_STATUS_SAFE,
    DEADLINE_STATUS_WATCH,
    DEADLINE_STATUS_HIGH,
    DEADLINE_STATUS_CRITICAL,
    DEADLINE_STATUS_DUE_TODAY,
    DEADLINE_STATUS_OVERDUE,
    DEADLINE_STATUS_UNKNOWN,
    # Delay Statuses
    DELAY_STATUS_ON_TRACK,
    DELAY_STATUS_MONITOR,
    DELAY_STATUS_AT_RISK,
    DELAY_STATUS_DELAYED,
    DELAY_STATUS_OVERDUE,
    # Priorities
    PRIORITY_IMMEDIATE,
    PRIORITY_URGENT,
    PRIORITY_ROUTINE,
    # Bottleneck Severities
    BOTTLENECK_SEVERITY_LOW,
    BOTTLENECK_SEVERITY_MODERATE,
    BOTTLENECK_SEVERITY_CRITICAL,
    # Thresholds
    STAGE_WARNING_DAYS,
    STAGE_CRITICAL_DAYS,
)

from app.services.intelligence.schemas import (
    CaseIntelligenceResult,
    DashboardIntelligenceSummary,
    BottleneckInfo,
    ScoreBreakdown,
)

from app.services.intelligence.deadline_engine import (
    calculate_days_remaining,
    classify_deadline_status,
    calculate_deadline_status,
    calculate_case_age,
    calculate_statutory_deadline,
    determine_delay_status,
)

from app.services.intelligence.bottleneck_engine import (
    calculate_stage_dwell_days,
    detect_case_bottleneck,
)

from app.services.intelligence.risk_engine import (
    calculate_case_risk,
)

from app.services.intelligence.recommendation_engine import (
    generate_recommendation,
    generate_la_recommendations,
)

from app.services.intelligence.priority_engine import (
    compute_case_intelligence,
    rank_cases,
    aggregate_dashboard_intelligence,
)

__all__ = [
    # Core Engine Functions
    "compute_case_intelligence",
    "rank_cases",
    "aggregate_dashboard_intelligence",
    "calculate_case_risk",
    "detect_case_bottleneck",
    "calculate_stage_dwell_days",
    "calculate_days_remaining",
    "classify_deadline_status",
    "calculate_deadline_status",
    "calculate_case_age",
    "calculate_statutory_deadline",
    "determine_delay_status",
    "generate_recommendation",
    # Schemas
    "CaseIntelligenceResult",
    "DashboardIntelligenceSummary",
    "BottleneckInfo",
    "ScoreBreakdown",
    # Constants
    "RISK_LEVEL_LOW",
    "RISK_LEVEL_MEDIUM",
    "RISK_LEVEL_HIGH",
    "RISK_LEVEL_CRITICAL",
    "DEADLINE_STATUS_SAFE",
    "DEADLINE_STATUS_WATCH",
    "DEADLINE_STATUS_HIGH",
    "DEADLINE_STATUS_CRITICAL",
    "DEADLINE_STATUS_DUE_TODAY",
    "DEADLINE_STATUS_OVERDUE",
    "DEADLINE_STATUS_UNKNOWN",
    "DELAY_STATUS_ON_TRACK",
    "DELAY_STATUS_MONITOR",
    "DELAY_STATUS_AT_RISK",
    "DELAY_STATUS_DELAYED",
    "PRIORITY_IMMEDIATE",
    "PRIORITY_URGENT",
    "PRIORITY_ROUTINE",
    "BOTTLENECK_SEVERITY_LOW",
    "BOTTLENECK_SEVERITY_MODERATE",
    "BOTTLENECK_SEVERITY_CRITICAL",
    "STAGE_WARNING_DAYS",
    "STAGE_CRITICAL_DAYS",
]
