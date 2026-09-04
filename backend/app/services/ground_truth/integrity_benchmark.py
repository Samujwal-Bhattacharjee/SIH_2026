"""
FairBid Ground-Truth Integrity Benchmark -- SIH26100
=====================================================
FAIR BID BENCHMARK / RULE-BASED GROUND TRUTH -- Integrity scoring.

This is NOT the operational integrity engine (risk_engine.py).

Design:
  - Reuses DEFAULT_SIGNAL_WEIGHTS and FAMILY_CAPS from risk_engine.py verbatim.
  - Calls aggregate_integrity_findings() -- the same deterministic aggregation
    function used by the operational engine.
  - The result is therefore exactly reproducible from IntegrityFinding objects.
  - Wraps the result in the BenchmarkResult schema with methodology_version label.

Why reuse DEFAULT_SIGNAL_WEIGHTS?
  The existing weights were carefully calibrated. Inventing new weights would create
  a non-traceable divergence between benchmark and operational outputs, making ML
  validation meaningless. The benchmark is a reference implementation, not a new model.

Signal families (from DEFAULT_SIGNAL_WEIGHTS in risk_engine.py):
  Price/commercial:
    BID_PRICE_ANOMALY (20), BID_TO_ESTIMATE_ANOMALY (15),
    COMMERCIAL_BOQ_ANOMALY (20)
  Relationship/identity:
    RELATED_BIDDER (30), COMMON_DIRECTOR_LINK (25), SHARED_ENTITY (20),
    DOCUMENT_IDENTITY_INCONSISTENCY (30), OFFICER_VENDOR_ASSOCIATION (25),
    CONFLICT_OF_INTEREST (15)
  Cohort/rotation:
    BID_ROTATION_PATTERN (15), REPEATED_PARTICIPATION_PATTERN (10),
    LOSING_BID_PATTERN (15), NON_COMPETITION_PATTERN (10)
  Market structure:
    REPEATED_WINNER_PATTERN (10), NARROW_COMPETITION (15)
  Administrative/telemetry:
    SUBMISSION_TIMING_ANOMALY (10), TENDER_CHANGE_PATTERN (10),
    DECISION_TRACEABILITY_GAP (20)
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from app.services.ground_truth.models import (
    BenchmarkContributor,
    IntegrityBenchmarkResult,
    METHODOLOGY_VERSION_INTEGRITY,
)
from app.services.integrity.models import IntegrityFinding, SignalType
from app.services.integrity.risk_engine import (
    aggregate_integrity_findings,
    DEFAULT_SIGNAL_WEIGHTS,
    FAMILY_CAPS,
    RISK_TIER_THRESHOLDS,
)


# ============================================================
# SIGNAL FAMILY GROUPING (documentation only -- not used in scoring math)
# Justification: grouping from risk_engine.py design intent
# ============================================================

INTEGRITY_SIGNAL_FAMILIES: Dict[str, List[str]] = {
    "Price/Commercial": [
        SignalType.BID_PRICE_ANOMALY.value,
        SignalType.BID_TO_ESTIMATE_ANOMALY.value,
        SignalType.COMMERCIAL_BOQ_ANOMALY.value,
    ],
    "Relationship/Identity": [
        SignalType.RELATED_BIDDER.value,
        SignalType.COMMON_DIRECTOR_LINK.value,
        SignalType.SHARED_ENTITY.value,
        SignalType.DOCUMENT_IDENTITY_INCONSISTENCY.value,
        SignalType.OFFICER_VENDOR_ASSOCIATION.value,
        SignalType.CONFLICT_OF_INTEREST.value,
    ],
    "Cohort/Rotation": [
        SignalType.BID_ROTATION_PATTERN.value,
        SignalType.REPEATED_PARTICIPATION_PATTERN.value,
        SignalType.LOSING_BID_PATTERN.value,
        SignalType.NON_COMPETITION_PATTERN.value,
    ],
    "Market Structure": [
        SignalType.REPEATED_WINNER_PATTERN.value,
        SignalType.NARROW_COMPETITION.value,
    ],
    "Administrative/Telemetry": [
        SignalType.SUBMISSION_TIMING_ANOMALY.value,
        SignalType.TENDER_CHANGE_PATTERN.value,
        SignalType.DECISION_TRACEABILITY_GAP.value,
    ],
}


def _signal_family(signal_type_value: str) -> str:
    """Return family name for a signal type value string."""
    for family, members in INTEGRITY_SIGNAL_FAMILIES.items():
        if signal_type_value in members:
            return family
    return "Other"


def score_integrity_benchmark(
    findings: List[IntegrityFinding],
) -> IntegrityBenchmarkResult:
    """
    Calculate the FairBid integrity ground-truth benchmark score.

    Parameters
    ----------
    findings : List[IntegrityFinding]
        Integrity findings produced by any combination of the existing detectors.
        These are the same IntegrityFinding objects that the operational engine produces.

    Returns
    -------
    IntegrityBenchmarkResult
        Structured benchmark result with itemized signal contributors.
        methodology_version = "FAIR_BID_BENCHMARK_INTEGRITY_v1.0"

    Notes
    -----
    - Calls aggregate_integrity_findings() exactly as the operational engine does.
    - Weights come from DEFAULT_SIGNAL_WEIGHTS (no new weights invented).
    - Family caps enforced by the aggregator (FAMILY_CAPS).
    - Diminishing returns applied by the aggregator (100% / 50% / 25%).
    - Multi-family synergy applied by the aggregator (up to 1.15x).
    - Score capped at 100.0 by the aggregator.
    """
    aggregate = aggregate_integrity_findings(findings)
    score: float = aggregate.score
    risk_level = aggregate.risk_level
    score_contributors = aggregate.contributors

    # Build BenchmarkContributor list from ScoreContributor objects
    benchmark_contributors: List[BenchmarkContributor] = []
    for sc in score_contributors:
        signal_val = sc.signal_type
        family = _signal_family(signal_val)
        base_weight = DEFAULT_SIGNAL_WEIGHTS.get(
            # resolve enum by value
            next((st for st in SignalType if st.value == signal_val), signal_val),  # type: ignore[arg-type]
            15.0,
        )
        benchmark_contributors.append(BenchmarkContributor(
            rule_id=signal_val,
            rule_name=sc.title,
            observed_value={
                "family": family,
                "base_weight": base_weight,
                "family_cap": FAMILY_CAPS.get(
                    next((st for st in SignalType if st.value == signal_val), signal_val),  # type: ignore[arg-type]
                    35.0,
                ),
                "evidence_count": sc.evidence_count,
                "rule_clause": sc.rule_clause,
            },
            weight=round(sc.base_impact, 1),
            contribution=sc.points_added,
            result="TRIGGERED",
            evidence=f"Signal family: {family}. Evidence records: {sc.evidence_count}.",
            reason=(
                f"Signal '{signal_val}' triggered with base weight {sc.base_impact:.1f}, "
                f"multiplier {sc.multiplier:.2f} (incl. diminishing returns + synergy). "
                f"Points added to score: {sc.points_added:.1f}."
            ),
        ))

    active_families = sorted(set(
        _signal_family(
            f.signal_type.value if hasattr(f.signal_type, "value") else str(f.signal_type)
        )
        for f in findings
    ))

    return IntegrityBenchmarkResult(
        score=score,
        risk_class=risk_level.value,
        findings_count=len(findings),
        active_signal_families=active_families,
        contributors=benchmark_contributors,
        methodology_version=METHODOLOGY_VERSION_INTEGRITY,
    )
