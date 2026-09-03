import pytest
import os
from fastapi.testclient import TestClient

from app.main import app
from app.core.procurement_store import get_db, init_db, create_bidder_record
from app.core.security import get_current_user

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_test_bidder():
    app.dependency_overrides[get_current_user] = lambda: {"id": "test-officer", "email": "officer@nic.in", "role": "admin"}
    init_db()
    with get_db() as conn:
        conn.execute("DELETE FROM bidders WHERE id = 'TEST-BID-FAIRBID'")
        conn.execute("DELETE FROM documents WHERE case_id = 'TEST-BID-FAIRBID'")
        conn.execute("DELETE FROM bidder_documents WHERE bidder_id = 'TEST-BID-FAIRBID'")
    create_bidder_record("TEN-2026-001", {
        "id": "TEST-BID-FAIRBID",
        "legal_name": "Temporary Bidder Initial State",
        "status": "PENDING_DOCUMENTS"
    })
    yield
    app.dependency_overrides.clear()
    with get_db() as conn:
        conn.execute("DELETE FROM bidders WHERE id = 'TEST-BID-FAIRBID'")
        conn.execute("DELETE FROM documents WHERE case_id = 'TEST-BID-FAIRBID'")
        conn.execute("DELETE FROM bidder_documents WHERE bidder_id = 'TEST-BID-FAIRBID'")


def test_upload_fairbid_document_and_verify_single_source_of_truth():
    pdf_path = os.path.join(os.path.dirname(__file__), "..", "synthetic_docs", "FairBid_TN_RO_Simulation_01.pdf")
    with open(pdf_path, "rb") as f:
        file_bytes = f.read()

    # Upload Doc A
    response = client.post(
        "/api/v1/procurement/bidders/TEST-BID-FAIRBID/documents",
        files={"file": ("FairBid_TN_RO_Simulation_01.pdf", file_bytes, "application/pdf")},
        data={"document_type": "auto"}
    )
    assert response.status_code == 200, response.text
    data = response.json()

    # 1. Verify document classification
    assert data["document_type"] == "Retail Outlet Dealership / Bid Compliance Simulation"

    # 2. Verify verification record
    vr = data["verification_record"]
    assert vr is not None
    assert vr["opportunity"]["state"] == "Tamil Nadu"
    assert vr["opportunity"]["district"] == "Tiruvallur"
    assert vr["opportunity"]["oil_marketing_company"] == "Indian Oil Corporation Ltd. (IOCL)"
    assert "STATE" not in vr["opportunity"]["oil_marketing_company"]
    assert vr["opportunity"]["location"] == "Gummidipoondi to Elavoor on (LHS on NH 16)"
    assert vr["opportunity"]["road_highway"] == "NH 16"
    assert vr["opportunity"]["location_serial_number"] == "418"
    assert vr["commercial"]["security_deposit"] == "Rs. 3 lakh"
    assert vr["bidder"]["bidder_name"] == "Southern Corridor Energy Services Pvt. Ltd. (FairBid Synthetic Bidder)"
    assert vr["bidder"]["gstin"] == "FAIRBID-GSTIN-TN-001"
    assert vr["bidder"]["pan"] == "FAIRBID-PAN-TST001"
    assert vr["bidder"]["udyam_registration_number"] == "FAIRBID-UDYAM-TN-001"
    assert vr["compliance"]["blacklisting_debarment"] == "NOT BLACKLISTED / NOT DEBARRED"

    # 3. Verify bidder was updated in DB from single source of truth
    bidder_res = client.get("/api/v1/procurement/bidders/TEST-BID-FAIRBID")
    assert bidder_res.status_code == 200
    b_data = bidder_res.json()
    assert b_data["bidder"]["legal_name"] == "Southern Corridor Energy Services Pvt. Ltd. (FairBid Synthetic Bidder)"
    assert b_data["bidder"]["gstin"] == "FAIRBID-GSTIN-TN-001"
    assert b_data["bidder"]["pan"] == "FAIRBID-PAN-TST001"
    assert b_data["bidder"]["udyam_number"] == "FAIRBID-UDYAM-TN-001"
    assert b_data["verification_record"] is not None
    assert b_data["verification_record"]["opportunity"]["state"] == "Tamil Nadu"

    # 4. Verify compliance assessment
    reqs = b_data.get("requirements") or []
    gst_req = next((r for r in reqs if r.get("requirement_id") in ("GST_REQUIRED", "GST_REGISTRATION")), None)
    assert gst_req is not None, f"GST requirement not found in {reqs}"
    assert gst_req["status"] == "COMPLIANT"

    pan_req = next((r for r in reqs if r.get("requirement_id") in ("PAN_REQUIRED", "PAN_CARD")), None)
    assert pan_req is not None, f"PAN requirement not found in {reqs}"
    assert pan_req["status"] == "COMPLIANT"

    oem_req = next((r for r in reqs if r.get("requirement_id") == "OEM_AUTHORIZATION"), None)
    assert oem_req is not None, f"OEM_AUTHORIZATION requirement not found in {reqs}"
    assert oem_req["status"] == "NOT_APPLICABLE"


def test_upload_doc_b_replaces_state_without_leakage():
    pdf_b_path = os.path.join(os.path.dirname(__file__), "..", "synthetic_docs", "FairBid_MH_RO_Simulation_02.pdf")
    with open(pdf_b_path, "rb") as f:
        file_bytes = f.read()

    response = client.post(
        "/api/v1/procurement/bidders/TEST-BID-FAIRBID/documents",
        files={"file": ("FairBid_MH_RO_Simulation_02.pdf", file_bytes, "application/pdf")},
        data={"document_type": "auto"}
    )
    assert response.status_code == 200
    vr = response.json()["verification_record"]
    assert vr["opportunity"]["state"] == "Maharashtra"
    assert vr["opportunity"]["district"] == "Pune"
    assert vr["opportunity"]["oil_marketing_company"] == "Bharat Petroleum Corporation Ltd. (BPCL)"
    assert vr["bidder"]["bidder_name"] == "Western Express Fuels & Energy Pvt. Ltd. (FairBid Synthetic Bidder)"
    assert vr["bidder"]["gstin"] == "FAIRBID-GSTIN-MH-002"
