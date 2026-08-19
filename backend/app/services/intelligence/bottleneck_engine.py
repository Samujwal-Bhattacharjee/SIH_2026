"""
Bottleneck and File Stagnation Detection Engine.

Analyzes case stage progression and movement logs to detect where files
are stalled, identifying the responsible department/officer and severity.
"""
from datetime import datetime, date, timezone
from typing import List, Dict, Any, Optional, Union
from app.services.intelligence.constants import (
    STAGE_WARNING_DAYS,
    STAGE_CRITICAL_DAYS,
    STAGE_BASELINE_DAYS,
    DEFAULT_STAGE_BASELINE_DAYS,
    BOTTLENECK_SEVERITY_LOW,
    BOTTLENECK_SEVERITY_MODERATE,
    BOTTLENECK_SEVERITY_CRITICAL,
    TERMINAL_CASE_STATUSES,
)
from app.services.intelligence.schemas import BottleneckInfo
from app.services.intelligence.deadline_engine import normalize_to_date


def calculate_stage_dwell_days(
    case_data: Dict[str, Any],
    movements: Optional[List[Dict[str, Any]]] = None,
    current_date: Optional[Union[str, date, datetime]] = None,
) -> int:
    """
    Calculate the number of days a case has been pending at its current stage.
    
    Priority order for determining the stage start date:
    1. The earliest timestamp of an IN_PROGRESS / current movement.
    2. The most recent movement's `started_at` or `created_at`.
    3. `case_data.last_movement_date`
    4. `case_data.created_at`
    """
    ref_date = normalize_to_date(current_date) or datetime.now(timezone.utc).date()
    
    # 1. Inspect movements if provided
    if movements:
        # Check for open/in-progress movement first
        open_movements = [
            m for m in movements
            if m.get("status") in ("IN_PROGRESS", "FORWARDED", "UNDER_PROCESSING", "UNDER_SCRUTINY")
            or not m.get("completed_at")
        ]
        target_m = open_movements[-1] if open_movements else movements[-1]
        start_val = target_m.get("started_at") or target_m.get("created_at") or target_m.get("timestamp")
        stage_start = normalize_to_date(start_val)
        if stage_start:
            return max(0, (ref_date - stage_start).days)
            
    # 2. Fall back to case properties
    start_val = case_data.get("last_movement_date") or case_data.get("created_at")
    stage_start = normalize_to_date(start_val)
    if stage_start:
        return max(0, (ref_date - stage_start).days)
        
    return 0


def detect_case_bottleneck(
    case_data: Dict[str, Any],
    movements: Optional[List[Dict[str, Any]]] = None,
    current_date: Optional[Union[str, date, datetime]] = None,
) -> Optional[BottleneckInfo]:
    """
    Evaluate whether the case is currently stuck in a workflow bottleneck.
    
    Returns:
        BottleneckInfo if stage dwell exceeds STAGE_WARNING_DAYS, else None.
    """
    # Terminal cases are completed — no active bottleneck
    case_status = str(case_data.get("status", "")).upper()
    if case_status in TERMINAL_CASE_STATUSES:
        return None

    current_stage = case_data.get("current_stage") or case_data.get("currentStage")
    if not current_stage:
        return None

    dwell_days = calculate_stage_dwell_days(case_data, movements=movements, current_date=current_date)
    baseline_days = STAGE_BASELINE_DAYS.get(current_stage, DEFAULT_STAGE_BASELINE_DAYS)

    # Determine responsible officer / department from movement or case
    responsible_dept = case_data.get("department")
    responsible_officer = case_data.get("assignedOfficer") or case_data.get("assigned_officer")
    
    if movements:
        last_m = movements[-1]
        responsible_dept = last_m.get("to_department") or last_m.get("department") or responsible_dept
        responsible_officer = (
            last_m.get("to_officer")
            or last_m.get("officer")
            or last_m.get("assigned_to")
            or responsible_officer
        )

    # Evaluate against thresholds
    if dwell_days >= STAGE_CRITICAL_DAYS:
        severity = BOTTLENECK_SEVERITY_CRITICAL
        desc = (
            f"File has been stalled at '{current_stage}' for {dwell_days} days "
            f"(critical threshold: {STAGE_CRITICAL_DAYS} days, baseline: {baseline_days} days). "
            f"Immediate administrative intervention required."
        )
    elif dwell_days >= STAGE_WARNING_DAYS:
        severity = BOTTLENECK_SEVERITY_MODERATE
        desc = (
            f"File has been pending at '{current_stage}' for {dwell_days} days "
            f"(warning threshold: {STAGE_WARNING_DAYS} days, baseline: {baseline_days} days). "
            f"Stage follow-up recommended."
        )
    else:
        # Below threshold: normal progression, not a bottleneck
        return None

    return BottleneckInfo(
        stage=current_stage,
        days_pending=dwell_days,
        severity=severity,
        responsible_department=responsible_dept,
        responsible_officer=responsible_officer,
        is_bottleneck=True,
        root_cause_description=desc,
    )
