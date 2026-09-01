"""
Procurement API Routes — SIH26100
==================================
Persistent API for:
- Tenders
- Bidders
- Document Upload, OCR & Field Extraction
- Compliance Verification
- Cross-Document Validation
- Risk Assessment
- Officer Decision
- Audit Trail
- Dashboard Metrics

Data is backed by persistent database storage (`backend/procurement.db`)
and Supabase cloud storage. All records survive server restarts and reloads.
"""
import logging
import math
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from pydantic import BaseModel, Field

from app.core.security import get_current_user
from app.core import procurement_store as ps
from app.services.ocr_service import classify_document_type
from app.services.procurement_service import DEFAULT_TENDER_REQUIREMENTS, run_full_verification
from app.services.document_service import validate_file, process_ocr_from_bytes
from app.services.integrity import (
    assess_tender_integrity,
    assess_bidder_integrity,
    IntegrityAssessment,
    FindingStatus,
)

logger = logging.getLogger(__name__)
router = APIRouter()


def _safe_float(value: Any, default: float = 0.0) -> float:
    """
    Safely convert an arbitrary OCR metadata value to float.
    Handles: int, float, numeric str, None, list, dict, and any unknown type.
    Never raises — malformed OCR metadata must not crash document upload.
    """
    if isinstance(value, float):
        if math.isnan(value) or math.isinf(value):
            return default
        return value
    if isinstance(value, int):
        return float(value)
    if isinstance(value, str):
        try:
            val = float(value)
            if math.isnan(val) or math.isinf(val):
                return default
            return val
        except (ValueError, TypeError):
            return default
    return default


# ============================================================
# SCHEMAS
# ============================================================

class TenderCreate(BaseModel):
    title: str
    tender_number: Optional[str] = None
    department: Optional[str] = "Department of Administrative Reforms"
    description: Optional[str] = ""
    bid_closing_date: Optional[str] = "2026-09-15"
    estimated_value: Optional[float] = 10000000.00
    category: Optional[str] = "General Procurement"


class BidderCreate(BaseModel):
    legal_name: str
    gstin: Optional[str] = None
    pan: Optional[str] = None
    udyam_number: Optional[str] = None


class DecisionRequest(BaseModel):
    decision: str = Field(..., description="QUALIFIED | DISQUALIFIED | CLARIFICATION_REQUESTED | MARK_FOR_REVIEW")
    note: Optional[str] = ""


class RequirementReviewRequest(BaseModel):
    status: str = Field(..., description="Verified | Failed | Pending | Needs Review | Not Applicable")


def actor_name(user: Optional[Dict[str, Any]]) -> str:
    if not isinstance(user, dict):
        return "Procurement Officer"
    return str(user.get("name") or user.get("email") or "Procurement Officer")


# ============================================================
# TENDERS
# ============================================================

@router.get("/tenders", summary="List procurement tenders")
async def list_tenders(user: dict = Depends(get_current_user)):
    """Fetch active and completed procurement tenders."""
    return ps.get_tenders()


@router.get("/tenders/{tender_id}", summary="Get tender detail")
async def get_tender_detail(tender_id: str, user: dict = Depends(get_current_user)):
    """Fetch complete tender requirements and metadata."""
    tender = ps.get_tender_by_id(tender_id)
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
    target_id = str(tender.get("id") or tender_id)
    reqs = ps.get_tender_requirements(target_id)
    return {**tender, "requirements": reqs}


@router.post("/tenders", status_code=status.HTTP_201_CREATED, summary="Create a new procurement tender")
async def create_tender(body: TenderCreate, user: dict = Depends(get_current_user)):
    """Register a new procurement tender with statutory requirements."""
    tender_data = {
        "title": body.title,
        "tender_number": body.tender_number,
        "department": body.department,
        "description": body.description,
        "bid_closing_date": body.bid_closing_date,
        "estimated_value": body.estimated_value,
        "category": body.category,
        "created_by": actor_name(user),
    }
    created = ps.create_tender_record(tender_data)
    tender_id_val = str(created.get("id") or "")
    tender_num = str(created.get("tender_number") or body.tender_number or "")
    tender_title = str(created.get("title") or body.title or "")
    ps.log_audit_event(
        action="Tender created",
        actor=actor_name(user),
        tender_id=tender_id_val,
        description=f"Tender '{tender_num}' — {tender_title} registered with statutory criteria.",
        actor_user_id=str(user.get("id") or "") if isinstance(user, dict) else "",
    )
    reqs = ps.get_tender_requirements(tender_id_val)
    return {**created, "requirements": reqs}


# ============================================================
# BIDDERS
# ============================================================

@router.get("/tenders/{tender_id}/bidders", summary="List bidders for a tender")
async def list_tender_bidders(tender_id: str, user: dict = Depends(get_current_user)):
    """Get all participating bidders and their compliance posture."""
    return ps.get_bidders(tender_id)


@router.post("/tenders/{tender_id}/bidders", status_code=status.HTTP_201_CREATED, summary="Add bidder to tender")
async def add_bidder_to_tender(tender_id: str, body: BidderCreate, user: dict = Depends(get_current_user)):
    """Register a new bidder in a tender."""
    tender = ps.get_tender_by_id(tender_id)
    target_tender_id = str(tender.get("id") or tender_id) if tender else tender_id

    created = ps.create_bidder_record(target_tender_id, {
        "legal_name": body.legal_name,
        "gstin": body.gstin,
        "pan": body.pan,
        "udyam_number": body.udyam_number,
    })
    created_bidder_id = str(created.get("id") or "")

    ps.log_audit_event(
        action="Bidder enrolled",
        actor=actor_name(user),
        tender_id=target_tender_id,
        bidder_id=created_bidder_id,
        description=f"Enrolled bidder '{body.legal_name}' into tender.",
        actor_user_id=str(user.get("id") or "") if isinstance(user, dict) else "",
    )

    return created


@router.get("/bidders/{bidder_id}", summary="Get bidder detail")
async def get_bidder_detail(bidder_id: str, user: dict = Depends(get_current_user)):
    """Get single bidder metadata, verification status, and requirements."""
    bidder = ps.get_bidder_by_id(bidder_id)
    if not bidder:
        raise HTTPException(status_code=404, detail="Bidder not found")

    docs = ps.get_bidder_documents(bidder_id)
    results = ps.get_compliance_results(bidder_id)
    discrepancies = ps.get_discrepancies(bidder_id)

    # If compliance results not computed yet, run live verification
    if not results and docs:
        tender_id = str(bidder.get("tender_id") or "TEN-2026-001")
        reqs = ps.get_tender_requirements(tender_id) or DEFAULT_TENDER_REQUIREMENTS
        assessment = run_full_verification(bidder, reqs, docs)
        ps.save_compliance_assessment(bidder_id, tender_id, assessment)
        results = ps.get_compliance_results(bidder_id)
        discrepancies = ps.get_discrepancies(bidder_id)
        refreshed = ps.get_bidder_by_id(bidder_id)
        if refreshed:
            bidder = refreshed

    integrity_info = None
    try:
        ia = assess_bidder_integrity(bidder_id)
        integrity_info = {
            "overall_risk_score": ia.overall_risk_score,
            "risk_level": ia.risk_level.value,
            "findings_count": ia.findings_count,
            "contributing_signals": ia.contributing_signals,
            "summary": ia.summary,
        }
    except Exception as e:
        logger.warning(f"Integrity evaluation note for bidder {bidder_id}: {e}")

    return {
        "bidder": bidder,
        "documents": docs,
        "requirements": results,
        "discrepancies": discrepancies,
        "recommendations": [],
        "integrity": integrity_info,
        "assessment_updated_at": bidder.get("updated_at") if isinstance(bidder, dict) else None,
    }


# ============================================================
# BIDDER DOCUMENT UPLOAD, OCR & AUTO-VERIFICATION
# ============================================================

@router.post("/bidders/{bidder_id}/documents", summary="Upload bidder document, run OCR, and auto-verify")
async def upload_bidder_document(
    bidder_id: str,
    file: UploadFile = File(...),
    document_type: str = Form("auto"),
    user: dict = Depends(get_current_user),
):
    """
    Complete end-to-end document processing pipeline:
    1. Accept uploaded file
    2. Validate file format and size
    3. Run OCR (PyMuPDF with Tesseract fallback)
    4. Classify document type
    5. Extract structured fields (GSTIN, PAN, Udyam, OEM, etc.)
    6. Persist document record and link to bidder
    7. Re-run compliance verification
    8. Persist assessment findings and audit event
    9. Return full persisted result
    """
    bidder = ps.get_bidder_by_id(bidder_id)
    if not bidder:
        raise HTTPException(status_code=404, detail=f"Bidder '{bidder_id}' not found")

    file_bytes = await file.read()
    filename = str(file.filename or "uploaded_document")
    content_type = str(file.content_type or "application/pdf")

    # Validate
    error = validate_file(filename=filename, content_type=content_type, file_size=len(file_bytes))
    if error:
        raise HTTPException(status_code=400, detail=error)

    now = datetime.now(timezone.utc).isoformat()

    # Step 1: Run OCR extraction
    try:
        ocr_result = process_ocr_from_bytes(file_bytes, filename, content_type)
    except Exception as e:
        logger.warning(f"OCR processing note: {e}")
        ocr_result = {"extractedFields": [], "extractedText": "", "confidenceScore": 0.0, "ocrEngine": "none"}

    raw_fields = ocr_result.get("extractedFields") if isinstance(ocr_result, dict) else None
    extracted_fields: List[Dict[str, Any]] = [f for f in raw_fields if isinstance(f, dict)] if isinstance(raw_fields, list) else []
    extracted_text: str = str(ocr_result.get("extractedText") or "") if isinstance(ocr_result, dict) else ""
    confidence: float = _safe_float(ocr_result.get("confidenceScore")) if isinstance(ocr_result, dict) else 0.0
    engine_used: str = str(ocr_result.get("ocrEngine") or "PyMuPDF + Regex Parser") if isinstance(ocr_result, dict) else "PyMuPDF + Regex Parser"

    # Step 2: Classify document type if auto
    if document_type == "auto" or not document_type:
        classified_type: str = classify_document_type(extracted_text, filename)
    else:
        classified_type: str = document_type

    # Step 3: Persist document to database
    doc_id = f"DOC-{bidder_id}-{now[11:19].replace(':', '')}"
    doc_record = ps.save_document_record({
        "id": doc_id,
        "case_id": bidder_id,
        "file_name": filename,
        "file_type": content_type,
        "file_size": len(file_bytes),
        "document_type": classified_type,
        "ocr_status": "COMPLETED" if extracted_text or extracted_fields else "PENDING",
        "extracted_text": extracted_text,
        "extracted_fields": extracted_fields,
        "ocr_engine": engine_used,
        "ocr_confidence": confidence,
        "uploaded_by": actor_name(user),
        "created_at": now,
    })

    # Step 4: Link document to bidder
    ps.link_bidder_document(bidder_id, doc_id, classified_type)

    # Step 5: Fetch all bidder documents & re-run compliance verification
    all_docs = ps.get_bidder_documents(bidder_id)
    tender_id = str(bidder.get("tender_id") or "TEN-2026-001")
    reqs = ps.get_tender_requirements(tender_id) or DEFAULT_TENDER_REQUIREMENTS

    assessment = run_full_verification(
        bidder=bidder,
        requirements=reqs,
        documents=all_docs,
    )

    # Step 6: Persist updated assessment & discrepancies
    ps.save_compliance_assessment(bidder_id, tender_id, assessment)

    # Step 7: Record audit events
    ps.log_audit_event(
        action="Document uploaded",
        actor=actor_name(user),
        tender_id=tender_id,
        bidder_id=bidder_id,
        document_id=doc_id,
        description=f"Uploaded '{filename}' classified as '{classified_type}'.",
        actor_user_id=str(user.get("id") or "") if isinstance(user, dict) else "",
    )
    score_val = assessment.get("compliance_score", 0) if isinstance(assessment, dict) else 0
    risk_val = assessment.get("risk_level", "LOW") if isinstance(assessment, dict) else "LOW"
    ps.log_audit_event(
        action="OCR & Verification completed",
        actor="Verification Engine",
        tender_id=tender_id,
        bidder_id=bidder_id,
        document_id=doc_id,
        description=f"Extracted {len(extracted_fields)} field(s) ({engine_used}). Assessment: Score {score_val}/100, Risk: {risk_val}.",
        metadata={"score": score_val, "risk": risk_val},
    )

    updated_bidder = ps.get_bidder_by_id(bidder_id)

    return {
        "doc_record": doc_record,
        "extracted_fields": extracted_fields,
        "extracted_text_preview": extracted_text[:500] if extracted_text else "",
        "document_type": classified_type,
        "confidence": confidence,
        "engine": engine_used,
        "assessment": assessment,
        "bidder": updated_bidder or bidder,
    }


@router.get("/bidders/{bidder_id}/documents", summary="List documents for a bidder")
async def get_bidder_documents_list(bidder_id: str, user: dict = Depends(get_current_user)):
    """Fetch all documents attached to a specific bidder."""
    bidder = ps.get_bidder_by_id(bidder_id)
    if not bidder:
        raise HTTPException(status_code=404, detail="Bidder not found")
    return ps.get_bidder_documents(bidder_id)


# ============================================================
# COMPLIANCE PIPELINE & OFFICER DECISIONS
# ============================================================

@router.post("/bidders/{bidder_id}/verify", summary="Run full compliance verification")
async def verify_bidder(bidder_id: str, user: dict = Depends(get_current_user)):
    """Trigger full 4-layer compliance verification for a bidder."""
    bidder = ps.get_bidder_by_id(bidder_id)
    if not bidder:
        raise HTTPException(status_code=404, detail="Bidder not found")

    docs = ps.get_bidder_documents(bidder_id)
    tender_id = str(bidder.get("tender_id") or "TEN-2026-001")
    reqs = ps.get_tender_requirements(tender_id) or DEFAULT_TENDER_REQUIREMENTS

    assessment = run_full_verification(
        bidder=bidder,
        requirements=reqs,
        documents=docs,
    )

    ps.save_compliance_assessment(bidder_id, tender_id, assessment)

    score_val = assessment.get("compliance_score", 0) if isinstance(assessment, dict) else 0
    risk_val = assessment.get("risk_level", "LOW") if isinstance(assessment, dict) else "LOW"
    discrepancies_list = assessment.get("discrepancies") if isinstance(assessment, dict) else None
    discrepancies_count = len(discrepancies_list) if isinstance(discrepancies_list, list) else 0

    ps.log_audit_event(
        action="Compliance assessment completed",
        actor="Verification Engine",
        tender_id=tender_id,
        bidder_id=bidder_id,
        description=f"Compliance Score: {score_val}/100, Risk: {risk_val}. {discrepancies_count} discrepancy(ies).",
        metadata={"score": score_val, "risk": risk_val},
    )

    return assessment


@router.get("/bidders/{bidder_id}/compliance", summary="Get compliance results for bidder")
async def get_bidder_compliance(bidder_id: str, user: dict = Depends(get_current_user)):
    """Fetch current compliance verification breakdown and evidence."""
    return await get_bidder_detail(bidder_id, user)


@router.post("/bidders/{bidder_id}/decision", summary="Record procurement officer decision")
async def record_officer_decision(
    bidder_id: str,
    body: DecisionRequest,
    user: dict = Depends(get_current_user),
):
    """
    Record Procurement Officer's final qualification/disqualification decision.
    Creates an immutable audit trail entry.
    """
    bidder = ps.get_bidder_by_id(bidder_id)
    if not bidder:
        raise HTTPException(status_code=404, detail="Bidder not found")

    now = datetime.now(timezone.utc).isoformat()
    officer = actor_name(user)

    updated = ps.update_bidder_record(bidder_id, {
        "status": body.decision,
        "officer_decision": body.decision,
        "officer_note": body.note,
        "decided_at": now,
        "decided_by": officer,
    })

    ps.log_audit_event(
        action=f"Officer decision: {body.decision}",
        actor=officer,
        tender_id=str(bidder.get("tender_id") or ""),
        bidder_id=bidder_id,
        description=f"Decision: {body.decision}. Officer Remarks: {body.note or 'No remarks provided.'}",
        actor_user_id=str(user.get("id") or "") if isinstance(user, dict) else "",
    )

    return updated


@router.post("/bidders/{bidder_id}/requirements/{requirement_id}/review", summary="Review individual requirement")
async def review_requirement(
    bidder_id: str,
    requirement_id: str,
    body: RequirementReviewRequest,
    user: dict = Depends(get_current_user),
):
    """Update officer manual review status for a specific requirement."""
    bidder = ps.get_bidder_by_id(bidder_id)
    if not bidder:
        raise HTTPException(status_code=404, detail="Bidder not found")

    status_map = {
        "Verified": "COMPLIANT",
        "Failed": "NON_COMPLIANT",
        "Pending": "PENDING",
        "Needs Review": "NEEDS_REVIEW",
        "Not Applicable": "NOT_APPLICABLE",
    }
    persistent_status = status_map.get(body.status, body.status)

    with ps.get_db() as conn:
        conn.execute("""
            UPDATE compliance_results
            SET status = ?, updated_at = ?
            WHERE bidder_id = ? AND requirement_id = ?
        """, (persistent_status, datetime.now(timezone.utc).isoformat(), bidder_id, requirement_id))

    # Dynamically re-evaluate compliance metrics after requirement status update
    from app.services.procurement_service import calculate_compliance_score, determine_compliance_status, calculate_risk_level
    updated_checks = ps.get_compliance_results(bidder_id)
    discrepancies = ps.get_discrepancies(bidder_id)
    score_res = calculate_compliance_score(updated_checks)
    comp_res = determine_compliance_status(updated_checks, discrepancies)
    risk_res = calculate_risk_level(score_res["score"], discrepancies, updated_checks)

    ps.update_bidder_record(bidder_id, {
        "compliance_score": score_res["score"],
        "compliance_status": comp_res["status"],
        "risk_level": risk_res["risk_level"],
    })

    ps.log_audit_event(
        action="Requirement review updated",
        actor=actor_name(user),
        tender_id=str(bidder.get("tender_id") or ""),
        bidder_id=bidder_id,
        description=f"Requirement '{requirement_id}' marked '{persistent_status}'. Compliance score updated to {score_res['score']}/100.",
        actor_user_id=str(user.get("id") or "") if isinstance(user, dict) else "",
    )

    return {
        "bidder_id": bidder_id,
        "requirement_id": requirement_id,
        "status": persistent_status,
        "compliance_score": score_res["score"],
        "compliance_status": comp_res["status"],
        "risk_level": risk_res["risk_level"],
    }


# ============================================================
# DOCUMENTS & EVIDENCE
# ============================================================

@router.get("/documents", summary="List all procurement documents")
async def list_all_documents(
    tender_id: Optional[str] = Query(None),
    bidder_id: Optional[str] = Query(None),
    user: dict = Depends(get_current_user),
):
    """List all documents across bidders and tenders with extracted evidence."""
    return ps.get_all_procurement_documents(tender_id=tender_id, bidder_id=bidder_id)


@router.get("/documents/{document_id}", summary="Get document evidence detail")
async def get_document_evidence(document_id: str, user: dict = Depends(get_current_user)):
    """Fetch complete extracted fields, text preview, and metadata for a document."""
    doc = ps.get_document_by_id(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


# ============================================================
# AUDIT TRAIL & DASHBOARD
# ============================================================

@router.get("/audit", summary="Get procurement audit trail")
async def get_procurement_audit(
    tender_id: Optional[str] = Query(None),
    bidder_id: Optional[str] = Query(None),
    user: dict = Depends(get_current_user),
):
    """Fetch complete immutable audit trail of verification activities."""
    return ps.get_audit_trail(tender_id=tender_id, bidder_id=bidder_id)


@router.get("/dashboard", summary="Get real procurement dashboard metrics")
async def get_procurement_dashboard(user: dict = Depends(get_current_user)):
    """Compute aggregate statistics from persistent database records."""
    return ps.get_dashboard_summary()


class FindingReviewRequest(BaseModel):
    status: str = "ACKNOWLEDGED"
    tender_id: Optional[str] = None
    bidder_id: Optional[str] = None
    action: Optional[str] = None
    note: Optional[str] = None


@router.get(
    "/tenders/{tender_id}/integrity",
    response_model=IntegrityAssessment,
    summary="Get tender procurement integrity assessment"
)
async def get_tender_integrity_endpoint(tender_id: str, user: dict = Depends(get_current_user)):
    """Run deterministic integrity analysis for a tender and its participating bidders."""
    tender = ps.get_tender_by_id(tender_id)
    if not tender:
        raise HTTPException(status_code=404, detail=f"Tender '{tender_id}' not found")
    target_tender_id = str(tender.get("id") or tender_id)
    assessment = assess_tender_integrity(target_tender_id)

    # Merge any persistent officer review status overrides
    reviews = ps.get_integrity_finding_reviews(tender_id=target_tender_id)
    if reviews:
        review_map: Dict[str, str] = {}
        for r in reviews:
            if isinstance(r, dict) and r.get("finding_id") and r["finding_id"] not in review_map:
                review_map[str(r["finding_id"])] = str(r.get("status") or "")

        updated_findings = []
        for f in assessment.findings:
            if f.id in review_map:
                try:
                    f = f.model_copy(update={"status": FindingStatus(review_map[f.id])})
                except Exception:
                    pass
            updated_findings.append(f)
        assessment.findings = updated_findings

    return assessment


@router.get(
    "/bidders/{bidder_id}/integrity",
    response_model=IntegrityAssessment,
    summary="Get bidder procurement integrity assessment"
)
async def get_bidder_integrity_endpoint(bidder_id: str, user: dict = Depends(get_current_user)):
    """Run deterministic integrity analysis for a specific bidder."""
    bidder = ps.get_bidder_by_id(bidder_id)
    if not bidder:
        raise HTTPException(status_code=404, detail=f"Bidder '{bidder_id}' not found")
    return assess_bidder_integrity(bidder_id)


@router.post(
    "/integrity/findings/{finding_id}/review",
    summary="Record officer review action on an integrity finding"
)
async def review_integrity_finding_endpoint(
    finding_id: str,
    body: FindingReviewRequest,
    user: dict = Depends(get_current_user)
):
    """
    Record officer review status on an integrity finding (OPEN, UNDER_REVIEW, ACKNOWLEDGED, DISMISSED, RESOLVED).
    Logs an immutable audit trail event with the officer identity and review notes.
    """
    valid_statuses = {"OPEN", "UNDER_REVIEW", "ACKNOWLEDGED", "DISMISSED", "RESOLVED"}
    clean_status = body.status.upper().strip().replace(" ", "_")
    if clean_status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status '{body.status}'. Must be one of {sorted(list(valid_statuses))}"
        )

    res = ps.record_integrity_finding_review(
        finding_id=finding_id,
        status=clean_status,
        tender_id=body.tender_id,
        bidder_id=body.bidder_id,
        action=body.action or f"Marked {clean_status}",
        note=body.note,
        officer_name=actor_name(user),
        actor_user_id=str(user.get("id") or "") if isinstance(user, dict) else "",
    )
    return res
