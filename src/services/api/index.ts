import { apiClient } from './apiClient';
import {
  Case,
  CaseEvent,
  ProcessMapData,
  DocumentRecord,
  SimulationResult,
  SimulationIntervention,
  DashboardMetrics,
  ProcessPerformanceMetrics,
  User,
  RiskPrediction,
  DepartmentInfo,
  OfficerInfo,
  AuditLog,
  OCRResult,
} from '../../types';

export const authService = {
  signIn: (email: string, password?: string): Promise<{ user: User; token: string }> =>
    apiClient.auth.signIn(email, password),
  signUp: (
    email: string,
    password: string,
    name?: string,
    department?: string,
    designation?: string,
    role?: string
  ): Promise<{ user: User; token: string }> =>
    apiClient.auth.signUp(email, password, name, department, designation, role),
  signInWithGoogle: (): Promise<{ user: User; token: string } | void> =>
    apiClient.auth.signInWithGoogle(),
  signOut: (): Promise<void> => apiClient.auth.signOut(),
  getCurrentUser: (): Promise<User | null> => apiClient.auth.getCurrentUser(),
  getSession: (): Promise<{ user: User | null; token: string | null }> =>
    apiClient.auth.getSession(),
};

export const dashboardService = {
  getMetrics: (): Promise<DashboardMetrics> => apiClient.dashboard.getMetrics(),
};

export const casesService = {
  getCases: (params?: {
    department?: string;
    stage?: string;
    riskLevel?: string;
    status?: string;
    priority?: string;
    search?: string;
    caseType?: string;
  }): Promise<{ cases: Case[]; total: number }> => apiClient.cases.getCases(params),

  getCaseById: (caseId: string): Promise<Case & { events: CaseEvent[]; documents: DocumentRecord[] }> =>
    apiClient.cases.getCaseById(caseId),

  createCase: (newCase: Partial<Case> & { initialDocument?: DocumentRecord }): Promise<Case> =>
    apiClient.cases.createCase(newCase),

  forwardCase: (
    caseId: string,
    targetOfficer: string,
    targetDesk: string,
    remarks: string,
    newStage?: Case['currentStage']
  ): Promise<Case> => apiClient.cases.forwardCase(caseId, targetOfficer, targetDesk, remarks, newStage),

  updateStatus: (caseId: string, status: Case['status'], notes?: string): Promise<Case> =>
    apiClient.cases.updateStatus(caseId, status, notes),

  toggleFlagForReview: (caseId: string): Promise<{ caseId: string; flaggedForReview: boolean }> =>
    apiClient.cases.toggleFlagForReview(caseId),

  search: (query: string): Promise<{ cases: Case[]; documents: DocumentRecord[] }> =>
    apiClient.cases.search(query),
};

// Aliases for government naming
export const fileService = casesService;

export const workflowService = {
  getProcessMap: (filters?: { department?: string; dateRange?: string }): Promise<ProcessMapData> =>
    apiClient.workflow.getProcessMap(filters),

  getNodeDetail: (stageId: string) => apiClient.workflow.getNodeDetail(stageId),
};

export const riskService = {
  getRiskCases: (): Promise<Case[]> => apiClient.risk.getRiskCases(),
  getRiskPrediction: (caseId: string): Promise<RiskPrediction | null> =>
    apiClient.risk.getRiskPrediction(caseId),
};

export const documentsService = {
  getDocuments: (params?: { caseId?: string; search?: string; ocrStatus?: string }): Promise<DocumentRecord[]> =>
    apiClient.documents.getDocuments(params),

  getDocumentById: (docId: string): Promise<DocumentRecord> =>
    apiClient.documents.getDocumentById(docId),

  uploadDocument: (file: File, caseId: string, documentType: string): Promise<DocumentRecord> =>
    apiClient.documents.uploadDocument(file, caseId, documentType),

  downloadDocument: (docId: string): Promise<{ blob: Blob; fileName: string }> =>
    apiClient.documents.downloadDocument(docId),
};

export const documentService = documentsService;

export const ocrService = {
  processDocument: (file: File): Promise<OCRResult> => apiClient.ocr.processDocument(file),
};

export const departmentService = {
  getDepartments: (): Promise<DepartmentInfo[]> => apiClient.departments.getDepartments(),
  getOfficers: (): Promise<OfficerInfo[]> => apiClient.departments.getOfficers(),
};

export const auditService = {
  getAuditLogs: (params?: { fileId?: string; officerId?: string; search?: string }): Promise<AuditLog[]> =>
    apiClient.audit.getAuditLogs(params),
};

export const simulationService = {
  getScenarios: () => apiClient.simulation.getScenarios(),
  runSimulation: (
    intervention: SimulationIntervention,
    threshold: number
  ): Promise<SimulationResult> => apiClient.simulation.runSimulation(intervention, threshold),
};

export const analyticsService = {
  getPerformanceMetrics: (): Promise<ProcessPerformanceMetrics> =>
    apiClient.analytics.getPerformanceMetrics(),
};
