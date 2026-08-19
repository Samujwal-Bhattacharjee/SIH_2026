"""
Pydantic schemas and typed definitions for the Case Intelligence & Risk Engine.
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class BottleneckInfo(BaseModel):
    """Details of detected stage bottleneck for a case."""
    stage: str
    days_pending: int
    severity: str = Field(description="LOW | MODERATE | CRITICAL")
    responsible_department: Optional[str] = None
    responsible_officer: Optional[str] = None
    is_bottleneck: bool = True
    root_cause_description: str


class ScoreBreakdown(BaseModel):
    """Explainable points breakdown for the calculated risk score."""
    deadline_risk: float = 0.0
    stagnation_risk: float = 0.0
    legal_opinion_risk: float = 0.0
    stage_criticality_risk: float = 0.0
    rework_risk: float = 0.0
    total_raw: float = 0.0
    total_capped: float = 0.0


class CaseIntelligenceResult(BaseModel):
    """Comprehensive intelligence output for a single case file."""
    case_id: str
    file_number: Optional[str] = None
    title: Optional[str] = None
    risk_score: float = Field(ge=0.0, le=100.0, description="Deterministic risk score 0 - 100")
    risk_level: str = Field(description="LOW | MEDIUM | HIGH | CRITICAL")
    frontend_risk_level: str = Field(description="HIGH | MEDIUM | LOW (compatible with frontend types)")
    priority: str = Field(description="IMMEDIATE | URGENT | ROUTINE")
    deadline_status: str = Field(description="SAFE | WATCH | HIGH | CRITICAL | DUE_TODAY | OVERDUE | UNKNOWN")
    delay_status: str = Field(description="ON_TRACK | MONITOR | AT_RISK | DELAYED | OVERDUE | UNKNOWN")
    days_remaining: Optional[int] = None
    limitation_deadline: Optional[str] = None
    current_stage: Optional[str] = None
    stage_dwell_days: int = 0
    bottleneck_stage: Optional[str] = None
    bottleneck_info: Optional[BottleneckInfo] = None
    recommended_action: str
    reasons: List[str]
    breakdown: ScoreBreakdown
    processed_at: str


class DashboardIntelligenceSummary(BaseModel):
    """Aggregated intelligence statistics across all cases."""
    total_cases: int
    active_cases: int
    pending_cases: int
    critical_risk_cases: int
    high_risk_cases: int
    medium_risk_cases: int
    low_risk_cases: int
    overdue_cases: int
    approaching_deadline_cases: int  # <= 7 days
    watch_deadline_cases: int         # 8 - 30 days
    delayed_cases: int
    legal_opinion_pending: int
    primary_bottleneck_stage: Optional[str] = None
    primary_bottleneck_impacted_count: int = 0
    department_bottlenecks: Dict[str, int] = Field(default_factory=dict)
    last_updated: str
