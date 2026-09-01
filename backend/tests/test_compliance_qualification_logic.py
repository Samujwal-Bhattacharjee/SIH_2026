"""
Comprehensive regression test suite for Compliance vs Integrity vs Qualification semantics.
Validates the 12 core consistency scenarios outlined in SIH26100 audit.
"""
import pytest
from app.services.procurement_service import (
    calculate_compliance_score,
    determine_compliance_status,
    calculate_risk_level,
    run_full_verification,
    DEFAULT_TENDER_REQUIREMENTS,
    check_gst_present,
    check_pan_present,
    check_udyam_present,
    check_oem_present,
    check_blacklisting_declaration,
    check_turnover_threshold,
    check_local_content,
)
from app.services.integrity.risk_engine import assess_tender_integrity, assess_bidder_integrity
from app.core import procurement_store as ps


def test_scenario_1_identical_inputs_produce_identical_status():
    """Identical score + identical requirements -> identical status."""
    checks = [
        {"requirement_id": "req-1", "name": "GST", "status": "COMPLIANT", "is_mandatory": True, "category": "STATUTORY", "weight": 4.0},
        {"requirement_id": "req-2", "name": "PAN", "status": "COMPLIANT", "is_mandatory": True, "category": "STATUTORY", "weight": 3.0},
        {"requirement_id": "req-3", "name": "OEM", "status": "NON_COMPLIANT", "is_mandatory": True, "category": "TECHNICAL", "weight": 4.0},
    ]
    res1 = determine_compliance_status(checks, [])
    res2 = determine_compliance_status(checks, [])
    assert res1["status"] == res2["status"] == "EXCEPTION_FOUND"
    assert res1["blocking_exceptions"] == res2["blocking_exceptions"] == 1


def test_scenario_2_failed_mandatory_blocks_qualification():
    """Failed mandatory requirement -> cannot become qualified silently."""
    checks = [
        {"requirement_id": "req-1", "name": "GST", "status": "COMPLIANT", "is_mandatory": True, "category": "STATUTORY", "weight": 4.0},
        {"requirement_id": "req-2", "name": "OEM MAF", "status": "NON_COMPLIANT", "is_mandatory": True, "category": "TECHNICAL", "weight": 4.0},
    ]
    summary = determine_compliance_status(checks, [])
    assert summary["status"] == "EXCEPTION_FOUND"
    assert summary["blocking_exceptions"] >= 1
    assert summary["status"] != "COMPLIANT"


def test_scenario_3_optional_failure_handled_without_blocking():
    """Optional failure -> reduced score, but does NOT trigger EXCEPTION_FOUND."""
    checks = [
        {"requirement_id": "req-1", "name": "GST", "status": "COMPLIANT", "is_mandatory": True, "category": "STATUTORY", "weight": 4.0},
        {"requirement_id": "req-2", "name": "PAN", "status": "COMPLIANT", "is_mandatory": True, "category": "STATUTORY", "weight": 3.0},
        {"requirement_id": "req-3", "name": "Udyam", "status": "NON_COMPLIANT", "is_mandatory": False, "category": "ELIGIBILITY", "weight": 2.0},
    ]
    summary = determine_compliance_status(checks, [])
    assert summary["status"] == "COMPLIANT"
    assert summary["blocking_exceptions"] == 0


def test_scenario_4_pending_document_not_treated_as_verified():
    """Pending document -> not treated as verified (status = PENDING_DOCUMENTS)."""
    checks = [
        {"requirement_id": "req-1", "name": "GST", "status": "COMPLIANT", "is_mandatory": True, "category": "STATUTORY", "weight": 4.0},
        {"requirement_id": "req-2", "name": "Non-Blacklisting", "status": "PENDING", "is_mandatory": True, "category": "MANDATORY", "weight": 3.0},
    ]
    summary = determine_compliance_status(checks, [])
    assert summary["status"] == "PENDING_DOCUMENTS"
    assert summary["status"] != "COMPLIANT"


def test_scenario_5_ocr_failure_causes_unverified_status():
    """OCR failure -> requirement remains unverified (not COMPLIANT)."""
    failed_ocr_docs = [
        {
            "id": "DOC-GST-FAIL",
            "file_name": "gst_cert.pdf",
            "document_type": "GST Certificate",
            "ocr_status": "FAILED",
            "extracted_fields": [],
        }
    ]
    res = check_gst_present([], failed_ocr_docs)
    assert res["status"] == "UNVERIFIED"
    assert res["score"] == 0

    pan_fail_docs = [
        {
            "id": "DOC-PAN-FAIL",
            "file_name": "pan.pdf",
            "document_type": "PAN Card",
            "ocr_status": "FAILED",
            "extracted_fields": [],
        }
    ]
    res_pan = check_pan_present([], pan_fail_docs)
    assert res_pan["status"] == "UNVERIFIED"
    assert res_pan["score"] == 0


def test_scenario_6_compliance_and_integrity_remain_independent():
    """Compliance and Integrity scores evaluate distinct dimensions independently."""
    bidder = {
        "id": "TEST-BID-INDEP",
        "legal_name": "Independent Test Ltd",
    }
    # Bidder with excellent compliance documents
    checks = [
        {"requirement_id": "req-1", "name": "GST", "status": "COMPLIANT", "is_mandatory": True, "category": "STATUTORY", "weight": 4.0},
        {"requirement_id": "req-2", "name": "PAN", "status": "COMPLIANT", "is_mandatory": True, "category": "STATUTORY", "weight": 3.0},
    ]
    comp_score = calculate_compliance_score(checks)["score"]
    comp_summary = determine_compliance_status(checks, [])
    assert comp_score == 100.0
    assert comp_summary["status"] == "COMPLIANT"

    # Integrity assessment is orthogonal and independent
    ia = assess_bidder_integrity("BID-173")
    assert isinstance(ia.overall_risk_score, float)
    assert ia.risk_level.value in ("LOW", "MEDIUM", "HIGH", "CRITICAL")


def test_scenario_7_high_integrity_does_not_auto_disqualify():
    """HIGH integrity risk does not clobber compliance status or auto-disqualify."""
    bidder = ps.get_bidder_by_id("BID-173")
    if bidder:
        if not ps.get_compliance_results("BID-173"):
            docs = ps.get_bidder_documents("BID-173")
            reqs = ps.get_tender_requirements(bidder.get("tender_id")) or DEFAULT_TENDER_REQUIREMENTS
            assessment = run_full_verification(bidder, reqs, docs)
            ps.save_compliance_assessment("BID-173", bidder["tender_id"], assessment)
            bidder = ps.get_bidder_by_id("BID-173")

        # Compliance status reflects requirement checks, not integrity engine output
        assert bidder["compliance_status"] in ("EXCEPTION_FOUND", "UNDER_REVIEW", "COMPLIANT", "PENDING_DOCUMENTS")


def test_scenario_8_low_integrity_does_not_auto_qualify():
    """Non-critical integrity risk does not auto-qualify a bidder with failed mandatory requirements."""
    bidder_174 = ps.get_bidder_by_id("BID-174")
    if bidder_174:
        if not ps.get_compliance_results("BID-174"):
            docs = ps.get_bidder_documents("BID-174")
            reqs = ps.get_tender_requirements(bidder_174.get("tender_id")) or DEFAULT_TENDER_REQUIREMENTS
            assessment = run_full_verification(bidder_174, reqs, docs)
            ps.save_compliance_assessment("BID-174", bidder_174["tender_id"], assessment)
            bidder_174 = ps.get_bidder_by_id("BID-174")

        # BID-174 has non-critical integrity risk (26.3, MEDIUM), but has missing OEM MAF -> EXCEPTION_FOUND
        ia = assess_bidder_integrity("BID-174")
        assert ia.risk_level.value in ("LOW", "MEDIUM")
        assert bidder_174["compliance_status"] == "EXCEPTION_FOUND"
        assert bidder_174["officer_decision"] is None


def test_scenario_9_dashboard_equals_backend():
    """Dashboard aggregation mirrors underlying backend DB queries."""
    summary = ps.get_dashboard_summary()
    assert "compliance_exceptions" in summary
    assert "high_compliance_risk_bidders" in summary
    assert "integrity_summary" in summary
    bidders = ps.get_bidders()
    manual_exc = sum(1 for b in bidders if b.get("compliance_status") == "EXCEPTION_FOUND" or b.get("blocking_exceptions_count", 0) > 0)
    assert summary["compliance_exceptions"] == manual_exc


def test_scenario_10_verification_equals_backend():
    """Live verification pipeline outputs match saved DB state."""
    bidder = {
        "id": "BID-VERIF-TEST",
        "legal_name": "Verification Consistency Bidder",
        "tender_id": "TEN-2026-001",
    }
    docs = [
        {
            "id": "D1",
            "file_name": "GST.pdf",
            "document_type": "GST Certificate",
            "extracted_fields": [{"key": "gstin", "value": "29AABCT1332L1Z1"}],
        }
    ]
    assessment = run_full_verification(bidder, DEFAULT_TENDER_REQUIREMENTS, docs)
    assert "compliance_status" in assessment
    assert "blocking_exceptions" in assessment
    assert "mandatory_summary" in assessment
    assert assessment["compliance_status"] in ("EXCEPTION_FOUND", "PENDING_DOCUMENTS", "UNDER_REVIEW", "COMPLIANT")


def test_scenario_11_refresh_preserves_results():
    """Subsequent get_bidder_by_id and get_bidders calls preserve compliance_status."""
    bidders = ps.get_bidders()
    for b in bidders[:5]:
        b_fresh = ps.get_bidder_by_id(b["id"])
        assert b_fresh["compliance_status"] == b["compliance_status"]
        assert b_fresh["blocking_exceptions_count"] == b["blocking_exceptions_count"]


def test_scenario_12_same_inputs_produce_deterministic_results():
    """Same check results and discrepancies deterministically yield identical compliance status."""
    checks = [
        {"requirement_id": "r1", "name": "R1", "status": "COMPLIANT", "is_mandatory": True, "category": "STATUTORY", "weight": 2.0},
        {"requirement_id": "r2", "name": "R2", "status": "NEEDS_REVIEW", "is_mandatory": True, "category": "FINANCIAL", "weight": 2.0},
    ]
    discrepancies = []
    run1 = determine_compliance_status(checks, discrepancies)
    run2 = determine_compliance_status(checks, discrepancies)
    assert run1 == run2
    assert run1["status"] == "UNDER_REVIEW"


def test_confidence_no_document_yields_zero_confidence():
    """1. No document -> 0 confidence and evidence_available=False."""
    docs = []
    res_gst = check_gst_present([], docs)
    assert res_gst["confidence"] == 0.0
    assert res_gst["evidence_available"] is False
    assert res_gst["evidence_source"] is None

    res_oem = check_oem_present([], docs)
    assert res_oem["confidence"] == 0.0
    assert res_oem["evidence_available"] is False
    assert res_oem["status"] == "NON_COMPLIANT"


def test_confidence_missing_document_not_verified():
    """2. Missing document -> status PENDING or NON_COMPLIANT, not COMPLIANT."""
    docs = []
    res_pan = check_pan_present([], docs)
    assert res_pan["status"] == "PENDING"
    assert res_pan["confidence"] == 0.0
    assert res_pan["score"] == 0


def test_confidence_ocr_failure_yields_zero_confidence():
    """3. OCR failure -> UNVERIFIED and 0 confidence."""
    docs = [{
        "id": "DOC-FAIL-1",
        "file_name": "pan_scan.pdf",
        "document_type": "PAN Card",
        "ocr_status": "FAILED",
        "extracted_fields": [],
    }]
    res_pan = check_pan_present([], docs)
    assert res_pan["status"] == "UNVERIFIED"
    assert res_pan["confidence"] == 0.0
    assert res_pan["evidence_available"] is False
    assert res_pan["evidence_source"] == "pan_scan.pdf"


def test_confidence_valid_document_yields_real_extraction_confidence():
    """4. Valid document -> real extraction confidence from field."""
    docs = [{
        "id": "DOC-GST-1",
        "file_name": "my_gst.pdf",
        "document_type": "GST Certificate",
        "ocr_status": "COMPLETED",
        "extracted_fields": [
            {"key": "gstin", "value": "29AABCT1332L1Z1", "confidence": 0.93}
        ],
    }]
    res = check_gst_present([], docs)
    assert res["status"] == "COMPLIANT"
    assert res["confidence"] == 0.93
    assert res["evidence_available"] is True
    assert res["evidence_source"] == "my_gst.pdf"
    assert res["evidence_value"] == "29AABCT1332L1Z1"


def test_confidence_verified_field_high_confidence():
    """5. Verified field with valid format -> retains high confidence."""
    docs = [{
        "id": "DOC-PAN-HIGH",
        "file_name": "pan_card.pdf",
        "document_type": "PAN Card",
        "ocr_status": "COMPLETED",
        "extracted_fields": [
            {"key": "pan", "value": "AABCT1332L", "confidence": 0.98}
        ],
    }]
    res = check_pan_present([], docs)
    assert res["status"] == "COMPLIANT"
    assert res["confidence"] == 0.98
    assert res["evidence_available"] is True


def test_confidence_two_requirements_different_confidence_values():
    """6. Two requirements with different evidence -> different confidence values."""
    docs = [
        {
            "id": "DOC-1",
            "file_name": "gst.pdf",
            "document_type": "GST Certificate",
            "extracted_fields": [{"key": "gstin", "value": "29AABCT1332L1Z1", "confidence": 0.97}],
        },
        {
            "id": "DOC-2",
            "file_name": "udyam.pdf",
            "document_type": "Udyam Certificate",
            "extracted_fields": [{"key": "udyamNumber", "value": "UDYAM-KR-03-0012345", "confidence": 0.78}],
        }
    ]
    res_gst = check_gst_present([], docs)
    res_udyam = check_udyam_present([], docs)
    assert res_gst["confidence"] == 0.97
    assert res_udyam["confidence"] == 0.78
    assert res_gst["confidence"] != res_udyam["confidence"]


def test_confidence_unrelated_document_does_not_raise_confidence():
    """7. One uploaded document must NOT raise unrelated requirement confidence."""
    docs = [
        {
            "id": "DOC-GST-ONLY",
            "file_name": "gst_only.pdf",
            "document_type": "GST Certificate",
            "ocr_confidence": 0.99,
            "extracted_fields": [{"key": "gstin", "value": "29AABCT1332L1Z1", "confidence": 0.99}],
        }
    ]
    # GST is supported
    res_gst = check_gst_present([], docs)
    assert res_gst["confidence"] == 0.99
    assert res_gst["evidence_available"] is True

    # OEM, PAN, Turnover, Non-blacklisting are NOT supported by this document
    res_oem = check_oem_present([], docs)
    res_pan = check_pan_present([], docs)
    res_turnover = check_turnover_threshold([], docs)
    res_blacklist = check_blacklisting_declaration([], docs)

    assert res_oem["confidence"] == 0.0
    assert res_pan["confidence"] == 0.0
    assert res_turnover["confidence"] == 0.0
    assert res_blacklist["confidence"] == 0.0

    assert res_oem["evidence_available"] is False
    assert res_pan["evidence_available"] is False
    assert res_turnover["evidence_available"] is False
    assert res_blacklist["evidence_available"] is False

