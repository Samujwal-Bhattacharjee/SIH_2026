"""
Feature Extractor — Procurement Integrity Engine
=================================================
Deterministic normalization and feature extraction from persistent procurement
records, OCR extractions, and bidder profiles.
"""
import re
from typing import Any, Dict, List, Optional
from app.services.integrity.models import BidderFeature
from app.core import procurement_store as ps


# Common Indian email providers where shared domain does NOT imply corporate link
GENERIC_EMAIL_DOMAINS = {
    "gmail.com", "yahoo.com", "yahoo.co.in", "outlook.com", "hotmail.com",
    "rediffmail.com", "icloud.com", "protonmail.com", "gov.in", "nic.in"
}


def normalize_entity_name(name: str) -> str:
    """
    Carefully normalize legal entity names for deterministic comparison.
    Standardizes corporate suffixes without over-aggressive fuzzy modifications.
    """
    if not name:
        return ""
    
    text = name.strip().lower()
    # Remove punctuation except alphanumeric and spaces
    text = re.sub(r'[^\w\s]', ' ', text)
    
    # Normalize common business entity designations
    replacements = [
        (r'\bprivate\s+limited\b', 'pvt ltd'),
        (r'\bpvt\s+limited\b', 'pvt ltd'),
        (r'\bprivate\s+ltd\b', 'pvt ltd'),
        (r'\blimited\b', 'ltd'),
        (r'\bllp\b', 'llp'),
        (r'\bcorporation\b', 'corp'),
        (r'\benterprises\b', 'ent'),
        (r'\btechnologies\b', 'tech'),
        (r'\bsolutions\b', 'solutions'),
        (r'\bservices\b', 'services'),
    ]
    for pattern, repl in replacements:
        text = re.sub(pattern, repl, text)
    
    # Collapse multiple whitespace
    return " ".join(text.split())


def extract_pan_from_gstin(gstin: Optional[str]) -> Optional[str]:
    """
    Extract embedded 10-character PAN from 15-character GSTIN.
    Format: 2 state digits + 10 PAN chars + 1 entity + 1 'Z' + 1 check digit.
    """
    if not gstin:
        return None
    clean = re.sub(r'[\s\-]', '', gstin.upper())
    if len(clean) == 15 and re.match(r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$', clean):
        return clean[2:12]
    return None


def normalize_identifier(val: Optional[str]) -> Optional[str]:
    """Strip formatting noise (spaces, dashes, dots) and uppercase."""
    if not val:
        return None
    clean = re.sub(r'[\s\-\./]', '', str(val).upper()).strip()
    return clean if clean else None


def normalize_address(address: Optional[str]) -> Optional[str]:
    """
    Normalize physical address tokens and isolate postal PIN code.
    Used for detecting identical registered offices.
    """
    if not address:
        return None
    text = address.lower()
    text = re.sub(r'[^\w\s]', ' ', text)
    tokens = [t for t in text.split() if len(t) > 1]
    return " ".join(tokens)


def extract_pincode(address: Optional[str]) -> Optional[str]:
    """Extract 6-digit Indian PIN code from address text."""
    if not address:
        return None
    match = re.search(r'\b([1-9][0-9]{5})\b', address)
    return match.group(1) if match else None


def extract_email_domain(email: Optional[str]) -> Optional[str]:
    """Extract domain from email if not a generic public provider."""
    if not email or "@" not in email:
        return None
    domain = email.strip().split("@")[-1].lower()
    if domain in GENERIC_EMAIL_DOMAINS:
        return None
    return domain


def parse_numeric_amount(val: Any) -> Optional[float]:
    """Parse monetary or numeric values from raw strings (e.g. '₹ 10,50,000.00', '10.5 Lakhs')."""
    if val is None:
        return None
    if isinstance(val, (int, float)):
        return float(val)
    
    text = str(val).strip().replace(",", "")
    
    # Check for multiplier terms
    multiplier = 1.0
    if re.search(r'\b(?:crores?|cr\.?)\b', text, re.IGNORECASE):
        multiplier = 10000000.0
    elif re.search(r'\b(?:lakhs?|l\.?|lac)\b', text, re.IGNORECASE):
        multiplier = 100000.0
    elif re.search(r'\b(?:thousands?|k)\b', text, re.IGNORECASE):
        multiplier = 1000.0
        
    num_match = re.search(r'([0-9]+(?:\.[0-9]+)?)', text)
    if num_match:
        try:
            return float(num_match.group(1)) * multiplier
        except (ValueError, TypeError):
            return None
    return None


def extract_bidder_features(bidder_dict: Dict[str, Any], tender_id: str) -> BidderFeature:
    """
    Transform raw bidder and document data into structured BidderFeature.
    Extracts embedded PAN from GSTIN if PAN is missing, parses document fields.
    """
    bidder_id = bidder_dict.get("id", "")
    legal_name = bidder_dict.get("legal_name") or bidder_dict.get("name") or "Unknown Entity"
    
    gstin = normalize_identifier(bidder_dict.get("gstin"))
    pan = normalize_identifier(bidder_dict.get("pan"))
    
    # Auto-infer PAN from GSTIN if not explicitly set
    if not pan and gstin:
        pan = extract_pan_from_gstin(gstin)
        
    udyam = normalize_identifier(bidder_dict.get("udyam_number"))
    cin = normalize_identifier(bidder_dict.get("cin"))
    
    address = bidder_dict.get("registered_address")
    email = bidder_dict.get("contact_email")
    phone = bidder_dict.get("contact_phone")
    
    # Pull extracted document fields from linked documents
    extracted_fields: Dict[str, Any] = {}
    try:
        docs = ps.get_bidder_documents(bidder_id)
        for doc in docs:
            fields_data = doc.get("extracted_fields")
            if isinstance(fields_data, list):
                for f in fields_data:
                    k, v = f.get("key"), f.get("value")
                    if k and v and k not in extracted_fields:
                        extracted_fields[k] = v
            elif isinstance(fields_data, dict):
                for k, v in fields_data.items():
                    if k not in extracted_fields:
                        extracted_fields[k] = v
    except Exception:
        pass
    
    # Secondary identity enrichment from document OCR fields
    if not gstin and extracted_fields.get("gstin"):
        gstin = normalize_identifier(extracted_fields["gstin"])
    if not pan and gstin:
        pan = extract_pan_from_gstin(gstin)
    elif not pan and extracted_fields.get("pan"):
        pan = normalize_identifier(extracted_fields["pan"])
    if not udyam and extracted_fields.get("udyamNumber"):
        udyam = normalize_identifier(extracted_fields["udyamNumber"])
    if not cin and extracted_fields.get("cin"):
        cin = normalize_identifier(extracted_fields["cin"])
        
    # Attempt to extract quote / financial amount
    quote_amt = None
    for field_key in ("quote_amount", "bid_amount", "financial_bid", "quote", "price", "amount"):
        if field_key in bidder_dict and bidder_dict[field_key] is not None:
            parsed = parse_numeric_amount(bidder_dict[field_key])
            if parsed is not None:
                quote_amt = parsed
                break
    if quote_amt is None and "annualTurnover" in extracted_fields:
        # Fallback to extracted financial statement value if present
        quote_amt = parse_numeric_amount(extracted_fields["annualTurnover"])

    return BidderFeature(
        bidder_id=bidder_id,
        tender_id=tender_id,
        legal_name=legal_name,
        normalized_name=normalize_entity_name(legal_name),
        trade_name=bidder_dict.get("trade_name"),
        gstin=gstin,
        pan=pan,
        cin=cin,
        udyam_number=udyam,
        registered_address=address,
        normalized_address=normalize_address(address),
        contact_email=email,
        normalized_email_domain=extract_email_domain(email),
        contact_phone=normalize_identifier(phone),
        quote_amount=quote_amt,
        compliance_score=float(bidder_dict.get("compliance_score", 0.0)),
        status=bidder_dict.get("status", "PENDING_DOCUMENTS"),
        extracted_fields=extracted_fields,
    )


def get_tender_bidder_features(tender_id: str) -> List[BidderFeature]:
    """Retrieve and process all bidder features for a specific tender."""
    bidders = ps.get_bidders(tender_id)
    return [extract_bidder_features(b, tender_id) for b in bidders]
