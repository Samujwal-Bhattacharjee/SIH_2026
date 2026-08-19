"""
Deadline & Limitation Calculation Engine.

Provides transparent, deterministic date arithmetic for case deadlines and SLA status.
All calculations accept an optional `current_date` parameter for deterministic testing.
"""
from datetime import datetime, date, timedelta, timezone
from typing import Optional, Tuple, Union
from app.services.intelligence.constants import (
    DEADLINE_THRESHOLD_SAFE_MIN,
    DEADLINE_THRESHOLD_WATCH_MIN,
    DEADLINE_THRESHOLD_HIGH_MIN,
    DEADLINE_THRESHOLD_CRITICAL_MIN,
    DEADLINE_STATUS_SAFE,
    DEADLINE_STATUS_WATCH,
    DEADLINE_STATUS_HIGH,
    DEADLINE_STATUS_CRITICAL,
    DEADLINE_STATUS_DUE_TODAY,
    DEADLINE_STATUS_OVERDUE,
    DEADLINE_STATUS_UNKNOWN,
    DELAY_STATUS_ON_TRACK,
    DELAY_STATUS_MONITOR,
    DELAY_STATUS_AT_RISK,
    DELAY_STATUS_DELAYED,
    DELAY_STATUS_OVERDUE,
    DELAY_STATUS_UNKNOWN,
)


def normalize_to_date(val: Optional[Union[str, date, datetime]]) -> Optional[date]:
    """
    Safely parse an ISO date string, date object, or datetime object into a datetime.date.
    Handles ISO strings with or without timezone info, 'Z' suffix, or timestamps.
    """
    if val is None:
        return None
    if isinstance(val, date) and not isinstance(val, datetime):
        return val
    if isinstance(val, datetime):
        return val.date()
    if isinstance(val, str):
        cleaned = val.strip()
        if not cleaned:
            return None
        # Handle 'Z' or timezone offsets or variable fractional seconds
        try:
            from dateutil import parser as date_parser
            return date_parser.isoparse(cleaned).date()
        except Exception:
            try:
                from dateutil import parser as date_parser
                return date_parser.parse(cleaned).date()
            except Exception:
                return None
    return None


def calculate_days_remaining(
    deadline_date: Optional[Union[str, date, datetime]],
    current_date: Optional[Union[str, date, datetime]] = None,
) -> Optional[int]:
    """
    Calculate the signed number of days between current_date and deadline_date.
    
    Returns:
        Positive integer if deadline is in the future.
        0 if deadline is today.
        Negative integer if deadline has passed (overdue).
        None if deadline_date is missing or invalid.
    """
    target = normalize_to_date(deadline_date)
    if target is None:
        return None
    
    ref = normalize_to_date(current_date)
    if ref is None:
        ref = datetime.now(timezone.utc).date()
        
    return (target - ref).days


def classify_deadline_status(days_remaining: Optional[int]) -> str:
    """
    Classify a case's deadline urgency based on days remaining.
    
    Classification rules:
        > 30 days:   SAFE
        16–30 days:  WATCH
        8–15 days:   HIGH
        1–7 days:    CRITICAL
        0 days:      DUE_TODAY
        < 0 days:    OVERDUE
        None:        UNKNOWN
    """
    if days_remaining is None:
        return DEADLINE_STATUS_UNKNOWN
    
    if days_remaining < 0:
        return DEADLINE_STATUS_OVERDUE
    elif days_remaining == 0:
        return DEADLINE_STATUS_DUE_TODAY
    elif days_remaining <= 7:
        return DEADLINE_STATUS_CRITICAL
    elif days_remaining <= 15:
        return DEADLINE_STATUS_HIGH
    elif days_remaining <= 30:
        return DEADLINE_STATUS_WATCH
    else:
        return DEADLINE_STATUS_SAFE


def calculate_deadline_status(
    deadline_date: Optional[Union[str, date, datetime]],
    current_date: Optional[Union[str, date, datetime]] = None,
) -> Tuple[Optional[int], str]:
    """
    Single combined helper returning (days_remaining, deadline_status).
    """
    days = calculate_days_remaining(deadline_date, current_date=current_date)
    status = classify_deadline_status(days)
    return days, status


def calculate_case_age(
    created_at: Optional[Union[str, date, datetime]],
    current_date: Optional[Union[str, date, datetime]] = None,
) -> int:
    """
    Calculate the age of a case in days since creation.
    Returns 0 if created_at is missing or in the future.
    """
    start = normalize_to_date(created_at)
    if start is None:
        return 0
    ref = normalize_to_date(current_date) or datetime.now(timezone.utc).date()
    diff = (ref - start).days
    return max(0, diff)


def calculate_statutory_deadline(
    start_date: Union[str, date, datetime],
    statutory_days: int,
) -> Optional[str]:
    """
    Calculate an ISO date string for a deadline given a start date and day count.
    """
    start = normalize_to_date(start_date)
    if start is None or statutory_days is None:
        return None
    deadline = start + timedelta(days=int(statutory_days))
    return deadline.isoformat()


def determine_delay_status(
    days_remaining: Optional[int],
    stage_stagnation_days: int = 0,
    is_overdue: bool = False,
) -> str:
    """
    Determine composite operational delay status.
    """
    if days_remaining is None:
        if stage_stagnation_days >= 15:
            return DELAY_STATUS_DELAYED
        elif stage_stagnation_days >= 7:
            return DELAY_STATUS_AT_RISK
        return DELAY_STATUS_UNKNOWN

    if days_remaining < 0 or is_overdue:
        return DELAY_STATUS_OVERDUE
    elif days_remaining <= 7 or stage_stagnation_days >= 15:
        return DELAY_STATUS_DELAYED
    elif days_remaining <= 15 or stage_stagnation_days >= 7:
        return DELAY_STATUS_AT_RISK
    elif days_remaining <= 30:
        return DELAY_STATUS_MONITOR
    else:
        return DELAY_STATUS_ON_TRACK
