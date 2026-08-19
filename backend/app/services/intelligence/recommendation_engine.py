"""
Operational Recommendation Engine.

Produces actionable, deterministic administrative recommendations based on
detected risk factors, bottlenecks, and deadline proximities.
"""
from typing import Optional, Dict, Any
from app.services.intelligence.schemas import BottleneckInfo
from app.services.intelligence.constants import (
    RISK_LEVEL_CRITICAL,
    RISK_LEVEL_HIGH,
    RISK_LEVEL_MEDIUM,
    RISK_LEVEL_LOW,
    DEADLINE_STATUS_OVERDUE,
    DEADLINE_STATUS_DUE_TODAY,
    DEADLINE_STATUS_CRITICAL,
    DEADLINE_STATUS_HIGH,
    BOTTLENECK_SEVERITY_CRITICAL,
)


def generate_recommendation(
    risk_level: str,
    deadline_status: str,
    days_remaining: Optional[int] = None,
    bottleneck_info: Optional[BottleneckInfo] = None,
    legal_opinion: Optional[Dict[str, Any]] = None,
    current_stage: Optional[str] = None,
) -> str:
    """
    Generate a precise, rule-based operational recommendation for the responsible officer.
    """
    # 1. Overdue cases take utmost urgency
    if deadline_status == DEADLINE_STATUS_OVERDUE or (days_remaining is not None and days_remaining < 0):
        return (
            "EMERGENCY: Statutory limitation deadline has lapsed. "
            "Immediately escalate to Department Head and Advocate General / Standing Counsel "
            "to assess condonation of delay (Section 5 Limitation Act)."
        )

    # 2. Due today
    if deadline_status == DEADLINE_STATUS_DUE_TODAY or (days_remaining == 0):
        return (
            "CRITICAL: Statutory limitation deadline expires TODAY. "
            "Complete final disposal, compliance filing, or appeal submission immediately."
        )

    # 3. Critical deadline approaching (1-7 days)
    if deadline_status == DEADLINE_STATUS_CRITICAL or (days_remaining is not None and 1 <= days_remaining <= 7):
        if bottleneck_info and bottleneck_info.severity == BOTTLENECK_SEVERITY_CRITICAL:
            return (
                f"URGENT: Only {days_remaining} day(s) remain before statutory deadline while file is stalled "
                f"at '{bottleneck_info.stage}'. Immediately fast-track file out of current desk to prevent breach."
            )
        return (
            f"URGENT: {days_remaining} day(s) remaining before statutory deadline. "
            "Expedite inter-departmental review and prepare compliance/appeal documents."
        )

    # 4. Legal opinion bottlenecks
    if legal_opinion:
        lo_status = str(legal_opinion.get("status", "")).upper()
        if lo_status in ("OVERDUE", "BREACHED"):
            return (
                "ACTION REQUIRED: Legal opinion referral is overdue from Law Department / Counsel. "
                "Issue urgent reminder memo or schedule emergency consultation."
            )

    # 5. Severe stage bottleneck (regardless of deadline)
    if bottleneck_info and bottleneck_info.severity == BOTTLENECK_SEVERITY_CRITICAL:
        dept_str = f" in {bottleneck_info.responsible_department}" if bottleneck_info.responsible_department else ""
        return (
            f"BOTTLENECK DETECTED: File has exceeded allowable dwell time at '{bottleneck_info.stage}'{dept_str} "
            f"({bottleneck_info.days_pending} days). Reassign or issue section review directive."
        )

    # 6. Moderate stage bottleneck
    if bottleneck_info and bottleneck_info.stage:
        return (
            f"STAGE DELAY: File pending for {bottleneck_info.days_pending} days at '{bottleneck_info.stage}'. "
            "Follow up with the assigned section officer."
        )

    # 7. Level-based fallbacks
    if risk_level in (RISK_LEVEL_CRITICAL, RISK_LEVEL_HIGH):
        return (
            "ELEVATED RISK: Prioritize file movement out of current stage and monitor daily."
        )
    elif risk_level == RISK_LEVEL_MEDIUM:
        return (
            "NORMAL WATCH: Track scheduled milestone completion and review prior to 15-day mark."
        )
    else:
        return (
            "ROUTINE: Processing within regular parameters. No immediate escalation needed."
        )
