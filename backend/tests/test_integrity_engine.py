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
    assert "overall_risk_score" in data
    assert "risk_level" in data
    assert "confidence_score" in data
    assert "findings" in data
    assert "summary" in data

    # 2. Bidder Integrity Endpoint
    res_b = auth_client.get("/api/v1/procurement/bidders/BID-001/integrity")
    assert res_b.status_code == 200
    data_b = res_b.json()
    assert "overall_risk_score" in data_b
    assert "risk_level" in data_b
    assert "bidder_id" in data_b
    assert data_b["bidder_id"] == "BID-001"

    # 3. 404 for non-existent tender
    res_404 = auth_client.get("/api/v1/procurement/tenders/NON-EXISTENT/integrity")
    assert res_404.status_code == 404
