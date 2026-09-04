"""
FairBid Ground-Truth Compliance Benchmark — SIH26100
=====================================================
FAIR BID BENCHMARK / RULE-BASED GROUND TRUTH — Compliance scoring.

This is NOT the operational compliance engine (procurement_service.py).
It provides a transparent, deterministic, independently reproducible benchmark
score used as the reference target for ML model validation.

Rule Table (weights sum to 100)
--------------------------------
Rule ID        Rule Name                           Weight  Mandatory  Source
CB-GST         Valid GST Registration              16      YES        Project: GST_REQUIRED, STATUTORY cat, GFR 2017 R144
CB-PAN         PAN Card                            12      YES        Project: PAN_REQUIRED, STATUTORY cat
CB-BLACKLIST   Non-Blacklisting Declaration        15      YES        Project: NON_BLACKLISTING, MANDATORY cat, GFR Rule 144(xi)
CB-OEM         OEM Authorization (MAF)             15      YES        Project: OEM_AUTHORIZATION, TECHNICAL cat
CB-TURNOVER    Annual Turnover Threshold           14      YES        Project: TURNOVER_THRESHOLD, FINANCIAL cat
CB-UDYAM       Udyam/MSME Registration             8       NO         Project: UDYAM_REQUIRED, ELIGIBILITY cat
CB-LOCAL       Local Content Declaration           8       NO         Project: LOCAL_CONTENT, MANDATORY cat, Make-in-India Order 2017
CB-XDOC        Cross-Document Consistency          7       NO         Project: run_cross_document_validation()
CB-COMPLETE    Mandatory Document Completeness     5       NO         Project: APPLICATION_COMPLETENESS_EVALUATION
               -----------------------------------------------------------------
               TOTAL                              100

Mandatory failure rule (GFR 2017 Rule 144):
  If ANY of CB-GST, CB-PAN, CB-BLACKLIST, CB-OEM, CB-TURNOVER suffer a hard failure ->
  final score is capped at 40.0, and classification is forced to CRITICAL.

Classification Semantics:
  The benchmark compliance classification represents COMPLIANCE RISK (not compliance quality):
    LOW Risk:      score >= 80.0 and no mandatory hard fail (minimal disqualification risk)
    MEDIUM Risk:   60.0 <= score < 80.0 and no mandatory hard fail (moderate compliance risk)
    HIGH Risk:     40.0 <= score < 60.0 and no mandatory hard fail (elevated compliance risk)
    CRITICAL Risk: score < 40.0 OR any mandatory HARD FAIL (critical disqualification risk)
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from app.services.ground_truth.models import (
    BenchmarkContributor,
    BenchmarkRuleConfig,
    ComplianceBenchmarkResult,
    METHODOLOGY_VERSION_COMPLIANCE,
)


# ============================================================
# BENCHMARK RULE TABLE
# Weights sum to 100. Verified in test_ground_truth_benchmark.py.
# ============================================================

COMPLIANCE_BENCHMARK_RULES: List[BenchmarkRuleConfig] = [
    BenchmarkRuleConfig(
        rule_id="CB-GST",
        rule_name="Valid GST Registration",
        weight=16.0,
        is_mandatory=True,
        assumption_source="Project: GST_REQUIRED (STATUTORY category, weight 4.0). GFR 2017 Rule 144.",
        maps_to_req_ids=["GST_REQUIRED"],
    ),
    BenchmarkRuleConfig(
        rule_id="CB-PAN",
        rule_name="PAN Card (Permanent Account Number)",
        weight=12.0,
        is_mandatory=True,
        assumption_source="Project: PAN_REQUIRED (STATUTORY category, weight 3.0). Income Tax Act.",
        maps_to_req_ids=["PAN_REQUIRED"],
    ),
    BenchmarkRuleConfig(
        rule_id="CB-BLACKLIST",
        rule_name="Non-Blacklisting / Non-Debarment Declaration",
        weight=15.0,
        is_mandatory=True,
        assumption_source=(
            "Project: NON_BLACKLISTING (MANDATORY category, weight 4.0). "
            "GFR 2017 Rule 144(xi): Firms debarred by Central/State Government "
            "cannot participate in public procurement."
        ),
        maps_to_req_ids=["NON_BLACKLISTING"],
    ),
    BenchmarkRuleConfig(
        rule_id="CB-OEM",
        rule_name="OEM Authorization / Manufacturer Authorization Form (MAF)",
        weight=15.0,
        is_mandatory=True,
        assumption_source=(
            "Project: OEM_AUTHORIZATION (TECHNICAL category, weight 4.0). "
            "GeM Technical Compliance requirement. NOT_APPLICABLE for dealership/service tenders."
        ),
        maps_to_req_ids=["OEM_AUTHORIZATION"],
    ),
    BenchmarkRuleConfig(
        rule_id="CB-TURNOVER",
        rule_name="Minimum Annual Turnover Threshold",
        weight=14.0,
        is_mandatory=True,
        assumption_source=(
            "Project: TURNOVER_THRESHOLD (FINANCIAL category, weight 3.0). "
            "Threshold is tender-specific; where configured, tender value is used. "
            "FAIR BID DEMO ASSUMPTION: passes if evidence is present and COMPLIANT/NEEDS_REVIEW."
        ),
        maps_to_req_ids=["TURNOVER_THRESHOLD", "FINANCIAL_ELIGIBILITY_EVALUATION"],
    ),
    BenchmarkRuleConfig(
        rule_id="CB-UDYAM",
        rule_name="Udyam / MSME Registration",
        weight=8.0,
        is_mandatory=False,
        assumption_source=(
            "Project: UDYAM_REQUIRED (ELIGIBILITY category, weight 2.0). "
            "Mandatory only if bidder claims MSME status for price preference."
        ),
        maps_to_req_ids=["UDYAM_REQUIRED"],
    ),
    BenchmarkRuleConfig(
        rule_id="CB-LOCAL",
        rule_name="Local Content Declaration (Make in India)",
        weight=8.0,
        is_mandatory=False,
        assumption_source=(
            "Project: LOCAL_CONTENT (MANDATORY category, weight 2.0). "
            "Public Procurement (Preference to Make in India) Order 2017. "
            "NOT_APPLICABLE for exempted items."
        ),
        maps_to_req_ids=["LOCAL_CONTENT"],
    ),
    BenchmarkRuleConfig(
        rule_id="CB-XDOC",
        rule_name="Cross-Document Consistency (GSTIN/PAN/Name across documents)",
        weight=7.0,
        is_mandatory=False,
        assumption_source=(
            "Project: run_cross_document_validation() output (discrepancy list). "
            "FAIR BID DEMO ASSUMPTION: CRITICAL discrepancies score 0, HIGH score 40, no issues score 100."
        ),
        maps_to_req_ids=[],
    ),
    BenchmarkRuleConfig(
        rule_id="CB-COMPLETE",
        rule_name="Mandatory Document Completeness",
        weight=5.0,
        is_mandatory=False,
        assumption_source=(
            "Project: APPLICATION_COMPLETENESS_EVALUATION rule. "
            "Checks whether the application dossier checklist is complete."
        ),
        maps_to_req_ids=["APPLICATION_COMPLETENESS_EVALUATION"],
    ),
]

# Build lookup: operational requirement_id -> benchmark rule
_REQ_ID_TO_RULE: Dict[str, BenchmarkRuleConfig] = {}
for _rule in COMPLIANCE_BENCHMARK_RULES:
    for _req in _rule.maps_to_req_ids:
        _REQ_ID_TO_RULE[_req] = _rule

# Mandatory rule IDs (for capping logic)
MANDATORY_RULE_IDS = {r.rule_id for r in COMPLIANCE_BENCHMARK_RULES if r.is_mandatory}

# Cross-document rule reference
_XDOC_RULE = next(r for r in COMPLIANCE_BENCHMARK_RULES if r.rule_id == "CB-XDOC")
_COMPLETE_RULE = next(r for r in COMPLIANCE_BENCHMARK_RULES if r.rule_id == "CB-COMPLETE")

# Risk classification thresholds
_COMPLIANCE_RISK_TIERS = [
    (80.0, "LOW"),
    (60.0, "MEDIUM"),
    (40.0, "HIGH"),
    (0.0, "CRITICAL"),
]


def classify_compliance_score(score: float, has_hard_fail: bool) -> str:
    """
    Map compliance score and mandatory hard-fail flag to COMPLIANCE RISK class.

    SEMANTICS: This class represents COMPLIANCE RISK (not compliance quality).
      - LOW:      score >= 80.0 and no hard fail (minimal compliance risk of disqualification)
      - MEDIUM:   60.0 <= score < 80.0 and no hard fail (moderate compliance risk)
      - HIGH:     40.0 <= score < 60.0 and no hard fail (elevated compliance risk)
      - CRITICAL: score < 40.0 OR any mandatory HARD FAIL (severe disqualification risk)
    """
    if has_hard_fail:
        return "CRITICAL"
    for threshold, label in _COMPLIANCE_RISK_TIERS:
        if score >= threshold:
            return label
    return "CRITICAL"


# Backward-compatible alias
_classify_compliance = classify_compliance_score


def _check_result_per_rule_score(status: str) -> float:
    """
    Map operational check status to a 0-100 per-rule score for benchmark weighting.
    Mirrors the SEVERITY_SCORE_MAP in procurement_service.py but applied at benchmark level.
    """
    mapping = {
        "COMPLIANT": 100.0,
        "NOT_APPLICABLE": 100.0,  # excluded from weight but neutral
        "NEEDS_REVIEW": 60.0,
        "PENDING": 20.0,
        "UNVERIFIED": 0.0,
        "NON_COMPLIANT": 0.0,
        "EXPIRED": 10.0,
    }
    return mapping.get(status, 20.0)


def _is_hard_fail_status(status: str) -> bool:
    """Return True if the status constitutes a mandatory rule failure."""
    return status in ("NON_COMPLIANT", "EXPIRED", "UNVERIFIED", "PENDING")


def _xdoc_score_from_discrepancies(discrepancies: List[Dict[str, Any]]) -> float:
    """
    Derive CB-XDOC per-rule score from cross-document discrepancy list.
    CRITICAL discrepancies: score 0.
    HIGH discrepancies only: score 40.
    MEDIUM only: score 70.
    No discrepancies: score 100.
    """
    if not discrepancies:
        return 100.0
    severities = {d.get("severity", "MEDIUM") for d in discrepancies}
    if "CRITICAL" in severities:
        return 0.0
    if "HIGH" in severities:
        return 40.0
    return 70.0


def score_compliance_benchmark(
    check_results: List[Dict[str, Any]],
    discrepancies: Optional[List[Dict[str, Any]]] = None,
) -> ComplianceBenchmarkResult:
    """
    Calculate the FairBid compliance ground-truth benchmark score.

    Parameters
    ----------
    check_results : list[dict]
        Output of procurement_service.run_compliance_checks() — one dict per requirement.
        Each dict must contain: requirement_id, result_status (or status), is_mandatory, weight.
    discrepancies : list[dict] | None
        Output of procurement_service.run_cross_document_validation().
        Used for CB-XDOC rule. Pass [] or None if none.

    Returns
    -------
    ComplianceBenchmarkResult
        Structured benchmark result with full contributor breakdown.
        methodology_version = "FAIR_BID_BENCHMARK_COMPLIANCE_v1.0"
    """
    discrepancies = discrepancies or []

    contributors: List[BenchmarkContributor] = []
    mandatory_hard_fails: List[str] = []

    # Track which benchmark rules have been covered by check_results
    covered_rule_ids = set()

    # ── Step 1: Map each check_result to its benchmark rule ─────────────────
    for check in check_results:
        req_id = check.get("requirement_id", "")
        rule = _REQ_ID_TO_RULE.get(req_id)
        if rule is None:
            # Unmapped rule — try to match by category fallback (skip if truly unknown)
            continue

        # Avoid double-counting if multiple req_ids map to same benchmark rule
        if rule.rule_id in covered_rule_ids:
            continue
        covered_rule_ids.add(rule.rule_id)

        status = check.get("status") or check.get("result_status") or "PENDING"
        per_rule_score = _check_result_per_rule_score(status)

        # NOT_APPLICABLE: treat as full score, still contribute to weight coverage
        contribution = round(rule.weight * per_rule_score / 100.0, 2)

        is_fail = rule.is_mandatory and _is_hard_fail_status(status)
        if is_fail:
            mandatory_hard_fails.append(rule.rule_id)

        result_label = (
            "PASS" if status in ("COMPLIANT", "NOT_APPLICABLE")
            else "FAIL" if status in ("NON_COMPLIANT", "EXPIRED", "UNVERIFIED")
            else "PARTIAL" if status == "NEEDS_REVIEW"
            else "PENDING"
        )

        evidence_src = (
            check.get("evidence_source")
            or check.get("evidence_doc_id")
            or ("Extracted from submitted document" if check.get("evidence_available") else "No evidence available")
        )

        contributors.append(BenchmarkContributor(
            rule_id=rule.rule_id,
            rule_name=rule.rule_name,
            observed_value=check.get("evidence_value") or check.get("status"),
            weight=rule.weight,
            contribution=contribution,
            result=result_label,
            evidence=str(evidence_src) if evidence_src else None,
            reason=check.get("reason") or f"Status: {status}",
        ))

    # ── Step 2: CB-XDOC (cross-document consistency) ─────────────────────────
    if _XDOC_RULE.rule_id not in covered_rule_ids:
        xdoc_score = _xdoc_score_from_discrepancies(discrepancies)
        xdoc_contribution = round(_XDOC_RULE.weight * xdoc_score / 100.0, 2)
        xdoc_result = (
            "PASS" if xdoc_score == 100.0
            else "FAIL" if xdoc_score == 0.0
            else "PARTIAL"
        )
        disc_summary = (
            f"{len(discrepancies)} discrepancies found "
            f"({', '.join(sorted({d.get('severity','') for d in discrepancies}))})"
            if discrepancies else "No cross-document discrepancies detected"
        )
        contributors.append(BenchmarkContributor(
            rule_id=_XDOC_RULE.rule_id,
            rule_name=_XDOC_RULE.rule_name,
            observed_value=len(discrepancies),
            weight=_XDOC_RULE.weight,
            contribution=xdoc_contribution,
            result=xdoc_result,
            evidence=disc_summary,
            reason=disc_summary,
        ))
        covered_rule_ids.add(_XDOC_RULE.rule_id)

    # ── Step 3: CB-COMPLETE — check from APPLICATION_COMPLETENESS_EVALUATION ──
    if _COMPLETE_RULE.rule_id not in covered_rule_ids:
        complete_check = next(
            (c for c in check_results
             if c.get("requirement_id") in ("APPLICATION_COMPLETENESS_EVALUATION",)),
            None
        )
        if complete_check:
            status = complete_check.get("status") or "PENDING"
            per_rule_score = _check_result_per_rule_score(status)
        else:
            # If not tested, give partial credit — FAIR BID DEMO ASSUMPTION
            per_rule_score = 50.0
            status = "NOT_TESTED"
        contribution = round(_COMPLETE_RULE.weight * per_rule_score / 100.0, 2)
        contributors.append(BenchmarkContributor(
            rule_id=_COMPLETE_RULE.rule_id,
            rule_name=_COMPLETE_RULE.rule_name,
            observed_value=status,
            weight=_COMPLETE_RULE.weight,
            contribution=contribution,
            result="PASS" if per_rule_score >= 80 else ("PARTIAL" if per_rule_score >= 40 else "FAIL"),
            evidence=None,
            reason=f"Application completeness status: {status}",
        ))
        covered_rule_ids.add(_COMPLETE_RULE.rule_id)

    # ── Step 4: Fill any remaining benchmark rules not yet covered ─────────────
    for rule in COMPLIANCE_BENCHMARK_RULES:
        if rule.rule_id in covered_rule_ids:
            continue
        # Rule not covered by any check result — treat as PENDING
        contributors.append(BenchmarkContributor(
            rule_id=rule.rule_id,
            rule_name=rule.rule_name,
            observed_value=None,
            weight=rule.weight,
            contribution=round(rule.weight * 20.0 / 100.0, 2),  # PENDING = 20%
            result="PENDING",
            evidence=None,
            reason="No check result available for this rule — treated as PENDING.",
        ))

    # ── Step 5: Compute raw score and reconcile contributors ───────────────────
    # NOT_APPLICABLE contributors get FULL contribution (100%), consistent with operational engine
    raw_contrib_sum = round(sum(c.contribution for c in contributors), 2)
    # Normalise: total possible = sum of all weights = 100
    total_weight = sum(r.weight for r in COMPLIANCE_BENCHMARK_RULES)
    # raw_score represents the exact pre-cap compliance score out of 100.0
    raw_score = round(min(100.0, (raw_contrib_sum / total_weight) * 100.0), 1)

    # ── Step 6: Apply mandatory HARD FAIL cap ────────────────────────────────
    # Contributor reconciliation:
    #   sum(c.contribution for c in contributors) == raw_score (within rounding tolerance)
    #
    # Mandatory cap effect:
    #   If ANY mandatory rule suffers a hard failure (CB-GST, CB-PAN, CB-BLACKLIST, CB-OEM, CB-TURNOVER),
    #   GFR 2017 Rule 144 requires tender disqualification.
    #   The benchmark caps the final score at 40.0, forcing the classification into CRITICAL.
    #   final_score = min(raw_score, 40.0)
    score_capped = False
    if mandatory_hard_fails:
        final_score = round(min(raw_score, 40.0), 1)
        score_capped = True
    else:
        final_score = raw_score

    final_score = round(max(0.0, final_score), 1)
    risk_class = classify_compliance_score(final_score, bool(mandatory_hard_fails))

    return ComplianceBenchmarkResult(
        score=final_score,
        raw_score=raw_score,
        risk_class=risk_class,
        mandatory_hard_fails=mandatory_hard_fails,
        score_capped=score_capped,
        contributors=contributors,
        methodology_version=METHODOLOGY_VERSION_COMPLIANCE,
    )
