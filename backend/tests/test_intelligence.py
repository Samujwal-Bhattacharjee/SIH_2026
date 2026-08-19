"""
Comprehensive Automated Test Suite for Case Intelligence & Risk Engine.

All tests use fixed dates (deterministic) and mock inputs.
No live database or network connection is required.

Run:
    pytest tests/test_intelligence.py -v
"""
import pytest
from datetime import date, datetime, timedelta
from app.services.intelligence import (
    compute_case_intelligence,
    rank_cases,
    aggregate_dashboard_intelligence,
    calculate_days_remaining,
    classify_deadline_status,
    calculate_deadline_status,
    calculate_case_age,
    calculate_statutory_deadline,
    detect_case_bottleneck,
    calculate_stage_dwell_days,
    calculate_case_risk,
    generate_recommendation,
    CaseIntelligenceResult,
    DashboardIntelligenceSummary,
    DEADLINE_STATUS_SAFE,
    DEADLINE_STATUS_WATCH,
    DEADLINE_STATUS_HIGH,
    DEADLINE_STATUS_CRITICAL,
    DEADLINE_STATUS_DUE_TODAY,
    DEADLINE_STATUS_OVERDUE,
    DEADLINE_STATUS_UNKNOWN,
    RISK_LEVEL_LOW,
    RISK_LEVEL_MEDIUM,
    RISK_LEVEL_HIGH,
    RISK_LEVEL_CRITICAL,
    PRIORITY_IMMEDIATE,
    PRIORITY_URGENT,
    PRIORITY_ROUTINE,
    BOTTLENECK_SEVERITY_MODERATE,
    BOTTLENECK_SEVERITY_CRITICAL,
)

# Reference fixed date for deterministic testing
TEST_REF_DATE = date(2026, 8, 18)
TEST_REF_DATE_STR = "2026-08-18"


# ============================================================
# 1. DEADLINE CALCULATION & CLASSIFICATION TESTS
# ============================================================

class TestDeadlineCalculations:
    """Tests for deterministic deadline arithmetic and classification."""

    def test_no_deadline_returns_unknown(self):
        """Case with missing deadline returns None days and UNKNOWN status."""
        days, status = calculate_deadline_status(None, current_date=TEST_REF_DATE)
        assert days is None
        assert status == DEADLINE_STATUS_UNKNOWN

    def test_60_days_remaining_is_safe(self):
        """Deadline 60 days in the future is classified as SAFE."""
        target = "2026-10-17"  # exactly 60 days from 2026-08-18
        days, status = calculate_deadline_status(target, current_date=TEST_REF_DATE)
        assert days == 60
        assert status == DEADLINE_STATUS_SAFE

    def test_30_days_remaining_is_watch(self):
        """Deadline 30 days in the future is classified as WATCH."""
        target = "2026-09-17"  # exactly 30 days from 2026-08-18
        days, status = calculate_deadline_status(target, current_date=TEST_REF_DATE)
        assert days == 30
        assert status == DEADLINE_STATUS_WATCH

    def test_15_days_remaining_is_high(self):
        """Deadline 15 days in the future is classified as HIGH."""
        target = "2026-09-02"  # exactly 15 days from 2026-08-18
        days, status = calculate_deadline_status(target, current_date=TEST_REF_DATE)
        assert days == 15
        assert status == DEADLINE_STATUS_HIGH

    def test_7_days_remaining_is_critical(self):
        """Deadline 7 days in the future is classified as CRITICAL."""
        target = "2026-08-25"  # exactly 7 days from 2026-08-18
        days, status = calculate_deadline_status(target, current_date=TEST_REF_DATE)
        assert days == 7
        assert status == DEADLINE_STATUS_CRITICAL

    def test_1_day_remaining_is_critical(self):
        """Deadline 1 day in the future is classified as CRITICAL."""
        target = "2026-08-19"  # exactly 1 day from 2026-08-18
        days, status = calculate_deadline_status(target, current_date=TEST_REF_DATE)
        assert days == 1
        assert status == DEADLINE_STATUS_CRITICAL

    def test_0_days_remaining_is_due_today(self):
        """Deadline today is classified as DUE_TODAY."""
        target = "2026-08-18"  # today
        days, status = calculate_deadline_status(target, current_date=TEST_REF_DATE)
        assert days == 0
        assert status == DEADLINE_STATUS_DUE_TODAY

    def test_negative_days_is_overdue(self):
        """Past deadline is classified as OVERDUE with negative days."""
        target = "2026-08-13"  # 5 days ago
        days, status = calculate_deadline_status(target, current_date=TEST_REF_DATE)
        assert days == -5
        assert status == DEADLINE_STATUS_OVERDUE

    def test_calculate_case_age(self):
        """Calculates age in days accurately."""
        created = "2026-07-19T10:00:00Z"  # 30 days before Aug 18
        age = calculate_case_age(created, current_date=TEST_REF_DATE)
        assert age == 30

    def test_calculate_statutory_deadline(self):
        """Projects future deadline given start date and day count."""
        deadline = calculate_statutory_deadline("2026-08-01", 90)
        assert deadline == "2026-10-30"


# ============================================================
# 2. STAGE DWELL & BOTTLENECK DETECTION TESTS
# ============================================================

class TestBottleneckDetection:
    """Tests for file stagnation and workflow bottleneck detection."""

    def test_no_bottleneck_under_7_days(self):
        """File pending 3 days at Officer Review is not a bottleneck."""
        case = {
            "id": "case-001",
            "current_stage": "Officer Review",
            "last_movement_date": "2026-08-15T10:00:00Z",  # 3 days dwell
            "department": "Land Revenue",
        }
        b_info = detect_case_bottleneck(case, current_date=TEST_REF_DATE)
        assert b_info is None

    def test_moderate_bottleneck_at_10_days(self):
        """File pending 10 days (>7 days) is flagged as MODERATE bottleneck."""
        case = {
            "id": "case-002",
            "current_stage": "Legal Review",
            "last_movement_date": "2026-08-08T10:00:00Z",  # 10 days dwell
            "department": "Public Works",
            "assigned_officer": "Adv. Mohan",
        }
        b_info = detect_case_bottleneck(case, current_date=TEST_REF_DATE)
        assert b_info is not None
        assert b_info.stage == "Legal Review"
        assert b_info.days_pending == 10
        assert b_info.severity == BOTTLENECK_SEVERITY_MODERATE
        assert b_info.responsible_department == "Public Works"
        assert b_info.responsible_officer == "Adv. Mohan"

    def test_critical_bottleneck_at_16_days(self):
        """File pending 16 days (>15 days) is flagged as CRITICAL bottleneck."""
        case = {
            "id": "case-003",
            "current_stage": "Document Verification",
            "last_movement_date": "2026-08-02T10:00:00Z",  # 16 days dwell
            "department": "Social Welfare",
        }
        b_info = detect_case_bottleneck(case, current_date=TEST_REF_DATE)
        assert b_info is not None
        assert b_info.days_pending == 16
        assert b_info.severity == BOTTLENECK_SEVERITY_CRITICAL
        assert "Immediate administrative intervention required" in b_info.root_cause_description

    def test_bottleneck_using_movements_history(self):
        """Uses movement log timestamps to determine dwell days accurately."""
        case = {
            "id": "case-004",
            "current_stage": "Legal Review",
            "created_at": "2026-06-01T00:00:00Z",
        }
        movements = [
            {
                "id": "m1",
                "stage": "Application Received",
                "started_at": "2026-06-01T00:00:00Z",
                "completed_at": "2026-06-05T00:00:00Z",
                "status": "COMPLETED",
            },
            {
                "id": "m2",
                "stage": "Legal Review",
                "started_at": "2026-08-01T10:00:00Z",  # 17 days ago
                "status": "IN_PROGRESS",
                "to_department": "Law Department",
                "to_officer": "Standing Counsel",
            },
        ]
        b_info = detect_case_bottleneck(case, movements=movements, current_date=TEST_REF_DATE)
        assert b_info is not None
        assert b_info.days_pending == 17
        assert b_info.severity == BOTTLENECK_SEVERITY_CRITICAL
        assert b_info.responsible_department == "Law Department"

    def test_terminal_case_has_no_bottleneck(self):
        """Resolved or disposed cases do not produce active bottlenecks."""
        case = {
            "id": "case-005",
            "status": "DISPOSED",
            "current_stage": "Closure",
            "last_movement_date": "2026-06-01T00:00:00Z",
        }
        b_info = detect_case_bottleneck(case, current_date=TEST_REF_DATE)
        assert b_info is None


# ============================================================
# 3. RISK ENGINE & SCORE EXPLAINABILITY TESTS
# ============================================================

class TestRiskEngine:
    """Tests for deterministic risk scoring and point breakdowns."""

    def test_safe_case_low_risk(self):
        """Case with 45 days remaining and no stagnation scores LOW risk."""
        case = {
            "id": "c-low",
            "limitation_deadline": "2026-10-02",  # 45 days
            "current_stage": "Application Received",
            "last_movement_date": "2026-08-16T10:00:00Z",  # 2 days
            "status": "IN_PROGRESS",
        }
        res = calculate_case_risk(case, current_date=TEST_REF_DATE)
        assert res["risk_score"] < 30.0
        assert res["risk_level"] == RISK_LEVEL_LOW
        assert res["priority"] == PRIORITY_ROUTINE

    def test_overdue_case_critical_risk(self):
        """Overdue case receives severe penalty and scores CRITICAL (>= 70)."""
        case = {
            "id": "c-overdue",
            "limitation_deadline": "2026-08-10",  # 8 days overdue
            "current_stage": "Officer Review",
            "last_movement_date": "2026-08-01T10:00:00Z",
            "status": "SLA_BREACHED",
        }
        res = calculate_case_risk(case, current_date=TEST_REF_DATE)
        assert res["risk_score"] >= 80.0
        assert res["risk_level"] == RISK_LEVEL_CRITICAL
        assert res["priority"] == PRIORITY_IMMEDIATE
        assert any("OVERDUE by 8 day(s)" in r for r in res["reasons"])
        assert res["breakdown"].deadline_risk >= 50.0

    def test_legal_opinion_delay_increases_score(self):
        """Overdue legal opinion adds +15 points to the breakdown."""
        case = {
            "id": "c-lo",
            "limitation_deadline": "2026-09-10",  # 23 days (Watch)
            "current_stage": "Legal Review",
            "last_movement_date": "2026-08-15T00:00:00Z",
            "status": "IN_PROGRESS",
        }
        lo = {
            "status": "OVERDUE",
            "due_date": "2026-08-10",
        }
        res_without = calculate_case_risk(case, current_date=TEST_REF_DATE)
        res_with = calculate_case_risk(case, legal_opinion=lo, current_date=TEST_REF_DATE)
        
        assert res_with["risk_score"] > res_without["risk_score"]
        assert res_with["breakdown"].legal_opinion_risk == 15.0
        assert any("Legal opinion referral is OVERDUE" in r for r in res_with["reasons"])

    def test_multiple_risk_factors_capped_at_100(self):
        """Multiple combined risk factors cannot exceed 100 points."""
        case = {
            "id": "c-combo",
            "limitation_deadline": "2026-07-01",  # 48 days overdue (80 pts)
            "current_stage": "Legal Review",     # stage crit (8 pts)
            "last_movement_date": "2026-07-01T00:00:00Z",  # 48 days dwell (20 pts)
            "status": "SLA_BREACHED",
        }
        lo = {"status": "OVERDUE", "due_date": "2026-07-10"}  # 15 pts
        movements = [{"id": f"m{i}"} for i in range(12)]      # rework (5 pts)

        res = calculate_case_risk(
            case, legal_opinion=lo, movements=movements, current_date=TEST_REF_DATE
        )
        assert res["risk_score"] == 100.0
        assert res["breakdown"].total_raw > 100.0
        assert res["breakdown"].total_capped == 100.0

    def test_missing_data_gracefully_handled(self):
        """Bare case dictionary does not crash and produces safe default score."""
        bare_case = {"id": "c-bare"}
        res = calculate_case_risk(bare_case, current_date=TEST_REF_DATE)
        assert isinstance(res["risk_score"], float)
        assert len(res["reasons"]) >= 1


# ============================================================
# 4. RECOMMENDATION & FULL INTELLIGENCE OUTPUT TESTS
# ============================================================

class TestRecommendationsAndIntelligence:
    """Tests for actionable operational recommendations and full intelligence pipeline."""

    def test_overdue_recommendation_counsel_escalation(self):
        """Overdue case recommends Section 5 condonation and emergency escalation."""
        rec = generate_recommendation(
            risk_level=RISK_LEVEL_CRITICAL,
            deadline_status=DEADLINE_STATUS_OVERDUE,
            days_remaining=-5,
        )
        assert "EMERGENCY" in rec
        assert "condonation of delay" in rec

    def test_critical_deadline_with_bottleneck_recommendation(self):
        """Approaching deadline + bottleneck recommends fast-tracking file."""
        from app.services.intelligence.schemas import BottleneckInfo
        b_info = BottleneckInfo(
            stage="Legal Review",
            days_pending=16,
            severity=BOTTLENECK_SEVERITY_CRITICAL,
            root_cause_description="Stalled",
        )
        rec = generate_recommendation(
            risk_level=RISK_LEVEL_CRITICAL,
            deadline_status=DEADLINE_STATUS_CRITICAL,
            days_remaining=4,
            bottleneck_info=b_info,
        )
        assert "URGENT: Only 4 day(s) remain" in rec
        assert "Legal Review" in rec

    def test_compute_case_intelligence_end_to_end(self):
        """compute_case_intelligence produces a complete CaseIntelligenceResult model."""
        case = {
            "id": "KA-2026-TEST",
            "file_number": "KA/REV/2026/00999",
            "title": "Writ Petition 4002/2026",
            "current_stage": "Legal Review",
            "department": "Land Revenue",
            "limitation_deadline": "2026-08-24",  # 6 days remaining
            "last_movement_date": "2026-08-08T10:00:00Z",  # 10 days dwell
            "status": "IN_PROGRESS",
            "created_at": "2026-07-15T00:00:00Z",
        }
        intel = compute_case_intelligence(case, current_date=TEST_REF_DATE)

        assert isinstance(intel, CaseIntelligenceResult)
        assert intel.case_id == "KA-2026-TEST"
        assert intel.days_remaining == 6
        assert intel.deadline_status == DEADLINE_STATUS_CRITICAL
        assert intel.delay_status in ("DELAYED", "AT_RISK")
        assert intel.priority == PRIORITY_IMMEDIATE
        assert intel.bottleneck_stage == "Legal Review"
        assert intel.bottleneck_info is not None
        assert intel.risk_score >= 50.0
        assert len(intel.reasons) >= 2


# ============================================================
# 5. PRIORITY RANKING & DASHBOARD AGGREGATION TESTS
# ============================================================

class TestPriorityAndDashboardAggregation:
    """Tests for case priority ranking and executive dashboard KPI computation."""

    def test_case_ranking_order(self):
        """
        Ranks cases in correct operational hierarchy:
        1. Overdue first (regardless of other factors)
        2. Higher risk score second
        3. Fewer days remaining third
        4. Older case age fourth
        """
        cases = [
            # Case 1: Safe, 45 days remaining
            {
                "id": "c-safe",
                "limitation_deadline": "2026-10-02",
                "current_stage": "Application Received",
                "created_at": "2026-08-01T00:00:00Z",
            },
            # Case 2: Approaching, 6 days remaining
            {
                "id": "c-urgent",
                "limitation_deadline": "2026-08-24",
                "current_stage": "Legal Review",
                "last_movement_date": "2026-08-08T00:00:00Z",
                "created_at": "2026-07-15T00:00:00Z",
            },
            # Case 3: Overdue (-3 days)
            {
                "id": "c-overdue",
                "limitation_deadline": "2026-08-15",
                "current_stage": "Officer Review",
                "created_at": "2026-06-01T00:00:00Z",
            },
            # Case 4: Watch, 18 days remaining
            {
                "id": "c-watch",
                "limitation_deadline": "2026-09-05",
                "current_stage": "Document Verification",
                "created_at": "2026-07-20T00:00:00Z",
            },
        ]

        ranked = rank_cases(cases, current_date=TEST_REF_DATE)
        ranked_ids = [c["id"] for c in ranked]

        # Expected order: c-overdue first, then c-urgent (6d), then c-watch (18d), then c-safe (45d)
        assert ranked_ids[0] == "c-overdue"
        assert ranked_ids[1] == "c-urgent"
        assert ranked_ids[2] == "c-watch"
        assert ranked_ids[3] == "c-safe"

    def test_dashboard_aggregation_accuracy(self):
        """aggregate_dashboard_intelligence computes real KPI numbers correctly."""
        cases = [
            {"id": "c1", "status": "IN_PROGRESS", "limitation_deadline": "2026-08-22", "current_stage": "Legal Review", "last_movement_date": "2026-08-01T00:00:00Z", "department": "Public Works"},
            {"id": "c2", "status": "IN_PROGRESS", "limitation_deadline": "2026-08-10", "current_stage": "Legal Review", "last_movement_date": "2026-08-01T00:00:00Z", "department": "Public Works"}, # Overdue
            {"id": "c3", "status": "REGISTERED", "limitation_deadline": "2026-10-15", "current_stage": "Application Received", "department": "Land Revenue"},
            {"id": "c4", "status": "DISPOSED", "limitation_deadline": "2026-07-01", "current_stage": "Closure", "department": "Finance"},
        ]
        opinions = {
            "c1": {"status": "REQUESTED"},
            "c2": {"status": "OVERDUE"},
        }

        summary = aggregate_dashboard_intelligence(
            cases, legal_opinions_by_case=opinions, current_date=TEST_REF_DATE
        )

        assert isinstance(summary, DashboardIntelligenceSummary)
        assert summary.total_cases == 4
        assert summary.active_cases == 3
        assert summary.pending_cases == 1
        assert summary.overdue_cases == 1
        assert summary.approaching_deadline_cases >= 1
        assert summary.legal_opinion_pending == 2
        assert summary.primary_bottleneck_stage == "Legal Review"
        assert summary.department_bottlenecks.get("Public Works") == 2
