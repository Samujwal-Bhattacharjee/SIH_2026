"""
Projects Routes — Land Acquisition Delay Intelligence API
==========================================================
SIH26017 — Ministry of Rural Development

Endpoints:
- GET  /api/v1/projects                     — List land acquisition projects (with filters)
- GET  /api/v1/projects/{project_id}        — Get project detail (events, docs, prediction)
- POST /api/v1/projects                     — Create new land acquisition project
- PUT  /api/v1/projects/{project_id}        — Update project fields
- GET  /api/v1/projects/{project_id}/prediction     — ML delay prediction & probability
- GET  /api/v1/projects/{project_id}/bottlenecks    — Stage bottleneck analysis
- GET  /api/v1/projects/{project_id}/delay-factors  — Observed process factors & ML feature importance
- GET  /api/v1/projects/{project_id}/recommendations — Actionable administrative recommendations
- GET  /api/v1/projects/{project_id}/timeline       — Expected vs actual stage timeline
- POST /api/v1/projects/{project_id}/documents      — Attach document to project
"""
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File, Form, status
from pydantic import BaseModel, Field

from app.core.security import get_current_user
from app.core.database import get_supabase
from app.core.land_workflow import (
    LAND_ACQUISITION_STAGES,
    STAGE_EXPECTED_DAYS,
    get_expected_days,
    get_stage_index,
    get_risk_level_from_probability,
)
from app.services import case_service
from app.services.prediction.predict import predict_delay
from app.services.prediction.model_loader import get_metrics, get_feature_importance, is_model_ready
from app.services.intelligence.bottleneck_engine import detect_case_bottleneck, calculate_stage_dwell_days
from app.services.intelligence.recommendation_engine import generate_la_recommendations

logger = logging.getLogger(__name__)
router = APIRouter()


# ============================================================
# SCHEMAS FOR PROJECTS API
# ============================================================

class LandProjectCreate(BaseModel):
    title: str = Field(..., description="Project name / description")
    project_code: Optional[str] = None
    state: Optional[str] = "Maharashtra"
    district: Optional[str] = "Nashik"
    department: Optional[str] = "Land Revenue"
    current_stage: Optional[str] = "Preliminary Notification"
    total_parcels: Optional[int] = 0
    total_area: Optional[float] = 0.0
    documentation_completeness: Optional[float] = 100.0
    legal_dispute: Optional[bool] = False
    ownership_conflict: Optional[bool] = False
    compensation_pending_days: Optional[int] = 0
    rr_status: Optional[str] = "NOT_APPLICABLE"
    inter_dept_dependency: Optional[bool] = False
    pending_approvals: Optional[int] = 0
    assigned_officer: Optional[str] = "Unassigned"
    statutory_deadline_days: Optional[int] = 180


class LandProjectUpdate(BaseModel):
    title: Optional[str] = None
    project_code: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    current_stage: Optional[str] = None
    status: Optional[str] = None
    total_parcels: Optional[int] = None
    completed_parcels: Optional[int] = None
    total_area: Optional[float] = None
    documentation_completeness: Optional[float] = None
    legal_dispute: Optional[bool] = None
    ownership_conflict: Optional[bool] = None
    compensation_pending_days: Optional[int] = None
    rr_status: Optional[str] = None
    rr_delay_days: Optional[int] = None
    inter_dept_dependency: Optional[bool] = None
    pending_approvals: Optional[int] = None
    assigned_officer: Optional[str] = None


def _enrich_project_with_ml(row: dict) -> dict:
    """Enrich a project DB row with real ML prediction and computed fields."""
    pred = predict_delay(row)
    row["delay_probability"] = pred["delay_probability"]
    row["predicted_delay_days"] = pred["predicted_delay_days"]
    row["ml_risk_level"] = pred["risk_level"]
    row["model_version"] = pred["model_version"]
    return row


# ============================================================
# 1. LIST PROJECTS
# ============================================================
@router.get("", summary="List land acquisition projects with filters")
async def list_projects(
    district: Optional[str] = Query(None, description="Filter by district"),
    state: Optional[str] = Query(None, description="Filter by state"),
    stage: Optional[str] = Query(None, description="Filter by acquisition stage"),
    risk_level: Optional[str] = Query(None, alias="risk_level"),
    status: Optional[str] = Query(None),
    q: Optional[str] = Query(None, description="Search project name, code, district"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    query = supabase.table("cases").select("*")

    if district and district != "ALL":
        query = query.eq("district", district)
    if state and state != "ALL":
        query = query.eq("state", state)
    if stage and stage != "ALL":
        query = query.eq("current_stage", stage)
    if status and status != "ALL":
        query = query.eq("status", status)
    if q:
        query = query.or_(
            f"title.ilike.%{q}%,"
            f"file_number.ilike.%{q}%,"
            f"district.ilike.%{q}%,"
            f"project_code.ilike.%{q}%"
        )

    result = query.order("created_at", desc=True).execute()
    rows = result.data or []

    # Enrich each with ML prediction and map to frontend format
    projects = []
    for r in rows:
        enriched_row = _enrich_project_with_ml(r)
        # Apply risk_level filter if specified
        if risk_level and risk_level != "ALL":
            if enriched_row.get("ml_risk_level") != risk_level:
                continue
        mapped = case_service._map_db_case_to_frontend(enriched_row)
        # Add LA fields
        mapped["projectCode"] = enriched_row.get("project_code") or enriched_row.get("file_number")
        mapped["district"] = enriched_row.get("district")
        mapped["state"] = enriched_row.get("state", "Maharashtra")
        mapped["totalParcels"] = enriched_row.get("total_parcels", 0)
        mapped["completedParcels"] = enriched_row.get("completed_parcels", 0)
        mapped["totalArea"] = enriched_row.get("total_area", 0.0)
        mapped["documentationCompleteness"] = enriched_row.get("documentation_completeness", 100.0)
        mapped["legalDispute"] = enriched_row.get("legal_dispute", False)
        mapped["ownershipConflict"] = enriched_row.get("ownership_conflict", False)
        mapped["compensationPendingDays"] = enriched_row.get("compensation_pending_days", 0)
        mapped["rrStatus"] = enriched_row.get("rr_status", "NOT_APPLICABLE")
        mapped["interDeptDependency"] = enriched_row.get("inter_dept_dependency", False)
        mapped["delayProbability"] = enriched_row.get("delay_probability", 0.0)
        mapped["predictedDelayDays"] = enriched_row.get("predicted_delay_days", 0)
        mapped["mlRiskLevel"] = enriched_row.get("ml_risk_level", "LOW")
        mapped["modelVersion"] = enriched_row.get("model_version", "land-delay-rf-v1")
        projects.append(mapped)

    start_idx = (page - 1) * page_size
    paged = projects[start_idx : start_idx + page_size]

    return {
        "projects": paged,
        "cases": paged,  # Alias for backward compatibility
        "total": len(projects),
        "page": page,
        "pageSize": page_size,
    }


# ============================================================
# 2. GET PROJECT DETAIL
# ============================================================
@router.get("/{project_id}", summary="Get complete project details")
async def get_project(
    project_id: str,
    user: dict = Depends(get_current_user),
):
    case = case_service.get_case_by_id(project_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found")

    # Run ML prediction on the live project data
    pred = predict_delay(case)
    case["delayProbability"] = pred["delay_probability"]
    case["predictedDelayDays"] = pred["predicted_delay_days"]
    case["mlRiskLevel"] = pred["risk_level"]
    case["modelVersion"] = pred["model_version"]
    case["topFactors"] = pred["top_factors"]
    return case


# ============================================================
# 3. CREATE PROJECT
# ============================================================
@router.post("", status_code=status.HTTP_201_CREATED, summary="Create a new land acquisition project")
async def create_project(
    body: LandProjectCreate,
    user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    now = datetime.now(timezone.utc).isoformat()
    code = body.project_code or f"LA-{datetime.now().strftime('%Y%m')}-{datetime.now().microsecond % 9000 + 1000}"

    db_row = {
        "title": body.title,
        "file_number": code,
        "project_code": code,
        "case_type": "Land Acquisition",
        "department": body.department or "Land Revenue",
        "current_stage": body.current_stage or "Project Initiation",
        "state": body.state or "Maharashtra",
        "district": body.district or "Nashik",
        "total_parcels": body.total_parcels or 0,
        "completed_parcels": 0,
        "total_area": body.total_area or 0.0,
        "documentation_completeness": body.documentation_completeness or 100.0,
        "legal_dispute": body.legal_dispute or False,
        "ownership_conflict": body.ownership_conflict or False,
        "compensation_pending_days": body.compensation_pending_days or 0,
        "rr_status": body.rr_status or "NOT_APPLICABLE",
        "inter_dept_dependency": body.inter_dept_dependency or False,
        "pending_approvals": body.pending_approvals or 0,
        "assigned_officer": body.assigned_officer or "Unassigned",
        "statutory_deadline_days": body.statutory_deadline_days or 180,
        "status": "REGISTERED",
        "created_at": now,
        "updated_at": now,
    }

    # Run ML prediction to set initial risk
    pred = predict_delay(db_row)
    db_row["delay_probability"] = pred["delay_probability"]
    db_row["predicted_delay_days"] = pred["predicted_delay_days"]
    db_row["ml_risk_level"] = pred["risk_level"]
    db_row["model_version"] = pred["model_version"]

    res = supabase.table("cases").insert(db_row).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to create project")

    # Initial stage movement
    supabase.table("case_movements").insert({
        "case_id": res.data[0]["id"],
        "from_stage": None,
        "to_stage": db_row["current_stage"],
        "assigned_to": db_row["assigned_officer"],
        "remarks": "Project registered in Land Acquisition Delay Intelligence Platform",
        "started_at": now,
        "status": "IN_PROGRESS",
    }).execute()

    return case_service._map_db_case_to_frontend(res.data[0])


# ============================================================
# 4. UPDATE PROJECT
# ============================================================
@router.put("/{project_id}", summary="Update project parameters")
async def update_project(
    project_id: str,
    body: LandProjectUpdate,
    user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    existing = supabase.table("cases").select("*").eq("id", project_id).maybe_single().execute()
    if not existing or not getattr(existing, "data", None):
        raise HTTPException(status_code=404, detail="Project not found")

    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()

    # Re-evaluate ML prediction on updated state
    merged = {**existing.data, **updates}
    pred = predict_delay(merged)
    updates["delay_probability"] = pred["delay_probability"]
    updates["predicted_delay_days"] = pred["predicted_delay_days"]
    updates["ml_risk_level"] = pred["risk_level"]

    res = supabase.table("cases").update(updates).eq("id", project_id).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Update failed")

    return case_service._map_db_case_to_frontend(res.data[0])


# ============================================================
# 5. PREDICTION ENDPOINT
# ============================================================
@router.get("/{project_id}/prediction", summary="Get ML delay prediction for project")
async def get_project_prediction(
    project_id: str,
    user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    res = supabase.table("cases").select("*").eq("id", project_id).maybe_single().execute()
    if not res or not getattr(res, "data", None):
        raise HTTPException(status_code=404, detail="Project not found")

    project = res.data
    pred = predict_delay(project)
    metrics = get_metrics()

    return {
        "project_id": project_id,
        "project_code": project.get("project_code") or project.get("file_number"),
        "project_name": project.get("title"),
        "district": project.get("district"),
        "current_stage": project.get("current_stage"),
        "delay_probability": pred["delay_probability"],
        "risk_level": pred["risk_level"],
        "predicted_delay_days": pred["predicted_delay_days"],
        "model_version": pred["model_version"],
        "model_available": pred["model_available"],
        "top_factors": pred["top_factors"],
        "feature_vector": pred["feature_vector"],
        "model_metrics": {
            "accuracy": metrics.get("accuracy"),
            "precision": metrics.get("precision"),
            "recall": metrics.get("recall"),
            "f1": metrics.get("f1"),
            "roc_auc": metrics.get("roc_auc"),
        } if metrics else None,
        "disclaimer": "Predicted delay probability calculated by RandomForestClassifier trained on synthetic historical land acquisition dataset.",
    }


# ============================================================
# 6. BOTTLENECKS ENDPOINT
# ============================================================
@router.get("/{project_id}/bottlenecks", summary="Detect stage bottlenecks for project")
async def get_project_bottlenecks(
    project_id: str,
    user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    case_res = supabase.table("cases").select("*").eq("id", project_id).maybe_single().execute()
    if not case_res or not getattr(case_res, "data", None):
        raise HTTPException(status_code=404, detail="Project not found")

    project = case_res.data
    mov_res = supabase.table("case_movements").select("*").eq("case_id", project_id).order("started_at").execute()
    movements = mov_res.data or []

    current_stage = project.get("current_stage", "Project Initiation")
    dwell_days = calculate_stage_dwell_days(project, movements=movements)
    expected_days = get_expected_days(current_stage)
    bottleneck_info = detect_case_bottleneck(project, movements=movements)

    delay_days = max(0, dwell_days - expected_days)

    return {
        "project_id": project_id,
        "current_stage": current_stage,
        "stage_dwell_days": dwell_days,
        "stage_expected_days": expected_days,
        "stage_delay_days": delay_days,
        "is_bottleneck": bool(bottleneck_info and bottleneck_info.is_bottleneck),
        "severity": bottleneck_info.severity if bottleneck_info else "LOW",
        "bottleneck": {
            "stage": current_stage,
            "expected_days": expected_days,
            "actual_days": dwell_days,
            "delay_days": delay_days,
            "severity": bottleneck_info.severity if bottleneck_info else "LOW",
            "root_cause": bottleneck_info.root_cause_description if bottleneck_info else None,
            "responsible_officer": project.get("assigned_officer"),
        } if (bottleneck_info and bottleneck_info.is_bottleneck) else None,
    }


# ============================================================
# 7. DELAY FACTORS ENDPOINT
# ============================================================
@router.get("/{project_id}/delay-factors", summary="Get explainable delay factors for project")
async def get_project_delay_factors(
    project_id: str,
    user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    res = supabase.table("cases").select("*").eq("id", project_id).maybe_single().execute()
    if not res or not getattr(res, "data", None):
        raise HTTPException(status_code=404, detail="Project not found")

    project = res.data
    pred = predict_delay(project)
    fi = get_feature_importance()

    observed_factors = []
    if project.get("ownership_conflict"):
        observed_factors.append({
            "factor": "ownership_conflict",
            "name": "Ownership Conflict",
            "observed_value": "Active Dispute",
            "status": "CRITICAL",
            "description": "Disputed title / contested ownership on one or more land parcels",
        })
    if project.get("legal_dispute"):
        observed_factors.append({
            "factor": "legal_dispute",
            "name": "Legal Dispute / Court Case",
            "observed_value": "Active Case",
            "status": "CRITICAL",
            "description": "Stay order or writ petition pending in court",
        })
    comp_days = int(project.get("compensation_pending_days") or 0)
    if comp_days > 0:
        observed_factors.append({
            "factor": "compensation_pending_days",
            "name": "Compensation Pending",
            "observed_value": f"{comp_days} days",
            "status": "HIGH" if comp_days > 30 else "MEDIUM",
            "description": "Time elapsed awaiting compensation disbursement sanction",
        })
    doc_comp = float(project.get("documentation_completeness") or 100)
    if doc_comp < 80:
        observed_factors.append({
            "factor": "documentation_completeness",
            "name": "Documentation Completeness",
            "observed_value": f"{doc_comp}%",
            "status": "HIGH" if doc_comp < 60 else "MEDIUM",
            "description": "Missing required cadastral maps, survey approvals, or RoR documents",
        })
    if project.get("inter_dept_dependency"):
        observed_factors.append({
            "factor": "inter_dept_dependency",
            "name": "Inter-Department Dependency",
            "observed_value": "External Dependency Active",
            "status": "MEDIUM",
            "description": "Cross-departmental clearance awaited from Forest/PWD/Revenue",
        })

    return {
        "project_id": project_id,
        "delay_probability": pred["delay_probability"],
        "risk_level": pred["risk_level"],
        "observed_factors": observed_factors,
        "model_feature_importance": [
            {"feature": k, "importance": v} for k, v in list(fi.items())[:6]
        ] if fi else [],
        "note": "Observed process factors are detected directly from current project state. Model feature importance reflects global dataset feature relevance.",
    }


# ============================================================
# 8. RECOMMENDATIONS ENDPOINT
# ============================================================
@router.get("/{project_id}/recommendations", summary="Get actionable recommendations for project")
async def get_project_recommendations(
    project_id: str,
    user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    case_res = supabase.table("cases").select("*").eq("id", project_id).maybe_single().execute()
    if not case_res or not getattr(case_res, "data", None):
        raise HTTPException(status_code=404, detail="Project not found")

    project = case_res.data
    mov_res = supabase.table("case_movements").select("*").eq("case_id", project_id).order("started_at").execute()
    movements = mov_res.data or []

    bottleneck_info = detect_case_bottleneck(project, movements=movements)
    pred = predict_delay(project)
    recs = generate_la_recommendations(
        project,
        bottleneck_info=bottleneck_info,
        delay_probability=pred["delay_probability"],
    )

    return {
        "project_id": project_id,
        "priority": recs["priority"],
        "primary_recommendation": recs["primary_recommendation"],
        "recommended_actions": recs["recommended_actions"],
    }


# ============================================================
# 9. TIMELINE ENDPOINT
# ============================================================
@router.get("/{project_id}/timeline", summary="Get stage timeline with expected vs actual durations")
async def get_project_timeline(
    project_id: str,
    user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    case_res = supabase.table("cases").select("*").eq("id", project_id).maybe_single().execute()
    if not case_res or not getattr(case_res, "data", None):
        raise HTTPException(status_code=404, detail="Project not found")

    project = case_res.data
    mov_res = supabase.table("case_movements").select("*").eq("case_id", project_id).order("started_at").execute()
    movements = mov_res.data or []

    current_stage = project.get("current_stage", "Project Initiation")
    curr_stage_idx = get_stage_index(current_stage)

    # Build timeline stages
    timeline_stages = []
    for idx, stage_name in enumerate(LAND_ACQUISITION_STAGES):
        expected = get_expected_days(stage_name)
        # Find corresponding movement if any
        matching_mov = next((m for m in movements if m.get("to_stage") == stage_name or m.get("from_stage") == stage_name), None)

        if idx < curr_stage_idx:
            # Completed stage
            actual = expected  # baseline default
            if matching_mov and matching_mov.get("completed_at") and matching_mov.get("started_at"):
                try:
                    s_dt = datetime.fromisoformat(matching_mov["started_at"][:19])
                    c_dt = datetime.fromisoformat(matching_mov["completed_at"][:19])
                    actual = max(1, (c_dt - s_dt).days)
                except Exception:
                    actual = expected
            stage_status = "COMPLETED"
            delay = max(0, actual - expected)
        elif idx == curr_stage_idx:
            # Current stage in progress
            actual = calculate_stage_dwell_days(project, movements=movements)
            stage_status = "IN_PROGRESS"
            delay = max(0, actual - expected)
        else:
            # Future stage
            actual = 0
            stage_status = "UPCOMING"
            delay = 0

        timeline_stages.append({
            "stage_index": idx,
            "stage_name": stage_name,
            "status": stage_status,
            "expected_days": expected,
            "actual_days": actual,
            "delay_days": delay,
            "is_delayed": delay > 0,
            "is_current": (idx == curr_stage_idx),
        })

    return {
        "project_id": project_id,
        "current_stage": current_stage,
        "total_stages": len(LAND_ACQUISITION_STAGES),
        "stages": timeline_stages,
    }


# ============================================================
# 10. ATTACH DOCUMENT & RECALCULATE PREDICTION
# ============================================================
@router.post("/{project_id}/documents", summary="Upload and attach document to project with auto OCR")
async def upload_project_document(
    project_id: str,
    file: UploadFile = File(...),
    document_type: str = Form("Land Document"),
    user: dict = Depends(get_current_user),
):
    from app.services.document_service import upload_document, validate_file, process_ocr

    file_bytes = await file.read()
    val_err = validate_file(file.filename, file.content_type, len(file_bytes))
    if val_err:
        raise HTTPException(status_code=400, detail=val_err)

    doc_record = upload_document(
        file_bytes=file_bytes,
        filename=file.filename,
        content_type=file.content_type,
        case_id=project_id,
        document_type=document_type,
        uploaded_by=user.get("name", "Officer"),
    )

    # Process OCR automatically
    ocr_result = None
    try:
        ocr_result = process_ocr(doc_record["id"])
    except Exception as e:
        logger.warning(f"Auto OCR failed: {e}")

    # If OCR extracted land acquisition fields, update project data!
    extracted_fields = (ocr_result or {}).get("extractedFields", [])
    fields_dict = {f["key"]: f["value"] for f in extracted_fields if isinstance(f, dict) and "key" in f}

    updates = {}
    if "ownership_conflict" in fields_dict:
        val = str(fields_dict["ownership_conflict"]).lower()
        updates["ownership_conflict"] = val in ("true", "1", "yes")
    if "legal_dispute" in fields_dict:
        val = str(fields_dict["legal_dispute"]).lower()
        updates["legal_dispute"] = val in ("true", "1", "yes")
    if "survey_number" in fields_dict:
        updates["subject"] = f"Survey No. {fields_dict['survey_number']}"

    if updates:
        supabase = get_supabase()
        supabase.table("cases").update(updates).eq("id", project_id).execute()

    return {
        "document": doc_record,
        "ocrResult": ocr_result,
        "projectUpdated": bool(updates),
        "appliedUpdates": updates,
    }
