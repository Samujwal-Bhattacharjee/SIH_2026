"""
Unit and Integration Tests for SIH26100 Procurement Compliance Platform
========================================================================
Tests:
1. Field Extraction (GSTIN, PAN, Udyam, OEM, CIN, Expiry, Turnover, Blacklisting)
2. Document Classification
3. Compliance Check Rules
4. Cross-Document Validation (Name mismatch, GSTIN mismatch)
5. Compliance Score and Risk Calculation
6. Actionable Recommendation Generation
7. Full Verification Pipeline
"""
import pytest
from app.services.ocr_service import (
    extract_procurement_fields,
    classify_document_type,
)
from app.services.procurement_service import (
    DEFAULT_TENDER_REQUIREMENTS,
    run_compliance_checks,
    run_cross_document_validation,
    calculate_compliance_score,
    calculate_risk_level,
    generate_recommendations,
    run_full_verification,
)


class TestFieldExtraction:
    def test_extract_gstin(self):
        text = "Government of India GST Certificate\nGSTIN: 27AABCT4180Q1ZV\nLegal Name: ABC Tech"
        fields = extract_procurement_fields(text)
        gstin_f = next((f for f in fields if f["key"] == "gstin"), None)
        assert gstin_f is not None
        assert gstin_f["value"] == "27AABCT4180Q1ZV"
        assert gstin_f["confidence"] >= 0.9

    def test_extract_pan(self):
        text = "Income Tax Department\nPermanent Account Number: AABCT4180Q\nName: ABC Tech Pvt Ltd"
        fields = extract_procurement_fields(text)
        pan_f = next((f for f in fields if f["key"] == "pan"), None)
        assert pan_f is not None
        assert pan_f["value"] == "AABCT4180Q"

    def test_extract_udyam(self):
        text = "UDYAM REGISTRATION CERTIFICATE\nUDYAM-MH-19-0042186\nNAME OF ENTERPRISE: ABC TECH"
        fields = extract_procurement_fields(text)
        udyam_f = next((f for f in fields if f["key"] == "udyamNumber"), None)
        assert udyam_f is not None
        assert udyam_f["value"] == "UDYAM-MH-19-0042186"

    def test_extract_oem_reference(self):
        text = "Manufacturer Authorization Form\nOEM Auth Ref No: OEM-AUTH/26/019\nValid up to: 31/12/2026"
        fields = extract_procurement_fields(text)
        oem_f = next((f for f in fields if f["key"] == "oemReference"), None)
        expiry_f = next((f for f in fields if f["key"] == "expiryDate"), None)
        assert oem_f is not None
        assert "OEM-AUTH/26/019" in oem_f["value"]
        assert expiry_f is not None
        assert expiry_f["value"] == "31/12/2026"

    def test_extract_blacklisting_declaration(self):
        text = "We hereby declare that our firm has not been blacklisted or debarred by any government department."
        fields = extract_procurement_fields(text)
        blk_f = next((f for f in fields if f["key"] == "blacklistingDeclaration"), None)
        assert blk_f is not None
        assert "Declaration found" in blk_f["value"]


class TestDocumentClassification:
    def test_classify_gst(self):
        doc_type = classify_document_type("Goods and Services Tax GST Registration Certificate GSTIN 27AABCT4180Q1ZV")
        assert doc_type == "GST Certificate"

    def test_classify_pan(self):
        doc_type = classify_document_type("Income Tax Department Permanent Account Number PAN Card AABCT4180Q")
        assert doc_type == "PAN Card"

    def test_classify_udyam(self):
        doc_type = classify_document_type("Udyam Registration Certificate UDYAM-MH-19-0042186 Ministry of MSME")
        assert doc_type == "Udyam/MSME Certificate"

    def test_classify_oem(self):
        doc_type = classify_document_type("Manufacturer Authorization Form OEM Authorization MAF Ref 2026")
        assert doc_type == "OEM Authorization"


class TestComplianceEngine:
    def test_compliant_bidder_checks(self):
        docs = [
            {
                "id": "d1",
                "document_type": "GST Certificate",
                "extracted_fields": [
                    {"key": "gstin", "value": "27AABCT4180Q1ZV"},
                    {"key": "legalName", "value": "Triveni Infotech Solutions Pvt Ltd"},
                ],
            },
            {
                "id": "d2",
                "document_type": "PAN Card",
                "extracted_fields": [
                    {"key": "pan", "value": "AABCT4180Q"},
                    {"key": "legalName", "value": "Triveni Infotech Solutions Pvt Ltd"},
                ],
            },
            {
                "id": "d3",
                "document_type": "Udyam/MSME Certificate",
                "extracted_fields": [
                    {"key": "udyamNumber", "value": "UDYAM-MH-19-0042186"},
                ],
            },
            {
                "id": "d4",
                "document_type": "OEM Authorization",
                "extracted_fields": [
                    {"key": "oemReference", "value": "OEM-2026-01"},
                    {"key": "expiryDate", "value": "31/12/2026"},
                ],
            },
            {
                "id": "d5",
                "document_type": "Non-Blacklisting Declaration",
                "extracted_fields": [
                    {"key": "blacklistingDeclaration", "value": "Declaration found"},
                ],
            },
        ]
        bidder = {"id": "b1", "legal_name": "Triveni Infotech Solutions Pvt Ltd"}
        checks = run_compliance_checks(DEFAULT_TENDER_REQUIREMENTS, docs, bidder)
        
        gst_check = next(c for c in checks if c["requirement_id"] == "GST_REQUIRED")
        pan_check = next(c for c in checks if c["requirement_id"] == "PAN_REQUIRED")
        udyam_check = next(c for c in checks if c["requirement_id"] == "UDYAM_REQUIRED")
        oem_check = next(c for c in checks if c["requirement_id"] == "OEM_AUTHORIZATION")
        
        assert gst_check["status"] == "COMPLIANT"
        assert pan_check["status"] == "COMPLIANT"
        assert udyam_check["status"] == "COMPLIANT"
        assert oem_check["status"] == "COMPLIANT"

    def test_missing_oem_penalty(self):
        # Bidder has GST and PAN, but no OEM authorization
        docs = [
            {
                "id": "d1",
                "document_type": "GST Certificate",
                "extracted_fields": [{"key": "gstin", "value": "27AABCT4180Q1ZV"}],
            },
            {
                "id": "d2",
                "document_type": "PAN Card",
                "extracted_fields": [{"key": "pan", "value": "AABCT4180Q"}],
            },
        ]
        bidder = {"id": "b1", "legal_name": "Test Bidder"}
        checks = run_compliance_checks(DEFAULT_TENDER_REQUIREMENTS, docs, bidder)
        oem_check = next(c for c in checks if c["requirement_id"] == "OEM_AUTHORIZATION")
        assert oem_check["status"] == "NON_COMPLIANT"
        assert oem_check["severity"] == "HIGH"


class TestCrossDocumentValidation:
    def test_name_mismatch_detection(self):
        docs = [
            {
                "id": "d1",
                "document_type": "GST Certificate",
                "extracted_fields": [{"key": "legalName", "value": "Narmada Systems Private Limited"}],
            },
            {
                "id": "d2",
                "document_type": "PAN Card",
                "extracted_fields": [{"key": "legalName", "value": "Narmada Services Limited"}],
            },
        ]
        bidder = {"id": "b2", "legal_name": "Narmada Systems Private Limited"}
        discrepancies = run_cross_document_validation(docs, bidder)
        assert len(discrepancies) > 0
        name_disc = next((d for d in discrepancies if "NAME_MISMATCH" in d["discrepancy_type"]), None)
        assert name_disc is not None
        assert "inconsistency detected" in name_disc["description"].lower()

    def test_gstin_mismatch_detection(self):
        docs = [
            {
                "id": "d1",
                "document_type": "GST Certificate",
                "extracted_fields": [{"key": "gstin", "value": "27AABCT4180Q1ZV"}],
            },
            {
                "id": "d2",
                "document_type": "Invoice / Declaration",
                "extracted_fields": [{"key": "gstin", "value": "27AABCT4180Q1ZW"}],
            },
        ]
        bidder = {"id": "b3", "legal_name": "ABC Tech"}
        discrepancies = run_cross_document_validation(docs, bidder)
        gstin_disc = next((d for d in discrepancies if d["discrepancy_type"] == "GSTIN_MISMATCH"), None)
        assert gstin_disc is not None
        assert gstin_disc["severity"] == "CRITICAL"


class TestScoringAndRisk:
    def test_risk_calculation(self):
        # 1. High score low risk
        score_res = calculate_compliance_score([
            {"status": "COMPLIANT", "category": "STATUTORY", "weight": 1.0, "is_mandatory": True},
            {"status": "COMPLIANT", "category": "TECHNICAL", "weight": 1.0, "is_mandatory": True},
        ])
        risk_res = calculate_risk_level(score_res["score"], [], [])
        assert risk_res["risk_level"] == "LOW"

        # 2. Score with critical discrepancy forces HIGH risk
        risk_with_disc = calculate_risk_level(90.0, [{"severity": "CRITICAL"}], [])
        assert risk_with_disc["risk_level"] == "HIGH"


class TestFullPipeline:
    def test_full_verification_pipeline(self):
        docs = [
            {
                "id": "d1",
                "document_type": "GST Certificate",
                "extracted_fields": [
                    {"key": "gstin", "value": "27AABCT4180Q1ZV"},
                    {"key": "legalName", "value": "Triveni Infotech Solutions Pvt Ltd"},
                ],
            },
            {
                "id": "d2",
                "document_type": "PAN Card",
                "extracted_fields": [
                    {"key": "pan", "value": "AABCT4180Q"},
                    {"key": "legalName", "value": "Triveni Infotech Solutions Pvt Ltd"},
                ],
            },
        ]
        bidder = {"id": "b1", "legal_name": "Triveni Infotech Solutions Pvt Ltd"}
        assessment = run_full_verification(bidder, DEFAULT_TENDER_REQUIREMENTS, docs)
        
        assert "compliance_score" in assessment
        assert "risk_level" in assessment
        assert "checks" in assessment
        assert "recommendations" in assessment
        assert len(assessment["recommendations"]) > 0
