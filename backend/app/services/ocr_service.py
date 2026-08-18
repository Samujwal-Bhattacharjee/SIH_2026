"""
OCR Service — modular document text extraction.

Architecture:
1. Try PyMuPDF first (fast, works on digital PDFs)
2. If extracted text is too short (likely scanned), fall back to Tesseract OCR
3. Apply regex-based field extraction on top of raw text

This service is modular: to swap in a different OCR backend (e.g., Google Vision API,
Azure Document Intelligence), replace the extract_text_* functions below.
The calling code (document_service.py) does not change.
"""
import re
import time
import logging
from typing import Optional
from io import BytesIO

logger = logging.getLogger(__name__)

# Minimum characters for PyMuPDF text to be considered "usable"
MIN_DIGITAL_TEXT_LENGTH = 100


def extract_text_from_pdf_digital(file_bytes: bytes) -> str:
    """
    Extract text directly from a digital (non-scanned) PDF using PyMuPDF.
    Fast and accurate for machine-generated PDFs.
    """
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        text_parts = []
        for page in doc:
            text_parts.append(page.get_text())
        doc.close()
        return "\n".join(text_parts).strip()
    except ImportError:
        logger.warning("PyMuPDF not installed. Skipping digital PDF extraction.")
        return ""
    except Exception as e:
        logger.error(f"PyMuPDF extraction failed: {e}")
        return ""


def extract_text_from_image_ocr(file_bytes: bytes, mime_type: str = "image/png") -> tuple[str, float]:
    """
    Extract text from a scanned document or image using Tesseract OCR.
    Returns (extracted_text, confidence_score).
    """
    try:
        import pytesseract
        from PIL import Image
        from app.core.config import settings

        if settings.TESSERACT_CMD:
            pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD

        image = Image.open(BytesIO(file_bytes))
        # Get text with confidence data
        data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT, lang="eng+hin")
        text = pytesseract.image_to_string(image, lang="eng+hin")

        # Calculate average confidence (excluding -1 values)
        confidences = [int(c) for c in data["conf"] if int(c) >= 0]
        avg_confidence = sum(confidences) / len(confidences) / 100 if confidences else 0.0

        return text.strip(), round(avg_confidence, 2)

    except ImportError:
        logger.warning("pytesseract or Pillow not installed. OCR unavailable.")
        return "", 0.0
    except Exception as e:
        logger.error(f"Tesseract OCR failed: {e}")
        return "", 0.0


def extract_text_from_pdf_ocr(file_bytes: bytes) -> tuple[str, float]:
    """
    Convert PDF pages to images and OCR them.
    Used when PyMuPDF yields insufficient text (scanned PDFs).
    """
    try:
        import fitz
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        all_text = []
        all_confidences = []

        for page in doc:
            # Render page as high-res image
            mat = fitz.Matrix(2.0, 2.0)  # 2x zoom = ~144 DPI
            pix = page.get_pixmap(matrix=mat)
            img_bytes = pix.tobytes("png")
            text, conf = extract_text_from_image_ocr(img_bytes, "image/png")
            all_text.append(text)
            if conf > 0:
                all_confidences.append(conf)

        doc.close()
        combined_text = "\n".join(all_text).strip()
        avg_conf = sum(all_confidences) / len(all_confidences) if all_confidences else 0.0
        return combined_text, round(avg_conf, 2)

    except Exception as e:
        logger.error(f"PDF OCR failed: {e}")
        return "", 0.0


def extract_text_from_document(file_bytes: bytes, mime_type: str) -> tuple[str, float, str]:
    """
    Main entry point for text extraction.
    Returns (text, confidence, engine_used).

    Strategy:
    1. PDF → try digital extraction → if too short, OCR
    2. Image → directly OCR
    """
    start = time.time()

    if mime_type == "application/pdf":
        digital_text = extract_text_from_pdf_digital(file_bytes)
        if len(digital_text) >= MIN_DIGITAL_TEXT_LENGTH:
            return digital_text, 0.99, "PyMuPDF-digital"
        else:
            logger.info("Digital PDF text too short, falling back to OCR")
            text, confidence = extract_text_from_pdf_ocr(file_bytes)
            return text, confidence, "PyMuPDF+Tesseract-OCR"

    elif mime_type in ("image/png", "image/jpeg", "image/jpg"):
        text, confidence = extract_text_from_image_ocr(file_bytes, mime_type)
        return text, confidence, "Tesseract-OCR"

    else:
        return "", 0.0, "unsupported"


# ============================================================
# FIELD EXTRACTION — Regex-based, NO LLM required
# ============================================================

def extract_fields_from_text(text: str) -> list[dict]:
    """
    Attempt to extract structured fields from raw OCR text using regex patterns.
    These are best-effort extractions. The officer MUST review and correct.

    Returns a list of OCRField dicts:
    {key, value, confidence, isExtracted, label}
    """
    fields = []

    # --- Case Number ---
    case_number_patterns = [
        r'(?:W\.?A\.?|W\.?P\.?|O\.?S\.?|C\.?A\.?|S\.?B\.?\s*)?(?:No\.?|NUMBER)?\s*(\d{1,6}/\d{4})',
        r'(?:Writ Appeal|Writ Petition|Civil Appeal)\s+(?:No\.?)?\s*(\d+\s*/\s*\d{4})',
        r'Case\s+(?:No\.?|Number)\s*[:\-]?\s*([A-Z0-9\-/]+)',
    ]
    for pattern in case_number_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            fields.append({
                "key": "caseNumber",
                "label": "Case Number",
                "value": match.group(1).strip().replace(" ", ""),
                "confidence": 0.82,
                "isExtracted": True,
            })
            break

    # --- Court Name ---
    court_patterns = [
        r'(High Court of [A-Za-z\s]+)',
        r'(Supreme Court of India)',
        r'(District Court[,\s]+[A-Za-z\s]+)',
        r'(IN THE (?:HIGH COURT|SUPREME COURT)[A-Za-z\s,]+)',
    ]
    for pattern in court_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            fields.append({
                "key": "court",
                "label": "Court Name",
                "value": match.group(1).strip().title(),
                "confidence": 0.88,
                "isExtracted": True,
            })
            break

    # --- Order Date ---
    date_patterns = [
        r'(?:Dated?|Order Date|Date of Order)[:\-\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})',
        r'(?:Dated?)[:\-\s]+(\d{1,2}(?:st|nd|rd|th)?\s+\w+\s+\d{4})',
        r'This\s+(\d{1,2}(?:st|nd|rd|th)?\s+day\s+of\s+\w+,?\s+\d{4})',
    ]
    for pattern in date_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            fields.append({
                "key": "orderDate",
                "label": "Order Date",
                "value": match.group(1).strip(),
                "confidence": 0.78,
                "isExtracted": True,
            })
            break

    # --- Petitioner/Respondent ---
    petitioner_match = re.search(
        r'(?:Petitioner|Appellant|Plaintiff)[s]?\s*[:\-]?\s*([A-Z][A-Za-z\s\.,]+?)(?:\n|Vs\.|Respondent)',
        text,
        re.IGNORECASE
    )
    if petitioner_match:
        fields.append({
            "key": "petitioner",
            "label": "Petitioner / Applicant",
            "value": petitioner_match.group(1).strip()[:200],
            "confidence": 0.70,
            "isExtracted": True,
        })

    respondent_match = re.search(
        r'(?:Respondent|Defendant)[s]?\s*[:\-]?\s*([A-Z][A-Za-z\s\.,]+?)(?:\n|ORDER|JUDGMENT)',
        text,
        re.IGNORECASE
    )
    if respondent_match:
        fields.append({
            "key": "respondent",
            "label": "Respondent",
            "value": respondent_match.group(1).strip()[:200],
            "confidence": 0.70,
            "isExtracted": True,
        })

    # --- Limitation Period ---
    limitation_match = re.search(
        r'(?:limitation|within)\s+(\d+)\s+(?:days?|weeks?|months?)',
        text,
        re.IGNORECASE
    )
    if limitation_match:
        raw_val = limitation_match.group(0)
        days_match = re.search(r'(\d+)\s+(days?|weeks?|months?)', raw_val, re.IGNORECASE)
        if days_match:
            num = int(days_match.group(1))
            unit = days_match.group(2).lower()
            if "week" in unit:
                num *= 7
            elif "month" in unit:
                num *= 30
            fields.append({
                "key": "limitationDays",
                "label": "Limitation Period (days)",
                "value": str(num),
                "confidence": 0.75,
                "isExtracted": True,
            })

    # --- Directions / Action Required ---
    directions_match = re.search(
        r'(?:DIRECTED|ORDERED|directed\s+that|it\s+is\s+ordered)\s*[:\-]?\s*(.{50,400}?)(?:\n\n|\.|$)',
        text,
        re.IGNORECASE | re.DOTALL
    )
    if directions_match:
        fields.append({
            "key": "directions",
            "label": "Court Directions / Action Required",
            "value": directions_match.group(1).strip()[:400],
            "confidence": 0.65,
            "isExtracted": True,
        })

    return fields
