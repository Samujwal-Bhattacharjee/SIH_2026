"""
FairBid Ground-Truth ML Benchmark Dataset Generator — SIH26100
=============================================================
Generates a deterministic synthetic procurement dataset (600 cases)
for training and evaluating decoupled compliance and integrity ML models.

Guarantees:
- Fixed random seed = 42 for 100% reproducible generation.
- Ground truth targets are derived exclusively from Task 1 benchmark scorers:
    score_compliance_benchmark -> compliance_ground_truth_score & class
    score_integrity_benchmark  -> integrity_ground_truth_score & class
- No filenames, PDF names, or embedded PDF scores used as features or labels.
- Balanced scenario distribution across all four risk tiers:
    LOW, MEDIUM, HIGH, CRITICAL.
- Generates realistic variation without row duplication.
"""
from __future__ import annotations

import copy
import random
from typing import Any, Dict, List, Optional, Tuple

from app.services.ground_truth.compliance_benchmark import score_compliance_benchmark
from app.services.ground_truth.integrity_benchmark import score_integrity_benchmark
from app.services.integrity.models import (
    FindingStatus,
    IntegrityEvidence,
    IntegrityFinding,
    RiskLevel,
    RuleReference,
    SignalType,
)

BENCHMARK_RANDOM_SEED = 42
TARGET_DATASET_SIZE = 600

# Base fictional entity pool for generating realistic cohorts
_VENDOR_POOL = [
    {"name": "Brahmaputra Engineering & Infotech Pvt. Ltd.", "gstin_prefix": "18AABCB", "pan": "AABCB1001B", "directors": ["Prabhat Baruah", "Sunita Sarma"]},
    {"name": "Kaveri Digital Solutions Ltd.", "gstin_prefix": "29AABCK", "pan": "AABCK2002K", "directors": ["Vikramaditya Rao", "Meera Hegde"]},
    {"name": "Godavari Network Systems Pvt. Ltd.", "gstin_prefix": "36AABCG", "pan": "AABCG3003G", "directors": ["Chandra Sekhar Reddy", "Padma Rao"]},
    {"name": "Yamuna Smart Technologies LLP", "gstin_prefix": "07AABCY", "pan": "AABCY4004Y", "directors": ["Anand Swaminathan", "Neha Mathur"]},
    {"name": "Vindhyachal Power & Infra Ltd.", "gstin_prefix": "23AABCV", "pan": "AABCV5005V", "directors": ["Rajendra Verma", "Kavita Tiwari"]},
    {"name": "Tapti Solutions & Analytics Pvt. Ltd.", "gstin_prefix": "24AABCT", "pan": "AABCT6006T", "directors": ["Harish Patel", "Bhavna Shah"]},
    {"name": "Shivalik Cloud Matrix Pvt. Ltd.", "gstin_prefix": "05AABCS", "pan": "AABCS7007S", "directors": ["Rohan Joshi", "Alok Bhatt"]},
    {"name": "Shivalik Enterprise Systems LLP", "gstin_prefix": "05AABCS", "pan": "AABCS7007S", "directors": ["Rohan Joshi", "Devika Nanda"]},
    {"name": "Narmada Cyber Defense Technologies Ltd.", "gstin_prefix": "23AABCN", "pan": "AABCN8008N", "directors": ["Suresh Nair", "Pooja Deshmukh"]},
    {"name": "Mahanadi Data Infrastructure Pvt. Ltd.", "gstin_prefix": "21AABCM", "pan": "AABCM9009M", "directors": ["Debasish Jena", "Rashmi Mohanty"]},
    {"name": "Chenab Telecom & Power Solutions Ltd.", "gstin_prefix": "01AABCC", "pan": "AABCC1010C", "directors": ["Tariq Lone", "Simran Kour"]},
    {"name": "Nilgiri Hardware & Telecom Pvt. Ltd.", "gstin_prefix": "33AABCN", "pan": "AABCN1010N", "directors": ["S. Kalyanasundaram", "K. Vasanthi"]},
]

_CATEGORIES = [
    "INFORMATION_TECHNOLOGY",
    "MEDICAL_EQUIPMENT",
    "OFFICE_SUPPLIES",
    "ELECTRICAL_WORKS",
    "CIVIL_CONSTRUCTION",
    "SECURITY_SERVICES",
]


def _make_compliance_check(
    req_id: str,
    name: str,
    category: str,
    is_mandatory: bool,
    status: str,
    weight: float,
    reason: str,
    evidence_value: Optional[str] = None,
    confidence: float = 0.90,
) -> Dict[str, Any]:
    """Create a structured compliance check result dict."""
    status_score_map = {
        "COMPLIANT": 100,
        "NOT_APPLICABLE": 100,
        "NEEDS_REVIEW": 60,
        "PENDING": 20,
        "UNVERIFIED": 0,
        "NON_COMPLIANT": 0,
        "EXPIRED": 10,
    }
    return {
        "requirement_id": req_id,
        "requirement_name": name,
        "category": category,
        "is_mandatory": is_mandatory,
        "status": status,
        "weight": weight,
        "score": status_score_map.get(status, 20),
        "reason": reason,
        "evidence_value": evidence_value,
        "evidence_available": evidence_value is not None,
        "confidence": confidence if status == "COMPLIANT" else (0.0 if evidence_value is None else 0.65),
    }


def _make_integrity_finding(
    finding_id: str,
    tender_id: str,
    signal_type: SignalType,
    severity: RiskLevel,
    score_impact: float,
    title: str,
    reason: str,
    bidder_id: Optional[str] = None,
    related_ids: Optional[List[str]] = None,
    evidence_count: int = 1,
) -> Dict[str, Any]:
    """Create a structured IntegrityFinding dict."""
    return IntegrityFinding(
        id=finding_id,
        tender_id=tender_id,
        bidder_id=bidder_id,
        related_bidder_ids=related_ids or [],
        signal_type=signal_type,
        severity=severity,
        score_impact=score_impact,
        confidence=0.88,
        title=title,
        reason=reason,
        evidence=[
            IntegrityEvidence(
                source_type="BID_SUBMISSION",
                source_id=bidder_id or tender_id,
                field="telemetry",
                value="synthetic_evidence",
                description=f"Evidence {i+1} for {signal_type.value}",
            )
            for i in range(max(1, evidence_count))
        ],
        rule_reference=None,
        recommended_action="Administrative review required.",
        status=FindingStatus.OPEN,
    ).model_dump()


def generate_synthetic_case(
    case_index: int,
    archetype_id: int,
    rng: random.Random,
) -> Dict[str, Any]:
    """
    Generate a single deterministic procurement case with structured evidence.
    Archetypes:
      0, 1, 7: Clean compliance (Low risk)
      2, 3, 8: Moderate gaps (Medium risk, ~72-78 pts)
      4, 5, 6: High deficiencies without hard fail (High risk, ~48-56 pts)
      9, 10, 11: Mandatory statutory failure (Critical risk, hard fail cap <= 40 pts)
    """
    case_id = f"SYNTH-CASE-{case_index:04d}"
    tender_id = f"TEN-SYNTH-{case_index:04d}"
    category = rng.choice(_CATEGORIES)
    est_value = round(rng.uniform(2_000_000, 50_000_000), -4)

    # ────────────────────────────────────────────────────────────
    # 1. COMPLIANCE EVIDENCE GENERATION
    # ────────────────────────────────────────────────────────────
    discrepancies: List[Dict[str, Any]] = []

    if archetype_id in (0, 1, 7):
        # LOW Compliance Risk (score >= 80.0, no hard fail)
        gst_status = "COMPLIANT"
        pan_status = "COMPLIANT"
        oem_status = "COMPLIANT"
        bl_status = "COMPLIANT"
        to_status = "COMPLIANT"
        udyam_status = "COMPLIANT"
        lc_status = "COMPLIANT"
        complete_status = "COMPLIANT"
        turnover_val = f"{round(est_value * rng.uniform(2.0, 5.0) / 10_000_000, 1)} Cr"

    elif archetype_id in (2, 3, 8):
        # MEDIUM Compliance Risk (60.0 <= score < 80.0, no hard fail)
        # Moderate review gaps on mandatory items + non-mandatory gaps + discrepancy
        gst_status = "COMPLIANT"
        pan_status = "COMPLIANT"
        oem_status = "NEEDS_REVIEW"
        bl_status = "COMPLIANT"
        to_status = "NEEDS_REVIEW"
        udyam_status = "NEEDS_REVIEW"
        lc_status = "NEEDS_REVIEW"
        complete_status = "NEEDS_REVIEW" if rng.random() < 0.5 else "COMPLIANT"
        discrepancies.append({
            "discrepancy_type": "ADDRESS_MISMATCH",
            "severity": "HIGH",
            "field_name": "Address",
            "expected_value": "Registered Office A",
            "found_value": "Branch Office B",
            "description": "Minor address variation across documents.",
        })
        turnover_val = f"{round(est_value * rng.uniform(1.0, 1.4) / 10_000_000, 1)} Cr"

    elif archetype_id in (4, 5, 6):
        # HIGH Compliance Risk (40.0 <= score < 60.0, no hard fail)
        # Multiple items under review, non-mandatory non-compliant, critical discrepancy
        gst_status = "NEEDS_REVIEW"
        pan_status = "COMPLIANT"
        oem_status = "NEEDS_REVIEW"
        bl_status = "COMPLIANT"
        to_status = "NEEDS_REVIEW"
        udyam_status = "NON_COMPLIANT"
        lc_status = "NON_COMPLIANT"
        complete_status = "NON_COMPLIANT"
        discrepancies.append({
            "discrepancy_type": "GSTIN_MISMATCH",
            "severity": "CRITICAL",
            "field_name": "GSTIN",
            "expected_value": "27AAAAA0001A1Z5",
            "found_value": "29BBBBB9999B1Z6",
            "description": "Critical discrepancy: GSTIN mismatch across invoices and registration.",
        })
        turnover_val = f"{round(est_value * 1.1 / 10_000_000, 1)} Cr"

    else:
        # CRITICAL Compliance Risk (mandatory hard fail: GST / PAN / OEM / BL / Turnover)
        # Disqualification risk under GFR 2017 Rule 144
        fails = rng.sample(["GST", "PAN", "OEM", "BL", "TURNOVER"], k=rng.randint(1, 3))
        gst_status = "NON_COMPLIANT" if "GST" in fails else "COMPLIANT"
        pan_status = "NON_COMPLIANT" if "PAN" in fails else "COMPLIANT"
        oem_status = "NON_COMPLIANT" if "OEM" in fails else "COMPLIANT"
        bl_status = "NON_COMPLIANT" if "BL" in fails else "COMPLIANT"
        to_status = "NON_COMPLIANT" if "TURNOVER" in fails else "COMPLIANT"
        udyam_status = "PENDING"
        lc_status = "PENDING"
        complete_status = "PENDING"
        turnover_val = None if to_status == "NON_COMPLIANT" else "1.2 Cr"

    compliance_checks = [
        _make_compliance_check("GST_REQUIRED", "Valid GST Registration", "STATUTORY", True,
                               gst_status, 4.0, f"GST status: {gst_status}",
                               evidence_value="GSTIN-EXTRACTED" if gst_status in ("COMPLIANT", "NEEDS_REVIEW") else None),
        _make_compliance_check("PAN_REQUIRED", "PAN Card", "STATUTORY", True,
                               pan_status, 3.0, f"PAN status: {pan_status}",
                               evidence_value="PAN-EXTRACTED" if pan_status in ("COMPLIANT", "NEEDS_REVIEW") else None),
        _make_compliance_check("NON_BLACKLISTING", "Non-Blacklisting Declaration", "MANDATORY", True,
                               bl_status, 4.0, f"Declaration status: {bl_status}",
                               evidence_value="DECLARATION-VERIFIED" if bl_status == "COMPLIANT" else None),
        _make_compliance_check("OEM_AUTHORIZATION", "OEM Authorization", "TECHNICAL", True,
                               oem_status, 4.0, f"OEM status: {oem_status}",
                               evidence_value="OEM-AUTH-REF" if oem_status in ("COMPLIANT", "NEEDS_REVIEW") else None),
        _make_compliance_check("TURNOVER_THRESHOLD", "Annual Turnover", "FINANCIAL", True,
                               to_status, 3.0, f"Turnover status: {to_status}",
                               evidence_value=turnover_val),
        _make_compliance_check("UDYAM_REQUIRED", "Udyam Registration", "ELIGIBILITY", False,
                               udyam_status, 2.0, f"Udyam status: {udyam_status}",
                               evidence_value="UDYAM-VERIFIED" if udyam_status in ("COMPLIANT", "NEEDS_REVIEW") else None),
        _make_compliance_check("LOCAL_CONTENT", "Local Content Declaration", "MANDATORY", False,
                               lc_status, 2.0, f"Local content status: {lc_status}",
                               evidence_value="60%" if lc_status in ("COMPLIANT", "NEEDS_REVIEW") else None),
        _make_compliance_check("APPLICATION_COMPLETENESS_EVALUATION", "Application Completeness", "MANDATORY", False,
                               complete_status, 1.0, f"Completeness: {complete_status}",
                               evidence_value="CHECKLIST-PASS" if complete_status == "COMPLIANT" else None),
    ]

    # ────────────────────────────────────────────────────────────
    # 2. INTEGRITY COHORT & FINDINGS GENERATION
    # ────────────────────────────────────────────────────────────
    num_bidders = rng.randint(3, 7)
    base_l1 = est_value * rng.uniform(0.88, 1.05)
    bids: List[float] = []

    for i in range(num_bidders):
        if i == 0:
            bids.append(round(base_l1, 2))
        else:
            spread = rng.uniform(0.02, 0.15)
            bids.append(round(base_l1 * (1.0 + spread * i), 2))

    findings: List[Dict[str, Any]] = []

    # Map archetype to integrity risk tiers
    if archetype_id in (0, 2, 4):
        # LOW Integrity Risk (< 25.0 pts)
        # 0 findings or single minor signal (repeated winner = 10 pts, repeated participation = 10 pts)
        if rng.random() < 0.45:
            sig = rng.choice([SignalType.REPEATED_WINNER_PATTERN, SignalType.REPEATED_PARTICIPATION_PATTERN])
            findings.append(_make_integrity_finding(
                f"F-LOW-{case_index}", tender_id,
                sig, RiskLevel.MEDIUM, 10.0,
                f"Minor signal {sig.value}", "Telemetry observation within normal bounds.",
                bidder_id="BID-001",
            ))

    elif archetype_id in (1, 3, 9):
        # MEDIUM Integrity Risk (25.0 <= score < 50.0 pts)
        # e.g. Rotation + losing bid (31.6 pts), or Price anomaly + narrow competition (36.8 pts)
        variant = rng.choice(["ROTATION", "PRICE_CLUSTER", "IDENTITY_DOC"])
        if variant == "ROTATION":
            findings.append(_make_integrity_finding(
                f"F-ROT-{case_index}", tender_id,
                SignalType.BID_ROTATION_PATTERN, RiskLevel.HIGH, 15.0,
                "Bid Rotation Pattern", "Alternating win pattern across category tenders.",
                bidder_id="BID-001", related_ids=["BID-002"],
            ))
            findings.append(_make_integrity_finding(
                f"F-LOSE-{case_index}", tender_id,
                SignalType.LOSING_BID_PATTERN, RiskLevel.MEDIUM, 15.0,
                "Cover Bid Pattern", "Consistently non-competitive quotes.",
                bidder_id="BID-002", related_ids=["BID-001"],
            ))
        elif variant == "PRICE_CLUSTER":
            bids[1] = round(bids[0] * (1.0 + rng.uniform(0.0005, 0.002)), 2)
            findings.append(_make_integrity_finding(
                f"F-PRC-{case_index}", tender_id,
                SignalType.BID_PRICE_ANOMALY, RiskLevel.MEDIUM, 20.0,
                "Close Bid Price Cluster", "Quotes within 0.2% of each other.",
                bidder_id="BID-001", related_ids=["BID-002"],
            ))
            findings.append(_make_integrity_finding(
                f"F-NAR-{case_index}", tender_id,
                SignalType.NARROW_COMPETITION, RiskLevel.MEDIUM, 15.0,
                "Narrow Competition", "Fewer than 3 effective bids.",
                bidder_id="BID-001",
            ))
        else:
            findings.append(_make_integrity_finding(
                f"F-DOC-{case_index}", tender_id,
                SignalType.DOCUMENT_IDENTITY_INCONSISTENCY, RiskLevel.HIGH, 30.0,
                "Document Identity Inconsistency", "Mismatched identifier across documents.",
                bidder_id="BID-001",
            ))

    elif archetype_id in (6, 7, 10):
        # HIGH Integrity Risk (50.0 <= score < 75.0 pts)
        # e.g. Related bidder + common director (57.7 pts)
        findings.append(_make_integrity_finding(
            f"F-REL-{case_index}", tender_id,
            SignalType.RELATED_BIDDER, RiskLevel.HIGH, 30.0,
            "Related Bidder — Shared Identifier", "Bidders share PAN and corporate address.",
            bidder_id="BID-001", related_ids=["BID-002"],
        ))
        findings.append(_make_integrity_finding(
            f"F-DIR-{case_index}", tender_id,
            SignalType.COMMON_DIRECTOR_LINK, RiskLevel.HIGH, 25.0,
            "Common Director Link", "Shared board members.",
            bidder_id="BID-001", related_ids=["BID-002"],
        ))
        if rng.random() < 0.3:
            findings.append(_make_integrity_finding(
                f"F-WIN-{case_index}", tender_id,
                SignalType.REPEATED_WINNER_PATTERN, RiskLevel.MEDIUM, 10.0,
                "High Winner Concentration", "Vendor wins 80% of tenders.",
                bidder_id="BID-001",
            ))

    else:
        # CRITICAL Integrity Risk (score >= 75.0 pts) (archetypes 5, 8, 11)
        # Multi-signal cross-family collusion
        bids[1] = round(bids[0] * (1.0 + rng.uniform(0.0001, 0.001)), 2)
        findings.append(_make_integrity_finding(
            f"F-REL-{case_index}", tender_id,
            SignalType.RELATED_BIDDER, RiskLevel.HIGH, 30.0,
            "Related Bidder — Shared PAN", "Entities share PAN and registered address.",
            bidder_id="BID-001", related_ids=["BID-002"],
        ))
        findings.append(_make_integrity_finding(
            f"F-PRC-{case_index}", tender_id,
            SignalType.BID_PRICE_ANOMALY, RiskLevel.MEDIUM, 20.0,
            "Price Clustering", "Quotes differ by less than 0.1%.",
            bidder_id="BID-001", related_ids=["BID-002"],
        ))
        findings.append(_make_integrity_finding(
            f"F-ROT-{case_index}", tender_id,
            SignalType.BID_ROTATION_PATTERN, RiskLevel.HIGH, 15.0,
            "Rotation Cycle", "Systematic rotating winners.",
            bidder_id="BID-001", related_ids=["BID-002"],
        ))
        findings.append(_make_integrity_finding(
            f"F-GAP-{case_index}", tender_id,
            SignalType.DECISION_TRACEABILITY_GAP, RiskLevel.MEDIUM, 20.0,
            "Decision Traceability Gap", "Non-evaluation without administrative rationale.",
            bidder_id="BID-003",
        ))

    # ────────────────────────────────────────────────────────────
    # 3. CALCULATE GROUND TRUTH BENCHMARK TARGETS
    # ────────────────────────────────────────────────────────────
    comp_res = score_compliance_benchmark(compliance_checks, discrepancies)
    integ_objs = [IntegrityFinding(**f) for f in findings]
    integ_res = score_integrity_benchmark(integ_objs)

    bids.sort()
    l1 = bids[0]
    l2 = bids[1] if len(bids) > 1 else l1
    spread_pct = round(((l2 - l1) / l1) * 100.0, 3) if l1 > 0 else 0.0

    cohort_metrics = {
        "bidder_count": num_bidders,
        "valid_quotes_count": len(bids),
        "min_quote": l1,
        "max_quote": bids[-1],
        "mean_quote": round(sum(bids) / len(bids), 2),
        "bid_price_spread_pct": spread_pct,
        "bid_to_estimate_min_ratio": round(l1 / est_value, 4) if est_value > 0 else 1.0,
        "bid_to_estimate_mean_ratio": round((sum(bids) / len(bids)) / est_value, 4) if est_value > 0 else 1.0,
        "near_estimate_count": sum(1 for b in bids if abs(b - est_value) / est_value < 0.005),
        "has_price_anomaly_finding": int(any(f["signal_type"] == "BID_PRICE_ANOMALY" for f in findings)),
        "has_rotation_finding": int(any(f["signal_type"] == "BID_ROTATION_PATTERN" for f in findings)),
        "has_related_bidder_finding": int(any(f["signal_type"] == "RELATED_BIDDER" for f in findings)),
        "has_common_director_finding": int(any(f["signal_type"] == "COMMON_DIRECTOR_LINK" for f in findings)),
        "has_traceability_gap_finding": int(any(f["signal_type"] == "DECISION_TRACEABILITY_GAP" for f in findings)),
        "has_repeated_winner_finding": int(any(f["signal_type"] == "REPEATED_WINNER_PATTERN" for f in findings)),
        "has_losing_bid_finding": int(any(f["signal_type"] == "LOSING_BID_PATTERN" for f in findings)),
        "has_identity_doc_finding": int(any(f["signal_type"] == "DOCUMENT_IDENTITY_INCONSISTENCY" for f in findings)),
        "has_narrow_competition_finding": int(any(f["signal_type"] == "NARROW_COMPETITION" for f in findings)),
        "findings_count": len(findings),
    }

    return {
        "case_id": case_id,
        "tender_id": tender_id,
        "archetype_id": archetype_id,
        "estimated_value": est_value,
        "category": category,
        "compliance_check_results": compliance_checks,
        "compliance_discrepancies": discrepancies,
        "integrity_findings": findings,
        "cohort_metrics": cohort_metrics,
        "ground_truth": {
            "compliance_score": comp_res.score,
            "compliance_raw_score": comp_res.raw_score,
            "compliance_class": comp_res.risk_class,
            "compliance_score_capped": comp_res.score_capped,
            "compliance_hard_fails_count": len(comp_res.mandatory_hard_fails),
            "integrity_score": integ_res.score,
            "integrity_raw_score": integ_res.raw_score,
            "integrity_class": integ_res.risk_class,
            "integrity_findings_count": integ_res.findings_count,
        },
    }


def generate_benchmark_dataset(
    n_samples: int = TARGET_DATASET_SIZE,
    seed: int = BENCHMARK_RANDOM_SEED,
) -> List[Dict[str, Any]]:
    """
    Generate the complete deterministic benchmark dataset.
    Evenly distributes samples across the 12 balanced scenario archetypes.
    """
    rng = random.Random(seed)
    cases: List[Dict[str, Any]] = []

    for i in range(1, n_samples + 1):
        arch_id = (i - 1) % 12
        case = generate_synthetic_case(i, arch_id, rng)
        cases.append(case)

    return cases
