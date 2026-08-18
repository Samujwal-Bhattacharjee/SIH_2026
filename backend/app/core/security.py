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
    Returns the payload dict if valid, raises HTTPException if not.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},  # Supabase does not set aud by default
        )
        return payload
    except JWTError as e:
        logger.warning(f"JWT decode failed: {e}")
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
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """
    FastAPI dependency: fetch full user profile from the `users` table.
    Returns the user row dict.
    """
    supabase = get_supabase()
    result = supabase.table("users").select("*").eq("id", user_id).maybe_single().execute()
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found. Please contact your system administrator.",
        )
    return result.data


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
