"""Extensible government verification adapters for the procurement MVP.

Only sandbox data is returned until an authorised provider is configured.
"""
from dataclasses import dataclass
from typing import Protocol


@dataclass
class VerificationResult:
    source: str
    status: str
    reference: str
    is_demo: bool = True


class VerificationProvider(Protocol):
    def verify(self, identifier: str) -> VerificationResult: ...


class DemoVerificationProvider:
    def __init__(self, source: str):
        self.source = source

    def verify(self, identifier: str) -> VerificationResult:
        return VerificationResult(
            source=f"Demo Verification / Sandbox: {self.source}",
            status="Verified" if len(identifier.strip()) >= 6 else "Needs Review",
            reference=f"DEMO-{self.source.upper().replace(' ', '-')}-2026",
        )


PROVIDERS = {name: DemoVerificationProvider(name) for name in (
    "GST", "Udyam", "PAN", "MCA", "Startup India", "NSIC", "EPFO",
    "ESIC", "DigiLocker", "Make in India", "Blacklisting",
)}
