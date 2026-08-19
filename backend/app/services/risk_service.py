"""
Risk Service — transparent, rule-based risk scoring engine.

This is NOT an ML model. It is a deterministic, explainable scoring function.
Every risk score has documented reasons. The dashboard shows WHY a case is risky.

Risk Factors and Weights:
  1. Days remaining until deadline  — highest weight (0-50 points)
  2. Whether deadline has passed     — very high bonus (+30 points)
  3. Days case at current stage      — high weight (0-20 points)
  4. Legal opinion overdue           — high penalty (+15 points)
  5. Current stage criticality       — moderate (0-10 points)
  6. Number of previous movements    — minor (0-5 points)

Maximum theoretical score: ~130 (capped at 100)
"""
from datetime import datetime, timezone
from typing import List, Dict
from app.services.deadline_service import calculate_days_remaining, parse_iso_datetime


# Stage criticality weights (higher = more critical stage to be stuck in)
STAGE_WEIGHTS = {
    "Legal Review": 8,
    "Officer Review": 5,
    "Document Verification": 4,
    "Approval": 6,
    "Closure": 2,
    "Application Received": 1,
    "Department Assignment": 2,
    # Extended litigation stages
    "LEGAL_REVIEW": 8,
    "LEGAL_OPINION": 9,
    "DECISION": 6,
    "APPEAL": 7,
    "COMPLIANCE": 5,
    "ORDER_RECEIVED": 3,
    "DEPARTMENT_REVIEW": 4,
    "CLOSED": 0,
}


def calculate_stage_dwell_days(case: dict) -> int:
    """
    Calculate how many days the case has been at its current stage.
    Uses last_movement_date if available, otherwise case creation date.
    """
    stage_start = case.get("last_movement_date") or case.get("created_at")
    if not stage_start:
        return 0
    try:
        start = parse_iso_datetime(stage_start)
        now = datetime.now(timezone.utc)
        return max(0, (now - start).days)
    except Exception:
        return 0


def calculate_risk(
    case: dict,
    legal_opinion: dict | None = None,
    movement_count: int = 0,
) -> Dict:
    """
    Calculate a transparent risk score for a case.

    Args:
        case: Raw case dict from database (must have deadline info populated)
        legal_opinion: Legal opinion dict if one exists, else None
        movement_count: Number of file movements recorded for this case

    Returns:
        Dict with keys: risk_score (0-100), risk_level, reasons (list of strings)
    """
    score = 0.0
    reasons = []

    # --- Factor 1: Days remaining (0-50 points) ---
    days_remaining = case.get("daysRemaining", 999)
    if days_remaining < 0:
        # Overdue
        overdue_days = abs(days_remaining)
        deadline_score = min(50, 50 + overdue_days * 2)  # Grows past 50 when overdue
        reasons.append(f"Deadline has passed by {overdue_days} day(s)")
    elif days_remaining == 0:
        deadline_score = 50
        reasons.append("Deadline is TODAY")
    elif days_remaining <= 3:
        deadline_score = 48
        reasons.append(f"Only {days_remaining} day(s) remaining before statutory deadline")
    elif days_remaining <= 7:
        deadline_score = 40
        reasons.append(f"{days_remaining} days remaining — critical window")
    elif days_remaining <= 15:
        deadline_score = 28
        reasons.append(f"{days_remaining} days remaining — approaching deadline")
    elif days_remaining <= 30:
        deadline_score = 15
        reasons.append(f"{days_remaining} days remaining — monitor closely")
    else:
        deadline_score = max(0, 50 - days_remaining)
        deadline_score = max(0, deadline_score)

    score += deadline_score

    # --- Factor 2: Overdue bonus (+30 if past deadline) ---
    if days_remaining < 0:
        score += 30
        # Already noted in factor 1

    # --- Factor 3: Stage dwell time (0-20 points) ---
    stage_dwell = calculate_stage_dwell_days(case)
    current_stage = case.get("current_stage", "")

    # Baseline expected days at each stage (simplified)
    stage_baseline = 3  # Default: 3 days expected at any stage
    if stage_dwell > stage_baseline * 3:
        dwell_score = min(20, (stage_dwell - stage_baseline) * 1.5)
        reasons.append(
            f"Case has been at '{current_stage}' for {stage_dwell} days "
            f"(expected ≤{stage_baseline * 2} days)"
        )
        score += dwell_score
    elif stage_dwell > stage_baseline * 2:
        dwell_score = min(10, stage_dwell * 0.5)
        reasons.append(f"Case stalled at '{current_stage}' for {stage_dwell} days")
        score += dwell_score

    # --- Factor 4: Legal opinion overdue (+15) ---
    if legal_opinion:
        lo_status = legal_opinion.get("status", "")
        lo_due = legal_opinion.get("due_date")
        if lo_status == "OVERDUE":
            score += 15
            reasons.append("Legal opinion is overdue")
        elif lo_due and calculate_days_remaining(lo_due[:10]) < 0:
            score += 15
            reasons.append("Legal opinion due date has passed")
        elif lo_status == "REQUESTED" and lo_due:
            lo_days = calculate_days_remaining(lo_due[:10])
            if lo_days <= 3:
                score += 8
                reasons.append(f"Legal opinion due in {lo_days} day(s)")

    # --- Factor 5: Stage criticality (0-10 points) ---
    stage_weight = STAGE_WEIGHTS.get(current_stage, 3)
    stage_score = stage_weight
    score += stage_score
    if stage_weight >= 7:
        reasons.append(f"Case is at high-priority stage: '{current_stage}'")

    # --- Factor 6: Excessive movements (0-5 points, signals rework) ---
    if movement_count > 5:
        rework_score = min(5, (movement_count - 5) * 0.5)
        score += rework_score
        reasons.append(f"Case has been forwarded {movement_count} times — possible rework loop")

    # --- Cap at 100 ---
    final_score = min(100, round(score, 1))

    # --- Map score to level ---
    if final_score >= 75:
        risk_level = "HIGH"
    elif final_score >= 45:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    # Default reason if nothing triggered
    if not reasons:
        reasons.append("No immediate risk factors detected")

    return {
        "risk_score": final_score,
        "risk_level": risk_level,
        "reasons": reasons,
    }


def build_risk_prediction(case: dict, risk_result: dict, legal_opinion: dict | None = None) -> dict:
    """
    Build a full RiskPrediction object matching the frontend TypeScript interface.
    """
    days_remaining = case.get("daysRemaining", 0)
    deadline = case.get("limitation_deadline") or "Unknown"
    today = datetime.now(timezone.utc)

    if days_remaining < 0:
        expected_delay = abs(days_remaining)
        predicted_breach = today.date().isoformat()  # Already breached
    else:
        expected_delay = 0
        from datetime import timedelta
        predicted_breach = (today + timedelta(days=days_remaining)).date().isoformat()

    # Build SHAP-style attribution factors for transparency
    shap_factors = []

    deadline_score = min(50, max(0, 50 - days_remaining if days_remaining >= 0 else 80))
    shap_factors.append({
        "factor": "Deadline Proximity",
        "contributionScore": round(deadline_score, 1),
        "impact": "HIGH" if deadline_score >= 30 else "MEDIUM" if deadline_score >= 15 else "LOW",
        "description": f"{abs(days_remaining)} days {'overdue' if days_remaining < 0 else 'remaining'}",
    })

    stage = case.get("current_stage", "Unknown")
    stage_w = STAGE_WEIGHTS.get(stage, 3)
    shap_factors.append({
        "factor": "Workflow Stage",
        "contributionScore": float(stage_w),
        "impact": "HIGH" if stage_w >= 7 else "MEDIUM" if stage_w >= 4 else "LOW",
        "description": f"Currently at: {stage}",
    })

    if legal_opinion:
        lo_status = legal_opinion.get("status", "N/A")
        shap_factors.append({
            "factor": "Legal Opinion Status",
            "contributionScore": 15.0 if lo_status in ("OVERDUE",) else 5.0,
            "impact": "HIGH" if lo_status == "OVERDUE" else "LOW",
            "description": f"Legal opinion status: {lo_status}",
        })

    primary = risk_result["reasons"][0] if risk_result["reasons"] else "Multiple risk factors"

    return {
        "caseId": case.get("id", ""),
        "riskScore": risk_result["risk_score"],
        "riskLevel": risk_result["risk_level"],
        "expectedDelayDays": expected_delay,
        "predictedBreachDate": predicted_breach,
        "statutoryDeadlineDate": deadline if deadline != "Unknown" else predicted_breach,
        "primaryFactor": primary,
        "recommendedAction": _get_recommended_action(risk_result["risk_level"], stage),
        "shapAttribution": shap_factors,
        "confidenceScore": 0.85,  # Deterministic model: fixed confidence
        "historicalBaselineDays": case.get("statutory_deadline_days", 90),
        "excessPercentage": round(
            (abs(days_remaining) / case.get("statutory_deadline_days", 90)) * 100, 1
        ) if days_remaining < 0 else 0,
    }


def _get_recommended_action(risk_level: str, stage: str) -> str:
    if risk_level == "HIGH":
        return "Immediate escalation to Department Head required. Expedite through all remaining stages."
    elif risk_level == "MEDIUM":
        return f"Prioritize movement out of '{stage}'. Monitor daily until deadline."
    else:
        return "Continue regular processing. Review before 30-day mark."
