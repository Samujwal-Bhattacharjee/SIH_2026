"""
Security utilities: JWT verification, password handling, and auth dependencies.
Uses Supabase JWT validation — no separate JWT library setup needed.
"""
import logging
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings
from app.core.database import get_supabase

logger = logging.getLogger(__name__)

# FastAPI HTTP Bearer extractor
bearer_scheme = HTTPBearer(auto_error=False)


def decode_supabase_jwt(token: str) -> dict:
    """
    Decode and verify a Supabase-issued JWT.
    1. Attempts local signature verification if SUPABASE_JWT_SECRET is configured.
    2. Falls back to direct Supabase Auth API token verification (works for all Supabase key types).
    Returns the payload dict with 'sub', 'email', 'user_metadata' if valid.
    """
    # 1. Attempt local JWT decode if secret is provided
    if settings.SUPABASE_JWT_SECRET and len(settings.SUPABASE_JWT_SECRET.strip()) > 5:
        try:
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET.strip(),
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
            if payload.get("sub"):
                return payload
        except Exception as e:
            logger.debug(f"Local JWT secret decode failed, attempting Supabase Auth API: {e}")

    # 2. Direct Supabase Auth API token verification
    try:
        supabase = get_supabase()
        user_resp = supabase.auth.get_user(token)
        if user_resp and user_resp.user:
            u = user_resp.user
            return {
                "sub": str(u.id),
                "email": u.email or "",
                "user_metadata": u.user_metadata or {},
                "app_metadata": u.app_metadata or {},
                "role": u.role,
            }
    except Exception as e:
        logger.warning(f"Supabase Auth API token verification failed: {e}")

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication token",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> str:
    """
    FastAPI dependency: extract and validate bearer token, return Supabase user_id (UUID).
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials are required",
        )
    payload = decode_supabase_jwt(credentials.credentials)
    user_id: str = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token does not contain a valid user identifier",
        )
    return user_id


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    """
    FastAPI dependency: fetch user profile from `users` table.
    If the user authenticated via Supabase OAuth (e.g. Google) for the first time,
    automatically provisions their default officer profile row.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials are required",
        )
    payload = decode_supabase_jwt(credentials.credentials)
    user_id: str = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token does not contain a valid user identifier",
        )

    supabase = get_supabase()
    try:
        result = supabase.table("users").select("*").eq("id", user_id).maybe_single().execute()
        if result and getattr(result, "data", None):
            return result.data
    except Exception as e:
        logger.debug(f"User profile lookup from table failed for {user_id}: {e}")

    # First-time Google OAuth / Supabase login: auto-provision user profile
    email = payload.get("email", "")
    user_metadata = payload.get("user_metadata", {})
    name = (
        user_metadata.get("full_name")
        or user_metadata.get("name")
        or (email.split("@")[0].replace(".", " ").title() if email else "Officer User")
    )
    from datetime import datetime, timezone
    new_profile = {
        "id": user_id,
        "email": email or f"{user_id[:8]}@gov.local",
        "name": name,
        "role": "OPERATIONS_OFFICER",
        "department": "General Administration",
        "designation": "Operations Officer",
        "badge_number": f"GOI-{user_id[:8].upper()}",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    try:
        supabase.table("users").upsert(new_profile).execute()
        return new_profile
    except Exception as e:
        logger.warning(f"Could not auto-insert profile for OAuth user {user_id}: {e}")
        return new_profile


def require_role(*allowed_roles: str):
    """
    FastAPI dependency factory: enforce that the current user has one of the allowed roles.

    Usage:
        @router.get("/admin-only")
        async def admin_endpoint(user=Depends(require_role("ADMINISTRATOR", "DEPARTMENT_HEAD"))):
            ...
    """
    async def role_check(user: dict = Depends(get_current_user)) -> dict:
        if user.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(allowed_roles)}",
            )
        return user
    return role_check
