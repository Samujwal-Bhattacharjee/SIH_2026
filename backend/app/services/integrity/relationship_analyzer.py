"""
Relationship Analyzer — Procurement Integrity Engine
======================================================
Identifies corporate relationships, shared identifiers, common directors/entities,
and operational linkages among participating bidders.

Principle:
Shared corporate identifiers represent administrative linkages requiring review,
not automatic evidence of collusion. All findings are grouped into unified relationship
clusters to prevent artificial risk score inflation (double-counting protection).
"""
import hashlib
import uuid
from typing import Dict, List, Set, Tuple
from app.services.integrity.models import (
    BidderFeature,
    FindingStatus,
    IntegrityEvidence,
    IntegrityFinding,
    RiskLevel,
    SignalType,
)


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
    
    # Track pairs already analyzed to avoid bidirectional duplicates (A-B vs B-A)
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

            # If any attributes matched, build a single consolidated finding
            if shared_evidences:
                attr_str = ", ".join(matched_attributes)
                is_statutory = any(k in attr_str for k in ("PAN", "GSTIN", "CIN", "Udyam"))
                
                # Severity and base score calibration
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
                        f"Note: This finding indicates common identity parameters requiring officer clarification; it does not constitute automated disqualification."
                    ),
                    evidence=shared_evidences,
                    recommended_action=(
                        f"Issue a clarification notice to '{b1.legal_name}' and '{b2.legal_name}' to establish whether the entities "
                        f"possess independent operational control and separate bidding autonomy under applicable General Financial Rules (GFR)."
                    ),
                    status=FindingStatus.OPEN,
                )
                findings.append(finding)

    return findings
