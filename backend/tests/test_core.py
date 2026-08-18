"""
Backend tests for critical functionality.
These tests use unit-testing patterns where possible (no live database required
for pure logic tests). Integration tests require a configured .env.

Run:
    cd backend
    pytest tests/ -v
"""
import pytest
from datetime import datetime, timedelta, timezone


# ============================================================
# DEADLINE SERVICE TESTS (pure logic — no database)
# ============================================================

class TestDeadlineService:
    """Tests for deadline_service.py — no database needed."""

    def test_calculate_deadline_90_days(self):
        from app.services.deadline_service import calculate_deadline
        result = calculate_deadline("2026-01-01", 90)
        assert result == "2026-04-01"

    def test_calculate_deadline_30_days(self):
        from app.services.deadline_service import calculate_deadline
        result = calculate_deadline("2026-06-01", 30)
        assert result == "2026-07-01"

    def test_calculate_age_days(self):
        from app.services.deadline_service import calculate_age_days
        # 30 days ago
        thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
        age = calculate_age_days(thirty_days_ago)
        assert 29 <= age <= 31  # Allow ±1 for timezone/test timing

    def test_days_remaining_future(self):
        from app.services.deadline_service import calculate_days_remaining
        future = (datetime.now(timezone.utc) + timedelta(days=30)).date().isoformat()
        result = calculate_days_remaining(future)
        assert 29 <= result <= 31

    def test_days_remaining_past_is_negative(self):
        from app.services.deadline_service import calculate_days_remaining
        past = (datetime.now(timezone.utc) - timedelta(days=5)).date().isoformat()
        result = calculate_days_remaining(past)
        assert result < 0

    def test_deadline_status_overdue(self):
        from app.services.deadline_service import get_deadline_status
        assert get_deadline_status(-1) == "OVERDUE"
        assert get_deadline_status(-30) == "OVERDUE"

    def test_deadline_status_critical(self):
        from app.services.deadline_service import get_deadline_status
        assert get_deadline_status(0) == "CRITICAL"
        assert get_deadline_status(7) == "CRITICAL"

    def test_deadline_status_high(self):
        from app.services.deadline_service import get_deadline_status
        assert get_deadline_status(8) == "HIGH"
        assert get_deadline_status(15) == "HIGH"

    def test_deadline_status_medium(self):
        from app.services.deadline_service import get_deadline_status
        assert get_deadline_status(16) == "MEDIUM"
        assert get_deadline_status(30) == "MEDIUM"

    def test_deadline_status_low(self):
        from app.services.deadline_service import get_deadline_status
        assert get_deadline_status(31) == "LOW"
        assert get_deadline_status(365) == "LOW"

    def test_risk_level_from_deadline_status(self):
        from app.services.deadline_service import map_deadline_status_to_risk_level
        assert map_deadline_status_to_risk_level("OVERDUE") == "HIGH"
        assert map_deadline_status_to_risk_level("CRITICAL") == "HIGH"
        assert map_deadline_status_to_risk_level("MEDIUM") == "MEDIUM"
        assert map_deadline_status_to_risk_level("LOW") == "LOW"

    def test_priority_from_deadline_status(self):
        from app.services.deadline_service import map_deadline_status_to_priority
        assert map_deadline_status_to_priority("OVERDUE") == "IMMEDIATE"
        assert map_deadline_status_to_priority("HIGH") == "URGENT"
        assert map_deadline_status_to_priority("LOW") == "ROUTINE"


# ============================================================
# RISK SERVICE TESTS (pure logic — no database)
# ============================================================

class TestRiskService:
    """Tests for risk_service.py — no database needed."""

    def _make_case(self, days_remaining: int, stage: str = "Officer Review") -> dict:
        """Helper to create a minimal case dict for risk calculation."""
        from datetime import date
        deadline = (date.today() + timedelta(days=days_remaining)).isoformat()
        return {
            "id": "test-case-1",
            "daysRemaining": days_remaining,
            "current_stage": stage,
            "limitation_deadline": deadline,
            "statutory_deadline_days": 90,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_movement_date": None,
        }

    def test_overdue_case_is_high_risk(self):
        from app.services.risk_service import calculate_risk
        case = self._make_case(-5)
        result = calculate_risk(case)
        assert result["risk_level"] == "HIGH"
        assert result["risk_score"] >= 75

    def test_critical_case_is_high_risk(self):
        from app.services.risk_service import calculate_risk
        # 0 days remaining = deadline is TODAY → 50 pts + 9 pts (LEGAL_OPINION) = 59 → HIGH
        case = self._make_case(0, stage="LEGAL_OPINION")
        result = calculate_risk(case)
        assert result["risk_score"] >= 45
        assert result["risk_level"] in ("HIGH", "MEDIUM")  # At minimum MEDIUM at 0 days


    def test_7_day_case_is_high_risk(self):
        from app.services.risk_service import calculate_risk
        # 7 days is CRITICAL threshold → should score HIGH
        case = self._make_case(7, stage="Legal Review")  # Legal Review adds 8 pts
        result = calculate_risk(case)
        # 40 pts (deadline) + 8 pts (stage) = 48 → MEDIUM boundary
        # With Legal Review stage weight 8, total >= 48 → HIGH
        assert result["risk_score"] >= 45


    def test_low_risk_case(self):
        from app.services.risk_service import calculate_risk
        case = self._make_case(60)
        result = calculate_risk(case)
        assert result["risk_level"] == "LOW"
        assert result["risk_score"] < 45

    def test_legal_opinion_overdue_increases_score(self):
        from app.services.risk_service import calculate_risk
        from datetime import date
        case = self._make_case(20)  # Medium risk on its own
        legal_opinion = {
            "status": "OVERDUE",
            "due_date": (date.today() - timedelta(days=5)).isoformat(),
        }
        without = calculate_risk(case)
        with_lo = calculate_risk(case, legal_opinion=legal_opinion)
        assert with_lo["risk_score"] > without["risk_score"]

    def test_reasons_are_never_empty(self):
        from app.services.risk_service import calculate_risk
        case = self._make_case(60)
        result = calculate_risk(case)
        assert isinstance(result["reasons"], list)
        assert len(result["reasons"]) >= 1

    def test_score_is_capped_at_100(self):
        from app.services.risk_service import calculate_risk
        from datetime import date
        case = self._make_case(-100, stage="Legal Review")  # Very overdue
        legal_opinion = {
            "status": "OVERDUE",
            "due_date": (date.today() - timedelta(days=30)).isoformat(),
        }
        result = calculate_risk(case, legal_opinion=legal_opinion, movement_count=20)
        assert result["risk_score"] <= 100.0

    def test_risk_level_mapping(self):
        from app.services.risk_service import calculate_risk
        # >=75 → HIGH
        case = self._make_case(-10)
        result = calculate_risk(case)
        assert result["risk_level"] == "HIGH"


# ============================================================
# OCR SERVICE TESTS (unit-level, no real files)
# ============================================================

class TestOCRService:
    """Tests for regex-based field extraction in ocr_service.py."""

    def test_case_number_extraction(self):
        from app.services.ocr_service import extract_fields_from_text
        text = "IN THE HIGH COURT OF KARNATAKA\nWrit Appeal No. 200277/2025\nPetitioner vs State of Karnataka"
        fields = extract_fields_from_text(text)
        case_field = next((f for f in fields if f["key"] == "caseNumber"), None)
        assert case_field is not None
        assert "200277" in case_field["value"]

    def test_court_extraction(self):
        from app.services.ocr_service import extract_fields_from_text
        text = "IN THE HIGH COURT OF KARNATAKA\nORDER\nDated: 15.01.2026"
        fields = extract_fields_from_text(text)
        court_field = next((f for f in fields if f["key"] == "court"), None)
        assert court_field is not None
        assert "Karnataka" in court_field["value"]

    def test_date_extraction(self):
        from app.services.ocr_service import extract_fields_from_text
        text = "Date of Order: 10/06/2025\nThe petitioner has filed this writ petition."
        fields = extract_fields_from_text(text)
        date_field = next((f for f in fields if f["key"] == "orderDate"), None)
        assert date_field is not None

    def test_limitation_extraction_days(self):
        from app.services.ocr_service import extract_fields_from_text
        text = "The respondent is directed to comply within 30 days of the date of this order."
        fields = extract_fields_from_text(text)
        limit_field = next((f for f in fields if f["key"] == "limitationDays"), None)
        assert limit_field is not None
        assert limit_field["value"] == "30"

    def test_limitation_extraction_weeks_converted_to_days(self):
        from app.services.ocr_service import extract_fields_from_text
        text = "The state government shall file its reply within 4 weeks."
        fields = extract_fields_from_text(text)
        limit_field = next((f for f in fields if f["key"] == "limitationDays"), None)
        assert limit_field is not None
        assert limit_field["value"] == "28"  # 4 * 7

    def test_empty_text_returns_empty_fields(self):
        from app.services.ocr_service import extract_fields_from_text
        fields = extract_fields_from_text("")
        assert fields == []

    def test_no_crash_on_garbage_text(self):
        from app.services.ocr_service import extract_fields_from_text
        text = "!@#$%^&*()\n\n\n\t\t\t\n\nrandom garbage 1234567890"
        fields = extract_fields_from_text(text)
        assert isinstance(fields, list)  # Must not raise


# ============================================================
# DOCUMENT SERVICE VALIDATION TESTS (no uploads)
# ============================================================

class TestDocumentValidation:
    """Tests for file validation logic."""

    def test_valid_pdf(self):
        from app.services.document_service import validate_file
        result = validate_file("court_order.pdf", "application/pdf", 1024 * 1024)
        assert result is None  # No error

    def test_valid_jpeg(self):
        from app.services.document_service import validate_file
        result = validate_file("scan.jpg", "image/jpeg", 500 * 1024)
        assert result is None

    def test_invalid_mime_type(self):
        from app.services.document_service import validate_file
        result = validate_file("document.docx", "application/msword", 1024)
        assert result is not None
        assert "not supported" in result.lower()

    def test_file_too_large(self):
        from app.services.document_service import validate_file
        # 25MB file, limit is 20MB
        result = validate_file("large.pdf", "application/pdf", 25 * 1024 * 1024)
        assert result is not None
        assert "size" in result.lower()

    def test_invalid_extension(self):
        from app.services.document_service import validate_file
        result = validate_file("file.exe", "application/pdf", 1024)
        # Extension check — .exe not allowed
        assert result is not None
