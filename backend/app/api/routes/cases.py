"""
Cases routes — CRUD endpoints for case management.
All business logic delegated to case_service.py.
"""
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query, status
from app.core.security import get_current_user
from app.schemas import (
    CaseCreate, CaseUpdate, CaseForwardRequest, CaseStatusUpdate,
    CaseOut, CaseListResponse
)
from app.services import case_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("", response_model=CaseListResponse, summary="List cases with optional filters")
async def list_cases(
    department: Optional[str] = Query(None, description="Filter by department name"),
    stage: Optional[str] = Query(None, description="Filter by current workflow stage"),
    risk_level: Optional[str] = Query(None, alias="risk_level"),
    priority: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    q: Optional[str] = Query(None, description="Text search across title, file number, applicant"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    user: dict = Depends(get_current_user),
):
    """
    List cases with optional filtering and pagination.
    Officers see all cases (role-based filtering can be added later).
    """
    result = case_service.get_cases(
        department=department,
        stage=stage,
        risk_level=risk_level,
        priority=priority,
        status=status,
        search=q,
        page=page,
        page_size=page_size,
    )
    return result


@router.get("/{case_id}", summary="Get case detail with events and documents")
async def get_case(
    case_id: str,
    user: dict = Depends(get_current_user),
):
    """
    Returns a single case with its complete:
    - File movement timeline (events)
    - Attached documents
    - Computed risk prediction
    """
    case = case_service.get_case_by_id(case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found")
    return case


@router.post("", response_model=CaseOut, status_code=status.HTTP_201_CREATED, summary="Create a new case")
async def create_case(
    body: CaseCreate,
    user: dict = Depends(get_current_user),
):
    """
    Register a new case (inward file docket).
    Automatically:
    - Assigns a file number (GFT/DEPT/YEAR/SEQNO)
    - Calculates limitation deadline
    - Creates initial audit log entry
    - Generates alerts if deadline is near
    """
    try:
        created = case_service.create_case(body.model_dump(), user)
        return created
    except Exception as e:
        logger.error(f"Case creation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Case creation failed: {str(e)}")


@router.put("/{case_id}", response_model=CaseOut, summary="Update case fields")
async def update_case(
    case_id: str,
    body: CaseUpdate,
    user: dict = Depends(get_current_user),
):
    """Update editable fields of an existing case."""
    from app.core.database import get_supabase
    from datetime import datetime, timezone
    supabase = get_supabase()

    existing = supabase.table("cases").select("*").eq("id", case_id).maybe_single().execute()
    if not existing or not getattr(existing, "data", None):
        raise HTTPException(status_code=404, detail="Case not found")

    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    # Map camelCase to snake_case for DB
    field_map = {
        "assignedOfficer": "assigned_officer",
        "currentDesk": "current_desk",
        "statutoryDeadlineDays": "statutory_deadline_days",
        "limitationDays": "limitation_days",
        "limitationDeadline": "limitation_deadline",
    }
    mapped = {}
    for k, v in updates.items():
        db_key = field_map.get(k, k)
        mapped[db_key] = v
    mapped["updated_at"] = datetime.now(timezone.utc).isoformat()

    result = supabase.table("cases").update(mapped).eq("id", case_id).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Update failed")
    return case_service._map_db_case_to_frontend(result.data[0])


@router.post("/{case_id}/forward", response_model=CaseOut, summary="Forward case to another officer/stage")
async def forward_case(
    case_id: str,
    body: CaseForwardRequest,
    user: dict = Depends(get_current_user),
):
    """
    Forward a case to a different officer, desk, or workflow stage.
    Records an entry in case_movements and updates the case record.
    """
    result = case_service.forward_case(
        case_id=case_id,
        user=user,
        target_officer=body.targetOfficer,
        target_desk=body.targetDesk,
        remarks=body.remarks,
        new_stage=body.newStage,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Case not found")
    return result


@router.patch("/{case_id}/status", response_model=CaseOut, summary="Update case status")
async def update_status(
    case_id: str,
    body: CaseStatusUpdate,
    user: dict = Depends(get_current_user),
):
    """Update the status of a case (PENDING, APPROVED, DISPOSED, etc.)."""
    from app.core.database import get_supabase
    from datetime import datetime, timezone
    supabase = get_supabase()

    existing = supabase.table("cases").select("*").eq("id", case_id).maybe_single().execute()
    if not existing or not getattr(existing, "data", None):
        raise HTTPException(status_code=404, detail="Case not found")

    now = datetime.now(timezone.utc).isoformat()
    result = supabase.table("cases").update({
        "status": body.status,
        "updated_at": now,
    }).eq("id", case_id).execute()

    return case_service._map_db_case_to_frontend(result.data[0])


@router.post("/{case_id}/flag", summary="Toggle case flag for review")
async def toggle_flag(
    case_id: str,
    user: dict = Depends(get_current_user),
):
    """Toggle the 'flagged for review' marker on a case."""
    from app.core.database import get_supabase
    supabase = get_supabase()

    existing = supabase.table("cases").select("flagged_for_review").eq("id", case_id).maybe_single().execute()
    if not existing or not getattr(existing, "data", None):
        raise HTTPException(status_code=404, detail="Case not found")

    new_flag = not existing.data.get("flagged_for_review", False)
    supabase.table("cases").update({"flagged_for_review": new_flag}).eq("id", case_id).execute()
    return {"caseId": case_id, "flaggedForReview": new_flag}


@router.delete("/{case_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a case (admin only)")
async def delete_case(
    case_id: str,
    user: dict = Depends(get_current_user),
):
    """Permanently delete a case. Restricted to ADMINISTRATOR role."""
    if user.get("role") != "ADMINISTRATOR":
        raise HTTPException(status_code=403, detail="Only administrators can delete cases")
    from app.core.database import get_supabase
    supabase = get_supabase()
    supabase.table("cases").delete().eq("id", case_id).execute()
