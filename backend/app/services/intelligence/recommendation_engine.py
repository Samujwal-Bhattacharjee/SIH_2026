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


def generate_la_recommendations(
    project_data: Dict[str, Any],
    bottleneck_info: Optional[BottleneckInfo] = None,
    delay_probability: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Generate structured, transparent operational recommendations for Land Acquisition projects (SIH26017).
    
    Rules are completely explainable and traceable to detected project conditions.
    """
    actions = []
    priority = "ROUTINE"

    prob = delay_probability if delay_probability is not None else float(project_data.get("delay_probability") or 0.0)
    if prob >= 0.80:
        priority = "IMMEDIATE"
    elif prob >= 0.50:
        priority = "URGENT"

    # 1. Ownership conflict check
    if project_data.get("ownership_conflict"):
        priority = "IMMEDIATE"
        actions.append({
            "factor": "Ownership Conflict",
            "reason": "Disputed title / multiple ownership claims detected on parcel records",
            "action": "Initiate Special Revenue Court summary inquiry & refer to Sub-Divisional Magistrate for title verification",
            "urgency": "HIGH",
        })

    # 2. Legal dispute check
    if project_data.get("legal_dispute"):
        priority = "IMMEDIATE"
        actions.append({
            "factor": "Legal Dispute",
            "reason": "Active writ petition / stay application in district or high court",
            "action": "Brief Government Standing Counsel immediately to file counter-affidavit and vacate interim stay",
            "urgency": "HIGH",
        })

    # 3. Compensation pending
    comp_days = int(project_data.get("compensation_pending_days") or 0)
    if comp_days > 60:
        priority = "IMMEDIATE"
        actions.append({
            "factor": "Compensation Pending",
            "reason": f"Compensation disbursement has been pending for {comp_days} days (exceeds 60-day threshold)",
            "action": "Escalate to District Collector / Special Land Acquisition Officer (SLAO) for treasury sanction release",
            "urgency": "HIGH",
        })
    elif comp_days > 30:
        actions.append({
            "factor": "Compensation Pending",
            "reason": f"Compensation disbursement pending for {comp_days} days",
            "action": "Expedite beneficiary account validation and bank transfer authorization",
            "urgency": "MEDIUM",
        })

    # 4. Documentation completeness
    doc_comp = float(project_data.get("documentation_completeness") or 100.0)
    if doc_comp < 60:
        actions.append({
            "factor": "Documentation Incomplete",
            "reason": f"Documentation completeness is critically low at {doc_comp}% (threshold: 80%)",
            "action": "Issue formal compliance notice to requisitioning agency for missing survey / clearance records",
            "urgency": "HIGH",
        })
    elif doc_comp < 80:
        actions.append({
            "factor": "Documentation Incomplete",
            "reason": f"Documentation completeness is at {doc_comp}% (threshold: 80%)",
            "action": "Collect remaining cadastral maps and record-of-rights (RoR) extracts",
            "urgency": "MEDIUM",
        })

    # 5. Inter-department dependency
    if project_data.get("inter_dept_dependency"):
        actions.append({
            "factor": "Inter-Department Dependency",
            "reason": "Pending clearance or alignment approvals from external department/agency",
            "action": "Convene joint inter-departmental coordination meeting with nodal liaison officer",
            "urgency": "MEDIUM",
        })

    # 6. Bottleneck at stage
    if bottleneck_info and bottleneck_info.is_bottleneck:
        actions.append({
            "factor": f"Stage Bottleneck: {bottleneck_info.stage}",
            "reason": f"Stage dwell time ({bottleneck_info.days_pending} days) significantly exceeds baseline",
            "action": f"Deploy additional verification staff and issue 7-day disposal directive for '{bottleneck_info.stage}'",
            "urgency": "HIGH" if bottleneck_info.severity == "CRITICAL" else "MEDIUM",
        })

    # 7. Fallback if no issues found
    if not actions:
        actions.append({
            "factor": "On Track",
            "reason": "All measured land acquisition workflow parameters within normal boundaries",
            "action": "Continue routine milestone tracking and bi-weekly review",
            "urgency": "LOW",
        })

    primary_rec = actions[0]["action"] if actions else "Continue standard project monitoring."

    return {
        "priority": priority,
        "primary_recommendation": primary_rec,
        "recommended_actions": actions,
    }
