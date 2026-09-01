"""
Procurement Integrity Engine Package — SIH26100 V2
==================================================
Public API surface for deterministic procurement risk analysis, signal extraction,
statutory rule referencing, and transparent evidence aggregation.
"""
from app.services.integrity.models import (
    SignalType,
    RiskLevel,
    FindingStatus,
    IntegrityEvidence,
    IntegrityFinding,
    IntegrityAssessment,
    BidderFeature,
    RiskBasis,
    ScoreContributor,
    RuleReference,
)
from app.services.integrity.risk_engine import (
    assess_tender_integrity,
    assess_bidder_integrity,
    aggregate_integrity_findings,
    DEFAULT_SIGNAL_WEIGHTS,
    calculate_risk_tier,
)
from app.services.integrity.feature_extractor import (
    extract_bidder_features,
    enrich_bidder_features_with_history,
    normalize_entity_name,
    extract_pan_from_gstin,
    normalize_address,
    extract_pincode,
    parse_numeric_amount,
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
)

__all__ = [
    "SignalType",
    "RiskLevel",
    "FindingStatus",
    "IntegrityEvidence",
    "IntegrityFinding",
    "IntegrityAssessment",
    "BidderFeature",
    "RiskBasis",
    "ScoreContributor",
    "RuleReference",
    "assess_tender_integrity",
    "assess_bidder_integrity",
    "aggregate_integrity_findings",
    "DEFAULT_SIGNAL_WEIGHTS",
    "calculate_risk_tier",
    "extract_bidder_features",
    "enrich_bidder_features_with_history",
    "normalize_entity_name",
    "extract_pan_from_gstin",
    "normalize_address",
    "extract_pincode",
    "parse_numeric_amount",
    "analyze_related_bidders",
    "analyze_common_directors",
    "analyze_document_identity_inconsistencies",
    "analyze_bid_price_similarity",
    "analyze_winner_concentration",
    "analyze_repeated_participation",
    "analyze_bid_rotation",
    "analyze_bid_to_estimate_anomaly",
    "analyze_losing_bid_pattern",
    "analyze_non_competition_pattern",
    "analyze_narrow_competition",
    "analyze_officer_vendor_association",
    "analyze_commercial_boq_patterns",
    "analyze_submission_timing",
]
