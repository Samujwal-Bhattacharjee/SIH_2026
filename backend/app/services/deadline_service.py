"""
Deadline Service — centralized date and limitation calculation.

All deadline-related logic lives here. Do NOT scatter date arithmetic
across other services. When the rules change, change only this file.

Assumption: limitation_days is stored per case in the database.
The relevant start date is received_date (when the department
received the court order / document), not a global constant.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional


def calculate_deadline(
    start_date: str,
    limitation_days: int,
) -> str:
    """
    Calculate the limitation deadline.

    Args:
        start_date: ISO date string (YYYY-MM-DD) — the relevant start date
                    (e.g. date court order was received by the department)
        limitation_days: number of days within which action must be taken

    Returns:
        ISO date string of the deadline
    """
    start = datetime.fromisoformat(start_date).replace(tzinfo=timezone.utc)
    deadline = start + timedelta(days=limitation_days)
    return deadline.date().isoformat()


def calculate_days_remaining(deadline_str: str) -> int:
    """
    Calculate how many days remain until the deadline.
    Negative value means the deadline has passed (overdue).

    Args:
        deadline_str: ISO date string of the deadline (YYYY-MM-DD)

    Returns:
        Integer days remaining (can be negative)
    """
    today = datetime.now(timezone.utc).date()
    deadline = datetime.fromisoformat(deadline_str).date()
    return (deadline - today).days


def calculate_age_days(created_at: str) -> int:
    """
    Calculate how many days old a case is.

    Args:
        created_at: ISO datetime string of when the case was created

    Returns:
        Integer number of days since creation
    """
    today = datetime.now(timezone.utc).date()
    created = datetime.fromisoformat(created_at.replace("Z", "+00:00")).date()
    return (today - created).days


def get_deadline_status(days_remaining: int) -> str:
    """
    Classify a case by how many days remain until its deadline.

    Configurable thresholds — change here only.

    Returns:
        One of: "OVERDUE", "CRITICAL", "HIGH", "MEDIUM", "LOW"
    """
    if days_remaining < 0:
        return "OVERDUE"
    elif days_remaining <= 7:
        return "CRITICAL"
    elif days_remaining <= 15:
        return "HIGH"
    elif days_remaining <= 30:
        return "MEDIUM"
    else:
        return "LOW"


def map_deadline_status_to_risk_level(deadline_status: str) -> str:
    """Map deadline status to RiskLevel enum (HIGH/MEDIUM/LOW)."""
    mapping = {
        "OVERDUE": "HIGH",
        "CRITICAL": "HIGH",
        "HIGH": "HIGH",
        "MEDIUM": "MEDIUM",
        "LOW": "LOW",
    }
    return mapping.get(deadline_status, "LOW")


def map_deadline_status_to_priority(deadline_status: str) -> str:
    """Map deadline status to PriorityLevel enum."""
    mapping = {
        "OVERDUE": "IMMEDIATE",
        "CRITICAL": "IMMEDIATE",
        "HIGH": "URGENT",
        "MEDIUM": "URGENT",
        "LOW": "ROUTINE",
    }
    return mapping.get(deadline_status, "ROUTINE")


def map_deadline_status_to_case_status(days_remaining: int, current_status: str) -> str:
    """
    Suggest a case status update based on deadline.
    Does not override terminal statuses (DISPOSED, APPROVED, REJECTED).
    """
    terminal_statuses = {"DISPOSED", "APPROVED", "REJECTED", "RESOLVED", "CLOSED"}
    if current_status in terminal_statuses:
        return current_status
    if days_remaining < 0:
        return "OVERDUE"
    elif days_remaining <= 7:
        return "SLA_BREACHED"
    elif days_remaining <= 15:
        return "AT_RISK"
    return current_status


def enrich_case_with_deadlines(case: dict) -> dict:
    """
    Given a raw case dict from the database, compute and inject
    all deadline-derived fields: ageDays, daysRemaining, riskLevel, priority.

    This is called before returning any case to the frontend.
    """
    # Age of the case
    case["ageDays"] = calculate_age_days(case.get("created_at", datetime.now(timezone.utc).isoformat()))

    # Days remaining
    limitation_deadline = case.get("limitation_deadline")
    if limitation_deadline:
        days_remaining = calculate_days_remaining(limitation_deadline)
    else:
        # Fall back to statutory deadline days from creation date
        statutory_days = case.get("statutory_deadline_days", 90)
        created_at = case.get("created_at", datetime.now(timezone.utc).isoformat())
        deadline = calculate_deadline(created_at[:10], statutory_days)
        days_remaining = calculate_days_remaining(deadline)

    case["daysRemaining"] = days_remaining

    # Deadline status → risk level and priority
    deadline_status = get_deadline_status(days_remaining)
    case["riskLevel"] = map_deadline_status_to_risk_level(deadline_status)
    case["priority"] = map_deadline_status_to_priority(deadline_status)

    return case
