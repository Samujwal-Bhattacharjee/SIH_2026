"""
Integration and Persistence Tests for Procurement Pipeline (SIH26100)
======================================================================
Tests:
1. Create and read bidder from persistent store
2. Upload document and run OCR extraction
3. Persist document record and extracted fields
4. Trigger compliance recalculation
5. Persist compliance assessment and discrepancies
6. Persist immutable audit events
7. Query live dashboard aggregates
"""
import io
import fitz
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.security import get_current_user
from app.core import procurement_store as ps


@pytest.fixture
def auth_client():
    app.dependency_overrides[get_current_user] = lambda: {
        "id": "usr-test-1",
        "name": "Testing Procurement Officer",
        "email": "officer@gov.in",
        "role": "OPERATIONS_OFFICER"
    }
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


def test_persistent_tenders_and_bidders(auth_client):
    # 1. Read tenders
    res = auth_client.get("/api/v1/procurement/tenders")
    assert res.status_code == 200
    tenders = res.json()
    assert len(tenders) >= 1
    t_id = tenders[0]["id"]

    # 2. Create bidder
    bidder_payload = {
        "legal_name": "Antigravity Systems Pvt. Ltd.",
        "gstin": "29AABCA1234F1Z5",
        "pan": "AABCA1234F",
        "udyam_number": "UDYAM-KR-03-0012345"
    }
    create_res = auth_client.post(f"/api/v1/procurement/tenders/{t_id}/bidders", json=bidder_payload)
    assert create_res.status_code == 201
    created_bidder = create_res.json()
    bidder_id = created_bidder["id"]
    assert created_bidder["legal_name"] == "Antigravity Systems Pvt. Ltd."

    # 3. Read bidder detail
    detail_res = auth_client.get(f"/api/v1/procurement/bidders/{bidder_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["bidder"]["id"] == bidder_id


def test_document_upload_ocr_compliance_flow(auth_client):
    # Get a bidder
    bidders = ps.get_bidders()
    assert len(bidders) > 0
    bidder_id = bidders[0]["id"]

    # Create synthetic PDF in memory with valid GSTIN
    doc = fitz.open()
    page = doc.new_page()
    text = (
        "GOVERNMENT OF INDIA - GST REGISTRATION\n"
        "GSTIN: 27AABCT4180Q1ZV\n"
        "Legal Name: Triveni Infotech Solutions Pvt. Ltd.\n"
        "Date of Issue: 01/01/2022\n"
    )
    page.insert_text((50, 72), text, fontsize=12)
    pdf_bytes = doc.tobytes()
    doc.close()

    # Upload document
    upload_res = auth_client.post(
        f"/api/v1/procurement/bidders/{bidder_id}/documents",
        files={"file": ("Sample_GSTIN_Cert.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
        data={"document_type": "auto"}
    )
    assert upload_res.status_code == 200
    data = upload_res.json()

    # Verify document classification and field extraction
    assert data["document_type"] == "GST Certificate"
    assert "extracted_fields" in data
    assert any(f["key"] == "gstin" and "27AABCT4180Q1ZV" in f["value"] for f in data["extracted_fields"])

    # Verify compliance assessment was recalculated
    assert "assessment" in data
    assert "compliance_score" in data["assessment"]
    assert data["bidder"]["documents_count"] >= 1


def test_officer_decision_and_audit_trail(auth_client):
    bidders = ps.get_bidders()
    bidder_id = bidders[0]["id"]

    # Record decision
    decision_payload = {
        "decision": "QUALIFIED",
        "note": "Fully verified and approved by senior procurement committee."
    }
    dec_res = auth_client.post(f"/api/v1/procurement/bidders/{bidder_id}/decision", json=decision_payload)
    assert dec_res.status_code == 200
    updated_bidder = dec_res.json()
    assert updated_bidder["status"] == "QUALIFIED"
    assert updated_bidder["officer_decision"] == "QUALIFIED"

    # Verify audit event was persisted
    audit_res = auth_client.get(f"/api/v1/procurement/audit?bidder_id={bidder_id}")
    assert audit_res.status_code == 200
    audit_events = audit_res.json()
    assert len(audit_events) >= 1
    assert any("Officer decision" in e["action"] for e in audit_events)


def test_dashboard_metrics_persistence(auth_client):
    dash_res = auth_client.get("/api/v1/procurement/dashboard")
    assert dash_res.status_code == 200
    metrics = dash_res.json()
    assert "active_tenders" in metrics
    assert "bids_under_verification" in metrics
    assert "high_risk_bidders" in metrics
    assert "verification_exceptions" in metrics
    assert "bidders" in metrics
    assert isinstance(metrics["bidders"], list)


# ============================================================
# OCR CONFIDENCE REGRESSION TESTS (DAY 3 / STEP 3)
# ============================================================

def test_safe_float_conversion():
    """Unit tests for _safe_float handling all possible OCR confidence formats."""
    from app.api.routes.procurement import _safe_float

    # 1. Valid numeric confidence (float and int)
    assert _safe_float(0.95) == 0.95
    assert _safe_float(1.0) == 1.0
    assert _safe_float(0) == 0.0
    assert _safe_float(1) == 1.0

    # 2. Numeric string confidence
    assert _safe_float("0.85") == 0.85
    assert _safe_float("1.0") == 1.0
    assert _safe_float("95.5") == 95.5

    # 3. None
    assert _safe_float(None) == 0.0
    assert _safe_float(None, default=0.5) == 0.5

    # 4. Malformed list / dict / object values
    assert _safe_float([0.9]) == 0.0
    assert _safe_float({"score": 90}) == 0.0
    assert _safe_float((1, 2)) == 0.0

    # 5. Invalid strings, NaN, Infinity
    assert _safe_float("invalid_confidence") == 0.0
    assert _safe_float("") == 0.0
    assert _safe_float("nan") == 0.0
    assert _safe_float("inf") == 0.0
    assert _safe_float("-inf") == 0.0
    assert _safe_float(float("nan")) == 0.0
    assert _safe_float(float("inf")) == 0.0


def test_ocr_upload_with_valid_numeric_confidence(auth_client, monkeypatch):
    """Prove pipeline handles valid numeric float confidence correctly."""
    bidders = ps.get_bidders()
    bidder_id = bidders[0]["id"]

    mock_ocr = {
        "extractedFields": [{"key": "gstin", "value": "27AABCT4180Q1ZV", "confidence": 0.95, "isExtracted": True, "label": "GSTIN"}],
        "extractedText": "Government of India GSTIN: 27AABCT4180Q1ZV",
        "confidenceScore": 0.95,
        "ocrEngine": "PyMuPDF-digital",
    }
    monkeypatch.setattr("app.api.routes.procurement.process_ocr_from_bytes", lambda *args, **kwargs: mock_ocr)

    doc = fitz.open()
    doc.new_page().insert_text((50, 72), "GST Certificate Content", fontsize=12)
    pdf_bytes = doc.tobytes()
    doc.close()

    res = auth_client.post(
        f"/api/v1/procurement/bidders/{bidder_id}/documents",
        files={"file": ("Valid_Float_Conf.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
        data={"document_type": "auto"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["confidence"] == 0.95
    assert body["doc_record"]["ocr_confidence"] == 0.95
    assert body["doc_record"]["ocr_status"] == "COMPLETED"
    assert "assessment" in body


def test_ocr_upload_with_numeric_string_confidence(auth_client, monkeypatch):
    """Prove pipeline converts numeric-string confidence to float without crashing."""
    bidders = ps.get_bidders()
    bidder_id = bidders[0]["id"]

    mock_ocr = {
        "extractedFields": [{"key": "pan", "value": "AABCT4180Q", "confidence": 0.88, "isExtracted": True, "label": "PAN"}],
        "extractedText": "Income Tax PAN Card AABCT4180Q",
        "confidenceScore": "0.88",
        "ocrEngine": "Tesseract-OCR",
    }
    monkeypatch.setattr("app.api.routes.procurement.process_ocr_from_bytes", lambda *args, **kwargs: mock_ocr)

    doc = fitz.open()
    doc.new_page().insert_text((50, 72), "PAN Card Content", fontsize=12)
    pdf_bytes = doc.tobytes()
    doc.close()

    res = auth_client.post(
        f"/api/v1/procurement/bidders/{bidder_id}/documents",
        files={"file": ("String_Conf.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
        data={"document_type": "auto"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["confidence"] == 0.88
    assert body["doc_record"]["ocr_confidence"] == 0.88
    assert body["doc_record"]["ocr_status"] == "COMPLETED"


def test_ocr_upload_with_none_confidence(auth_client, monkeypatch):
    """Prove pipeline handles confidenceScore=None safely without raising TypeError."""
    bidders = ps.get_bidders()
    bidder_id = bidders[0]["id"]

    mock_ocr = {
        "extractedFields": [{"key": "udyamNumber", "value": "UDYAM-MH-19-0042186", "confidence": 0.8, "isExtracted": True, "label": "Udyam Number"}],
        "extractedText": "Udyam Certificate UDYAM-MH-19-0042186",
        "confidenceScore": None,
        "ocrEngine": "PyMuPDF-digital",
    }
    monkeypatch.setattr("app.api.routes.procurement.process_ocr_from_bytes", lambda *args, **kwargs: mock_ocr)

    doc = fitz.open()
    doc.new_page().insert_text((50, 72), "Udyam Content", fontsize=12)
    pdf_bytes = doc.tobytes()
    doc.close()

    res = auth_client.post(
        f"/api/v1/procurement/bidders/{bidder_id}/documents",
        files={"file": ("None_Conf.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
        data={"document_type": "auto"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["confidence"] == 0.0
    assert body["doc_record"]["ocr_confidence"] == 0.0
    assert body["doc_record"]["ocr_status"] == "COMPLETED"


def test_ocr_upload_with_missing_confidence_score(auth_client, monkeypatch):
    """Prove pipeline handles ocr_result missing confidenceScore key completely."""
    bidders = ps.get_bidders()
    bidder_id = bidders[0]["id"]

    mock_ocr = {
        "extractedFields": [],
        "extractedText": "Plain document without confidence field",
        "ocrEngine": "PyMuPDF-digital",
    }
    monkeypatch.setattr("app.api.routes.procurement.process_ocr_from_bytes", lambda *args, **kwargs: mock_ocr)

    doc = fitz.open()
    doc.new_page().insert_text((50, 72), "Plain Document", fontsize=12)
    pdf_bytes = doc.tobytes()
    doc.close()

    res = auth_client.post(
        f"/api/v1/procurement/bidders/{bidder_id}/documents",
        files={"file": ("Missing_Conf.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
        data={"document_type": "auto"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["confidence"] == 0.0
    assert body["doc_record"]["ocr_confidence"] == 0.0


def test_ocr_upload_with_malformed_list_and_dict_confidence(auth_client, monkeypatch):
    """Prove pipeline handles list, dict, and arbitrary malformed objects as confidence."""
    bidders = ps.get_bidders()
    bidder_id = bidders[0]["id"]

    # Test list confidence
    mock_ocr_list = {
        "extractedFields": [],
        "extractedText": "List confidence test",
        "confidenceScore": [0.95, 0.92],
        "ocrEngine": "PyMuPDF-digital",
    }
    monkeypatch.setattr("app.api.routes.procurement.process_ocr_from_bytes", lambda *args, **kwargs: mock_ocr_list)

    doc = fitz.open()
    doc.new_page().insert_text((50, 72), "List Conf", fontsize=12)
    pdf_bytes = doc.tobytes()
    doc.close()

    res = auth_client.post(
        f"/api/v1/procurement/bidders/{bidder_id}/documents",
        files={"file": ("List_Conf.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
        data={"document_type": "auto"},
    )
    assert res.status_code == 200
    assert res.json()["confidence"] == 0.0

    # Test dict confidence
    mock_ocr_dict = {
        "extractedFields": [],
        "extractedText": "Dict confidence test",
        "confidenceScore": {"value": 0.95, "unit": "%"},
        "ocrEngine": "PyMuPDF-digital",
    }
    monkeypatch.setattr("app.api.routes.procurement.process_ocr_from_bytes", lambda *args, **kwargs: mock_ocr_dict)

    res2 = auth_client.post(
        f"/api/v1/procurement/bidders/{bidder_id}/documents",
        files={"file": ("Dict_Conf.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
        data={"document_type": "auto"},
    )
    assert res2.status_code == 200
    assert res2.json()["confidence"] == 0.0

