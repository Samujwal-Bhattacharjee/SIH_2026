"""
FairBid Ground-Truth Benchmark Scoring Engine -- SIH26100
=========================================================
Deterministic, reproducible, rule-based benchmark scoring functions for:
  - Compliance Ground Truth (compliance_benchmark.py)
  - Integrity Ground Truth (integrity_benchmark.py)

IMPORTANT:
  This module provides FAIR BID BENCHMARK / RULE-BASED GROUND TRUTH scores.
  It is NOT the operational compliance or integrity engine.
  It does NOT replace, alter, or call-through to those engines results.
  It is the reference target for future ML model validation.

Methodology version: FAIR_BID_BENCHMARK v1.0
"""
from app.services.ground_truth.models import (
    BenchmarkRuleConfig,
    BenchmarkContributor,
    ComplianceBenchmarkResult,
    IntegrityBenchmarkResult,
    BenchmarkResult,
    BenchmarkCase,
)
from app.services.ground_truth.compliance_benchmark import (
    COMPLIANCE_BENCHMARK_RULES,
    score_compliance_benchmark,
)
from app.services.ground_truth.integrity_benchmark import (
    INTEGRITY_SIGNAL_FAMILIES,
    score_integrity_benchmark,
)
from app.services.ground_truth.dataset import (
    BENCHMARK_DATASET,
    get_benchmark_case,
    list_benchmark_cases,
    evaluate_all_benchmark_cases,
)

__all__ = [
    "BenchmarkRuleConfig",
    "BenchmarkContributor",
    "ComplianceBenchmarkResult",
    "IntegrityBenchmarkResult",
    "BenchmarkResult",
    "BenchmarkCase",
    "COMPLIANCE_BENCHMARK_RULES",
    "score_compliance_benchmark",
    "INTEGRITY_SIGNAL_FAMILIES",
    "score_integrity_benchmark",
    "BENCHMARK_DATASET",
    "get_benchmark_case",
    "list_benchmark_cases",
    "evaluate_all_benchmark_cases",
]

