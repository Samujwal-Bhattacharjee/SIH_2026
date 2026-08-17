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
} from '../../types';

export const authService = {
  signIn: (email: string, password?: string): Promise<{ user: User; token: string }> =>
    apiClient.auth.signIn(email, password),
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
    search?: string;
    caseType?: string;
  }): Promise<{ cases: Case[]; total: number }> => apiClient.cases.getCases(params),

  getCaseById: (caseId: string): Promise<Case & { events: CaseEvent[]; documents: DocumentRecord[] }> =>
    apiClient.cases.getCaseById(caseId),

  toggleFlagForReview: (caseId: string): Promise<{ caseId: string; flaggedForReview: boolean }> =>
    apiClient.cases.toggleFlagForReview(caseId),

  search: (query: string): Promise<{ cases: Case[]; documents: DocumentRecord[] }> =>
    apiClient.cases.search(query),
};

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
  getDocuments: (params?: { caseId?: string; search?: string }): Promise<DocumentRecord[]> =>
    apiClient.documents.getDocuments(params),

  getDocumentById: (docId: string): Promise<DocumentRecord> =>
    apiClient.documents.getDocumentById(docId),

  uploadDocument: (file: File, caseId: string, documentType: string): Promise<DocumentRecord> =>
    apiClient.documents.uploadDocument(file, caseId, documentType),

  downloadDocument: (docId: string): Promise<{ blob: Blob; fileName: string }> =>
    apiClient.documents.downloadDocument(docId),
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
