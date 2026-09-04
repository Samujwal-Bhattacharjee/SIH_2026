"""
FairBid Ground-Truth Benchmark -- Typed Schemas
===============================================
Data structures for the benchmark scoring result.

All results carry:
  - methodology_version: "FAIR_BID_BENCHMARK_COMPLIANCE_v1.0" or "FAIR_BID_BENCHMARK_INTEGRITY_v1.0"
  - contributors:  itemized per-rule / per-signal breakdown
  - score:         float on 0-100 scale
  - risk_class:    LOW / MEDIUM / HIGH / CRITICAL

These schemas are intentionally separate from the operational engine schemas
(IntegrityAssessment, ComplianceResult, etc.) to prevent confusion.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


METHODOLOGY_VERSION_COMPLIANCE = "FAIR_BID_BENCHMARK_COMPLIANCE_v1.0"
METHODOLOGY_VERSION_INTEGRITY = "FAIR_BID_BENCHMARK_INTEGRITY_v1.0"


class BenchmarkRuleConfig(BaseModel):
    """Definition of a single compliance benchmark rule."""
    rule_id: str = Field(..., description="Unique rule identifier (e.g. 'CB-GST')")
    rule_name: str = Field(..., description="Human-readable rule name")
    weight: float = Field(..., description="Benchmark weight (all rules sum to 100)")
    is_mandatory: bool = Field(
        ...,
        description="True = HARD FAIL: any failure in this rule caps compliance score at 40"
    )
    assumption_source: str = Field(
        ...,
        description="Source of rule/threshold: project rule, GFR 2017, or FAIR BID DEMO ASSUMPTION"
    )
    maps_to_req_ids: List[str] = Field(
        default_factory=list,
        description="Operational requirement IDs this rule aggregates (may be >1 for combined rules)"
    )


class BenchmarkContributor(BaseModel):
    """
    Per-rule contribution to the final benchmark score.

    For compliance: one contributor per rule_id.
    For integrity:  one contributor per IntegrityFinding signal type.
    """
    rule_id: str
    rule_name: str
    observed_value: Optional[Any] = None
    weight: float
    contribution: float = Field(
        ...,
        description="Actual points added to benchmark score (weight * per_rule_score / 100)"
    )
    result: str = Field(
        ...,
        description="PASS / FAIL / PARTIAL / NOT_APPLICABLE / PENDING"
    )
    evidence: Optional[str] = Field(
        None,
        description="Short description of supporting evidence source"
    )
    reason: str = Field(..., description="Plain-language explanation of this contributor")


class ComplianceBenchmarkResult(BaseModel):
    """
    Compliance ground-truth benchmark for a single bidder.

    Classification Semantics:
    Represents COMPLIANCE RISK (not compliance quality):
      - LOW:      score >= 80.0 and no mandatory hard fail (minimal compliance risk)
      - MEDIUM:   60.0 <= score < 80.0 and no mandatory hard fail (moderate compliance risk)
      - HIGH:     40.0 <= score < 60.0 and no mandatory hard fail (elevated compliance risk)
      - CRITICAL: score < 40.0 OR any mandatory hard fail (severe disqualification risk)

    Score & Contributor Reconciliation:
      - raw_score: sum(contributor.contribution) across all benchmark rules (0.0 to 100.0).
      - mandatory_hard_fails: list of mandatory rule IDs that suffered a hard failure.
      - score_capped: True if a mandatory failure rule is active (capping final score <= 40.0).
      - score: final score (0.0 to 100.0). Equals min(raw_score, 40.0) if mandatory failure, else raw_score.
    """
    score: float = Field(..., description="Benchmark compliance score 0-100 (capped at 40 if any mandatory HARD FAIL)")
    raw_score: float = Field(default=0.0, description="Raw compliance score: sum(contributor.contribution) before mandatory hard-fail cap")
    risk_class: str = Field(..., description="LOW / MEDIUM / HIGH / CRITICAL (represents COMPLIANCE RISK)")
    mandatory_hard_fails: List[str] = Field(
        default_factory=list,
        description="List of rule_ids that triggered mandatory HARD FAIL"
    )
    score_capped: bool = Field(
        False,
        description="True if score was capped at 40 due to mandatory failure"
    )
    contributors: List[BenchmarkContributor] = Field(default_factory=list)
    methodology_version: str = METHODOLOGY_VERSION_COMPLIANCE
    note: str = "FAIR BID BENCHMARK -- Rule-based ground truth. Not the operational compliance engine output."


class IntegrityBenchmarkResult(BaseModel):
    """
    Integrity ground-truth benchmark for a tender / bidder cohort.

    Classification Semantics:
    Represents PROCUREMENT INTEGRITY RISK:
      - LOW:      score < 25.0
      - MEDIUM:   25.0 <= score < 50.0
      - HIGH:     50.0 <= score < 75.0
      - CRITICAL: score >= 75.0

    Score & Contributor Reconciliation:
      - raw_score: sum(contributor.contribution) across all findings before the 100.0 cap.
      - score: final score bounded to [0.0, 100.0].
      - If raw_score > 100.0, score is capped at 100.0 and contributor points are reconciled proportionally.
    """
    score: float = Field(..., description="Benchmark integrity score 0-100")
    raw_score: float = Field(default=0.0, description="Raw integrity score: sum(contributor.contribution)")
    risk_class: str = Field(..., description="LOW / MEDIUM / HIGH / CRITICAL (represents INTEGRITY RISK)")
    findings_count: int = 0
    active_signal_families: List[str] = Field(default_factory=list)
    contributors: List[BenchmarkContributor] = Field(default_factory=list)
    methodology_version: str = METHODOLOGY_VERSION_INTEGRITY
    note: str = "FAIR BID BENCHMARK -- Rule-based ground truth. Weights identical to DEFAULT_SIGNAL_WEIGHTS in risk_engine.py."


class BenchmarkResult(BaseModel):
    """Combined compliance + integrity benchmark for one procurement case."""
    case_id: str
    case_label: str
    compliance: ComplianceBenchmarkResult
    integrity: IntegrityBenchmarkResult
    methodology_version: str = "FAIR_BID_BENCHMARK_v1.0"


class BenchmarkCase(BaseModel):
    """
    A single reproducible benchmark evaluation case.

    Stores structured feature objects (not filenames, not PDF scores).
    The scores and classes emerge exclusively from structured evidence via the benchmark rules.
    """
    case_id: str = Field(..., description="Unique case identifier")
    case_label: str = Field(..., description="Human-readable scenario name (descriptive only, never used as label)")
    scenario_type: str = Field(
        ...,
        description=(
            "CLEAN | LOW_COMPLIANCE | HIGH_COMPLIANCE | PRICE_ANOMALY | "
            "REPEATED_PARTICIPATION | WINNER_CONCENTRATION | ROTATION | "
            "RELATED_BIDDER | CROSS_DOC_DISCREPANCY | DECISION_TRACEABILITY_GAP | MULTI_SIGNAL"
        )
    )
    compliance_check_results: List[Dict[str, Any]] = Field(default_factory=list)
    compliance_discrepancies: List[Dict[str, Any]] = Field(default_factory=list)
    integrity_findings: List[Dict[str, Any]] = Field(default_factory=list)
    bidder_features_summary: List[Dict[str, Any]] = Field(default_factory=list)
    expected_compliance_class: str = Field(
        ...,
        description="Expected COMPLIANCE RISK class (LOW/MEDIUM/HIGH/CRITICAL) -- derived from calculated compliance score and hard-fail state"
    )
    expected_integrity_class: str = Field(
        ...,
        description="Expected INTEGRITY RISK class (LOW/MEDIUM/HIGH/CRITICAL) -- derived from calculated integrity score"
    )
