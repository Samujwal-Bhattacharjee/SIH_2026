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
        import pymupdf as fitz
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
        import pymupdf as fitz
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

    # --- Case / File / Report / Reference Number ---
    case_number_patterns = [
        # 1. Government and administrative document labels with explicit number indicator
        r'\b(?:Case|Report|Information\s+Report|File|Reference|Ref|Application|App|Petition|Docket|Diary|FIR|Order|G\.?O\.?|Sanction|Dispatch)\s+(?:No\.?|Number|Nos\.?|Num\.?|#)\s*[:\-]?\s*([A-Za-z0-9][A-Za-z0-9\-_./\(\)]{1,40})\b',
        # 2. Case Number / Case No label
        r'\bCase\s+(?:Number|No\.?|#)\s*[:\-]?\s*([A-Za-z0-9][A-Za-z0-9\-_./\(\)]{1,40})\b',
        # 3. Court and litigation case identifiers (Writ Petition, Appeal, etc.)
        r'\b(?:W\.?A\.?|W\.?P\.?(?:\s*\([A-Za-z]+\))?|O\.?S\.?|C\.?A\.?|S\.?B\.?|S\.?L\.?P\.?(?:\s*\([A-Za-z]+\))?|O\.?A\.?|M\.?A\.?|Writ\s+Appeal|Writ\s+Petition|Civil\s+Appeal)\s*(?:No\.?|Number|Nos\.?)?\s*[:\-]?\s*([A-Za-z0-9\-_./\(\)]+\s*/\s*\d{2,4})\b',
        # 4. Standalone explicit No. / Number with slash docket
        r'\b(?:No\.?|Number)\s*[:\-]\s*([A-Za-z0-9\-_.]+\s*/\s*\d{2,4})\b',
    ]
    for pattern in case_number_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            candidate_val = match.group(1).strip().replace(" ", "").rstrip(".,;:")
            # Candidate must contain at least one digit and be at least 2 characters long
            if any(c.isdigit() for c in candidate_val) and len(candidate_val) >= 2:
                fields.append({
                    "key": "caseNumber",
                    "label": "Case Number",
                    "value": candidate_val,
                    "confidence": 0.85,
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

    # --- FairBid Petroleum Dealership Extraction ---
    try:
        from app.services.fairbid_extractor import is_fairbid_document, extract_fairbid_canonical
        if is_fairbid_document(text):
            canonical = extract_fairbid_canonical(text)
            return canonical.get("extracted_fields", [])
    except Exception as e:
        logger.warning(f"FairBid extractor note: {e}")

    # --- Land Acquisition Domain Field Extraction (SIH26017) ---
    # Only run on explicit Land Acquisition documents to avoid polluting other records
    if re.search(r'\b(?:Land\s+Acquisition|RFCTLARR|Notification\s+u/s|Section\s+11|Survey\s+No)\b', text, re.IGNORECASE):
        try:
            from app.services.land_document_extractor import extract_la_fields, fields_to_ocr_list
            la_dict = extract_la_fields(text)
            la_fields_list = fields_to_ocr_list(la_dict)
            existing_keys = {f["key"] for f in fields}
            for la_f in la_fields_list:
                if la_f["key"] not in existing_keys:
                    fields.append(la_f)
        except Exception as e:
            logger.warning(f"LA field extraction error: {e}")

    # --- Procurement / Bid Compliance Field Extraction (SIH26100) ---
    existing_keys = {f["key"] for f in fields}
    proc_fields = extract_procurement_fields(text)
    for pf in proc_fields:
        if pf["key"] not in existing_keys:
            fields.append(pf)

    return fields


# ============================================================
# PROCUREMENT FIELD EXTRACTION (SIH26100)
# Extracts fields needed for bid compliance verification.
# Each field includes: key, value, confidence, isExtracted, label
# ============================================================

def extract_procurement_fields(text: str) -> list[dict]:
    """
    Extract procurement-specific structured fields from OCR text.
    Used for bid compliance verification (SIH26100).

    Fields extracted:
    - GSTIN, PAN, Udyam number, CIN
    - Legal/company name
    - Document dates and expiry
    - Turnover amounts
    - Local content percentage
    - OEM authorization reference
    - Blacklisting mentions
    - Registration numbers
    """
    fields = []

    # -----------------------------------------------
    # GSTIN — 15-char alphanumeric or FairBid synthetic
    # -----------------------------------------------
    gstin_match = re.search(
        r'\b(FAIRBID-GSTIN-[A-Z0-9\-]+|[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})\b',
        text,
        re.IGNORECASE
    )
    if gstin_match:
        fields.append({
            "key": "gstin",
            "label": "GSTIN",
            "value": gstin_match.group(1).upper(),
            "confidence": 0.96,
            "isExtracted": True,
        })

    # -----------------------------------------------
    # PAN — 10-char or FairBid synthetic
    # Avoid matching inside GSTIN
    # -----------------------------------------------
    pan_match = re.search(
        r'(?<![0-9])\b(FAIRBID-PAN-[A-Z0-9\-]+|[A-Z]{5}[0-9]{4}[A-Z]{1})\b(?![0-9A-Z])',
        text,
        re.IGNORECASE
    )
    if pan_match:
        pan_val = pan_match.group(1).upper()
        gstin_val = next((f["value"] for f in fields if f["key"] == "gstin"), "")
        if pan_val not in gstin_val:
            fields.append({
                "key": "pan",
                "label": "PAN",
                "value": pan_val,
                "confidence": 0.94,
                "isExtracted": True,
            })

    # -----------------------------------------------
    # Udyam Registration Number
    # -----------------------------------------------
    udyam_match = re.search(
        r'\b(FAIRBID-UDYAM-[A-Z0-9\-]+|UDYAM[-\s][A-Z]{2}[-\s][0-9]{2}[-\s][0-9]{7})\b',
        text,
        re.IGNORECASE
    )
    if udyam_match:
        fields.append({
            "key": "udyamNumber",
            "label": "Udyam Registration Number",
            "value": udyam_match.group(1).upper().replace(" ", "-"),
            "confidence": 0.95,
            "isExtracted": True,
        })

    # -----------------------------------------------
    # CIN — Corporate Identity Number
    # -----------------------------------------------
    cin_match = re.search(
        r'\b(FAIRBID-CIN-[A-Z0-9\-]+|[UL][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6})\b',
        text,
        re.IGNORECASE
    )
    if cin_match:
        fields.append({
            "key": "cin",
            "label": "CIN",
            "value": cin_match.group(1).upper(),
            "confidence": 0.93,
            "isExtracted": True,
        })

    # -----------------------------------------------
    # Legal / Company Name
    # Stops at line boundary or header labels (prevents "IOCL STATE")
    # -----------------------------------------------
    company_patterns = [
        r'(?:This\s+is\s+to\s+certify\s+that|Registered\s+to|Name\s+of\s+(?:Enterprise|Applicant|Company|Firm|Business))\s*[:\-]?\s*\n?\s*([A-Z][A-Za-z0-9\s&\.\,\(\)]{3,80}?(?:Pvt\.?|Private|Ltd\.?|Limited|LLP|Technologies|Solutions|Enterprises|Industries|Services|Systems|Associates)?)',
        r'(?:M/s\.?|Messrs\.?)\s+([A-Z][A-Za-z0-9\s&\.\,\(\)]{3,80})',
        r'(?:Name|Company|Firm)\s*[:\-]\s*([A-Z][A-Za-z0-9\s&\.\,\(\)]{5,80})',
    ]
    for pat in company_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            raw_val = m.group(1).strip()
            name_val = re.split(r'[\n\r]+|\b(?:STATE|DISTRICT|LOCATION|ROAD)\b', raw_val)[0].strip().rstrip(".,;:")
            if len(name_val) >= 5 and len(name_val) <= 120:
                fields.append({
                    "key": "legalName",
                    "label": "Legal / Company Name",
                    "value": name_val,
                    "confidence": 0.85,
                    "isExtracted": True,
                })
                break

    # -----------------------------------------------
    # Document / Registration Date
    # -----------------------------------------------
    doc_date_patterns = [
        r'(?:Date\s+of\s+(?:Registration|Issue|Issuance)|Registered\s+on|Issued\s+on|Valid\s+from)[:\-\s]+([\d]{1,2}[\-\/\.][\d]{1,2}[\-\/\.][\d]{2,4})',
        r'(?:Date)[:\-\s]+([\d]{1,2}[\-\/\.][\d]{1,2}[\-\/\.][\d]{2,4})',
        r'(?:Dated)[:\-\s]+([\d]{1,2}(?:st|nd|rd|th)?\s+\w+\s+\d{4})',
    ]
    for pat in doc_date_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            fields.append({
                "key": "documentDate",
                "label": "Document Date",
                "value": m.group(1).strip(),
                "confidence": 0.80,
                "isExtracted": True,
            })
            break

    # -----------------------------------------------
    # Validity / Expiry Date
    # -----------------------------------------------
    expiry_patterns = [
        r'(?:Valid\s+(?:up\s+to|till|until|upto)|Expiry\s+Date|Expires\s+on|Validity)[:\-\s]+([\d]{1,2}[\-\/\.][\d]{1,2}[\-\/\.][\d]{2,4})',
        r'(?:Valid\s+(?:up\s+to|till|until|upto)|Expiry\s+Date|Expires\s+on|Validity)[:\-\s]+([\d]{1,2}(?:st|nd|rd|th)?\s+\w+\s+\d{4})',
    ]
    for pat in expiry_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            fields.append({
                "key": "expiryDate",
                "label": "Validity / Expiry Date",
                "value": m.group(1).strip(),
                "confidence": 0.82,
                "isExtracted": True,
            })
            break

    # -----------------------------------------------
    # Annual Turnover — Requires explicit Turnover label
    # -----------------------------------------------
    turnover_patterns = [
        r'(?:Annual\s+Turnover|Total\s+Turnover|Net\s+Turnover|Gross\s+Turnover)\s*[:\-]?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d+)?)\s*(?:Lakh|Crore|Cr\.?|L\.?|lakhs?|crores?)?',
    ]
    for pat in turnover_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            raw_val = m.group(0).strip()
            fields.append({
                "key": "annualTurnover",
                "label": "Annual Turnover",
                "value": raw_val[:100],
                "confidence": 0.80,
                "isExtracted": True,
            })
            break

    # -----------------------------------------------
    # Local Content / Make in India Percentage
    # -----------------------------------------------
    lc_match = re.search(
        r'(?:Local\s+(?:Value\s+Addition|Content)|Make\s+in\s+India|Domestic\s+Value\s+Addition)\s*[:\-]?\s*([\d]{1,3}(?:\.\d+)?)\s*%',
        text,
        re.IGNORECASE
    )
    if lc_match:
        fields.append({
            "key": "localContentPct",
            "label": "Local Content %",
            "value": f"{lc_match.group(1)}%",
            "confidence": 0.85,
            "isExtracted": True,
        })

    # -----------------------------------------------
    # OEM Authorization Reference (Explicit OEM/MAF only, NEVER generic Ref)
    # -----------------------------------------------
    oem_patterns = [
        r'(?:OEM\s+Auth(?:orization|orisation)?(?:\s+Letter)?(?:\s+Ref(?:erence)?(?:\s+No\.?)?)?|MAF\s+(?:No\.?|Reference))[:\-\s]*([A-Z0-9\/\-\.]{4,40})',
        r'(?:Manufacturer\s+Authorization)\s*(?:No\.?|Number|Ref\.?)[:\-\s]*([A-Z0-9\/\-\.]{4,40})',
    ]
    for pat in oem_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            fields.append({
                "key": "oemReference",
                "label": "OEM Authorization Reference",
                "value": m.group(1).strip(),
                "confidence": 0.85,
                "isExtracted": True,
            })
            break

    # -----------------------------------------------
    # Blacklisting / Debarment Declaration
    # -----------------------------------------------
    blacklist_pattern = re.search(
        r'(?:not\s+(?:been\s+)?(?:blacklisted|debarred|barred|disqualified)|no\s+(?:blacklisting|debarment)|'
        r'free\s+from\s+(?:any\s+)?(?:blacklisting|debarment|legal\s+proceedings)|'
        r'neither\s+blacklisted|no\s+adverse\s+finding)',
        text,
        re.IGNORECASE
    )
    if blacklist_pattern:
        fields.append({
            "key": "blacklistingDeclaration",
            "label": "Non-Blacklisting Declaration",
            "value": "Declaration found — no blacklisting/debarment stated",
            "confidence": 0.80,
            "isExtracted": True,
        })

    # -----------------------------------------------
    # NSIC Registration Number
    # -----------------------------------------------
    nsic_match = re.search(
        r'\b(NSIC\/[A-Z]{2,4}\/[A-Z]{2,5}\/[\d]{4}\/[\d]{4,6})\b',
        text,
        re.IGNORECASE
    )
    if nsic_match:
        fields.append({
            "key": "nsicNumber",
            "label": "NSIC Registration Number",
            "value": nsic_match.group(1).upper(),
            "confidence": 0.90,
            "isExtracted": True,
        })

    # -----------------------------------------------
    # Startup India / DPIIT Recognition Number
    # -----------------------------------------------
    dpiit_match = re.search(
        r'\b(DIPP[\-\s]?(?:CERT[\-\s]?)?\d{4,8})\b',
        text,
        re.IGNORECASE
    )
    if dpiit_match:
        fields.append({
            "key": "dpiitNumber",
            "label": "DPIIT / Startup India Recognition No.",
            "value": dpiit_match.group(1).upper().replace(" ", "-"),
            "confidence": 0.88,
            "isExtracted": True,
        })

    # -----------------------------------------------
    # EPFO Establishment Code
    # -----------------------------------------------
    epfo_match = re.search(
        r'\b([A-Z]{2}\/[A-Z]{3}\/[\d]{7}\/[\d]{3})\b',
        text,
        re.IGNORECASE
    )
    if epfo_match:
        fields.append({
            "key": "epfoCode",
            "label": "EPFO Establishment Code",
            "value": epfo_match.group(1).upper(),
            "confidence": 0.88,
            "isExtracted": True,
        })

    return fields


# ============================================================
# DOCUMENT TYPE CLASSIFIER
# Deterministic, rule-based. No ML required for prototype.
# ============================================================

DOCUMENT_TYPE_RULES = [
    # (regex pattern, document_type, priority)
    (r'\bRetail\s+Outlet\s+Dealership\b|\bPetroleum\s+dealership\b|\bFB-[A-Z0-9\-]+\b', "Retail Outlet Dealership / Bid Compliance Simulation", 20),
    (r'\bGSTIN\b|\bGST\s+Registration\b|\bGoods\s+and\s+Services\s+Tax\b', "GST Certificate", 10),
    (r'\bPermanent\s+Account\s+Number\b|\bPAN\s+Card\b|\bIncome\s+Tax\s+Department.*\bPAN\b', "PAN Card", 10),
    (r'\bUdyam\s+Registration\b|\bUDYAM[-\s]', "Udyam/MSME Certificate", 10),
    (r'\bMSME\s+(?:Registration|Certificate)\b|\bMicro\s+and\s+Small\b', "Udyam/MSME Certificate", 8),
    (r'\bOEM\s+Auth(?:orization|orisation)\b|\bManufacturer\s+Authorization\b|\bMAF\b', "OEM Authorization", 10),
    (r'\bStartup\s+India\b|\bDPIIT\s+(?:Recognition|Certificate)\b', "Startup India Certificate", 10),
    (r'\bNSIC\b.*\b(?:Registration|Certificate|SPRS)\b', "NSIC Certificate", 10),
    (r'\bEPFO\b|\bProvident\s+Fund\b|\bPF\s+(?:Registration|Certificate)\b', "EPFO Registration", 10),
    (r'\bESIC\b|\bEmployees.*State\s+Insurance\b', "ESIC Registration", 10),
    (r'\bLocal\s+Content\b|\bMake\s+in\s+India\b|\bDomestic\s+Value\s+Addition\b', "Local Content / Make in India Declaration", 9),
    (r'\b(?:not\s+(?:been\s+)?(?:blacklisted|debarred))\b', "Non-Blacklisting Declaration", 9),
    (r'\bBalance\s+Sheet\b|\bProfit\s+(?:and|&)\s+Loss\b|\bFinancial\s+Statement\b|\bAudit(?:ed|or)\s+Report\b', "Financial Statement", 9),
    (r'\bIncome\s+Tax\s+Return\b|\bITR[-\s]?\d\b', "Income Tax / ITR", 9),
    (r'\bTrade\s+(?:Licence|License|Certificate)\b', "Trade License", 7),
    (r'\bCertificate\s+of\s+Incorporation\b|\bMemorandum\s+of\s+Association\b', "Incorporation Certificate", 7),
]


def classify_document_type(text: str, filename: str = "") -> str:
    """
    Classify a document type from its OCR text using deterministic rules.
    Returns a document type string.

    Priority: higher priority rules take precedence.
    If no match found, returns "Other".
    """
    if not text:
        # Fallback: try filename-based classification
        filename_lower = filename.lower()
        if "fairbid" in filename_lower or "dealership" in filename_lower:
            return "Retail Outlet Dealership / Bid Compliance Simulation"
        if "gst" in filename_lower:
            return "GST Certificate"
        if "pan" in filename_lower:
            return "PAN Card"
        if "udyam" in filename_lower or "msme" in filename_lower:
            return "Udyam/MSME Certificate"
        if "oem" in filename_lower or "authorization" in filename_lower:
            return "OEM Authorization"
        if "blacklist" in filename_lower or "debarment" in filename_lower:
            return "Non-Blacklisting Declaration"
        if "itr" in filename_lower or "income_tax" in filename_lower:
            return "Income Tax / ITR"
        return "Other"

    try:
        from app.services.fairbid_extractor import is_fairbid_document
        if is_fairbid_document(text):
            return "Retail Outlet Dealership / Bid Compliance Simulation"
    except Exception:
        pass

    # Score each candidate type
    best_type = "Other"
    best_priority = -1

    for pattern, doc_type, priority in DOCUMENT_TYPE_RULES:
        if re.search(pattern, text, re.IGNORECASE):
            if priority > best_priority:
                best_priority = priority
                best_type = doc_type

    return best_type

