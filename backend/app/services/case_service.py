"""
Case Service — business logic for case management.
Database operations are kept separate from route handlers.
"""
import logging
from datetime import datetime, timezone
from typing import Optional, List
from app.core.database import get_supabase
from app.services.deadline_service import (
    calculate_deadline,
    enrich_case_with_deadlines,
    calculate_age_days,
)
from app.services.risk_service import calculate_risk, build_risk_prediction

logger = logging.getLogger(__name__)


def _map_db_case_to_frontend(row: dict, events: list = None, documents: list = None, include_risk: bool = True) -> dict:
    """
    Map a raw database row to the format expected by the frontend (matches TypeScript Case interface).
    """
    # Compute deadline-derived fields
    row = enrich_case_with_deadlines(row)

    # Risk calculation
    risk_result = calculate_risk(row)
    risk_prediction = None
    if include_risk:
        risk_prediction = build_risk_prediction(row, risk_result)

    return {
        "id": row.get("id"),
        "fileNumber": row.get("file_number"),
        "title": row.get("title"),
        "subject": row.get("subject"),
        "caseType": row.get("case_type", "Administrative"),
        "department": row.get("department"),
        "section": row.get("section"),
        "currentStage": row.get("current_stage", "Application Received"),
        "ageDays": row.get("ageDays", 0),
        "statutoryDeadlineDays": row.get("statutory_deadline_days", 90),
        "daysRemaining": row.get("daysRemaining", 90),
        "riskScore": risk_result["risk_score"],
        "riskLevel": risk_result["risk_level"],
        "status": row.get("status", "REGISTERED"),
        "priority": row.get("daysRemaining") is not None and row.get("priority") or "ROUTINE",
        "applicant": row.get("applicant", ""),
        "origin": row.get("origin"),
        "assignedOfficer": row.get("assigned_officer", "Unassigned"),
        "currentDesk": row.get("current_desk"),
        "flaggedForReview": row.get("flagged_for_review", False),
        "createdAt": row.get("created_at", ""),
        "updatedAt": row.get("updated_at", row.get("created_at", "")),
        "lastMovementDate": row.get("last_movement_date"),
        "documentIds": row.get("document_ids", []),
        "court": row.get("court"),
        "orderDate": row.get("order_date"),
        "receivedDate": row.get("received_date"),
        "limitationDays": row.get("limitation_days"),
        "limitationDeadline": row.get("limitation_deadline"),
        # Land Acquisition fields (SIH26017)
        "projectCode": row.get("project_code") or row.get("file_number"),
        "state": row.get("state", "Maharashtra"),
        "district": row.get("district"),
        "totalParcels": row.get("total_parcels", 0),
        "completedParcels": row.get("completed_parcels", 0),
        "totalArea": row.get("total_area", 0.0),
        "documentationCompleteness": row.get("documentation_completeness", 100.0),
        "legalDispute": row.get("legal_dispute", False),
        "ownershipConflict": row.get("ownership_conflict", False),
        "compensationPendingDays": row.get("compensation_pending_days", 0),
        "rrStatus": row.get("rr_status", "NOT_APPLICABLE"),
        "interDeptDependency": row.get("inter_dept_dependency", False),
        "delayProbability": row.get("delay_probability", 0.0),
        "predictedDelayDays": row.get("predicted_delay_days", 0),
        "mlRiskLevel": row.get("ml_risk_level", "LOW"),
        "modelVersion": row.get("model_version", "land-delay-rf-v1"),
        "events": events,
        "documents": documents,
        "riskPrediction": risk_prediction,
    }


def get_cases(
    department: Optional[str] = None,
    stage: Optional[str] = None,
    risk_level: Optional[str] = None,
    priority: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 50,
) -> dict:
    """
    Fetch cases from the database with optional filters.
    Returns {"cases": [...], "total": int}
    """
    supabase = get_supabase()
    query = supabase.table("cases").select("*")

    if department:
        query = query.eq("department", department)
    if stage:
        query = query.eq("current_stage", stage)
    if status:
        query = query.eq("status", status)
    if search:
        # Simple text search — Supabase supports ilike for partial matches
        query = query.or_(
            f"title.ilike.%{search}%,"
            f"file_number.ilike.%{search}%,"
            f"applicant.ilike.%{search}%,"
            f"court.ilike.%{search}%"
        )

    result = query.order("created_at", desc=True).execute()
    rows = result.data or []

    # Map and enrich
    mapped = [_map_db_case_to_frontend(r, include_risk=False) for r in rows]

    # Apply post-query filters (computed fields like risk_level, priority)
    if risk_level:
        mapped = [c for c in mapped if c["riskLevel"] == risk_level]
    if priority:
        mapped = [c for c in mapped if c["priority"] == priority]

    total = len(mapped)

    # Pagination
    start = (page - 1) * page_size
    paginated = mapped[start : start + page_size]

    return {"cases": paginated, "total": total}


def get_case_by_id(case_id: str) -> Optional[dict]:
    """
    Fetch a single case with its events (movements) and documents.
    """
    supabase = get_supabase()

    # Case
    case_result = supabase.table("cases").select("*").eq("id", case_id).maybe_single().execute()
    if not case_result or not getattr(case_result, "data", None):
        return None
    row = case_result.data

    # Events (movements)
    events_result = supabase.table("case_movements")\
        .select("*")\
        .eq("case_id", case_id)\
        .order("started_at", desc=False)\
        .execute()
    raw_events = events_result.data or []
    events = [_map_movement_to_event(e) for e in raw_events]

    # Documents
    docs_result = supabase.table("documents")\
        .select("*")\
        .eq("case_id", case_id)\
        .order("created_at", desc=True)\
        .execute()
    raw_docs = docs_result.data or []
    documents = [_map_db_doc_to_frontend(d) for d in raw_docs]

    # Legal opinion (for risk calculation)
    lo_result = supabase.table("legal_opinions")\
        .select("*")\
        .eq("case_id", case_id)\
        .not_.in_("status", ["RECEIVED", "CLOSED"])\
        .maybe_single()\
        .execute()
    legal_opinion = lo_result.data if (lo_result and getattr(lo_result, "data", None)) else None

    row = enrich_case_with_deadlines(row)
    risk_result = calculate_risk(row, legal_opinion=legal_opinion, movement_count=len(raw_events))
    risk_prediction = build_risk_prediction(row, risk_result, legal_opinion=legal_opinion)

    case_out = _map_db_case_to_frontend(row, events=events, documents=documents, include_risk=False)
    case_out["riskScore"] = risk_result["risk_score"]
    case_out["riskLevel"] = risk_result["risk_level"]
    case_out["riskPrediction"] = risk_prediction

    return case_out


def create_case(data: dict, created_by_user: dict) -> dict:
    """
    Create a new case record. Automatically:
    - Generates file number
    - Calculates limitation deadline
    - Creates initial audit log
    """
    supabase = get_supabase()
    now = datetime.now(timezone.utc).isoformat()

    # Generate file number if not provided
    file_number = data.get("fileNumber")
    if not file_number:
        dept_code = data.get("department", "GEN")[:3].upper()
        year = datetime.now().year
        # Count existing cases for sequential number
        count_result = supabase.table("cases").select("id", count="exact").execute()
        seq = (count_result.count or 0) + 1
        file_number = f"GFT/{dept_code}/{year}/{seq:06d}"

    # Calculate deadline if limitation info available
    received_date = data.get("receivedDate") or now[:10]
    limitation_days = data.get("limitationDays") or data.get("statutoryDeadlineDays", 90)
    limitation_deadline = data.get("limitationDeadline") or calculate_deadline(received_date, limitation_days)

    db_row = {
        "file_number": file_number,
        "title": data["title"],
        "subject": data.get("subject"),
        "case_type": data.get("caseType", "Administrative"),
        "department": data["department"],
        "section": data.get("section"),
        "current_stage": "Application Received",
        "statutory_deadline_days": limitation_days,
        "status": "REGISTERED",
        "applicant": data.get("applicant", ""),
        "origin": data.get("origin"),
        "assigned_officer": data.get("assignedOfficer") or created_by_user.get("name", "Unassigned"),
        "current_desk": data.get("currentDesk"),
        "flagged_for_review": False,
        "court": data.get("court"),
        "order_date": data.get("orderDate"),
        "received_date": received_date,
        "limitation_days": limitation_days,
        "limitation_deadline": limitation_deadline,
        "document_ids": [],
        "created_at": now,
        "updated_at": now,
    }

    insert_result = supabase.table("cases").insert(db_row).execute()
    created = insert_result.data[0]

    # Audit log
    _create_audit_log(
        supabase=supabase,
        officer_id=created_by_user.get("id"),
        officer_name=created_by_user.get("name", ""),
        action="FILE_REGISTERED",
        file_id=created["id"],
        file_number=file_number,
        new_state="REGISTERED",
        remarks=f"File registered: {data['title']}",
    )

    # Trigger alert check
    from app.services.alert_service import refresh_alerts_for_case
    enriched = enrich_case_with_deadlines(created)
    refresh_alerts_for_case(enriched)

    return _map_db_case_to_frontend(created)


def forward_case(case_id: str, user: dict, target_officer: str, target_desk: str, remarks: str, new_stage: Optional[str] = None) -> Optional[dict]:
    """
    Forward a case to a new officer/desk/stage. Records a movement event.
    """
    supabase = get_supabase()
    now = datetime.now(timezone.utc).isoformat()

    # Get current case
    case_result = supabase.table("cases").select("*").eq("id", case_id).maybe_single().execute()
    if not case_result or not getattr(case_result, "data", None):
        return None
    current = case_result.data

    from_stage = current.get("current_stage", "Application Received")
    to_stage = new_stage or from_stage

    # Record movement
    movement = {
        "case_id": case_id,
        "from_stage": from_stage,
        "to_stage": to_stage,
        "assigned_to": target_officer,
        "remarks": remarks,
        "started_at": now,
        "status": "FORWARDED",
    }
    supabase.table("case_movements").insert(movement).execute()

    # Update case
    update_data = {
        "current_stage": to_stage,
        "assigned_officer": target_officer,
        "current_desk": target_desk,
        "status": "FORWARDED",
        "last_movement_date": now,
        "updated_at": now,
    }
    update_result = supabase.table("cases").update(update_data).eq("id", case_id).execute()

    _create_audit_log(
        supabase=supabase,
        officer_id=user.get("id"),
        officer_name=user.get("name", ""),
        action="FILE_FORWARDED",
        file_id=case_id,
        file_number=current.get("file_number"),
        previous_state=from_stage,
        new_state=to_stage,
        remarks=f"Forwarded to {target_officer} at {target_desk}. {remarks}",
    )

    return _map_db_case_to_frontend(update_result.data[0])


def _map_movement_to_event(m: dict) -> dict:
    """Map a database case_movements row to a CaseEvent for the frontend."""
    return {
        "id": m.get("id"),
        "caseId": m.get("case_id"),
        "stage": m.get("to_stage", ""),
        "timestamp": m.get("started_at", ""),
        "durationDays": 0,  # Would require comparing with next movement
        "waitDays": 0,
        "officer": m.get("assigned_to", ""),
        "fromOfficer": None,
        "toOfficer": m.get("assigned_to"),
        "fromDesk": None,
        "toDesk": None,
        "action": "FORWARDED",
        "status": m.get("status", "FORWARDED"),
        "notes": m.get("remarks"),
        "isDelayed": False,
        "isRework": False,
    }


def _map_db_doc_to_frontend(d: dict) -> dict:
    """Map a database documents row to a DocumentRecord for the frontend.

    Includes extracted_fields and extracted_text when OCR has been completed,
    so the DocumentViewerModal can display structured results without a
    separate API call.
    """
    metadata = {
        "fileSize": str(d.get("file_size", 0)),
        "fileType": d.get("file_type", ""),
        "mimeType": d.get("file_type", ""),
        "pageCount": d.get("page_count", 0),
    }

    # Reconstruct ocrResult from persisted DB data when available
    ocr_result = None
    extracted_fields = d.get("extracted_fields")  # JSONB list or None
    extracted_text = d.get("extracted_text")
    if extracted_fields is not None or extracted_text:
        ocr_result = {
            "documentId": d.get("id", ""),
            "extractedText": extracted_text or "",
            "confidenceScore": 0.0,   # Not stored separately; 0 indicates persisted result
            "extractedFields": extracted_fields or [],
            "processingTimeMs": 0,
            "ocrEngine": "stored",
            "status": "READY" if extracted_text else "FAILED",
        }

    return {
        "id": d.get("id"),
        "caseId": d.get("case_id"),
        "title": d.get("file_name", ""),
        "documentType": d.get("document_type", "Court Order"),
        "fileName": d.get("file_name", ""),
        "fileUrl": d.get("storage_path", ""),
        "uploadDate": d.get("created_at", ""),
        "uploadedBy": d.get("uploaded_by", ""),
        "status": "READY" if d.get("ocr_status") == "COMPLETED" else "PROCESSING",
        "ocrStatus": d.get("ocr_status", "PENDING"),
        # OCR content — None until OCR has been run
        "extractedText": extracted_text,
        "extractedFields": extracted_fields,
        "processedAt": d.get("processed_at"),
        "errorMessage": d.get("error_message"),
        "metadata": metadata,
        "ocrResult": ocr_result,
    }



def _create_audit_log(
    supabase,
    officer_id: str,
    officer_name: str,
    action: str,
    file_id: str,
    file_number: Optional[str] = None,
    previous_state: Optional[str] = None,
    new_state: Optional[str] = None,
    remarks: Optional[str] = None,
):
    """Insert an immutable audit log entry."""
    supabase.table("audit_logs").insert({
        "officer_id": officer_id,
        "officer_name": officer_name,
        "action": action,
        "file_id": file_id,
        "file_number": file_number,
        "previous_state": previous_state,
        "new_state": new_state,
        "ip_address": "127.0.0.1",  # In production, get from request
        "terminal_id": "SRV-001",
        "remarks": remarks,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }).execute()
