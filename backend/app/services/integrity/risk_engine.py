"""
Risk Aggregation & Evaluation Engine — Procurement Integrity
============================================================
Consolidates discrete integrity signals, applies transparent configurable weights,
enforces double-count protection, and produces audit-ready executive summaries.

Guarantees:
- Completely deterministic output for identical input datasets.
- Clean datasets with no anomalous signals evaluate to LOW risk tier (score < 25.0).
- Explicit separation between numerical risk score and evidence confidence.
"""
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone

from app.core import procurement_store as ps
from app.services.integrity.models import (
    BidderFeature,
    IntegrityAssessment,
    IntegrityFinding,
    RiskLevel,
    SignalType,
)
from app.services.integrity.feature_extractor import extract_bidder_features
from app.services.integrity.relationship_analyzer import analyze_related_bidders
from app.services.integrity.bid_analyzer import (
    analyze_bid_price_similarity,
    analyze_winner_concentration,
    analyze_repeated_participation,
    analyze_bid_rotation,
)


# ============================================================
# CONFIGURABLE RISK WEIGHTS & THRESHOLDS
# ============================================================

DEFAULT_SIGNAL_WEIGHTS = {
    SignalType.RELATED_BIDDER: 30.0,
    SignalType.SHARED_ENTITY: 20.0,
    SignalType.BID_PRICE_ANOMALY: 20.0,
    SignalType.BID_ROTATION_PATTERN: 15.0,
    SignalType.REPEATED_WINNER_PATTERN: 10.0,
    SignalType.REPEATED_PARTICIPATION_PATTERN: 10.0,
    SignalType.TENDER_CHANGE_PATTERN: 10.0,
    SignalType.CONFLICT_OF_INTEREST: 15.0,
}

RISK_TIER_THRESHOLDS = [
    (75.0, RiskLevel.CRITICAL),
    (50.0, RiskLevel.HIGH),
    (25.0, RiskLevel.MEDIUM),
    (0.0, RiskLevel.LOW),
]


def calculate_risk_tier(score: float) -> RiskLevel:
    """Map continuous 0-100 risk score to standard 4-tier risk classification."""
    for threshold, tier in RISK_TIER_THRESHOLDS:
        if score >= threshold:
            return tier
    return RiskLevel.LOW


def aggregate_integrity_findings(findings: List[IntegrityFinding]) -> tuple[float, RiskLevel, float]:
    """
    Deterministically aggregate multiple findings with diminishing returns
    to prevent score inflation on correlated sub-signals (anti-double-counting).
    
    Formula:
    Group by signal_type:
    - 1st occurrence of signal type: 100% weight
    - 2nd occurrence of same signal type: 50% weight
    - 3rd+ occurrences: 25% weight
    """
    if not findings:
        return 0.0, RiskLevel.LOW, 1.0

    signal_counts: Dict[str, int] = {}
    total_score = 0.0
    weighted_confidence_sum = 0.0
    total_impact_weights = 0.0

    for f in findings:
        st = f.signal_type.value if hasattr(f.signal_type, "value") else str(f.signal_type)
        count = signal_counts.get(st, 0)
        signal_counts[st] = count + 1

        # Diminishing multiplier for repeated findings of same category
        if count == 0:
            multiplier = 1.0
        elif count == 1:
            multiplier = 0.5
        else:
            multiplier = 0.25

        base_impact = f.score_impact if f.score_impact > 0 else DEFAULT_SIGNAL_WEIGHTS.get(f.signal_type, 15.0)
        effective_impact = base_impact * multiplier
        total_score += effective_impact

        # Accumulate confidence
        weighted_confidence_sum += f.confidence * effective_impact
        total_impact_weights += effective_impact

    # Cap total score at 100.0
    final_score = min(100.0, round(total_score, 1))
    risk_level = calculate_risk_tier(final_score)

    overall_confidence = (
        round(weighted_confidence_sum / total_impact_weights, 2)
        if total_impact_weights > 0
        else 0.85
    )

    return final_score, risk_level, overall_confidence


def generate_executive_summary(
    findings: List[IntegrityFinding],
    risk_score: float,
    risk_level: RiskLevel,
    tender_title: str
) -> str:
    """Generate an objective executive summary for procurement review."""
    if not findings:
        return (
            f"Integrity evaluation for '{tender_title}' completed. "
            f"No anomalous bid patterns, shared statutory identifiers, or historical concentration signals detected. "
            f"Overall procurement integrity status is assessed as LOW RISK ({risk_score}/100)."
        )

    signals_summary = ", ".join(list(set([f.signal_type.value for f in findings])))
    return (
        f"Integrity evaluation identified {len(findings)} review signal(s) ({signals_summary}) for '{tender_title}'. "
        f"Composite integrity risk is categorized as {risk_level.value} ({risk_score}/100). "
        f"Findings represent administrative indicators requiring officer verification prior to award confirmation."
    )


def assess_tender_integrity(
    tender_id: str,
    custom_bidders: Optional[List[BidderFeature]] = None,
    custom_historical_tenders: Optional[List[Dict[str, Any]]] = None
) -> IntegrityAssessment:
    """
    Primary entry point: Run comprehensive integrity assessment for a given tender.
    Consumes live persistent store data or custom test fixtures.
    """
    tender = ps.get_tender_by_id(tender_id)
    if not tender and custom_bidders is None:
        raise ValueError(f"Tender '{tender_id}' not found")

    tender_title = tender.get("title", f"Tender {tender_id}") if tender else f"Tender {tender_id}"
    estimated_val = float(tender.get("estimated_value", 0)) if tender else None

    # Load bidders
    if custom_bidders is not None:
        bidders = custom_bidders
    else:
        raw_bidders = ps.get_bidders(tender_id)
        bidders = [extract_bidder_features(b, tender_id) for b in raw_bidders]

    # Load historical tenders (or pull from DB and enrich with participants & winners)
    if custom_historical_tenders is not None:
        historical_tenders = custom_historical_tenders
    else:
        all_tenders = ps.get_tenders()
        historical_tenders = []
        for t in all_tenders:
            if t.get("id") != tender_id:
                t_copy = dict(t)
                t_bidders = ps.get_bidders(t.get("id"))
                t_copy["participants"] = t_bidders
                winners = [
                    b for b in t_bidders
                    if b.get("status") in ("AWARDED", "WINNER") or b.get("officer_decision") == "QUALIFIED"
                ]
                if winners:
                    t_copy["winner_id"] = winners[0].get("id")
                    t_copy["winner_name"] = winners[0].get("legal_name")
                historical_tenders.append(t_copy)

        # Domain category matching: If there are sufficient historical tenders in the same category, prioritize them
        tender_cat = tender.get("category") if tender else None
        if tender_cat:
            same_cat = [t for t in historical_tenders if t.get("category") == tender_cat and (t.get("winner_name") or t.get("winner_id"))]
            if len(same_cat) >= 4:
                historical_tenders = same_cat

    all_findings: List[IntegrityFinding] = []

    # 1. Analyze Related Bidders & Shared Entities
    rel_findings = analyze_related_bidders(bidders, tender_id)
    all_findings.extend(rel_findings)

    # 2. Analyze Bid Price Similarity
    price_findings = analyze_bid_price_similarity(bidders, tender_id, estimated_val)
    all_findings.extend(price_findings)

    # 3. Analyze Winner Concentration
    win_findings = analyze_winner_concentration(bidders, historical_tenders, tender_id)
    all_findings.extend(win_findings)

    # 4. Analyze Repeated Participation
    part_findings = analyze_repeated_participation(bidders, historical_tenders, tender_id)
    all_findings.extend(part_findings)

    # 5. Analyze Bid Rotation
    rot_findings = analyze_bid_rotation(historical_tenders, tender_id)
    all_findings.extend(rot_findings)

    # Risk Aggregation
    overall_score, risk_level, confidence = aggregate_integrity_findings(all_findings)
    contributing_signals = list(set([f.signal_type.value for f in all_findings]))
    
    summary = generate_executive_summary(all_findings, overall_score, risk_level, tender_title)

    return IntegrityAssessment(
        tender_id=tender_id,
        overall_risk_score=overall_score,
        risk_level=risk_level,
        confidence_score=confidence,
        findings_count=len(all_findings),
        findings=all_findings,
        contributing_signals=contributing_signals,
        assessed_at=datetime.now(timezone.utc).isoformat(),
        summary=summary,
    )


def assess_bidder_integrity(
    bidder_id: str,
    tender_id: Optional[str] = None
) -> IntegrityAssessment:
    """
    Run integrity evaluation focused on a specific bidder and its co-participants.
    """
    bidder = ps.get_bidder_by_id(bidder_id)
    if not bidder:
        raise ValueError(f"Bidder '{bidder_id}' not found in procurement registry.")

    t_id = tender_id or bidder.get("tender_id") or "TEN-2026-001"
    tender_assessment = assess_tender_integrity(t_id)

    # Filter findings relevant to this specific bidder
    bidder_findings = [
        f for f in tender_assessment.findings
        if f.bidder_id == bidder_id or bidder_id in f.related_bidder_ids
    ]

    score, risk_level, conf = aggregate_integrity_findings(bidder_findings)
    contributing = list(set([f.signal_type.value for f in bidder_findings]))
    
    bidder_name = bidder.get("legal_name", bidder_id)
    summary = (
        f"Integrity review for bidder '{bidder_name}' identified {len(bidder_findings)} active signal(s). "
        f"Status: {risk_level.value} RISK ({score}/100)."
        if bidder_findings
        else f"No anomalous integrity signals identified for bidder '{bidder_name}'. Status: LOW RISK (0/100)."
    )

    return IntegrityAssessment(
        tender_id=t_id,
        bidder_id=bidder_id,
        overall_risk_score=score,
        risk_level=risk_level,
        confidence_score=conf,
        findings_count=len(bidder_findings),
        findings=bidder_findings,
        contributing_signals=contributing,
        assessed_at=datetime.now(timezone.utc).isoformat(),
        summary=summary,
    )
