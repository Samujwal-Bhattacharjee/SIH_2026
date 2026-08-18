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
    yield
    logger.info("Shutting down GOIP backend")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "REST API backend for the Government File Tracking & Administrative Intelligence System. "
        "Provides case management, document OCR, deadline tracking, risk scoring, and alert generation. "
        "\n\n**Note**: This is a Smart India Hackathon prototype. Demo data is seeded via seed.py."
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
from app.api.routes.cases import router as cases_router
from app.api.routes.documents import router as documents_router
from app.api.routes.ocr import router as ocr_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.alerts import router as alerts_router
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
app.include_router(cases_router,         prefix=f"{API_PREFIX}/cases",         tags=["Cases"])
app.include_router(documents_router,     prefix=f"{API_PREFIX}/documents",     tags=["Documents"])
app.include_router(ocr_router,           prefix=f"{API_PREFIX}/ocr",           tags=["OCR"])
app.include_router(alerts_router,        prefix=f"{API_PREFIX}/alerts",        tags=["Alerts"])
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
