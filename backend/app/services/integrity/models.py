"""
Procurement Integrity Engine Models — SIH26100 V2
=================================================
Data structures and schema definitions for evidence-backed procurement risk signals,
relationship clusters, integrity findings, and risk assessments.
Aligned with official GeM principles (Transparency, Openness of Competition, Value for Money)
and General Financial Rules (GFR 2017).
"""
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from datetime import datetime, timezone


class SignalType(str, Enum):
    """Catalog of deterministic integrity signal categories."""
    # Existing core detectors
    BID_PRICE_ANOMALY = "BID_PRICE_ANOMALY"
    REPEATED_WINNER_PATTERN = "REPEATED_WINNER_PATTERN"
    REPEATED_PARTICIPATION_PATTERN = "REPEATED_PARTICIPATION_PATTERN"
    BID_ROTATION_PATTERN = "BID_ROTATION_PATTERN"
    RELATED_BIDDER = "RELATED_BIDDER"
    SHARED_ENTITY = "SHARED_ENTITY"
    TENDER_CHANGE_PATTERN = "TENDER_CHANGE_PATTERN"
    CONFLICT_OF_INTEREST = "CONFLICT_OF_INTEREST"

    # Enhanced & New V2 procurement pattern detectors
    BID_TO_ESTIMATE_ANOMALY = "BID_TO_ESTIMATE_ANOMALY"
    LOSING_BID_PATTERN = "LOSING_BID_PATTERN"
    NON_COMPETITION_PATTERN = "NON_COMPETITION_PATTERN"
    COMMON_DIRECTOR_LINK = "COMMON_DIRECTOR_LINK"
    OFFICER_VENDOR_ASSOCIATION = "OFFICER_VENDOR_ASSOCIATION"
    NARROW_COMPETITION = "NARROW_COMPETITION"
    COMMERCIAL_BOQ_ANOMALY = "COMMERCIAL_BOQ_ANOMALY"
    SUBMISSION_TIMING_ANOMALY = "SUBMISSION_TIMING_ANOMALY"
    DOCUMENT_IDENTITY_INCONSISTENCY = "DOCUMENT_IDENTITY_INCONSISTENCY"


class RiskLevel(str, Enum):
    """Standard 4-tier risk classification matching government procurement tiers."""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class FindingStatus(str, Enum):
    """Lifecycle status of an integrity finding during administrative review."""
    OPEN = "OPEN"
    UNDER_REVIEW = "UNDER_REVIEW"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    DISMISSED = "DISMISSED"
    RESOLVED = "RESOLVED"


class RuleReference(BaseModel):
    """
    Statutory / procurement rule reference metadata.
    Anchors signals directly in official public procurement directives (GeM, GFR 2017).
    """
    clause_id: str = Field(..., description="Statutory rule identifier (e.g., 'GFR-2017-R144', 'GEM-GTC-CL4')")
    title: str = Field(..., description="Short title of the rule or guideline")
    description: str = Field(..., description="Plain-language description of the rule context")
    applicability: str = Field(..., description="Scope and condition of applicability")


class ScoreContributor(BaseModel):
    """
    Transparent point decomposition of an individual finding's impact on overall risk score.
    Enables officers to audit exactly how the score was calculated.
    """
    signal_type: str = Field(..., description="Signal identifier")
    title: str = Field(..., description="Finding title")
    points_added: float = Field(..., description="Net numerical score contributed (0-100 scale)")
    base_impact: float = Field(..., description="Raw base severity impact before diminishing weights")
    multiplier: float = Field(..., description="Multiplier applied (diminishing returns / corroboration)")
    evidence_count: int = Field(default=1, description="Number of supporting audit evidence records")
    rule_clause: Optional[str] = Field(None, description="Associated rule reference clause")


class RiskBasis(BaseModel):
    """
    Parameters and thresholds used in the integrity assessment.
    Surfaced to officers so the evaluation basis is 100% transparent.
    """
    price_similarity_threshold_pct: float = Field(default=1.0, description="Max delta % to flag close bids")
    min_historical_tenders_concentration: int = Field(default=4, description="Min tenders required to assess winner concentration")
    winner_concentration_ratio: float = Field(default=0.75, description="Win rate threshold for concentration signal")
    min_co_participations: int = Field(default=3, description="Min joint appearances for repeated cohort signal")
    min_rotation_tenders: int = Field(default=4, description="Min sequential tenders to assess rotation")
    bid_to_estimate_threshold_pct: float = Field(default=0.5, description="Max delta % from estimate to flag clustering near estimate")
    narrow_competition_max_bidders: int = Field(default=2, description="Max bidder threshold for narrow competition signal")
    officer_association_min_tenders: int = Field(default=3, description="Min tenders for officer-vendor association signal")
    officer_association_threshold_ratio: float = Field(default=0.75, description="Association concentration ratio threshold")
    statutory_identity_keys: List[str] = Field(
        default_factory=lambda: ["PAN", "GSTIN", "CIN", "Udyam"],
        description="Statutory identifiers checked for entity linkages"
    )
    operational_identity_keys: List[str] = Field(
        default_factory=lambda: ["Address", "Email Domain", "Phone"],
        description="Operational attributes checked for shared linkages"
    )


class IntegrityEvidence(BaseModel):
    """
    Concrete data point supporting an integrity signal.
    Every finding MUST reference one or more evidence items explaining its derivation.
    """
    source_type: str = Field(
        ...,
        description="Origin category: 'BID_SUBMISSION' | 'DOCUMENT_OCR' | 'CORPORATE_REGISTRY' | 'HISTORICAL_TENDERS' | 'TENDER_METADATA' | 'AUDIT_LOG'"
    )
    source_id: Optional[str] = Field(None, description="Identifier of source record (tender_id, bidder_id, doc_id)")
    field: str = Field(..., description="Target attribute or metric (e.g., 'quote_amount', 'gstin', 'pan', 'registered_address')")
    value: Any = Field(..., description="Extracted or calculated value")
    description: str = Field(..., description="Plain-language description of this evidence item")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Supplementary context (e.g. diffs, matched tokens)")


class IntegrityFinding(BaseModel):
    """
    Structured integrity signal representing an observable pattern or relationship.
    
    IMPORTANT: Findings represent administrative review triggers, NOT proof of wrongdoing.
    All titles, reasons, and recommended actions maintain objective, non-punitive language.
    """
    id: str = Field(..., description="Unique finding ID (e.g., 'INT-FIND-xxx')")
    tender_id: Optional[str] = Field(None, description="Associated tender ID")
    bidder_id: Optional[str] = Field(None, description="Primary bidder ID associated with this finding, if specific to one bidder")
    related_bidder_ids: List[str] = Field(default_factory=list, description="IDs of co-bidders involved in this finding")
    signal_type: SignalType = Field(..., description="Classification of the integrity signal")
    severity: RiskLevel = Field(default=RiskLevel.MEDIUM, description="Calculated severity tier")
    score_impact: float = Field(default=0.0, description="Numerical contribution to overall risk score (0-100 scale)")
    confidence: float = Field(default=0.8, description="Deterministic confidence score based on evidence strength (0.0 to 1.0)")
    title: str = Field(..., description="Human-readable title describing the observed pattern")
    reason: str = Field(..., description="Detailed explanation of what was observed, why it triggered, and what it does NOT prove")
    evidence: List[IntegrityEvidence] = Field(default_factory=list, description="Audit-verifiable evidence items supporting this finding")
    rule_reference: Optional[RuleReference] = Field(None, description="Statutory or procurement rule anchor")
    recommended_action: str = Field(..., description="Recommended objective procedural action for the procurement officer")
    status: FindingStatus = Field(default=FindingStatus.OPEN, description="Review status of this finding")
    detected_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="ISO 8601 UTC timestamp of detection"
    )


class IntegrityAssessment(BaseModel):
    """
    Consolidated integrity evaluation for a tender or bidder.
    Provides deterministic risk aggregation, evidence bundles, score breakdown, and executive summary.
    """
    tender_id: Optional[str] = None
    bidder_id: Optional[str] = None
    overall_risk_score: float = Field(0.0, description="Aggregated risk score on a 0-100 scale")
    risk_level: RiskLevel = Field(RiskLevel.LOW, description="Aggregated risk tier")
    confidence_score: float = Field(1.0, description="Overall assessment confidence (0.0 to 1.0)")
    findings_count: int = 0
    findings: List[IntegrityFinding] = Field(default_factory=list)
    contributing_signals: List[str] = Field(default_factory=list)
    score_breakdown: List[ScoreContributor] = Field(default_factory=list, description="Itemized score contributions")
    risk_basis: Optional[RiskBasis] = Field(default_factory=RiskBasis, description="Parameters and thresholds applied")
    evidence_counts: Dict[str, int] = Field(default_factory=dict, description="Summary counts by evidence source type")
    assessed_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    summary: str = Field(..., description="Executive summary for the procurement committee")


class BidderFeature(BaseModel):
    """Normalized feature representation of a participating bidder."""
    # Identity
    bidder_id: str
    tender_id: str
    legal_name: str
    normalized_name: str
    trade_name: Optional[str] = None
    gstin: Optional[str] = None
    pan: Optional[str] = None
    cin: Optional[str] = None
    udyam_number: Optional[str] = None
    registered_address: Optional[str] = None
    normalized_address: Optional[str] = None
    pincode: Optional[str] = None
    contact_email: Optional[str] = None
    normalized_email_domain: Optional[str] = None
    contact_phone: Optional[str] = None
    directors: List[str] = Field(default_factory=list, description="Extracted corporate directors / authorized signatories")

    # Current Tender Bidding
    quote_amount: Optional[float] = None
    estimated_tender_value: Optional[float] = None
    rank: Optional[int] = None
    bid_spread_from_l1: Optional[float] = None
    bid_to_estimate_ratio: Optional[float] = None
    tender_category: Optional[str] = None
    tender_date: Optional[str] = None
    is_winner: bool = False
    line_items: List[Dict[str, Any]] = Field(default_factory=list, description="Itemized BOQ line items")
    submission_timestamp: Optional[str] = None
    compliance_score: float = 0.0
    status: str = "PENDING_DOCUMENTS"
    extracted_fields: Dict[str, Any] = Field(default_factory=dict)

    # Historical Metrics (populated by feature enricher)
    participation_count: int = 0
    wins: int = 0
    win_rate: float = 0.0
    category_participation_count: int = 0
    category_wins: int = 0
    category_win_rate: float = 0.0
    repeat_co_participations: Dict[str, int] = Field(default_factory=dict)

    # Officer / Process linkage interface
    officer_id: Optional[str] = None
    officer_name: Optional[str] = None
    decided_by: Optional[str] = None
    decided_at: Optional[str] = None
    review_count: int = 0
    officer_action_timing_seconds: Optional[float] = None
