"""
Relationship Analyzer — Procurement Integrity Engine V2
========================================================
Identifies corporate relationships, shared identifiers, common directors,
operational linkages, and document identity inconsistencies among participating bidders.

Principles:
- Shared statutory identifiers represent administrative linkages requiring clarification,
  not automated legal conclusions of wrongdoing.
- All pairwise identity matches (PAN, GSTIN, CIN, Udyam, Address, Domain, Phone) are collapsed
  into ONE consolidated finding per bidder pair with multi-attribute evidence records (anti-double-counting).
- Directors are evaluated ONLY when real extracted data is present.
"""
import hashlib
from typing import Dict, List, Set, Tuple

from app.services.integrity.models import (
    BidderFeature,
    FindingStatus,
    IntegrityEvidence,
    IntegrityFinding,
    RiskLevel,
    RuleReference,
    SignalType,
)
from app.services.integrity.feature_extractor import normalize_entity_name


def analyze_related_bidders(
    bidders: List[BidderFeature],
    tender_id: str
) -> List[IntegrityFinding]:
    """
    Detect shared identity attributes across all pairwise combinations of participating bidders.
    
    Pairs sharing multiple attributes (e.g. PAN + GSTIN + Registered Address) are collapsed
    into a single unified relationship finding with multi-attribute evidence.
    """
    if len(bidders) < 2:
        return []

    findings: List[IntegrityFinding] = []
    analyzed_pairs: Set[Tuple[str, str]] = set()

    for i in range(len(bidders)):
        for j in range(i + 1, len(bidders)):
            b1 = bidders[i]
            b2 = bidders[j]

            pair_key = (min(b1.bidder_id, b2.bidder_id), max(b1.bidder_id, b2.bidder_id))
            if pair_key in analyzed_pairs:
                continue
            analyzed_pairs.add(pair_key)

            shared_evidences: List[IntegrityEvidence] = []
            matched_attributes: List[str] = []
            confidence_scores: List[float] = []

            # 1. PAN Match (Highest certainty statutory identity)
            if b1.pan and b2.pan and b1.pan == b2.pan:
                shared_evidences.append(
                    IntegrityEvidence(
                        source_type="CORPORATE_REGISTRY",
                        source_id=b1.bidder_id,
                        field="pan",
                        value=b1.pan,
                        description=f"Identical Permanent Account Number (PAN: {b1.pan}) submitted by '{b1.legal_name}' and '{b2.legal_name}'.",
                        metadata={"bidder_1": b1.legal_name, "bidder_2": b2.legal_name}
                    )
                )
                matched_attributes.append("Permanent Account Number (PAN)")
                confidence_scores.append(0.98)

            # 2. GSTIN Match
            if b1.gstin and b2.gstin and b1.gstin == b2.gstin:
                shared_evidences.append(
                    IntegrityEvidence(
                        source_type="CORPORATE_REGISTRY",
                        source_id=b1.bidder_id,
                        field="gstin",
                        value=b1.gstin,
                        description=f"Identical Goods & Services Tax Identification Number (GSTIN: {b1.gstin}) registered to both entities.",
                        metadata={"bidder_1": b1.legal_name, "bidder_2": b2.legal_name}
                    )
                )
                matched_attributes.append("GSTIN")
                confidence_scores.append(0.98)

            # 3. CIN Match (Corporate Identity Number)
            if b1.cin and b2.cin and b1.cin == b2.cin:
                shared_evidences.append(
                    IntegrityEvidence(
                        source_type="CORPORATE_REGISTRY",
                        source_id=b1.bidder_id,
                        field="cin",
                        value=b1.cin,
                        description=f"Identical Ministry of Corporate Affairs CIN ({b1.cin}) shared across bidder profiles.",
                        metadata={"bidder_1": b1.legal_name, "bidder_2": b2.legal_name}
                    )
                )
                matched_attributes.append("Corporate Identity Number (CIN)")
                confidence_scores.append(0.96)

            # 4. Udyam Registration Match
            if b1.udyam_number and b2.udyam_number and b1.udyam_number == b2.udyam_number:
                shared_evidences.append(
                    IntegrityEvidence(
                        source_type="CORPORATE_REGISTRY",
                        source_id=b1.bidder_id,
                        field="udyam_number",
                        value=b1.udyam_number,
                        description=f"Identical MSME/Udyam Certificate ({b1.udyam_number}) claimed by both entities.",
                        metadata={"bidder_1": b1.legal_name, "bidder_2": b2.legal_name}
                    )
                )
                matched_attributes.append("Udyam Registration")
                confidence_scores.append(0.95)

            # 5. Registered Address Match
            if b1.normalized_address and b2.normalized_address and len(b1.normalized_address) > 10:
                if b1.normalized_address == b2.normalized_address:
                    shared_evidences.append(
                        IntegrityEvidence(
                            source_type="BID_SUBMISSION",
                            source_id=b1.bidder_id,
                            field="registered_address",
                            value=b1.registered_address,
                            description=f"Identical registered office address submitted by '{b1.legal_name}' and '{b2.legal_name}'.",
                            metadata={"address": b1.registered_address}
                        )
                    )
                    matched_attributes.append("Registered Office Address")
                    confidence_scores.append(0.85)

            # 6. Corporate Email Domain Match (non-generic domains)
            if b1.normalized_email_domain and b2.normalized_email_domain and b1.normalized_email_domain == b2.normalized_email_domain:
                shared_evidences.append(
                    IntegrityEvidence(
                        source_type="BID_SUBMISSION",
                        source_id=b1.bidder_id,
                        field="contact_email",
                        value=b1.normalized_email_domain,
                        description=f"Identical proprietary email domain (@{b1.normalized_email_domain}) used for bid communications by both entities.",
                        metadata={"email_1": b1.contact_email, "email_2": b2.contact_email}
                    )
                )
                matched_attributes.append("Proprietary Email Domain")
                confidence_scores.append(0.75)

            # 7. Contact Phone Match
            if b1.contact_phone and b2.contact_phone and len(b1.contact_phone) >= 10 and b1.contact_phone == b2.contact_phone:
                shared_evidences.append(
                    IntegrityEvidence(
                        source_type="BID_SUBMISSION",
                        source_id=b1.bidder_id,
                        field="contact_phone",
                        value=b1.contact_phone,
                        description=f"Identical primary contact telephone number ({b1.contact_phone}) shared between bidders.",
                        metadata={"phone": b1.contact_phone}
                    )
                )
                matched_attributes.append("Contact Telephone Number")
                confidence_scores.append(0.80)

            if shared_evidences:
                attr_str = ", ".join(matched_attributes)
                is_statutory = any(k in attr_str for k in ("PAN", "GSTIN", "CIN", "Udyam"))
                
                if is_statutory or len(matched_attributes) >= 2:
                    severity = RiskLevel.HIGH
                    score_impact = 35.0
                else:
                    severity = RiskLevel.MEDIUM
                    score_impact = 20.0

                confidence = max(confidence_scores) if confidence_scores else 0.85
                pair_hash = hashlib.md5(f"{tender_id}:{min(b1.bidder_id, b2.bidder_id)}:{max(b1.bidder_id, b2.bidder_id)}".encode()).hexdigest()[:8].upper()
                finding_id = f"INT-REL-{pair_hash}"

                finding = IntegrityFinding(
                    id=finding_id,
                    tender_id=tender_id,
                    bidder_id=b1.bidder_id,
                    related_bidder_ids=[b1.bidder_id, b2.bidder_id],
                    signal_type=SignalType.RELATED_BIDDER if is_statutory else SignalType.SHARED_ENTITY,
                    severity=severity,
                    score_impact=score_impact,
                    confidence=confidence,
                    title=f"Common Entity Linkage: {b1.legal_name} & {b2.legal_name}",
                    reason=(
                        f"Bidders '{b1.legal_name}' and '{b2.legal_name}' share common registered attributes ({attr_str}). "
                        f"This indicates potential corporate group relationship, subsidiary linkage, or common operational control. "
                        f"Note: This signal highlights common identity parameters requiring officer clarification; it does not constitute automated disqualification."
                    ),
                    evidence=shared_evidences,
                    rule_reference=RuleReference(
                        clause_id="GFR-2017-R144-IV",
                        title="Bidder Independence & Group Entity Participation",
                        description="Under GFR Rule 144, bidders must demonstrate independent legal and operational standing without mutual control.",
                        applicability="Statutory eligibility cross-check"
                    ),
                    recommended_action=(
                        f"Issue a clarification notice to '{b1.legal_name}' and '{b2.legal_name}' to establish whether the entities "
                        f"possess independent operational control and separate bidding autonomy under applicable General Financial Rules (GFR)."
                    ),
                    status=FindingStatus.OPEN,
                )
                findings.append(finding)

    return findings


def analyze_common_directors(
    bidders: List[BidderFeature],
    tender_id: str
) -> List[IntegrityFinding]:
    """
    Detect shared corporate directors or authorized signatories across competing entities.
    Evaluated ONLY when director data exists in extracted fields.
    """
    if len(bidders) < 2:
        return []

    findings: List[IntegrityFinding] = []
    analyzed_pairs: Set[Tuple[str, str]] = set()

    for i in range(len(bidders)):
        for j in range(i + 1, len(bidders)):
            b1 = bidders[i]
            b2 = bidders[j]

            if not b1.directors or not b2.directors:
                continue

            pair_key = (min(b1.bidder_id, b2.bidder_id), max(b1.bidder_id, b2.bidder_id))
            if pair_key in analyzed_pairs:
                continue
            analyzed_pairs.add(pair_key)

            # Check director matches
            shared_directors = []
            for d1 in b1.directors:
                norm_d1 = normalize_entity_name(d1)
                for d2 in b2.directors:
                    norm_d2 = normalize_entity_name(d2)
                    if norm_d1 and norm_d1 == norm_d2:
                        shared_directors.append(d1)

            if shared_directors:
                evs = [
                    IntegrityEvidence(
                        source_type="CORPORATE_REGISTRY",
                        source_id=b1.bidder_id,
                        field="directors",
                        value=", ".join(shared_directors),
                        description=f"Common director(s) / signatory ({', '.join(shared_directors)}) listed for both '{b1.legal_name}' and '{b2.legal_name}'.",
                        metadata={"shared_directors": shared_directors}
                    )
                ]
                dir_hash = hashlib.md5(f"{tender_id}:{b1.bidder_id}:{b2.bidder_id}:dir".encode()).hexdigest()[:8].upper()
                findings.append(
                    IntegrityFinding(
                        id=f"INT-DIR-{dir_hash}",
                        tender_id=tender_id,
                        bidder_id=b1.bidder_id,
                        related_bidder_ids=[b1.bidder_id, b2.bidder_id],
                        signal_type=SignalType.COMMON_DIRECTOR_LINK,
                        severity=RiskLevel.HIGH,
                        score_impact=25.0,
                        confidence=0.92,
                        title=f"Common Directorship Link: {b1.legal_name} & {b2.legal_name}",
                        reason=(
                            f"Competing bidders '{b1.legal_name}' and '{b2.legal_name}' list common director(s) or signatories "
                            f"({', '.join(shared_directors)}). Under Companies Act 2013 and public procurement norms, common executive "
                            f"leadership across competing bidders requires formal disclosure and independence verification."
                        ),
                        evidence=evs,
                        rule_reference=RuleReference(
                            clause_id="MCA-COMP-2013",
                            title="Companies Act & Directorship Governance",
                            description="Directorship overlaps across competing tenderers necessitate verification of separate operational autonomy.",
                            applicability="Corporate governance verification"
                        ),
                        recommended_action=(
                            "Request board resolutions and organizational chart to establish operational independence."
                        ),
                        status=FindingStatus.OPEN,
                    )
                )

    return findings


def analyze_document_identity_inconsistencies(
    bidders: List[BidderFeature],
    tender_id: str
) -> List[IntegrityFinding]:
    """
    Detect document-level identity cross-contamination where OCR-extracted documents
    for Bidder A contain statutory credentials (PAN, GSTIN) belonging to Bidder B.
    """
    if len(bidders) < 2:
        return []

    findings: List[IntegrityFinding] = []

    for b in bidders:
        extracted = b.extracted_fields
        if not extracted:
            continue

        doc_pan = extracted.get("pan")
        doc_gst = extracted.get("gstin")

        # Check if this document's PAN or GSTIN matches ANOTHER bidder's declared identity
        for other in bidders:
            if other.bidder_id == b.bidder_id:
                continue

            pan_match = bool(doc_pan and other.pan and doc_pan.upper().strip() == other.pan.upper().strip())
            gst_match = bool(doc_gst and other.gstin and doc_gst.upper().strip() == other.gstin.upper().strip())

            if pan_match or gst_match:
                matched_id = "PAN" if pan_match else "GSTIN"
                matched_val = other.pan if pan_match else other.gstin

                ev = [
                    IntegrityEvidence(
                        source_type="DOCUMENT_OCR",
                        source_id=b.bidder_id,
                        field=matched_id.lower(),
                        value=matched_val,
                        description=(
                            f"Document submitted by '{b.legal_name}' contains {matched_id} '{matched_val}' "
                            f"which belongs to competing bidder '{other.legal_name}'."
                        ),
                        metadata={"declaring_bidder": b.legal_name, "owning_bidder": other.legal_name}
                    )
                ]

                doc_hash = hashlib.md5(f"{tender_id}:{b.bidder_id}:{other.bidder_id}:docincon".encode()).hexdigest()[:8].upper()
                findings.append(
                    IntegrityFinding(
                        id=f"INT-DOCINC-{doc_hash}",
                        tender_id=tender_id,
                        bidder_id=b.bidder_id,
                        related_bidder_ids=[b.bidder_id, other.bidder_id],
                        signal_type=SignalType.DOCUMENT_IDENTITY_INCONSISTENCY,
                        severity=RiskLevel.HIGH,
                        score_impact=30.0,
                        confidence=0.95,
                        title=f"Document Identity Cross-Contamination: {b.legal_name} & {other.legal_name}",
                        reason=(
                            f"Verification document submitted for '{b.legal_name}' contains statutory identifier ({matched_id}: {matched_val}) "
                            f"matching competing bidder '{other.legal_name}'. This indicates potential shared document preparation."
                        ),
                        evidence=ev,
                        rule_reference=RuleReference(
                            clause_id="GEM-GTC-DOC",
                            title="Document Authenticity & Identity Consistency",
                            description="All submitted documents must strictly pertain to the participating legal entity without cross-bidder references.",
                            applicability="Document verification and compliance audit"
                        ),
                        recommended_action=(
                            "Issue immediate administrative verification order for both bidders to confirm document provenance."
                        ),
                        status=FindingStatus.OPEN,
                    )
                )

    return findings
