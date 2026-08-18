"""
Document Service — file upload to Supabase Storage and OCR pipeline.

Note: validate_file() is a pure function with no external dependencies
so that tests can import it without requiring Supabase to be installed.
"""
import logging
import hashlib
import time
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger(__name__)

ALLOWED_MIME_TYPES = {"application/pdf", "image/png", "image/jpeg", "image/jpg"}
MAX_UPLOAD_SIZE_MB = 20  # Default; overridden by settings when Supabase is available


def validate_file(filename: str, content_type: str, file_size: int) -> str | None:
    """
    Validate file type and size.
    Returns error message string if invalid, None if OK.
    """
    # MIME type check
    if content_type not in ALLOWED_MIME_TYPES:
        return f"File type '{content_type}' is not supported. Allowed: PDF, PNG, JPEG."

    # Extension check
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    allowed_exts = {"pdf", "png", "jpg", "jpeg"}
    if ext not in allowed_exts:
        return f"File extension '.{ext}' is not allowed."

    # Size check — use settings if available, fall back to module-level constant
    try:
        from app.core.config import settings as _s
        max_bytes = _s.max_upload_bytes
        max_mb = _s.MAX_UPLOAD_SIZE_MB
    except Exception:
        max_bytes = MAX_UPLOAD_SIZE_MB * 1024 * 1024
        max_mb = MAX_UPLOAD_SIZE_MB

    if file_size > max_bytes:
        return f"File size ({file_size / 1024 / 1024:.1f} MB) exceeds maximum allowed ({max_mb} MB)."

    return None


def upload_document(
    file_bytes: bytes,
    filename: str,
    content_type: str,
    case_id: str,
    document_type: str,
    uploaded_by: str,
) -> dict:
    # Lazy imports so pure validate_file() tests don't need Supabase
    from app.core.database import get_supabase  # noqa: F401
    from app.core.config import settings  # noqa: F401
    from app.services import ocr_service  # noqa: F401
    """
    Upload a document to Supabase Storage and create a database record.
    Returns the created document row.
    """
    supabase = get_supabase()
    now = datetime.now(timezone.utc).isoformat()

    # Build a unique storage path
    checksum = hashlib.sha256(file_bytes).hexdigest()[:12]
    safe_name = filename.replace(" ", "_")
    storage_path = f"{case_id}/{now[:10]}_{checksum}_{safe_name}"

    # Upload to Supabase Storage
    try:
        supabase.storage.from_(settings.SUPABASE_STORAGE_BUCKET).upload(
            path=storage_path,
            file=file_bytes,
            file_options={"content-type": content_type},
        )
        # Get public URL
        url_data = supabase.storage.from_(settings.SUPABASE_STORAGE_BUCKET).get_public_url(storage_path)
        file_url = url_data if isinstance(url_data, str) else str(url_data)
    except Exception as e:
        logger.error(f"Supabase Storage upload failed: {e}")
        raise RuntimeError(f"Document storage failed: {e}")

    # Create database record
    doc_row = {
        "case_id": case_id,
        "file_name": filename,
        "storage_path": storage_path,
        "file_url": file_url,
        "file_type": content_type,
        "file_size": len(file_bytes),
        "document_type": document_type,
        "ocr_status": "PENDING",
        "extracted_text": None,
        "uploaded_by": uploaded_by,
        "created_at": now,
    }
    insert_result = supabase.table("documents").insert(doc_row).execute()
    doc = insert_result.data[0]

    # Update case document_ids array
    case_result = supabase.table("cases").select("document_ids").eq("id", case_id).maybe_single().execute()
    if case_result.data:
        existing_ids = case_result.data.get("document_ids") or []
        existing_ids.append(doc["id"])
        supabase.table("cases").update({"document_ids": existing_ids, "updated_at": now}).eq("id", case_id).execute()

    return doc


def process_ocr(document_id: str) -> dict:
    """
    Run OCR on a stored document and update the database record.
    Returns the OCR result dict matching the frontend OCRResult interface.
    """
    supabase = get_supabase()
    start_time = time.time()

    # Get document record
    doc_result = supabase.table("documents").select("*").eq("id", document_id).maybe_single().execute()
    if not doc_result.data:
        raise ValueError(f"Document {document_id} not found")

    doc = doc_result.data

    # Mark as processing
    supabase.table("documents").update({"ocr_status": "PROCESSING"}).eq("id", document_id).execute()

    try:
        # Download file from Supabase Storage
        file_bytes = supabase.storage.from_(settings.SUPABASE_STORAGE_BUCKET)\
            .download(doc["storage_path"])

        # Extract text
        text, confidence, engine = ocr_service.extract_text_from_document(
            file_bytes=file_bytes,
            mime_type=doc.get("file_type", "application/pdf"),
        )

        # Extract structured fields
        fields = ocr_service.extract_fields_from_text(text)

        processing_ms = int((time.time() - start_time) * 1000)

        ocr_result = {
            "documentId": document_id,
            "extractedText": text,
            "confidenceScore": confidence,
            "extractedFields": fields,
            "processingTimeMs": processing_ms,
            "ocrEngine": engine,
            "status": "READY" if text else "FAILED",
        }

        # Update document record
        supabase.table("documents").update({
            "ocr_status": "COMPLETED" if text else "FAILED",
            "extracted_text": text,
        }).eq("id", document_id).execute()

        return ocr_result

    except Exception as e:
        logger.error(f"OCR processing failed for document {document_id}: {e}")
        supabase.table("documents").update({"ocr_status": "FAILED"}).eq("id", document_id).execute()
        raise


def process_ocr_from_bytes(file_bytes: bytes, filename: str, content_type: str) -> dict:
    """
    Run OCR directly on uploaded bytes (without storing first).
    Used by the /api/v1/ocr/process endpoint for the upload+scan workflow.
    """
    start_time = time.time()

    text, confidence, engine = ocr_service.extract_text_from_document(
        file_bytes=file_bytes,
        mime_type=content_type,
    )
    fields = ocr_service.extract_fields_from_text(text)
    processing_ms = int((time.time() - start_time) * 1000)

    return {
        "documentId": "preview",  # Not saved yet
        "extractedText": text,
        "confidenceScore": confidence,
        "extractedFields": fields,
        "processingTimeMs": processing_ms,
        "ocrEngine": engine,
        "status": "READY" if text else "FAILED",
    }


def get_download_url(document_id: str) -> tuple[bytes, str]:
    """Return file bytes and filename for download."""
    supabase = get_supabase()
    doc_result = supabase.table("documents").select("*").eq("id", document_id).maybe_single().execute()
    if not doc_result.data:
        raise ValueError(f"Document {document_id} not found")
    doc = doc_result.data
    file_bytes = supabase.storage.from_(settings.SUPABASE_STORAGE_BUCKET).download(doc["storage_path"])
    return file_bytes, doc["file_name"]
