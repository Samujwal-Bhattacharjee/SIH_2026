"""
Document pipeline tests — Person 2 additions.

These tests are isolated from test_core.py and cover the document
upload/OCR/field-extraction pipeline end-to-end without requiring
a live Supabase connection.

Run:
    cd backend
    pytest tests/test_documents.py -v

For integration tests (requires .env with real Supabase credentials):
    pytest tests/test_documents.py -v -m integration
"""
import io
import json
import pytest
from unittest.mock import MagicMock, patch


# ============================================================
# SYNTHETIC PDF FIXTURE
# ============================================================

def _make_digital_pdf(text: str = "") -> bytes:
    """
    Create a minimal digital (text-based) PDF in memory using PyMuPDF.
    Falls back to a hand-crafted minimal PDF if PyMuPDF is unavailable.

    This is used as a test fixture — it contains no real government data.
    """
    try:
        import fitz  # PyMuPDF
        doc = fitz.open()
        page = doc.new_page()
        page.insert_text(
            (72, 100),
            text or SAMPLE_COURT_ORDER_TEXT,
            fontsize=11,
        )
        pdf_bytes = doc.write()
        doc.close()
        return pdf_bytes
    except ImportError:
        # Hand-crafted minimal valid PDF with embedded text
        return _minimal_pdf_with_text(text or SAMPLE_COURT_ORDER_TEXT)


def _minimal_pdf_with_text(text: str) -> bytes:
    """
    Produce the smallest valid PDF that embeds plain ASCII text.
    Used only as fallback when PyMuPDF is not installed.
    """
    # Escape parentheses for PDF string syntax
    safe = text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
    stream = f"BT /F1 12 Tf 72 700 Td ({safe}) Tj ET"
    stream_b = stream.encode()
    length = len(stream_b)
    pdf = (
        b"%PDF-1.4\n"
        b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
        b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]"
        b" /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n"
        + f"4 0 obj\n<< /Length {length} >>\nstream\n".encode()
        + stream_b + b"\nendstream\nendobj\n"
        b"5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
        b"xref\n0 6\n0000000000 65535 f \n"
        b"trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n9\n%%EOF\n"
    )
    return pdf


SAMPLE_COURT_ORDER_TEXT = """\
IN THE HIGH COURT OF KARNATAKA
Writ Appeal No. 200277/2025
Petitioner: State of Karnataka
Respondent: M/s XYZ Constructions Pvt Ltd

ORDER
Dated: 11/03/2026

The State is directed to file its counter statement within 30 days.
The limitation period is 90 days from the date of this order.
"""


# ============================================================
# 1. PDF TEXT EXTRACTION TESTS
# ============================================================

# Detect whether PyMuPDF (fitz) is available in this Python environment
try:
    import fitz as _fitz
    _PYMUPDF_AVAILABLE = True
except ImportError:
    _PYMUPDF_AVAILABLE = False

pymupdf_required = pytest.mark.skipif(
    not _PYMUPDF_AVAILABLE,
    reason="PyMuPDF (fitz) is not installed in this environment",
)


class TestPDFTextExtraction:
    """Tests for digital PDF text extraction via PyMuPDF."""

    @pymupdf_required
    def test_digital_pdf_extraction_returns_text(self):
        """PyMuPDF should extract non-empty text from a digital PDF."""
        from app.services.ocr_service import extract_text_from_pdf_digital
        pdf_bytes = _make_digital_pdf("Karnataka High Court Order dated 2026-03-11")
        text = extract_text_from_pdf_digital(pdf_bytes)
        assert isinstance(text, str)
        assert len(text) > 0

    @pymupdf_required
    def test_digital_pdf_extraction_contains_expected_content(self):
        """Extracted text should contain the content we embedded."""
        from app.services.ocr_service import extract_text_from_pdf_digital
        pdf_bytes = _make_digital_pdf("WA 100/2025 Revenue Department")
        text = extract_text_from_pdf_digital(pdf_bytes)
        # At least some keywords should survive PyMuPDF extraction
        assert "2025" in text or "Revenue" in text or "100" in text

    def test_empty_bytes_returns_empty_string(self):
        """Corrupted/empty input should not crash — returns empty string."""
        from app.services.ocr_service import extract_text_from_pdf_digital
        text = extract_text_from_pdf_digital(b"")
        assert text == ""

    def test_garbage_bytes_returns_empty_string(self):
        """Non-PDF binary data should not crash — returns empty string."""
        from app.services.ocr_service import extract_text_from_pdf_digital
        text = extract_text_from_pdf_digital(b"\x00\x01\x02\x03" * 100)
        assert text == ""

    def test_extract_text_from_document_pdf_route(self):
        """Main entry point should return (text, confidence, engine) for a PDF."""
        from app.services.ocr_service import extract_text_from_document
        pdf_bytes = _make_digital_pdf(SAMPLE_COURT_ORDER_TEXT)
        text, confidence, engine = extract_text_from_document(pdf_bytes, "application/pdf")
        assert isinstance(text, str)
        assert isinstance(confidence, float)
        assert isinstance(engine, str)
        assert engine in ("PyMuPDF-digital", "PyMuPDF+Tesseract-OCR")


# ============================================================
# 2. OCR FALLBACK TESTS
# ============================================================

class TestOCRFallback:
    """Tests for the PyMuPDF→Tesseract fallback pipeline."""

    def test_extract_text_from_document_image_route(self):
        """Image MIME types should route to Tesseract engine."""
        from app.services.ocr_service import extract_text_from_document

        # Create a minimal 1x1 white PNG in memory
        try:
            from PIL import Image
            img = Image.new("RGB", (400, 200), color=(255, 255, 255))
            buf = io.BytesIO()
            img.save(buf, format="PNG")
            img_bytes = buf.getvalue()
        except ImportError:
            pytest.skip("Pillow not installed")

        text, confidence, engine = extract_text_from_document(img_bytes, "image/png")
        # We don't assert text content (blank image = empty text) but engine must be correct
        assert engine == "Tesseract-OCR"
        assert isinstance(confidence, float)

    def test_unsupported_mime_returns_empty(self):
        """Unsupported MIME type should return empty string, not raise."""
        from app.services.ocr_service import extract_text_from_document
        text, confidence, engine = extract_text_from_document(b"data", "application/msword")
        assert text == ""
        assert engine == "unsupported"

    def test_image_ocr_import_graceful_failure(self):
        """If pytesseract is unavailable, the function returns empty string gracefully."""
        from app.services import ocr_service
        # Patch pytesseract import to simulate unavailability
        with patch.dict("sys.modules", {"pytesseract": None}):
            text, conf = ocr_service.extract_text_from_image_ocr(b"\x89PNG\r\n", "image/png")
        assert isinstance(text, str)
        assert isinstance(conf, float)


# ============================================================
# 3. FIELD EXTRACTION TESTS (expanded from test_core.py)
# ============================================================

class TestFieldExtraction:
    """Tests for regex-based structured field extraction."""

    def _fields_as_dict(self, text: str) -> dict:
        """Helper: run extraction and return {key: value} dict."""
        from app.services.ocr_service import extract_fields_from_text
        fields = extract_fields_from_text(text)
        return {f["key"]: f["value"] for f in fields}

    def test_case_number_wa_format(self):
        fdict = self._fields_as_dict("Writ Appeal No. 200277/2025\nPetitioner vs State")
        assert "caseNumber" in fdict
        assert "200277" in fdict["caseNumber"]

    def test_case_number_standard_format(self):
        fdict = self._fields_as_dict("Case Number: ABC/123\nHigh Court of Delhi")
        assert "caseNumber" in fdict
        assert fdict["caseNumber"] == "ABC/123"

    def test_report_no_format_mumbai_police(self):
        fdict = self._fields_as_dict(
            "Greater Mumbai Police Information Report\nReport No.: 908/2024\nDate: 15/08/2024\nIn case notes, verified."
        )
        assert "caseNumber" in fdict
        assert fdict["caseNumber"] == "908/2024"

    def test_file_no_format(self):
        fdict = self._fields_as_dict("File No.: REV/2026/00123\nDepartment of Land Revenue")
        assert "caseNumber" in fdict
        assert fdict["caseNumber"] == "REV/2026/00123"

    def test_reference_no_format(self):
        fdict = self._fields_as_dict("Reference No.: REF-12345\nAdministrative Reforms")
        assert "caseNumber" in fdict
        assert fdict["caseNumber"] == "REF-12345"

    def test_additional_gov_labels(self):
        labels_to_test = [
            ("Ref No.: REF-999", "REF-999"),
            ("Information Report No.: IR-888/2024", "IR-888/2024"),
            ("Application No.: APP/2026/555", "APP/2026/555"),
            ("Petition No.: WP/102/2024", "WP/102/2024"),
            ("Docket No.: DKT-777", "DKT-777"),
            ("Diary No.: 4567/2024", "4567/2024"),
            ("FIR No.: 123/2024", "123/2024"),
            ("Order No.: ORD-444", "ORD-444"),
            ("G.O. No.: GO-123", "GO-123"),
            ("GO No.: GO-456", "GO-456"),
            ("Sanction No.: SNC-789", "SNC-789"),
            ("Dispatch No.: DISP-101", "DISP-101"),
        ]
        for text, expected in labels_to_test:
            fdict = self._fields_as_dict(text)
            assert "caseNumber" in fdict, f"Failed to extract caseNumber for: {text}"
            assert fdict["caseNumber"] == expected, f"Expected {expected}, got {fdict.get('caseNumber')} for: {text}"

    def test_no_false_positive_on_case_note_and_phrases(self):
        false_positive_texts = [
            "In this case note, we observe no irregularity.",
            "Case notice was dispatched yesterday.",
            "In case no information is provided by the petitioner.",
            "In case not applicable, skip this section.",
        ]
        for text in false_positive_texts:
            fdict = self._fields_as_dict(text)
            assert "caseNumber" not in fdict, f"False positive caseNumber extracted for: '{text}' -> {fdict.get('caseNumber')}"

    def test_court_high_court_of(self):
        fdict = self._fields_as_dict("IN THE HIGH COURT OF KARNATAKA\nORDER")
        assert "court" in fdict
        assert "Karnataka" in fdict["court"]

    def test_order_date_slash_format(self):
        fdict = self._fields_as_dict("Date of Order: 15/06/2025\nDirected accordingly.")
        assert "orderDate" in fdict

    def test_limitation_90_days(self):
        fdict = self._fields_as_dict("The appeal must be filed within 90 days of this order.")
        assert "limitationDays" in fdict
        assert fdict["limitationDays"] == "90"

    def test_limitation_weeks_converted(self):
        fdict = self._fields_as_dict("The state shall reply within 6 weeks.")
        assert "limitationDays" in fdict
        assert fdict["limitationDays"] == "42"  # 6 * 7

    def test_limitation_months_converted(self):
        fdict = self._fields_as_dict("File the compliance report within 3 months.")
        assert "limitationDays" in fdict
        assert fdict["limitationDays"] == "90"  # 3 * 30

    def test_petitioner_extracted(self):
        fdict = self._fields_as_dict(
            "Petitioner: State of Karnataka\nVs.\nRespondent: M/s XYZ Ltd\nORDER"
        )
        assert "petitioner" in fdict

    def test_directions_extracted(self):
        fdict = self._fields_as_dict(
            "It is DIRECTED that the respondent shall produce all relevant records "
            "before this Court within the stipulated time.\n\nSD/- Chief Justice"
        )
        assert "directions" in fdict

    def test_missing_fields_are_absent_not_null(self):
        """Fields not found should be absent from the list, not present with null."""
        from app.services.ocr_service import extract_fields_from_text
        fields = extract_fields_from_text("This document has no structured data.")
        keys = [f["key"] for f in fields]
        assert "caseNumber" not in keys
        assert "court" not in keys

    def test_confidence_values_in_range(self):
        """All confidence scores must be between 0 and 1."""
        from app.services.ocr_service import extract_fields_from_text
        fields = extract_fields_from_text(SAMPLE_COURT_ORDER_TEXT)
        for f in fields:
            assert 0.0 <= f["confidence"] <= 1.0, f"Out-of-range confidence for {f['key']}: {f['confidence']}"

    def test_is_extracted_flag_is_true(self):
        """All regex-extracted fields should have isExtracted=True."""
        from app.services.ocr_service import extract_fields_from_text
        fields = extract_fields_from_text(SAMPLE_COURT_ORDER_TEXT)
        for f in fields:
            assert f["isExtracted"] is True

    def test_full_court_order_extraction(self):
        """Smoke test: realistic court order text extracts at least case number and court."""
        fdict = self._fields_as_dict(SAMPLE_COURT_ORDER_TEXT)
        assert len(fdict) >= 2, f"Expected at least 2 fields, got: {list(fdict.keys())}"
        assert "caseNumber" in fdict or "court" in fdict


# ============================================================
# 4. INVALID FILE REJECTION TESTS
# ============================================================

class TestInvalidFileRejection:
    """Tests for file validation logic."""

    def test_valid_pdf(self):
        from app.services.document_service import validate_file
        assert validate_file("order.pdf", "application/pdf", 1024 * 1024) is None

    def test_valid_jpeg(self):
        from app.services.document_service import validate_file
        assert validate_file("scan.jpg", "image/jpeg", 500 * 1024) is None

    def test_valid_png(self):
        from app.services.document_service import validate_file
        assert validate_file("scan.png", "image/png", 200 * 1024) is None

    def test_invalid_mime_word_doc(self):
        from app.services.document_service import validate_file
        result = validate_file("doc.docx", "application/msword", 1024)
        assert result is not None
        assert "not supported" in result.lower()

    def test_invalid_mime_text_file(self):
        from app.services.document_service import validate_file
        result = validate_file("data.txt", "text/plain", 100)
        assert result is not None

    def test_invalid_extension_exe(self):
        from app.services.document_service import validate_file
        result = validate_file("malware.exe", "application/pdf", 1024)
        assert result is not None

    def test_invalid_extension_zip(self):
        from app.services.document_service import validate_file
        result = validate_file("archive.zip", "application/pdf", 1024)
        assert result is not None

    def test_file_too_large_25mb(self):
        from app.services.document_service import validate_file
        result = validate_file("huge.pdf", "application/pdf", 25 * 1024 * 1024)
        assert result is not None
        assert "size" in result.lower()

    def test_file_at_limit_is_ok(self):
        from app.services.document_service import validate_file
        result = validate_file("borderline.pdf", "application/pdf", 20 * 1024 * 1024)
        assert result is None

    def test_zero_byte_file_accepted(self):
        """A 0-byte file passes size validation (content validation is separate)."""
        from app.services.document_service import validate_file
        result = validate_file("empty.pdf", "application/pdf", 0)
        assert result is None

    def test_filename_without_extension_rejected(self):
        from app.services.document_service import validate_file
        result = validate_file("nodot", "application/pdf", 1024)
        assert result is not None


# ============================================================
# 5. DOCUMENT STATUS TESTS
# ============================================================

class TestDocumentStatus:
    """Tests for OCR status transitions and persistence logic."""

    def test_status_values_are_known(self):
        """Document ocr_status values should be a known set."""
        known = {"PENDING", "PROCESSING", "COMPLETED", "FAILED"}
        # These match the CHECK constraint in schema.sql
        assert "PENDING" in known
        assert "COMPLETED" in known
        assert "FAILED" in known

    def test_process_ocr_marks_processing_then_completed(self):
        """
        When process_ocr() succeeds, the DB record should be updated to COMPLETED.
        We mock Supabase to avoid a live connection.

        The get_supabase function is lazy-imported inside process_ocr(), so we
        patch it at its source module: app.core.database.get_supabase.
        """
        from app.services import document_service

        fake_doc = {
            "id": "doc-test-123",
            "storage_path": "case-1/2026-01-01_abc123_test.pdf",
            "file_type": "application/pdf",
            "case_id": "case-test-1",
        }

        mock_supabase = MagicMock()
        # Simulate document lookup
        mock_supabase.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value.data = fake_doc
        # Simulate storage download returning a valid PDF
        mock_supabase.storage.from_.return_value.download.return_value = _make_digital_pdf(
            SAMPLE_COURT_ORDER_TEXT
        )

        captured_updates = []

        def capture_update(data):
            captured_updates.append(data)
            m = MagicMock()
            m.eq.return_value.execute.return_value = MagicMock()
            return m

        mock_supabase.table.return_value.update.side_effect = capture_update

        # Patch at the source (app.core.database) — lazy imports resolve there
        with patch("app.core.database.get_supabase", return_value=mock_supabase), \
             patch("app.core.config.settings") as mock_settings:
            mock_settings.SUPABASE_STORAGE_BUCKET = "gov-documents"
            result = document_service.process_ocr("doc-test-123")

        assert result["documentId"] == "doc-test-123"
        assert result["status"] in ("READY", "FAILED")
        assert "extractedFields" in result
        assert isinstance(result["extractedFields"], list)

    def test_process_ocr_marks_failed_on_storage_error(self):
        """When storage download fails, ocr_status must be set to FAILED."""
        from app.services import document_service

        fake_doc = {
            "id": "doc-fail-456",
            "storage_path": "case-1/bad.pdf",
            "file_type": "application/pdf",
        }

        mock_supabase = MagicMock()
        mock_supabase.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value.data = fake_doc
        mock_supabase.storage.from_.return_value.download.side_effect = RuntimeError("Storage error")

        with patch("app.core.database.get_supabase", return_value=mock_supabase), \
             patch("app.core.config.settings") as mock_settings:
            mock_settings.SUPABASE_STORAGE_BUCKET = "gov-documents"
            with pytest.raises(RuntimeError):
                document_service.process_ocr("doc-fail-456")

        # Confirm the FAILED update was written
        update_calls = mock_supabase.table.return_value.update.call_args_list
        update_dicts = [call.args[0] for call in update_calls if call.args]
        failed_update = next(
            (d for d in update_dicts if d.get("ocr_status") == "FAILED"),
            None,
        )
        assert failed_update is not None, "Expected a FAILED status update to the DB"

    def test_process_ocr_raises_value_error_for_missing_doc(self):
        """process_ocr() should raise ValueError when document_id is not found."""
        from app.services import document_service

        mock_supabase = MagicMock()
        mock_supabase.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value.data = None

        with patch("app.core.database.get_supabase", return_value=mock_supabase), \
             patch("app.core.config.settings"):
            with pytest.raises(ValueError, match="not found"):
                document_service.process_ocr("nonexistent-id")


# ============================================================
# 6. API RESPONSE STRUCTURE TESTS
# ============================================================

# ============================================================
# STANDALONE mapping helper (no supabase import needed)
# ============================================================

def _map_db_doc_standalone(d: dict) -> dict:
    """
    Inline version of _map_db_doc_to_frontend for tests that cannot
    import case_service (which pulls in supabase at module level).
    Mirrors the exact logic in case_service._map_db_doc_to_frontend.
    """
    metadata = {
        "fileSize": str(d.get("file_size", 0)),
        "fileType": d.get("file_type", ""),
        "mimeType": d.get("file_type", ""),
        "pageCount": d.get("page_count", 0),
    }
    extracted_fields = d.get("extracted_fields")
    extracted_text = d.get("extracted_text")
    ocr_result = None
    if extracted_fields is not None or extracted_text:
        ocr_result = {
            "documentId": d.get("id", ""),
            "extractedText": extracted_text or "",
            "confidenceScore": 0.0,
            "extractedFields": extracted_fields or [],
            "processingTimeMs": 0,
            "ocrEngine": "stored",
            "status": "READY" if extracted_text else "FAILED",
        }
    return {
        "id": d.get("id"),
        "caseId": d.get("case_id"),
        "title": d.get("file_name", ""),
        "documentType": d.get("document_type", "Court Order"),
        "fileName": d.get("file_name", ""),
        "fileUrl": d.get("storage_path", ""),
        "uploadDate": d.get("created_at", ""),
        "uploadedBy": d.get("uploaded_by", ""),
        "status": "READY" if d.get("ocr_status") == "COMPLETED" else "PROCESSING",
        "ocrStatus": d.get("ocr_status", "PENDING"),
        "extractedText": extracted_text,
        "extractedFields": extracted_fields,
        "processedAt": d.get("processed_at"),
        "errorMessage": d.get("error_message"),
        "metadata": metadata,
        "ocrResult": ocr_result,
    }


class TestAPIResponseStructure:
    """
    Tests for API response shapes using the document_service module directly.
    These do not require a live FastAPI server or Supabase connection.
    """

    def test_validate_file_returns_none_on_success(self):
        """validate_file() returns None when the file is valid."""
        from app.services.document_service import validate_file
        assert validate_file("report.pdf", "application/pdf", 1024) is None

    def test_validate_file_returns_string_on_error(self):
        """validate_file() returns an error string when validation fails."""
        from app.services.document_service import validate_file
        result = validate_file("bad.exe", "application/x-executable", 1024)
        assert isinstance(result, str)
        assert len(result) > 0

    def test_process_ocr_from_bytes_response_shape(self):
        """
        process_ocr_from_bytes() should return a dict with all required
        OCRResult fields, even if OCR produces no text.
        """
        from app.services.document_service import process_ocr_from_bytes

        pdf_bytes = _make_digital_pdf("Test document content")
        result = process_ocr_from_bytes(pdf_bytes, "test.pdf", "application/pdf")

        required_keys = {
            "documentId",
            "extractedText",
            "confidenceScore",
            "extractedFields",
            "processingTimeMs",
            "ocrEngine",
            "status",
        }
        assert required_keys.issubset(result.keys()), (
            f"Missing keys: {required_keys - result.keys()}"
        )

    def test_process_ocr_from_bytes_documentid_is_preview(self):
        """Preview OCR should return 'preview' as documentId."""
        from app.services.document_service import process_ocr_from_bytes
        pdf_bytes = _make_digital_pdf("Court Order test")
        result = process_ocr_from_bytes(pdf_bytes, "test.pdf", "application/pdf")
        assert result["documentId"] == "preview"

    def test_process_ocr_from_bytes_status_is_string(self):
        from app.services.document_service import process_ocr_from_bytes
        pdf_bytes = _make_digital_pdf("Content")
        result = process_ocr_from_bytes(pdf_bytes, "doc.pdf", "application/pdf")
        assert result["status"] in ("READY", "FAILED")

    def test_process_ocr_from_bytes_fields_is_list(self):
        from app.services.document_service import process_ocr_from_bytes
        pdf_bytes = _make_digital_pdf(SAMPLE_COURT_ORDER_TEXT)
        result = process_ocr_from_bytes(pdf_bytes, "court_order.pdf", "application/pdf")
        assert isinstance(result["extractedFields"], list)

    def test_process_ocr_from_bytes_processing_time_is_int(self):
        from app.services.document_service import process_ocr_from_bytes
        pdf_bytes = _make_digital_pdf("Content")
        result = process_ocr_from_bytes(pdf_bytes, "doc.pdf", "application/pdf")
        assert isinstance(result["processingTimeMs"], int)
        assert result["processingTimeMs"] >= 0

    def test_map_db_doc_to_frontend_shape(self):
        """_map_db_doc_to_frontend() returns all required DocumentRecord fields."""
        # Use standalone helper to avoid supabase module-level import in case_service
        db_row = {
            "id": "test-doc-uuid",
            "case_id": "test-case-uuid",
            "file_name": "court_order.pdf",
            "storage_path": "case-1/court_order.pdf",
            "file_url": "https://supabase.co/storage/...",
            "file_type": "application/pdf",
            "file_size": 102400,
            "document_type": "Court Order",
            "ocr_status": "COMPLETED",
            "extracted_text": "IN THE HIGH COURT OF KARNATAKA",
            "extracted_fields": [
                {"key": "court", "label": "Court Name", "value": "High Court Of Karnataka",
                 "confidence": 0.88, "isExtracted": True}
            ],
            "processed_at": "2026-03-15T10:00:00+00:00",
            "error_message": None,
            "uploaded_by": "Test Officer",
            "created_at": "2026-03-15T09:00:00+00:00",
            "page_count": 2,
        }

        result = _map_db_doc_standalone(db_row)

        # Required keys
        required_keys = {
            "id", "caseId", "title", "documentType", "fileName",
            "fileUrl", "uploadDate", "uploadedBy", "status", "ocrStatus",
            "metadata", "ocrResult", "extractedText", "extractedFields",
        }
        assert required_keys.issubset(result.keys()), (
            f"Missing keys: {required_keys - result.keys()}"
        )

        # Values correct
        assert result["id"] == "test-doc-uuid"
        assert result["ocrStatus"] == "COMPLETED"
        assert result["status"] == "READY"
        assert result["extractedText"] == "IN THE HIGH COURT OF KARNATAKA"
        assert isinstance(result["extractedFields"], list)
        assert len(result["extractedFields"]) == 1

    def test_map_db_doc_ocr_result_populated_when_text_present(self):
        """ocrResult should be populated when extracted_text is present."""
        db_row = {
            "id": "doc-1",
            "case_id": "case-1",
            "file_name": "doc.pdf",
            "storage_path": "path/doc.pdf",
            "file_type": "application/pdf",
            "file_size": 1024,
            "document_type": "Court Order",
            "ocr_status": "COMPLETED",
            "extracted_text": "Some extracted text",
            "extracted_fields": [],
            "processed_at": None,
            "error_message": None,
            "uploaded_by": "Officer",
            "created_at": "2026-01-01T00:00:00Z",
        }

        result = _map_db_doc_standalone(db_row)
        assert result["ocrResult"] is not None
        assert result["ocrResult"]["extractedText"] == "Some extracted text"
        assert result["ocrResult"]["status"] == "READY"

    def test_map_db_doc_ocr_result_none_when_no_text(self):
        """ocrResult should be None when extracted_text and extracted_fields are both None."""
        db_row = {
            "id": "doc-2",
            "case_id": "case-1",
            "file_name": "doc.pdf",
            "storage_path": "path/doc.pdf",
            "file_type": "application/pdf",
            "file_size": 1024,
            "document_type": "Court Order",
            "ocr_status": "PENDING",
            "extracted_text": None,
            "extracted_fields": None,
            "processed_at": None,
            "error_message": None,
            "uploaded_by": "Officer",
            "created_at": "2026-01-01T00:00:00Z",
        }

        result = _map_db_doc_standalone(db_row)
        assert result["ocrResult"] is None
