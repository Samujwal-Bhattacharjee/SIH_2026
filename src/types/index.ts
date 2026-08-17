export type Department =
  | 'Land Revenue'
  | 'Urban Planning'
  | 'Social Welfare'
  | 'Public Works'
  | 'Environment & Forests'
  | 'Commerce & Industry'
  | 'Health & Family Welfare'
  | 'Transport & Highways'
  | 'Finance & Expenditure'
  | 'Administrative Reforms';

export type CaseStage =
  | 'Application Received'
  | 'Document Verification'
  | 'Department Assignment'
  | 'Officer Review'
  | 'Legal Review'
  | 'Approval'
  | 'Closure';

export type PriorityLevel = 'IMMEDIATE' | 'URGENT' | 'ROUTINE';

export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export type GovFileStatus =
  | 'RECEIVED'
  | 'REGISTERED'
  | 'UNDER_SCRUTINY'
  | 'FORWARDED'
  | 'UNDER_PROCESSING'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'DISPOSED'
  | 'OVERDUE';

// Support legacy CaseStatus as well for backward compatibility
export type CaseStatus =
  | GovFileStatus
  | 'IN_PROGRESS'
  | 'SLA_BREACHED'
  | 'AT_RISK'
  | 'RESOLVED'
  | 'FLAGGED';

export interface CaseEvent {
  id: string;
  caseId: string;
  stage: CaseStage;
  timestamp: string;
  durationDays: number;
  waitDays: number;
  officer: string;
  fromOfficer?: string;
  toOfficer?: string;
  fromDesk?: string;
  toDesk?: string;
  action?: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'REWORK_TRIGGERED' | 'FORWARDED';
  notes?: string;
  isDelayed?: boolean;
  isRework?: boolean;
}

export interface RiskFactor {
  factor: string;
  contributionScore: number; // 0-100 relative attribution
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
}

export interface RiskPrediction {
  caseId: string;
  riskScore: number; // 0-100%
  riskLevel: RiskLevel;
  expectedDelayDays: number;
  predictedBreachDate: string;
  statutoryDeadlineDate: string;
  primaryFactor: string;
  recommendedAction: string;
  shapAttribution: RiskFactor[];
  confidenceScore: number;
  historicalBaselineDays?: number;
  excessPercentage?: number;
}

export interface Case {
  id: string;
  fileNumber?: string; // e.g. KA/REV/2026/001284
  title: string;
  subject?: string;
  caseType: string;
  department: Department;
  section?: string;
  currentStage: CaseStage;
  ageDays: number;
  statutoryDeadlineDays: number;
  daysRemaining: number;
  riskScore: number;
  riskLevel: RiskLevel;
  status: CaseStatus;
  priority?: PriorityLevel;
  applicant: string;
  origin?: string;
  assignedOfficer: string;
  currentDesk?: string;
  flaggedForReview: boolean;
  createdAt: string;
  updatedAt: string;
  lastMovementDate?: string;
  documentIds: string[];
  events?: CaseEvent[];
  riskPrediction?: RiskPrediction;
}

// Alias for clean naming
export type FileRecord = Case;

export interface WorkflowNodeData {
  [key: string]: unknown;
  id: string;
  stage: CaseStage;
  caseCount: number;
  avgDurationDays: number;
  avgWaitDays: number;
  queueSize: number;
  isBottleneck: boolean;
  bottleneckSeverity?: 'CRITICAL' | 'MODERATE' | 'LOW';
  deviationFromBaselinePct?: number;
  reworkFrequencyPct?: number;
  historicalBaselineDays: number;
  officerCapacityPct: number;
}

export interface WorkflowEdgeData {
  id: string;
  source: string;
  target: string;
  caseCount: number;
  avgTransitionDays: number;
  isReworkLoop?: boolean;
  loopPercentage?: number;
  additionalDelayDays?: number;
}

export interface BottleneckAnalysis {
  id?: string;
  stage: string;
  department?: string;
  desk?: string;
  severity: 'CRITICAL' | 'MODERATE' | 'LOW';
  avgWaitDays: number;
  baselineDays: number;
  queueSize: number;
  deviationPct: number;
  rootCauseDescription: string;
  impactedCasesCount: number;
}

export interface ReworkLoopAnalysis {
  sourceStage: string;
  targetStage: string;
  affectedCasesPct: number;
  avgAdditionalDays: number;
  triggerReason: string;
  frequencyCount: number;
}

export interface ProcessMapData {
  nodes: WorkflowNodeData[];
  edges: WorkflowEdgeData[];
  bottlenecks: BottleneckAnalysis[];
  reworkLoops: ReworkLoopAnalysis[];
  metrics: {
    totalActiveCases: number;
    medianCycleDays: number;
    reworkRatePct: number;
    slaComplianceRatePct: number;
  };
}

export interface DocumentMetadata {
  fileSize: string;
  fileType: string;
  mimeType: string;
  pageCount: number;
  author?: string;
  checksum?: string;
  referenceNumber?: string;
  documentDate?: string;
  issuingAuthority?: string;
}

export interface OCRField {
  key: string;
  value: string;
  confidence: number;
  isExtracted: boolean;
  label?: string;
}

export interface OCRResult {
  documentId: string;
  extractedText: string;
  confidenceScore: number;
  extractedFields: OCRField[];
  processingTimeMs: number;
  ocrEngine: string;
  status: 'READY' | 'PROCESSING' | 'FAILED';
  rawOcrUrl?: string;
}

export type DocumentType =
  | 'Application Form'
  | 'Legal Opinion'
  | 'Identity Proof'
  | 'Site Inspection Report'
  | 'Clearance Certificate'
  | 'Court Order'
  | 'Affidavit'
  | 'Gazette Notification'
  | 'Office Note Sheet';

export interface DocumentRecord {
  id: string;
  caseId: string;
  caseTitle?: string;
  title: string;
  documentType: DocumentType;
  fileName: string;
  fileUrl: string;
  uploadDate: string;
  uploadedBy: string;
  status: 'READY' | 'PROCESSING' | 'ERROR';
  ocrStatus: 'COMPLETED' | 'PROCESSING' | 'PENDING' | 'FAILED';
  metadata: DocumentMetadata;
  ocrResult?: OCRResult;
}

export interface DepartmentInfo {
  id: string;
  name: Department;
  nameHi: string;
  code: string;
  headOfficer: string;
  location: string;
  activeFilesCount: number;
  pendingFilesCount: number;
  avgDisposalDays: number;
  slaCompliancePct: number;
}

export interface OfficerInfo {
  id: string;
  name: string;
  designation: string;
  department: Department;
  section: string;
  email: string;
  phone: string;
  activeFilesCount: number;
  pendingFilesCount: number;
  deskNumber: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  officerId: string;
  officerName: string;
  action: 'FILE_REGISTERED' | 'FILE_FORWARDED' | 'DOCUMENT_UPLOADED' | 'OCR_PROCESSED' | 'FILE_APPROVED' | 'FILE_REJECTED' | 'FILE_DISPOSED' | 'FLAGGED_REVIEW' | 'NOTE_ADDED';
  fileId: string;
  fileNumber?: string;
  previousState?: string;
  newState?: string;
  ipAddress: string;
  terminalId: string;
  remarks?: string;
}

export type SimulationIntervention =
  | 'ESCALATE_LEGAL_REVIEW_THRESHOLD'
  | 'FAST_TRACK_DOCUMENT_RENEWAL'
  | 'PARALLEL_OFFICER_REVIEW'
  | 'ADD_DEPARTMENT_CAPACITY';

export interface SimulationScenarioOption {
  id: SimulationIntervention;
  title: string;
  description: string;
  defaultThreshold: number;
  unit: string;
  parameterName: string;
  minVal: number;
  maxVal: number;
}

export interface SimulationResult {
  scenarioId: string;
  intervention: SimulationIntervention;
  interventionName: string;
  thresholdApplied: number;
  baseline: {
    medianCycleDays: number;
    slaCompliancePct: number;
    highRiskCasesCount: number;
    reworkCasesPct: number;
    avgLegalWaitDays: number;
  };
  simulated: {
    medianCycleDays: number;
    slaCompliancePct: number;
    highRiskCasesCount: number;
    reworkCasesPct: number;
    avgLegalWaitDays: number;
  };
  difference: {
    cycleTimeReductionDays: number;
    slaImprovementPct: number;
    riskCasesMitigated: number;
    legalWaitReductionDays: number;
  };
  summaryExplanation: string;
  stagesComparison: {
    stage: string;
    baselineWait: number;
    simulatedWait: number;
    baselineDuration: number;
    simulatedDuration: number;
  }[];
  executionTimestamp: string;
}

export interface DashboardMetrics {
  totalActiveCases: number;
  todayReceivedCount?: number;
  inProcessCount?: number;
  pendingQueue: number;
  slaAtRiskCount: number;
  slaBreachedCount: number;
  disposedCount?: number;
  avgProcessingDays: number;
  primaryBottleneck: BottleneckAnalysis;
  recentHighRiskCases: Case[];
  activeDepartmentsCount: number;
  systemDatasetSize: number;
  lastUpdated: string;
}

export interface ProcessPerformanceMetrics {
  stageBreakdown: {
    stage: string;
    activeProcessingDays: number;
    waitingDays: number;
    totalDays: number;
    queueCount: number;
    slaBreachRatePct: number;
  }[];
  variants: {
    id: string;
    name: string;
    path: string[];
    caseCount: number;
    percentage: number;
    avgDurationDays: number;
    isOptimal: boolean;
  }[];
  slaAdherenceTrends: {
    month: string;
    onTimePct: number;
    atRiskPct: number;
    breachedPct: number;
  }[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMINISTRATOR' | 'OPERATIONS_OFFICER' | 'DEPARTMENT_HEAD' | 'SECTION_OFFICER';
  department: string;
  designation?: string;
  badgeNumber: string;
  sessionExpiry: string;
}
