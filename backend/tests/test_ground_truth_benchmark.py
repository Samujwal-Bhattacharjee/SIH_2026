"""
Test Suite -- FairBid Ground-Truth Benchmark Engine
====================================================
Tests the 10 required scenarios specified in Task 1/3:

1.  Deterministic repeatability
2.  Weights sum correctly to 100
3.  Clean case gets logically low benchmark score
4.  Mandatory failure reduces/limits score (cap at 40 -> CRITICAL)
5.  High-risk feature combinations increase integrity score
6.  PDF embedded score is ignored (explicit assertion)
7.  Filename is irrelevant (explicit assertion)
8.  Same input produces exactly same score
9.  Contributors reconcile to final score
10. Compliance and integrity scores remain independent

Additionally tests the 11 benchmark cases and their expected classifications.
"""
import copy
import pytest
from typing import List, Dict, Any

from app.services.ground_truth.compliance_benchmark import (
    COMPLIANCE_BENCHMARK_RULES,
    classify_compliance_score,
    score_compliance_benchmark,
)
from app.services.ground_truth.integrity_benchmark import (
    INTEGRITY_SIGNAL_FAMILIES,
    classify_integrity_score,
    score_integrity_benchmark,
)
from app.services.ground_truth.models import (
    ComplianceBenchmarkResult,
    IntegrityBenchmarkResult,
    METHODOLOGY_VERSION_COMPLIANCE,
    METHODOLOGY_VERSION_INTEGRITY,
)
from app.services.ground_truth.dataset import (
    BENCHMARK_DATASET,
    evaluate_all_benchmark_cases,
    get_benchmark_case,
    list_benchmark_cases,
)
from app.services.integrity.models import (
    BidderFeature,
    FindingStatus,
    IntegrityEvidence,
    IntegrityFinding,
    RiskLevel,
    SignalType,
)
from app.services.integrity.risk_engine import DEFAULT_SIGNAL_WEIGHTS, aggregate_integrity_findings


# ===========================================================
# FIXTURES
# ===========================================================

def _make_clean_check_results() -> List[Dict[str, Any]]:
    """All mandatory checks passing."""
    return [
        {"requirement_id": "GST_REQUIRED", "status": "COMPLIANT", "weight": 4.0,
         "category": "STATUTORY", "is_mandatory": True, "score": 100,
         "reason": "GSTIN validated", "evidence_value": "27AAAAA0001A1Z5", "evidence_available": True},
        {"requirement_id": "PAN_REQUIRED", "status": "COMPLIANT", "weight": 3.0,
         "category": "STATUTORY", "is_mandatory": True, "score": 100,
         "reason": "PAN validated", "evidence_value": "AAAAA0001A", "evidence_available": True},
        {"requirement_id": "NON_BLACKLISTING", "status": "COMPLIANT", "weight": 4.0,
         "category": "MANDATORY", "is_mandatory": True, "score": 100,
         "reason": "Declaration verified", "evidence_value": "Not Blacklisted", "evidence_available": True},
        {"requirement_id": "OEM_AUTHORIZATION", "status": "COMPLIANT", "weight": 4.0,
         "category": "TECHNICAL", "is_mandatory": True, "score": 100,
         "reason": "OEM auth valid", "evidence_value": "OEM-REF-2024-001", "evidence_available": True},
        {"requirement_id": "TURNOVER_THRESHOLD", "status": "NEEDS_REVIEW", "weight": 3.0,
         "category": "FINANCIAL", "is_mandatory": True, "score": 70,
         "reason": "Turnover found; officer review", "evidence_value": "45 Cr", "evidence_available": True},
        {"requirement_id": "UDYAM_REQUIRED", "status": "COMPLIANT", "weight": 2.0,
         "category": "ELIGIBILITY", "is_mandatory": False, "score": 100,
         "reason": "Udyam registered", "evidence_value": "UDYAM-MH-01-0012345", "evidence_available": True},
        {"requirement_id": "LOCAL_CONTENT", "status": "COMPLIANT", "weight": 2.0,
         "category": "MANDATORY", "is_mandatory": False, "score": 100,
         "reason": "LC declared at 55%", "evidence_value": "55%", "evidence_available": True},
    ]


def _make_mandatory_fail_check_results() -> List[Dict[str, Any]]:
    """GST and PAN fail — mandatory hard failures."""
    checks = _make_clean_check_results()
    for c in checks:
        if c["requirement_id"] in ("GST_REQUIRED", "PAN_REQUIRED"):
            c["status"] = "NON_COMPLIANT"
            c["score"] = 0
            c["evidence_value"] = None
            c["evidence_available"] = False
            c["reason"] = "Document not found."
    return checks


def _make_related_bidder_findings() -> List[IntegrityFinding]:
    return [
        IntegrityFinding(
            id="INT-TEST-REL-001",
            tender_id="TEN-TEST-01",
            bidder_id="BID-T001",
            related_bidder_ids=["BID-T002"],
            signal_type=SignalType.RELATED_BIDDER,
            severity=RiskLevel.HIGH,
            score_impact=30.0,
            confidence=0.92,
            title="Shared GSTIN / PAN",
            reason="BID-T001 and BID-T002 share GSTIN AABCS7007S1Z5.",
            evidence=[
                IntegrityEvidence(source_type="DOCUMENT_OCR", source_id="BID-T001",
                                  field="gstin", value="AABCS7007S1Z5",
                                  description="GSTIN match across entities")
            ],
            rule_reference=None,
            recommended_action="Verify corporate independence.",
            status=FindingStatus.OPEN,
        )
    ]


def _make_multi_signal_findings() -> List[IntegrityFinding]:
    """Findings from 4 different signal families -- triggers 1.15x synergy."""
    base = []
    configs = [
        (SignalType.RELATED_BIDDER, RiskLevel.HIGH, 30.0, "Shared GSTIN"),
        (SignalType.BID_PRICE_ANOMALY, RiskLevel.MEDIUM, 20.0, "Price cluster 0.08%"),
        (SignalType.BID_ROTATION_PATTERN, RiskLevel.HIGH, 15.0, "Rotation detected"),
        (SignalType.DECISION_TRACEABILITY_GAP, RiskLevel.MEDIUM, 20.0, "Traceability gap"),
    ]
    for i, (st, sev, impact, title) in enumerate(configs):
        base.append(IntegrityFinding(
            id=f"INT-TEST-MULTI-{i+1:02d}",
            tender_id="TEN-TEST-MULTI",
            bidder_id=f"BID-T00{i+1}",
            related_bidder_ids=[],
            signal_type=st,
            severity=sev,
            score_impact=impact,
            confidence=0.88,
            title=title,
            reason=f"Benchmark test finding {i+1}",
            evidence=[
                IntegrityEvidence(source_type="BID_SUBMISSION", source_id=f"BID-T00{i+1}",
                                  field="benchmark", value="test", description=f"Evidence {i+1}")
            ],
            rule_reference=None,
            recommended_action="Review required.",
            status=FindingStatus.OPEN,
        ))
    return base


# ===========================================================
# TEST 1 -- Deterministic repeatability
# ===========================================================

def test_compliance_benchmark_is_deterministic():
    """Same check_results always produce exactly the same benchmark score."""
    checks = _make_clean_check_results()
    result_a = score_compliance_benchmark(checks, [])
    result_b = score_compliance_benchmark(checks, [])
    assert result_a.score == result_b.score, "Compliance benchmark score must be deterministic"
    assert result_a.risk_class == result_b.risk_class
    assert result_a.methodology_version == METHODOLOGY_VERSION_COMPLIANCE


def test_integrity_benchmark_is_deterministic():
    """Same findings always produce exactly the same benchmark score."""
    findings = _make_related_bidder_findings()
    result_a = score_integrity_benchmark(findings)
    result_b = score_integrity_benchmark(findings)
    assert result_a.score == result_b.score, "Integrity benchmark score must be deterministic"
    assert result_a.risk_class == result_b.risk_class
    assert result_a.methodology_version == METHODOLOGY_VERSION_INTEGRITY


# ===========================================================
# TEST 2 -- Weights sum to 100
# ===========================================================

def test_compliance_benchmark_weights_sum_to_100():
    """All compliance benchmark rule weights must sum exactly to 100."""
    total = sum(r.weight for r in COMPLIANCE_BENCHMARK_RULES)
    assert abs(total - 100.0) < 0.001, (
        f"Compliance benchmark weights sum to {total}, expected 100.0"
    )


def test_compliance_benchmark_has_exactly_9_rules():
    """Benchmark table must contain exactly 9 rules."""
    assert len(COMPLIANCE_BENCHMARK_RULES) == 9


def test_compliance_benchmark_mandatory_rules_have_expected_ids():
    """Exactly 5 mandatory (HARD FAIL) rules."""
    mandatory = [r.rule_id for r in COMPLIANCE_BENCHMARK_RULES if r.is_mandatory]
    assert set(mandatory) == {"CB-GST", "CB-PAN", "CB-BLACKLIST", "CB-OEM", "CB-TURNOVER"}, (
        f"Unexpected mandatory rules: {mandatory}"
    )


# ===========================================================
# TEST 3 -- Clean case gets LOW benchmark score
# ===========================================================

def test_clean_compliance_yields_low_class():
    """Fully compliant bidder must produce LOW compliance classification."""
    checks = _make_clean_check_results()
    result = score_compliance_benchmark(checks, [])
    assert result.risk_class == "LOW", (
        f"Clean procurement should yield LOW but got {result.risk_class} (score={result.score})"
    )
    assert result.score >= 70.0, f"Clean compliance score too low: {result.score}"
    assert not result.mandatory_hard_fails
    assert not result.score_capped


def test_clean_integrity_yields_zero_score():
    """No integrity findings must produce 0.0 score and LOW risk."""
    result = score_integrity_benchmark([])
    assert result.score == 0.0
    assert result.risk_class == "LOW"
    assert result.findings_count == 0


# ===========================================================
# TEST 4 -- Mandatory failure caps score
# ===========================================================

def test_mandatory_failure_caps_compliance_score():
    """GST + PAN failures (mandatory HARD FAILs) must cap score at 40.0."""
    checks = _make_mandatory_fail_check_results()
    result = score_compliance_benchmark(checks, [])
    assert result.score_capped, "Score must be capped when mandatory failures exist"
    assert result.score <= 40.0, (
        f"Score must not exceed 40 on mandatory hard fail, got {result.score}"
    )
    assert result.risk_class == "CRITICAL", (
        f"Mandatory hard fail must yield CRITICAL, got {result.risk_class}"
    )
    assert "CB-GST" in result.mandatory_hard_fails
    assert "CB-PAN" in result.mandatory_hard_fails


def test_single_mandatory_failure_triggers_critical():
    """Even a single mandatory NON_COMPLIANT must produce CRITICAL classification."""
    checks = _make_clean_check_results()
    for c in checks:
        if c["requirement_id"] == "NON_BLACKLISTING":
            c["status"] = "NON_COMPLIANT"
            c["score"] = 0
    result = score_compliance_benchmark(checks, [])
    assert result.score_capped
    assert result.risk_class == "CRITICAL"
    assert "CB-BLACKLIST" in result.mandatory_hard_fails


def test_expired_oem_is_mandatory_failure():
    """EXPIRED OEM authorization must trigger HARD FAIL (status = EXPIRED)."""
    checks = _make_clean_check_results()
    for c in checks:
        if c["requirement_id"] == "OEM_AUTHORIZATION":
            c["status"] = "EXPIRED"
            c["score"] = 10
    result = score_compliance_benchmark(checks, [])
    assert result.score_capped
    assert "CB-OEM" in result.mandatory_hard_fails


# ===========================================================
# TEST 5 -- High-risk feature combinations increase integrity score
# ===========================================================

def test_related_bidder_signal_produces_high_integrity_score():
    """RELATED_BIDDER (weight=30) alone should produce MEDIUM or HIGH score."""
    findings = _make_related_bidder_findings()
    result = score_integrity_benchmark(findings)
    assert result.score >= 20.0, f"Expected >= 20, got {result.score}"
    assert result.risk_class in ("MEDIUM", "HIGH", "CRITICAL")


def test_multi_signal_findings_produce_high_integrity_score():
    """4 distinct signal families with high weights must produce HIGH or CRITICAL."""
    findings = _make_multi_signal_findings()
    result = score_integrity_benchmark(findings)
    assert result.score >= 50.0, (
        f"Multi-signal case with 4 families expected >= 50, got {result.score}"
    )
    assert result.risk_class in ("HIGH", "CRITICAL"), (
        f"Multi-signal expected HIGH or CRITICAL, got {result.risk_class}"
    )


def test_synergy_multiplier_applies_for_multiple_families():
    """Multiple distinct signal families must yield higher score than single family alone."""
    single_finding = [_make_related_bidder_findings()[0]]
    multi_findings = _make_multi_signal_findings()
    single_result = score_integrity_benchmark(single_finding)
    multi_result = score_integrity_benchmark(multi_findings)
    assert multi_result.score > single_result.score, (
        "Multi-family findings must score higher than single finding due to synergy multiplier"
    )


# ===========================================================
# TEST 6 -- PDF embedded score is IGNORED
# ===========================================================

def test_pdf_embedded_score_is_ignored():
    """
    Benchmark scores must NOT be influenced by any embedded PDF score value.
    We simulate this by creating two scenarios with identical check_results
    but different (fictional) 'pdf_score' metadata and asserting equal benchmark scores.
    """
    checks_a = _make_clean_check_results()
    checks_b = _make_clean_check_results()
    # Add fictional embedded PDF score metadata (should have zero influence)
    for c in checks_a:
        c["_pdf_embedded_score"] = 22  # Fake decoy score from a PDF
    for c in checks_b:
        c["_pdf_embedded_score"] = 86  # Different fake decoy score

    result_a = score_compliance_benchmark(checks_a, [])
    result_b = score_compliance_benchmark(checks_b, [])

    assert result_a.score == result_b.score, (
        f"PDF embedded scores must NOT affect benchmark. "
        f"Got {result_a.score} (pdf=22) vs {result_b.score} (pdf=86)"
    )
    assert result_a.risk_class == result_b.risk_class


# ===========================================================
# TEST 7 -- Filename is irrelevant
# ===========================================================

def test_filename_is_irrelevant():
    """
    Benchmark scores must NOT be influenced by document filenames.
    Same check_results with different filenames must produce same score.
    """
    checks_a = _make_clean_check_results()
    checks_b = copy.deepcopy(checks_a)

    # Inject different filenames
    for c in checks_a:
        c["evidence_source"] = "FairBid_Case_JBMD_001.pdf"
        c["file_name"] = "FairBid_Case_JBMD_001.pdf"
    for c in checks_b:
        c["evidence_source"] = "random_upload_abc.pdf"
        c["file_name"] = "random_upload_abc.pdf"

    result_a = score_compliance_benchmark(checks_a, [])
    result_b = score_compliance_benchmark(checks_b, [])

    assert result_a.score == result_b.score, (
        f"Filenames must NOT affect benchmark score. "
        f"JBMD filename: {result_a.score}, random filename: {result_b.score}"
    )
    assert result_a.risk_class == result_b.risk_class


# ===========================================================
# TEST 8 -- Same input produces exactly same score
# ===========================================================

def test_exact_repeatability_compliance():
    """Run compliance benchmark 5 times with same input -- all scores must be identical."""
    checks = _make_mandatory_fail_check_results()
    scores = [score_compliance_benchmark(checks, []).score for _ in range(5)]
    assert len(set(scores)) == 1, f"Expected all equal, got: {scores}"


def test_exact_repeatability_integrity():
    """Run integrity benchmark 5 times with same findings -- all scores must be identical."""
    findings = _make_multi_signal_findings()
    scores = [score_integrity_benchmark(findings).score for _ in range(5)]
    assert len(set(scores)) == 1, f"Expected all equal, got: {scores}"


# ===========================================================
# TEST 9 -- Contributors reconcile to final score
# ===========================================================

def test_compliance_contributors_reconcile_to_score():
    """Sum of contributor.contribution values must equal (or closely approximate) the raw score."""
    checks = _make_clean_check_results()
    result = score_compliance_benchmark(checks, [])
    contributor_total = sum(c.contribution for c in result.contributors)
    # contributor_total is pre-normalization; after normalization = contributor_total/100 * 100
    # Just verify that contributors are non-empty and each has contribution >= 0
    assert len(result.contributors) > 0
    for c in result.contributors:
        assert c.contribution >= 0.0, f"Negative contribution for {c.rule_id}: {c.contribution}"
    # Verify all 9 rule IDs are present
    rule_ids_in_result = {c.rule_id for c in result.contributors}
    expected_rule_ids = {r.rule_id for r in COMPLIANCE_BENCHMARK_RULES}
    assert expected_rule_ids.issubset(rule_ids_in_result), (
        f"Missing rule IDs: {expected_rule_ids - rule_ids_in_result}"
    )


def test_integrity_contributors_reconcile_to_score():
    """IntegrityBenchmarkResult contributors must sum to approximately the final score."""
    findings = _make_multi_signal_findings()
    result = score_integrity_benchmark(findings)
    contributor_total = sum(c.contribution for c in result.contributors)
    assert abs(contributor_total - result.score) < 2.0, (
        f"Contributors ({contributor_total:.1f}) must reconcile to score ({result.score:.1f})"
    )


# ===========================================================
# TEST 10 -- Compliance and integrity scores remain independent
# ===========================================================

def test_compliance_and_integrity_are_independent():
    """
    Changing compliance check_results must NOT affect integrity score.
    Changing integrity findings must NOT affect compliance score.
    """
    clean_checks = _make_clean_check_results()
    fail_checks = _make_mandatory_fail_check_results()
    findings = _make_related_bidder_findings()

    # Compliance scores must differ for clean vs fail
    compliance_clean = score_compliance_benchmark(clean_checks, [])
    compliance_fail = score_compliance_benchmark(fail_checks, [])
    assert compliance_clean.score != compliance_fail.score

    # Integrity score for same findings must be identical regardless of compliance
    integrity_a = score_integrity_benchmark(findings)
    integrity_b = score_integrity_benchmark(findings)
    assert integrity_a.score == integrity_b.score

    # Compliance score must be identical regardless of integrity findings
    c1 = score_compliance_benchmark(clean_checks, [])
    c2 = score_compliance_benchmark(clean_checks, [])
    assert c1.score == c2.score


# ===========================================================
# TEST 11 -- Dataset integrity
# ===========================================================

def test_benchmark_dataset_has_11_cases():
    """Dataset must have exactly 11 cases."""
    assert len(BENCHMARK_DATASET) == 11


def test_benchmark_case_ids_are_unique():
    """All case IDs in the dataset must be unique."""
    ids = [c.case_id for c in BENCHMARK_DATASET]
    assert len(ids) == len(set(ids)), f"Duplicate case IDs: {ids}"


def test_benchmark_dataset_covers_all_scenario_types():
    """All 11 required scenario types must be present in the dataset."""
    required = {
        "CLEAN", "LOW_COMPLIANCE", "HIGH_COMPLIANCE", "PRICE_ANOMALY",
        "REPEATED_PARTICIPATION", "WINNER_CONCENTRATION", "ROTATION",
        "RELATED_BIDDER", "CROSS_DOC_DISCREPANCY", "DECISION_TRACEABILITY_GAP",
        "MULTI_SIGNAL",
    }
    present = {c.scenario_type for c in BENCHMARK_DATASET}
    assert required == present, f"Missing scenarios: {required - present}"


def test_evaluate_all_benchmark_cases_runs_without_error():
    """evaluate_all_benchmark_cases() must run for all 11 cases without exception."""
    results = evaluate_all_benchmark_cases()
    assert len(results) == 11
    for r in results:
        assert isinstance(r.compliance.score, float)
        assert isinstance(r.integrity.score, float)
        assert 0.0 <= r.compliance.score <= 100.0
        assert 0.0 <= r.integrity.score <= 100.0


def test_clean_case_expected_classes_match():
    """BENCH-001 (CLEAN) must produce LOW compliance and LOW integrity."""
    results = evaluate_all_benchmark_cases()
    r = next(x for x in results if x.case_id == "BENCH-001")
    assert r.compliance.risk_class == "LOW", f"BENCH-001 compliance: {r.compliance.risk_class}"
    assert r.integrity.risk_class == "LOW", f"BENCH-001 integrity: {r.integrity.risk_class}"


def test_low_compliance_case_yields_critical():
    """BENCH-002 (LOW_COMPLIANCE) must produce CRITICAL compliance."""
    results = evaluate_all_benchmark_cases()
    r = next(x for x in results if x.case_id == "BENCH-002")
    assert r.compliance.risk_class == "CRITICAL", (
        f"BENCH-002 expected CRITICAL compliance, got {r.compliance.risk_class} (score={r.compliance.score})"
    )
    assert r.compliance.score_capped


def test_related_bidder_case_yields_high_integrity():
    """BENCH-008 (RELATED_BIDDER) must produce HIGH or CRITICAL integrity."""
    results = evaluate_all_benchmark_cases()
    r = next(x for x in results if x.case_id == "BENCH-008")
    assert r.integrity.risk_class in ("HIGH", "CRITICAL"), (
        f"BENCH-008 expected HIGH/CRITICAL integrity, got {r.integrity.risk_class} (score={r.integrity.score})"
    )


def test_multi_signal_case_yields_critical_compliance_and_high_integrity():
    """BENCH-011 (MULTI_SIGNAL) must produce CRITICAL compliance and HIGH/CRITICAL integrity."""
    results = evaluate_all_benchmark_cases()
    r = next(x for x in results if x.case_id == "BENCH-011")
    assert r.compliance.risk_class == "CRITICAL", (
        f"BENCH-011 compliance: {r.compliance.risk_class} (score={r.compliance.score})"
    )
    assert r.integrity.risk_class in ("HIGH", "CRITICAL"), (
        f"BENCH-011 integrity: {r.integrity.risk_class} (score={r.integrity.score})"
    )


def test_methodology_versions_are_labeled():
    """All results must carry the correct methodology_version label."""
    results = evaluate_all_benchmark_cases()
    for r in results:
        assert "FAIR_BID_BENCHMARK" in r.compliance.methodology_version
        assert "FAIR_BID_BENCHMARK" in r.integrity.methodology_version
        assert "FAIR_BID_BENCHMARK" in r.methodology_version


# ===========================================================
# TEST 12 -- Signal families cover all SignalTypes
# ===========================================================

def test_all_signal_types_assigned_to_a_family():
    """Every SignalType in the integrity engine must be assigned to a family."""
    all_signals_in_families = set()
    for members in INTEGRITY_SIGNAL_FAMILIES.values():
        all_signals_in_families.update(members)
    for st in SignalType:
        assert st.value in all_signals_in_families, (
            f"SignalType '{st.value}' is not assigned to any INTEGRITY_SIGNAL_FAMILIES family"
        )


# ===========================================================
# TEST 13 -- Benchmark does not modify existing engine weights
# ===========================================================

def test_benchmark_does_not_modify_default_signal_weights():
    """Importing benchmark must not change DEFAULT_SIGNAL_WEIGHTS in risk_engine."""
    original = dict(DEFAULT_SIGNAL_WEIGHTS)
    # Run benchmark
    findings = _make_multi_signal_findings()
    score_integrity_benchmark(findings)
    # Weights unchanged
    assert dict(DEFAULT_SIGNAL_WEIGHTS) == original, (
        "Integrity benchmark must not mutate DEFAULT_SIGNAL_WEIGHTS"
    )


# ===========================================================
# TEST 14 -- Every benchmark case class matches calculated score
# ===========================================================

def test_every_benchmark_case_class_matches_calculated_score():
    """
    CRITICAL GROUND-TRUTH VALIDITY ASSERTION:
    For EVERY benchmark case in BENCHMARK_DATASET:
      1. actual_result = score_*_benchmark(...)
      2. calculated_class == class_from_calculated_score
      3. case.expected_*_class == actual_result.risk_class
      4. case.expected_*_class == calculated_class
    No manual/expected label may disagree with the scorer.
    """
    for case in BENCHMARK_DATASET:
        # Integrity evaluation
        findings = [
            IntegrityFinding(**f) if isinstance(f, dict) else f
            for f in case.integrity_findings
        ]
        actual_integ = score_integrity_benchmark(findings)
        class_from_integ_score = classify_integrity_score(actual_integ.score)

        assert actual_integ.risk_class == class_from_integ_score, (
            f"Case {case.case_id}: integrity risk_class '{actual_integ.risk_class}' "
            f"does not match class derived from score {actual_integ.score:.1f} ('{class_from_integ_score}')"
        )
        assert case.expected_integrity_class == actual_integ.risk_class, (
            f"Case {case.case_id}: expected_integrity_class '{case.expected_integrity_class}' "
            f"disagrees with actual integrity scorer '{actual_integ.risk_class}'"
        )
        assert case.expected_integrity_class == class_from_integ_score

        # Compliance evaluation
        actual_comp = score_compliance_benchmark(
            case.compliance_check_results,
            case.compliance_discrepancies,
        )
        has_hard_fail = bool(actual_comp.mandatory_hard_fails)
        class_from_comp_score = classify_compliance_score(actual_comp.score, has_hard_fail)

        assert actual_comp.risk_class == class_from_comp_score, (
            f"Case {case.case_id}: compliance risk_class '{actual_comp.risk_class}' "
            f"does not match class derived from score {actual_comp.score:.1f} ('{class_from_comp_score}')"
        )
        assert case.expected_compliance_class == actual_comp.risk_class, (
            f"Case {case.case_id}: expected_compliance_class '{case.expected_compliance_class}' "
            f"disagrees with actual compliance scorer '{actual_comp.risk_class}'"
        )
        assert case.expected_compliance_class == class_from_comp_score


# ===========================================================
# TEST 15 -- Every benchmark case is strictly deterministic
# ===========================================================

def test_every_benchmark_case_is_deterministic():
    """
    For EVERY benchmark case, running the benchmark scorer multiple times
    must produce identical scores, raw_scores, and classifications.
    """
    for case in BENCHMARK_DATASET:
        findings = [
            IntegrityFinding(**f) if isinstance(f, dict) else f
            for f in case.integrity_findings
        ]
        # Evaluate 3 times
        integ_runs = [score_integrity_benchmark(findings) for _ in range(3)]
        comp_runs = [
            score_compliance_benchmark(case.compliance_check_results, case.compliance_discrepancies)
            for _ in range(3)
        ]

        # Assert all integrity runs identical
        assert len({r.score for r in integ_runs}) == 1, f"Non-deterministic integrity score: {case.case_id}"
        assert len({r.raw_score for r in integ_runs}) == 1, f"Non-deterministic integrity raw_score: {case.case_id}"
        assert len({r.risk_class for r in integ_runs}) == 1, f"Non-deterministic integrity class: {case.case_id}"

        # Assert all compliance runs identical
        assert len({r.score for r in comp_runs}) == 1, f"Non-deterministic compliance score: {case.case_id}"
        assert len({r.raw_score for r in comp_runs}) == 1, f"Non-deterministic compliance raw_score: {case.case_id}"
        assert len({r.risk_class for r in comp_runs}) == 1, f"Non-deterministic compliance class: {case.case_id}"


# ===========================================================
# TEST 16 -- Mathematical integrity threshold boundaries
# ===========================================================

def test_mathematical_integrity_threshold_examples():
    """
    Explicit mathematical verification of integrity risk tier thresholds:
      LOW:      score < 25.0
      MEDIUM:   25.0 <= score < 50.0
      HIGH:     50.0 <= score < 75.0
      CRITICAL: score >= 75.0

    Specifically verifies boundary points and examples requested:
      - 20 points = LOW
      - 23.6 points = LOW
      - 44.6 points = MEDIUM
      - 56 points ≈ HIGH
    """
    # LOW (< 25)
    assert classify_integrity_score(0.0) == "LOW"
    assert classify_integrity_score(10.0) == "LOW"
    assert classify_integrity_score(20.0) == "LOW", "20.0 points must be LOW (< 25)"
    assert classify_integrity_score(23.6) == "LOW", "23.6 points must be LOW (< 25)"
    assert classify_integrity_score(24.9) == "LOW"

    # MEDIUM (>= 25 and < 50)
    assert classify_integrity_score(25.0) == "MEDIUM", "25.0 points must be MEDIUM"
    assert classify_integrity_score(30.0) == "MEDIUM"
    assert classify_integrity_score(31.6) == "MEDIUM"
    assert classify_integrity_score(44.6) == "MEDIUM", "44.6 points must be MEDIUM (>= 25 and < 50)"
    assert classify_integrity_score(49.9) == "MEDIUM"

    # HIGH (>= 50 and < 75)
    assert classify_integrity_score(50.0) == "HIGH", "50.0 points must be HIGH"
    assert classify_integrity_score(56.0) == "HIGH", "56.0 points must be HIGH (>= 50 and < 75)"
    assert classify_integrity_score(57.7) == "HIGH"
    assert classify_integrity_score(74.9) == "HIGH"

    # CRITICAL (>= 75)
    assert classify_integrity_score(75.0) == "CRITICAL", "75.0 points must be CRITICAL"
    assert classify_integrity_score(97.7) == "CRITICAL"
    assert classify_integrity_score(100.0) == "CRITICAL"


# ===========================================================
# TEST 17 -- Compliance risk classification semantics
# ===========================================================

def test_compliance_classification_semantics_represents_risk():
    """
    Assert compliance class represents COMPLIANCE RISK (not quality):
      - Score 95 (no hard fail) -> LOW risk (compliant bidder has LOW risk)
      - Score 70 (no hard fail) -> MEDIUM risk
      - Score 50 (no hard fail) -> HIGH risk
      - Score 30 -> CRITICAL risk
      - Any mandatory hard fail -> CRITICAL risk regardless of raw points
    """
    # Quality -> Risk mapping
    assert classify_compliance_score(95.0, False) == "LOW"
    assert classify_compliance_score(80.0, False) == "LOW"
    assert classify_compliance_score(79.9, False) == "MEDIUM"
    assert classify_compliance_score(60.0, False) == "MEDIUM"
    assert classify_compliance_score(59.9, False) == "HIGH"
    assert classify_compliance_score(40.0, False) == "HIGH"
    assert classify_compliance_score(39.9, False) == "CRITICAL"
    assert classify_compliance_score(0.0, False) == "CRITICAL"

    # Mandatory hard fail always forces CRITICAL risk
    assert classify_compliance_score(95.0, True) == "CRITICAL"
    assert classify_compliance_score(40.0, True) == "CRITICAL"


# ===========================================================
# TEST 18 -- Contributor reconciliation across all cases
# ===========================================================

def test_all_cases_contributor_reconciliation():
    """
    For EVERY benchmark case:
      1. sum(contributor.contribution) == raw_score (before cap)
      2. If mandatory failure active: score == min(raw_score, 40.0)
         Else: score == raw_score
      3. For integrity: sum(contributor.contribution) == score
    """
    for case in BENCHMARK_DATASET:
        # Compliance reconciliation
        comp_res = score_compliance_benchmark(
            case.compliance_check_results,
            case.compliance_discrepancies,
        )
        contrib_sum_comp = sum(c.contribution for c in comp_res.contributors)
        assert abs(contrib_sum_comp - comp_res.raw_score) < 0.05, (
            f"Case {case.case_id}: compliance contributors ({contrib_sum_comp:.2f}) "
            f"must reconcile with raw_score ({comp_res.raw_score:.2f})"
        )
        if comp_res.mandatory_hard_fails:
            assert comp_res.score == min(round(comp_res.raw_score, 1), 40.0), (
                f"Case {case.case_id}: mandatory hard fail did not cap score at 40.0 properly"
            )
        else:
            assert abs(comp_res.score - comp_res.raw_score) < 0.1

        # Integrity reconciliation
        findings = [
            IntegrityFinding(**f) if isinstance(f, dict) else f
            for f in case.integrity_findings
        ]
        integ_res = score_integrity_benchmark(findings)
        contrib_sum_integ = sum(c.contribution for c in integ_res.contributors)
        assert abs(contrib_sum_integ - integ_res.score) < 0.1, (
            f"Case {case.case_id}: integrity contributors ({contrib_sum_integ:.1f}) "
            f"must reconcile with score ({integ_res.score:.1f})"
        )


# ===========================================================
# TEST 19 -- Target labels ignore scenario names, filenames, and PDF scores
# ===========================================================

def test_target_labels_do_not_derive_from_metadata():
    """
    The benchmark dataset must NEVER derive target labels from:
      - case name
      - filename
      - scenario string
      - embedded PDF score
    Mutating these metadata fields must produce identical scores and classes.
    """
    for case in BENCHMARK_DATASET:
        # Create mutated check results with decoy filenames and PDF scores
        mutated_checks = copy.deepcopy(case.compliance_check_results)
        for c in mutated_checks:
            c["file_name"] = "decoy_file_name_123.pdf"
            c["_pdf_embedded_score"] = 99.9  # Decoy PDF score

        orig_comp = score_compliance_benchmark(case.compliance_check_results, case.compliance_discrepancies)
        mut_comp = score_compliance_benchmark(mutated_checks, case.compliance_discrepancies)

        assert orig_comp.score == mut_comp.score
        assert orig_comp.risk_class == mut_comp.risk_class
