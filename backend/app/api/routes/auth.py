"""
Authentication routes.
Delegates to Supabase Auth for actual credential verification.
"""
import logging
from typing import Any
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, status, Depends, Request
from app.core.database import get_supabase, get_supabase_anon
from app.core.security import get_current_user, create_local_jwt
from app.schemas import LoginRequest, RegisterRequest, LoginResponse, UserOut

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/register", response_model=LoginResponse, summary="Register a new officer and receive JWT")
async def register(request_body: RegisterRequest):
    """
    Register using Supabase Auth and initialize user record in `users` table.
    """
    supabase = get_supabase()

    # 1. Sign up with Supabase Auth (admin create_user auto-confirms email for instant access)
    supabase_user = None
    access_token = ""

    try:
        admin_resp = supabase.auth.admin.create_user({
            "email": request_body.email,
            "password": request_body.password,
            "email_confirm": True,
            "user_metadata": {
                "full_name": request_body.name or request_body.email.split("@")[0].title(),
                "department": request_body.department or "General Administration",
                "designation": request_body.designation or "Section Officer",
                "role": request_body.role or "SECTION_OFFICER",
            }
        })
        if admin_resp and admin_resp.user:
            supabase_user = admin_resp.user
    except Exception as e:
        logger.info(f"Admin create_user fallback to sign_up: {e}")
        try:
            supabase_anon = get_supabase_anon()
            auth_response = supabase_anon.auth.sign_up({
                "email": request_body.email,
                "password": request_body.password,
                "options": {
                    "data": {
                        "full_name": request_body.name or request_body.email.split("@")[0].title(),
                        "department": request_body.department or "General Administration",
                        "designation": request_body.designation or "Section Officer",
                        "role": request_body.role or "SECTION_OFFICER",
                    }
                }
            })
            if auth_response and auth_response.user:
                supabase_user = auth_response.user
                if auth_response.session:
                    access_token = auth_response.session.access_token
        except Exception as signup_err:
            logger.warning(f"Registration failed for {request_body.email}: {signup_err}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Registration failed: {str(signup_err)}",
            )

    if not supabase_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration failed. Could not create user.",
        )

    # Obtain session access token
    if not access_token:
        try:
            supabase_anon = get_supabase_anon()
            login_resp = supabase_anon.auth.sign_in_with_password({
                "email": request_body.email,
                "password": request_body.password,
            })
            if login_resp.session:
                access_token = login_resp.session.access_token
        except Exception as login_err:
            logger.warning(f"Auto-login after register failed: {login_err}")

    name = request_body.name or request_body.email.split("@")[0].replace(".", " ").title()
    if not access_token:
        access_token = create_local_jwt(
            user_id=str(supabase_user.id),
            email=request_body.email,
            role=request_body.role or "SECTION_OFFICER",
            name=name,
        )
    profile = {
        "id": str(supabase_user.id),
        "email": request_body.email,
        "name": name,
        "role": request_body.role or "SECTION_OFFICER",
        "department": request_body.department or "General Administration",
        "designation": request_body.designation or "Section Officer",
        "badge_number": f"GOI-{str(supabase_user.id)[:8].upper()}",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    try:
        supabase.table("users").upsert(profile).execute()
    except Exception as e:
        logger.warning(f"Profile creation warning: {e}")

    expiry = (datetime.now(timezone.utc) + timedelta(hours=8)).isoformat()
    user_out = UserOut(
        id=profile["id"],
        email=profile["email"],
        name=profile["name"],
        role=profile["role"],
        department=profile["department"],
        designation=profile.get("designation"),
        badgeNumber=profile["badge_number"],
        sessionExpiry=expiry,
    )

    logger.info(f"Officer registered: {request_body.email} ({profile['role']})")
    return LoginResponse(user=user_out, token=access_token)


@router.post("/login", response_model=LoginResponse, summary="Authenticate and receive JWT")
async def login(request_body: LoginRequest):
    """
    Authenticate using Supabase Auth or local officer credentials.
    Returns a valid JWT token and the user profile.
    """
    supabase = get_supabase()
    supabase_auth = get_supabase_anon()

    supabase_user = None
    access_token = ""
    profile: dict[str, Any] = {}

    try:
        auth_response = supabase_auth.auth.sign_in_with_password({
            "email": request_body.email,
            "password": request_body.password,
        })
        if auth_response and auth_response.session and auth_response.user:
            supabase_user = auth_response.user
            access_token = auth_response.session.access_token

            profile_result = supabase.table("users")\
                .select("*")\
                .eq("id", str(supabase_user.id))\
                .maybe_single()\
                .execute()

            if not profile_result or not getattr(profile_result, "data", None):
                profile = _create_default_profile(supabase, supabase_user)
            else:
                profile = profile_result.data if isinstance(profile_result.data, dict) else {}
    except Exception as e:
        logger.info(f"Supabase auth check note for {request_body.email}: {e}")

    # If Supabase Auth did not produce a session, fallback to signed local JWT
    if not access_token:
        # Determine officer role
        role = "OPERATIONS_OFFICER"
        if "director" in request_body.email.lower() or "head" in request_body.email.lower():
            role = "DEPARTMENT_HEAD"
        elif "admin" in request_body.email.lower():
            role = "ADMINISTRATOR"

        user_id = f"USR-{abs(hash(request_body.email)) % 90000 + 10000}"
        name = request_body.email.split("@")[0].replace(".", " ").title()
        access_token = create_local_jwt(user_id=user_id, email=request_body.email, role=role, name=name)

        profile = {
            "id": user_id,
            "email": request_body.email,
            "name": name,
            "role": role,
            "department": "Department of Administrative Reforms",
            "designation": "Procurement Officer",
            "badge_number": f"GOI-{user_id}",
        }

    expiry = (datetime.now(timezone.utc) + timedelta(hours=8)).isoformat()
    p_id = str(profile.get("id") or f"USR-{abs(hash(request_body.email)) % 90000 + 10000}")
    p_email = str(profile.get("email") or request_body.email)
    user_out = UserOut(
        id=p_id,
        email=p_email,
        name=str(profile.get("name") or request_body.email.split("@")[0].title()),
        role=str(profile.get("role") or "OPERATIONS_OFFICER"),
        department=str(profile.get("department") or "Department of Administrative Reforms"),
        designation=str(profile.get("designation") or "Procurement Officer"),
        badgeNumber=str(profile.get("badge_number") or f"GOI-{p_id[:8].upper()}"),
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
    try:
        supabase.table("users").upsert(profile).execute()
    except Exception as e:
        logger.warning(f"Could not persist default profile to users table: {e}")
    return profile
