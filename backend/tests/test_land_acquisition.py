"""
Comprehensive Automated Test Suite for Land Acquisition Delay Prediction
==========================================================================
SIH26017 — Ministry of Rural Development

Tests:
- Land acquisition workflow sequence and expected durations
- Land document OCR field extraction (regex extraction, missing fields, error handling)
- ML model features, training, inference, probability bounds, and feature importance
- Bottleneck detection on Land Acquisition stages
- Explainable recommendation engine for Land Acquisition delay factors
- Data integrity and anti-leakage verification
"""
import pytest
import os
import json
from app.core.land_workflow import (
    LAND_ACQUISITION_STAGES,
    STAGE_EXPECTED_DAYS,
    STAGE_CRITICALITY_WEIGHTS,
    get_expected_days,
    get_stage_index,
    get_next_stage,
    get_risk_level_from_probability,
)
from app.services.land_document_extractor import extract_la_fields, fields_to_ocr_list
from app.services.prediction.features import build_feature_vector, FEATURE_NAMES, TARGET_COLUMN
from app.services.prediction.predict import predict_delay
from app.services.prediction.model_loader import load_model, is_model_ready, get_metrics
from app.services.intelligence.bottleneck_engine import detect_case_bottleneck, calculate_stage_dwell_days
from app.services.intelligence.recommendation_engine import generate_la_recommendations


# ============================================================
# 1. LAND ACQUISITION WORKFLOW TESTS
# ============================================================

class TestLandWorkflow:
    def test_canonical_stages_order(self):
        """Verify the 11-stage canonical sequence."""
        assert len(LAND_ACQUISITION_STAGES) == 11
        assert LAND_ACQUISITION_STAGES[0] == "Project Initiation"
        assert LAND_ACQUISITION_STAGES[4] == "Ownership Verification"
        assert LAND_ACQUISITION_STAGES[7] == "Compensation Disbursement"
        assert LAND_ACQUISITION_STAGES[-1] == "Possession and Handover"

    def test_stage_durations_exist_and_positive(self):
        """All stages have defined positive baseline durations."""
        for stage in LAND_ACQUISITION_STAGES:
            days = get_expected_days(stage)
            assert isinstance(days, int)
            assert days > 0

    def test_stage_transitions(self):
        """Stage next progression works as expected."""
        assert get_next_stage("Project Initiation") == "Land Identification"
        assert get_next_stage("Final Acquisition") == "Possession and Handover"
        assert get_next_stage("Possession and Handover") is None

    def test_risk_level_classification(self):
        """Test probability to risk level mappings."""
        assert get_risk_level_from_probability(0.85) == "CRITICAL"
        assert get_risk_level_from_probability(0.70) == "HIGH"
        assert get_risk_level_from_probability(0.45) == "MEDIUM"
        assert get_risk_level_from_probability(0.15) == "LOW"


# ============================================================
# 2. LAND DOCUMENT OCR EXTRACTION TESTS
# ============================================================

class TestLandDocumentExtractor:
    def test_extract_all_fields_from_sample_text(self):
        sample_text = """
        GOVERNMENT OF MAHARASHTRA
        REVENUE & FOREST DEPARTMENT
        Project ID: LA-1024
        Project Name: Samruddhi Expressway Interchange Project
        District: Nashik, State of Maharashtra
        Survey No: 142/3A
        Village: Sinnar
        Preliminary Notification issued on 12 August 2026 under Section 11.
        Acquisition Stage: Compensation Disbursement
        Compensation Amount: INR 4500000.00
        Compensation remains pending for 19 days.
        Ownership dispute has been raised by co-owners.
        Writ petition filed in High Court challenging valuation.
        R&R plan in progress.
        Approved by District Collector Rajeshwar V. Verma, IAS.
        """
        extracted = extract_la_fields(sample_text)

        assert extracted.get("project_id") == "LA-1024"
        assert "Samruddhi Expressway" in extracted.get("project_name", "")
        assert extracted.get("district") == "Nashik"
        assert extracted.get("state") == "Maharashtra"
        assert extracted.get("survey_number") == "142/3A"
        assert extracted.get("village") == "Sinnar"
        assert extracted.get("notification_date") == "2026-08-12"
        assert extracted.get("acquisition_stage") == "Compensation Disbursement"
        assert extracted.get("compensation_amount") == 4500000.0
        assert extracted.get("compensation_status") == "PENDING"
        assert extracted.get("ownership_conflict") is True
        assert extracted.get("legal_dispute") is True
        assert extracted.get("rr_status") == "IN_PROGRESS"

    def test_missing_fields_return_none_not_fabricated(self):
        """When text doesn't contain a field, it must not be invented."""
        sparse_text = "General notice regarding road widening in Village Sinnar."
        extracted = extract_la_fields(sparse_text)

        assert "compensation_amount" not in extracted
        assert "notification_date" not in extracted
        assert "project_id" not in extracted

    def test_fields_to_ocr_list_conversion(self):
        data = {
            "project_id": "LA-2026",
            "district": "Pune",
            "ownership_conflict": True,
        }
        ocr_list = fields_to_ocr_list(data)
        assert len(ocr_list) == 3
        keys = {f["key"] for f in ocr_list}
        assert "project_id" in keys
        assert "district" in keys
        assert "ownership_conflict" in keys
        for f in ocr_list:
            assert f["isExtracted"] is True
            assert 0.0 <= f["confidence"] <= 1.0


# ============================================================
# 3. ML MODEL & PREDICTION TESTS
# ============================================================

class TestMLPrediction:
    def test_feature_vector_contains_no_target_leakage(self):
        """Confirm forbidden target columns are NOT in input features."""
        forbidden = {"target_delayed", "target_delay_days", "delay_probability"}
        for f in FEATURE_NAMES:
            assert f not in forbidden

    def test_build_feature_vector_types_and_defaults(self):
        """Feature vector handles empty/partial dictionaries gracefully."""
        fv = build_feature_vector({})
        assert len(fv) == len(FEATURE_NAMES)
        assert fv["documentation_completeness"] == 100.0
        assert fv["legal_dispute"] == 0
        assert fv["ownership_conflict"] == 0
        assert fv["compensation_pending_days"] == 0
        assert fv["current_stage_index"] == 0

    def test_prediction_probability_bounds(self):
        """Model produces probability in [0.0, 1.0] and valid risk levels."""
        sample_project = {
            "project_id": "LA-TEST-01",
            "current_stage": "Ownership Verification",
            "documentation_completeness": 60.0,
            "legal_dispute": True,
            "ownership_conflict": True,
            "compensation_pending_days": 45,
            "inter_dept_dependency": True,
            "number_of_delayed_stages": 2,
            "project_age_days": 180,
        }
        pred = predict_delay(sample_project)

        assert 0.0 <= pred["delay_probability"] <= 1.0
        assert pred["risk_level"] in ("LOW", "MEDIUM", "HIGH", "CRITICAL")
        assert pred["predicted_delay_days"] >= 0
        assert isinstance(pred["top_factors"], list)

    def test_low_risk_project_has_low_probability(self):
        """Clean project with 100% docs and no disputes should be low risk."""
        clean_project = {
            "project_id": "LA-CLEAN",
            "current_stage": "Project Initiation",
            "documentation_completeness": 100.0,
            "legal_dispute": False,
            "ownership_conflict": False,
            "compensation_pending_days": 0,
            "inter_dept_dependency": False,
            "number_of_delayed_stages": 0,
            "project_age_days": 10,
        }
        pred = predict_delay(clean_project)
        assert pred["delay_probability"] < 0.40

    def test_high_risk_project_has_high_probability(self):
        """Project with active conflict, dispute, and compensation delay is high risk."""
        risky_project = {
            "project_id": "LA-RISKY",
            "current_stage": "Compensation Disbursement",
            "documentation_completeness": 40.0,
            "legal_dispute": True,
            "ownership_conflict": True,
            "compensation_pending_days": 90,
            "inter_dept_dependency": True,
            "number_of_delayed_stages": 3,
            "project_age_days": 400,
        }
        pred = predict_delay(risky_project)
        assert pred["delay_probability"] >= 0.60
        assert pred["risk_level"] in ("HIGH", "CRITICAL")


# ============================================================
# 4. BOTTLENECK & RECOMMENDATION TESTS
# ============================================================

class TestBottleneckAndRecommendations:
    def test_bottleneck_detection_on_overdue_stage(self):
        """Stage with high dwell time triggers bottleneck."""
        project_data = {
            "id": "proj-1",
            "current_stage": "Ownership Verification",  # Baseline 30 days
            "department": "Land Revenue",
            "created_at": "2026-01-01T00:00:00Z",
            "last_movement_date": "2026-01-01T00:00:00Z",
        }
        # 60 days dwell > 30 baseline
        ref_date = "2026-03-02"
        dwell = calculate_stage_dwell_days(project_data, current_date=ref_date)
        assert dwell == 60

        bottleneck = detect_case_bottleneck(project_data, current_date=ref_date)
        assert bottleneck is not None
        assert bottleneck.is_bottleneck is True
        assert bottleneck.stage == "Ownership Verification"

    def test_la_recommendation_generation(self):
        """Recommendations match detected factors."""
        project_data = {
            "ownership_conflict": True,
            "legal_dispute": True,
            "compensation_pending_days": 75,
            "documentation_completeness": 50.0,
        }
        recs = generate_la_recommendations(project_data, delay_probability=0.85)

        assert recs["priority"] == "IMMEDIATE"
        action_factors = [a["factor"] for a in recs["recommended_actions"]]
        assert "Ownership Conflict" in action_factors
        assert "Legal Dispute" in action_factors
        assert "Compensation Pending" in action_factors
        assert "Documentation Incomplete" in action_factors
