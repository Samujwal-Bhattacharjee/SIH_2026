"""
OCR process endpoint — accepts a raw file upload for immediate OCR.
Used by the frontend UploadDocument page before committing to a case.
"""
import logging
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from app.core.security import get_current_user
from app.services import document_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/process", summary="Extract text from an uploaded file via OCR")
async def process_ocr(
    file: UploadFile = File(..., description="PDF, PNG, or JPEG file to extract text from"),
    user: dict = Depends(get_current_user),
):
    """
    Accept a file, run OCR, and return extracted text + structured fields.

    IMPORTANT: This endpoint does NOT save the document. It only extracts information.
    The officer reviews the extracted fields and then creates the case.
    The document is properly stored when the case is created via POST /api/v1/documents/upload.

    Returns the OCRResult object (matches frontend OCRResult interface).
    """
    file_bytes = await file.read()

    # Validate file
    error = document_service.validate_file(
        filename=file.filename,
        content_type=file.content_type,
        file_size=len(file_bytes),
    )
    if error:
        raise HTTPException(status_code=400, detail=error)

    try:
        result = document_service.process_ocr_from_bytes(
            file_bytes=file_bytes,
            filename=file.filename,
            content_type=file.content_type,
        )
        return result
    except Exception as e:
        logger.error(f"OCR preview failed for {file.filename}: {e}")
        # Return a graceful failure — the officer can still enter info manually
        return {
            "documentId": "preview",
            "extractedText": "",
            "confidenceScore": 0.0,
            "extractedFields": [],
            "processingTimeMs": 0,
            "ocrEngine": "failed",
            "status": "FAILED",
        }
