"""
FairBid Ground-Truth Benchmark Dataset -- SIH26100
===================================================
Deterministic, reproducible dataset of 11 procurement benchmark cases.

Design guarantees:
  - Fixed seed = 42 (same as synthetic_history.py).
  - No filenames used as labels.
  - No embedded PDF scores used.
  - All scores emerge from structured feature objects.
  - Each case has an explicit scenario_type and expected_*_class based on the
    observable signals, NOT on case names.

The 11 required case types:
  1.  CLEAN                   -- Fully compliant, no suspicious signals
  2.  LOW_COMPLIANCE          -- Multiple mandatory failures
  3.  HIGH_COMPLIANCE         -- All mandatory docs present, minor gaps
  4.  PRICE_ANOMALY           -- Bid price clustering (BID_PRICE_ANOMALY)
  5.  REPEATED_PARTICIPATION  -- Same cohort in >= 3 tenders
  6.  WINNER_CONCENTRATION    -- Single vendor wins >= 75% in category
  7.  ROTATION                -- Systematic alternating winner cycle
  8.  RELATED_BIDDER          -- Shared GSTIN/PAN/Director
  9.  CROSS_DOC_DISCREPANCY   -- CRITICAL cross-document mismatch (GSTIN)
  10. DECISION_TRACEABILITY_GAP -- NOT_EVALUATED bids without rationale
  11. MULTI_SIGNAL            -- Combined signals (price + rotation + related)
"""
from __future__ import annotations

import copy
from typing import Any, Dict, List, Optional

from app.services.ground_truth.models import (
    BenchmarkCase,
    BenchmarkResult,
)
from app.services.ground_truth.compliance_benchmark import score_compliance_benchmark
from app.services.ground_truth.integrity_benchmark import score_integrity_benchmark
from app.services.integrity.models import (
    BidderFeature,
    FindingStatus,
    IntegrityEvidence,
    IntegrityFinding,
    RiskLevel,
    RuleReference,
    SignalType,
)


# ============================================================
# HELPER BUILDERS
# ============================================================

def _make_check(
    req_id: str,
    name: str,
    category: str,
    is_mandatory: bool,
    status: str,
    weight: float,
    reason: str,
    evidence_value: Optional[str] = None,
    evidence_source: Optional[str] = None,
) -> Dict[str, Any]:
    """Build a check_result dict in the format produced by run_compliance_checks()."""
    status_score_map = {
        "COMPLIANT": 100, "NOT_APPLICABLE": 100,
        "NEEDS_REVIEW": 60, "PENDING": 30, "UNVERIFIED": 0,
        "NON_COMPLIANT": 0, "EXPIRED": 10,
    }
    return {
        "requirement_id": req_id,
        "requirement_name": name,
        "category": category,
        "is_mandatory": is_mandatory,
        "status": status,
        "weight": weight,
        "score": status_score_map.get(status, 30),
        "reason": reason,
        "evidence_value": evidence_value,
        "evidence_available": evidence_value is not None,
        "evidence_source": evidence_source,
        "confidence": 0.9 if status == "COMPLIANT" else (0.0 if evidence_value is None else 0.7),
    }


def _finding(
    finding_id: str,
    tender_id: str,
    signal_type: SignalType,
    severity: RiskLevel,
    score_impact: float,
    title: str,
    reason: str,
    bidder_id: Optional[str] = None,
    related_ids: Optional[List[str]] = None,
    rule_ref: Optional[RuleReference] = None,
) -> Dict[str, Any]:
    """Build a minimal IntegrityFinding dict for benchmark storage."""
    return IntegrityFinding(
        id=finding_id,
        tender_id=tender_id,
        bidder_id=bidder_id,
        related_bidder_ids=related_ids or [],
        signal_type=signal_type,
        severity=severity,
        score_impact=score_impact,
        confidence=0.85,
        title=title,
        reason=reason,
        evidence=[
            IntegrityEvidence(
                source_type="BID_SUBMISSION",
                source_id=bidder_id or tender_id,
                field="benchmark_feature",
                value="synthetic",
                description=f"Benchmark evidence for {signal_type.value}",
            )
        ],
        rule_reference=rule_ref,
        recommended_action="Officer review required.",
        status=FindingStatus.OPEN,
    ).model_dump()


# ============================================================
# REUSABLE CLEAN CHECK RESULTS
# ============================================================

def _clean_checks() -> List[Dict[str, Any]]:
    """All mandatory checks passing, optional checks compliant."""
    return [
        _make_check("GST_REQUIRED", "Valid GST Registration", "STATUTORY", True, "COMPLIANT", 4.0,
                    "GSTIN 27AAAAA0001A1Z5 extracted and validated.", "27AAAAA0001A1Z5", "GST Certificate"),
        _make_check("PAN_REQUIRED", "PAN Card", "STATUTORY", True, "COMPLIANT", 3.0,
                    "PAN AAAAA0001A extracted and validated.", "AAAAA0001A", "PAN Card"),
        _make_check("NON_BLACKLISTING", "Non-Blacklisting Declaration", "MANDATORY", True, "COMPLIANT", 4.0,
                    "Non-blacklisting declaration verified.", "Not Blacklisted", "Self-Declaration"),
        _make_check("OEM_AUTHORIZATION", "OEM Authorization", "TECHNICAL", True, "COMPLIANT", 4.0,
                    "OEM authorization present and valid.", "OEM-REF-2024-001", "OEM Letter"),
        _make_check("TURNOVER_THRESHOLD", "Annual Turnover", "FINANCIAL", True, "NEEDS_REVIEW", 3.0,
                    "Turnover evidence found; officer must verify against threshold.", "45 Cr", "Audited Statements"),
        _make_check("UDYAM_REQUIRED", "Udyam/MSME Registration", "ELIGIBILITY", False, "COMPLIANT", 2.0,
                    "UDYAM-MH-01-0012345 extracted.", "UDYAM-MH-01-0012345", "Udyam Certificate"),
        _make_check("LOCAL_CONTENT", "Local Content Declaration", "MANDATORY", False, "COMPLIANT", 2.0,
                    "Local content declared at 55%.", "55%", "LC Declaration"),
    ]


# ============================================================
# CASE 1 -- CLEAN PROCUREMENT
# ============================================================

_CASE1 = BenchmarkCase(
    case_id="BENCH-001",
    case_label="Clean Procurement — Fully Compliant Independent Bidders",
    scenario_type="CLEAN",
    compliance_check_results=_clean_checks(),
    compliance_discrepancies=[],
    integrity_findings=[],  # No signals -> score = 0/100, LOW
    bidder_features_summary=[
        {"bidder_id": "BID-B001", "quote": 4500000, "gstin": "27AAAAA0001A1Z5"},
        {"bidder_id": "BID-B002", "quote": 5100000, "gstin": "29BBBBB0002B1Z6"},
        {"bidder_id": "BID-B003", "quote": 5800000, "gstin": "07CCCCC0003C1Z7"},
    ],
    expected_compliance_class="LOW",
    expected_integrity_class="LOW",
)


# ============================================================
# CASE 2 -- LOW COMPLIANCE (Multiple mandatory failures)
# ============================================================

def _low_compliance_checks() -> List[Dict[str, Any]]:
    return [
        _make_check("GST_REQUIRED", "Valid GST Registration", "STATUTORY", True, "NON_COMPLIANT", 4.0,
                    "GST certificate not found in submitted documents."),
        _make_check("PAN_REQUIRED", "PAN Card", "STATUTORY", True, "NON_COMPLIANT", 3.0,
                    "PAN card not found in submitted documents."),
        _make_check("NON_BLACKLISTING", "Non-Blacklisting Declaration", "MANDATORY", True, "PENDING", 4.0,
                    "Non-blacklisting declaration not submitted."),
        _make_check("OEM_AUTHORIZATION", "OEM Authorization", "TECHNICAL", True, "NON_COMPLIANT", 4.0,
                    "OEM authorization letter not found. Mandatory technical requirement."),
        _make_check("TURNOVER_THRESHOLD", "Annual Turnover", "FINANCIAL", True, "PENDING", 3.0,
                    "No financial documents submitted."),
        _make_check("UDYAM_REQUIRED", "Udyam/MSME Registration", "ELIGIBILITY", False, "PENDING", 2.0,
                    "Udyam certificate not submitted."),
        _make_check("LOCAL_CONTENT", "Local Content Declaration", "MANDATORY", False, "PENDING", 2.0,
                    "Local content declaration not submitted."),
    ]


_CASE2 = BenchmarkCase(
    case_id="BENCH-002",
    case_label="Low Compliance — Multiple Mandatory Failures (No Documents Submitted)",
    scenario_type="LOW_COMPLIANCE",
    compliance_check_results=_low_compliance_checks(),
    compliance_discrepancies=[],
    integrity_findings=[],
    expected_compliance_class="CRITICAL",   # GST + PAN + BLACKLIST + OEM all fail -> HARD FAIL cap
    expected_integrity_class="LOW",
)


# ============================================================
# CASE 3 -- HIGH COMPLIANCE
# ============================================================

def _high_compliance_checks() -> List[Dict[str, Any]]:
    checks = _clean_checks()
    # Replace TURNOVER from NEEDS_REVIEW -> COMPLIANT
    for c in checks:
        if c["requirement_id"] == "TURNOVER_THRESHOLD":
            c["status"] = "COMPLIANT"
            c["score"] = 100
            c["reason"] = "Annual turnover Rs 120 Cr verified against threshold Rs 10 Cr."
            c["evidence_value"] = "120 Cr"
    return checks


_CASE3 = BenchmarkCase(
    case_id="BENCH-003",
    case_label="High Compliance — All Documents Verified and Compliant",
    scenario_type="HIGH_COMPLIANCE",
    compliance_check_results=_high_compliance_checks(),
    compliance_discrepancies=[],
    integrity_findings=[],
    expected_compliance_class="LOW",
    expected_integrity_class="LOW",
)


# ============================================================
# CASE 4 -- PRICE ANOMALY
# ============================================================

_CASE4 = BenchmarkCase(
    case_id="BENCH-004",
    case_label="Price Anomaly — Bid Price Clustering (< 1% delta between L1 and L2)",
    scenario_type="PRICE_ANOMALY",
    compliance_check_results=_clean_checks(),
    compliance_discrepancies=[],
    integrity_findings=[
        _finding(
            "INT-BENCH-004-01", "TEN-BENCH-004",
            SignalType.BID_PRICE_ANOMALY, RiskLevel.MEDIUM, 20.0,
            "Close Bid Price Cluster Detected",
            "BID-B001 (Rs 45,10,000) and BID-B002 (Rs 45,15,000) differ by only 0.11%. "
            "This is within the 1.0% alert threshold. Independent costing verification required.",
            bidder_id="BID-B001", related_ids=["BID-B002"],
        ),
    ],
    bidder_features_summary=[
        {"bidder_id": "BID-B001", "quote": 4510000},
        {"bidder_id": "BID-B002", "quote": 4515000},
        {"bidder_id": "BID-B003", "quote": 5800000},
    ],
    expected_compliance_class="LOW",
    expected_integrity_class="MEDIUM",   # 1 finding, BID_PRICE_ANOMALY = 20 pts -> MEDIUM (25-50)
)


# ============================================================
# CASE 5 -- REPEATED PARTICIPATION
# ============================================================

_CASE5 = BenchmarkCase(
    case_id="BENCH-005",
    case_label="Repeated Participation — Same Cohort in >= 3 Historical Tenders",
    scenario_type="REPEATED_PARTICIPATION",
    compliance_check_results=_clean_checks(),
    compliance_discrepancies=[],
    integrity_findings=[
        _finding(
            "INT-BENCH-005-01", "TEN-BENCH-005",
            SignalType.REPEATED_PARTICIPATION_PATTERN, RiskLevel.MEDIUM, 10.0,
            "Repeated Participation Cohort Detected",
            "BID-B001 and BID-B002 have appeared together in 4 of the last 5 similar tenders, "
            "exceeding the MIN_CO_PARTICIPATIONS=3 threshold.",
            bidder_id="BID-B001", related_ids=["BID-B002"],
        ),
    ],
    expected_compliance_class="LOW",
    expected_integrity_class="LOW",   # 10 pts -> LOW (< 25)
)


# ============================================================
# CASE 6 -- WINNER CONCENTRATION
# ============================================================

_CASE6 = BenchmarkCase(
    case_id="BENCH-006",
    case_label="Winner Concentration — Single Vendor Won >= 75% of Category Tenders",
    scenario_type="WINNER_CONCENTRATION",
    compliance_check_results=_clean_checks(),
    compliance_discrepancies=[],
    integrity_findings=[
        _finding(
            "INT-BENCH-006-01", "TEN-BENCH-006",
            SignalType.REPEATED_WINNER_PATTERN, RiskLevel.MEDIUM, 10.0,
            "Elevated Winner Concentration",
            "BID-B001 has won 4 of the last 5 IT procurement tenders in this category (80% win rate), "
            "exceeding the WINNER_CONCENTRATION_THRESHOLD_RATIO=0.75.",
            bidder_id="BID-B001",
        ),
    ],
    expected_compliance_class="LOW",
    expected_integrity_class="LOW",   # REPEATED_WINNER_PATTERN weight=10 -> score 10, LOW
)


# ============================================================
# CASE 7 -- ROTATION
# ============================================================

_CASE7 = BenchmarkCase(
    case_id="BENCH-007",
    case_label="Bid Rotation — Systematic Alternating Winner Cycle Across 4+ Tenders",
    scenario_type="ROTATION",
    compliance_check_results=_clean_checks(),
    compliance_discrepancies=[],
    integrity_findings=[
        _finding(
            "INT-BENCH-007-01", "TEN-BENCH-007",
            SignalType.BID_ROTATION_PATTERN, RiskLevel.HIGH, 15.0,
            "Systematic Bid Rotation Pattern",
            "BID-B001 and BID-B002 have alternated as winner across 6 consecutive tenders in "
            "INFORMATION_TECHNOLOGY category, meeting the MIN_TENDERS_FOR_ROTATION=4 criterion.",
            bidder_id="BID-B001", related_ids=["BID-B002"],
        ),
        _finding(
            "INT-BENCH-007-02", "TEN-BENCH-007",
            SignalType.LOSING_BID_PATTERN, RiskLevel.MEDIUM, 15.0,
            "Cover Bid Pattern — Consistent Losing Bids",
            "BID-B002 submitted bids 8-12% above BID-B001 in alternating tenders, "
            "consistent with a cover bid pattern.",
            bidder_id="BID-B002", related_ids=["BID-B001"],
        ),
    ],
    expected_compliance_class="LOW",
    expected_integrity_class="MEDIUM",   # 15 + 7.5 (50% DR) = 22.5, synergy 1.05x = 23.6 -> LOW-borderline MEDIUM
)


# ============================================================
# CASE 8 -- RELATED BIDDER (Shared GSTIN/PAN/Director)
# ============================================================

_CASE8 = BenchmarkCase(
    case_id="BENCH-008",
    case_label="Related Bidder — Shared Statutory Identifiers (GSTIN, PAN, Director)",
    scenario_type="RELATED_BIDDER",
    compliance_check_results=_clean_checks(),
    compliance_discrepancies=[],
    integrity_findings=[
        _finding(
            "INT-BENCH-008-01", "TEN-BENCH-008",
            SignalType.RELATED_BIDDER, RiskLevel.HIGH, 30.0,
            "Related Bidder — Shared GSTIN and PAN",
            "BID-B001 (Shivalik Cloud Matrix Pvt. Ltd.) and BID-B002 (Shivalik Enterprise Systems LLP) "
            "share the same GSTIN 05AABCS7007S1Z5 and PAN AABCS7007S. Both appear as independent bidders.",
            bidder_id="BID-B001", related_ids=["BID-B002"],
        ),
        _finding(
            "INT-BENCH-008-02", "TEN-BENCH-008",
            SignalType.COMMON_DIRECTOR_LINK, RiskLevel.HIGH, 25.0,
            "Common Director — Rohan Joshi",
            "BID-B001 and BID-B002 share director Rohan Joshi according to document OCR extraction.",
            bidder_id="BID-B001", related_ids=["BID-B002"],
        ),
    ],
    expected_compliance_class="LOW",
    expected_integrity_class="HIGH",   # 30 + 12.5 (50% DR) = 42.5, synergy 1.05x = 44.6 -> HIGH (25-50+)
)


# ============================================================
# CASE 9 -- CROSS-DOCUMENT DISCREPANCY (CRITICAL GSTIN mismatch)
# ============================================================

def _cross_doc_checks() -> List[Dict[str, Any]]:
    checks = list(_clean_checks())
    # Replace GST check: GSTIN found but mismatched
    for c in checks:
        if c["requirement_id"] == "GST_REQUIRED":
            c["status"] = "NEEDS_REVIEW"
            c["score"] = 50
            c["reason"] = "GSTIN extracted from document but differs from GSTIN in other submitted certificate."
    return checks


_CASE9 = BenchmarkCase(
    case_id="BENCH-009",
    case_label="Cross-Document Discrepancy — CRITICAL GSTIN Mismatch Across Documents",
    scenario_type="CROSS_DOC_DISCREPANCY",
    compliance_check_results=_cross_doc_checks(),
    compliance_discrepancies=[
        {
            "discrepancy_type": "GSTIN_MISMATCH",
            "severity": "CRITICAL",
            "field_name": "GSTIN",
            "expected_value": "27AAAAA0001A1Z5",
            "found_value": "29BBBBB9999B1Z6",
            "description": "GSTIN in GST certificate (27AAAAA0001A1Z5) does not match GSTIN in OEM Authorization (29BBBBB9999B1Z6).",
            "recommendation": "Request bidder to submit corrected documents with consistent GSTIN.",
        }
    ],
    integrity_findings=[
        _finding(
            "INT-BENCH-009-01", "TEN-BENCH-009",
            SignalType.DOCUMENT_IDENTITY_INCONSISTENCY, RiskLevel.HIGH, 30.0,
            "Document Identity Inconsistency — GSTIN Cross-Contamination",
            "GSTIN extracted from GST certificate (27AAAAA0001A1Z5) does not match GSTIN "
            "in OEM Authorization (29BBBBB9999B1Z6). This suggests either a document error or "
            "a different legal entity's document has been submitted.",
            bidder_id="BID-B001",
        ),
    ],
    expected_compliance_class="HIGH",   # CRITICAL discrepancy -> score capped, CB-XDOC fails; overall HIGH
    expected_integrity_class="HIGH",    # DOCUMENT_IDENTITY_INCONSISTENCY = 30 pts -> HIGH
)


# ============================================================
# CASE 10 -- DECISION TRACEABILITY GAP
# ============================================================

_CASE10 = BenchmarkCase(
    case_id="BENCH-010",
    case_label="Decision Traceability Gap — NOT_EVALUATED Bid Without Recorded Rationale",
    scenario_type="DECISION_TRACEABILITY_GAP",
    compliance_check_results=_clean_checks(),
    compliance_discrepancies=[],
    integrity_findings=[
        _finding(
            "INT-GAP-TEN-BENCH-010-BID-B002", "TEN-BENCH-010",
            SignalType.DECISION_TRACEABILITY_GAP, RiskLevel.MEDIUM, 20.0,
            "Decision Traceability Gap — Non-Evaluation Without Recorded Rationale",
            "Bidder BID-B002 has bid status NOT_EVALUATED in the procurement record, "
            "but no administrative justification, disqualification clause, or officer rationale is recorded. "
            "GFR 2017 Rule 173(xxii) requires reasons for non-evaluation to be recorded on file.",
            bidder_id="BID-B002",
            rule_ref=RuleReference(
                clause_id="GFR-2017-R173-XXII",
                title="General Financial Rules 2017 / CVC Guidelines",
                description="Reasons for rejection or non-evaluation of any bid must be recorded on file.",
                applicability="Mandatory for all public procurement evaluations under GFR Rule 173(xxii).",
            ),
        ),
    ],
    expected_compliance_class="LOW",
    expected_integrity_class="MEDIUM",   # DECISION_TRACEABILITY_GAP = 20 pts -> MEDIUM (25 threshold borderline)
)


# ============================================================
# CASE 11 -- MULTI-SIGNAL (price + rotation + related bidder)
# ============================================================

_CASE11_CHECKS = _low_compliance_checks()
# Partial: GST and PAN fail, others partial
for _c in _CASE11_CHECKS:
    if _c["requirement_id"] in ("OEM_AUTHORIZATION",):
        _c["status"] = "NEEDS_REVIEW"
        _c["score"] = 60
        _c["reason"] = "OEM authorization present but validity requires review."


_CASE11 = BenchmarkCase(
    case_id="BENCH-011",
    case_label="Multi-Signal Case — Price Anomaly + Rotation + Related Bidder + Low Compliance",
    scenario_type="MULTI_SIGNAL",
    compliance_check_results=_CASE11_CHECKS,
    compliance_discrepancies=[
        {
            "discrepancy_type": "NAME_MISMATCH",
            "severity": "HIGH",
            "field_name": "Legal Name",
            "expected_value": "Alpha Infotech Pvt Ltd",
            "found_value": "Alpha Infotech Private Limited",
            "description": "Name inconsistency between documents (similarity 72%).",
        }
    ],
    integrity_findings=[
        _finding(
            "INT-BENCH-011-01", "TEN-BENCH-011",
            SignalType.RELATED_BIDDER, RiskLevel.HIGH, 30.0,
            "Related Bidder — Shared PAN and Registered Address",
            "BID-B001 and BID-B002 share PAN AABCS7007S and registered address at Dehradun IT Park.",
            bidder_id="BID-B001", related_ids=["BID-B002"],
        ),
        _finding(
            "INT-BENCH-011-02", "TEN-BENCH-011",
            SignalType.BID_PRICE_ANOMALY, RiskLevel.MEDIUM, 20.0,
            "Close Bid Price Cluster",
            "BID-B001 and BID-B002 quotes differ by 0.08%, well within the 1.0% threshold.",
            bidder_id="BID-B001", related_ids=["BID-B002"],
        ),
        _finding(
            "INT-BENCH-011-03", "TEN-BENCH-011",
            SignalType.BID_ROTATION_PATTERN, RiskLevel.HIGH, 15.0,
            "Systematic Bid Rotation",
            "BID-B001 and BID-B002 have alternated as winner in 5 consecutive category tenders.",
            bidder_id="BID-B001", related_ids=["BID-B002"],
        ),
        _finding(
            "INT-BENCH-011-04", "TEN-BENCH-011",
            SignalType.DECISION_TRACEABILITY_GAP, RiskLevel.MEDIUM, 20.0,
            "Decision Traceability Gap",
            "BID-B003 marked NOT_EVALUATED without recorded administrative rationale.",
            bidder_id="BID-B003",
        ),
    ],
    expected_compliance_class="CRITICAL",   # GST + PAN failures -> HARD FAIL cap
    expected_integrity_class="CRITICAL",    # 30 + 10 + 3.75 + 5 + synergy 1.15x = ~56+ -> HIGH/CRITICAL
)


# ============================================================
# ASSEMBLED DATASET
# ============================================================

BENCHMARK_DATASET: List[BenchmarkCase] = [
    _CASE1,
    _CASE2,
    _CASE3,
    _CASE4,
    _CASE5,
    _CASE6,
    _CASE7,
    _CASE8,
    _CASE9,
    _CASE10,
    _CASE11,
]


def get_benchmark_case(case_id: str) -> Optional[BenchmarkCase]:
    """Return a benchmark case by its case_id, or None if not found."""
    return next((c for c in BENCHMARK_DATASET if c.case_id == case_id), None)


def list_benchmark_cases() -> List[Dict[str, str]]:
    """Return a summary list of available benchmark cases."""
    return [
        {
            "case_id": c.case_id,
            "case_label": c.case_label,
            "scenario_type": c.scenario_type,
            "expected_compliance_class": c.expected_compliance_class,
            "expected_integrity_class": c.expected_integrity_class,
        }
        for c in BENCHMARK_DATASET
    ]


def evaluate_all_benchmark_cases() -> List[BenchmarkResult]:
    """
    Evaluate all 11 benchmark cases and return their results.
    Reproducible: same input always produces same output (fixed seed, pure functions).
    """
    results: List[BenchmarkResult] = []
    for case in BENCHMARK_DATASET:
        # Compliance
        compliance_result = score_compliance_benchmark(
            check_results=case.compliance_check_results,
            discrepancies=case.compliance_discrepancies,
        )
        # Integrity -- deserialize finding dicts back to IntegrityFinding objects
        integrity_findings = [
            IntegrityFinding(**f) if isinstance(f, dict) else f
            for f in case.integrity_findings
        ]
        integrity_result = score_integrity_benchmark(integrity_findings)

        results.append(BenchmarkResult(
            case_id=case.case_id,
            case_label=case.case_label,
            compliance=compliance_result,
            integrity=integrity_result,
        ))
    return results

