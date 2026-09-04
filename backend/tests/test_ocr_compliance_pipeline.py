import os
import pytest
from app.services.fairbid_extractor import extract_fairbid_canonical
from app.services.document_service import process_ocr_from_bytes
from app.services.procurement_service import run_full_verification, DEFAULT_TENDER_REQUIREMENTS

HIGH_RISK_PATH = os.path.join(os.path.dirname(__file__), "..", "synthetic_docs", "FairBid_High_Risk_Compliance_OCR_Test.pdf")
LOW_COMP_PATH = os.path.join(os.path.dirname(__file__), "..", "synthetic_docs", "FairBid_Synthetic_Low_Compliance_OCR_Test.pdf")
COMPLIANT_PATH = os.path.join(os.path.dirname(__file__), "..", "synthetic_docs", "FairBid_TN_RO_Simulation_01.pdf")


def test_high_risk_pdf_evaluation():
    """Verify that FairBid_High_Risk_Compliance_OCR_Test.pdf is evaluated strictly on OCR evidence."""
    with open(HIGH_RISK_PATH, "rb") as f:
        file_bytes = f.read()

    ocr_res = process_ocr_from_bytes(file_bytes, HIGH_RISK_PATH, "application/pdf")
    canon = extract_fairbid_canonical(ocr_res["extractedText"], filename=HIGH_RISK_PATH)

    # 1. Declared source score must be extracted cleanly
    assert canon["compliance"]["declared_source_score"] == "86 / 100"

    # 2. Key OCR fields must be extracted accurately without boundary leakage
    assert "EXPIRED" in str(canon["bidder"]["land_availability"]).upper()
    assert "INCOMPLETE" in str(canon["compliance"]["application_completeness"]).upper()
    assert "INSUFFICIENT" in str(canon["bidder"]["experience_status"]).upper()
    assert "NOT ESTABLISHED" in str(canon["bidder"]["financial_eligibility"]).upper()

    # 3. Verification pipeline must compute low score and EXCEPTION_FOUND
    mock_doc = {
        "id": "doc-hr-1",
        "file_name": HIGH_RISK_PATH,
        "document_type": "RETAIL OUTLET DEALERSHIP APPLICATION DOSSIER",
        "extracted_fields": canon["extracted_fields"],
        "ocr_status": "SUCCESS",
    }
    bidder = {"id": "b-hr-1", "legal_name": "High Risk Bidder"}
    res = run_full_verification(bidder, DEFAULT_TENDER_REQUIREMENTS, [mock_doc])

    # Declared source score (86) must NEVER be the FairBid calculated score
    assert res["compliance_score"] < 40.0
    assert res["declared_source_score"] == "86 / 100"
    assert res["compliance_status"] == "EXCEPTION_FOUND"
    assert res["compliance_risk_level"] in ("HIGH", "CRITICAL")
    assert res["mandatory_failures"] >= 3


def test_low_compliance_pdf_evaluation():
    """Verify that FairBid_Synthetic_Low_Compliance_OCR_Test.pdf is evaluated strictly on OCR evidence."""
    with open(LOW_COMP_PATH, "rb") as f:
        file_bytes = f.read()

    ocr_res = process_ocr_from_bytes(file_bytes, LOW_COMP_PATH, "application/pdf")
    canon = extract_fairbid_canonical(ocr_res["extractedText"], filename=LOW_COMP_PATH)

    # 1. Declared source score must be extracted cleanly
    assert canon["compliance"]["declared_source_score"] == "34 / 100"

    # 2. Blacklisting declaration must be recognized as absent
    assert "NOT PRESENT" in str(canon["compliance"]["blacklisting_debarment"]).upper()

    # 3. Verification pipeline must compute low score and EXCEPTION_FOUND
    mock_doc = {
        "id": "doc-lc-1",
        "file_name": LOW_COMP_PATH,
        "document_type": "RETAIL OUTLET DEALERSHIP APPLICATION DOSSIER",
        "extracted_fields": canon["extracted_fields"],
        "ocr_status": "SUCCESS",
    }
    bidder = {"id": "b-lc-1", "legal_name": "Low Compliance Bidder"}
    res = run_full_verification(bidder, DEFAULT_TENDER_REQUIREMENTS, [mock_doc])

    assert res["compliance_score"] < 40.0
    assert res["declared_source_score"] == "34 / 100"
    assert res["compliance_status"] == "EXCEPTION_FOUND"
    assert res["compliance_risk_level"] == "CRITICAL"
    assert res["mandatory_failures"] >= 4


def test_score_differentiation_between_high_risk_and_low_compliance():
    """Verify that high-risk and low-compliance PDFs produce materially different, distinct scores."""
    with open(HIGH_RISK_PATH, "rb") as f:
        hr_ocr = process_ocr_from_bytes(f.read(), "hr.pdf", "application/pdf")
    with open(LOW_COMP_PATH, "rb") as f:
        lc_ocr = process_ocr_from_bytes(f.read(), "lc.pdf", "application/pdf")

    hr_canon = extract_fairbid_canonical(hr_ocr["extractedText"], filename="hr.pdf")
    lc_canon = extract_fairbid_canonical(lc_ocr["extractedText"], filename="lc.pdf")

    hr_res = run_full_verification({"id": "b-1", "legal_name": "B1"}, DEFAULT_TENDER_REQUIREMENTS, [{
        "id": "d-1", "file_name": "hr.pdf", "document_type": "DEALERSHIP", "extracted_fields": hr_canon["extracted_fields"], "ocr_status": "SUCCESS"
    }])

    lc_res = run_full_verification({"id": "b-2", "legal_name": "B2"}, DEFAULT_TENDER_REQUIREMENTS, [{
        "id": "d-2", "file_name": "lc.pdf", "document_type": "DEALERSHIP", "extracted_fields": lc_canon["extracted_fields"], "ocr_status": "SUCCESS"
    }])

    # Must produce distinct scores (e.g., 10.0 vs 3.9) rather than collapsing to a default
    assert hr_res["compliance_score"] != lc_res["compliance_score"]
    # Low compliance has absent blacklisting declaration (score 0) while high-risk has present unverified declaration (score 50)
    assert hr_res["compliance_score"] > lc_res["compliance_score"]


def test_filename_does_not_determine_compliance():
    """Verify that changing the filename of a high-risk PDF to 'Compliant_Perfect.pdf' does NOT fool the engine."""
    with open(HIGH_RISK_PATH, "rb") as f:
        file_bytes = f.read()

    ocr_res = process_ocr_from_bytes(file_bytes, "Compliant_Perfect_100_Score.pdf", "application/pdf")
    canon = extract_fairbid_canonical(ocr_res["extractedText"], filename="Compliant_Perfect_100_Score.pdf")

    mock_doc = {
        "id": "doc-spoofed",
        "file_name": "Compliant_Perfect_100_Score.pdf",
        "document_type": "RETAIL OUTLET DEALERSHIP APPLICATION DOSSIER",
        "extracted_fields": canon["extracted_fields"],
        "ocr_status": "SUCCESS",
    }
    res = run_full_verification({"id": "b-sp", "legal_name": "Spoofed Name"}, DEFAULT_TENDER_REQUIREMENTS, [mock_doc])

    assert res["compliance_score"] < 40.0
    assert res["compliance_status"] == "EXCEPTION_FOUND"
