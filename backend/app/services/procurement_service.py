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


def check_gst_present(all_fields: list[dict], documents: list[dict]) -> dict:
    """Check: GST registration certificate present and GSTIN extractable."""
    # Look for GSTIN in any document's extracted fields
    for doc in documents:
        doc_fields = doc.get("extracted_fields") or []
        if isinstance(doc_fields, list):
            gstin = _field_value(doc_fields, "gstin")
            if gstin and len(gstin) == 15:
                # Validate GSTIN format
                if re.match(r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$', gstin, re.I):
                    return {
                        "status": "COMPLIANT",
                        "severity": "LOW",
                        "score": 100,
                        "evidence_value": gstin,
                        "evidence_doc_id": doc.get("id"),
                        "evidence_field_key": "gstin",
                        "confidence": 0.96,
                        "reason": f"Valid GSTIN {gstin} extracted from {doc.get('document_type', 'document')}.",
                    }
                else:
                    return {
                        "status": "NEEDS_REVIEW",
                        "severity": "MEDIUM",
                        "score": 50,
                        "evidence_value": gstin,
                        "evidence_doc_id": doc.get("id"),
                        "evidence_field_key": "gstin",
                        "confidence": 0.60,
                        "reason": f"GSTIN {gstin} found but format validation failed. Officer review required.",
                    }

    # Check if GST doc was uploaded by document type
    gst_docs = [d for d in documents if "GST" in (d.get("document_type") or "").upper() or
                "GST" in (d.get("file_name") or "").upper()]
    if gst_docs:
        if gst_docs[0].get("ocr_status") == "FAILED":
            return {
                "status": "UNVERIFIED",
                "severity": "HIGH",
                "score": 0,
                "evidence_value": None,
                "evidence_doc_id": gst_docs[0].get("id"),
                "evidence_field_key": None,
                "confidence": 0.0,
                "reason": "GST document uploaded but OCR processing failed. Document remains unverified.",
            }
        return {
            "status": "NEEDS_REVIEW",
            "severity": "MEDIUM",
            "score": 50,
            "evidence_value": None,
            "evidence_doc_id": gst_docs[0].get("id"),
            "evidence_field_key": None,
            "confidence": 0.50,
            "reason": "GST document uploaded but GSTIN could not be extracted. Manual verification required.",
        }

    return {
        "status": "PENDING",
        "severity": "HIGH",
        "score": 0,
        "evidence_value": None,
        "evidence_doc_id": None,
        "evidence_field_key": None,
        "confidence": 0.0,
        "reason": "GST registration certificate not found in uploaded documents.",
    }


def check_pan_present(all_fields: list[dict], documents: list[dict]) -> dict:
    """Check: PAN card present and PAN extractable."""
    for doc in documents:
        doc_fields = doc.get("extracted_fields") or []
        if isinstance(doc_fields, list):
            pan = _field_value(doc_fields, "pan")
            if pan and len(pan) == 10 and re.match(r'^[A-Z]{5}[0-9]{4}[A-Z]$', pan, re.I):
                return {
                    "status": "COMPLIANT",
                    "severity": "LOW",
                    "score": 100,
                    "evidence_value": pan,
                    "evidence_doc_id": doc.get("id"),
                    "evidence_field_key": "pan",
                    "confidence": 0.94,
                    "reason": f"Valid PAN {pan} extracted and format verified.",
                }

    pan_docs = [d for d in documents if "PAN" in (d.get("document_type") or "").upper() or
                "PAN" in (d.get("file_name") or "").upper()]
    if pan_docs:
        if pan_docs[0].get("ocr_status") == "FAILED":
            return {
                "status": "UNVERIFIED",
                "severity": "HIGH",
                "score": 0,
                "evidence_value": None,
                "evidence_doc_id": pan_docs[0].get("id"),
                "evidence_field_key": None,
                "confidence": 0.0,
                "reason": "PAN document uploaded but OCR processing failed. Document remains unverified.",
            }
        return {
            "status": "NEEDS_REVIEW",
            "severity": "MEDIUM",
            "score": 50,
            "evidence_value": None,
            "evidence_doc_id": pan_docs[0].get("id"),
            "evidence_field_key": None,
            "confidence": 0.50,
            "reason": "PAN document uploaded but PAN number could not be extracted. Manual review needed.",
        }

    return {
        "status": "PENDING",
        "severity": "HIGH",
        "score": 0,
        "evidence_value": None,
        "evidence_doc_id": None,
        "evidence_field_key": None,
        "confidence": 0.0,
        "reason": "PAN card not found in uploaded documents.",
    }


def check_udyam_present(all_fields: list[dict], documents: list[dict]) -> dict:
    """Check: Udyam/MSME certificate present."""
    for doc in documents:
        doc_fields = doc.get("extracted_fields") or []
        if isinstance(doc_fields, list):
            udyam = _field_value(doc_fields, "udyamNumber")
            if udyam and re.match(r'^UDYAM-[A-Z]{2}-\d{2}-\d{7}$', udyam.upper()):
                return {
                    "status": "COMPLIANT",
                    "severity": "LOW",
                    "score": 100,
                    "evidence_value": udyam,
                    "evidence_doc_id": doc.get("id"),
                    "evidence_field_key": "udyamNumber",
                    "confidence": 0.95,
                    "reason": f"Valid Udyam number {udyam} extracted and format verified.",
                }

    udyam_docs = [d for d in documents if
                  any(kw in (d.get("document_type") or "").upper()
                      for kw in ["UDYAM", "MSME"]) or
                  any(kw in (d.get("file_name") or "").upper()
                      for kw in ["UDYAM", "MSME"])]
    if udyam_docs:
        if udyam_docs[0].get("ocr_status") == "FAILED":
            return {
                "status": "UNVERIFIED",
                "severity": "MEDIUM",
                "score": 0,
                "evidence_value": None,
                "evidence_doc_id": udyam_docs[0].get("id"),
                "evidence_field_key": None,
                "confidence": 0.0,
                "reason": "Udyam document uploaded but OCR processing failed. Document remains unverified.",
            }
        return {
            "status": "NEEDS_REVIEW",
            "severity": "MEDIUM",
            "score": 60,
            "evidence_value": None,
            "evidence_doc_id": udyam_docs[0].get("id"),
            "evidence_field_key": None,
            "confidence": 0.55,
            "reason": "Udyam/MSME document uploaded but registration number could not be extracted.",
        }

    return {
        "status": "PENDING",
        "severity": "MEDIUM",
        "score": 0,
        "evidence_value": None,
        "evidence_doc_id": None,
        "evidence_field_key": None,
        "confidence": 0.0,
        "reason": "Udyam/MSME registration certificate not submitted. Required if claiming MSME status.",
    }


def check_oem_present(all_fields: list[dict], documents: list[dict]) -> dict:
    """Check: OEM authorization present and not expired."""
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
            "confidence": 1.0,
            "reason": "OEM authorization letter not found. This is a mandatory requirement for this tender.",
        }

    doc = oem_docs[0]
    if doc.get("ocr_status") == "FAILED":
        return {
            "status": "UNVERIFIED",
            "severity": "HIGH",
            "score": 0,
            "evidence_value": None,
            "evidence_doc_id": doc.get("id"),
            "evidence_field_key": None,
            "confidence": 0.0,
            "reason": "OEM authorization letter uploaded but OCR processing failed. Document remains unverified.",
        }
    doc_fields = doc.get("extracted_fields") or []

    # Check for expiry date
    expiry = None
    if isinstance(doc_fields, list):
        expiry_raw = _field_value(doc_fields, "expiryDate")
        oem_ref = _field_value(doc_fields, "oemReference")

        if expiry_raw:
            try:
                # Try to parse various date formats
                for fmt in ["%d/%m/%Y", "%d-%m-%Y", "%d.%m.%Y", "%Y-%m-%d"]:
                    try:
                        expiry = datetime.strptime(expiry_raw, fmt).date()
                        break
                    except ValueError:
                        continue
            except Exception:
                pass

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
                "confidence": 0.85,
                "reason": f"OEM authorization has expired on {expiry_raw}. A fresh authorization letter is required.",
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
                    "confidence": 0.85,
                    "reason": f"OEM authorization expires in {days_until_expiry} days ({expiry_raw}). Verify bid validity covers required period.",
                }

    return {
        "status": "COMPLIANT",
        "severity": "LOW",
        "score": 90,
        "evidence_value": _field_value(doc_fields, "oemReference") if isinstance(doc_fields, list) else None,
        "evidence_doc_id": doc.get("id"),
        "evidence_field_key": "oemReference",
        "confidence": 0.75,
        "reason": "OEM authorization document present. Validity and signatory authority require officer confirmation.",
    }


def check_blacklisting_declaration(all_fields: list[dict], documents: list[dict]) -> dict:
    """Check: Non-blacklisting / non-debarment declaration present."""
    # Check extracted fields first
    for doc in documents:
        doc_fields = doc.get("extracted_fields") or []
        if isinstance(doc_fields, list):
            declaration = _field_value(doc_fields, "blacklistingDeclaration")
            if declaration:
                return {
                    "status": "COMPLIANT",
                    "severity": "LOW",
                    "score": 100,
                    "evidence_value": "Non-blacklisting declaration found",
                    "evidence_doc_id": doc.get("id"),
                    "evidence_field_key": "blacklistingDeclaration",
                    "confidence": 0.80,
                    "reason": "Non-blacklisting/non-debarment declaration found in submitted document.",
                }

    # Check by document type
    blacklist_docs = [d for d in documents if
                      any(kw in (d.get("document_type") or "").upper()
                          for kw in ["BLACKLIST", "DEBARMENT", "DECLARATION"])]
    if blacklist_docs:
        if blacklist_docs[0].get("ocr_status") == "FAILED":
            return {
                "status": "UNVERIFIED",
                "severity": "HIGH",
                "score": 0,
                "evidence_value": None,
                "evidence_doc_id": blacklist_docs[0].get("id"),
                "evidence_field_key": None,
                "confidence": 0.0,
                "reason": "Declaration document uploaded but OCR processing failed. Document remains unverified.",
            }
        return {
            "status": "NEEDS_REVIEW",
            "severity": "MEDIUM",
            "score": 70,
            "evidence_value": None,
            "evidence_doc_id": blacklist_docs[0].get("id"),
            "evidence_field_key": None,
            "confidence": 0.60,
            "reason": "Declaration document uploaded but declaration text could not be automatically extracted. Officer verification needed.",
        }

    return {
        "status": "PENDING",
        "severity": "HIGH",
        "score": 0,
        "evidence_value": None,
        "evidence_doc_id": None,
        "evidence_field_key": None,
        "confidence": 0.0,
        "reason": "Non-blacklisting declaration not found. Bidder must submit a self-declaration.",
    }


def check_turnover_threshold(all_fields: list[dict], documents: list[dict],
                             threshold_value: Optional[float] = None) -> dict:
    """Check: Annual turnover meets tender threshold."""
    for doc in documents:
        doc_fields = doc.get("extracted_fields") or []
        if isinstance(doc_fields, list):
            turnover = _field_value(doc_fields, "annualTurnover")
            if turnover:
                return {
                    "status": "NEEDS_REVIEW",
                    "severity": "MEDIUM",
                    "score": 70,
                    "evidence_value": turnover,
                    "evidence_doc_id": doc.get("id"),
                    "evidence_field_key": "annualTurnover",
                    "confidence": 0.65,
                    "reason": f"Turnover information extracted: {turnover}. Officer must verify against tender threshold.",
                }

    # Check for financial statements
    fin_docs = [d for d in documents if
                any(kw in (d.get("document_type") or "").upper()
                    for kw in ["FINANCIAL", "TURNOVER", "ITR", "BALANCE", "AUDIT"])]
    if fin_docs:
        if fin_docs[0].get("ocr_status") == "FAILED":
            return {
                "status": "UNVERIFIED",
                "severity": "HIGH",
                "score": 0,
                "evidence_value": None,
                "evidence_doc_id": fin_docs[0].get("id"),
                "evidence_field_key": None,
                "confidence": 0.0,
                "reason": "Financial document uploaded but OCR processing failed. Document remains unverified.",
            }
        return {
            "status": "NEEDS_REVIEW",
            "severity": "MEDIUM",
            "score": 50,
            "evidence_value": None,
            "evidence_doc_id": fin_docs[0].get("id"),
            "evidence_field_key": None,
            "confidence": 0.50,
            "reason": "Financial document uploaded but turnover amount could not be extracted. Manual review required.",
        }

    return {
        "status": "PENDING",
        "severity": "HIGH",
        "score": 0,
        "evidence_value": None,
        "evidence_doc_id": None,
        "evidence_field_key": None,
        "confidence": 0.0,
        "reason": "Annual turnover evidence not found. Upload audited financial statements or ITR.",
    }


def check_local_content(all_fields: list[dict], documents: list[dict]) -> dict:
    """Check: Local content declaration present."""
    for doc in documents:
        doc_fields = doc.get("extracted_fields") or []
        if isinstance(doc_fields, list):
            lc_pct = _field_value(doc_fields, "localContentPct")
            if lc_pct:
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
                        "evidence_doc_id": doc.get("id"),
                        "evidence_field_key": "localContentPct",
                        "confidence": 0.85,
                        "reason": f"Local content declared at {lc_pct}. Classification: {classification}.",
                    }

    lc_docs = [d for d in documents if
               any(kw in (d.get("document_type") or "").upper()
                   for kw in ["LOCAL CONTENT", "MAKE IN INDIA", "MII", "DOMESTIC"])]
    if lc_docs:
        return {
            "status": "NEEDS_REVIEW",
            "severity": "LOW",
            "score": 60,
            "evidence_value": None,
            "evidence_doc_id": lc_docs[0].get("id"),
            "evidence_field_key": None,
            "confidence": 0.55,
            "reason": "Local content document uploaded. Percentage could not be extracted. Manual verification required.",
        }

    return {
        "status": "NOT_APPLICABLE",
        "severity": "LOW",
        "score": 100,
        "evidence_value": None,
        "evidence_doc_id": None,
        "evidence_field_key": None,
        "confidence": 0.0,
        "reason": "Local content declaration not submitted. Mark as Not Applicable if item is exempted.",
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

        results.append({
            "requirement_id": req.get("requirement_id"),
            "requirement_name": req.get("name"),
            "category": req.get("category"),
            "is_mandatory": is_mand,
            "is_blocking": is_blocking,
            "result_status": res_status,
            "weight": req.get("weight", 1.0),
            **result,
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
    # Check 5: GSTIN prefix matches state (optional)
    # -----------------------------------------------
    if doc_gstins and bidder.get("registered_address"):
        pass  # Skip state code check in prototype — would require address parsing

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
        check_score = SEVERITY_SCORE_MAP.get(status, 0)
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
        elif status in ("NON_COMPLIANT", "EXPIRED"):
            reasons.append(f"- {check.get('requirement_name', 'Requirement')}: {'Expired' if status == 'EXPIRED' else 'Not compliant'}")
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
    # Step 1: Compliance checks
    check_results = run_compliance_checks(requirements, documents, bidder)

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

    return {
        "bidder_id": bidder.get("id"),
        "bidder_name": bidder.get("legal_name"),
        "compliance_score": compliance_score,
        "compliance_status": compliance_status,
        "compliance_risk_level": risk_result["risk_level"],
        "risk_level": risk_result["risk_level"],  # Kept for backward compatibility
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
