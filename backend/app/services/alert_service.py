"""
Alert Service — generates real, data-driven alerts from the database.
No random alert generation. Every alert has a concrete cause.

Alert Types:
  - DEADLINE_30D: Case approaching 30-day threshold
  - DEADLINE_15D: Urgent — 15 days remaining
  - DEADLINE_7D:  Critical — 7 days remaining
  - OVERDUE:      Limitation deadline has passed
  - LEGAL_OVERDUE: Legal opinion is overdue
  - UNASSIGNED:   Case has no assigned officer
  - STALLED:      Case has been at same stage too long

Alerts are stored in the `alerts` table and refreshed by this service.
"""
import logging
from datetime import datetime, timezone
from typing import List
from app.core.database import get_supabase
from app.services.deadline_service import calculate_days_remaining

logger = logging.getLogger(__name__)


def _create_alert(case_id: str, alert_type: str, severity: str, message: str, due_date: str | None = None):
    """
    Insert a new alert if one of the same type for this case doesn't already exist.
    Avoids duplicate alerts for the same condition.
    """
    supabase = get_supabase()
    # Check for existing unread alert of same type
    existing = supabase.table("alerts")\
        .select("id")\
        .eq("case_id", case_id)\
        .eq("type", alert_type)\
        .eq("is_read", False)\
        .execute()

    if existing.data:
        return  # Alert already exists, don't duplicate

    supabase.table("alerts").insert({
        "case_id": case_id,
        "type": alert_type,
        "severity": severity,
        "message": message,
        "due_date": due_date,
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }).execute()


def refresh_alerts_for_case(case: dict, legal_opinion: dict | None = None):
    """
    Evaluate a single case and generate/update alerts as appropriate.
    Called whenever a case is updated or movement is recorded.
    """
    case_id = case.get("id")
    days_remaining = case.get("daysRemaining", 999)
    limitation_deadline = case.get("limitation_deadline")
    assigned_officer = case.get("assigned_officer")

    # --- Alert: Overdue ---
    if days_remaining < 0:
        _create_alert(
            case_id=case_id,
            alert_type="OVERDUE",
            severity="CRITICAL",
            message=f"Limitation deadline has passed by {abs(days_remaining)} day(s). Immediate escalation required.",
            due_date=limitation_deadline,
        )

    # --- Alert: 7 days ---
    elif days_remaining <= 7:
        _create_alert(
            case_id=case_id,
            alert_type="DEADLINE_7D",
            severity="HIGH",
            message=f"Critical: Only {days_remaining} day(s) remaining before limitation deadline.",
            due_date=limitation_deadline,
        )

    # --- Alert: 15 days ---
    elif days_remaining <= 15:
        _create_alert(
            case_id=case_id,
            alert_type="DEADLINE_15D",
            severity="HIGH",
            message=f"Urgent: {days_remaining} days remaining. Expedite processing immediately.",
            due_date=limitation_deadline,
        )

    # --- Alert: 30 days ---
    elif days_remaining <= 30:
        _create_alert(
            case_id=case_id,
            alert_type="DEADLINE_30D",
            severity="MEDIUM",
            message=f"Case approaching limitation deadline: {days_remaining} days remaining.",
            due_date=limitation_deadline,
        )

    # --- Alert: Unassigned case ---
    if not assigned_officer:
        _create_alert(
            case_id=case_id,
            alert_type="UNASSIGNED",
            severity="MEDIUM",
            message="Case has no assigned officer. Please assign immediately.",
        )

    # --- Alert: Legal opinion overdue ---
    if legal_opinion:
        lo_status = legal_opinion.get("status")
        lo_due = legal_opinion.get("due_date")
        if lo_due and calculate_days_remaining(lo_due[:10]) < 0 and lo_status not in ("RECEIVED", "CLOSED"):
            _create_alert(
                case_id=case_id,
                alert_type="LEGAL_OVERDUE",
                severity="HIGH",
                message=f"Legal opinion requested on {legal_opinion.get('requested_at', 'unknown date')} is overdue.",
                due_date=lo_due,
            )


def run_global_alert_refresh():
    """
    Run alert generation across ALL active cases.
    Call this on a schedule or after bulk operations.
    For the prototype, this is called via the /api/v1/alerts/refresh endpoint.
    """
    logger.info("Starting global alert refresh...")
    supabase = get_supabase()

    # Get all non-terminal cases
    terminal_statuses = ["DISPOSED", "APPROVED", "REJECTED", "RESOLVED", "CLOSED"]
    cases_result = supabase.table("cases").select("*").not_.in_("status", terminal_statuses).execute()
    cases = cases_result.data or []

    for case in cases:
        try:
            # Get legal opinion if any
            lo_result = supabase.table("legal_opinions")\
                .select("*")\
                .eq("case_id", case["id"])\
                .not_.in_("status", ["RECEIVED", "CLOSED"])\
                .maybe_single()\
                .execute()
            legal_opinion = lo_result.data if (lo_result and getattr(lo_result, "data", None)) else None

            # Inject computed fields
            from app.services.deadline_service import enrich_case_with_deadlines
            case = enrich_case_with_deadlines(case)

            refresh_alerts_for_case(case, legal_opinion)
        except Exception as e:
            logger.error(f"Alert refresh failed for case {case.get('id')}: {e}")

    logger.info(f"Alert refresh complete. Processed {len(cases)} cases.")
