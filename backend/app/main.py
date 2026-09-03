"""
GOIP — Government File Tracking & Administrative Intelligence System
FastAPI Backend — Main Application Entry Point

Startup:
    uvicorn app.main:app --reload

API Docs:
    http://localhost:8000/docs
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — startup and shutdown hooks."""
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"Debug mode: {settings.DEBUG}")
    logger.info(f"CORS origins: {settings.cors_origins_list}")

    # ================================================================
    # SESSION-EPHEMERAL RESET (DEMO_SESSION_MODE)
    # When enabled, the procurement SQLite database is deleted and
    # re-seeded from the pristine deterministic baseline on EVERY
    # startup.  This is the primary correctness guarantee — it works
    # even if the previous session ended with kill -9.
    # Only the local SQLite file is affected; Supabase Postgres is
    # never touched.
    # ================================================================
    if settings.DEMO_SESSION_MODE:
        logger.info("DEMO_SESSION_MODE is ENABLED — resetting procurement database to pristine baseline.")
        try:
            from app.core.procurement_store import reset_session_db
            reset_session_db(enabled=True)
            logger.info("DEMO_SESSION_MODE: Procurement database successfully reset to baseline.")
        except Exception as e:
            logger.error(f"DEMO_SESSION_MODE: Database reset failed — {e}", exc_info=True)
            raise RuntimeError(f"Cannot start in DEMO_SESSION_MODE: DB reset failed: {e}") from e

        # Best-effort: clear session-uploaded files from Supabase Storage.
        # Baseline seed documents are metadata-only in SQLite; no real bytes
        # live in the bucket from the baseline, so clearing is safe.
        try:
            from app.core.database import get_supabase
            from app.core.config import settings as _s
            sb = get_supabase()
            bucket = _s.SUPABASE_STORAGE_BUCKET
            objects = sb.storage.from_(bucket).list()
            if objects:
                paths = [o["name"] for o in objects if isinstance(o, dict) and o.get("name")]
                if paths:
                    sb.storage.from_(bucket).remove(paths)
                    logger.info(f"DEMO_SESSION_MODE: Cleared {len(paths)} session-uploaded file(s) from storage bucket '{bucket}'.")
                else:
                    logger.info(f"DEMO_SESSION_MODE: Storage bucket '{bucket}' is already empty.")
            else:
                logger.info(f"DEMO_SESSION_MODE: Storage bucket '{bucket}' is already empty.")
        except Exception as e:
            logger.warning(f"DEMO_SESSION_MODE: Could not clear storage bucket (non-fatal): {e}")
    else:
        logger.info("DEMO_SESSION_MODE is DISABLED — procurement database state persists across restarts (production mode).")

    # Ensure Supabase Storage bucket exists so document uploads never fail
    try:
        from app.core.database import get_supabase
        from app.core.config import settings as _s
        sb = get_supabase()
        bucket_name = _s.SUPABASE_STORAGE_BUCKET
        existing = sb.storage.list_buckets()
        if not any(b.name == bucket_name for b in existing):
            sb.storage.create_bucket(bucket_name, options={"public": False})
            logger.info(f"Storage bucket '{bucket_name}' created on startup.")
        else:
            logger.info(f"Storage bucket '{bucket_name}' already exists.")
    except Exception as e:
        logger.warning(f"Could not verify/create storage bucket on startup: {e}")

    # Ensure ML model is loaded
    try:
        from app.services.prediction.model_loader import load_model
        load_model()
        logger.info("ML Prediction model initialized.")
    except Exception as e:
        logger.warning(f"Could not load ML model on startup: {e}")

    yield
    logger.info("Shutting down GOIP backend")




app = FastAPI(
    title="GOIP — Bid Compliance Verification Platform",
    version=settings.APP_VERSION,
    description=(
        "AI-assisted procurement bid compliance verification platform (SIH26100). "
        "Provides document OCR, evidence-backed compliance checks and sandbox verification adapters."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ============================================================
# CORS — Allow frontend origin(s)
# ============================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# ROUTE REGISTRATION
# ============================================================
from app.api.routes.auth import router as auth_router
from app.api.routes.projects import router as projects_router
from app.api.routes.cases import router as cases_router
from app.api.routes.documents import router as documents_router
from app.api.routes.ocr import router as ocr_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.alerts import router as alerts_router
from app.api.routes.verification import router as verification_router
from app.api.routes.procurement import router as procurement_router
from app.api.routes.other import (
    departments_router,
    audit_router,
    search_router,
    risk_router,
    legal_router,
    movements_router,
    workflow_router,
    simulation_router,
    analytics_router,
    users_router,
)

API_PREFIX = "/api/v1"

app.include_router(auth_router,          prefix=f"{API_PREFIX}/auth",         tags=["Authentication"])
app.include_router(dashboard_router,     prefix=f"{API_PREFIX}/dashboard",     tags=["Dashboard"])
app.include_router(procurement_router,   prefix=f"{API_PREFIX}/procurement",   tags=["Procurement Compliance Verification"])
app.include_router(procurement_router,   prefix=f"{API_PREFIX}",               tags=["Procurement Tenders & Bidders"])
app.include_router(projects_router,      prefix=f"{API_PREFIX}/projects",      tags=["Land Acquisition Projects"])
app.include_router(cases_router,         prefix=f"{API_PREFIX}/cases",         tags=["Cases (Compatibility)"])
app.include_router(documents_router,     prefix=f"{API_PREFIX}/documents",     tags=["Documents"])
app.include_router(ocr_router,           prefix=f"{API_PREFIX}/ocr",           tags=["OCR"])
app.include_router(alerts_router,        prefix=f"{API_PREFIX}/alerts",        tags=["Alerts"])
app.include_router(verification_router,  prefix=f"{API_PREFIX}/verification",  tags=["Procurement Verification"])
app.include_router(departments_router,   prefix=f"{API_PREFIX}/departments",   tags=["Departments"])
app.include_router(users_router,         prefix=f"{API_PREFIX}/users",         tags=["Users"])
app.include_router(audit_router,         prefix=f"{API_PREFIX}/audit-logs",    tags=["Audit Logs"])
app.include_router(search_router,        prefix=f"{API_PREFIX}/search",        tags=["Search"])
app.include_router(risk_router,          prefix=f"{API_PREFIX}/risk",          tags=["Risk Engine"])
app.include_router(legal_router,         prefix=f"{API_PREFIX}",               tags=["Legal Opinions"])
app.include_router(movements_router,     prefix=f"{API_PREFIX}/cases",         tags=["Movements"])
app.include_router(workflow_router,      prefix=f"{API_PREFIX}/workflow",      tags=["Workflow"])
app.include_router(simulation_router,    prefix=f"{API_PREFIX}/simulation",    tags=["Simulation"])
app.include_router(analytics_router,     prefix=f"{API_PREFIX}/analytics",     tags=["Analytics"])


# ============================================================
# HEALTH CHECK
# ============================================================
@app.get("/health", tags=["Health"])
async def health_check():
    """Simple health check endpoint. Returns 200 if the API is running."""
    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "docs": "/docs",
        "health": "/health",
    }
