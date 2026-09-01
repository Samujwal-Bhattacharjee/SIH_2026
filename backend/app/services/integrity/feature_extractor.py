"""
Feature Extractor — Procurement Integrity Engine V2
===================================================
Deterministic normalization and feature extraction from persistent procurement
records, OCR extractions, and bidder profiles.

Includes:
- Entity identity normalization (legal names, PAN, GSTIN, CIN, Udyam, address, domain, phone).
- Directors / authorized signatories extraction from document fields.
- BOQ / line-item structure extraction.
- Single-pass O(N) historical metrics precomputation (win rate, category concentration, co-participation).
"""
import re
from typing import Any, Dict, List, Optional, Set, Tuple
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


def extract_directors_from_fields(fields: Dict[str, Any]) -> List[str]:
    """Extract and normalize director / signatory names from extracted document fields."""
    directors: List[str] = []
    for key in ("directors", "directorsList", "authorizedSignatory", "signatoryName", "managingDirector", "partners"):
        if key in fields and fields[key]:
            val = fields[key]
            if isinstance(val, list):
                for item in val:
                    name = str(item).strip()
                    if name and len(name) > 2:
                        directors.append(name)
            elif isinstance(val, str):
                # Split comma-separated names
                for part in val.split(","):
                    p = part.strip()
                    if p and len(p) > 2:
                        directors.append(p)
    return list(dict.fromkeys(directors))  # unique preserving order


def extract_bidder_features(
    bidder_dict: Dict[str, Any],
    tender_id: str,
    estimated_value: Optional[float] = None,
    category: Optional[str] = None
) -> BidderFeature:
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
        quote_amt = parse_numeric_amount(extracted_fields["annualTurnover"])

    # Extract directors
    directors = extract_directors_from_fields(extracted_fields)
    if "directors" in bidder_dict and isinstance(bidder_dict["directors"], list):
        directors.extend([str(d).strip() for d in bidder_dict["directors"] if str(d).strip()])
    directors = list(dict.fromkeys(directors))

    # Extract line items
    line_items = []
    if "line_items" in bidder_dict and isinstance(bidder_dict["line_items"], list):
        line_items = bidder_dict["line_items"]
    elif "boqItems" in extracted_fields and isinstance(extracted_fields["boqItems"], list):
        line_items = extracted_fields["boqItems"]

    # Calculate bid-to-estimate ratio
    bid_to_est = None
    if quote_amt is not None and estimated_value is not None and estimated_value > 0:
        bid_to_est = round(quote_amt / estimated_value, 4)

    # Submission timestamp (only explicit submission timestamps, not generic DB created_at)
    sub_ts = bidder_dict.get("submitted_at") or bidder_dict.get("submission_time") or bidder_dict.get("submission_timestamp")

    # Officer fields if present in record
    officer_id = bidder_dict.get("decided_by") or bidder_dict.get("officer_id")
    officer_name = bidder_dict.get("officer_name")
    decided_by = bidder_dict.get("decided_by")
    decided_at = bidder_dict.get("decided_at")

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
        pincode=extract_pincode(address),
        contact_email=email,
        normalized_email_domain=extract_email_domain(email),
        contact_phone=normalize_identifier(phone),
        directors=directors,
        quote_amount=quote_amt,
        estimated_tender_value=estimated_value,
        bid_to_estimate_ratio=bid_to_est,
        tender_category=category,
        line_items=line_items,
        submission_timestamp=sub_ts,
        compliance_score=float(bidder_dict.get("compliance_score", 0.0)),
        status=bidder_dict.get("status", "PENDING_DOCUMENTS"),
        extracted_fields=extracted_fields,
        officer_id=officer_id,
        officer_name=officer_name,
        decided_by=decided_by,
        decided_at=decided_at,
    )


def enrich_bidder_features_with_history(
    bidders: List[BidderFeature],
    historical_tenders: List[Dict[str, Any]],
    current_tender_category: Optional[str] = None
) -> List[BidderFeature]:
    """
    Enrich bidder features with historical metrics in an efficient single-pass (O(N)) manner.
    Computes:
    - Historical participation count & win rate
    - Category-specific win rate
    - Pairwise co-participation counts
    - Relative ranks and bid spread among current quoted bidders
    """
    if not bidders:
        return bidders

    # 1. Precompute historical participant indices and winner counts
    # Map normalized identifier -> total participations & wins
    vendor_total_parts: Dict[str, int] = {}
    vendor_total_wins: Dict[str, int] = {}
    vendor_cat_parts: Dict[str, int] = {}
    vendor_cat_wins: Dict[str, int] = {}

    # List of participant sets per historical tender for fast co-participation check
    tender_participant_sets: List[Tuple[Set[str], Optional[str]]] = []  # (set_of_names_ids, category)

    for ht in historical_tenders:
        cat = ht.get("category")
        is_same_cat = bool(current_tender_category and cat == current_tender_category)

        # Winner identifier
        winner_str = str(ht.get("winner_name") or ht.get("winner_id") or "").strip().lower()
        norm_winner = normalize_entity_name(winner_str) if not winner_str.startswith("bid-") else winner_str

        # Participant identifiers
        parts = ht.get("participants") or ht.get("bidders") or ht.get("bidder_ids") or []
        ht_part_set: Set[str] = set()

        for p in parts:
            if isinstance(p, dict):
                v_name = normalize_entity_name(str(p.get("legal_name") or p.get("name") or ""))
                v_id = str(p.get("id") or p.get("bidder_id") or "").lower().strip()
                if v_name:
                    ht_part_set.add(v_name)
                    vendor_total_parts[v_name] = vendor_total_parts.get(v_name, 0) + 1
                    if is_same_cat:
                        vendor_cat_parts[v_name] = vendor_cat_parts.get(v_name, 0) + 1
                if v_id:
                    ht_part_set.add(v_id)
                    vendor_total_parts[v_id] = vendor_total_parts.get(v_id, 0) + 1
                    if is_same_cat:
                        vendor_cat_parts[v_id] = vendor_cat_parts.get(v_id, 0) + 1
            else:
                p_str = str(p).lower().strip()
                norm_p = normalize_entity_name(p_str) if not p_str.startswith("bid-") else p_str
                if norm_p:
                    ht_part_set.add(norm_p)
                    vendor_total_parts[norm_p] = vendor_total_parts.get(norm_p, 0) + 1
                    if is_same_cat:
                        vendor_cat_parts[norm_p] = vendor_cat_parts.get(norm_p, 0) + 1

        if norm_winner:
            vendor_total_wins[norm_winner] = vendor_total_wins.get(norm_winner, 0) + 1
            if is_same_cat:
                vendor_cat_wins[norm_winner] = vendor_cat_wins.get(norm_winner, 0) + 1

        if ht_part_set:
            tender_participant_sets.append((ht_part_set, cat))

    # 2. Enrich each bidder with historical numbers
    for b in bidders:
        norm_name = b.normalized_name
        b_id_lower = b.bidder_id.lower()

        # Find total participations and wins
        p_count = vendor_total_parts.get(norm_name, 0) or vendor_total_parts.get(b_id_lower, 0)
        wins = vendor_total_wins.get(norm_name, 0) or vendor_total_wins.get(b_id_lower, 0)
        b.participation_count = p_count
        b.wins = wins
        b.win_rate = round(wins / p_count, 3) if p_count > 0 else 0.0

        # Category-specific counts
        cat_p = vendor_cat_parts.get(norm_name, 0) or vendor_cat_parts.get(b_id_lower, 0)
        cat_w = vendor_cat_wins.get(norm_name, 0) or vendor_cat_wins.get(b_id_lower, 0)
        b.category_participation_count = cat_p
        b.category_wins = cat_w
        b.category_win_rate = round(cat_w / cat_p, 3) if cat_p > 0 else 0.0

        # Co-participations with other bidders in current tender
        co_parts: Dict[str, int] = {}
        for other in bidders:
            if other.bidder_id == b.bidder_id:
                continue
            other_norm = other.normalized_name
            other_id = other.bidder_id.lower()

            joint_count = 0
            for part_set, _ in tender_participant_sets:
                has_b = norm_name in part_set or b_id_lower in part_set
                has_other = other_norm in part_set or other_id in part_set
                if has_b and has_other:
                    joint_count += 1

            if joint_count > 0:
                co_parts[other.bidder_id] = joint_count

        b.repeat_co_participations = co_parts

    # 3. Calculate ranks and L1 spreads among current valid quotes
    valid_quoted = [b for b in bidders if b.quote_amount is not None and b.quote_amount > 0]
    if valid_quoted:
        valid_quoted.sort(key=lambda b: b.quote_amount or 0.0)
        l1_quote = valid_quoted[0].quote_amount or 0.0
        for rank_idx, b in enumerate(valid_quoted, start=1):
            b.rank = rank_idx
            if rank_idx == 1:
                b.is_winner = True
                b.bid_spread_from_l1 = 0.0
            elif l1_quote > 0 and b.quote_amount is not None:
                b.bid_spread_from_l1 = round(((b.quote_amount - l1_quote) / l1_quote) * 100.0, 2)

    return bidders


def get_tender_bidder_features(tender_id: str) -> List[BidderFeature]:
    """Retrieve and process all bidder features for a specific tender."""
    tender = ps.get_tender_by_id(tender_id)
    est_val = float(tender.get("estimated_value", 0)) if tender else None
    cat = tender.get("category") if tender else None

    bidders = ps.get_bidders(tender_id)
    features = [extract_bidder_features(b, tender_id, estimated_value=est_val, category=cat) for b in bidders]
    return features
