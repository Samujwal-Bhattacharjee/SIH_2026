"""
Document routes — upload, OCR, retrieval, and download endpoints.

Route prefix: /api/v1/documents  (registered in main.py)

Endpoints:
  POST   /upload               — validate + upload file + create DB record
  GET    /                     — list documents (with optional filters)
  GET    /{document_id}        — get full document record including extracted fields
  GET    /{document_id}/status — lightweight status poll (ocr_status, processed_at, error)
  GET    /{document_id}/download — stream file bytes for download
  POST   /{document_id}/ocr   — trigger OCR and field extraction, persist results
"""
import logging
from typing import Optional, Any
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Query
from fastapi.responses import Response
from app.core.security import get_current_user
from app.services import document_service

logger = logging.getLogger(__name__)
router = APIRouter()


# ============================================================
# POST /upload
# ============================================================

@router.post("/upload", summary="Upload a document to a case")
async def upload_document(
    file: UploadFile = File(..., description="PDF, PNG, or JPEG file"),
    case_id: str = Form(..., description="Case ID to attach the document to"),
    document_type: str = Form(default="Court Order"),
    user: dict[str, object] = Depends(get_current_user),
):
    """
    Upload a document and attach it to a case.
    - Validates file type (PDF, PNG, JPEG) and size (≤ MAX_UPLOAD_SIZE_MB)
    - Stores in Supabase Storage under {case_id}/{date}_{checksum}_{filename}
    - Creates a documents DB record with ocr_status=PENDING
    - Returns document metadata matching the frontend DocumentRecord interface
    """
    file_bytes = await file.read()

    filename = file.filename or "uploaded_document"
    content_type = file.content_type or "application/octet-stream"

    # Validate before any storage operation
    error = document_service.validate_file(
        filename=filename,
        content_type=content_type,
        file_size=len(file_bytes),
    )
    if error:
        raise HTTPException(status_code=400, detail=error)

    # Extract uploader identity — get_current_user guarantees the user dict exists
    # (it raises HTTP 404 if not found), so we only need a safe string fallback.
    uploaded_by: str = str(user.get("name") or user.get("email") or "")

    try:
        doc = document_service.upload_document(
            file_bytes=file_bytes,
            filename=filename,
            content_type=content_type,
            case_id=case_id,
            document_type=document_type,
            uploaded_by=uploaded_by,
        )
        # Map to frontend DocumentRecord format
        return {
            "id": doc["id"],
            "caseId": doc["case_id"],
            "fileName": doc["file_name"],
            "documentType": doc["document_type"],
            "fileUrl": doc.get("file_url", ""),
            "uploadDate": doc["created_at"],
            "uploadedBy": doc["uploaded_by"],
            "status": "PROCESSING",
            "ocrStatus": "PENDING",
            "extractedFields": None,
            "extractedText": None,
            "metadata": {
                "fileSize": str(doc["file_size"]),
                "fileType": doc["file_type"],
                "mimeType": doc["file_type"],
                "pageCount": 0,
            },
        }
    except Exception as e:
        logger.error(f"Document upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


# ============================================================
# GET /
# ============================================================

@router.get("", summary="List documents")
async def list_documents(
    case_id: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    ocr_status: Optional[str] = Query(None, alias="ocr_status"),
    user: dict[str, object] = Depends(get_current_user),
):
    """List documents, optionally filtered by case, search term, or OCR status."""
    from app.core.database import get_supabase
    from app.services.case_service import _map_db_doc_to_frontend
    supabase = get_supabase()

    query = supabase.table("documents").select("*")
    if case_id:
        query = query.eq("case_id", case_id)
    if ocr_status and ocr_status != "ALL":
        query = query.eq("ocr_status", ocr_status)
    if q:
        query = query.ilike("file_name", f"%{q}%")

    result = query.order("created_at", desc=True).execute()
    data_list: Any = result.data or []
    return [_map_db_doc_to_frontend(d) for d in data_list if isinstance(d, dict)]


# ============================================================
# GET /{document_id}
# ============================================================

@router.get("/{document_id}", summary="Get document detail including OCR results")
async def get_document(
    document_id: str,
    user: dict[str, object] = Depends(get_current_user),
):
    """
    Get a single document's metadata, extracted text, and structured OCR fields.
    Returns the full document record including persisted OCR results.
    """
    from app.core.database import get_supabase
    from app.services.case_service import _map_db_doc_to_frontend
    supabase = get_supabase()
    result = supabase.table("documents").select("*").eq("id", document_id).maybe_single().execute()
    doc_data: Any = getattr(result, "data", None)
    if not result or not isinstance(doc_data, dict):
        raise HTTPException(status_code=404, detail="Document not found")
    return _map_db_doc_to_frontend(doc_data)


# ============================================================
# GET /{document_id}/status
# ============================================================

@router.get("/{document_id}/status", summary="Get document processing status")
async def get_document_status(
    document_id: str,
    user: dict[str, object] = Depends(get_current_user),
):
    """
    Lightweight endpoint for polling OCR processing status.
    Returns: {id, ocr_status, processed_at, error_message}
    Status values: PENDING | PROCESSING | COMPLETED | FAILED
    """
    from app.core.database import get_supabase
    supabase = get_supabase()
    result = supabase.table("documents")\
        .select("id, ocr_status, processed_at, error_message")\
        .eq("id", document_id)\
        .maybe_single()\
        .execute()
    d: Any = getattr(result, "data", None)
    if not result or not isinstance(d, dict):
        raise HTTPException(status_code=404, detail="Document not found")
    return {
        "id": d.get("id"),
        "ocr_status": d.get("ocr_status", "PENDING"),
        "processed_at": d.get("processed_at"),
        "error_message": d.get("error_message"),
    }


# ============================================================
# GET /{document_id}/download
# ============================================================

@router.get("/{document_id}/download", summary="Download document file")
async def download_document(
    document_id: str,
    user: dict[str, object] = Depends(get_current_user),
):
    """Stream document bytes for download."""
    try:
        file_bytes, filename = document_service.get_download_url(document_id)
        return Response(
            content=file_bytes,
            media_type="application/octet-stream",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")


# ============================================================
# POST /{document_id}/ocr
# ============================================================

@router.post("/{document_id}/ocr", summary="Run OCR on a stored document")
async def run_ocr_on_document(
    document_id: str,
    user: dict[str, object] = Depends(get_current_user),
):
    """
    Trigger OCR processing on an already-uploaded document.

    Pipeline:
    1. Retrieve file from Supabase Storage
    2. Detect PDF (digital vs scanned) or image
    3. Extract text via PyMuPDF or Tesseract OCR
    4. Extract structured fields via regex rules
    5. Persist extracted_fields, extracted_text, processed_at, ocr_status to DB
    6. Return OCRResult matching the frontend interface

    The officer MUST review extracted fields before accepting them.
    """
    try:
        result = document_service.process_ocr(document_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"OCR failed for document {document_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="OCR processing failed. Extracted fields were not saved. You can enter information manually.",
        )
