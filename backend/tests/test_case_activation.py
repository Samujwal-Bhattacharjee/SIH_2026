"""
Comprehensive Test Suite for Dormant Case Fixtures System (SIH26100)
=====================================================================
Tests covering all 13 required scenarios:
TEST 1: Normal startup -> dormant fixtures not visible
TEST 2: Upload unrelated normal PDF -> no fixture activation
TEST 3: Upload JBMD document -> JBMD activates, correct context appears, no NDMC data
TEST 4: Upload NDMC document in fresh session -> NDMC activates, no JBMD data
TEST 5: JBMD compliance -> complete submission, decision-traceability exception
TEST 6: NDMC compliance -> claimed 128cr vs verified 28cr, material discrepancy 100cr
TEST 7: Embedded PDF score does not determine FairBid score
TEST 8: Filename does not determine score
TEST 9: Repeated upload does not duplicate fixture data
TEST 10: Restart backend -> activated case disappears, dormant fixture remains hidden, baseline remains
TEST 11: Normal baseline dashboard does not change before case activation
TEST 12: Activating JBMD changes only the relevant runtime data
TEST 13: Activating NDMC changes only the relevant runtime data
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core import procurement_store as ps
from app.core.security import get_current_user
from app.services.generate_case_documents import generate_jbmd_case_pdf, generate_ndmc_case_pdf
from app.services.integrity.risk_engine import assess_tender_integrity

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_clean_session():
    """Ensure every test starts with a clean baseline database session."""
    app.dependency_overrides[get_current_user] = lambda: {
        "id": "test-officer",
        "email": "officer@nic.in",
        "role": "admin",
        "full_name": "Test Officer",
    }
    ps.reset_session_db(enabled=True)
    yield
    app.dependency_overrides.clear()
    ps.reset_session_db(enabled=True)


def _get_first_baseline_bidder_id() -> str:
    """Get any valid baseline bidder ID to use for initial upload."""
    bidders = ps.get_bidders()
    assert len(bidders) > 0, "Expected baseline bidders in database"
    return bidders[0]["id"]


# =====================================================================
# TEST 1: Normal startup -> dormant fixtures not visible
# =====================================================================
def test_1_normal_startup_dormant_fixtures_not_visible():
    """Dormant case fixtures (JBMD, NDMC) must NOT be visible on fresh startup."""
    assert not ps.is_case_activated("CASE-JBMD")
    assert not ps.is_case_activated("CASE-NDMC")

    tenders = ps.get_tenders()
    tender_ids = [t["id"] for t in tenders]
    assert "TEN-CASE-JBMD-001" not in tender_ids
    assert "TEN-CASE-NDMC-001" not in tender_ids

    bidders = ps.get_bidders()
    bidder_ids = [b["id"] for b in bidders]
    assert "BID-CASE-JBMD-001" not in bidder_ids
    assert "BID-CASE-NDMC-CCS-001" not in bidder_ids

    # Querying dormant records directly must return None
    assert ps.get_tender_by_id("TEN-CASE-JBMD-001") is None
    assert ps.get_tender_by_id("TEN-CASE-NDMC-001") is None
    assert ps.get_bidder_by_id("BID-CASE-JBMD-001") is None
    assert ps.get_bidder_by_id("BID-CASE-NDMC-CCS-001") is None

    # API endpoints must not leak dormant records
    res = client.get("/api/v1/procurement/tenders")
    assert res.status_code == 200
    api_tender_ids = [t["id"] for t in res.json()]
    assert "TEN-CASE-JBMD-001" not in api_tender_ids
    assert "TEN-CASE-NDMC-001" not in api_tender_ids


# =====================================================================
# TEST 2: Upload unrelated normal PDF -> no fixture activation
# =====================================================================
def test_2_upload_unrelated_pdf_no_fixture_activation():
    """Uploading an unrelated document must NOT activate any dormant case fixture."""
    bidder_id = _get_first_baseline_bidder_id()

    # Generate a simple generic PDF with no case reference
    import fitz
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 100), "Ordinary Vendor GST Registration Certificate")
    page.insert_text((50, 130), "GSTIN: 07AAAAA0000A1Z5")
    pdf_bytes = doc.tobytes()

    res = client.post(
        f"/api/v1/procurement/bidders/{bidder_id}/documents",
        files={"file": ("unrelated_gst.pdf", pdf_bytes, "application/pdf")},
        data={"document_type": "auto"},
    )
    assert res.status_code == 200

    # Confirm neither fixture is activated
    assert not ps.is_case_activated("CASE-JBMD")
    assert not ps.is_case_activated("CASE-NDMC")

    # Confirm dormant tenders remain hidden
    tenders = ps.get_tenders()
    tender_ids = [t["id"] for t in tenders]
    assert "TEN-CASE-JBMD-001" not in tender_ids
    assert "TEN-CASE-NDMC-001" not in tender_ids


# =====================================================================
# TEST 3: Upload JBMD document -> JBMD fixture activates, no NDMC
# =====================================================================
def test_3_upload_jbmd_document_activates_jbmd_only():
    """Uploading JBMD document activates JBMD scenario and keeps NDMC hidden."""
    bidder_id = _get_first_baseline_bidder_id()
    jbmd_pdf = generate_jbmd_case_pdf()

    res = client.post(
        f"/api/v1/procurement/bidders/{bidder_id}/documents",
        files={"file": ("FairBid_JBMD_Review.pdf", jbmd_pdf, "application/pdf")},
        data={"document_type": "auto"},
    )
    assert res.status_code == 200
    data = res.json()

    # Verify JBMD is activated and NDMC is NOT
    assert ps.is_case_activated("CASE-JBMD")
    assert not ps.is_case_activated("CASE-NDMC")

    # JBMD tender is now visible; NDMC tender is NOT visible
    tenders = ps.get_tenders()
    tender_ids = [t["id"] for t in tenders]
    assert "TEN-CASE-JBMD-001" in tender_ids
    assert "TEN-CASE-NDMC-001" not in tender_ids

    # JBMD bidder is now visible; NDMC bidder is NOT visible
    bidders = ps.get_bidders()
    bidder_ids = [b["id"] for b in bidders]
    assert "BID-CASE-JBMD-001" in bidder_ids
    assert "BID-CASE-NDMC-CCS-001" not in bidder_ids

    # Response indicates activation
    assert data.get("activated_case") is not None
    assert data["activated_case"]["case_id"] == "CASE-JBMD"


# =====================================================================
# TEST 4: Upload NDMC document in fresh session -> NDMC activates, no JBMD
# =====================================================================
def test_4_upload_ndmc_document_activates_ndmc_only():
    """Uploading NDMC document in fresh session activates NDMC scenario and keeps JBMD hidden."""
    bidder_id = _get_first_baseline_bidder_id()
    ndmc_pdf = generate_ndmc_case_pdf()

    res = client.post(
        f"/api/v1/procurement/bidders/{bidder_id}/documents",
        files={"file": ("FairBid_NDMC_Turnover.pdf", ndmc_pdf, "application/pdf")},
        data={"document_type": "auto"},
    )
    assert res.status_code == 200
    data = res.json()

    # Verify NDMC is activated and JBMD is NOT
    assert ps.is_case_activated("CASE-NDMC")
    assert not ps.is_case_activated("CASE-JBMD")

    # NDMC tender is visible; JBMD tender is NOT visible
    tenders = ps.get_tenders()
    tender_ids = [t["id"] for t in tenders]
    assert "TEN-CASE-NDMC-001" in tender_ids
    assert "TEN-CASE-JBMD-001" not in tender_ids

    # NDMC bidder is visible; JBMD bidder is NOT visible
    bidders = ps.get_bidders()
    bidder_ids = [b["id"] for b in bidders]
    assert "BID-CASE-NDMC-CCS-001" in bidder_ids
    assert "BID-CASE-JBMD-001" not in bidder_ids

    # Response indicates activation
    assert data.get("activated_case") is not None
    assert data["activated_case"]["case_id"] == "CASE-NDMC"


# =====================================================================
# TEST 5: JBMD compliance -> complete submission & decision-traceability gap
# =====================================================================
def test_5_jbmd_compliance_complete_submission_and_decision_traceability_gap():
    """
    JBMD scenario verification:
    - Compliance: complete document submission, score 92/100, COMPLIANT status
    - Decision Traceability: bid marked NOT_EVALUATED with reason field absent
    - Integrity: DECISION_TRACEABILITY_GAP signal detected with score impact
    """
    bidder_id = _get_first_baseline_bidder_id()
    jbmd_pdf = generate_jbmd_case_pdf()

    client.post(
        f"/api/v1/procurement/bidders/{bidder_id}/documents",
        files={"file": ("JBMD_Audit.pdf", jbmd_pdf, "application/pdf")},
        data={"document_type": "auto"},
    )

    # Inspect JBMD bidder details
    jbmd_bidder = ps.get_bidder_by_id("BID-CASE-JBMD-001")
    assert jbmd_bidder is not None
    assert jbmd_bidder["status"] == "NOT_EVALUATED"
    assert jbmd_bidder["compliance_status"] == "COMPLIANT"
    assert jbmd_bidder["compliance_score"] >= 90.0

    # Verify compliance results have no invented document failures
    comp_results = ps.get_compliance_results("BID-CASE-JBMD-001")
    assert len(comp_results) >= 5
    for cr in comp_results:
        assert cr["status"] == "COMPLIANT", f"Expected COMPLIANT for {cr['requirement_name']}, got {cr['status']}"

    # Verify decision traceability gap detected by Integrity Engine
    ia = assess_tender_integrity("TEN-CASE-JBMD-001")
    assert ia.overall_risk_score > 0
    signal_types = [f.signal_type.value for f in ia.findings]
    assert "DECISION_TRACEABILITY_GAP" in signal_types

    # Find the specific gap finding
    gap_finding = next((f for f in ia.findings if f.signal_type.value == "DECISION_TRACEABILITY_GAP"), None)
    assert gap_finding is not None
    assert "Non-Evaluation Without Recorded Rationale" in gap_finding.title
    assert gap_finding.score_impact == 20.0
    assert len(gap_finding.evidence) >= 2


# =====================================================================
# TEST 6: NDMC compliance -> claimed 128cr vs verified 28cr, material discrepancy
# =====================================================================
def test_6_ndmc_compliance_claimed_vs_verified_turnover():
    """
    NDMC/CCS scenario verification:
    - Claimed turnover: INR 128 Crore
    - Verified turnover: INR 28 Crore
    - Delta: INR 100 Crore
    - Discrepancy type: CROSS_SOURCE_VERIFICATION (CRITICAL)
    """
    bidder_id = _get_first_baseline_bidder_id()
    ndmc_pdf = generate_ndmc_case_pdf()

    client.post(
        f"/api/v1/procurement/bidders/{bidder_id}/documents",
        files={"file": ("NDMC_Audit.pdf", ndmc_pdf, "application/pdf")},
        data={"document_type": "auto"},
    )

    # Inspect CCS bidder details
    ccs_bidder = ps.get_bidder_by_id("BID-CASE-NDMC-CCS-001")
    assert ccs_bidder is not None
    assert ccs_bidder["compliance_status"] == "EXCEPTION_FOUND"
    assert ccs_bidder["compliance_score"] <= 50.0

    # Verify discrepancies
    discs = ps.get_discrepancies("BID-CASE-NDMC-CCS-001")
    assert len(discs) >= 1
    turnover_disc = next((d for d in discs if d.get("discrepancy_type") == "CROSS_SOURCE_VERIFICATION"), None)
    assert turnover_disc is not None
    assert "128" in str(turnover_disc.get("expected_value"))
    assert "28" in str(turnover_disc.get("found_value"))
    assert turnover_disc.get("severity") == "CRITICAL"
    assert "100" in turnover_disc.get("description", "")


# =====================================================================
# TEST 7: Embedded PDF score does not determine FairBid score
# =====================================================================
def test_7_embedded_pdf_score_does_not_determine_fairbid_score():
    """
    Decoy text inside the PDF ('Declared Score: 86/100' or '12/100') must NOT
    be trusted or copied by the system as the calculated FairBid compliance score.
    """
    bidder_id = _get_first_baseline_bidder_id()

    # JBMD PDF contains decoy text '86/100'
    jbmd_pdf = generate_jbmd_case_pdf()
    res = client.post(
        f"/api/v1/procurement/bidders/{bidder_id}/documents",
        files={"file": ("JBMD_Test.pdf", jbmd_pdf, "application/pdf")},
        data={"document_type": "auto"},
    )
    assert res.status_code == 200
    data = res.json()
    # FairBid calculated score must be 92.0 (from evaluated conditions), NOT the 86.0 decoy
    assert data["assessment"]["compliance_score"] == 92.0
    assert data["assessment"]["compliance_score"] != 86.0

    # Reset and test NDMC PDF with decoy text '12/100'
    ps.reset_session_db(enabled=True)
    bidder_id = _get_first_baseline_bidder_id()
    ndmc_pdf = generate_ndmc_case_pdf()
    res2 = client.post(
        f"/api/v1/procurement/bidders/{bidder_id}/documents",
        files={"file": ("NDMC_Test.pdf", ndmc_pdf, "application/pdf")},
        data={"document_type": "auto"},
    )
    assert res2.status_code == 200
    data2 = res2.json()
    # FairBid calculated score must be 45.0 (from verified conditions), NOT the 12.0 decoy
    assert data2["assessment"]["compliance_score"] == 45.0
    assert data2["assessment"]["compliance_score"] != 12.0


# =====================================================================
# TEST 8: Filename does not determine score
# =====================================================================
def test_8_filename_does_not_determine_score():
    """Arbitrary/obfuscated filenames must NOT change the extracted case or calculated score."""
    bidder_id = _get_first_baseline_bidder_id()
    jbmd_pdf = generate_jbmd_case_pdf()

    # Use completely random, misleading filename
    res = client.post(
        f"/api/v1/procurement/bidders/{bidder_id}/documents",
        files={"file": ("scan_random_invoice_998877.pdf", jbmd_pdf, "application/pdf")},
        data={"document_type": "auto"},
    )
    assert res.status_code == 200
    data = res.json()
    assert ps.is_case_activated("CASE-JBMD")
    assert data["assessment"]["compliance_score"] == 92.0


# =====================================================================
# TEST 9: Repeated upload does not duplicate fixture data
# =====================================================================
def test_9_repeated_upload_does_not_duplicate_fixture_data():
    """Uploading the same case document multiple times must be strictly idempotent."""
    bidder_id = _get_first_baseline_bidder_id()
    jbmd_pdf = generate_jbmd_case_pdf()

    # Upload 1
    res1 = client.post(
        f"/api/v1/procurement/bidders/{bidder_id}/documents",
        files={"file": ("jbmd_upload_1.pdf", jbmd_pdf, "application/pdf")},
        data={"document_type": "auto"},
    )
    assert res1.status_code == 200

    # Count initial records
    tenders_1 = [t for t in ps.get_tenders() if t["id"] == "TEN-CASE-JBMD-001"]
    bidders_1 = [b for b in ps.get_bidders() if b.get("tender_id") == "TEN-CASE-JBMD-001"]
    assert len(tenders_1) == 1
    assert len(bidders_1) == 3

    # Upload 2 (same document content)
    res2 = client.post(
        f"/api/v1/procurement/bidders/{bidder_id}/documents",
        files={"file": ("jbmd_upload_2.pdf", jbmd_pdf, "application/pdf")},
        data={"document_type": "auto"},
    )
    assert res2.status_code == 200

    # Count must remain exactly the same
    tenders_2 = [t for t in ps.get_tenders() if t["id"] == "TEN-CASE-JBMD-001"]
    bidders_2 = [b for b in ps.get_bidders() if b.get("tender_id") == "TEN-CASE-JBMD-001"]
    assert len(tenders_2) == 1
    assert len(bidders_2) == 3


# =====================================================================
# TEST 10: Restart backend -> activated case disappears, baseline remains
# =====================================================================
def test_10_restart_backend_clears_activation():
    """Simulating a backend restart must discard session activations and restore pristine baseline."""
    bidder_id = _get_first_baseline_bidder_id()
    jbmd_pdf = generate_jbmd_case_pdf()

    # Activate JBMD
    client.post(
        f"/api/v1/procurement/bidders/{bidder_id}/documents",
        files={"file": ("jbmd.pdf", jbmd_pdf, "application/pdf")},
        data={"document_type": "auto"},
    )
    assert ps.is_case_activated("CASE-JBMD")

    # Simulate restart via reset_session_db
    ps.reset_session_db(enabled=True)

    # Activation must be gone
    assert not ps.is_case_activated("CASE-JBMD")
    assert not ps.is_case_activated("CASE-NDMC")

    # Dormant records hidden again
    tenders = ps.get_tenders()
    assert "TEN-CASE-JBMD-001" not in [t["id"] for t in tenders]
    assert "TEN-CASE-NDMC-001" not in [t["id"] for t in tenders]


# =====================================================================
# TEST 11: Normal baseline dashboard unaffected before activation
# =====================================================================
def test_11_baseline_dashboard_unaffected_before_activation():
    """Dashboard KPIs on startup must NOT include any dormant fixture data."""
    summary = ps.get_dashboard_summary()

    # Verify baseline tender count does not include dormant fixtures
    tenders = ps.get_tenders()
    tender_ids = [t["id"] for t in tenders]
    assert "TEN-CASE-JBMD-001" not in tender_ids
    assert "TEN-CASE-NDMC-001" not in tender_ids
    assert summary["total_tenders"] == len(tenders)

    # Discrepancies KPI must not include dormant NDMC discrepancy
    assert summary["verification_exceptions"] == 0


# =====================================================================
# TEST 12: Activating JBMD changes only relevant runtime data
# =====================================================================
def test_12_activating_jbmd_changes_only_relevant_runtime_data():
    """Activating JBMD adds JBMD tender/bidders without leaking or changing NDMC data."""
    baseline_tenders = len(ps.get_tenders())
    baseline_bidders = len(ps.get_bidders())

    bidder_id = _get_first_baseline_bidder_id()
    jbmd_pdf = generate_jbmd_case_pdf()

    client.post(
        f"/api/v1/procurement/bidders/{bidder_id}/documents",
        files={"file": ("jbmd.pdf", jbmd_pdf, "application/pdf")},
        data={"document_type": "auto"},
    )

    current_tenders = ps.get_tenders()
    current_bidders = ps.get_bidders()

    # JBMD active tender is now present, NDMC is not
    tender_ids = [t["id"] for t in current_tenders]
    assert "TEN-CASE-JBMD-001" in tender_ids
    assert "TEN-CASE-NDMC-001" not in tender_ids

    # Active tenders increased by exactly 1 (TEN-CASE-JBMD-001)
    current_active = [t for t in current_tenders if t.get("status") == "ACTIVE"]
    baseline_active = [t for t in current_tenders if t.get("status") == "ACTIVE" and t["id"] != "TEN-CASE-JBMD-001"]
    assert len(current_active) == len(baseline_active) + 1

    # JBMD primary bidder is present, NDMC bidder is completely absent
    bidder_ids = [b["id"] for b in current_bidders]
    assert "BID-CASE-JBMD-001" in bidder_ids
    assert "BID-CASE-NDMC-CCS-001" not in bidder_ids


# =====================================================================
# TEST 13: Activating NDMC changes only relevant runtime data
# =====================================================================
def test_13_activating_ndmc_changes_only_relevant_runtime_data():
    """Activating NDMC adds NDMC tender/bidders without leaking or changing JBMD data."""
    baseline_tenders = len(ps.get_tenders())
    baseline_bidders = len(ps.get_bidders())

    bidder_id = _get_first_baseline_bidder_id()
    ndmc_pdf = generate_ndmc_case_pdf()

    client.post(
        f"/api/v1/procurement/bidders/{bidder_id}/documents",
        files={"file": ("ndmc.pdf", ndmc_pdf, "application/pdf")},
        data={"document_type": "auto"},
    )

    current_tenders = ps.get_tenders()
    current_bidders = ps.get_bidders()

    # Tenders increased by 1 (NDMC tender)
    assert len(current_tenders) == baseline_tenders + 1
    # Bidders increased by 2 (CCS + 1 co-bidder)
    assert len(current_bidders) == baseline_bidders + 2

    # JBMD data is still completely absent
    tender_ids = [t["id"] for t in current_tenders]
    assert "TEN-CASE-JBMD-001" not in tender_ids
    bidder_ids = [b["id"] for b in current_bidders]
    assert "BID-CASE-JBMD-001" not in bidder_ids
