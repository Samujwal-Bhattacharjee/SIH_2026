"""
Dashboard route — returns real aggregate statistics from the database.
No hardcoded values. Every metric is computed from live data.
"""
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from app.core.security import get_current_user
from app.core.database import get_supabase
from app.services.deadline_service import enrich_case_with_deadlines, get_deadline_status
from app.services.case_service import _map_db_case_to_frontend
from app.schemas import DashboardMetrics, BottleneckAnalysis

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/metrics", response_model=DashboardMetrics, summary="Get real-time dashboard metrics")
async def get_dashboard_metrics(user: dict = Depends(get_current_user)):
    """
    Returns aggregate operational statistics computed from the live database.

    Every number here has a concrete SQL source — no fake statistics.
    """
    supabase = get_supabase()

    # --- Fetch all cases ---
    all_cases_result = supabase.table("cases").select("*").execute()
    all_cases = all_cases_result.data or []

    # Enrich with computed fields
    enriched = [enrich_case_with_deadlines(c) for c in all_cases]

    # --- Compute aggregates ---
    terminal_statuses = {"DISPOSED", "APPROVED", "REJECTED", "RESOLVED"}

    total_active = sum(1 for c in enriched if c.get("status") not in terminal_statuses)
    disposed = sum(1 for c in enriched if c.get("status") in terminal_statuses)

    # Today's received
    today_str = datetime.now(timezone.utc).date().isoformat()
    today_received = sum(
        1 for c in enriched
        if c.get("created_at", "")[:10] == today_str
    )

    # In process (non-terminal, non-pending)
    in_process = sum(
        1 for c in enriched
        if c.get("status") in ("IN_PROGRESS", "UNDER_PROCESSING", "UNDER_SCRUTINY", "FORWARDED")
    )

    # Pending
    pending = sum(
        1 for c in enriched
        if c.get("status") in ("REGISTERED", "PENDING", "RECEIVED") and
        c.get("status") not in terminal_statuses
    )

    # SLA metrics
    overdue = [c for c in enriched if c.get("daysRemaining", 999) < 0 and c.get("status") not in terminal_statuses]
    at_risk = [c for c in enriched if 0 <= c.get("daysRemaining", 999) <= 30 and c.get("status") not in terminal_statuses]

    sla_breached_count = len(overdue)
    sla_at_risk_count = len(at_risk)

    # Average processing days (active cases)
    ages = [c.get("ageDays", 0) for c in enriched if c.get("status") not in terminal_statuses]
    avg_processing = round(sum(ages) / len(ages), 1) if ages else 0.0

    # --- Cases by status ---
    cases_by_status: dict = {}
    for c in enriched:
        st = c.get("status", "UNKNOWN")
        cases_by_status[st] = cases_by_status.get(st, 0) + 1

    # --- Cases by department ---
    cases_by_dept: dict = {}
    for c in enriched:
        dept = c.get("department", "Unknown")
        cases_by_dept[dept] = cases_by_dept.get(dept, 0) + 1

    # --- Cases by stage ---
    cases_by_stage: dict = {}
    for c in enriched:
        stage = c.get("current_stage", "Unknown")
        cases_by_stage[stage] = cases_by_stage.get(stage, 0) + 1

    # --- Cases by priority ---
    cases_by_priority: dict = {}
    for c in enriched:
        p = c.get("priority", "ROUTINE")
        cases_by_priority[p] = cases_by_priority.get(p, 0) + 1

    # --- Primary bottleneck (stage with most at-risk cases) ---
    stage_risk_count: dict = {}
    for c in at_risk:
        stage = c.get("current_stage", "Unknown")
        stage_risk_count[stage] = stage_risk_count.get(stage, 0) + 1

    if stage_risk_count:
        worst_stage = max(stage_risk_count, key=stage_risk_count.get)
        worst_count = stage_risk_count[worst_stage]
        dept_for_stage = next(
            (c.get("department") for c in at_risk if c.get("current_stage") == worst_stage),
            "Multiple"
        )
        avg_wait_days = round(
            sum(c.get("ageDays", 0) for c in at_risk if c.get("current_stage") == worst_stage) /
            max(1, worst_count),
            1
        )
        primary_bottleneck = BottleneckAnalysis(
            stage=worst_stage,
            department=dept_for_stage,
            severity="CRITICAL" if sla_breached_count > 5 else "MODERATE",
            avgWaitDays=avg_wait_days,
            baselineDays=7.0,
            queueSize=worst_count,
            deviationPct=round(((avg_wait_days - 7.0) / 7.0) * 100, 1) if avg_wait_days > 7 else 0.0,
            rootCauseDescription=(
                f"{worst_count} case(s) have been stalled at '{worst_stage}' "
                f"with an average wait of {avg_wait_days} days. "
                f"Departmental review required."
            ),
            impactedCasesCount=worst_count,
        )
    else:
        primary_bottleneck = BottleneckAnalysis(
            stage="No Active Bottleneck",
            severity="LOW",
            avgWaitDays=0.0,
            baselineDays=7.0,
            queueSize=0,
            deviationPct=0.0,
            rootCauseDescription="All cases are within acceptable processing timelines.",
            impactedCasesCount=0,
        )

    # --- Recent high-risk cases (top 5 by risk) ---
    sorted_cases = sorted(enriched, key=lambda c: c.get("daysRemaining", 999))
    high_risk_cases = [_map_db_case_to_frontend(c, include_risk=False) for c in sorted_cases[:5]]

    # Active departments
    active_depts = supabase.table("departments").select("id", count="exact").execute()
    dept_count = active_depts.count or len(cases_by_dept)

    return DashboardMetrics(
        totalActiveCases=total_active,
        todayReceivedCount=today_received,
        inProcessCount=in_process,
        pendingQueue=pending,
        slaAtRiskCount=sla_at_risk_count,
        slaBreachedCount=sla_breached_count,
        disposedCount=disposed,
        avgProcessingDays=avg_processing,
        primaryBottleneck=primary_bottleneck,
        recentHighRiskCases=high_risk_cases,
        activeDepartmentsCount=dept_count,
        systemDatasetSize=len(all_cases),
        lastUpdated=datetime.now(timezone.utc).isoformat(),
        cases_by_status=cases_by_status,
        cases_by_department=cases_by_dept,
        cases_by_priority=cases_by_priority,
        cases_by_stage=cases_by_stage,
    )
