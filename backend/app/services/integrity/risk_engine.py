"""
Risk Aggregation & Evaluation Engine — Procurement Integrity V2
===============================================================
Consolidates discrete integrity signals, applies transparent configurable weights,
enforces diminishing returns (anti-double-counting), calculates multi-indicator synergy,
produces itemized score breakdowns, and generates audit-ready executive summaries.

Guarantees:
- Completely deterministic output for identical input datasets.
- Clean datasets evaluate to LOW risk tier (score < 25.0, zero findings).
- Mathematical decomposability: sum of score breakdown points equals overall score.
- Explicit statutory rule reference anchors and transparent RiskBasis parameters.
"""
from typing import Any, Dict, List, Optional, Tuple
from datetime import datetime, timezone

from app.core import procurement_store as ps
from app.services.integrity.models import (
    BidderFeature,
    FindingStatus,
    IntegrityAssessment,
    IntegrityFinding,
    RiskBasis,
    RiskLevel,
    ScoreContributor,
    SignalType,
)
from app.services.integrity.feature_extractor import (
    extract_bidder_features,
    enrich_bidder_features_with_history,
)
from app.services.integrity.relationship_analyzer import (
    analyze_related_bidders,
    analyze_common_directors,
    analyze_document_identity_inconsistencies,
)
from app.services.integrity.bid_analyzer import (
    analyze_bid_price_similarity,
    analyze_winner_concentration,
    analyze_repeated_participation,
    analyze_bid_rotation,
    analyze_bid_to_estimate_anomaly,
    analyze_losing_bid_pattern,
    analyze_non_competition_pattern,
    analyze_narrow_competition,
    analyze_officer_vendor_association,
    analyze_commercial_boq_patterns,
    analyze_submission_timing,
    PRICE_SIMILARITY_THRESHOLD_PCT,
    MIN_HISTORICAL_TENDERS_FOR_CONCENTRATION,
    WINNER_CONCENTRATION_THRESHOLD_RATIO,
    MIN_CO_PARTICIPATIONS,
    MIN_TENDERS_FOR_ROTATION,
    BID_TO_ESTIMATE_DELTA_THRESHOLD_PCT,
    NARROW_COMPETITION_MAX_BIDDERS,
    OFFICER_ASSOCIATION_MIN_TENDERS,
    OFFICER_ASSOCIATION_THRESHOLD_RATIO,
)


# ============================================================
# CONFIGURABLE RISK WEIGHTS & TIER THRESHOLDS
# ============================================================

DEFAULT_SIGNAL_WEIGHTS = {
    SignalType.RELATED_BIDDER: 30.0,
    SignalType.DOCUMENT_IDENTITY_INCONSISTENCY: 30.0,
    SignalType.COMMON_DIRECTOR_LINK: 25.0,
    SignalType.OFFICER_VENDOR_ASSOCIATION: 25.0,
    SignalType.BID_PRICE_ANOMALY: 20.0,
    SignalType.COMMERCIAL_BOQ_ANOMALY: 20.0,
    SignalType.SHARED_ENTITY: 20.0,
    SignalType.BID_ROTATION_PATTERN: 15.0,
    SignalType.BID_TO_ESTIMATE_ANOMALY: 15.0,
    SignalType.LOSING_BID_PATTERN: 15.0,
    SignalType.NARROW_COMPETITION: 15.0,
    SignalType.CONFLICT_OF_INTEREST: 15.0,
    SignalType.REPEATED_WINNER_PATTERN: 10.0,
    SignalType.REPEATED_PARTICIPATION_PATTERN: 10.0,
    SignalType.NON_COMPETITION_PATTERN: 10.0,
    SignalType.SUBMISSION_TIMING_ANOMALY: 10.0,
    SignalType.TENDER_CHANGE_PATTERN: 10.0,
}

# Maximum score points any single signal family can contribute (anti-explosion)
FAMILY_CAPS = {
    SignalType.RELATED_BIDDER: 40.0,
    SignalType.DOCUMENT_IDENTITY_INCONSISTENCY: 35.0,
    SignalType.COMMON_DIRECTOR_LINK: 35.0,
    SignalType.OFFICER_VENDOR_ASSOCIATION: 35.0,
    SignalType.BID_PRICE_ANOMALY: 30.0,
    SignalType.COMMERCIAL_BOQ_ANOMALY: 25.0,
    SignalType.SHARED_ENTITY: 25.0,
    SignalType.BID_ROTATION_PATTERN: 20.0,
    SignalType.BID_TO_ESTIMATE_ANOMALY: 20.0,
    SignalType.LOSING_BID_PATTERN: 20.0,
    SignalType.NARROW_COMPETITION: 20.0,
    SignalType.REPEATED_WINNER_PATTERN: 15.0,
    SignalType.REPEATED_PARTICIPATION_PATTERN: 15.0,
    SignalType.NON_COMPETITION_PATTERN: 15.0,
    SignalType.SUBMISSION_TIMING_ANOMALY: 15.0,
    SignalType.TENDER_CHANGE_PATTERN: 15.0,
    SignalType.CONFLICT_OF_INTEREST: 20.0,
}

RISK_TIER_THRESHOLDS = [
    (75.0, RiskLevel.CRITICAL),
    (50.0, RiskLevel.HIGH),
    (25.0, RiskLevel.MEDIUM),
    (0.0, RiskLevel.LOW),
]


def calculate_risk_tier(score: float) -> RiskLevel:
    """Map continuous 0-100 risk score to standard 4-tier statutory classification."""
    for threshold, tier in RISK_TIER_THRESHOLDS:
        if score >= threshold:
            return tier
    return RiskLevel.LOW


class AggregateResult(tuple):
    """
    Backwards-compatible tuple holding (score, risk_level, confidence)
    with itemized contributors and evidence counts accessible via attributes.
    Supports standard 3-tuple unpacking: score, risk_level, confidence = aggregate_integrity_findings(...)
    """
    def __new__(
        cls,
        score: float,
        risk_level: RiskLevel,
        confidence: float,
        contributors: Optional[List[ScoreContributor]] = None,
        evidence_counts: Optional[Dict[str, int]] = None
    ):
        return super().__new__(cls, (score, risk_level, confidence))

    def __init__(
        self,
        score: float,
        risk_level: RiskLevel,
        confidence: float,
        contributors: Optional[List[ScoreContributor]] = None,
        evidence_counts: Optional[Dict[str, int]] = None
    ):
        self.score = score
        self.risk_level = risk_level
        self.confidence = confidence
        self.contributors = contributors or []
        self.evidence_counts = evidence_counts or {}


def aggregate_integrity_findings(
    findings: List[IntegrityFinding]
) -> AggregateResult:
    """
    Deterministically aggregate multiple findings with:
    1. Diminishing returns per signal family (1st: 100%, 2nd: 50%, 3rd+: 25%)
    2. Family contribution caps
    3. Multi-indicator corroboration multiplier (synergy between independent families)
    4. Exact point decomposition into ScoreContributors
    """
    if not findings:
        return AggregateResult(0.0, RiskLevel.LOW, 1.0, [], {})

    # 1. Group by signal family and calculate unscaled family scores
    signal_counts: Dict[str, int] = {}
    family_points: Dict[str, float] = {}
    item_contributions: List[Tuple[IntegrityFinding, float, float, float]] = []  # (finding, base, mult, points)
    evidence_counts: Dict[str, int] = {}

    for f in findings:
        st = f.signal_type.value if hasattr(f.signal_type, "value") else str(f.signal_type)
        count = signal_counts.get(st, 0)
        signal_counts[st] = count + 1

        # Diminishing weight for repeated findings of same category
        if count == 0:
            mult = 1.0
        elif count == 1:
            mult = 0.5
        else:
            mult = 0.25

        base_val = f.score_impact if f.score_impact > 0 else DEFAULT_SIGNAL_WEIGHTS.get(f.signal_type, 15.0)
        raw_pts = base_val * mult

        # Check family cap
        current_fam_pts = family_points.get(st, 0.0)
        fam_cap = FAMILY_CAPS.get(f.signal_type, 35.0)
        allowed_pts = max(0.0, min(raw_pts, fam_cap - current_fam_pts))
        family_points[st] = current_fam_pts + allowed_pts

        item_contributions.append((f, base_val, mult, allowed_pts))

        # Count evidence by source
        for ev in f.evidence:
            stype = ev.source_type or "OTHER"
            evidence_counts[stype] = evidence_counts.get(stype, 0) + 1

    # 2. Multi-indicator synergy multiplier
    distinct_families = len(signal_counts)
    if distinct_families >= 4:
        synergy = 1.15
    elif distinct_families >= 3:
        synergy = 1.10
    elif distinct_families >= 2:
        synergy = 1.05
    else:
        synergy = 1.0

    # 3. Apply synergy to items and normalize
    contributors: List[ScoreContributor] = []
    unbounded_total = 0.0
    for f, base_val, mult, allowed_pts in item_contributions:
        scaled_pts = round(allowed_pts * synergy, 1)
        unbounded_total += scaled_pts
        clause = f.rule_reference.clause_id if f.rule_reference else None
        contributors.append(
            ScoreContributor(
                signal_type=f.signal_type.value if hasattr(f.signal_type, "value") else str(f.signal_type),
                title=f.title,
                points_added=scaled_pts,
                base_impact=round(base_val, 1),
                multiplier=round(mult * synergy, 2),
                evidence_count=len(f.evidence),
                rule_clause=clause,
            )
        )

    # 4. Cap final score at 100.0 and reconcile contributor points if capped
    final_score = min(100.0, round(unbounded_total, 1))
    if unbounded_total > 100.0 and unbounded_total > 0:
        ratio = 100.0 / unbounded_total
        reconciled = []
        running_sum = 0.0
        for idx, c in enumerate(contributors):
            if idx == len(contributors) - 1:
                pts = round(100.0 - running_sum, 1)
            else:
                pts = round(c.points_added * ratio, 1)
                running_sum += pts
            c.points_added = max(0.0, pts)
            reconciled.append(c)
        contributors = reconciled

    risk_level = calculate_risk_tier(final_score)

    # Deterministic weighted confidence
    weighted_conf = 0.0
    total_w = 0.0
    for f in findings:
        w = f.score_impact if f.score_impact > 0 else 10.0
        weighted_conf += f.confidence * w
        total_w += w
    confidence = round(weighted_conf / total_w, 2) if total_w > 0 else 0.85

    return AggregateResult(final_score, risk_level, confidence, contributors, evidence_counts)


def generate_executive_summary(
    findings: List[IntegrityFinding],
    risk_score: float,
    risk_level: RiskLevel,
    tender_title: str
) -> str:
    """Generate an objective, non-punitive executive summary for procurement review."""
    if not findings:
        return (
            f"Integrity evaluation for '{tender_title}' completed. "
            f"No anomalous bid pricing patterns, shared statutory identifiers, or historical concentration signals detected. "
            f"Overall procurement integrity status is assessed as LOW RISK ({risk_score}/100)."
        )

    signals_summary = ", ".join(list(set([f.signal_type.value for f in findings])))
    return (
        f"Integrity evaluation identified {len(findings)} review trigger(s) across {len(set([f.signal_type for f in findings]))} pattern family(ies) "
        f"({signals_summary}) for '{tender_title}'. "
        f"Composite integrity risk is categorized as {risk_level.value} ({risk_score}/100). "
        f"Observed patterns represent administrative indicators requiring officer verification prior to award confirmation."
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
    tender_cat = tender.get("category") if tender else None

    # 1. Load bidders
    if custom_bidders is not None:
        bidders = custom_bidders
    else:
        raw_bidders = ps.get_bidders(tender_id)
        bidders = [
            extract_bidder_features(b, tender_id, estimated_value=estimated_val, category=tender_cat)
            for b in raw_bidders
        ]

    # 2. Load historical tenders
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

    # 3. Enrich bidder features with historical single-pass precomputations
    bidders = enrich_bidder_features_with_history(bidders, historical_tenders, tender_cat)

    all_findings: List[IntegrityFinding] = []

    # ── Run Detectors ───────────────────────────────────────────

    # 1. Related Bidders (Shared Statutory & Operational Identifiers)
    all_findings.extend(analyze_related_bidders(bidders, tender_id))

    # 2. Common Directors / Authorized Signatories
    all_findings.extend(analyze_common_directors(bidders, tender_id))

    # 3. Document Identity Cross-Contamination
    all_findings.extend(analyze_document_identity_inconsistencies(bidders, tender_id))

    # 4. Bid Price Clustering
    all_findings.extend(analyze_bid_price_similarity(bidders, tender_id, estimated_val, historical_tenders))

    # 5. Bid-to-Estimate Anomaly
    all_findings.extend(analyze_bid_to_estimate_anomaly(bidders, tender_id, estimated_val))

    # 6. Commercial BOQ Line-Item Anomaly
    all_findings.extend(analyze_commercial_boq_patterns(bidders, tender_id))

    # 7. Winner Concentration
    all_findings.extend(analyze_winner_concentration(bidders, historical_tenders, tender_id, tender_cat))

    # 8. Repeated Participation Cohort
    all_findings.extend(analyze_repeated_participation(bidders, historical_tenders, tender_id))

    # Category-specific historical tenders for category-dependent sequence patterns
    cat_historical_tenders = historical_tenders
    if tender_cat:
        same_cat = [t for t in historical_tenders if t.get("category") == tender_cat and (t.get("winner_name") or t.get("winner_id"))]
        if len(same_cat) >= 4:
            cat_historical_tenders = same_cat

    # 9. Bid Rotation Pattern
    all_findings.extend(analyze_bid_rotation(cat_historical_tenders, tender_id))

    # 10. Losing-Bid Similarity / Cover Bid Pattern
    all_findings.extend(analyze_losing_bid_pattern(bidders, historical_tenders, tender_id))

    # 11. Participation Withdrawal / Non-Competition Pattern
    all_findings.extend(analyze_non_competition_pattern(bidders, historical_tenders, tender_id))

    # 12. Single-Vendor / Narrow Market Competition
    all_findings.extend(analyze_narrow_competition(bidders, historical_tenders, tender_id, tender_cat))

    # 13. Bidder–Officer Association (Evaluated only if officer attribution data exists)
    all_findings.extend(analyze_officer_vendor_association(bidders, historical_tenders, tender_id))

    # 14. Submission Timing Patterns
    all_findings.extend(analyze_submission_timing(bidders, tender_id))

    # ── Risk Aggregation & Decomposition ─────────────────────────
    res = aggregate_integrity_findings(all_findings)
    score, risk_level, confidence = res
    contributors = res.contributors
    ev_counts = res.evidence_counts
    contributing_signals = list(set([f.signal_type.value for f in all_findings]))

    # Merge persistent officer review status overrides
    try:
        reviews = ps.get_integrity_finding_reviews(tender_id=tender_id)
        if reviews:
            review_map = {}
            for r in reviews:
                if r.get("finding_id") and r["finding_id"] not in review_map:
                    review_map[r["finding_id"]] = r["status"]
            for f in all_findings:
                if f.id in review_map:
                    try:
                        f.status = FindingStatus(review_map[f.id])
                    except Exception:
                        pass
    except Exception:
        pass

    summary = generate_executive_summary(all_findings, score, risk_level, tender_title)

    # Concrete parameters used
    risk_basis = RiskBasis(
        price_similarity_threshold_pct=PRICE_SIMILARITY_THRESHOLD_PCT,
        min_historical_tenders_concentration=MIN_HISTORICAL_TENDERS_FOR_CONCENTRATION,
        winner_concentration_ratio=WINNER_CONCENTRATION_THRESHOLD_RATIO,
        min_co_participations=MIN_CO_PARTICIPATIONS,
        min_rotation_tenders=MIN_TENDERS_FOR_ROTATION,
        bid_to_estimate_threshold_pct=BID_TO_ESTIMATE_DELTA_THRESHOLD_PCT,
        narrow_competition_max_bidders=NARROW_COMPETITION_MAX_BIDDERS,
        officer_association_min_tenders=OFFICER_ASSOCIATION_MIN_TENDERS,
        officer_association_threshold_ratio=OFFICER_ASSOCIATION_THRESHOLD_RATIO,
        statutory_identity_keys=["PAN", "GSTIN", "CIN", "Udyam"],
        operational_identity_keys=["Address", "Email Domain", "Phone"],
    )

    return IntegrityAssessment(
        tender_id=tender_id,
        overall_risk_score=score,
        risk_level=risk_level,
        confidence_score=confidence,
        findings_count=len(all_findings),
        findings=all_findings,
        contributing_signals=contributing_signals,
        score_breakdown=contributors,
        risk_basis=risk_basis,
        evidence_counts=ev_counts,
        assessed_at=datetime.now(timezone.utc).isoformat(),
        summary=summary,
    )


def assess_bidder_integrity(
    bidder_id: str,
    tender_id: Optional[str] = None
) -> IntegrityAssessment:
    """Run integrity evaluation focused on a specific bidder and its co-participants."""
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

    res = aggregate_integrity_findings(bidder_findings)
    score, risk_level, conf = res
    contributors = res.contributors
    ev_counts = res.evidence_counts
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
        score_breakdown=contributors,
        risk_basis=tender_assessment.risk_basis,
        evidence_counts=ev_counts,
        assessed_at=datetime.now(timezone.utc).isoformat(),
        summary=summary,
    )
