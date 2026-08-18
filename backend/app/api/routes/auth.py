"""
Authentication routes.
Delegates to Supabase Auth for actual credential verification.
"""
import logging
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, status, Depends, Request
from app.core.database import get_supabase
from app.core.security import get_current_user
from app.schemas import LoginRequest, LoginResponse, UserOut

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/login", response_model=LoginResponse, summary="Authenticate and receive JWT")
async def login(request_body: LoginRequest):
    """
    Authenticate using Supabase Auth.
    Returns the Supabase JWT token and the user profile from our `users` table.

    The frontend stores the token in localStorage as 'gov_session_token'.
    All subsequent requests include it in the Authorization: Bearer header.
    """
    supabase = get_supabase()

    # 1. Authenticate with Supabase Auth
    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": request_body.email,
            "password": request_body.password,
        })
    except Exception as e:
        logger.warning(f"Login failed for {request_body.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please check your email and password.",
        )

    if not auth_response.session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed. No session returned.",
        )

    supabase_user = auth_response.user
    access_token = auth_response.session.access_token

    # 2. Fetch user profile from our `users` table
    profile_result = supabase.table("users")\
        .select("*")\
        .eq("id", str(supabase_user.id))\
        .maybe_single()\
        .execute()

    if not profile_result.data:
        # First-time login: create a basic profile
        # In production, profiles should be pre-created by the admin
        profile = _create_default_profile(supabase, supabase_user)
    else:
        profile = profile_result.data

    # 3. Build UserOut (matches TypeScript User interface)
    expiry = (datetime.now(timezone.utc) + timedelta(hours=8)).isoformat()
    user_out = UserOut(
        id=profile["id"],
        email=profile["email"],
        name=profile.get("name", supabase_user.email.split("@")[0]),
        role=profile.get("role", "SECTION_OFFICER"),
        department=profile.get("department", "General Administration"),
        designation=profile.get("designation"),
        badgeNumber=profile.get("badge_number", f"GOI-{profile['id'][:8].upper()}"),
        sessionExpiry=expiry,
    )

    logger.info(f"Login successful: {request_body.email} ({profile.get('role')})")
    return LoginResponse(user=user_out, token=access_token)


@router.post("/logout", summary="Invalidate current session")
async def logout(user: dict = Depends(get_current_user)):
    """
    Sign out from Supabase. The frontend also clears localStorage.
    """
    supabase = get_supabase()
    try:
        supabase.auth.sign_out()
    except Exception as e:
        logger.warning(f"Supabase sign-out warning: {e}")
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserOut, summary="Get current authenticated user")
async def get_me(user: dict = Depends(get_current_user)):
    """
    Returns the current user profile. Used by AuthContext on page refresh
    to restore the session without re-login.
    """
    from datetime import timedelta
    expiry = (datetime.now(timezone.utc) + timedelta(hours=8)).isoformat()
    return UserOut(
        id=user["id"],
        email=user["email"],
        name=user.get("name", ""),
        role=user.get("role", "SECTION_OFFICER"),
        department=user.get("department", "General Administration"),
        designation=user.get("designation"),
        badgeNumber=user.get("badge_number", f"GOI-{user['id'][:8].upper()}"),
        sessionExpiry=expiry,
    )


def _create_default_profile(supabase, supabase_user) -> dict:
    """Create a minimal user profile for a first-time login."""
    profile = {
        "id": str(supabase_user.id),
        "email": supabase_user.email,
        "name": supabase_user.email.split("@")[0].replace(".", " ").title(),
        "role": "SECTION_OFFICER",
        "department": "General Administration",
        "designation": "Section Officer",
        "badge_number": f"GOI-{str(supabase_user.id)[:8].upper()}",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    supabase.table("users").upsert(profile).execute()
    return profile
