"""
Unit Tests — Procurement Integrity Engine (SIH26100 Day 1 / Task 3)
====================================================================
Comprehensive tests validating:
1. Clean dataset evaluates to LOW risk (score < 25)
2. Suspicious bid price similarity triggers BID_PRICE_ANOMALY
3. Repeated winner concentration triggers REPEATED_WINNER_PATTERN (low severity)
4. Related bidders with shared GSTIN/PAN triggers RELATED_BIDDER with structured evidence
5. Insufficient historical records gracefully produces NO false-positive rotation signal
6. Bid rotation detected when sufficient historical sequence exists
7. Repeated participation cohort detection
8. Multiple signal aggregation with anti-double-counting protection
9. Every finding contains non-empty evidence, reason, action, and valid confidence
10. Deterministic reproducibility across repeated executions
11. Read-only API endpoints (tender integrity & bidder integrity)
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.integrity.models import (
    BidderFeature,
    FindingStatus,
    IntegrityAssessment,
    IntegrityFinding,
    RiskLevel,
    SignalType,
)
from app.services.integrity.feature_extractor import (
    extract_bidder_features,
    normalize_entity_name,
    extract_pan_from_gstin,
    normalize_address,
    parse_numeric_amount,
)
from app.services.integrity.bid_analyzer import (
    analyze_bid_price_similarity,
    analyze_winner_concentration,
    analyze_repeated_participation,
    analyze_bid_rotation,
)
from app.services.integrity.relationship_analyzer import analyze_related_bidders
from app.services.integrity.risk_engine import (
    assess_tender_integrity,
    assess_bidder_integrity,
    aggregate_integrity_findings,
    calculate_risk_tier,
)


from app.core.security import get_current_user
from app.core import procurement_store as ps


@pytest.fixture
def auth_client():
    """Client with authenticated officer user override."""
    app.dependency_overrides[get_current_user] = lambda: {
        "id": "usr-test-1",
        "name": "Testing Procurement Officer",
        "email": "officer@gov.in",
        "role": "OPERATIONS_OFFICER"
    }
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


# ============================================================
# TEST 1 — CLEAN DATASET
# ============================================================

def test_clean_dataset_evaluates_to_low_risk():
    """Normal independent bids with distinct identities must produce LOW risk and 0 findings."""
    bidders = [
        BidderFeature(
            bidder_id="BID-101",
            tender_id="TEN-TEST-01",
            legal_name="Alpha Infotech Private Limited",
            normalized_name="alpha infotech pvt ltd",
            gstin="27AAAAA0000A1Z5",
            pan="AAAAA0000A",
            registered_address="Plot 101, MIDC Industrial Area, Pune 411001",
            normalized_address="plot 101 midc industrial area pune 411001",
            contact_email="bids@alphainfotech.com",
            normalized_email_domain="alphainfotech.com",
            contact_phone="9822011111",
            quote_amount=10000000.0,
        ),
        BidderFeature(
            bidder_id="BID-102",
            tender_id="TEN-TEST-01",
            legal_name="Beta Cyber Systems Limited",
            normalized_name="beta cyber systems ltd",
            gstin="29BBBBB1111B1Z2",
            pan="BBBBB1111B",
            registered_address="Tech Park Tower 4, Electronic City, Bengaluru 560100",
            normalized_address="tech park tower 4 electronic city bengaluru 560100",
            contact_email="tenders@betasystems.in",
            normalized_email_domain="betasystems.in",
            contact_phone="9845022222",
            quote_amount=11500000.0,
        ),
        BidderFeature(
            bidder_id="BID-103",
            tender_id="TEN-TEST-01",
            legal_name="Gamma Cloud Dynamics LLP",
            normalized_name="gamma cloud dynamics llp",
            gstin="07CCCCC2222C1Z8",
            pan="CCCCC2222C",
            registered_address="Connaught Place, Block C, New Delhi 110001",
            normalized_address="connaught place block c new delhi 110001",
            contact_email="sales@gammacloud.org",
            normalized_email_domain="gammacloud.org",
            contact_phone="9811033333",
            quote_amount=12800000.0,
        ),
    ]

    historical_tenders = [
        {"id": "HT-1", "winner_id": "BID-OTHER-1", "participants": ["BID-OTHER-1", "BID-101"]},
        {"id": "HT-2", "winner_id": "BID-OTHER-2", "participants": ["BID-OTHER-2", "BID-102"]},
        {"id": "HT-3", "winner_id": "BID-OTHER-3", "participants": ["BID-OTHER-3", "BID-103"]},
        {"id": "HT-4", "winner_id": "BID-OTHER-4", "participants": ["BID-OTHER-4", "BID-OTHER-5"]},
    ]

    assessment = assess_tender_integrity(
        tender_id="TEN-TEST-01",
        custom_bidders=bidders,
        custom_historical_tenders=historical_tenders,
    )

    assert assessment.risk_level == RiskLevel.LOW
    assert assessment.overall_risk_score < 25.0
    assert len(assessment.findings) == 0
    assert assessment.findings_count == 0
    assert assessment.confidence_score >= 0.85
    assert "LOW RISK" in assessment.summary


# ============================================================
# TEST 2 — SUSPICIOUS BID SIMILARITY
# ============================================================

def test_suspicious_bid_similarity_signal():
    """
    Given bids:
    A = ₹10,00,000
    B = ₹10,01,000
    C = ₹10,00,500
    Detect BID_PRICE_ANOMALY with proper spread calculation and non-accusatory reason.
    """
    bidders = [
        BidderFeature(
            bidder_id="BID-A",
            tender_id="TEN-TEST-02",
            legal_name="Apex Solutions Pvt Ltd",
            normalized_name="apex solutions pvt ltd",
            gstin="27AAACA1111A1Z1",
            pan="AAACA1111A",
            quote_amount=1000000.0,
        ),
        BidderFeature(
            bidder_id="BID-B",
            tender_id="TEN-TEST-02",
            legal_name="Beacon Enterprises Ltd",
            normalized_name="beacon ent ltd",
            gstin="33BBBCB2222B1Z2",
            pan="BBBCB2222B",
            quote_amount=1001000.0,
        ),
        BidderFeature(
            bidder_id="BID-C",
            tender_id="TEN-TEST-02",
            legal_name="Crest Technologies LLP",
            normalized_name="crest tech llp",
            gstin="07CCCC3333C1Z3",
            pan="CCCC3333C",
            quote_amount=1000500.0,
        ),
    ]

    findings = analyze_bid_price_similarity(bidders, tender_id="TEN-TEST-02")
    assert len(findings) == 1

    f = findings[0]
    assert f.signal_type == SignalType.BID_PRICE_ANOMALY
    assert f.severity == RiskLevel.MEDIUM
    assert f.score_impact == 20.0
    assert len(f.evidence) == 3
    assert "0.10%" in f.title or "0.1" in f.title or "3 Bidders" in f.title
    assert "tight margins can occur" in f.reason.lower() or "cost computation" in f.reason.lower()
    assert "bill of quantities" in f.recommended_action.lower() or "boq" in f.recommended_action.lower()

    # Verify single price signal does not artificially trigger HIGH risk tier
    score, risk_tier, _ = aggregate_integrity_findings(findings)
    assert score == 20.0
    assert risk_tier == RiskLevel.LOW  # 20.0 is < 25.0 (LOW tier)


# ============================================================
# TEST 3 — REPEATED WINNER CONCENTRATION
# ============================================================

def test_repeated_winner_concentration_signal():
    """Vendor winning 8 of 9 historical tenders triggers REPEATED_WINNER_PATTERN with low severity."""
    bidders = [
        BidderFeature(
            bidder_id="BID-INCUMBENT",
            tender_id="TEN-TEST-03",
            legal_name="National Infrastructure Corp Ltd",
            normalized_name="national infrastructure corp ltd",
            gstin="27AAACN9999N1Z0",
            pan="AAACN9999N",
        ),
        BidderFeature(
            bidder_id="BID-NEW",
            tender_id="TEN-TEST-03",
            legal_name="New Horizons Tech Pvt Ltd",
            normalized_name="new horizons tech pvt ltd",
            gstin="33AAACN8888M1Z1",
            pan="AAACN8888M",
        ),
    ]

    # 9 historical tenders, BID-INCUMBENT won 8
    historical_tenders = [
        {"id": f"HT-{i}", "winner_id": "BID-INCUMBENT", "winner_name": "National Infrastructure Corp Ltd"}
        for i in range(1, 9)
    ] + [
        {"id": "HT-9", "winner_id": "BID-OTHER", "winner_name": "Other Vendor"}
    ]

    findings = analyze_winner_concentration(bidders, historical_tenders, tender_id="TEN-TEST-03")
    assert len(findings) == 1

    f = findings[0]
    assert f.signal_type == SignalType.REPEATED_WINNER_PATTERN
    assert f.severity == RiskLevel.LOW
    assert f.score_impact == 10.0
    assert "8/9" in f.evidence[0].value or "88.9%" in f.evidence[0].value
    assert "specialized technical capability" in f.reason.lower() or "incumbent" in f.reason.lower()
    assert "qualification thresholds" in f.recommended_action.lower()


# ============================================================
# TEST 4 — RELATED BIDDER RELATIONSHIPS
# ============================================================

def test_related_bidder_with_shared_statutory_identifier():
    """Two bidders sharing PAN / GSTIN generate RELATED_BIDDER with multi-attribute evidence."""
    bidders = [
        BidderFeature(
            bidder_id="BID-X1",
            tender_id="TEN-TEST-04",
            legal_name="Zenith Networks Pvt. Ltd.",
            normalized_name="zenith networks pvt ltd",
            gstin="27AAACZ1234Z1ZV",
            pan="AAACZ1234Z",
            registered_address="12th Floor, Express Towers, Nariman Point, Mumbai 400021",
            normalized_address="12th floor express towers nariman point mumbai 400021",
            contact_email="tender@zenith.com",
            normalized_email_domain="zenith.com",
        ),
        BidderFeature(
            bidder_id="BID-X2",
            tender_id="TEN-TEST-04",
            legal_name="Zenith Communications Limited",
            normalized_name="zenith communications ltd",
            gstin="27AAACZ1234Z1ZV",  # Same GSTIN
            pan="AAACZ1234Z",        # Same PAN
            registered_address="12th Floor, Express Towers, Nariman Point, Mumbai 400021",  # Same address
            normalized_address="12th floor express towers nariman point mumbai 400021",
            contact_email="sales@zenith.com",
            normalized_email_domain="zenith.com",
        ),
    ]

    findings = analyze_related_bidders(bidders, tender_id="TEN-TEST-04")
    assert len(findings) == 1  # Collapsed into single finding (anti-double-counting)

    f = findings[0]
    assert f.signal_type == SignalType.RELATED_BIDDER
    assert f.severity == RiskLevel.HIGH
    assert len(f.evidence) >= 3  # PAN, GSTIN, Address, Email Domain
    fields_in_evidence = [ev.field for ev in f.evidence]
    assert "pan" in fields_in_evidence
    assert "gstin" in fields_in_evidence
    assert "registered_address" in fields_in_evidence
    assert "gfr" in f.recommended_action.lower() or "clarification" in f.recommended_action.lower()


# ============================================================
# TEST 5 — INSUFFICIENT DATA (GRACEFUL DEGRADATION)
# ============================================================

def test_insufficient_historical_data_does_not_manufacture_signals():
    """If insufficient historical tenders exist (< 4), bid rotation & winner concentration must return empty."""
    bidders = [
        BidderFeature(
            bidder_id="BID-1",
            tender_id="TEN-TEST-05",
            legal_name="Vendor One",
            normalized_name="vendor one",
        ),
        BidderFeature(
            bidder_id="BID-2",
            tender_id="TEN-TEST-05",
            legal_name="Vendor Two",
            normalized_name="vendor two",
        ),
    ]

    # Only 2 historical tenders
    sparse_history = [
        {"id": "HT-1", "winner_id": "BID-1", "participants": ["BID-1", "BID-2"]},
        {"id": "HT-2", "winner_id": "BID-2", "participants": ["BID-1", "BID-2"]},
    ]

    rot_findings = analyze_bid_rotation(sparse_history, tender_id="TEN-TEST-05")
    win_findings = analyze_winner_concentration(bidders, sparse_history, tender_id="TEN-TEST-05")
    part_findings = analyze_repeated_participation(bidders, sparse_history, tender_id="TEN-TEST-05")

    assert rot_findings == []
    assert win_findings == []
    assert part_findings == []


# ============================================================
# TEST 6 — BID ROTATION & REPEATED PARTICIPATION
# ============================================================

def test_bid_rotation_and_repeated_participation_with_sufficient_data():
    """Alternating awards across 6 tenders triggers BID_ROTATION_PATTERN and REPEATED_PARTICIPATION_PATTERN."""
    bidders = [
        BidderFeature(
            bidder_id="BID-A",
            tender_id="TEN-TEST-06",
            legal_name="Alpha Tech",
            normalized_name="alpha tech",
        ),
        BidderFeature(
            bidder_id="BID-B",
            tender_id="TEN-TEST-06",
            legal_name="Beta Tech",
            normalized_name="beta tech",
        ),
    ]

    # 6 sequential alternating historical tenders
    rotation_history = [
        {"id": "HT-1", "winner_id": "BID-A", "participants": ["BID-A", "BID-B"]},
        {"id": "HT-2", "winner_id": "BID-B", "participants": ["BID-A", "BID-B"]},
        {"id": "HT-3", "winner_id": "BID-A", "participants": ["BID-A", "BID-B"]},
        {"id": "HT-4", "winner_id": "BID-B", "participants": ["BID-A", "BID-B"]},
        {"id": "HT-5", "winner_id": "BID-A", "participants": ["BID-A", "BID-B"]},
        {"id": "HT-6", "winner_id": "BID-B", "participants": ["BID-A", "BID-B"]},
    ]

    rot_findings = analyze_bid_rotation(rotation_history, tender_id="TEN-TEST-06")
    assert len(rot_findings) == 1
    assert rot_findings[0].signal_type == SignalType.BID_ROTATION_PATTERN
    assert rot_findings[0].severity == RiskLevel.MEDIUM
    assert "alternating" in rot_findings[0].reason.lower()

    part_findings = analyze_repeated_participation(bidders, rotation_history, tender_id="TEN-TEST-06")
    assert len(part_findings) == 1
    assert part_findings[0].signal_type == SignalType.REPEATED_PARTICIPATION_PATTERN
    assert part_findings[0].evidence[0].value == 6


# ============================================================
# TEST 7 — MULTIPLE SIGNALS & ANTI-DOUBLE-COUNTING AGGREGATION
# ============================================================

def test_multiple_signals_aggregation_and_anti_double_counting():
    """Multiple distinct signals combine into elevated risk tier while preventing unbounded inflation."""
    bidders = [
        BidderFeature(
            bidder_id="BID-M1",
            tender_id="TEN-TEST-07",
            legal_name="Matrix Systems Pvt Ltd",
            normalized_name="matrix systems pvt ltd",
            gstin="27AAACM1111M1Z1",
            pan="AAACM1111M",
            quote_amount=5000000.0,
        ),
        BidderFeature(
            bidder_id="BID-M2",
            tender_id="TEN-TEST-07",
            legal_name="Matrix Networks LLP",
            normalized_name="matrix networks llp",
            gstin="27AAACM1111M1Z1",  # Same GSTIN -> Related bidder (+35.0)
            pan="AAACM1111M",
            quote_amount=5005000.0,   # 0.1% price delta -> Price anomaly (+20.0)
        ),
    ]

    historical = [
        {"id": "HT-1", "winner_id": "BID-M1", "participants": ["BID-M1", "BID-M2"]},
        {"id": "HT-2", "winner_id": "BID-M2", "participants": ["BID-M1", "BID-M2"]},
        {"id": "HT-3", "winner_id": "BID-M1", "participants": ["BID-M1", "BID-M2"]},
        {"id": "HT-4", "winner_id": "BID-M2", "participants": ["BID-M1", "BID-M2"]},
    ]

    assessment = assess_tender_integrity(
        tender_id="TEN-TEST-07",
        custom_bidders=bidders,
        custom_historical_tenders=historical,
    )

    assert assessment.risk_level in (RiskLevel.HIGH, RiskLevel.CRITICAL)
    assert assessment.overall_risk_score >= 50.0
    assert assessment.overall_risk_score <= 100.0
    assert len(assessment.contributing_signals) >= 2
    assert SignalType.RELATED_BIDDER in assessment.contributing_signals
    assert SignalType.BID_PRICE_ANOMALY in assessment.contributing_signals


# ============================================================
# TEST 8 — NO FINDING WITHOUT EVIDENCE AND REASON
# ============================================================

def test_all_findings_have_valid_evidence_reason_and_action():
    """Strict verification: Every finding MUST have evidence, reason, confidence, and recommended action."""
    bidders = [
        BidderFeature(
            bidder_id="BID-V1",
            tender_id="TEN-TEST-08",
            legal_name="Vanguard Tech Pvt Ltd",
            normalized_name="vanguard tech pvt ltd",
            gstin="27AAACV9999V1Z9",
            pan="AAACV9999V",
            quote_amount=1000000.0,
        ),
        BidderFeature(
            bidder_id="BID-V2",
            tender_id="TEN-TEST-08",
            legal_name="Vanguard Solutions Pvt Ltd",
            normalized_name="vanguard solutions pvt ltd",
            gstin="27AAACV9999V1Z9",
            pan="AAACV9999V",
            quote_amount=1000800.0,
        ),
    ]

    assessment = assess_tender_integrity(tender_id="TEN-TEST-08", custom_bidders=bidders, custom_historical_tenders=[])

    assert len(assessment.findings) > 0
    forbidden_terms = ["CORRUPTION DETECTED", "FRAUD CONFIRMED", "BRIBE FOUND", "OFFICER IS CORRUPT"]

    for f in assessment.findings:
        assert len(f.evidence) > 0, f"Finding {f.id} has no evidence items"
        assert f.reason and len(f.reason) > 20, f"Finding {f.id} has insufficient reason"
        assert f.recommended_action and len(f.recommended_action) > 10, f"Finding {f.id} has no action"
        assert 0.0 <= f.confidence <= 1.0, f"Finding {f.id} has invalid confidence {f.confidence}"
        assert f.status == FindingStatus.OPEN

        for forbidden in forbidden_terms:
            assert forbidden not in f.title.upper(), f"Forbidden phrase found in title: {f.title}"
            assert forbidden not in f.reason.upper(), f"Forbidden phrase found in reason: {f.reason}"

        for ev in f.evidence:
            assert ev.source_type, "Evidence missing source_type"
            assert ev.field, "Evidence missing field"
            assert ev.value is not None, "Evidence missing value"
            assert ev.description, "Evidence missing description"


# ============================================================
# TEST 9 — DETERMINISTIC REPRODUCIBILITY
# ============================================================

def test_deterministic_scoring_and_findings():
    """Running assessment repeatedly on identical data produces exact identical scores and finding counts."""
    bidders = [
        BidderFeature(
            bidder_id="BID-D1",
            tender_id="TEN-TEST-09",
            legal_name="Delta Systems Pvt Ltd",
            normalized_name="delta systems pvt ltd",
            gstin="27AAACD5555D1Z5",
            pan="AAACD5555D",
            quote_amount=2000000.0,
        ),
        BidderFeature(
            bidder_id="BID-D2",
            tender_id="TEN-TEST-09",
            legal_name="Delta Network Services Ltd",
            normalized_name="delta network services ltd",
            gstin="27AAACD5555D1Z5",
            pan="AAACD5555D",
            quote_amount=2001000.0,
        ),
    ]

    runs = [
        assess_tender_integrity(tender_id="TEN-TEST-09", custom_bidders=bidders, custom_historical_tenders=[])
        for _ in range(5)
    ]

    first = runs[0]
    for r in runs[1:]:
        assert r.overall_risk_score == first.overall_risk_score
        assert r.risk_level == first.risk_level
        assert r.confidence_score == first.confidence_score
        assert len(r.findings) == len(first.findings)
        assert r.contributing_signals == first.contributing_signals


# ============================================================
# TEST 10 — FEATURE EXTRACTOR & NORMALIZATION HELPERS
# ============================================================

def test_feature_extractor_helpers():
    """Verify PAN extraction, entity normalization, address cleanup, and amount parsing."""
    # PAN from GSTIN
    assert extract_pan_from_gstin("27AABCT4180Q1ZV") == "AABCT4180Q"
    assert extract_pan_from_gstin("INVALID_GSTIN") is None

    # Legal entity normalization
    assert normalize_entity_name("Triveni Infotech Solutions Pvt. Ltd.") == "triveni infotech solutions pvt ltd"
    assert normalize_entity_name("ABC PRIVATE LIMITED") == "abc pvt ltd"
    assert normalize_entity_name("XYZ Technologies LLP") == "xyz tech llp"

    # Numeric amount parser
    assert parse_numeric_amount("₹ 10,50,000.00") == 1050000.0
    assert parse_numeric_amount("15.5 Lakhs") == 1550000.0
    assert parse_numeric_amount("2.5 Crore") == 25000000.0
    assert parse_numeric_amount(45000000) == 45000000.0


# ============================================================
# TEST 11 — API ENDPOINTS (TENDER & BIDDER INTEGRITY)
# ============================================================

def test_api_tender_and_bidder_integrity(auth_client):
    """Test read-only FastAPI integrity endpoints on live seeded database."""
    # 1. Tender Integrity Endpoint
    res = auth_client.get("/api/v1/procurement/tenders/TEN-2026-001/integrity")
    assert res.status_code == 200
    data = res.json()
    assert data["tender_id"] == "TEN-2026-001"
    assert "overall_risk_score" in data
    assert "risk_level" in data
    assert data["risk_level"] in ("LOW", "MEDIUM", "HIGH", "CRITICAL")
    assert "confidence_score" in data
    assert 0.0 <= data["confidence_score"] <= 1.0
    assert "findings_count" in data
    assert "findings" in data
    assert isinstance(data["findings"], list)
    assert "contributing_signals" in data
    assert "summary" in data
    assert "assessed_at" in data

    # 2. Bidder Integrity Endpoint
    bidders = ps.get_bidders()
    assert len(bidders) > 0
    target_bidder_id = bidders[0]["id"]
    res_b = auth_client.get(f"/api/v1/procurement/bidders/{target_bidder_id}/integrity")
    assert res_b.status_code == 200
    data_b = res_b.json()
    assert data_b["bidder_id"] == target_bidder_id
    assert "overall_risk_score" in data_b
    assert "risk_level" in data_b
    assert data_b["risk_level"] in ("LOW", "MEDIUM", "HIGH", "CRITICAL")
    assert "findings" in data_b
    assert "summary" in data_b


def test_api_missing_entities_404_error(auth_client):
    """Verify non-existent tenders and bidders return proper 404 status codes."""
    # Non-existent tender
    res_t404 = auth_client.get("/api/v1/procurement/tenders/TEN-NON-EXISTENT-999/integrity")
    assert res_t404.status_code == 404
    assert "not found" in res_t404.json()["detail"].lower()

    # Non-existent bidder
    res_b404 = auth_client.get("/api/v1/procurement/bidders/BID-NON-EXISTENT-999/integrity")
    assert res_b404.status_code == 404
    assert "not found" in res_b404.json()["detail"].lower()


def test_sparse_data_scenarios():
    """Verify graceful handling for sparse datasets: no historical data, single tender, single bidder."""
    # Scenario A: Zero bidders in a tender
    assessment_empty = assess_tender_integrity(
        tender_id="TEN-EMPTY",
        custom_bidders=[],
        custom_historical_tenders=[]
    )
    assert assessment_empty.risk_level == RiskLevel.LOW
    assert assessment_empty.overall_risk_score == 0.0
    assert assessment_empty.findings_count == 0
    assert len(assessment_empty.findings) == 0

    # Scenario B: Single bidder in a tender
    single_bidder = [
        BidderFeature(
            bidder_id="BID-SOLO",
            tender_id="TEN-SOLO",
            legal_name="Solo Infrastructure Ltd",
            normalized_name="solo infrastructure ltd",
            gstin="27AABCS1234S1Z1",
            pan="AABCS1234S",
            quote_amount=5000000.0,
        )
    ]
    assessment_solo = assess_tender_integrity(
        tender_id="TEN-SOLO",
        custom_bidders=single_bidder,
        custom_historical_tenders=[]
    )
    assert assessment_solo.risk_level == RiskLevel.LOW
    assert assessment_solo.overall_risk_score == 0.0
    assert assessment_solo.findings_count == 0

    # Scenario C: Multiple bidders but only 1 historical tender (insufficient for rotation or concentration)
    two_bidders = [
        BidderFeature(
            bidder_id="BID-X1",
            tender_id="TEN-TWO",
            legal_name="Xerox Logistics Pvt Ltd",
            normalized_name="xerox logistics pvt ltd",
            gstin="27AABCX1111X1Z1",
            pan="AABCX1111X",
            quote_amount=8000000.0,
        ),
        BidderFeature(
            bidder_id="BID-X2",
            tender_id="TEN-TWO",
            legal_name="Yankee Engineering Corp",
            normalized_name="yankee engineering corp",
            gstin="27AABCY2222Y1Z2",
            pan="AABCY2222Y",
            quote_amount=9500000.0,
        ),
    ]
    single_history = [{"id": "HT-OLD-1", "winner_id": "BID-X1", "participants": ["BID-X1", "BID-X2"]}]
    assessment_sparse = assess_tender_integrity(
        tender_id="TEN-TWO",
        custom_bidders=two_bidders,
        custom_historical_tenders=single_history
    )
    assert assessment_sparse.risk_level == RiskLevel.LOW
    assert assessment_sparse.overall_risk_score == 0.0
    assert assessment_sparse.findings_count == 0


def test_frontend_contract_structure_and_safety_language(auth_client):
    """Verify that the API response contract strictly matches frontend requirements and contains no accusatory terms."""
    res = auth_client.get("/api/v1/procurement/tenders/TEN-2026-001/integrity")
    assert res.status_code == 200
    body = res.json()

    # Top-level required keys
    required_top_keys = ["tender_id", "overall_risk_score", "risk_level", "confidence_score", "findings_count", "findings", "contributing_signals", "assessed_at", "summary"]
    for key in required_top_keys:
        assert key in body, f"Missing required top-level key: {key}"

    # Verify findings structure if present
    for finding in body.get("findings", []):
        finding_keys = ["id", "signal_type", "severity", "score_impact", "confidence", "title", "reason", "evidence", "recommended_action", "status", "detected_at"]
        for fk in finding_keys:
            assert fk in finding, f"Finding missing key: {fk}"

        # Evidence structure
        for ev in finding.get("evidence", []):
            assert "source_type" in ev
            assert "field" in ev
            assert "value" in ev
            assert "description" in ev

        # Safety keywords check
        forbidden = ["CORRUPTION DETECTED", "FRAUD CONFIRMED", "BRIBE FOUND", "GUILTY OF COLLUSION"]
        for f_word in forbidden:
            assert f_word not in finding["title"].upper()
            assert f_word not in finding["reason"].upper()
            assert f_word not in finding["recommended_action"].upper()


# ============================================================
# SYNTHETIC SCENARIO VALIDATION TESTS (8 REQUIRED SCENARIOS)
# ============================================================

def test_scenario_1_clean_dataset_live():
    """Scenario 1: TEN-2026-001 with independent bidders must evaluate to LOW risk with 0 findings."""
    assessment = assess_tender_integrity("TEN-2026-001")
    assert assessment.risk_level == RiskLevel.LOW
    assert assessment.overall_risk_score < 25.0
    assert assessment.findings_count == 0
    assert len(assessment.findings) == 0
    assert "LOW RISK" in assessment.summary


def test_scenario_2_bid_price_clustering_live():
    """Scenario 2: TEN-2026-002 with 3 bids within 0.28% delta triggers BID_PRICE_ANOMALY."""
    assessment = assess_tender_integrity("TEN-2026-002")
    signals = [f.signal_type for f in assessment.findings]
    assert SignalType.BID_PRICE_ANOMALY in signals

    price_finding = [f for f in assessment.findings if f.signal_type == SignalType.BID_PRICE_ANOMALY][0]
    assert price_finding.severity == RiskLevel.MEDIUM
    assert price_finding.score_impact == 20.0
    assert len(price_finding.evidence) == 3
    assert "boq" in price_finding.recommended_action.lower() or "rate" in price_finding.recommended_action.lower()


def test_scenario_3_repeated_participation_cohort_live():
    """Scenario 3: TEN-2026-003 with recurring cohort across 5 historical tenders triggers REPEATED_PARTICIPATION_PATTERN."""
    assessment = assess_tender_integrity("TEN-2026-003")
    signals = [f.signal_type for f in assessment.findings]
    assert SignalType.REPEATED_PARTICIPATION_PATTERN in signals

    cohort_findings = [f for f in assessment.findings if f.signal_type == SignalType.REPEATED_PARTICIPATION_PATTERN]
    assert len(cohort_findings) >= 1
    for cf in cohort_findings:
        assert cf.severity == RiskLevel.LOW
        assert cf.evidence[0].value >= 3


def test_scenario_4_winner_concentration_live():
    """Scenario 4: TEN-2026-004 with Vindhyachal winning 4 of 4 historical renewable tenders triggers REPEATED_WINNER_PATTERN."""
    assessment = assess_tender_integrity("TEN-2026-004")
    signals = [f.signal_type for f in assessment.findings]
    assert SignalType.REPEATED_WINNER_PATTERN in signals

    win_finding = [f for f in assessment.findings if f.signal_type == SignalType.REPEATED_WINNER_PATTERN][0]
    assert win_finding.severity == RiskLevel.LOW
    assert "4/4" in win_finding.evidence[0].value or "100" in win_finding.evidence[0].value
    assert "Vindhyachal" in win_finding.title or "Vindhyachal" in win_finding.reason


def test_scenario_5_bid_rotation_live():
    """Scenario 5: TEN-2026-005 with historical alternating cycle triggers BID_ROTATION_PATTERN."""
    assessment = assess_tender_integrity("TEN-2026-005")
    signals = [f.signal_type for f in assessment.findings]
    assert SignalType.BID_ROTATION_PATTERN in signals

    rot_finding = [f for f in assessment.findings if f.signal_type == SignalType.BID_ROTATION_PATTERN][0]
    assert rot_finding.severity == RiskLevel.MEDIUM
    assert len(rot_finding.evidence) > 0
    assert "winner_sequence" in rot_finding.evidence[0].field


def test_scenario_6_related_bidders_consolidated_live():
    """Scenario 6: TEN-2026-006 with Shivalik entities sharing PAN/GSTIN/address consolidates into 1 RELATED_BIDDER finding."""
    assessment = assess_tender_integrity("TEN-2026-006")
    related_findings = [f for f in assessment.findings if f.signal_type == SignalType.RELATED_BIDDER]
    assert len(related_findings) == 1

    rf = related_findings[0]
    assert rf.severity == RiskLevel.HIGH
    assert len(rf.evidence) >= 3
    evidence_fields = [ev.field for ev in rf.evidence]
    assert "pan" in evidence_fields
    assert "gstin" in evidence_fields
    assert "registered_address" in evidence_fields


def test_scenario_7_multi_signal_elevated_risk_live():
    """Scenario 7: TEN-2026-007 combining related bidders + price clustering + cohort evaluates to HIGH/CRITICAL calculated tier."""
    assessment = assess_tender_integrity("TEN-2026-007")
    assert assessment.risk_level in (RiskLevel.HIGH, RiskLevel.CRITICAL)
    assert assessment.overall_risk_score >= 50.0
    assert len(assessment.contributing_signals) >= 2
    assert SignalType.RELATED_BIDDER in assessment.contributing_signals
    assert SignalType.BID_PRICE_ANOMALY in assessment.contributing_signals


def test_scenario_8_false_positive_control_live():
    """Scenario 8: TEN-2026-008 with legitimate competitive bidding in specialized GIS domain produces LOW risk."""
    assessment = assess_tender_integrity("TEN-2026-008")
    assert assessment.risk_level == RiskLevel.LOW
    assert assessment.overall_risk_score < 25.0
    assert assessment.findings_count == 0


def test_synthetic_procurement_history_idempotency():
    """Verify that reseeding synthetic history produces identical record counts and deterministic integrity outputs."""
    from app.core.procurement_store import reset_and_seed_procurement_data
    counts = reset_and_seed_procurement_data()
    assert counts["tenders"] == 17
    assert counts["bidders"] == 55
    assert counts["documents"] >= 100

    # Repeat assessment on TEN-2026-007 twice to ensure identical output
    run1 = assess_tender_integrity("TEN-2026-007")
    run2 = assess_tender_integrity("TEN-2026-007")
    assert run1.overall_risk_score == run2.overall_risk_score
    assert run1.risk_level == run2.risk_level
    assert run1.findings_count == run2.findings_count
    assert run1.contributing_signals == run2.contributing_signals


def test_officer_finding_review_and_audit_integration(auth_client):
    """Verify that officer review actions update finding status and record immutable audit events."""
    # 1. Fetch live findings for TEN-2026-006
    res = auth_client.get("/api/v1/procurement/tenders/TEN-2026-006/integrity")
    assert res.status_code == 200
    data = res.json()
    assert len(data["findings"]) > 0
    target_finding = data["findings"][0]
    finding_id = target_finding["id"]

    # 2. Post an officer review action (ACKNOWLEDGED with note)
    review_payload = {
        "status": "ACKNOWLEDGED",
        "tender_id": "TEN-2026-006",
        "action": "Acknowledge & Record Review",
        "note": "Corporate relationship under review pursuant to GFR 144.",
    }
    rev_res = auth_client.post(
        f"/api/v1/procurement/integrity/findings/{finding_id}/review",
        json=review_payload,
    )
    assert rev_res.status_code == 200
    rev_data = rev_res.json()
    assert rev_data["status"] == "ACKNOWLEDGED"
    assert rev_data["finding_id"] == finding_id

    # 3. Verify that re-fetching tender integrity returns the updated ACKNOWLEDGED status
    recheck_res = auth_client.get("/api/v1/procurement/tenders/TEN-2026-006/integrity")
    assert recheck_res.status_code == 200
    updated_finding = [f for f in recheck_res.json()["findings"] if f["id"] == finding_id][0]
    assert updated_finding["status"] == "ACKNOWLEDGED"

    # 4. Verify that an audit event was logged in the official audit trail
    audit_res = auth_client.get("/api/v1/procurement/audit?tender_id=TEN-2026-006")
    assert audit_res.status_code == 200
    audit_events = audit_res.json()
    matching_events = [e for e in audit_events if finding_id in str(e.get("description", "")) or "Integrity Finding" in str(e.get("action", ""))]
    assert len(matching_events) > 0
    assert "ACKNOWLEDGED" in matching_events[0]["description"]


def test_dashboard_summary_includes_real_integrity_metrics(auth_client):
    """Verify that the dashboard endpoint delivers real integrity highlights and active reviews."""
    dash_res = auth_client.get("/api/v1/procurement/dashboard")
    assert dash_res.status_code == 200
    body = dash_res.json()

    assert "integrity_reviews" in body
    assert "integrity_summary" in body
    assert isinstance(body["integrity_reviews"], list)
    assert len(body["integrity_reviews"]) > 0

    # Ensure top risk cases (TEN-2026-007) are prioritized at the top
    top_review = body["integrity_reviews"][0]
    assert "tender_id" in top_review
    assert "risk_score" in top_review
    assert "risk_level" in top_review
    assert "findings_count" in top_review
    assert top_review["risk_score"] >= 30.0


# ============================================================
# NULLABLE QUOTE AMOUNT TESTS (9 required scenarios)
# ============================================================

def _make_bidder(bidder_id: str, name: str, quote_amount=None, gstin=None, pan=None) -> BidderFeature:
    """Helper to create a BidderFeature for nullable quote tests."""
    return BidderFeature(
        bidder_id=bidder_id,
        tender_id="TEN-NULL-TEST",
        legal_name=name,
        normalized_name=name.lower().replace(" ", "_"),
        gstin=gstin,
        pan=pan,
        quote_amount=quote_amount,
    )


def test_nullable_scenario_1_all_bidders_have_valid_quotes():
    """Scenario 1: All bidders have valid quotes — price similarity runs normally."""
    bidders = [
        _make_bidder("BID-N1", "Alpha Corp", quote_amount=1_000_000.0),
        _make_bidder("BID-N2", "Beta Corp", quote_amount=1_005_000.0),
        _make_bidder("BID-N3", "Gamma Corp", quote_amount=2_000_000.0),
    ]
    findings = analyze_bid_price_similarity(bidders, tender_id="TEN-NULL-TEST")
    # Alpha and Beta are within 0.5% — should trigger
    assert len(findings) == 1
    assert findings[0].signal_type == SignalType.BID_PRICE_ANOMALY
    assert len(findings[0].evidence) == 2


def test_nullable_scenario_2_one_bidder_has_none_quote():
    """Scenario 2: One bidder has None — excluded from price analysis, others still analyzed."""
    bidders = [
        _make_bidder("BID-N1", "Alpha Corp", quote_amount=1_000_000.0),
        _make_bidder("BID-N2", "Beta Corp", quote_amount=1_001_000.0),
        _make_bidder("BID-N3", "Gamma Corp", quote_amount=None),  # excluded from price
    ]
    findings = analyze_bid_price_similarity(bidders, tender_id="TEN-NULL-TEST")
    # Alpha and Beta within 0.1% — triggers; Gamma excluded from price arithmetic
    assert len(findings) == 1
    assert findings[0].signal_type == SignalType.BID_PRICE_ANOMALY
    bidder_ids_in_finding = findings[0].related_bidder_ids
    assert "BID-N3" not in bidder_ids_in_finding
    assert "BID-N1" in bidder_ids_in_finding
    assert "BID-N2" in bidder_ids_in_finding


def test_nullable_scenario_3_two_bidders_have_none_quotes():
    """Scenario 3: Two bidders have None — only one valid, insufficient for price clustering."""
    bidders = [
        _make_bidder("BID-N1", "Alpha Corp", quote_amount=1_000_000.0),
        _make_bidder("BID-N2", "Beta Corp", quote_amount=None),
        _make_bidder("BID-N3", "Gamma Corp", quote_amount=None),
    ]
    findings = analyze_bid_price_similarity(bidders, tender_id="TEN-NULL-TEST")
    # Only 1 valid quote — must return empty (no false signal)
    assert findings == []


def test_nullable_scenario_4_all_quotes_missing():
    """Scenario 4: All bidders have None quote — must return empty (no fabricated signal)."""
    bidders = [
        _make_bidder("BID-N1", "Alpha Corp", quote_amount=None),
        _make_bidder("BID-N2", "Beta Corp", quote_amount=None),
        _make_bidder("BID-N3", "Gamma Corp", quote_amount=None),
    ]
    findings = analyze_bid_price_similarity(bidders, tender_id="TEN-NULL-TEST")
    assert findings == []


def test_nullable_scenario_5_close_bids_still_trigger_anomaly():
    """Scenario 5: Close valid bids trigger BID_PRICE_ANOMALY with correct score impact."""
    bidders = [
        _make_bidder("BID-A", "Alpha Ltd", quote_amount=5_000_000.0),
        _make_bidder("BID-B", "Beta Ltd", quote_amount=5_004_000.0),  # 0.08% delta
    ]
    findings = analyze_bid_price_similarity(bidders, tender_id="TEN-NULL-TEST")
    assert len(findings) == 1
    assert findings[0].signal_type == SignalType.BID_PRICE_ANOMALY
    assert findings[0].severity == RiskLevel.MEDIUM
    assert findings[0].score_impact == 20.0
    assert len(findings[0].evidence) == 2


def test_nullable_scenario_6_separated_bids_produce_no_anomaly():
    """Scenario 6: Bids more than 1% apart produce no price anomaly finding."""
    bidders = [
        _make_bidder("BID-A", "Alpha Ltd", quote_amount=5_000_000.0),
        _make_bidder("BID-B", "Beta Ltd", quote_amount=5_100_000.0),  # 2.0% apart
    ]
    findings = analyze_bid_price_similarity(bidders, tender_id="TEN-NULL-TEST")
    assert findings == []


def test_nullable_scenario_7_missing_quote_not_treated_as_zero():
    """Scenario 7: A bidder with None quote must NOT be treated as quoting 0.

    If None were treated as 0, it would always appear as the lowest bid and cluster
    with any other low bid. This test verifies that None is excluded, not coerced.
    """
    bidders = [
        _make_bidder("BID-A", "Alpha Ltd", quote_amount=None),
        _make_bidder("BID-B", "Beta Ltd", quote_amount=5_000_000.0),
        _make_bidder("BID-C", "Gamma Ltd", quote_amount=6_000_000.0),
    ]
    findings = analyze_bid_price_similarity(bidders, tender_id="TEN-NULL-TEST")
    # Only B and C, which are 20% apart — no anomaly
    assert findings == []
    # Critically, no finding should reference BID-A
    for f in findings:
        assert "BID-A" not in f.related_bidder_ids


def test_nullable_scenario_8_other_integrity_signals_still_work_with_none_quotes():
    """Scenario 8: Bidders with None quotes remain available to relationship/cohort/winner analyzers."""
    # Bidders share the same GSTIN — related bidder signal should still fire
    # even if both have None quote_amount
    bidders = [
        _make_bidder("BID-X1", "Zenith Networks Pvt Ltd", quote_amount=None,
                     gstin="27AAACZ1234Z1ZV", pan="AAACZ1234Z"),
        _make_bidder("BID-X2", "Zenith Communications Ltd", quote_amount=None,
                     gstin="27AAACZ1234Z1ZV", pan="AAACZ1234Z"),
    ]
    from app.services.integrity.relationship_analyzer import analyze_related_bidders
    rel_findings = analyze_related_bidders(bidders, tender_id="TEN-NULL-TEST")
    assert len(rel_findings) == 1
    assert rel_findings[0].signal_type == SignalType.RELATED_BIDDER

    # Price analysis with None quotes must be empty — no fabricated price signal
    price_findings = analyze_bid_price_similarity(bidders, tender_id="TEN-NULL-TEST")
    assert price_findings == []


def test_nullable_scenario_9_repeated_execution_is_deterministic_with_none_quotes():
    """Scenario 9: Repeated execution with mixed None/float quotes yields identical results."""
    bidders = [
        _make_bidder("BID-D1", "Delta Corp", quote_amount=2_000_000.0),
        _make_bidder("BID-D2", "Echo Corp", quote_amount=2_001_000.0),  # 0.05%
        _make_bidder("BID-D3", "Foxtrot Corp", quote_amount=None),
    ]
    runs = [
        analyze_bid_price_similarity(bidders, tender_id="TEN-NULL-TEST")
        for _ in range(5)
    ]
    first = runs[0]
    for r in runs[1:]:
        assert len(r) == len(first)
        if first:
            assert r[0].signal_type == first[0].signal_type
            assert r[0].score_impact == first[0].score_impact
            assert r[0].related_bidder_ids == first[0].related_bidder_ids



