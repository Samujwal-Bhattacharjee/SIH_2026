"""
Priority Ranking & Dashboard Intelligence Aggregation Engine.

Provides multi-factor sorting for executive decision support and aggregate KPI
computation for state-level monitoring dashboards.
"""
from datetime import datetime, date, timezone
from typing import List, Dict, Any, Optional, Union
from app.services.intelligence.constants import (
    TERMINAL_CASE_STATUSES,
    RISK_LEVEL_CRITICAL,
    RISK_LEVEL_HIGH,
    RISK_LEVEL_MEDIUM,
    RISK_LEVEL_LOW,
    DEADLINE_STATUS_OVERDUE,
    DEADLINE_STATUS_CRITICAL,
    DEADLINE_STATUS_HIGH,
    DEADLINE_STATUS_WATCH,
    DELAY_STATUS_DELAYED,
    DELAY_STATUS_OVERDUE,
)
from app.services.intelligence.schemas import (
    CaseIntelligenceResult,
    DashboardIntelligenceSummary,
)
from app.services.intelligence.deadline_engine import (
    calculate_days_remaining,
    classify_deadline_status,
    calculate_case_age,
    determine_delay_status,
    normalize_to_date,
)
from app.services.intelligence.bottleneck_engine import detect_case_bottleneck
from app.services.intelligence.risk_engine import calculate_case_risk
from app.services.intelligence.recommendation_engine import generate_recommendation


def compute_case_intelligence(
    case_data: Dict[str, Any],
    legal_opinion: Optional[Dict[str, Any]] = None,
    movements: Optional[List[Dict[str, Any]]] = None,
    current_date: Optional[Union[str, date, datetime]] = None,
) -> CaseIntelligenceResult:
    """
    Compute full intelligence profile for a single case file.
    """
    case_id = str(case_data.get("id") or case_data.get("case_id") or "UNKNOWN")
    file_number = case_data.get("file_number") or case_data.get("fileNumber")
    title = case_data.get("title")
    current_stage = case_data.get("current_stage") or case_data.get("currentStage")

    # 1. Deadline analysis
    deadline_val = (
        case_data.get("limitation_deadline")
        or case_data.get("limitationDeadline")
        or case_data.get("statutoryDeadlineDate")
    )
    days_rem = calculate_days_remaining(deadline_val, current_date=current_date)
    deadline_status = classify_deadline_status(days_rem)

    # 2. Bottleneck analysis
    bottleneck_info = detect_case_bottleneck(
        case_data, movements=movements, current_date=current_date
    )

    # 3. Risk scoring
    risk_res = calculate_case_risk(
        case_data,
        legal_opinion=legal_opinion,
        movements=movements,
        current_date=current_date,
    )

    # 4. Delay status
    delay_status = determine_delay_status(
        days_rem,
        stage_stagnation_days=risk_res["stage_dwell_days"],
        is_overdue=(days_rem is not None and days_rem < 0),
    )

    # 5. Recommendation
    rec = generate_recommendation(
        risk_level=risk_res["risk_level"],
        deadline_status=deadline_status,
        days_remaining=days_rem,
        bottleneck_info=bottleneck_info,
        legal_opinion=legal_opinion,
        current_stage=current_stage,
    )

    now_iso = (
        normalize_to_date(current_date).isoformat()
        if current_date
        else datetime.now(timezone.utc).isoformat()
    )

    return CaseIntelligenceResult(
        case_id=case_id,
        file_number=file_number,
        title=title,
        risk_score=risk_res["risk_score"],
        risk_level=risk_res["risk_level"],
        frontend_risk_level=risk_res["frontend_risk_level"],
        priority=risk_res["priority"],
        deadline_status=deadline_status,
        delay_status=delay_status,
        days_remaining=days_rem,
        limitation_deadline=str(deadline_val) if deadline_val else None,
        current_stage=current_stage,
        stage_dwell_days=risk_res["stage_dwell_days"],
        bottleneck_stage=bottleneck_info.stage if bottleneck_info else None,
        bottleneck_info=bottleneck_info,
        recommended_action=rec,
        reasons=risk_res["reasons"],
        breakdown=risk_res["breakdown"],
        processed_at=now_iso,
    )


def rank_cases(
    cases: List[Dict[str, Any]],
    movements_by_case: Optional[Dict[str, List[Dict[str, Any]]]] = None,
    legal_opinions_by_case: Optional[Dict[str, Dict[str, Any]]] = None,
    current_date: Optional[Union[str, date, datetime]] = None,
) -> List[Dict[str, Any]]:
    """
    Sort a list of cases by operational urgency.
    
    Ranking Hierarchy:
    1. Overdue cases first (days_remaining < 0)
    2. Descending calculated risk_score
    3. Ascending days_remaining (fewer days left = higher priority)
    4. Descending case age (older cases prioritized)
    """
    movements_map = movements_by_case or {}
    opinions_map = legal_opinions_by_case or {}

    evaluated = []
    for c in cases:
        c_id = str(c.get("id") or c.get("case_id") or "")
        movs = movements_map.get(c_id)
        op = opinions_map.get(c_id)
        
        intel = compute_case_intelligence(
            c, legal_opinion=op, movements=movs, current_date=current_date
        )
        age = calculate_case_age(c.get("created_at"), current_date=current_date)

        days_rem = intel.days_remaining
        is_overdue = 1 if (days_rem is not None and days_rem < 0) else 0
        # If days_rem is None, treat as far future for sorting
        sort_days = days_rem if days_rem is not None else 99999

        # Store enriched copy for return
        enriched_case = dict(c)
        enriched_case["intelligence"] = intel.model_dump()
        enriched_case["riskScore"] = intel.risk_score
        enriched_case["riskLevel"] = intel.frontend_risk_level
        enriched_case["priority"] = intel.priority
        enriched_case["daysRemaining"] = intel.days_remaining
        enriched_case["ageDays"] = age

        evaluated.append({
            "case": enriched_case,
            "is_overdue": is_overdue,
            "risk_score": intel.risk_score,
            "sort_days": sort_days,
            "age": age,
        })

    # Sort:
    # 1. is_overdue DESC (1 before 0)
    # 2. risk_score DESC
    # 3. sort_days ASC
    # 4. age DESC
    evaluated.sort(
        key=lambda item: (
            -item["is_overdue"],
            -item["risk_score"],
            item["sort_days"],
            -item["age"],
        )
    )

    return [item["case"] for item in evaluated]


def aggregate_dashboard_intelligence(
    cases: List[Dict[str, Any]],
    movements_by_case: Optional[Dict[str, List[Dict[str, Any]]]] = None,
    legal_opinions_by_case: Optional[Dict[str, Dict[str, Any]]] = None,
    current_date: Optional[Union[str, date, datetime]] = None,
) -> DashboardIntelligenceSummary:
    """
    Compute aggregate executive intelligence metrics across a case dataset.
    """
    movements_map = movements_by_case or {}
    opinions_map = legal_opinions_by_case or {}

    total = len(cases)
    active = 0
    pending = 0
    crit_risk = 0
    high_risk = 0
    med_risk = 0
    low_risk = 0
    overdue = 0
    approaching = 0
    watch = 0
    delayed = 0
    lo_pending = 0
    stage_bottleneck_counts: Dict[str, int] = {}
    dept_bottlenecks: Dict[str, int] = {}

    for c in cases:
        c_id = str(c.get("id") or c.get("case_id") or "")
        movs = movements_map.get(c_id)
        op = opinions_map.get(c_id)

        intel = compute_case_intelligence(
            c, legal_opinion=op, movements=movs, current_date=current_date
        )
        
        status = str(c.get("status", "")).upper()
        is_terminal = status in TERMINAL_CASE_STATUSES
        if not is_terminal:
            active += 1

        if status in ("REGISTERED", "PENDING", "RECEIVED", "UNDER_SCRUTINY"):
            pending += 1

        # Risk level tallies
        if intel.risk_level == RISK_LEVEL_CRITICAL:
            crit_risk += 1
        elif intel.risk_level == RISK_LEVEL_HIGH:
            high_risk += 1
        elif intel.risk_level == RISK_LEVEL_MEDIUM:
            med_risk += 1
        else:
            low_risk += 1

        # Deadline & Delay tallies (active operational cases only)
        if not is_terminal:
            if intel.deadline_status == DEADLINE_STATUS_OVERDUE:
                overdue += 1
            elif intel.deadline_status in (DEADLINE_STATUS_CRITICAL, "DUE_TODAY"):
                approaching += 1
            elif intel.deadline_status in (DEADLINE_STATUS_HIGH, DEADLINE_STATUS_WATCH):
                watch += 1

            if intel.delay_status in (DELAY_STATUS_DELAYED, DELAY_STATUS_OVERDUE):
                delayed += 1

        # Legal opinion check
        if not is_terminal:
            if op:
                lo_st = str(op.get("status", "")).upper()
                if lo_st in ("REQUESTED", "OVERDUE", "PENDING"):
                    lo_pending += 1
            elif c.get("current_stage") in ("Legal Review", "LEGAL_REVIEW", "LEGAL_OPINION"):
                lo_pending += 1

        # Bottlenecks
        if intel.bottleneck_info and not is_terminal:
            st = intel.bottleneck_info.stage
            stage_bottleneck_counts[st] = stage_bottleneck_counts.get(st, 0) + 1
            dept = intel.bottleneck_info.responsible_department or c.get("department", "General")
            dept_bottlenecks[dept] = dept_bottlenecks.get(dept, 0) + 1

    primary_stage = None
    primary_count = 0
    if stage_bottleneck_counts:
        primary_stage = max(stage_bottleneck_counts, key=stage_bottleneck_counts.get)
        primary_count = stage_bottleneck_counts[primary_stage]

    now_iso = (
        normalize_to_date(current_date).isoformat()
        if current_date
        else datetime.now(timezone.utc).isoformat()
    )

    return DashboardIntelligenceSummary(
        total_cases=total,
        active_cases=active,
        pending_cases=pending,
        critical_risk_cases=crit_risk,
        high_risk_cases=high_risk,
        medium_risk_cases=med_risk,
        low_risk_cases=low_risk,
        overdue_cases=overdue,
        approaching_deadline_cases=approaching,
        watch_deadline_cases=watch,
        delayed_cases=delayed,
        legal_opinion_pending=lo_pending,
        primary_bottleneck_stage=primary_stage,
        primary_bottleneck_impacted_count=primary_count,
        department_bottlenecks=dept_bottlenecks,
        last_updated=now_iso,
    )
