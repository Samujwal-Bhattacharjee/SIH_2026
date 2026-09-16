"""
Security utilities: JWT verification, password handling, and auth dependencies.
Uses Supabase JWT validation — no separate JWT library setup needed.
"""
import logging
from typing import Any
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings
from app.core.database import get_supabase

logger = logging.getLogger(__name__)

# FastAPI HTTP Bearer extractor
bearer_scheme = HTTPBearer(auto_error=False)

DEV_JWT_SECRET = settings.SUPABASE_JWT_SECRET if (settings.SUPABASE_JWT_SECRET and len(settings.SUPABASE_JWT_SECRET.strip()) > 5) else "GOIP_GOVERNMENT_SECURE_JWT_SECRET_2026"


def create_local_jwt(user_id: str, email: str, role: str = "OPERATIONS_OFFICER", name: str = "") -> str:
    """Generate a locally signed JWT token for offline / development resilience."""
    from datetime import datetime, timezone, timedelta
    payload = {
        "sub": user_id,
        "email": email,
        "user_metadata": {
            "full_name": name or email.split("@")[0].title(),
            "role": role,
            "department": "Department of Administrative Reforms",
            "designation": "Procurement Officer",
        },
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
    }
    return jwt.encode(payload, DEV_JWT_SECRET, algorithm="HS256")


import jwt as pyjwt
from jwt import PyJWKClient

_jwks_client: PyJWKClient | None = None


def get_jwks_client() -> PyJWKClient | None:
    """Return the singleton PyJWKClient for verifying Supabase asymmetric JWTs (ES256/RS256)."""
    global _jwks_client
    if _jwks_client is None and settings.SUPABASE_URL:
        try:
            jwks_url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"
            _jwks_client = PyJWKClient(jwks_url, cache_jwk_set=True, lifespan=3600)
            logger.info("Supabase JWKS client initialized")
        except Exception as e:
            logger.warning(f"Could not initialize Supabase JWKS client: {e}")
    return _jwks_client


def decode_supabase_jwt(token: str) -> dict:
    """
    Decode and verify a Supabase-issued or locally signed JWT.
    1. Local HS256 JWT signature verification (for local officer email/password auth).
    2. Supabase token verification via JWKS (for Supabase asymmetric ES256/RS256 keys).
    3. Supabase Auth API verification fallback (get_claims / get_user).
    Returns the verified payload dict with 'sub', 'email', 'user_metadata' if valid.
    """
    # 1. Attempt local JWT decode (local officer login)
    try:
        payload = jwt.decode(
            token,
            DEV_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        if payload.get("sub"):
            return payload
    except Exception as e:
        logger.debug(f"Local JWT decode failed: {e}")

    # 2. Supabase JWKS signature verification (ES256/RS256)
    try:
        jwks_client = get_jwks_client()
        if jwks_client:
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            payload = pyjwt.decode(
                token,
                signing_key.key,
                algorithms=["ES256", "RS256"],
                options={"verify_aud": False},
            )
            if payload.get("sub"):
                return {
                    "sub": str(payload.get("sub")),
                    "email": payload.get("email") or "",
                    "user_metadata": payload.get("user_metadata") or {},
                    "app_metadata": payload.get("app_metadata") or {},
                    "role": payload.get("role") or "authenticated",
                }
    except Exception as e:
        logger.debug(f"JWKS token verification failed: {e}")

    # 3. Direct Supabase Auth API token verification
    try:
        supabase = get_supabase()
        if hasattr(supabase.auth, "get_claims"):
            try:
                claims_resp = supabase.auth.get_claims(token)
                if claims_resp and claims_resp.claims:
                    c = claims_resp.claims
                    if c.get("sub"):
                        return {
                            "sub": str(c.get("sub")),
                            "email": c.get("email") or "",
                            "user_metadata": c.get("user_metadata") or {},
                            "app_metadata": c.get("app_metadata") or {},
                            "role": c.get("role") or "authenticated",
                        }
            except Exception as e_claims:
                logger.debug(f"Supabase get_claims failed: {e_claims}")

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
    user_id = str(payload.get("sub") or "")
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
    user_id = str(payload.get("sub") or "")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token does not contain a valid user identifier",
        )

    supabase = get_supabase()
    try:
        result = supabase.table("users").select("*").eq("id", user_id).maybe_single().execute()
        u_data: Any = getattr(result, "data", None)
        if result and isinstance(u_data, dict):
            return u_data
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
        "role": user_metadata.get("role") or "OPERATIONS_OFFICER",
        "department": user_metadata.get("department") or "Department of Administrative Reforms",
        "designation": user_metadata.get("designation") or "Procurement Officer",
        "badge_number": f"GOI-{user_id[:8].upper()}",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    try:
        supabase.table("users").upsert(new_profile).execute()
        return new_profile
    except Exception as e:
        logger.debug(f"Could not auto-insert profile for OAuth user {user_id}: {e}")
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
