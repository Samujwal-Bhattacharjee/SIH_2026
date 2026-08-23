"""
Land Acquisition Document Field Extractor
==========================================
SIH26017 — Ministry of Rural Development

Extracts land-acquisition-specific structured fields from raw OCR text.
Uses regex-based pattern matching — no LLM or external API required.

This module extends the existing OCR pipeline by adding LA-specific
field extraction on top of the raw text produced by ocr_service.py.

Architecture:
    PyMuPDF / Tesseract → raw text → extract_la_fields() → structured dict

If a field cannot be confidently extracted, it returns None (never invented).
"""
import re
import logging
from typing import Optional, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)


# ============================================================
# DATE PARSING UTILITIES
# ============================================================

_DATE_PATTERNS = [
    # ISO: 2026-08-12
    (r'\b(\d{4}-\d{2}-\d{2})\b', "%Y-%m-%d"),
    # DD/MM/YYYY or DD-MM-YYYY
    (r'\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})\b', None),
    # DD Month YYYY (e.g., 12 August 2026)
    (r'\b(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})\b', "%d %B %Y"),
    # Month DD, YYYY (e.g., August 12, 2026)
    (r'\b((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})\b', "%B %d, %Y"),
]


def _parse_date(raw: str) -> Optional[str]:
    """Attempt to parse a date string into ISO format. Returns None on failure."""
    # Strip ordinal suffixes (1st, 2nd, 3rd, 4th) ONLY from numbers without corrupting month names like August
    raw = re.sub(r'(\d+)(?:st|nd|rd|th)\b', r'\1', raw.strip(), flags=re.IGNORECASE)
    raw = raw.strip().rstrip(",")

    for _, fmt in _DATE_PATTERNS:
        if fmt:
            try:
                dt = datetime.strptime(raw, fmt)
                return dt.strftime("%Y-%m-%d")
            except (ValueError, AttributeError):
                pass

    # Try flexible parsing for DD/MM/YYYY variants
    match = re.match(r'(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})', raw)
    if match:
        d, m, y = int(match.group(1)), int(match.group(2)), int(match.group(3))
        if 1 <= m <= 12 and 1 <= d <= 31:
            try:
                return datetime(y, m, d).strftime("%Y-%m-%d")
            except ValueError:
                pass

    return None


def _find_date_near_keyword(text: str, keyword_pattern: str) -> Optional[str]:
    """Find a date string appearing near a keyword in the text."""
    date_expr = (
        r'(?P<dt>\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|'
        r'August|September|October|November|December)\s+\d{4}'
        r'|\d{4}-\d{2}-\d{2}'
        r'|\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})'
    )
    pattern = rf'(?:{keyword_pattern})\s*[:\-]?(?:\s+on)?\s*{date_expr}'
    match = re.search(pattern, text, re.IGNORECASE)
    if match:
        return _parse_date(match.group("dt"))
    # Also try wider search (within 40 chars of keyword)
    kw_match = re.search(keyword_pattern, text, re.IGNORECASE)
    if kw_match:
        sub_text = text[kw_match.end():kw_match.end() + 60]
        d_match = re.search(date_expr, sub_text, re.IGNORECASE)
        if d_match:
            return _parse_date(d_match.group("dt"))
    return None


# ============================================================
# MAIN EXTRACTION FUNCTION
# ============================================================

def extract_la_fields(raw_text: str) -> Dict[str, Any]:
    """
    Extract land-acquisition-specific structured fields from OCR raw text.

    Returns a dict of extracted fields. Each field is either:
    - A value (if confidently extracted)
    - None (if not found — NEVER invented)

    Fields returned:
        project_id, project_name, district, state, survey_number,
        village, notification_date, acquisition_stage,
        compensation_amount, compensation_status,
        ownership_conflict, legal_dispute, rr_status,
        approval_status, department, officer, acquisition_date
    """
    result: Dict[str, Any] = {}
    text = raw_text.strip()

    if not text:
        return result

    # ============================================================
    # Project / File Number
    # ============================================================
    proj_match = re.search(
        r'\b(?:Project\s+(?:No\.?|Number|ID|Code)|File\s+No\.?|'
        r'Reference\s+No\.?|LA\s*[-/]?)\s*[:\-]?\s*'
        r'([A-Za-z]{0,4}[-/]?\d{3,8}[A-Za-z0-9\-/]*)',
        text, re.IGNORECASE
    )
    if proj_match:
        result["project_id"] = proj_match.group(1).strip().upper()

    # ============================================================
    # Project Name
    # ============================================================
    name_match = re.search(
        r'\b(?:Project\s+Name|Name\s+of\s+(?:the\s+)?Project)\s*[:\-]?\s*'
        r'([A-Za-z][A-Za-z\s,\-\.&()]{5,120}?)(?:\n|District|State|For)',
        text, re.IGNORECASE
    )
    if name_match:
        result["project_name"] = name_match.group(1).strip().rstrip(".,;:")[:200]

    # ============================================================
    # District
    # ============================================================
    district_match = re.search(
        r'\bDistrict\s*[:\-]?\s*([A-Za-z][A-Za-z\s]{2,40}?)(?:\n|,|State|\.)',
        text, re.IGNORECASE
    )
    if district_match:
        result["district"] = district_match.group(1).strip().title()

    # ============================================================
    # State
    # ============================================================
    state_match = re.search(
        r'\bState\s+of\s+([A-Za-z][A-Za-z\s]{3,30}?)(?:\n|,|District|\.)'
        r'|\bState\s*[:\-]?\s*([A-Za-z][A-Za-z\s]{3,30}?)(?:\n|,|District|\.)',
        text, re.IGNORECASE
    )
    if state_match:
        val = (state_match.group(1) or state_match.group(2) or "").strip().title()
        if val:
            result["state"] = val

    # ============================================================
    # Survey Number
    # ============================================================
    survey_match = re.search(
        r'\b(?:Survey\s+(?:No\.?|Number)|S\.?\s*No\.?)\s*[:\-]?\s*'
        r'([A-Za-z0-9][A-Za-z0-9\-_./]+)',
        text, re.IGNORECASE
    )
    if survey_match:
        result["survey_number"] = survey_match.group(1).strip()

    # ============================================================
    # Village
    # ============================================================
    village_match = re.search(
        r'\b(?:Village|Gram|Mouza)\s*[:\-]?\s*([A-Za-z][A-Za-z\s]{2,50}?)(?:\n|,|District|Taluka|Tehsil)',
        text, re.IGNORECASE
    )
    if village_match:
        result["village"] = village_match.group(1).strip().title()

    # ============================================================
    # Notification Date (Section 11 under LARR Act)
    # ============================================================
    notif_date = _find_date_near_keyword(
        text,
        r'(?:(?:Preliminary\s+)?Notification(?:\s+(?:issued(?:\s+on)?|published(?:\s+on)?|dated?|under))?|'
        r'Section\s+11(?:\s+Notification)?(?:\s+(?:issued(?:\s+on)?|dated?))?|Notified\s+(?:on|dated?))',
    )
    if notif_date:
        result["notification_date"] = notif_date

    # ============================================================
    # Acquisition Stage
    # ============================================================
    explicit_stage_match = re.search(
        r'\b(?:Acquisition\s+Stage|Current\s+Stage|Stage\s+of\s+Acquisition)\s*[:\-]?\s*([A-Za-z\s&/]{3,60}?)(?:\n|\.|$)',
        text, re.IGNORECASE
    )
    if explicit_stage_match:
        stage_cand = explicit_stage_match.group(1).strip()
        from app.core.land_workflow import LAND_ACQUISITION_STAGES
        for s in LAND_ACQUISITION_STAGES:
            if s.lower() in stage_cand.lower() or stage_cand.lower() in s.lower():
                result["acquisition_stage"] = s
                break

    if "acquisition_stage" not in result:
        stage_keywords = [
            ("Compensation Disbursement", r'compensation\s+disburs'),
            ("Compensation Assessment",   r'compensation\s+assess'),
            ("Objection and Legal Review",r'objection|legal\s+review'),
            ("Ownership Verification",    r'ownership\s+verif'),
            ("Survey and Verification",   r'survey\s+(?:and\s+)?verif'),
            ("Preliminary Notification",  r'preliminary\s+notif'),
            ("Land Identification",       r'land\s+identif'),
            ("Project Initiation",        r'project\s+initiat'),
            ("R&R and Rehabilitation",    r'rehabilitation|r\s*&\s*r'),
            ("Final Acquisition",         r'final\s+acquis'),
            ("Possession and Handover",   r'possession|handover'),
        ]
        for stage_name, pattern in stage_keywords:
            if re.search(pattern, text, re.IGNORECASE):
                result["acquisition_stage"] = stage_name
                break

    # ============================================================
    # Compensation Amount
    # ============================================================
    comp_amount_match = re.search(
        r'\b(?:Compensation|Award|Amount)\s*[:\-]?\s*'
        r'(?:Rs\.?|INR|₹)?\s*'
        r'([\d,]+(?:\.\d{2})?)\s*(?:(?:Lakh|Lakhs?|Crore|Crores?))?',
        text, re.IGNORECASE
    )
    if comp_amount_match:
        amount_str = comp_amount_match.group(1).replace(",", "")
        try:
            result["compensation_amount"] = float(amount_str)
        except ValueError:
            pass

    # ============================================================
    # Compensation Status
    # ============================================================
    if re.search(r'\bcompensation\s+(?:has\s+been\s+)?(?:paid|disbursed|deposited|released)\b', text, re.IGNORECASE):
        result["compensation_status"] = "PAID"
    elif re.search(r'\bcompensation\s+(?:remains?\s+)?(?:pending|unpaid|not\s+paid|outstanding|awaiting)\b', text, re.IGNORECASE):
        result["compensation_status"] = "PENDING"
    elif re.search(r'\bcompensation\s+(?:partially\s+)?(?:partial|in\s+progress|ongoing)\b', text, re.IGNORECASE):
        result["compensation_status"] = "PARTIAL"

    # ============================================================
    # Ownership Conflict
    # ============================================================
    ownership_conflict = bool(re.search(
        r'\b(?:ownership\s+(?:conflict|dispute|discrepancy|contest|challenged?)'
        r'|(?:disputed?|contested?)\s+ownership'
        r'|title\s+dispute'
        r'|multiple\s+(?:claimants?|owners?)\b)',
        text, re.IGNORECASE
    ))
    result["ownership_conflict"] = ownership_conflict

    # ============================================================
    # Legal Dispute
    # ============================================================
    legal_dispute = bool(re.search(
        r'\b(?:legal\s+(?:dispute|challenge|contest|case|action|proceedings?)'
        r'|court\s+(?:case|order|stay|injunction|proceedings?)'
        r'|writ\s+petition'
        r'|litigat'
        r'|(?:appeal|petition)\s+(?:filed?|pending|registered?))',
        text, re.IGNORECASE
    ))
    result["legal_dispute"] = legal_dispute

    # ============================================================
    # R&R Status
    # ============================================================
    if re.search(r'\br\s*&?\s*r\s+(?:plan|process|scheme)?\s+(?:completed?|done|finished?)\b', text, re.IGNORECASE):
        result["rr_status"] = "COMPLETED"
    elif re.search(r'\br\s*&?\s*r\s+(?:plan|process|scheme)?\s+(?:pending|ongoing|in\s+progress)\b', text, re.IGNORECASE):
        result["rr_status"] = "IN_PROGRESS"
    elif re.search(r'\brehabilitati', text, re.IGNORECASE):
        result["rr_status"] = "IN_PROGRESS"

    # ============================================================
    # Approval Status
    # ============================================================
    if re.search(r'\b(?:approved?|sanctioned?)\s+by\b', text, re.IGNORECASE):
        result["approval_status"] = "APPROVED"
    elif re.search(r'\b(?:pending\s+(?:approval|sanction)|approval\s+(?:awaited|pending))\b', text, re.IGNORECASE):
        result["approval_status"] = "PENDING"

    # ============================================================
    # Department
    # ============================================================
    dept_match = re.search(
        r'\b(?:Department\s+of|Ministry\s+of|Issued?\s+by|Authority)\s*[:\-]?\s*'
        r'([A-Z][A-Za-z\s&,\.]{3,80}?)(?:\n|,|for|For)',
        text, re.IGNORECASE
    )
    if dept_match:
        result["department"] = dept_match.group(1).strip().rstrip(".,;:")[:100]

    # ============================================================
    # Officer Name
    # ============================================================
    officer_match = re.search(
        r'\b(?:(?:Collector|District\s+Collector|Tehsildar|S\.D\.O\.?|SDO|SLAO|'
        r'Land\s+Acquisition\s+Officer|LAO|Competent\s+Authority))\s*[:\-]?\s*'
        r'([A-Z][A-Za-z\s\.]{3,60}?)(?:\n|,|\.|IAS|IPS)',
        text, re.IGNORECASE
    )
    if officer_match:
        result["officer"] = officer_match.group(1).strip()[:80]

    # ============================================================
    # Acquisition Date
    # ============================================================
    acq_date = _find_date_near_keyword(
        text,
        r'(?:Final\s+Acquisition\s+(?:Order|Date|Notification)|'
        r'Section\s+19\s+(?:Notification|dated?|issued?)|'
        r'Acquired\s+on)',
    )
    if acq_date:
        result["acquisition_date"] = acq_date

    # Remove None values (fields that were not found)
    return {k: v for k, v in result.items() if v is not None}


def fields_to_ocr_list(fields: Dict[str, Any]) -> list:
    """
    Convert extracted fields dict to the OCRField list format
    expected by the existing document API schema.
    """
    FIELD_LABELS = {
        "project_id":          "Project ID / File Number",
        "project_name":        "Project Name",
        "district":            "District",
        "state":               "State",
        "survey_number":       "Survey Number",
        "village":             "Village / Gram",
        "notification_date":   "Notification Date (Section 11)",
        "acquisition_stage":   "Acquisition Stage",
        "compensation_amount": "Compensation Amount (₹)",
        "compensation_status": "Compensation Status",
        "ownership_conflict":  "Ownership Conflict",
        "legal_dispute":       "Legal Dispute",
        "rr_status":           "R&R Status",
        "approval_status":     "Approval Status",
        "department":          "Issuing Department",
        "officer":             "Responsible Officer",
        "acquisition_date":    "Final Acquisition Date",
    }

    FIELD_CONFIDENCE = {
        "project_id":          0.82,
        "project_name":        0.75,
        "district":            0.85,
        "state":               0.85,
        "survey_number":       0.88,
        "village":             0.80,
        "notification_date":   0.78,
        "acquisition_stage":   0.70,
        "compensation_amount": 0.72,
        "compensation_status": 0.75,
        "ownership_conflict":  0.80,
        "legal_dispute":       0.80,
        "rr_status":           0.72,
        "approval_status":     0.75,
        "department":          0.70,
        "officer":             0.68,
        "acquisition_date":    0.78,
    }

    result_list = []
    for key, value in fields.items():
        if value is None:
            continue
        result_list.append({
            "key":         key,
            "label":       FIELD_LABELS.get(key, key.replace("_", " ").title()),
            "value":       str(value),
            "confidence":  FIELD_CONFIDENCE.get(key, 0.65),
            "isExtracted": True,
        })
    return result_list
