"""
Explainable Risk Scoring Engine.

Computes a deterministic, fully explainable risk score (0-100) with complete
point-by-point attribution breakdowns and natural language justifications.
"""
from datetime import datetime, date, timezone
from typing import Dict, Any, List, Optional, Union
from app.services.intelligence.constants import (
    RISK_THRESHOLD_LOW_MAX,
    RISK_THRESHOLD_MEDIUM_MAX,
    RISK_THRESHOLD_HIGH_MAX,
    RISK_LEVEL_LOW,
    RISK_LEVEL_MEDIUM,
    RISK_LEVEL_HIGH,
    RISK_LEVEL_CRITICAL,
    STAGE_CRITICALITY_WEIGHTS,
    STAGE_BASELINE_DAYS,
    DEFAULT_STAGE_BASELINE_DAYS,
    WEIGHT_DEADLINE_MAX,
    WEIGHT_OVERDUE_BONUS,
    WEIGHT_STAGNATION_MAX,
    WEIGHT_LEGAL_OPINION_OVERDUE,
    WEIGHT_LEGAL_OPINION_APPROACHING,
    WEIGHT_STAGE_CRITICALITY_MAX,
    WEIGHT_REWORK_MOVEMENT_MAX,
    PRIORITY_IMMEDIATE,
    PRIORITY_URGENT,
    PRIORITY_ROUTINE,
    TERMINAL_CASE_STATUSES,
)
from app.services.intelligence.schemas import ScoreBreakdown
from app.services.intelligence.deadline_engine import (
    calculate_days_remaining,
    classify_deadline_status,
    DEADLINE_STATUS_OVERDUE,
    DEADLINE_STATUS_DUE_TODAY,
    DEADLINE_STATUS_CRITICAL,
    DEADLINE_STATUS_HIGH,
    DEADLINE_STATUS_WATCH,
    DEADLINE_STATUS_SAFE,
    normalize_to_date,
)
from app.services.intelligence.bottleneck_engine import calculate_stage_dwell_days


def calculate_case_risk(
    case_data: Dict[str, Any],
    legal_opinion: Optional[Dict[str, Any]] = None,
    movements: Optional[List[Dict[str, Any]]] = None,
    current_date: Optional[Union[str, date, datetime]] = None,
) -> Dict[str, Any]:
    """
    Calculate an explainable, deterministic risk score and breakdown for a case.

    Args:
        case_data: Case dictionary with fields like limitation_deadline, current_stage, created_at
        legal_opinion: Optional legal opinion record if one exists
        movements: Optional list of case movement records
        current_date: Optional reference date for deterministic testing

    Returns:
        Dict containing:
            - risk_score (float 0 - 100)
            - risk_level (LOW | MEDIUM | HIGH | CRITICAL)
            - frontend_risk_level (LOW | MEDIUM | HIGH)
            - priority (IMMEDIATE | URGENT | ROUTINE)
            - reasons (List[str])
            - breakdown (ScoreBreakdown)
            - days_remaining (Optional[int])
            - stage_dwell_days (int)
    """
    reasons: List[str] = []
    deadline_risk = 0.0
    stagnation_risk = 0.0
    legal_op_risk = 0.0
    stage_crit_risk = 0.0
    rework_risk = 0.0

    case_status = str(case_data.get("status", "")).upper()
    is_terminal = case_status in TERMINAL_CASE_STATUSES

    # If case is already disposed/closed, return zero operational risk
    if is_terminal:
        return {
            "risk_score": 0.0,
            "risk_level": RISK_LEVEL_LOW,
            "frontend_risk_level": "LOW",
            "priority": PRIORITY_ROUTINE,
            "reasons": [f"Case is resolved ({case_status}) — no active operational risk."],
            "breakdown": ScoreBreakdown(total_raw=0.0, total_capped=0.0),
            "days_remaining": None,
            "stage_dwell_days": 0,
        }

    # ============================================================
    # Factor A & E: Deadline Proximity & Overdue Status (Max 50 + 30)
    # ============================================================
    deadline_val = (
        case_data.get("limitation_deadline")
        or case_data.get("limitationDeadline")
        or case_data.get("statutoryDeadlineDate")
    )
    days_remaining = calculate_days_remaining(deadline_val, current_date=current_date)

    if days_remaining is not None:
        if days_remaining < 0:
            overdue_days = abs(days_remaining)
            deadline_risk = WEIGHT_DEADLINE_MAX + WEIGHT_OVERDUE_BONUS  # 50 + 30 = 80
            reasons.append(f"Statutory limitation deadline is OVERDUE by {overdue_days} day(s)")
        elif days_remaining == 0:
            deadline_risk = WEIGHT_DEADLINE_MAX  # 50
            reasons.append("Statutory limitation deadline is DUE TODAY")
        elif days_remaining <= 3:
            deadline_risk = 48.0
            reasons.append(f"Only {days_remaining} day(s) remain before statutory limitation deadline")
        elif days_remaining <= 7:
            deadline_risk = 40.0
            reasons.append(f"{days_remaining} days remaining until statutory deadline (Critical window)")
        elif days_remaining <= 15:
            deadline_risk = 28.0
            reasons.append(f"{days_remaining} days remaining until statutory deadline")
        elif days_remaining <= 30:
            deadline_risk = 15.0
            reasons.append(f"{days_remaining} days remaining — monitor deadline progression")
        else:
            # > 30 days: safe window, slight scaling down
            deadline_risk = max(0.0, round(50.0 - float(days_remaining), 1))
            deadline_risk = max(0.0, min(10.0, deadline_risk))
    else:
        # No deadline field present on case record
        # Gracefully handle without crashing
        pass

    # ============================================================
    # Factor B: File Stagnation & Stage Dwell Time (Max 20)
    # ============================================================
    stage_dwell_days = calculate_stage_dwell_days(
        case_data, movements=movements, current_date=current_date
    )
    current_stage = case_data.get("current_stage") or case_data.get("currentStage", "")
    baseline_days = STAGE_BASELINE_DAYS.get(current_stage, DEFAULT_STAGE_BASELINE_DAYS)

    if stage_dwell_days >= 15:
        stagnation_risk = WEIGHT_STAGNATION_MAX  # 20.0
        reasons.append(
            f"File has been stalled at '{current_stage}' for {stage_dwell_days} days "
            f"(expected baseline: {baseline_days} days)"
        )
    elif stage_dwell_days >= 7:
        stagnation_risk = 12.0
        reasons.append(
            f"File has been pending at '{current_stage}' for {stage_dwell_days} days"
        )
    elif stage_dwell_days > baseline_days * 2:
        stagnation_risk = 5.0
        reasons.append(
            f"Stage dwell of {stage_dwell_days} days exceeds baseline of {baseline_days} days"
        )

    # ============================================================
    # Factor C: Current Stage Criticality (Max 10)
    # ============================================================
    if current_stage:
        crit_weight = float(STAGE_CRITICALITY_WEIGHTS.get(current_stage, 3))
        stage_crit_risk = min(WEIGHT_STAGE_CRITICALITY_MAX, crit_weight)
        if crit_weight >= 7:
            reasons.append(f"Case is active in high-criticality stage: '{current_stage}'")

    # ============================================================
    # Factor D: Legal Opinion Delay (Max 15)
    # ============================================================
    if legal_opinion:
        lo_status = str(legal_opinion.get("status", "")).upper()
        lo_due_val = legal_opinion.get("due_date") or legal_opinion.get("dueDate")
        lo_days_rem = calculate_days_remaining(lo_due_val, current_date=current_date)

        if lo_status in ("OVERDUE", "BREACHED") or (lo_days_rem is not None and lo_days_rem < 0):
            legal_op_risk = WEIGHT_LEGAL_OPINION_OVERDUE  # 15.0
            reasons.append("Legal opinion referral is OVERDUE")
        elif lo_status == "REQUESTED" and lo_days_rem is not None and lo_days_rem <= 3:
            legal_op_risk = WEIGHT_LEGAL_OPINION_APPROACHING  # 8.0
            reasons.append(f"Legal opinion requested — due in {lo_days_rem} day(s)")
        elif lo_status == "REQUESTED":
            legal_op_risk = 4.0
            reasons.append("Legal opinion pending from standing counsel")

    # ============================================================
    # Factor F: Rework Loops & Movement Count (Max 5)
    # ============================================================
    movement_count = len(movements) if movements else case_data.get("movement_count", 0)
    if movement_count > 5:
        rework_risk = min(WEIGHT_REWORK_MOVEMENT_MAX, (movement_count - 5) * 1.0)
        reasons.append(
            f"High file movement frequency ({movement_count} forwards) indicates probable rework cycle"
        )

    # ============================================================
    # Total Score Calculation & Capping
    # ============================================================
    raw_score = deadline_risk + stagnation_risk + legal_op_risk + stage_crit_risk + rework_risk
    final_score = min(100.0, max(0.0, round(raw_score, 1)))

    breakdown = ScoreBreakdown(
        deadline_risk=round(deadline_risk, 1),
        stagnation_risk=round(stagnation_risk, 1),
        legal_opinion_risk=round(legal_op_risk, 1),
        stage_criticality_risk=round(stage_crit_risk, 1),
        rework_risk=round(rework_risk, 1),
        total_raw=round(raw_score, 1),
        total_capped=final_score,
    )

    # ============================================================
    # Classification: 4-tier Engine Level & 3-tier Frontend Level
    # ============================================================
    if final_score >= 70:
        risk_level = RISK_LEVEL_CRITICAL
        frontend_level = "HIGH"
        priority = PRIORITY_IMMEDIATE
    elif final_score >= 50:
        risk_level = RISK_LEVEL_HIGH
        frontend_level = "HIGH"
        priority = PRIORITY_URGENT
    elif final_score >= 30:
        risk_level = RISK_LEVEL_MEDIUM
        frontend_level = "MEDIUM"
        priority = PRIORITY_URGENT
    else:
        risk_level = RISK_LEVEL_LOW
        frontend_level = "LOW"
        priority = PRIORITY_ROUTINE

    # Override priority for overdue and critical deadline window
    if days_remaining is not None:
        if days_remaining <= 7:
            priority = PRIORITY_IMMEDIATE

    if not reasons:
        reasons.append("All operational metrics are within standard processing boundaries.")

    return {
        "risk_score": final_score,
        "risk_level": risk_level,
        "frontend_risk_level": frontend_level,
        "priority": priority,
        "reasons": reasons,
        "breakdown": breakdown,
        "days_remaining": days_remaining,
        "stage_dwell_days": stage_dwell_days,
    }
