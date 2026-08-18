"""
Alerts routes.
"""
import logging
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from app.core.security import get_current_user
from app.core.database import get_supabase
from app.services.alert_service import run_global_alert_refresh

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("", summary="List alerts")
async def list_alerts(
    is_read: Optional[bool] = Query(None),
    severity: Optional[str] = Query(None),
    user: dict = Depends(get_current_user),
):
    """List all alerts. Filter by read status or severity."""
    supabase = get_supabase()
    query = supabase.table("alerts").select("*")
    if is_read is not None:
        query = query.eq("is_read", is_read)
    if severity:
        query = query.eq("severity", severity)
    result = query.order("created_at", desc=True).limit(100).execute()
    return result.data or []


@router.put("/{alert_id}/read", summary="Mark alert as read")
async def mark_alert_read(
    alert_id: str,
    user: dict = Depends(get_current_user),
):
    """Mark a specific alert as read."""
    supabase = get_supabase()
    result = supabase.table("alerts").update({"is_read": True}).eq("id", alert_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"success": True, "id": alert_id}


@router.post("/refresh", summary="Trigger global alert refresh (admin)")
async def trigger_alert_refresh(user: dict = Depends(get_current_user)):
    """Re-evaluate all active cases and generate/update alerts accordingly."""
    try:
        run_global_alert_refresh()
        return {"message": "Alert refresh complete"}
    except Exception as e:
        logger.error(f"Alert refresh failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
