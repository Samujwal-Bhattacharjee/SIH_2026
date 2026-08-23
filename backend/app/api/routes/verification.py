from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.verification_provider import PROVIDERS

router = APIRouter()


class VerificationRequest(BaseModel):
    provider: str
    identifier: str


@router.post("/check")
def check_verification(payload: VerificationRequest):
    provider = PROVIDERS.get(payload.provider)
    if not provider:
        raise HTTPException(404, "Verification source is not configured")
    return provider.verify(payload.identifier).__dict__


@router.get("/sources")
def verification_sources():
    return [{"name": name, "mode": "Demo Verification / Sandbox", "live_access": False} for name in PROVIDERS]
