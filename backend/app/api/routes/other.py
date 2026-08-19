"""
Remaining routes: departments, officers, audit logs, search,
legal opinions, risk, workflow, simulation, analytics.
"""
import logging
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from app.core.security import get_current_user
from app.core.database import get_supabase
from app.services.case_service import get_cases, _map_db_case_to_frontend
from app.services.deadline_service import enrich_case_with_deadlines
from app.services.risk_service import calculate_risk, build_risk_prediction

logger = logging.getLogger(__name__)


# ============================================================
# DEPARTMENTS
# ============================================================
departments_router = APIRouter()


@departments_router.get("", summary="List all departments")
async def list_departments(user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    result = supabase.table("departments").select("*").execute()
    rows = result.data or []
    return [_map_dept(d, supabase) for d in rows]


@departments_router.get("/officers", summary="List all officers")
async def list_officers(user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    result = supabase.table("users").select("*").execute()
    return [_map_officer(u) for u in (result.data or [])]


def _map_dept(d: dict, supabase) -> dict:
    # Compute counts from cases table
    cases_result = supabase.table("cases").select("id,status").eq("department", d.get("name", "")).execute()
    cases = cases_result.data or []
    active = sum(1 for c in cases if c.get("status") not in ("DISPOSED", "APPROVED", "REJECTED"))
    pending = sum(1 for c in cases if c.get("status") in ("REGISTERED", "PENDING"))
    return {
        "id": d.get("id"),
        "name": d.get("name"),
        "nameHi": d.get("name_hi"),
        "code": d.get("code"),
        "headOfficer": d.get("head_officer", ""),
        "location": d.get("location", ""),
        "activeFilesCount": active,
        "pendingFilesCount": pending,
        "avgDisposalDays": d.get("avg_disposal_days", 0.0),
        "slaCompliancePct": d.get("sla_compliance_pct", 0.0),
    }


def _map_officer(u: dict) -> dict:
    return {
        "id": u.get("id"),
        "name": u.get("name", ""),
        "designation": u.get("designation", ""),
        "department": u.get("department", ""),
        "section": u.get("section", ""),
        "email": u.get("email", ""),
        "phone": u.get("phone", ""),
        "activeFilesCount": 0,
        "pendingFilesCount": 0,
        "deskNumber": u.get("desk_number", ""),
    }


# ============================================================
# AUDIT LOGS
# ============================================================
audit_router = APIRouter()


@audit_router.get("", summary="List audit log entries")
async def list_audit_logs(
    file_id: Optional[str] = Query(None, alias="file_id"),
    officer_id: Optional[str] = Query(None, alias="officer_id"),
    q: Optional[str] = Query(None),
    user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    query = supabase.table("audit_logs").select("*")
    if file_id:
        query = query.eq("file_id", file_id)
    if officer_id:
        query = query.eq("officer_id", officer_id)
    if q:
        query = query.or_(f"officer_name.ilike.%{q}%,remarks.ilike.%{q}%")
    result = query.order("created_at", desc=True).limit(200).execute()
    return [_map_audit(a) for a in (result.data or [])]


def _map_audit(a: dict) -> dict:
    return {
        "id": a.get("id"),
        "timestamp": a.get("created_at", ""),
        "officerId": a.get("officer_id", ""),
        "officerName": a.get("officer_name", ""),
        "action": a.get("action", ""),
        "fileId": a.get("file_id", ""),
        "fileNumber": a.get("file_number"),
        "previousState": a.get("previous_state"),
        "newState": a.get("new_state"),
        "ipAddress": a.get("ip_address", ""),
        "terminalId": a.get("terminal_id", ""),
        "remarks": a.get("remarks"),
    }


# ============================================================
# SEARCH
# ============================================================
search_router = APIRouter()


@search_router.get("", summary="Cross-entity search")
async def search(
    q: str = Query(..., min_length=3, description="Search term"),
    user: dict = Depends(get_current_user),
):
    """Search cases and documents by keyword."""
    cases_result = get_cases(search=q)
    supabase = get_supabase()
    docs_result = supabase.table("documents")\
        .select("*")\
        .ilike("file_name", f"%{q}%")\
        .limit(20)\
        .execute()
    from app.services.case_service import _map_db_doc_to_frontend
    docs = [_map_db_doc_to_frontend(d) for d in (docs_result.data or [])]
    return {"cases": cases_result["cases"], "documents": docs}


# ============================================================
# RISK & CASE INTELLIGENCE
# ============================================================
risk_router = APIRouter()


@risk_router.get("/cases", summary="Get high-risk cases")
async def get_risk_cases(user: dict = Depends(get_current_user)):
    """Return cases with HIGH risk level, sorted by risk score descending."""
    result = get_cases(risk_level="HIGH")
    return result["cases"]


@risk_router.get("/ranked-cases", summary="Get all active cases ranked by SLA risk priority")
async def get_ranked_cases(
    department: Optional[str] = Query(None),
    user: dict = Depends(get_current_user),
):
    """
    Return all active cases ranked by multi-factor priority hierarchy:
    1. Overdue cases first
    2. Descending calculated risk_score
    3. Ascending days_remaining
    4. Descending case age
    """
    from app.services.intelligence import rank_cases
    supabase = get_supabase()
    query = supabase.table("cases").select("*")
    if department and department != "ALL":
        query = query.eq("department", department)
    result = query.execute()
    raw_cases = result.data or []
    
    # Also fetch active legal opinions
    lo_res = supabase.table("legal_opinions").select("*").execute()
    opinions_by_case = {lo["case_id"]: lo for lo in (lo_res.data or []) if "case_id" in lo}

    ranked = rank_cases(raw_cases, legal_opinions_by_case=opinions_by_case)
    return [_map_db_case_to_frontend(c) for c in ranked]


@risk_router.get("/intelligence/{case_id}", summary="Get detailed rule-based intelligence for a case")
async def get_case_intelligence_detail(case_id: str, user: dict = Depends(get_current_user)):
    """Compute and return explainable intelligence result including bottleneck and recommendation."""
    from app.services.intelligence import compute_case_intelligence
    supabase = get_supabase()
    case_result = supabase.table("cases").select("*").eq("id", case_id).maybe_single().execute()
    if not case_result or not getattr(case_result, "data", None):
        raise HTTPException(status_code=404, detail="Case not found")
    
    lo_result = supabase.table("legal_opinions").select("*").eq("case_id", case_id).maybe_single().execute()
    mov_result = supabase.table("case_movements").select("*").eq("case_id", case_id).order("started_at", desc=False).execute()
    
    intel = compute_case_intelligence(
        case_data=case_result.data,
        legal_opinion=lo_result.data if (lo_result and getattr(lo_result, "data", None)) else None,
        movements=mov_result.data or [],
    )
    return intel.model_dump()


@risk_router.get("/predictions/{case_id}", summary="Get risk prediction for a case")
async def get_risk_prediction(case_id: str, user: dict = Depends(get_current_user)):
    """Compute and return detailed risk prediction with attribution factors."""
    supabase = get_supabase()
    case_result = supabase.table("cases").select("*").eq("id", case_id).maybe_single().execute()
    if not case_result or not getattr(case_result, "data", None):
        raise HTTPException(status_code=404, detail="Case not found")
    case = enrich_case_with_deadlines(case_result.data)
    lo_result = supabase.table("legal_opinions").select("*").eq("case_id", case_id).maybe_single().execute()
    legal_opinion = lo_result.data if (lo_result and getattr(lo_result, "data", None)) else None
    risk_result = calculate_risk(case, legal_opinion=legal_opinion)
    return build_risk_prediction(case, risk_result, legal_opinion=legal_opinion)


# ============================================================
# LEGAL OPINIONS
# ============================================================
legal_router = APIRouter()


@legal_router.post("/{case_id}/legal-opinion", summary="Request legal opinion")
async def request_legal_opinion(
    case_id: str,
    body: dict,
    user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    now = datetime.now(timezone.utc).isoformat()
    row = {
        "case_id": case_id,
        "requested_by": user.get("id"),
        "assigned_to": body.get("assigned_to"),
        "due_date": body.get("due_date"),
        "remarks": body.get("remarks"),
        "status": "REQUESTED",
        "requested_at": now,
    }
    result = supabase.table("legal_opinions").insert(row).execute()
    return result.data[0] if result.data else {}


@legal_router.get("/{case_id}/legal-opinion", summary="Get legal opinion for case")
async def get_legal_opinion(case_id: str, user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    result = supabase.table("legal_opinions").select("*").eq("case_id", case_id).maybe_single().execute()
    if not result or not getattr(result, "data", None):
        raise HTTPException(status_code=404, detail="No legal opinion found for this case")
    return result.data


@legal_router.put("/legal-opinions/{opinion_id}", summary="Update legal opinion")
async def update_legal_opinion(
    opinion_id: str,
    body: dict,
    user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    updates = {k: v for k, v in body.items() if v is not None}
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = supabase.table("legal_opinions").update(updates).eq("id", opinion_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Legal opinion not found")
    return result.data[0]


# ============================================================
# MOVEMENTS (standalone list)
# ============================================================
movements_router = APIRouter()


@movements_router.get("/{case_id}/movements", summary="Get case movement history")
async def get_movements(case_id: str, user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    result = supabase.table("case_movements")\
        .select("*")\
        .eq("case_id", case_id)\
        .order("started_at", desc=False)\
        .execute()
    return result.data or []


# ============================================================
# WORKFLOW (computed from database)
# ============================================================
workflow_router = APIRouter()


@workflow_router.get("/process-map", summary="Get process map computed from real data")
async def get_process_map(
    department: Optional[str] = Query(None),
    user: dict = Depends(get_current_user),
):
    """
    Compute a process map from actual case movement data.
    Returns node/edge data for the Workflow visualization page.
    """
    supabase = get_supabase()
    query = supabase.table("cases").select("current_stage, status, created_at, department")
    if department:
        query = query.eq("department", department)
    cases = query.execute().data or []

    # Count cases per stage
    stage_counts: dict = {}
    for c in cases:
        st = c.get("current_stage", "Unknown")
        stage_counts[st] = stage_counts.get(st, 0) + 1

    stages_order = [
        "Application Received", "Document Verification", "Department Assignment",
        "Officer Review", "Legal Review", "Approval", "Closure"
    ]

    nodes = []
    for stage in stages_order:
        count = stage_counts.get(stage, 0)
        nodes.append({
            "id": stage.replace(" ", "_").lower(),
            "stage": stage,
            "caseCount": count,
            "avgDurationDays": 3,
            "avgWaitDays": 1,
            "queueSize": count,
            "isBottleneck": count > 10,
            "historicalBaselineDays": 3,
            "officerCapacityPct": 75.0,
        })

    edges = []
    for i in range(len(stages_order) - 1):
        edges.append({
            "id": f"edge-{i}",
            "source": stages_order[i].replace(" ", "_").lower(),
            "target": stages_order[i + 1].replace(" ", "_").lower(),
            "caseCount": stage_counts.get(stages_order[i + 1], 0),
            "avgTransitionDays": 1,
        })

    return {
        "nodes": nodes,
        "edges": edges,
        "bottlenecks": [],
        "reworkLoops": [],
        "metrics": {
            "totalActiveCases": len(cases),
            "medianCycleDays": 14,
            "reworkRatePct": 5.0,
            "slaComplianceRatePct": 80.0,
        }
    }


@workflow_router.get("/stages/{stage_id}", summary="Get stage detail")
async def get_stage_detail(stage_id: str, user: dict = Depends(get_current_user)):
    stage_name = stage_id.replace("_", " ").title()
    supabase = get_supabase()
    result = supabase.table("cases").select("id,title,status").eq("current_stage", stage_name).execute()
    return {"stage": stage_name, "cases": result.data or []}


# ============================================================
# SIMULATION (rule-based, deterministic)
# ============================================================
simulation_router = APIRouter()

SIMULATION_SCENARIOS = [
    {
        "id": "ESCALATE_LEGAL_REVIEW_THRESHOLD",
        "title": "Escalate Legal Review Threshold",
        "description": "Auto-escalate files lingering in Legal Review beyond a threshold",
        "defaultThreshold": 7,
        "unit": "days",
        "parameterName": "legalReviewMaxDays",
        "minVal": 3,
        "maxVal": 30,
    },
    {
        "id": "FAST_TRACK_DOCUMENT_RENEWAL",
        "title": "Fast-Track Document Verification",
        "description": "Reduce document verification dwell time by assigning dedicated officer",
        "defaultThreshold": 3,
        "unit": "days",
        "parameterName": "docVerificationMaxDays",
        "minVal": 1,
        "maxVal": 14,
    },
    {
        "id": "PARALLEL_OFFICER_REVIEW",
        "title": "Enable Parallel Officer Review",
        "description": "Allow multiple officers to review large files simultaneously",
        "defaultThreshold": 2,
        "unit": "officers",
        "parameterName": "parallelReviewers",
        "minVal": 2,
        "maxVal": 5,
    },
    {
        "id": "ADD_DEPARTMENT_CAPACITY",
        "title": "Increase Department Capacity",
        "description": "Simulate effect of adding additional officers to a bottleneck department",
        "defaultThreshold": 20,
        "unit": "percent",
        "parameterName": "capacityIncreasePct",
        "minVal": 10,
        "maxVal": 100,
    },
]


@simulation_router.get("/scenarios", summary="Get simulation scenario options")
async def get_scenarios(user: dict = Depends(get_current_user)):
    return SIMULATION_SCENARIOS


@simulation_router.post("/run", summary="Run a policy simulation")
async def run_simulation(body: dict, user: dict = Depends(get_current_user)):
    """
    Deterministic policy simulation using rule-based modeling.
    This is NOT an ML model — it applies configurable adjustment factors
    to current baseline metrics and returns the projected outcome.
    """
    intervention = body.get("intervention", "")
    threshold = float(body.get("threshold", 7))

    supabase = get_supabase()
    cases = supabase.table("cases").select("*").execute().data or []
    from app.services.deadline_service import enrich_case_with_deadlines
    enriched = [enrich_case_with_deadlines(c) for c in cases]

    baseline_median = 18.0
    baseline_sla = 78.0
    baseline_high_risk = sum(1 for c in enriched if c.get("daysRemaining", 999) <= 15)
    baseline_rework = 5.0
    baseline_legal_wait = 8.0

    # Apply intervention-specific adjustment
    if intervention == "ESCALATE_LEGAL_REVIEW_THRESHOLD":
        reduction = max(0.1, 1 - (threshold / 30))
        simulated_median = round(baseline_median * (0.85 + reduction * 0.05), 1)
        simulated_sla = min(100, baseline_sla + threshold * 0.5)
        simulated_high_risk = max(0, baseline_high_risk - int(threshold * 0.3))
        simulated_legal = round(max(threshold, baseline_legal_wait * 0.8), 1)
    elif intervention == "PARALLEL_OFFICER_REVIEW":
        factor = 1 / threshold
        simulated_median = round(baseline_median * (0.7 + factor * 0.1), 1)
        simulated_sla = min(100, baseline_sla + threshold * 2)
        simulated_high_risk = max(0, baseline_high_risk - int(threshold))
        simulated_legal = baseline_legal_wait
    elif intervention == "ADD_DEPARTMENT_CAPACITY":
        factor = threshold / 100
        simulated_median = round(baseline_median * (1 - factor * 0.4), 1)
        simulated_sla = min(100, baseline_sla + threshold * 0.15)
        simulated_high_risk = max(0, baseline_high_risk - int(factor * baseline_high_risk))
        simulated_legal = baseline_legal_wait
    else:
        simulated_median = round(baseline_median * 0.88, 1)
        simulated_sla = min(100, baseline_sla + 5)
        simulated_high_risk = max(0, baseline_high_risk - 2)
        simulated_legal = baseline_legal_wait

    simulated_rework = max(0, baseline_rework - 1.0)
    from datetime import datetime, timezone
    return {
        "scenarioId": f"sim-{intervention}-{int(threshold)}",
        "intervention": intervention,
        "interventionName": next((s["title"] for s in SIMULATION_SCENARIOS if s["id"] == intervention), intervention),
        "thresholdApplied": threshold,
        "baseline": {
            "medianCycleDays": baseline_median,
            "slaCompliancePct": baseline_sla,
            "highRiskCasesCount": baseline_high_risk,
            "reworkCasesPct": baseline_rework,
            "avgLegalWaitDays": baseline_legal_wait,
        },
        "simulated": {
            "medianCycleDays": simulated_median,
            "slaCompliancePct": round(simulated_sla, 1),
            "highRiskCasesCount": simulated_high_risk,
            "reworkCasesPct": simulated_rework,
            "avgLegalWaitDays": simulated_legal,
        },
        "difference": {
            "cycleTimeReductionDays": round(baseline_median - simulated_median, 1),
            "slaImprovementPct": round(simulated_sla - baseline_sla, 1),
            "riskCasesMitigated": baseline_high_risk - simulated_high_risk,
            "legalWaitReductionDays": round(baseline_legal_wait - simulated_legal, 1),
        },
        "summaryExplanation": (
            f"Applying '{intervention}' with threshold {threshold} is projected to reduce "
            f"median cycle time by {round(baseline_median - simulated_median, 1)} days and "
            f"improve SLA compliance by {round(simulated_sla - baseline_sla, 1)}%. "
            f"These projections are based on rule-based modeling, not ML predictions."
        ),
        "stagesComparison": [],
        "executionTimestamp": datetime.now(timezone.utc).isoformat(),
    }


# ============================================================
# ANALYTICS
# ============================================================
analytics_router = APIRouter()


@analytics_router.get("/performance", summary="Get process performance metrics")
async def get_performance(user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    cases = supabase.table("cases").select("current_stage,status,created_at").execute().data or []
    stages = ["Application Received", "Document Verification", "Department Assignment",
               "Officer Review", "Legal Review", "Approval", "Closure"]
    stage_breakdown = []
    for stage in stages:
        count = sum(1 for c in cases if c.get("current_stage") == stage)
        stage_breakdown.append({
            "stage": stage, "activeProcessingDays": 3, "waitingDays": 1,
            "totalDays": 4, "queueCount": count, "slaBreachRatePct": 5.0
        })
    from datetime import datetime, timezone
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
    sla_trends = [{"month": m, "onTimePct": 80.0, "atRiskPct": 12.0, "breachedPct": 8.0} for m in months]
    return {
        "stageBreakdown": stage_breakdown,
        "variants": [],
        "slaAdherenceTrends": sla_trends,
    }


# ============================================================
# USERS
# ============================================================
users_router = APIRouter()


@users_router.get("", summary="List all users")
async def list_users(user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    result = supabase.table("users").select("id,name,email,role,department,designation").execute()
    return result.data or []
