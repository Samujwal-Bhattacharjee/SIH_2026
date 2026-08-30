"""
Procurement Integrity Engine Models — SIH26100
================================================
Data structures and schema definitions for evidence-backed procurement risk signals,
relationship clusters, integrity findings, and risk assessments.
"""
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from datetime import datetime, timezone


class SignalType(str, Enum):
    """Catalog of deterministic integrity signal categories."""
    BID_PRICE_ANOMALY = "BID_PRICE_ANOMALY"
    REPEATED_WINNER_PATTERN = "REPEATED_WINNER_PATTERN"
    REPEATED_PARTICIPATION_PATTERN = "REPEATED_PARTICIPATION_PATTERN"
    BID_ROTATION_PATTERN = "BID_ROTATION_PATTERN"
    RELATED_BIDDER = "RELATED_BIDDER"
    SHARED_ENTITY = "SHARED_ENTITY"
    TENDER_CHANGE_PATTERN = "TENDER_CHANGE_PATTERN"
    CONFLICT_OF_INTEREST = "CONFLICT_OF_INTEREST"


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


class IntegrityEvidence(BaseModel):
    """
    Concrete data point supporting an integrity signal.
    Every finding MUST reference one or more evidence items explaining its derivation.
    """
    source_type: str = Field(
        ...,
        description="Origin category: 'BID_SUBMISSION' | 'DOCUMENT_OCR' | 'CORPORATE_REGISTRY' | 'HISTORICAL_TENDERS' | 'TENDER_METADATA'"
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
    All titles, reasons, and recommended actions must maintain objective, non-punitive language.
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
    recommended_action: str = Field(..., description="Recommended objective procedural action for the procurement officer")
    status: FindingStatus = Field(default=FindingStatus.OPEN, description="Review status of this finding")
    detected_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="ISO 8601 UTC timestamp of detection"
    )


class IntegrityAssessment(BaseModel):
    """
    Consolidated integrity evaluation for a tender or bidder.
    Provides deterministic risk aggregation, evidence bundles, and executive summary.
    """
    tender_id: Optional[str] = None
    bidder_id: Optional[str] = None
    overall_risk_score: float = Field(0.0, description="Aggregated risk score on a 0-100 scale")
    risk_level: RiskLevel = Field(RiskLevel.LOW, description="Aggregated risk tier")
    confidence_score: float = Field(1.0, description="Overall assessment confidence (0.0 to 1.0)")
    findings_count: int = 0
    findings: List[IntegrityFinding] = Field(default_factory=list)
    contributing_signals: List[str] = Field(default_factory=list)
    assessed_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    summary: str = Field(..., description="Executive summary for the procurement committee")


class BidderFeature(BaseModel):
    """Normalized feature representation of a participating bidder."""
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
    contact_email: Optional[str] = None
    normalized_email_domain: Optional[str] = None
    contact_phone: Optional[str] = None
    quote_amount: Optional[float] = None
    compliance_score: float = 0.0
    status: str = "PENDING_DOCUMENTS"
    extracted_fields: Dict[str, Any] = Field(default_factory=dict)
