"""
FairBid Ground-Truth ML Benchmark Dataset Generator — SIH26100
=============================================================
Generates a deterministic synthetic procurement dataset (600 cases)
for training and evaluating decoupled compliance and integrity ML models.

ANTI-LEAKAGE ARCHITECTURE:
1. RAW OBSERVABLE EVIDENCE:
   - Compliance: submitted document presence, OCR confidence, formats,
     turnover ratios, certificate expiry, and raw text discrepancies.
   - Integrity: bidder counts, price spreads, ratios, coefficient of variation,
     shared identity counts, common directors, submission telemetry, and
     historical market concentration.
   - NEITHER contains detector outputs, findings, scores, or risk classes!

2. GROUND TRUTH TARGETS (Computed separately by Task 1 rule engines):
   - score_compliance_benchmark -> compliance_ground_truth_score & class
   - score_integrity_benchmark  -> integrity_ground_truth_score & class

3. BALANCED REPRESENTATION:
   - Exactly 150 cases per risk tier (LOW, MEDIUM, HIGH, CRITICAL) for Compliance.
   - Exactly 150 cases per risk tier (LOW, MEDIUM, HIGH, CRITICAL) for Integrity.
   - Seed = 42 for 100% reproducible generation.
"""
from __future__ import annotations

import random
from typing import Any, Dict, List, Optional
import numpy as np

from app.services.ground_truth.compliance_benchmark import score_compliance_benchmark
from app.services.ground_truth.integrity_benchmark import score_integrity_benchmark
from app.services.integrity.models import (
    FindingStatus,
    IntegrityEvidence,
    IntegrityFinding,
    RiskLevel,
    SignalType,
)

BENCHMARK_RANDOM_SEED = 42
TARGET_DATASET_SIZE = 600

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
    """Create a structured compliance check result dict for Task 1 benchmark engine."""
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
    """Create a structured IntegrityFinding dict for Task 1 benchmark engine."""
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
    Generate a single deterministic procurement case with:
    1. Raw observable compliance evidence (for ML model).
    2. Raw observable integrity metrics (for ML model).
    3. Rule engine inputs -> Ground Truth targets (evaluated separately).
    """
    case_id = f"SYNTH-CASE-{case_index:04d}"
    tender_id = f"TEN-SYNTH-{case_index:04d}"
    category = rng.choice(_CATEGORIES)
    est_value = round(rng.uniform(2_000_000, 50_000_000), -4)
    threshold_turnover = round(est_value * 0.40, 2)  # Standard 40% GFR turnover threshold

    # ────────────────────────────────────────────────────────────
    # 1. COMPLIANCE RAW EVIDENCE GENERATION
    # ────────────────────────────────────────────────────────────
    # Archetype mapping for Compliance:
    # 0, 1, 7: LOW risk (clean)
    # 2, 3, 8: MEDIUM risk (moderate review)
    # 4, 5, 6: HIGH risk (severe review, no hard fail)
    # 9, 10, 11: CRITICAL risk (mandatory hard fail)

    discrepancies: List[Dict[str, Any]] = []

    if archetype_id in (0, 1, 7):
        # Clean statutory & technical compliance (LOW risk)
        has_gst = 1.0
        has_pan = 1.0
        has_oem = 1.0
        has_to = 1.0
        has_bl = 1.0
        has_udyam = 1.0
        has_lc = 1.0
        ocr_conf_mean = round(rng.uniform(0.90, 0.98), 3)
        ocr_conf_min = round(rng.uniform(0.85, 0.92), 3)
        turnover_ratio = round(rng.uniform(2.0, 5.0), 3)
        lc_pct = round(rng.uniform(60.0, 90.0), 1)
        is_expired = 0.0
        pan_valid = 1.0
        gstin_valid = 1.0
        tax_id_match = 1.0
        raw_disc_count = 0.0

        gst_status = "COMPLIANT"
        pan_status = "COMPLIANT"
        oem_status = "COMPLIANT"
        bl_status = "COMPLIANT"
        to_status = "COMPLIANT"
        udyam_status = "COMPLIANT"
        lc_status = "COMPLIANT"
        complete_status = "COMPLIANT"
        turnover_val = f"{round(est_value * turnover_ratio / 10_000_000, 1)} Cr"

    elif archetype_id in (2, 3, 8):
        # Moderate review gaps (MEDIUM risk)
        has_gst = 1.0
        has_pan = 1.0
        has_oem = 1.0
        has_to = 1.0
        has_bl = 1.0
        has_udyam = 1.0
        has_lc = 1.0
        ocr_conf_mean = round(rng.uniform(0.78, 0.86), 3)
        ocr_conf_min = round(rng.uniform(0.65, 0.74), 3)
        turnover_ratio = round(rng.uniform(1.05, 1.40), 3)
        lc_pct = round(rng.uniform(40.0, 55.0), 1)
        is_expired = 0.0
        pan_valid = 1.0
        gstin_valid = 1.0
        tax_id_match = 1.0
        raw_disc_count = 1.0

        gst_status = "COMPLIANT"
        pan_status = "COMPLIANT"
        oem_status = "NEEDS_REVIEW"
        bl_status = "COMPLIANT"
        to_status = "NEEDS_REVIEW"
        udyam_status = "NEEDS_REVIEW"
        lc_status = "NEEDS_REVIEW"
        complete_status = "COMPLIANT"
        discrepancies.append({
            "discrepancy_type": "ADDRESS_MISMATCH",
            "severity": "HIGH",
            "field_name": "Address",
            "expected_value": "Registered Office A",
            "found_value": "Branch Office B",
            "description": "Minor address variation across documents.",
        })
        turnover_val = f"{round(est_value * turnover_ratio / 10_000_000, 1)} Cr"

    elif archetype_id in (4, 5, 6):
        # High deficiencies without hard fail (HIGH risk)
        has_gst = 1.0
        has_pan = 1.0
        has_oem = 1.0
        has_to = 1.0
        has_bl = 1.0
        has_udyam = 0.0  # Optional document missing
        has_lc = 0.0     # Optional document missing
        ocr_conf_mean = round(rng.uniform(0.68, 0.75), 3)
        ocr_conf_min = round(rng.uniform(0.50, 0.62), 3)
        turnover_ratio = round(rng.uniform(1.01, 1.10), 3)
        lc_pct = 0.0
        is_expired = 0.0
        pan_valid = 1.0
        gstin_valid = 1.0
        tax_id_match = 0.0  # Tax ID discrepancy across invoices
        raw_disc_count = 2.0

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
        turnover_val = f"{round(est_value * turnover_ratio / 10_000_000, 1)} Cr"

    else:
        # Mandatory statutory hard fail (CRITICAL risk)
        fails = rng.sample(["GST", "PAN", "OEM", "BL", "TURNOVER"], k=rng.randint(1, 3))
        has_gst = 0.0 if "GST" in fails else 1.0
        has_pan = 0.0 if "PAN" in fails else 1.0
        has_oem = 0.0 if "OEM" in fails else 1.0
        has_to = 0.0 if "TURNOVER" in fails else 1.0
        has_bl = 0.0 if "BL" in fails else 1.0
        has_udyam = 0.0
        has_lc = 0.0
        ocr_conf_mean = round(rng.uniform(0.40, 0.65), 3)
        ocr_conf_min = round(rng.uniform(0.20, 0.45), 3)
        turnover_ratio = 0.0 if has_to == 0.0 else round(rng.uniform(0.3, 0.8), 3)
        lc_pct = 0.0
        is_expired = 1.0 if rng.random() < 0.4 else 0.0
        pan_valid = 0.0 if has_pan == 0.0 else 1.0
        gstin_valid = 0.0 if has_gst == 0.0 else 1.0
        tax_id_match = 0.0
        raw_disc_count = float(rng.randint(1, 3))

        gst_status = "NON_COMPLIANT" if has_gst == 0.0 else "COMPLIANT"
        pan_status = "NON_COMPLIANT" if has_pan == 0.0 else "COMPLIANT"
        oem_status = "NON_COMPLIANT" if has_oem == 0.0 else "COMPLIANT"
        bl_status = "NON_COMPLIANT" if has_bl == 0.0 else "COMPLIANT"
        to_status = "NON_COMPLIANT" if (has_to == 0.0 or turnover_ratio < 1.0) else "COMPLIANT"
        udyam_status = "PENDING"
        lc_status = "PENDING"
        complete_status = "PENDING"
        turnover_val = None if to_status == "NON_COMPLIANT" else "1.2 Cr"

    # Precompute raw observable compliance features (no rule/detector outputs)
    mandatory_submitted = has_gst + has_pan + has_oem + has_to + has_bl
    missing_mandatory = 5.0 - mandatory_submitted
    total_submitted = mandatory_submitted + has_udyam + has_lc

    raw_compliance_features = {
        "has_gst_document": has_gst,
        "has_pan_document": has_pan,
        "has_oem_document": has_oem,
        "has_turnover_document": has_to,
        "has_blacklisting_document": has_bl,
        "has_udyam_document": has_udyam,
        "has_local_content_document": has_lc,
        "submitted_documents_count": total_submitted,
        "missing_mandatory_documents_count": missing_mandatory,
        "raw_ocr_confidence_mean": ocr_conf_mean,
        "raw_ocr_confidence_min": ocr_conf_min,
        "turnover_to_threshold_ratio": turnover_ratio,
        "local_content_declared_pct": lc_pct,
        "is_certificate_expired": is_expired,
        "pan_format_valid": pan_valid,
        "gstin_format_valid": gstin_valid,
        "cross_document_tax_id_match": tax_id_match,
        "raw_text_discrepancy_count": raw_disc_count,
    }

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
    # 2. INTEGRITY RAW EVIDENCE GENERATION
    # ────────────────────────────────────────────────────────────
    # Archetype mapping for Integrity:
    # 0, 2, 4: LOW risk (< 25 pts)
    # 1, 3, 9: MEDIUM risk (25 <= score < 50 pts)
    # 6, 7, 10: HIGH risk (50 <= score < 75 pts)
    # 5, 8, 11: CRITICAL risk (>= 75 pts)

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

    if archetype_id in (0, 2, 4):
        # LOW Integrity Risk (< 25.0 pts)
        shared_pan_pairs = 0.0
        shared_address_pairs = 0.0
        common_director_pairs = 0.0
        sub_spread_mins = round(rng.uniform(120.0, 360.0), 1)
        sub_clusters = 0.0
        max_co_part = float(rng.randint(0, 2))
        win_rate = round(rng.uniform(0.15, 0.30), 3)
        hhi = round(rng.uniform(0.18, 0.28), 3)
        unique_winners = float(rng.randint(4, 6))
        rot_freq = round(rng.uniform(0.0, 0.10), 3)
        sole_bid = 0.0

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
        variant = rng.choice(["ROTATION", "PRICE_CLUSTER", "IDENTITY_DOC"])
        if variant == "ROTATION":
            shared_pan_pairs = 0.0
            shared_address_pairs = 0.0
            common_director_pairs = 0.0
            sub_spread_mins = round(rng.uniform(60.0, 180.0), 1)
            sub_clusters = 0.0
            max_co_part = float(rng.randint(4, 6))
            win_rate = round(rng.uniform(0.40, 0.55), 3)
            hhi = round(rng.uniform(0.35, 0.48), 3)
            unique_winners = 2.0
            rot_freq = round(rng.uniform(0.65, 0.85), 3)
            sole_bid = 0.0

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
            shared_pan_pairs = 0.0
            shared_address_pairs = 0.0
            common_director_pairs = 0.0
            sub_spread_mins = round(rng.uniform(15.0, 45.0), 1)
            sub_clusters = 2.0
            max_co_part = float(rng.randint(2, 4))
            win_rate = round(rng.uniform(0.25, 0.35), 3)
            hhi = round(rng.uniform(0.25, 0.35), 3)
            unique_winners = 3.0
            rot_freq = round(rng.uniform(0.1, 0.3), 3)
            sole_bid = 0.0

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
            shared_pan_pairs = 0.0
            shared_address_pairs = 1.0  # Document identity inconsistency
            common_director_pairs = 0.0
            sub_spread_mins = round(rng.uniform(40.0, 120.0), 1)
            sub_clusters = 0.0
            max_co_part = 1.0
            win_rate = round(rng.uniform(0.20, 0.30), 3)
            hhi = round(rng.uniform(0.22, 0.30), 3)
            unique_winners = 4.0
            rot_freq = 0.0
            sole_bid = 0.0

            findings.append(_make_integrity_finding(
                f"F-DOC-{case_index}", tender_id,
                SignalType.DOCUMENT_IDENTITY_INCONSISTENCY, RiskLevel.HIGH, 30.0,
                "Document Identity Inconsistency", "Mismatched identifier across documents.",
                bidder_id="BID-001",
            ))

    elif archetype_id in (6, 7, 10):
        # HIGH Integrity Risk (50.0 <= score < 75.0 pts)
        shared_pan_pairs = 0.0
        shared_address_pairs = 1.0
        common_director_pairs = 1.0
        sub_spread_mins = round(rng.uniform(8.0, 30.0), 1)
        sub_clusters = 2.0
        max_co_part = float(rng.randint(6, 9))
        win_rate = round(rng.uniform(0.60, 0.75), 3)
        hhi = round(rng.uniform(0.50, 0.65), 3)
        unique_winners = 2.0
        rot_freq = round(rng.uniform(0.35, 0.55), 3)
        sole_bid = 0.0

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

    else:
        # CRITICAL Integrity Risk (score >= 75.0 pts) (archetypes 5, 8, 11)
        bids[1] = round(bids[0] * (1.0 + rng.uniform(0.0001, 0.0008)), 2)
        shared_pan_pairs = 1.0
        shared_address_pairs = 1.0
        common_director_pairs = 1.0
        sub_spread_mins = round(rng.uniform(1.0, 4.0), 1)
        sub_clusters = 3.0
        max_co_part = float(rng.randint(9, 14))
        win_rate = round(rng.uniform(0.75, 0.90), 3)
        hhi = round(rng.uniform(0.68, 0.85), 3)
        unique_winners = 1.0
        rot_freq = round(rng.uniform(0.85, 0.98), 3)
        sole_bid = 1.0

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

    # Precompute raw observable integrity metrics (no detector/finding outputs)
    bids.sort()
    l1 = bids[0]
    l2 = bids[1] if len(bids) > 1 else l1
    spread_pct = round(((l2 - l1) / l1) * 100.0, 3) if l1 > 0 else 0.0
    bids_mean = float(np.mean(bids))
    bids_cv = round(float(np.std(bids) / bids_mean), 4) if bids_mean > 0 else 0.0

    raw_integrity_features = {
        "bidder_count": float(num_bidders),
        "valid_quotes_count": float(len(bids)),
        "bid_price_spread_pct": spread_pct,
        "bid_price_cv": bids_cv,
        "bid_to_estimate_min_ratio": round(l1 / est_value, 4) if est_value > 0 else 1.0,
        "bid_to_estimate_mean_ratio": round(bids_mean / est_value, 4) if est_value > 0 else 1.0,
        "near_estimate_count": float(sum(1 for b in bids if abs(b - est_value) / est_value < 0.005)),
        "shared_pan_pair_count": shared_pan_pairs,
        "shared_address_pair_count": shared_address_pairs,
        "common_director_pair_count": common_director_pairs,
        "submission_time_spread_minutes": sub_spread_mins,
        "submission_cluster_count": sub_clusters,
        "historical_co_participation_max": max_co_part,
        "winner_historical_win_rate": win_rate,
        "winner_concentration_hhi": hhi,
        "unique_historical_winners_count": unique_winners,
        "historical_rotation_frequency": rot_freq,
        "unjustified_sole_bid_flag": sole_bid,
    }

    # ────────────────────────────────────────────────────────────
    # 3. CALCULATE SEPARATE GROUND TRUTH TARGETS (Task 1 Engines)
    # ────────────────────────────────────────────────────────────
    comp_res = score_compliance_benchmark(compliance_checks, discrepancies)
    integ_objs = [IntegrityFinding(**f) for f in findings]
    integ_res = score_integrity_benchmark(integ_objs)

    return {
        "case_id": case_id,
        "tender_id": tender_id,
        "archetype_id": archetype_id,
        "estimated_value": est_value,
        "category": category,
        "raw_compliance_features": raw_compliance_features,
        "raw_integrity_features": raw_integrity_features,
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
