"""
Feature Definitions for Land Acquisition Delay Prediction Model
================================================================
SIH26017 — Ministry of Rural Development

This module defines the EXACT list of features used as model inputs.
CRITICAL: No feature derived from the final outcome (target_delayed,
target_delay_days, or any post-delay information) is included here.

All features represent information available BEFORE the outcome is known:
i.e., observable project characteristics at prediction time.
"""
from typing import List

# ============================================================
# MODEL INPUT FEATURE NAMES
# These must match the column names in historical_projects.csv
# and the keys returned by build_feature_vector()
# ============================================================
FEATURE_NAMES: List[str] = [
    "documentation_completeness",   # % completeness (0-100)
    "legal_dispute",                # 0 or 1 (boolean)
    "ownership_conflict",           # 0 or 1 (boolean)
    "compensation_pending_days",    # integer days
    "pending_approvals",            # integer count
    "inter_dept_dependency",        # 0 or 1 (boolean)
    "rr_delay_days",                # integer days
    "previous_stage_delay_days",    # integer days
    "number_of_delayed_stages",     # integer count
    "project_age_days",             # integer days
    "current_stage_index",          # integer 0-10 (stage position)
]

# ============================================================
# TARGET COLUMN
# ============================================================
TARGET_COLUMN: str = "target_delayed"    # Binary: 1=delayed, 0=on-track
REGRESSION_TARGET: str = "target_delay_days"   # Days of expected delay

# ============================================================
# FEATURE DESCRIPTIONS (for documentation and UI display)
# ============================================================
FEATURE_DESCRIPTIONS: dict = {
    "documentation_completeness":   "Percentage of required documentation submitted and verified",
    "legal_dispute":                "Whether an active legal dispute or court case exists",
    "ownership_conflict":           "Whether there is a dispute over land ownership or title",
    "compensation_pending_days":    "Number of days compensation payment has been pending",
    "pending_approvals":            "Number of pending inter-departmental approvals",
    "inter_dept_dependency":        "Whether the project has cross-departmental dependencies",
    "rr_delay_days":                "Days of delay in R&R (Rehabilitation & Resettlement) process",
    "previous_stage_delay_days":    "Days by which the previous stage exceeded expected duration",
    "number_of_delayed_stages":     "Total count of stages that exceeded expected duration",
    "project_age_days":             "Total age of the project in days from initiation",
    "current_stage_index":          "Position of current stage in the 11-stage LA workflow (0-10)",
}

# Human-readable labels for UI display
FEATURE_LABELS: dict = {
    "documentation_completeness":   "Documentation Completeness",
    "legal_dispute":                "Legal Dispute Active",
    "ownership_conflict":           "Ownership Conflict",
    "compensation_pending_days":    "Compensation Pending (Days)",
    "pending_approvals":            "Pending Approvals",
    "inter_dept_dependency":        "Inter-Dept Dependency",
    "rr_delay_days":                "R&R Delay (Days)",
    "previous_stage_delay_days":    "Previous Stage Delay (Days)",
    "number_of_delayed_stages":     "Number of Delayed Stages",
    "project_age_days":             "Project Age (Days)",
    "current_stage_index":          "Current Stage Position",
}


def build_feature_vector(project_data: dict) -> dict:
    """
    Extract feature values from a project data dictionary.
    
    Args:
        project_data: Dictionary of project fields (from DB row or API payload)
    
    Returns:
        Dictionary with exactly the FEATURE_NAMES keys and numeric values.
        Missing values are filled with safe defaults (never fabricated).
    """
    from app.core.land_workflow import LAND_ACQUISITION_STAGES, get_stage_index

    current_stage = (
        project_data.get("current_stage")
        or project_data.get("currentStage")
        or "Project Initiation"
    )
    stage_index = get_stage_index(current_stage)
    if stage_index < 0:
        stage_index = 0  # Unknown stage defaults to position 0

    return {
        "documentation_completeness":  float(project_data.get("documentation_completeness") or 100.0),
        "legal_dispute":               int(bool(project_data.get("legal_dispute") or False)),
        "ownership_conflict":          int(bool(project_data.get("ownership_conflict") or False)),
        "compensation_pending_days":   int(project_data.get("compensation_pending_days") or 0),
        "pending_approvals":           int(project_data.get("pending_approvals") or 0),
        "inter_dept_dependency":       int(bool(project_data.get("inter_dept_dependency") or False)),
        "rr_delay_days":               int(project_data.get("rr_delay_days") or 0),
        "previous_stage_delay_days":   int(project_data.get("previous_stage_delay_days") or 0),
        "number_of_delayed_stages":    int(project_data.get("number_of_delayed_stages") or 0),
        "project_age_days":            int(project_data.get("project_age_days") or project_data.get("ageDays") or 0),
        "current_stage_index":         stage_index,
    }
