"""
Document routes — upload, OCR, and download endpoints.
"""
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Query
from fastapi.responses import Response
from app.core.security import get_current_user
from app.services import document_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/upload", summary="Upload a document to a case")
async def upload_document(
    file: UploadFile = File(..., description="PDF, PNG, or JPEG file"),
    case_id: str = Form(..., description="Case ID to attach the document to"),
    document_type: str = Form(default="Court Order"),
    user: dict = Depends(get_current_user),
):
    """
    Upload a document and attach it to a case.
    - Validates file type and size
    - Stores in Supabase Storage
    - Creates database record
    - Returns document metadata
    """
    file_bytes = await file.read()

    # Validate
    error = document_service.validate_file(
        filename=file.filename,
        content_type=file.content_type,
        file_size=len(file_bytes),
    )
    if error:
        raise HTTPException(status_code=400, detail=error)

    try:
        doc = document_service.upload_document(
            file_bytes=file_bytes,
            filename=file.filename,
            content_type=file.content_type,
            case_id=case_id,
            document_type=document_type,
            uploaded_by=user.get("name", user.get("email", "")),
        )
        # Map to frontend format
        return {
            "id": doc["id"],
            "caseId": doc["case_id"],
            "fileName": doc["file_name"],
            "documentType": doc["document_type"],
            "fileUrl": doc.get("file_url", ""),
            "uploadDate": doc["created_at"],
            "uploadedBy": doc["uploaded_by"],
            "status": "READY",
            "ocrStatus": "PENDING",
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


@router.get("", summary="List documents")
async def list_documents(
    case_id: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    ocr_status: Optional[str] = Query(None, alias="ocr_status"),
    user: dict = Depends(get_current_user),
):
    """List documents, optionally filtered by case or search term."""
    from app.core.database import get_supabase
    from app.services.case_service import _map_db_doc_to_frontend
    supabase = get_supabase()

    query = supabase.table("documents").select("*")
    if case_id:
        query = query.eq("case_id", case_id)
    if ocr_status:
        query = query.eq("ocr_status", ocr_status)
    if q:
        query = query.ilike("file_name", f"%{q}%")

    result = query.order("created_at", desc=True).execute()
    return [_map_db_doc_to_frontend(d) for d in (result.data or [])]


@router.get("/{document_id}", summary="Get document detail")
async def get_document(
    document_id: str,
    user: dict = Depends(get_current_user),
):
    """Get a single document's metadata and OCR result."""
    from app.core.database import get_supabase
    from app.services.case_service import _map_db_doc_to_frontend
    supabase = get_supabase()
    result = supabase.table("documents").select("*").eq("id", document_id).maybe_single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Document not found")
    return _map_db_doc_to_frontend(result.data)


@router.get("/{document_id}/download", summary="Download document file")
async def download_document(
    document_id: str,
    user: dict = Depends(get_current_user),
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


@router.post("/{document_id}/ocr", summary="Run OCR on a stored document")
async def run_ocr_on_document(
    document_id: str,
    user: dict = Depends(get_current_user),
):
    """
    Trigger OCR processing on an already-uploaded document.
    Returns extracted text and structured fields.
    Officer MUST review extracted fields before accepting them.
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
            detail="OCR processing failed. You can enter information manually."
        )
