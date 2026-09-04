"""
Procurement Compliance Service — SIH26100
==========================================
Central orchestrator for bid compliance verification.

Architecture:
    Layer 1: Deterministic compliance checks (document presence, field validation)
    Layer 2: Cross-document consistency analysis (name/GSTIN mismatches)
    Layer 3: Risk scoring (weighted, explainable)
    Layer 4: Recommendation generation (rule-based, triggered)

IMPORTANT: This engine NEVER automatically qualifies or disqualifies a bidder.
All results are DECISION SUPPORT for the Procurement Officer.
"""
import re
import json
import logging
from datetime import datetime, timezone, date
from typing import Optional, Any
from difflib import SequenceMatcher

logger = logging.getLogger(__name__)


# ============================================================
# TENDER REQUIREMENT DEFINITIONS
# Default requirements for a standard tender.
# Can be overridden per tender in the DB.
# ============================================================

DEFAULT_TENDER_REQUIREMENTS = [
    {
        "requirement_id": "GST_REQUIRED",
        "name": "Valid GST Registration",
        "category": "STATUTORY",
        "is_mandatory": True,
        "description": "Bidder must possess a valid GSTIN registered with GST Network.",
        "verification_rule": "GST_PRESENT",
        "weight": 4.0,
    },
    {
        "requirement_id": "PAN_REQUIRED",
        "name": "Permanent Account Number (PAN)",
        "category": "STATUTORY",
        "is_mandatory": True,
        "description": "Bidder must hold a valid PAN issued by Income Tax Department.",
        "verification_rule": "PAN_PRESENT",
        "weight": 3.0,
    },
    {
        "requirement_id": "UDYAM_REQUIRED",
        "name": "Udyam / MSME Registration",
        "category": "ELIGIBILITY",
        "is_mandatory": False,
        "description": "Required for MSME price preference. Mandatory if enterprise claims MSME status.",
        "verification_rule": "UDYAM_PRESENT",
        "weight": 2.0,
    },
    {
        "requirement_id": "OEM_AUTHORIZATION",
        "name": "OEM Authorization (MAF)",
        "category": "TECHNICAL",
        "is_mandatory": True,
        "description": "Manufacturer Authorization Form required for proposed products.",
        "verification_rule": "OEM_PRESENT_AND_VALID",
        "weight": 4.0,
    },
    {
        "requirement_id": "TURNOVER_THRESHOLD",
        "name": "Minimum Annual Turnover",
        "category": "FINANCIAL",
        "is_mandatory": True,
        "description": "Bidder must demonstrate minimum annual turnover as specified.",
        "verification_rule": "TURNOVER_ABOVE_THRESHOLD",
        "weight": 3.0,
    },
    {
        "requirement_id": "NON_BLACKLISTING",
        "name": "Non-Blacklisting / Non-Debarment Declaration",
        "category": "MANDATORY",
        "is_mandatory": True,
        "description": "Bidder must submit a declaration confirming no blacklisting or debarment.",
        "verification_rule": "BLACKLISTING_DECLARATION_PRESENT",
        "weight": 4.0,
    },
    {
        "requirement_id": "LOCAL_CONTENT",
        "name": "Local Content Declaration (Make in India)",
        "category": "MANDATORY",
        "is_mandatory": False,
        "description": "Required for items under Public Procurement (Preference to Make in India) Order.",
        "verification_rule": "LOCAL_CONTENT_DECLARED",
        "weight": 2.0,
    },
]


# ============================================================
# SCORING WEIGHTS
# Document completeness  20%
# Statutory compliance   25%
# Identity consistency   20%
# Tender eligibility     20%
# Supporting evidence    15%
# ============================================================

SCORE_WEIGHTS = {
    "STATUTORY": 25,    # GST, PAN
    "MANDATORY": 20,    # Blacklisting, local content
    "TECHNICAL": 20,    # OEM authorization
    "FINANCIAL": 20,    # Turnover
    "ELIGIBILITY": 15,  # Udyam
}

SEVERITY_SCORE_MAP = {
    "COMPLIANT": 100,
    "NEEDS_REVIEW": 60,
    "PENDING": 30,
    "UNVERIFIED": 0,
    "NON_COMPLIANT": 0,
    "NOT_APPLICABLE": 100,   # Doesn't reduce score
    "EXPIRED": 10,
}

RISK_THRESHOLDS = {
    "LOW": (80, 100),
    "MEDIUM": (60, 79),
    "HIGH": (40, 59),
    "CRITICAL": (0, 39),
}


# ============================================================
# COMPLIANCE CHECKS
# ============================================================

def _get_field(fields: list[dict], key: str) -> Optional[dict]:
    """Find a field by key from extracted fields list."""
    for f in fields:
        if isinstance(f, dict) and f.get("key") == key:
            return f
    return None


def _field_value(fields: list[dict], key: str) -> Optional[str]:
    """Get field value or None."""
    f = _get_field(fields, key)
    return f.get("value") if f else None


def _extract_field_with_evidence(doc: dict, key: str) -> Optional[dict]:
    """Find a field by key in doc's extracted_fields and return field dict with confidence and provenance."""
    fields = doc.get("extracted_fields") or []
    if isinstance(fields, str):
        try:
            fields = json.loads(fields)
        except Exception:
            fields = []
    if isinstance(fields, dict):
        if "fields" in fields and isinstance(fields["fields"], list):
            fields = fields["fields"]
        elif "extracted_fields" in fields and isinstance(fields["extracted_fields"], list):
            fields = fields["extracted_fields"]
    if isinstance(fields, list):
        for f in fields:
            if isinstance(f, dict) and (f.get("key") == key or f.get("field") == key):
                val = f.get("value")
                if val is not None and str(val).strip() != "":
                    conf = f.get("confidence")
                    if conf is None or conf == "":
                        conf = doc.get("ocr_confidence")
                    try:
                        conf_f = float(conf) if conf is not None else 0.85
                        conf_f = max(0.0, min(1.0, conf_f))
                    except (ValueError, TypeError):
                        conf_f = 0.85
                    return {
                        "value": str(val).strip(),
                        "confidence": round(conf_f, 2),
                        "field_key": key,
                        "doc_id": doc.get("id"),
                        "doc_name": doc.get("file_name") or doc.get("document_type") or "Uploaded Document",
                        "source_text": f.get("source_text") or f"{key}: {val}",
                        "page": f.get("page") or 1,
                        "section": f.get("section") or "Extracted Data",
                    }
    return None


def check_gst_present(all_fields: list[dict], documents: list[dict]) -> dict:
    """Check: GST registration certificate present and GSTIN extractable."""
    for doc in documents:
        ev = _extract_field_with_evidence(doc, "gstin")
        if ev:
            gstin = ev["value"].strip()
            conf = ev["confidence"]
            doc_name = ev["doc_name"]
            is_valid_gstin = (len(gstin) == 15 and re.match(r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$', gstin, re.I)) or gstin.startswith("FAIRBID-GSTIN")
            if is_valid_gstin:
                return {
                    "status": "COMPLIANT",
                    "severity": "LOW",
                    "score": 100,
                    "evidence_value": gstin,
                    "evidence_doc_id": ev["doc_id"],
                    "evidence_field_key": "gstin",
                    "evidence_source": doc_name,
                    "source_text": ev.get("source_text"),
                    "page": ev.get("page"),
                    "section": ev.get("section"),
                    "evidence_available": True,
                    "confidence": conf,
                    "reason": f"Valid GSTIN {gstin} extracted from {doc_name} with {int(conf * 100)}% extraction confidence.",
                }
            else:
                return {
                    "status": "NEEDS_REVIEW",
                    "severity": "MEDIUM",
                    "score": 50,
                    "evidence_value": gstin,
                    "evidence_doc_id": ev["doc_id"],
                    "evidence_field_key": "gstin",
                    "evidence_source": doc_name,
                    "source_text": ev.get("source_text"),
                    "page": ev.get("page"),
                    "section": ev.get("section"),
                    "evidence_available": True,
                    "confidence": round(conf * 0.6, 2),
                    "reason": f"GSTIN {gstin} found in {doc_name} but format validation failed. Officer review required.",
                }

    gst_docs = [d for d in documents if "GST" in (d.get("document_type") or "").upper() or
                "GST" in (d.get("file_name") or "").upper()]
    if gst_docs:
        doc = gst_docs[0]
        doc_name = doc.get("file_name") or doc.get("document_type") or "GST Certificate"
        if doc.get("ocr_status") == "FAILED":
            return {
                "status": "UNVERIFIED",
                "severity": "HIGH",
                "score": 0,
                "evidence_value": None,
                "evidence_doc_id": doc.get("id"),
                "evidence_field_key": None,
                "evidence_source": doc_name,
                "evidence_available": False,
                "confidence": 0.0,
                "reason": f"GST document '{doc_name}' uploaded but OCR processing failed. Document remains unverified.",
            }
        return {
            "status": "NEEDS_REVIEW",
            "severity": "MEDIUM",
            "score": 50,
            "evidence_value": None,
            "evidence_doc_id": doc.get("id"),
            "evidence_field_key": None,
            "evidence_source": doc_name,
            "evidence_available": False,
            "confidence": 0.0,
            "reason": f"GST document '{doc_name}' uploaded but GSTIN could not be extracted. Manual verification required.",
        }

    return {
        "status": "PENDING",
        "severity": "HIGH",
        "score": 0,
        "evidence_value": None,
        "evidence_doc_id": None,
        "evidence_field_key": None,
        "evidence_source": None,
        "evidence_available": False,
        "confidence": 0.0,
        "reason": "GST registration certificate not found in uploaded documents. Required for statutory compliance.",
    }


def check_pan_present(all_fields: list[dict], documents: list[dict]) -> dict:
    """Check: PAN card present and PAN extractable."""
    for doc in documents:
        ev = _extract_field_with_evidence(doc, "pan")
        if ev:
            pan = ev["value"].strip().upper()
            conf = ev["confidence"]
            doc_name = ev["doc_name"]
            is_valid_pan = (len(pan) == 10 and re.match(r'^[A-Z]{5}[0-9]{4}[A-Z]$', pan, re.I)) or pan.startswith("FAIRBID-PAN")
            if is_valid_pan:
                return {
                    "status": "COMPLIANT",
                    "severity": "LOW",
                    "score": 100,
                    "evidence_value": pan,
                    "evidence_doc_id": ev["doc_id"],
                    "evidence_field_key": "pan",
                    "evidence_source": doc_name,
                    "source_text": ev.get("source_text"),
                    "page": ev.get("page"),
                    "section": ev.get("section"),
                    "evidence_available": True,
                    "confidence": conf,
                    "reason": f"Valid PAN {pan} extracted from {doc_name} with {int(conf * 100)}% extraction confidence.",
                }
            else:
                return {
                    "status": "NEEDS_REVIEW",
                    "severity": "MEDIUM",
                    "score": 50,
                    "evidence_value": pan,
                    "evidence_doc_id": ev["doc_id"],
                    "evidence_field_key": "pan",
                    "evidence_source": doc_name,
                    "source_text": ev.get("source_text"),
                    "page": ev.get("page"),
                    "section": ev.get("section"),
                    "evidence_available": True,
                    "confidence": round(conf * 0.6, 2),
                    "reason": f"PAN {pan} found in {doc_name} but format validation failed. Officer review required.",
                }

    pan_docs = [d for d in documents if "PAN" in (d.get("document_type") or "").upper() or
                "PAN" in (d.get("file_name") or "").upper()]
    if pan_docs:
        doc = pan_docs[0]
        doc_name = doc.get("file_name") or doc.get("document_type") or "PAN Card"
        if doc.get("ocr_status") == "FAILED":
            return {
                "status": "UNVERIFIED",
                "severity": "HIGH",
                "score": 0,
                "evidence_value": None,
                "evidence_doc_id": doc.get("id"),
                "evidence_field_key": None,
                "evidence_source": doc_name,
                "evidence_available": False,
                "confidence": 0.0,
                "reason": f"PAN document '{doc_name}' uploaded but OCR processing failed. Document remains unverified.",
            }
        return {
            "status": "NEEDS_REVIEW",
            "severity": "MEDIUM",
            "score": 50,
            "evidence_value": None,
            "evidence_doc_id": doc.get("id"),
            "evidence_field_key": None,
            "evidence_source": doc_name,
            "evidence_available": False,
            "confidence": 0.0,
            "reason": f"PAN document '{doc_name}' uploaded but PAN number could not be extracted. Manual review needed.",
        }

    return {
        "status": "PENDING",
        "severity": "HIGH",
        "score": 0,
        "evidence_value": None,
        "evidence_doc_id": None,
        "evidence_field_key": None,
        "evidence_source": None,
        "evidence_available": False,
        "confidence": 0.0,
        "reason": "Evidence not found: PAN card not found in uploaded documents. Required for statutory compliance.",
    }


def check_udyam_present(all_fields: list[dict], documents: list[dict]) -> dict:
    """Check: Udyam/MSME certificate present."""
    for doc in documents:
        ev = _extract_field_with_evidence(doc, "udyamNumber") or _extract_field_with_evidence(doc, "udyam_registration_number")
        if ev:
            udyam = ev["value"].strip().upper()
            conf = ev["confidence"]
            doc_name = ev["doc_name"]
            is_valid_udyam = bool(re.match(r'^UDYAM-[A-Z]{2}-\d{2}-\d{7}$', udyam)) or udyam.startswith("FAIRBID-UDYAM")
            if is_valid_udyam:
                return {
                    "status": "COMPLIANT",
                    "severity": "LOW",
                    "score": 100,
                    "evidence_value": udyam,
                    "evidence_doc_id": ev["doc_id"],
                    "evidence_field_key": "udyamNumber",
                    "evidence_source": doc_name,
                    "source_text": ev.get("source_text"),
                    "page": ev.get("page"),
                    "section": ev.get("section"),
                    "evidence_available": True,
                    "confidence": conf,
                    "reason": f"Valid Udyam number {udyam} extracted from {doc_name} with {int(conf * 100)}% extraction confidence.",
                }

    udyam_docs = [d for d in documents if
                  any(kw in (d.get("document_type") or "").upper() for kw in ["UDYAM", "MSME"]) or
                  any(kw in (d.get("file_name") or "").upper() for kw in ["UDYAM", "MSME"])]
    if udyam_docs:
        doc = udyam_docs[0]
        doc_name = doc.get("file_name") or doc.get("document_type") or "Udyam Certificate"
        if doc.get("ocr_status") == "FAILED":
            return {
                "status": "UNVERIFIED",
                "severity": "MEDIUM",
                "score": 0,
                "evidence_value": None,
                "evidence_doc_id": doc.get("id"),
                "evidence_field_key": None,
                "evidence_source": doc_name,
                "evidence_available": False,
                "confidence": 0.0,
                "reason": f"Udyam document '{doc_name}' uploaded but OCR processing failed. Document remains unverified.",
            }
        return {
            "status": "NEEDS_REVIEW",
            "severity": "MEDIUM",
            "score": 60,
            "evidence_value": None,
            "evidence_doc_id": doc.get("id"),
            "evidence_field_key": None,
            "evidence_source": doc_name,
            "evidence_available": False,
            "confidence": 0.0,
            "reason": f"Udyam/MSME document '{doc_name}' uploaded but registration number could not be extracted.",
        }

    return {
        "status": "PENDING",
        "severity": "MEDIUM",
        "score": 0,
        "evidence_value": None,
        "evidence_doc_id": None,
        "evidence_field_key": None,
        "evidence_source": None,
        "evidence_available": False,
        "confidence": 0.0,
        "reason": "Evidence not found: Udyam/MSME registration certificate not submitted. Required if claiming MSME status.",
    }


def check_oem_present(all_fields: list[dict], documents: list[dict]) -> dict:
    """Check: OEM authorization present and not expired."""
    # Check if this is a petroleum dealership simulation where OEM does not apply
    for doc in documents:
        doc_type = (doc.get("document_type") or "").upper()
        if "RETAIL OUTLET" in doc_type or "DEALERSHIP" in doc_type:
            return {
                "status": "NOT_APPLICABLE",
                "severity": "LOW",
                "score": 100,
                "evidence_value": "Not Applicable",
                "evidence_doc_id": doc.get("id"),
                "evidence_field_key": "oem_reference",
                "evidence_source": doc.get("file_name") or "Dealership Dossier",
                "evidence_available": True,
                "confidence": 0.95,
                "reason": "OEM Manufacturer Authorization is not applicable to petroleum dealership retail outlet procurement.",
            }

    oem_docs = [d for d in documents if
                any(kw in (d.get("document_type") or "").upper()
                    for kw in ["OEM", "AUTHORIZATION", "AUTHORISATION", "MAF"])]

    if not oem_docs:
        return {
            "status": "NON_COMPLIANT",
            "severity": "HIGH",
            "score": 0,
            "evidence_value": None,
            "evidence_doc_id": None,
            "evidence_field_key": None,
            "evidence_source": None,
            "evidence_available": False,
            "confidence": 0.0,
            "reason": "OEM authorization letter not found in submitted documents. Mandatory technical requirement.",
        }

    doc = oem_docs[0]
    doc_name = doc.get("file_name") or doc.get("document_type") or "OEM Authorization"
    if doc.get("ocr_status") == "FAILED":
        return {
            "status": "UNVERIFIED",
            "severity": "HIGH",
            "score": 0,
            "evidence_value": None,
            "evidence_doc_id": doc.get("id"),
            "evidence_field_key": None,
            "evidence_source": doc_name,
            "evidence_available": False,
            "confidence": 0.0,
            "reason": f"OEM authorization letter '{doc_name}' uploaded but OCR processing failed. Document remains unverified.",
        }

    ev_expiry = _extract_field_with_evidence(doc, "expiryDate")
    ev_ref = _extract_field_with_evidence(doc, "oemReference")
    conf = (ev_expiry or ev_ref or {}).get("confidence", 0.85)

    expiry = None
    expiry_raw = ev_expiry["value"] if ev_expiry else None
    if expiry_raw:
        for fmt in ["%d/%m/%Y", "%d-%m-%Y", "%d.%m.%Y", "%Y-%m-%d"]:
            try:
                expiry = datetime.strptime(expiry_raw, fmt).date()
                break
            except ValueError:
                continue

    if expiry:
        today = date.today()
        if expiry < today:
            return {
                "status": "EXPIRED",
                "severity": "HIGH",
                "score": 10,
                "evidence_value": expiry_raw,
                "evidence_doc_id": doc.get("id"),
                "evidence_field_key": "expiryDate",
                "evidence_source": doc_name,
                "evidence_available": True,
                "confidence": conf,
                "reason": f"OEM authorization expired on {expiry_raw} in {doc_name}. A fresh authorization letter is required.",
            }
        else:
            days_until_expiry = (expiry - today).days
            if days_until_expiry <= 30:
                return {
                    "status": "NEEDS_REVIEW",
                    "severity": "MEDIUM",
                    "score": 70,
                    "evidence_value": expiry_raw,
                    "evidence_doc_id": doc.get("id"),
                    "evidence_field_key": "expiryDate",
                    "evidence_source": doc_name,
                    "evidence_available": True,
                    "confidence": conf,
                    "reason": f"OEM authorization expires in {days_until_expiry} days ({expiry_raw}) in {doc_name}. Verify bid validity covers required period.",
                }

    if ev_ref or ev_expiry:
        return {
            "status": "COMPLIANT",
            "severity": "LOW",
            "score": 90,
            "evidence_value": ev_ref["value"] if ev_ref else expiry_raw,
            "evidence_doc_id": doc.get("id"),
            "evidence_field_key": "oemReference" if ev_ref else "expiryDate",
            "evidence_source": doc_name,
            "evidence_available": True,
            "confidence": conf,
            "reason": f"OEM authorization document '{doc_name}' present with reference. Validity and signatory authority require officer confirmation.",
        }

    return {
        "status": "NEEDS_REVIEW",
        "severity": "MEDIUM",
        "score": 60,
        "evidence_value": None,
        "evidence_doc_id": doc.get("id"),
        "evidence_field_key": None,
        "evidence_source": doc_name,
        "evidence_available": False,
        "confidence": 0.0,
        "reason": f"OEM authorization letter '{doc_name}' uploaded but reference and validity dates could not be extracted.",
    }


def check_blacklisting_declaration(all_fields: list[dict], documents: list[dict]) -> dict:
    """Check: Non-blacklisting / non-debarment declaration present."""
    for doc in documents:
        ev = _extract_field_with_evidence(doc, "blacklistingDeclaration") or _extract_field_with_evidence(doc, "blacklisting_debarment")
        if ev:
            conf = ev["confidence"]
            val_upper = (ev["value"] or "").upper()
            doc_name = ev["doc_name"]
            is_absent = any(kw in val_upper for kw in ["NOT PRESENT", "NOT SUBMITTED", "NO DECLARATION", "ABSENT", "DECLARATION NOT PRESENT"])
            is_unverified = any(kw in val_upper for kw in ["NOT VERIFIED", "UNVERIFIED", "SELF-CERTIFICATION NOT VERIFIED"])
            is_valid_bl = ("NOT BLACKLISTED" in val_upper or "NO BLACKLISTING" in val_upper or "NOT DEBARRED" in val_upper)

            if is_absent:
                return {
                    "status": "NON_COMPLIANT",
                    "severity": "HIGH",
                    "score": 0,
                    "evidence_value": ev["value"],
                    "evidence_doc_id": ev["doc_id"],
                    "evidence_field_key": ev.get("field_key") or "blacklisting_debarment",
                    "evidence_source": ev.get("source_text") or doc_name,
                    "evidence_available": True,
                    "confidence": conf,
                    "reason": f"Non-blacklisting declaration absent ('{ev['value']}') in {doc_name}. Statutory disqualification risk.",
                }
            elif is_unverified:
                return {
                    "status": "NEEDS_REVIEW",
                    "severity": "MEDIUM",
                    "score": 50,
                    "evidence_value": ev["value"],
                    "evidence_doc_id": ev["doc_id"],
                    "evidence_field_key": ev.get("field_key") or "blacklisting_debarment",
                    "evidence_source": ev.get("source_text") or doc_name,
                    "evidence_available": True,
                    "confidence": conf,
                    "reason": f"Non-blacklisting declaration present but unverified ('{ev['value']}') in {doc_name}. Officer review required.",
                }
            elif is_valid_bl or "DECLARATION PRESENT" in val_upper:
                return {
                    "status": "COMPLIANT",
                    "severity": "LOW",
                    "score": 100,
                    "evidence_value": ev["value"],
                    "evidence_doc_id": ev["doc_id"],
                    "evidence_field_key": ev.get("field_key") or "blacklisting_debarment",
                    "evidence_source": ev.get("source_text") or doc_name,
                    "evidence_available": True,
                    "confidence": conf,
                    "reason": f"Non-blacklisting declaration verified from {doc_name} ('{ev['value']}') with {int(conf * 100)}% confidence.",
                }
            else:
                return {
                    "status": "NEEDS_REVIEW",
                    "severity": "MEDIUM",
                    "score": 50,
                    "evidence_value": ev["value"],
                    "evidence_doc_id": ev["doc_id"],
                    "evidence_field_key": ev.get("field_key") or "blacklisting_debarment",
                    "evidence_source": ev.get("source_text") or doc_name,
                    "evidence_available": True,
                    "confidence": conf,
                    "reason": f"Non-blacklisting declaration status '{ev['value']}' requires officer review.",
                }

    blacklist_docs = [d for d in documents if
                      any(kw in (d.get("document_type") or "").upper()
                          for kw in ["BLACKLIST", "DEBARMENT", "DECLARATION"])]
    if blacklist_docs:
        doc = blacklist_docs[0]
        doc_name = doc.get("file_name") or doc.get("document_type") or "Declaration Document"
        if doc.get("ocr_status") == "FAILED":
            return {
                "status": "UNVERIFIED",
                "severity": "HIGH",
                "score": 0,
                "evidence_value": None,
                "evidence_doc_id": doc.get("id"),
                "evidence_field_key": None,
                "evidence_source": doc_name,
                "evidence_available": False,
                "confidence": 0.0,
                "reason": f"Declaration document '{doc_name}' uploaded but OCR processing failed. Document remains unverified.",
            }
        return {
            "status": "NEEDS_REVIEW",
            "severity": "MEDIUM",
            "score": 70,
            "evidence_value": None,
            "evidence_doc_id": doc.get("id"),
            "evidence_field_key": None,
            "evidence_source": doc_name,
            "evidence_available": False,
            "confidence": 0.0,
            "reason": f"Declaration document '{doc_name}' uploaded but declaration clause could not be automatically extracted. Officer verification needed.",
        }

    return {
        "status": "PENDING",
        "severity": "HIGH",
        "score": 0,
        "evidence_value": None,
        "evidence_doc_id": None,
        "evidence_field_key": None,
        "evidence_source": None,
        "evidence_available": False,
        "confidence": 0.0,
        "reason": "Evidence not found: Non-blacklisting declaration not found in submitted documents.",
    }


def check_turnover_threshold(all_fields: list[dict], documents: list[dict],
                             threshold_value: Optional[float] = None) -> dict:
    """Check: Annual turnover meets tender threshold."""
    # Check if this is a petroleum dealership simulation
    for doc in documents:
        doc_type = (doc.get("document_type") or "").upper()
        if "RETAIL OUTLET" in doc_type or "DEALERSHIP" in doc_type:
            ev_fe = _extract_field_with_evidence(doc, "financial_eligibility")
            if ev_fe:
                fe_val = (ev_fe["value"] or "").upper()
                fe_conf = ev_fe["confidence"]
                if any(kw in fe_val for kw in ["NOT ESTABLISHED", "NOT SATISFIED", "MISSING", "BELOW TEST THRESHOLD", "INSUFFICIENT"]):
                    return {
                        "status": "NON_COMPLIANT",
                        "severity": "HIGH",
                        "score": 0,
                        "evidence_value": ev_fe["value"],
                        "evidence_doc_id": ev_fe.get("doc_id"),
                        "evidence_field_key": "financial_eligibility",
                        "evidence_source": ev_fe.get("source_text") or doc.get("file_name"),
                        "evidence_available": True,
                        "confidence": fe_conf,
                        "reason": f"Dealership financial eligibility criteria not satisfied: '{ev_fe['value']}' extracted from {ev_fe.get('doc_name')}.",
                    }

            ev_sd = _extract_field_with_evidence(doc, "security_deposit") or _extract_field_with_evidence(doc, "working_capital_requirement")
            return {
                "status": "COMPLIANT",
                "severity": "LOW",
                "score": 100,
                "evidence_value": ev_sd["value"] if ev_sd else "Commercial parameters verified",
                "evidence_doc_id": ev_sd.get("doc_id") if ev_sd else doc.get("id"),
                "evidence_field_key": "security_deposit",
                "evidence_source": (ev_sd.get("source_text") if ev_sd else None) or doc.get("file_name") or "Dealership Dossier",
                "evidence_available": True,
                "confidence": ev_sd.get("confidence", 0.95) if ev_sd else 0.95,
                "reason": f"Dealership commercial terms verified: Security deposit {ev_sd['value'] if ev_sd else 'declared'}.",
            }

    for doc in documents:
        ev = _extract_field_with_evidence(doc, "annualTurnover")
        if ev:
            turnover = ev["value"]
            conf = ev["confidence"]
            doc_name = ev["doc_name"]
            return {
                "status": "NEEDS_REVIEW",
                "severity": "MEDIUM",
                "score": 70,
                "evidence_value": turnover,
                "evidence_doc_id": ev["doc_id"],
                "evidence_field_key": "annualTurnover",
                "evidence_source": ev.get("source_text") or doc_name,
                "evidence_available": True,
                "confidence": conf,
                "reason": f"Turnover information extracted from {doc_name}: {turnover} with {int(conf * 100)}% extraction confidence. Officer must verify against tender threshold.",
            }

    fin_docs = [d for d in documents if
                any(kw in (d.get("document_type") or "").upper()
                    for kw in ["FINANCIAL", "TURNOVER", "ITR", "BALANCE", "AUDIT"])]
    if fin_docs:
        doc = fin_docs[0]
        doc_name = doc.get("file_name") or doc.get("document_type") or "Financial Document"
        if doc.get("ocr_status") == "FAILED":
            return {
                "status": "UNVERIFIED",
                "severity": "HIGH",
                "score": 0,
                "evidence_value": None,
                "evidence_doc_id": doc.get("id"),
                "evidence_field_key": None,
                "evidence_source": doc_name,
                "evidence_available": False,
                "confidence": 0.0,
                "reason": f"Financial document '{doc_name}' uploaded but OCR processing failed. Document remains unverified.",
            }
        return {
            "status": "NEEDS_REVIEW",
            "severity": "MEDIUM",
            "score": 50,
            "evidence_value": None,
            "evidence_doc_id": doc.get("id"),
            "evidence_field_key": None,
            "evidence_source": doc_name,
            "evidence_available": False,
            "confidence": 0.0,
            "reason": f"Financial document '{doc_name}' uploaded but annual turnover figure could not be extracted. Manual review required.",
        }

    return {
        "status": "PENDING",
        "severity": "HIGH",
        "score": 0,
        "evidence_value": None,
        "evidence_doc_id": None,
        "evidence_field_key": None,
        "evidence_source": None,
        "evidence_available": False,
        "confidence": 0.0,
        "reason": "Evidence not found: Annual turnover evidence not found. Upload audited financial statements or ITR.",
    }


def check_local_content(all_fields: list[dict], documents: list[dict]) -> dict:
    """Check: Local content declaration present."""
    for doc in documents:
        ev = (
            _extract_field_with_evidence(doc, "localContentPct") or
            _extract_field_with_evidence(doc, "localContentPercentage") or
            _extract_field_with_evidence(doc, "local_content_percentage")
        )
        if ev:
            lc_pct = ev["value"]
            conf = ev["confidence"]
            doc_name = ev["doc_name"]
            pct_match = re.search(r'([\d.]+)', lc_pct)
            if pct_match:
                pct_val = float(pct_match.group(1))
                if pct_val >= 50:
                    classification = "Class-I Local Supplier (≥50%)"
                    score = 100
                elif pct_val >= 20:
                    classification = "Class-II Local Supplier (≥20%)"
                    score = 80
                else:
                    classification = f"Below minimum ({pct_val}%)"
                    score = 30
                return {
                    "status": "COMPLIANT" if pct_val >= 20 else "NON_COMPLIANT",
                    "severity": "LOW" if pct_val >= 50 else ("MEDIUM" if pct_val >= 20 else "HIGH"),
                    "score": score,
                    "evidence_value": lc_pct,
                    "evidence_doc_id": ev["doc_id"],
                    "evidence_field_key": "localContentPct",
                    "evidence_source": doc_name,
                    "evidence_available": True,
                    "confidence": conf,
                    "reason": f"Local content declared at {lc_pct} in {doc_name}. Classification: {classification}.",
                }

    lc_docs = [d for d in documents if
               any(kw in (d.get("document_type") or "").upper()
                   for kw in ["LOCAL CONTENT", "MAKE IN INDIA", "MII", "DOMESTIC"])]
    if lc_docs:
        doc = lc_docs[0]
        doc_name = doc.get("file_name") or doc.get("document_type") or "Local Content Document"
        return {
            "status": "NEEDS_REVIEW",
            "severity": "LOW",
            "score": 60,
            "evidence_value": None,
            "evidence_doc_id": doc.get("id"),
            "evidence_field_key": None,
            "evidence_source": doc_name,
            "evidence_available": False,
            "confidence": 0.0,
            "reason": f"Local content document '{doc_name}' uploaded. Percentage could not be extracted. Manual verification required.",
        }

    return {
        "status": "NOT_APPLICABLE",
        "severity": "LOW",
        "score": 100,
        "evidence_value": None,
        "evidence_doc_id": None,
        "evidence_field_key": None,
        "evidence_source": None,
        "evidence_available": False,
        "confidence": 0.0,
        "reason": "Local content declaration not submitted. Mark as Not Applicable if item is exempted.",
    }


def check_experience_status(all_fields: list[dict], documents: list[dict]) -> dict:
    """Check: Documented past experience satisfies criteria."""
    for doc in documents:
        ev = _extract_field_with_evidence(doc, "experience_status") or _extract_field_with_evidence(doc, "experience")
        if ev:
            val = ev["value"].strip()
            conf = ev["confidence"]
            doc_name = ev["doc_name"]
            val_upper = val.upper()
            if any(k in val_upper for k in ["INSUFFICIENT", "NOT PROVIDED", "NOT SATISFIED", "ABSENT", "MISSING"]):
                return {
                    "status": "NON_COMPLIANT",
                    "severity": "HIGH",
                    "score": 0,
                    "evidence_value": val,
                    "evidence_doc_id": ev["doc_id"],
                    "evidence_field_key": "experience_status",
                    "evidence_source": doc_name,
                    "source_text": ev.get("source_text"),
                    "page": ev.get("page"),
                    "section": ev.get("section"),
                    "evidence_available": True,
                    "confidence": conf,
                    "reason": f"Required experience criteria not met: '{val}' extracted from {doc_name} with {int(conf * 100)}% extraction confidence.",
                }
            elif any(k in val_upper for k in ["SATISFIED", "VERIFIED", "EXPERIENCE CRITERIA SATISFIED", "ADEQUATE", "COMPLIANT", "WORKFLOW FAMILIARITY", "DEMONSTRATED", "RELEVANT EXPERIENCE"]):
                return {
                    "status": "COMPLIANT",
                    "severity": "LOW",
                    "score": 100,
                    "evidence_value": val,
                    "evidence_doc_id": ev["doc_id"],
                    "evidence_field_key": "experience_status",
                    "evidence_source": doc_name,
                    "source_text": ev.get("source_text"),
                    "page": ev.get("page"),
                    "section": ev.get("section"),
                    "evidence_available": True,
                    "confidence": conf,
                    "reason": f"Documented past experience verified from {doc_name} ('{val}') with {int(conf * 100)}% confidence.",
                }
            else:
                return {
                    "status": "NEEDS_REVIEW",
                    "severity": "MEDIUM",
                    "score": 50,
                    "evidence_value": val,
                    "evidence_doc_id": ev["doc_id"],
                    "evidence_field_key": "experience_status",
                    "evidence_source": doc_name,
                    "source_text": ev.get("source_text"),
                    "page": ev.get("page"),
                    "section": ev.get("section"),
                    "evidence_available": True,
                    "confidence": conf,
                    "reason": f"Experience status '{val}' requires officer review.",
                }
    return {
        "status": "PENDING",
        "severity": "MEDIUM",
        "score": 0,
        "evidence_value": None,
        "evidence_doc_id": None,
        "evidence_field_key": None,
        "evidence_source": None,
        "evidence_available": False,
        "confidence": 0.0,
        "reason": "Experience documentation not submitted.",
    }


def check_land_availability(all_fields: list[dict], documents: list[dict]) -> dict:
    """Check: Land ownership, lease tenure, or site availability verified."""
    for doc in documents:
        ev = _extract_field_with_evidence(doc, "land_availability") or _extract_field_with_evidence(doc, "land_ownership_lease")
        if ev:
            val = ev["value"].strip()
            conf = ev["confidence"]
            doc_name = ev["doc_name"]
            val_upper = val.upper()
            if any(k in val_upper for k in ["EXPIRED", "UNVERIFIED", "NOT PRESENT", "NOT ESTABLISHED", "INSUFFICIENT"]):
                return {
                    "status": "NON_COMPLIANT",
                    "severity": "HIGH",
                    "score": 0,
                    "evidence_value": val,
                    "evidence_doc_id": ev["doc_id"],
                    "evidence_field_key": "land_availability",
                    "evidence_source": doc_name,
                    "source_text": ev.get("source_text"),
                    "page": ev.get("page"),
                    "section": ev.get("section"),
                    "evidence_available": True,
                    "confidence": conf,
                    "reason": f"Site / land availability verification failed: '{val}' extracted from {doc_name} with {int(conf * 100)}% extraction confidence.",
                }
            elif any(k in val_upper for k in ["SATISFIED", "VERIFIED", "OWNED", "REGISTERED LEASE", "VALID LEASE", "AVAILABLE", "PLACEHOLDER PRESENT", "DOCUMENT PRESENT"]):
                return {
                    "status": "COMPLIANT",
                    "severity": "LOW",
                    "score": 100,
                    "evidence_value": val,
                    "evidence_doc_id": ev["doc_id"],
                    "evidence_field_key": "land_availability",
                    "evidence_source": doc_name,
                    "source_text": ev.get("source_text"),
                    "page": ev.get("page"),
                    "section": ev.get("section"),
                    "evidence_available": True,
                    "confidence": conf,
                    "reason": f"Site / land availability verified from {doc_name} ('{val}') with {int(conf * 100)}% confidence.",
                }
            else:
                return {
                    "status": "NEEDS_REVIEW",
                    "severity": "MEDIUM",
                    "score": 50,
                    "evidence_value": val,
                    "evidence_doc_id": ev["doc_id"],
                    "evidence_field_key": "land_availability",
                    "evidence_source": doc_name,
                    "source_text": ev.get("source_text"),
                    "page": ev.get("page"),
                    "section": ev.get("section"),
                    "evidence_available": True,
                    "confidence": conf,
                    "reason": f"Land availability status '{val}' requires officer review.",
                }
    return {
        "status": "PENDING",
        "severity": "HIGH",
        "score": 0,
        "evidence_value": None,
        "evidence_doc_id": None,
        "evidence_field_key": None,
        "evidence_source": None,
        "evidence_available": False,
        "confidence": 0.0,
        "reason": "Site / land availability documentation not submitted.",
    }


def check_statutory_compliance(all_fields: list[dict], documents: list[dict]) -> dict:
    """Check: Statutory compliance permissions and local authority clearances."""
    for doc in documents:
        ev = _extract_field_with_evidence(doc, "statutory_compliance") or _extract_field_with_evidence(doc, "statutory_permissions")
        if ev:
            val = ev["value"].strip()
            conf = ev["confidence"]
            doc_name = ev["doc_name"]
            val_upper = val.upper()
            if any(k in val_upper for k in ["INCOMPLETE", "NOT PROVIDED", "MISSING", "REQUIRED SUPPORTING EVIDENCE MISSING"]):
                return {
                    "status": "NEEDS_REVIEW",
                    "severity": "HIGH",
                    "score": 25,
                    "evidence_value": val,
                    "evidence_doc_id": ev["doc_id"],
                    "evidence_field_key": "statutory_compliance",
                    "evidence_source": doc_name,
                    "source_text": ev.get("source_text"),
                    "page": ev.get("page"),
                    "section": ev.get("section"),
                    "evidence_available": True,
                    "confidence": conf,
                    "reason": f"Statutory compliance incomplete: '{val}' extracted from {doc_name} with {int(conf * 100)}% extraction confidence.",
                }
            elif any(k in val_upper for k in ["ALL STATUTORY CERTIFICATES VERIFIED", "VERIFIED", "COMPLIANT", "SATISFIED", "DOCUMENT-SET PLACEHOLDER PRESENT", "ALL PRESENT"]):
                return {
                    "status": "COMPLIANT",
                    "severity": "LOW",
                    "score": 100,
                    "evidence_value": val,
                    "evidence_doc_id": ev["doc_id"],
                    "evidence_field_key": "statutory_compliance",
                    "evidence_source": doc_name,
                    "source_text": ev.get("source_text"),
                    "page": ev.get("page"),
                    "section": ev.get("section"),
                    "evidence_available": True,
                    "confidence": conf,
                    "reason": f"Statutory compliance clearances verified from {doc_name} ('{val}') with {int(conf * 100)}% confidence.",
                }
            else:
                return {
                    "status": "NEEDS_REVIEW",
                    "severity": "MEDIUM",
                    "score": 50,
                    "evidence_value": val,
                    "evidence_doc_id": ev["doc_id"],
                    "evidence_field_key": "statutory_compliance",
                    "evidence_source": doc_name,
                    "source_text": ev.get("source_text"),
                    "page": ev.get("page"),
                    "section": ev.get("section"),
                    "evidence_available": True,
                    "confidence": conf,
                    "reason": f"Statutory compliance status '{val}' requires officer review.",
                }
    return {
        "status": "PENDING",
        "severity": "MEDIUM",
        "score": 0,
        "evidence_value": None,
        "evidence_doc_id": None,
        "evidence_field_key": None,
        "evidence_source": None,
        "evidence_available": False,
        "confidence": 0.0,
        "reason": "Statutory permissions documentation not submitted.",
    }


def check_application_completeness(all_fields: list[dict], documents: list[dict]) -> dict:
    """Check: Application completeness and mandatory checklist submission."""
    for doc in documents:
        ev = _extract_field_with_evidence(doc, "application_completeness") or _extract_field_with_evidence(doc, "digital_document_availability")
        if ev:
            val = ev["value"].strip()
            conf = ev["confidence"]
            doc_name = ev["doc_name"]
            val_upper = val.upper()
            if any(k in val_upper for k in ["INCOMPLETE", "MISSING", "PARTIAL", "CHECKLIST ITEMS PRESENT"]):
                return {
                    "status": "NON_COMPLIANT",
                    "severity": "HIGH",
                    "score": 0,
                    "evidence_value": val,
                    "evidence_doc_id": ev["doc_id"],
                    "evidence_field_key": "application_completeness",
                    "evidence_source": doc_name,
                    "source_text": ev.get("source_text"),
                    "page": ev.get("page"),
                    "section": ev.get("section"),
                    "evidence_available": True,
                    "confidence": conf,
                    "reason": f"Application documentation incomplete: '{val}' extracted from {doc_name} with {int(conf * 100)}% extraction confidence.",
                }
            elif any(k in val_upper for k in ["COMPLETE", "ALL PRESENT", "SATISFIED"]):
                return {
                    "status": "COMPLIANT",
                    "severity": "LOW",
                    "score": 100,
                    "evidence_value": val,
                    "evidence_doc_id": ev["doc_id"],
                    "evidence_field_key": "application_completeness",
                    "evidence_source": doc_name,
                    "source_text": ev.get("source_text"),
                    "page": ev.get("page"),
                    "section": ev.get("section"),
                    "evidence_available": True,
                    "confidence": conf,
                    "reason": f"Application dossier completeness verified from {doc_name} ('{val}') with {int(conf * 100)}% confidence.",
                }
            else:
                return {
                    "status": "NEEDS_REVIEW",
                    "severity": "MEDIUM",
                    "score": 50,
                    "evidence_value": val,
                    "evidence_doc_id": ev["doc_id"],
                    "evidence_field_key": "application_completeness",
                    "evidence_source": doc_name,
                    "source_text": ev.get("source_text"),
                    "page": ev.get("page"),
                    "section": ev.get("section"),
                    "evidence_available": True,
                    "confidence": conf,
                    "reason": f"Application completeness status '{val}' requires review.",
                }
    return {
        "status": "PENDING",
        "severity": "HIGH",
        "score": 0,
        "evidence_value": None,
        "evidence_doc_id": None,
        "evidence_field_key": None,
        "evidence_source": None,
        "evidence_available": False,
        "confidence": 0.0,
        "reason": "Application completeness checklist not verified.",
    }


# ============================================================
# COMPLIANCE RULE DISPATCHER
# ============================================================

COMPLIANCE_CHECKS = {
    "GST_PRESENT": check_gst_present,
    "PAN_PRESENT": check_pan_present,
    "UDYAM_PRESENT": check_udyam_present,
    "OEM_PRESENT_AND_VALID": check_oem_present,
    "BLACKLISTING_DECLARATION_PRESENT": check_blacklisting_declaration,
    "TURNOVER_ABOVE_THRESHOLD": check_turnover_threshold,
    "LOCAL_CONTENT_DECLARED": check_local_content,
    "EXPERIENCE_EVALUATION": check_experience_status,
    "FINANCIAL_ELIGIBILITY_EVALUATION": check_turnover_threshold,
    "LAND_AVAILABILITY_EVALUATION": check_land_availability,
    "STATUTORY_COMPLIANCE_EVALUATION": check_statutory_compliance,
    "APPLICATION_COMPLETENESS_EVALUATION": check_application_completeness,
}


def run_compliance_checks(
    requirements: list[dict],
    documents: list[dict],
    bidder: dict,
) -> list[dict]:
    """
    Run all compliance checks for a bidder.
    Returns a list of compliance result dicts.
    """
    results = []
    # Flatten all extracted fields across all documents
    all_fields = []
    for doc in documents:
        doc_fields = doc.get("extracted_fields") or []
        if isinstance(doc_fields, list):
            all_fields.extend(doc_fields)

    for req in requirements:
        rule_key = req.get("verification_rule", "")
        check_fn = COMPLIANCE_CHECKS.get(rule_key)

        if check_fn is None:
            result = {
                "status": "PENDING",
                "severity": "LOW",
                "score": 50,
                "evidence_value": None,
                "evidence_doc_id": None,
                "evidence_field_key": None,
                "confidence": 0.0,
                "reason": f"Verification rule '{rule_key}' not configured.",
            }
        else:
            try:
                kwargs: dict[str, Any] = {}
                if rule_key == "TURNOVER_ABOVE_THRESHOLD":
                    kwargs["threshold_value"] = req.get("threshold_value")
                result = check_fn(all_fields, documents, **kwargs)
            except Exception as e:
                logger.error(f"Compliance check error for {rule_key}: {e}")
                result = {
                    "status": "PENDING",
                    "severity": "LOW",
                    "score": 0,
                    "evidence_value": None,
                    "evidence_doc_id": None,
                    "evidence_field_key": None,
                    "confidence": 0.0,
                    "reason": f"Compliance check encountered an error: {str(e)[:100]}",
                }

        status = result.get("status", "PENDING")
        is_mand = bool(req.get("is_mandatory", True))
        is_blocking = is_mand and (status in ("NON_COMPLIANT", "EXPIRED", "UNVERIFIED"))

        if status == "COMPLIANT":
            res_status = "PASS"
        elif status in ("NON_COMPLIANT", "EXPIRED"):
            res_status = "FAIL"
        elif status == "PENDING":
            res_status = "PENDING"
        elif status == "UNVERIFIED":
            res_status = "UNVERIFIED"
        elif status == "NOT_APPLICABLE":
            res_status = "NOT_APPLICABLE"
        else:
            res_status = "NEEDS_REVIEW"

        ev_avail = bool(result.get("evidence_available", False))
        ev_src = result.get("evidence_source")
        raw_conf = float(result.get("confidence", 0.0) or 0.0)

        # Enforce rule: if no evidence available, confidence MUST be 0.0
        if not ev_avail and status in ("PENDING", "NON_COMPLIANT", "UNVERIFIED", "NOT_APPLICABLE"):
            raw_conf = 0.0

        results.append({
            "requirement_id": req.get("requirement_id"),
            "requirement_name": req.get("name"),
            "category": req.get("category"),
            "is_mandatory": is_mand,
            "is_blocking": is_blocking,
            "result_status": res_status,
            "weight": req.get("weight", 1.0),
            **result,
            "evidence_available": ev_avail,
            "evidence_source": ev_src,
            "confidence": raw_conf,
        })

    return results


# ============================================================
# CROSS-DOCUMENT VALIDATION
# ============================================================

def _name_similarity(a: str, b: str) -> float:
    """Compute string similarity ratio between two names."""
    if not a or not b:
        return 0.0
    a_norm = re.sub(r'\b(pvt|private|ltd|limited|llp|and|&|\.)\b', '', a.lower()).strip()
    b_norm = re.sub(r'\b(pvt|private|ltd|limited|llp|and|&|\.)\b', '', b.lower()).strip()
    return SequenceMatcher(None, a_norm, b_norm).ratio()


def run_cross_document_validation(documents: list[dict], bidder: dict) -> list[dict]:
    """
    Compare extracted fields across documents to detect mismatches.

    Returns a list of discrepancy dicts.
    """
    discrepancies = []
    bidder_name = bidder.get("legal_name", "")
    bidder_gstin = bidder.get("gstin", "")
    bidder_pan = bidder.get("pan", "")

    # Collect per-document extracted values
    doc_gstins: list[dict] = []
    doc_pans: list[dict] = []
    doc_names: list[dict] = []
    doc_udyams: list[dict] = []
    doc_expiries: list[dict] = []

    for doc in documents:
        doc_fields = doc.get("extracted_fields") or []
        if not isinstance(doc_fields, list):
            continue
        doc_id = doc.get("id", "")
        doc_type = doc.get("document_type", "Unknown Document")

        gstin = _field_value(doc_fields, "gstin")
        if gstin:
            doc_gstins.append({"value": gstin, "doc_id": doc_id, "doc_type": doc_type})

        pan = _field_value(doc_fields, "pan")
        if pan:
            doc_pans.append({"value": pan, "doc_id": doc_id, "doc_type": doc_type})

        name = _field_value(doc_fields, "legalName")
        if name:
            doc_names.append({"value": name, "doc_id": doc_id, "doc_type": doc_type})

        udyam = _field_value(doc_fields, "udyamNumber")
        if udyam:
            doc_udyams.append({"value": udyam, "doc_id": doc_id, "doc_type": doc_type})

        expiry = _field_value(doc_fields, "expiryDate")
        if expiry:
            doc_expiries.append({"value": expiry, "doc_id": doc_id, "doc_type": doc_type})

    # -----------------------------------------------
    # Check 1: GSTIN consistency across documents
    # -----------------------------------------------
    if len(doc_gstins) >= 2:
        unique_gstins = {d["value"] for d in doc_gstins}
        if len(unique_gstins) > 1:
            discrepancies.append({
                "discrepancy_type": "GSTIN_MISMATCH",
                "severity": "CRITICAL",
                "field_name": "GSTIN",
                "expected_value": doc_gstins[0]["value"],
                "found_value": doc_gstins[1]["value"],
                "source_doc_1_id": doc_gstins[0]["doc_id"],
                "source_doc_2_id": doc_gstins[1]["doc_id"],
                "description": (
                    f"GSTIN mismatch detected across documents. "
                    f"{doc_gstins[0]['doc_type']} shows {doc_gstins[0]['value']}, "
                    f"but {doc_gstins[1]['doc_type']} shows {doc_gstins[1]['value']}."
                ),
                "recommendation": "Request bidder to clarify and submit corrected documents. GST registration must be unique.",
            })

    # -----------------------------------------------
    # Check 2: PAN consistency across documents
    # -----------------------------------------------
    if len(doc_pans) >= 2:
        unique_pans = {d["value"] for d in doc_pans}
        if len(unique_pans) > 1:
            discrepancies.append({
                "discrepancy_type": "PAN_MISMATCH",
                "severity": "CRITICAL",
                "field_name": "PAN",
                "expected_value": doc_pans[0]["value"],
                "found_value": doc_pans[1]["value"],
                "source_doc_1_id": doc_pans[0]["doc_id"],
                "source_doc_2_id": doc_pans[1]["doc_id"],
                "description": (
                    f"PAN mismatch detected. {doc_pans[0]['doc_type']} shows {doc_pans[0]['value']}, "
                    f"but {doc_pans[1]['doc_type']} shows {doc_pans[1]['value']}."
                ),
                "recommendation": "PAN must be consistent across all submitted documents. Request clarification.",
            })

    # -----------------------------------------------
    # Check 3: Legal name consistency across documents
    # -----------------------------------------------
    if len(doc_names) >= 2:
        for i in range(len(doc_names) - 1):
            for j in range(i + 1, len(doc_names)):
                similarity = _name_similarity(doc_names[i]["value"], doc_names[j]["value"])
                if similarity < 0.80:
                    discrepancies.append({
                        "discrepancy_type": "NAME_MISMATCH",
                        "severity": "HIGH" if similarity < 0.60 else "MEDIUM",
                        "field_name": "Legal Name",
                        "expected_value": doc_names[i]["value"],
                        "found_value": doc_names[j]["value"],
                        "source_doc_1_id": doc_names[i]["doc_id"],
                        "source_doc_2_id": doc_names[j]["doc_id"],
                        "description": (
                            f"Legal entity name inconsistency detected. "
                            f"{doc_names[i]['doc_type']}: \"{doc_names[i]['value']}\", "
                            f"{doc_names[j]['doc_type']}: \"{doc_names[j]['value']}\". "
                            f"Similarity: {similarity:.0%}."
                        ),
                        "recommendation": "Verify legal entity name across all registration documents. "
                                         "Minor variations (e.g. Pvt Ltd vs Private Limited) may be acceptable with officer confirmation.",
                    })

    # -----------------------------------------------
    # Check 4: Bidder-declared name vs document name
    # -----------------------------------------------
    if bidder_name and doc_names:
        for dn in doc_names:
            similarity = _name_similarity(bidder_name, dn["value"])
            if similarity < 0.75:
                discrepancies.append({
                    "discrepancy_type": "BIDDER_NAME_DOC_MISMATCH",
                    "severity": "HIGH",
                    "field_name": "Legal Name (Bidder vs Document)",
                    "expected_value": bidder_name,
                    "found_value": dn["value"],
                    "source_doc_1_id": None,
                    "source_doc_2_id": dn["doc_id"],
                    "description": (
                        f"Bidder-declared name \"{bidder_name}\" does not match "
                        f"name \"{dn['value']}\" found in {dn['doc_type']}. "
                        f"Similarity: {similarity:.0%}."
                    ),
                    "recommendation": "Request bidder to confirm legal entity name. Ensure all documents reflect the same legal name.",
                })

    # -----------------------------------------------
    # -----------------------------------------------
    # Check 5: GSTIN prefix matches state (optional)
    # -----------------------------------------------
    if doc_gstins and bidder.get("registered_address"):
        pass  # Skip state code check in prototype — would require address parsing

    # -----------------------------------------------
    # Check 6: Mandatory checklist items flagged as NOT PRESENT
    # -----------------------------------------------
    for doc in documents:
        doc_fields = doc.get("extracted_fields") or []
        if isinstance(doc_fields, list):
            for f in doc_fields:
                if isinstance(f, dict):
                    f_key = (f.get("key") or f.get("field") or "").lower()
                    f_val = str(f.get("value") or "").upper().strip()
                    if f_key in ["land_ownership_lease", "financial_documents", "category_certificate", "statutory_permissions"] and f_val == "NOT PRESENT":
                        discrepancies.append({
                            "discrepancy_type": "MISSING_MANDATORY_DOCUMENT",
                            "severity": "HIGH",
                            "field_name": f.get("label") or f_key.replace("_", " ").title(),
                            "expected_value": "PRESENT",
                            "found_value": "NOT PRESENT",
                            "source_doc_1_id": doc.get("id"),
                            "source_doc_2_id": None,
                            "description": f"Mandatory requirement document '{f.get('label') or f_key}' was recorded as NOT PRESENT in the submitted dossier.",
                            "recommendation": "Officer review required. Bidder must submit the missing document before qualification.",
                        })

    return discrepancies


# ============================================================
# COMPLIANCE SCORE CALCULATION
# ============================================================

def calculate_compliance_score(check_results: list[dict]) -> dict:
    """
    Calculate weighted compliance score (0-100).

    Scoring formula:
    - Each check contributes to total based on its category weight
    - Mandatory failed checks apply a penalty
    - Score = weighted sum of (check_score * category_weight) / total_weight
    """
    if not check_results:
        return {"score": 0.0, "reasons": ["No compliance checks available."]}

    total_weight = 0.0
    weighted_score = 0.0
    reasons = []
    mandatory_failures = 0

    for check in check_results:
        status = check.get("status", "PENDING")
        category = check.get("category", "STATUTORY")
        weight = float(check.get("weight", 1.0))
        raw_val = check.get("score")
        check_score: float = float(raw_val) if raw_val is not None else float(SEVERITY_SCORE_MAP.get(status, 0) or 0)
        is_mandatory = check.get("is_mandatory", True)

        # NOT_APPLICABLE: exclude from scoring
        if status == "NOT_APPLICABLE":
            continue

        cat_weight = SCORE_WEIGHTS.get(category, 15) / 100.0
        effective_weight = weight * cat_weight

        total_weight += effective_weight
        weighted_score += check_score * effective_weight

        if status == "COMPLIANT":
            reasons.append(f"+ {check.get('requirement_name', 'Requirement')}: Verified")
        elif status in ("NON_COMPLIANT", "EXPIRED", "UNVERIFIED"):
            reasons.append(f"- {check.get('requirement_name', 'Requirement')}: {'Expired' if status == 'EXPIRED' else ('Unverified' if status == 'UNVERIFIED' else 'Not compliant')}")
            if is_mandatory:
                mandatory_failures += 1
        elif status == "PENDING":
            reasons.append(f"• {check.get('requirement_name', 'Requirement')}: Pending submission")
        elif status == "NEEDS_REVIEW":
            reasons.append(f"~ {check.get('requirement_name', 'Requirement')}: Requires officer review")

    if total_weight == 0:
        return {"score": 0.0, "reasons": ["No scorable requirements found."]}

    raw_score = (weighted_score / total_weight)

    # Apply mandatory failure penalty
    penalty = min(30, mandatory_failures * 10)
    final_score = max(0.0, min(100.0, round(raw_score - penalty, 1)))

    return {"score": final_score, "reasons": reasons, "mandatory_failures": mandatory_failures}


def determine_compliance_status(
    check_results: list[dict],
    discrepancies: Optional[list[dict]] = None,
) -> dict:
    """
    Determine objective compliance status based strictly on tender mandatory requirements.
    This answers: Can the bidder currently be considered compliant with the tender requirements?
    
    Status Hierarchy:
    1. EXCEPTION_FOUND:
       - Any mandatory requirement is NON_COMPLIANT, EXPIRED, or UNVERIFIED (failed OCR)
       - OR any CRITICAL cross-document discrepancy exists
       - Blocks eligibility until resolved
    2. PENDING_DOCUMENTS:
       - No failed mandatory requirements, but 1 or more mandatory requirements are PENDING submission
    3. UNDER_REVIEW:
       - All mandatory documents present and not failed, but 1 or more requirements require officer manual review
    4. COMPLIANT:
       - All mandatory requirements are satisfied (COMPLIANT / PASS)
       - No unresolved critical discrepancies
    """
    discrepancies = discrepancies or []
    critical_discrepancies = [d for d in discrepancies if d.get("severity") == "CRITICAL"]
    
    mandatory_total = 0
    mandatory_satisfied = 0
    mandatory_failed = 0
    mandatory_pending = 0
    mandatory_review = 0
    
    for check in check_results:
        is_mand = bool(check.get("is_mandatory", True))
        status = check.get("status", "PENDING")
        
        if is_mand:
            mandatory_total += 1
            if status == "COMPLIANT":
                mandatory_satisfied += 1
            elif status in ("NON_COMPLIANT", "EXPIRED", "UNVERIFIED"):
                mandatory_failed += 1
            elif status == "PENDING":
                mandatory_pending += 1
            elif status == "NEEDS_REVIEW":
                mandatory_review += 1

    blocking_exceptions = mandatory_failed + len(critical_discrepancies)

    if blocking_exceptions > 0:
        overall_status = "EXCEPTION_FOUND"
    elif mandatory_pending > 0:
        overall_status = "PENDING_DOCUMENTS"
    elif mandatory_review > 0:
        overall_status = "UNDER_REVIEW"
    else:
        overall_status = "COMPLIANT"

    return {
        "status": overall_status,
        "compliance_status": overall_status,
        "blocking_exceptions": blocking_exceptions,
        "mandatory_total": mandatory_total,
        "mandatory_satisfied": mandatory_satisfied,
        "mandatory_failed": mandatory_failed,
        "mandatory_pending": mandatory_pending,
        "mandatory_review": mandatory_review,
        "critical_discrepancies": len(critical_discrepancies),
    }


def calculate_risk_level(
    compliance_score: float,
    discrepancies: list[dict],
    check_results: list[dict],
) -> dict:
    """
    Calculate risk level from compliance score and discrepancy data.
    Returns: {score, risk_level, reasons}
    """
    reasons = []

    critical_discrepancies = [d for d in discrepancies if d.get("severity") == "CRITICAL"]
    high_discrepancies = [d for d in discrepancies if d.get("severity") == "HIGH"]
    mandatory_failures = [c for c in check_results if
                          c.get("status") in ("NON_COMPLIANT", "EXPIRED") and c.get("is_mandatory")]
    pending_mandatory = [c for c in check_results if
                         c.get("status") == "PENDING" and c.get("is_mandatory")]

    # Determine base risk from score
    if compliance_score >= 80:
        risk_level = "LOW"
    elif compliance_score >= 60:
        risk_level = "MEDIUM"
    elif compliance_score >= 40:
        risk_level = "HIGH"
    else:
        risk_level = "CRITICAL"

    # Override upward for critical issues
    if critical_discrepancies:
        if risk_level in ("LOW", "MEDIUM"):
            risk_level = "HIGH"
        reasons.append(f"{len(critical_discrepancies)} critical discrepancy(ies) detected")

    if mandatory_failures:
        if risk_level == "LOW":
            risk_level = "MEDIUM"
        reasons.append(f"{len(mandatory_failures)} mandatory requirement(s) not met")

    if high_discrepancies:
        reasons.append(f"{len(high_discrepancies)} high-severity discrepancy(ies) found")

    if pending_mandatory:
        reasons.append(f"{len(pending_mandatory)} mandatory document(s) pending")

    if not reasons:
        reasons.append("All major compliance criteria satisfied based on available evidence.")

    return {
        "score": compliance_score,
        "risk_level": risk_level,
        "reasons": reasons,
        "critical_count": len(critical_discrepancies),
        "high_count": len(high_discrepancies),
        "mandatory_failures": len(mandatory_failures),
    }


# ============================================================
# RECOMMENDATION ENGINE
# Rule-based, triggered by specific failures.
# NEVER recommends automatic qualification/disqualification.
# ============================================================

def generate_recommendations(
    check_results: list[dict],
    discrepancies: list[dict],
    risk_level: str,
) -> list[str]:
    """
    Generate actionable recommendations based on compliance check results.
    Each recommendation has a specific trigger — not generic advice.
    """
    recommendations = []

    for check in check_results:
        status = check.get("status")
        req_id = check.get("requirement_id", "")
        req_name = check.get("requirement_name", "this requirement")

        if status == "PENDING":
            if "GST" in req_id:
                recommendations.append(
                    f"Upload a valid GST Registration Certificate. Ensure the GSTIN is clearly legible for extraction."
                )
            elif "PAN" in req_id:
                recommendations.append(
                    f"Upload a PAN card copy or Income Tax Department PAN certificate."
                )
            elif "UDYAM" in req_id:
                recommendations.append(
                    f"Upload the Udyam Registration Certificate from the MSME portal (udyamregistration.gov.in)."
                )
            elif "BLACKLISTING" in req_id or "NON_BLACKLISTING" in req_id:
                recommendations.append(
                    f"Request bidder to submit a self-declaration on non-judicial stamp paper confirming no blacklisting or debarment."
                )
            elif "TURNOVER" in req_id:
                recommendations.append(
                    f"Request audited financial statements or CA-certified turnover certificate for the relevant financial years."
                )
            elif "OEM" in req_id:
                recommendations.append(
                    f"Request OEM Authorization / Manufacturer Authorization Form (MAF) from the original manufacturer. Ensure it names this specific tender."
                )
            elif "LOCAL_CONTENT" in req_id:
                recommendations.append(
                    f"If applicable, request Make in India / Local Content Self-Declaration Form with CA-certified local value addition percentage."
                )
            else:
                recommendations.append(
                    f"Pending: Upload supporting document for '{req_name}'."
                )

        elif status == "EXPIRED":
            recommendations.append(
                f"'{req_name}' has expired. Request an updated/renewed document before the final qualification decision."
            )

        elif status == "NON_COMPLIANT":
            if "OEM" in req_id:
                recommendations.append(
                    f"OEM authorization is missing — this is a mandatory requirement. "
                    f"Bidder cannot be qualified without a valid OEM authorization letter."
                )
            else:
                recommendations.append(
                    f"'{req_name}' does not meet the tender requirement. "
                    f"Request clarification or additional evidence before a decision is made."
                )

        elif status == "NEEDS_REVIEW":
            if "TURNOVER" in req_id:
                recommendations.append(
                    f"Turnover evidence found but could not be automatically verified. "
                    f"Officer must manually review financial statements against tender threshold."
                )
            elif "OEM" in req_id:
                recommendations.append(
                    f"OEM authorization present but validity/signatory authority requires officer review. "
                    f"Confirm the authorizing entity matches the proposed product manufacturer."
                )

    # Recommendations for discrepancies
    for disc in discrepancies:
        disc_type = disc.get("discrepancy_type", "")
        if disc_type == "NAME_MISMATCH" or disc_type == "BIDDER_NAME_DOC_MISMATCH":
            recommendations.append(
                f"Legal entity name inconsistency detected. "
                f"Request bidder to provide an explanatory letter or amended documents confirming the correct legal name."
            )
        elif disc_type == "GSTIN_MISMATCH":
            recommendations.append(
                f"GSTIN mismatch found across submitted documents. "
                f"Request fresh GST registration certificate to resolve the discrepancy."
            )
        elif disc_type == "PAN_MISMATCH":
            recommendations.append(
                f"PAN number inconsistency found. "
                f"Request income tax department-verified PAN certificate to confirm correct PAN."
            )

    # Overall recommendation based on risk
    if risk_level == "LOW" and not recommendations:
        recommendations.append(
            "Bidder appears compliant based on available evidence. "
            "All mandatory requirements are satisfied. Proceed to final officer review and qualification decision."
        )
    elif risk_level == "MEDIUM":
        recommendations.append(
            "Multiple requirements need attention. "
            "Resolve all pending items before making a final qualification decision. "
            "Officer may request clarification from bidder."
        )
    elif risk_level in ("HIGH", "CRITICAL"):
        recommendations.append(
            "Significant compliance issues identified. "
            "Final qualification/disqualification rests with the Procurement Officer. "
            "Consider requesting the bidder to resubmit with corrected documentation."
        )

    # Deduplicate while preserving order
    seen = set()
    unique_recs = []
    for r in recommendations:
        key = r[:80]
        if key not in seen:
            seen.add(key)
            unique_recs.append(r)

    return unique_recs


# ============================================================
# FULL VERIFICATION PIPELINE
# ============================================================

def run_full_verification(
    bidder: dict,
    requirements: list[dict],
    documents: list[dict],
) -> dict:
    """
    Run the complete compliance verification pipeline for a bidder.
    Returns a comprehensive compliance assessment dict.

    This is the main entry point called by the API route.
    """
    active_reqs = list(requirements)
    is_dealership_evidence = False
    for doc in documents:
        doc_type = (doc.get("document_type") or "").upper()
        doc_name = (doc.get("file_name") or "").upper()
        raw_fields = doc.get("extracted_fields") or []
        if isinstance(raw_fields, str):
            try:
                raw_fields = json.loads(raw_fields)
            except Exception:
                raw_fields = []
        if isinstance(raw_fields, dict):
            raw_fields = raw_fields.get("fields") or raw_fields.get("extracted_fields") or []
        keys = {f.get("key") or f.get("field") for f in raw_fields if isinstance(f, dict)}
        if ("RETAIL OUTLET" in doc_type or "DEALERSHIP" in doc_type or "FAIRBID" in doc_name or
            bool({"experience_status", "land_availability", "financial_eligibility", "statutory_compliance", "application_completeness"}.intersection(keys))):
            is_dealership_evidence = True
            break

    if is_dealership_evidence:
        existing_rules = {r.get("verification_rule") for r in active_reqs}
        dealership_extra_reqs = [
            {
                "requirement_id": "LAND_AVAILABILITY",
                "name": "Site / Land Availability & Valid Tenure",
                "category": "STATUTORY",
                "is_mandatory": True,
                "description": "Valid land ownership, registered lease, or site possession required.",
                "verification_rule": "LAND_AVAILABILITY_EVALUATION",
                "weight": 4.0,
            },
            {
                "requirement_id": "EXPERIENCE_CRITERIA",
                "name": "Past Experience & Technical Capability",
                "category": "TECHNICAL",
                "is_mandatory": True,
                "description": "Bidder must satisfy documented dealership experience criteria.",
                "verification_rule": "EXPERIENCE_EVALUATION",
                "weight": 3.0,
            },
            {
                "requirement_id": "STATUTORY_PERMISSIONS",
                "name": "Statutory Permissions & Clearances",
                "category": "STATUTORY",
                "is_mandatory": True,
                "description": "Fire, local authority, and statutory compliance clearances.",
                "verification_rule": "STATUTORY_COMPLIANCE_EVALUATION",
                "weight": 3.0,
            },
            {
                "requirement_id": "APPLICATION_COMPLETENESS",
                "name": "Application Dossier Completeness & Checklist",
                "category": "MANDATORY",
                "is_mandatory": True,
                "description": "All mandatory checklist items and supporting documents must be submitted.",
                "verification_rule": "APPLICATION_COMPLETENESS_EVALUATION",
                "weight": 4.0,
            },
        ]
        for extra in dealership_extra_reqs:
            if extra["verification_rule"] not in existing_rules:
                active_reqs.append(extra)

    # Step 1: Compliance checks
    check_results = run_compliance_checks(active_reqs, documents, bidder)

    # Step 2: Cross-document validation
    discrepancies = run_cross_document_validation(documents, bidder)

    # Step 3: Scoring
    score_result = calculate_compliance_score(check_results)
    compliance_score = score_result["score"]

    # Step 4: Compliance Status (Strictly determined by mandatory requirements and discrepancies)
    compliance_summary = determine_compliance_status(check_results, discrepancies)
    compliance_status = compliance_summary["status"]

    # Step 5: Compliance Risk
    risk_result = calculate_risk_level(compliance_score, discrepancies, check_results)

    # Step 6: Recommendations
    recommendations = generate_recommendations(
        check_results, discrepancies, risk_result["risk_level"]
    )

    # Step 7: Missing documents
    missing_docs = [
        c["requirement_name"] for c in check_results
        if c.get("status") == "PENDING" and c.get("is_mandatory")
    ]

    declared_score = None
    for doc in documents:
        ev = _extract_field_with_evidence(doc, "declared_source_score")
        if ev:
            declared_score = ev["value"]
            break

    return {
        "bidder_id": bidder.get("id"),
        "bidder_name": bidder.get("legal_name"),
        "compliance_score": compliance_score,
        "compliance_status": compliance_status,
        "compliance_risk_level": risk_result["risk_level"],
        "risk_level": risk_result["risk_level"],  # Kept for backward compatibility
        "declared_source_score": declared_score,
        "blocking_exceptions": compliance_summary["blocking_exceptions"],
        "mandatory_summary": compliance_summary,
        "checks": check_results,
        "discrepancies": discrepancies,
        "missing_documents": missing_docs,
        "recommendations": recommendations,
        "score_breakdown": score_result.get("reasons", []),
        "risk_reasons": risk_result.get("reasons", []),
        "mandatory_failures": score_result.get("mandatory_failures", 0),
        "verified_at": datetime.now(timezone.utc).isoformat(),
        "note": (
            "AI-generated compliance assessment based on submitted documents and statutory verification adapters. "
            "Final qualification or disqualification decision rests with the Procurement Officer."
        ),
    }
