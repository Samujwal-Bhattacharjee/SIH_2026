"""
Pydantic schemas for request/response validation.
These are the data contracts between the frontend and backend.
Designed to match the TypeScript interfaces in src/types/index.ts
"""
from datetime import datetime, date
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from enum import Enum


# ============================================================
# ENUMS
# ============================================================

class UserRole(str, Enum):
    ADMINISTRATOR = "ADMINISTRATOR"
    DEPARTMENT_HEAD = "DEPARTMENT_HEAD"
    OPERATIONS_OFFICER = "OPERATIONS_OFFICER"
    SECTION_OFFICER = "SECTION_OFFICER"


class RiskLevel(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class PriorityLevel(str, Enum):
    IMMEDIATE = "IMMEDIATE"
    URGENT = "URGENT"
    ROUTINE = "ROUTINE"


class CaseStatus(str, Enum):
    RECEIVED = "RECEIVED"
    REGISTERED = "REGISTERED"
    UNDER_SCRUTINY = "UNDER_SCRUTINY"
    FORWARDED = "FORWARDED"
    UNDER_PROCESSING = "UNDER_PROCESSING"
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    DISPOSED = "DISPOSED"
    OVERDUE = "OVERDUE"
    IN_PROGRESS = "IN_PROGRESS"
    SLA_BREACHED = "SLA_BREACHED"
    AT_RISK = "AT_RISK"
    RESOLVED = "RESOLVED"
    FLAGGED = "FLAGGED"


class CaseStage(str, Enum):
    APPLICATION_RECEIVED = "Application Received"
    DOCUMENT_VERIFICATION = "Document Verification"
    DEPARTMENT_ASSIGNMENT = "Department Assignment"
    OFFICER_REVIEW = "Officer Review"
    LEGAL_REVIEW = "Legal Review"
    APPROVAL = "Approval"
    CLOSURE = "Closure"


class WorkflowStage(str, Enum):
    """Extended stages matching the government litigation workflow."""
    ORDER_RECEIVED = "ORDER_RECEIVED"
    DEPARTMENT_REVIEW = "DEPARTMENT_REVIEW"
    LEGAL_REVIEW = "LEGAL_REVIEW"
    LEGAL_OPINION = "LEGAL_OPINION"
    DECISION = "DECISION"
    APPEAL = "APPEAL"
    COMPLIANCE = "COMPLIANCE"
    CLOSED = "CLOSED"


class OCRStatus(str, Enum):
    COMPLETED = "COMPLETED"
    PROCESSING = "PROCESSING"
    PENDING = "PENDING"
    FAILED = "FAILED"


class LegalOpinionStatus(str, Enum):
    REQUESTED = "REQUESTED"
    IN_REVIEW = "IN_REVIEW"
    RECEIVED = "RECEIVED"
    OVERDUE = "OVERDUE"
    CLOSED = "CLOSED"


class MovementStatus(str, Enum):
    COMPLETED = "COMPLETED"
    IN_PROGRESS = "IN_PROGRESS"
    REWORK_TRIGGERED = "REWORK_TRIGGERED"
    FORWARDED = "FORWARDED"


# ============================================================
# USER SCHEMAS
# ============================================================

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    name: str
    role: str
    department: str
    designation: Optional[str] = None
    badgeNumber: str
    sessionExpiry: str


# ============================================================
# AUTH SCHEMAS
# ============================================================

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    name: Optional[str] = None
    department: Optional[str] = "General Administration"
    designation: Optional[str] = "Section Officer"
    role: Optional[str] = "SECTION_OFFICER"


class LoginResponse(BaseModel):
    user: UserOut
    token: str


# ============================================================
# DEPARTMENT SCHEMAS
# ============================================================

class DepartmentInfo(BaseModel):
    id: str
    name: str
    nameHi: Optional[str] = None
    code: str
    headOfficer: str
    location: str
    activeFilesCount: int
    pendingFilesCount: int
    avgDisposalDays: float
    slaCompliancePct: float


class OfficerInfo(BaseModel):
    id: str
    name: str
    designation: str
    department: str
    section: str
    email: str
    phone: str
    activeFilesCount: int
    pendingFilesCount: int
    deskNumber: str


# ============================================================
# DOCUMENT SCHEMAS
# ============================================================

class DocumentMetadata(BaseModel):
    fileSize: str
    fileType: str
    mimeType: str
    pageCount: int = 0
    author: Optional[str] = None
    checksum: Optional[str] = None
    referenceNumber: Optional[str] = None
    documentDate: Optional[str] = None
    issuingAuthority: Optional[str] = None


class OCRField(BaseModel):
    key: str
    value: str
    confidence: float
    isExtracted: bool
    label: Optional[str] = None


class OCRResult(BaseModel):
    documentId: str
    extractedText: str
    confidenceScore: float
    extractedFields: List[OCRField]
    processingTimeMs: int
    ocrEngine: str
    status: str
    rawOcrUrl: Optional[str] = None


class DocumentRecordOut(BaseModel):
    id: str
    caseId: str
    caseTitle: Optional[str] = None
    title: str
    documentType: str
    fileName: str
    fileUrl: str
    uploadDate: str
    uploadedBy: str
    status: str
    ocrStatus: str
    metadata: DocumentMetadata
    ocrResult: Optional[OCRResult] = None


# ============================================================
# RISK SCHEMAS
# ============================================================

class RiskFactor(BaseModel):
    factor: str
    contributionScore: float
    impact: str
    description: str


class RiskPrediction(BaseModel):
    caseId: str
    riskScore: float
    riskLevel: str
    expectedDelayDays: int
    predictedBreachDate: str
    statutoryDeadlineDate: str
    primaryFactor: str
    recommendedAction: str
    shapAttribution: List[RiskFactor]
    confidenceScore: float
    historicalBaselineDays: Optional[int] = None
    excessPercentage: Optional[float] = None


# ============================================================
# CASE EVENT SCHEMAS
# ============================================================

class CaseEventOut(BaseModel):
    id: str
    caseId: str
    stage: str
    timestamp: str
    durationDays: int
    waitDays: int
    officer: str
    fromOfficer: Optional[str] = None
    toOfficer: Optional[str] = None
    fromDesk: Optional[str] = None
    toDesk: Optional[str] = None
    action: Optional[str] = None
    status: str
    notes: Optional[str] = None
    isDelayed: bool = False
    isRework: bool = False


# ============================================================
# CASE SCHEMAS
# ============================================================

class CaseCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=500)
    subject: Optional[str] = None
    caseType: str = Field(default="Administrative")
    department: str
    section: Optional[str] = None
    applicant: str
    origin: Optional[str] = None
    assignedOfficer: Optional[str] = None
    currentDesk: Optional[str] = None
    statutoryDeadlineDays: int = Field(default=90, ge=1, le=3650)
    description: Optional[str] = None
    fileNumber: Optional[str] = None
    # Litigation-specific fields
    court: Optional[str] = None
    orderDate: Optional[str] = None
    receivedDate: Optional[str] = None
    limitationDays: Optional[int] = None
    limitationDeadline: Optional[str] = None


class CaseUpdate(BaseModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    department: Optional[str] = None
    section: Optional[str] = None
    assignedOfficer: Optional[str] = None
    currentDesk: Optional[str] = None
    status: Optional[CaseStatus] = None
    priority: Optional[PriorityLevel] = None
    statutoryDeadlineDays: Optional[int] = None
    description: Optional[str] = None
    court: Optional[str] = None
    limitationDays: Optional[int] = None
    limitationDeadline: Optional[str] = None


class CaseForwardRequest(BaseModel):
    targetOfficer: str
    targetDesk: str
    remarks: str
    newStage: Optional[str] = None


class CaseStatusUpdate(BaseModel):
    status: CaseStatus
    notes: Optional[str] = None


class CaseOut(BaseModel):
    id: str
    fileNumber: Optional[str] = None
    title: str
    subject: Optional[str] = None
    caseType: str
    department: str
    section: Optional[str] = None
    currentStage: str
    ageDays: int
    statutoryDeadlineDays: int
    daysRemaining: int
    riskScore: float
    riskLevel: str
    status: str
    priority: Optional[str] = None
    applicant: str
    origin: Optional[str] = None
    assignedOfficer: str
    currentDesk: Optional[str] = None
    flaggedForReview: bool
    createdAt: str
    updatedAt: str
    lastMovementDate: Optional[str] = None
    documentIds: List[str] = []
    events: Optional[List[CaseEventOut]] = None
    documents: Optional[List[DocumentRecordOut]] = None
    riskPrediction: Optional[RiskPrediction] = None
    # Litigation-specific
    court: Optional[str] = None
    orderDate: Optional[str] = None
    receivedDate: Optional[str] = None
    limitationDays: Optional[int] = None
    limitationDeadline: Optional[str] = None


class CaseListResponse(BaseModel):
    cases: List[CaseOut]
    total: int


# ============================================================
# MOVEMENT SCHEMAS
# ============================================================

class MovementCreate(BaseModel):
    to_stage: str
    assigned_to: Optional[str] = None
    remarks: Optional[str] = None


class MovementOut(BaseModel):
    id: str
    case_id: str
    from_stage: Optional[str] = None
    to_stage: str
    assigned_to: Optional[str] = None
    remarks: Optional[str] = None
    started_at: str
    completed_at: Optional[str] = None
    status: str


# ============================================================
# LEGAL OPINION SCHEMAS
# ============================================================

class LegalOpinionCreate(BaseModel):
    assigned_to: Optional[str] = None
    due_date: Optional[str] = None
    remarks: Optional[str] = None


class LegalOpinionUpdate(BaseModel):
    status: Optional[LegalOpinionStatus] = None
    recommendation: Optional[str] = None
    remarks: Optional[str] = None
    received_at: Optional[str] = None


class LegalOpinionOut(BaseModel):
    id: str
    case_id: str
    requested_by: str
    assigned_to: Optional[str] = None
    requested_at: str
    due_date: Optional[str] = None
    received_at: Optional[str] = None
    status: str
    recommendation: Optional[str] = None
    remarks: Optional[str] = None


# ============================================================
# ALERT SCHEMAS
# ============================================================

class AlertOut(BaseModel):
    id: str
    case_id: Optional[str] = None
    type: str
    severity: str
    message: str
    due_date: Optional[str] = None
    is_read: bool
    created_at: str


# ============================================================
# DASHBOARD SCHEMAS
# ============================================================

class BottleneckAnalysis(BaseModel):
    stage: str
    department: Optional[str] = None
    severity: str
    avgWaitDays: float
    baselineDays: float
    queueSize: int
    deviationPct: float
    rootCauseDescription: str
    impactedCasesCount: int


class DashboardMetrics(BaseModel):
    totalActiveCases: int
    todayReceivedCount: int
    inProcessCount: int
    pendingQueue: int
    slaAtRiskCount: int
    slaBreachedCount: int
    disposedCount: int
    avgProcessingDays: float
    primaryBottleneck: BottleneckAnalysis
    recentHighRiskCases: List[CaseOut]
    activeDepartmentsCount: int
    systemDatasetSize: int
    lastUpdated: str
    cases_by_status: Dict[str, int] = {}
    cases_by_department: Dict[str, int] = {}
    cases_by_priority: Dict[str, int] = {}
    cases_by_stage: Dict[str, int] = {}


# ============================================================
# AUDIT LOG SCHEMAS
# ============================================================

class AuditLogOut(BaseModel):
    id: str
    timestamp: str
    officerId: str
    officerName: str
    action: str
    fileId: str
    fileNumber: Optional[str] = None
    previousState: Optional[str] = None
    newState: Optional[str] = None
    ipAddress: str
    terminalId: str
    remarks: Optional[str] = None


# ============================================================
# SEARCH SCHEMA
# ============================================================

class SearchResponse(BaseModel):
    cases: List[CaseOut]
    documents: List[DocumentRecordOut]


# ============================================================
# SIMULATION SCHEMAS (kept as mock-backed initially)
# ============================================================

class SimulationScenarioOption(BaseModel):
    id: str
    title: str
    description: str
    defaultThreshold: int
    unit: str
    parameterName: str
    minVal: int
    maxVal: int


class SimulationRunRequest(BaseModel):
    intervention: str
    threshold: float
