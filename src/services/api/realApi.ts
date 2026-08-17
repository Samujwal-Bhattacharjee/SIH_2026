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
  SimulationScenarioOption,
} from '../../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('gov_session_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'API request failed';
    try {
      const err = await response.json();
      errorDetail = err.detail || err.message || errorDetail;
    } catch {
      errorDetail = response.statusText;
    }
    throw new Error(`[${response.status}] ${errorDetail}`);
  }

  return response.json();
}

export const realApi = {
  auth: {
    async signIn(email: string, password?: string): Promise<{ user: User; token: string }> {
      const data = await request<{ user: User; token: string }>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('gov_session_token', data.token);
      return data;
    },

    async signOut(): Promise<void> {
      try {
        await request('/api/v1/auth/logout', { method: 'POST' });
      } finally {
        localStorage.removeItem('gov_session_token');
      }
    },

    async getCurrentUser(): Promise<User | null> {
      try {
        return await request<User>('/api/v1/auth/me');
      } catch {
        return null;
      }
    },

    async getSession(): Promise<{ user: User | null; token: string | null }> {
      const token = localStorage.getItem('gov_session_token');
      if (!token) return { user: null, token: null };
      const user = await this.getCurrentUser();
      return { user, token };
    },
  },

  dashboard: {
    async getMetrics(): Promise<DashboardMetrics> {
      return request<DashboardMetrics>('/api/v1/dashboard/metrics');
    },
  },

  cases: {
    async getCases(params?: {
      department?: string;
      stage?: string;
      riskLevel?: string;
      status?: string;
      priority?: string;
      search?: string;
      caseType?: string;
    }): Promise<{ cases: Case[]; total: number }> {
      const queryParams = new URLSearchParams();
      if (params?.department && params.department !== 'ALL') queryParams.append('department', params.department);
      if (params?.stage && params.stage !== 'ALL') queryParams.append('stage', params.stage);
      if (params?.riskLevel && params.riskLevel !== 'ALL') queryParams.append('risk_level', params.riskLevel);
      if (params?.priority && params.priority !== 'ALL') queryParams.append('priority', params.priority);
      if (params?.status && params.status !== 'ALL') queryParams.append('status', params.status);
      if (params?.search) queryParams.append('q', params.search);

      return request<{ cases: Case[]; total: number }>(`/api/v1/cases?${queryParams.toString()}`);
    },

    async getCaseById(caseId: string): Promise<Case & { events: CaseEvent[]; documents: DocumentRecord[] }> {
      return request<Case & { events: CaseEvent[]; documents: DocumentRecord[] }>(`/api/v1/cases/${caseId}`);
    },

    async createCase(newCase: Partial<Case>): Promise<Case> {
      return request<Case>('/api/v1/cases', {
        method: 'POST',
        body: JSON.stringify(newCase),
      });
    },

    async forwardCase(
      caseId: string,
      targetOfficer: string,
      targetDesk: string,
      remarks: string,
      newStage?: Case['currentStage']
    ): Promise<Case> {
      return request<Case>(`/api/v1/cases/${caseId}/forward`, {
        method: 'POST',
        body: JSON.stringify({ targetOfficer, targetDesk, remarks, newStage }),
      });
    },

    async updateStatus(caseId: string, status: Case['status'], notes?: string): Promise<Case> {
      return request<Case>(`/api/v1/cases/${caseId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes }),
      });
    },

    async toggleFlagForReview(caseId: string): Promise<{ caseId: string; flaggedForReview: boolean }> {
      return request<{ caseId: string; flaggedForReview: boolean }>(`/api/v1/cases/${caseId}/flag`, {
        method: 'POST',
      });
    },

    async search(query: string): Promise<{ cases: Case[]; documents: DocumentRecord[] }> {
      return request<{ cases: Case[]; documents: DocumentRecord[] }>(`/api/v1/search?q=${encodeURIComponent(query)}`);
    },
  },

  workflow: {
    async getProcessMap(filters?: { department?: string; dateRange?: string }): Promise<ProcessMapData> {
      const queryParams = new URLSearchParams();
      if (filters?.department) queryParams.append('department', filters.department);
      if (filters?.dateRange) queryParams.append('date_range', filters.dateRange);
      return request<ProcessMapData>(`/api/v1/workflow/process-map?${queryParams.toString()}`);
    },

    async getNodeDetail(stageId: string) {
      return request(`/api/v1/workflow/stages/${stageId}`);
    },
  },

  risk: {
    async getRiskCases(): Promise<Case[]> {
      return request<Case[]>('/api/v1/risk/cases');
    },

    async getRiskPrediction(caseId: string): Promise<RiskPrediction | null> {
      return request<RiskPrediction | null>(`/api/v1/risk/predictions/${caseId}`);
    },
  },

  documents: {
    async getDocuments(params?: { caseId?: string; search?: string; ocrStatus?: string }): Promise<DocumentRecord[]> {
      const queryParams = new URLSearchParams();
      if (params?.caseId) queryParams.append('case_id', params.caseId);
      if (params?.ocrStatus) queryParams.append('ocr_status', params.ocrStatus);
      if (params?.search) queryParams.append('q', params.search);
      return request<DocumentRecord[]>(`/api/v1/documents?${queryParams.toString()}`);
    },

    async getDocumentById(docId: string): Promise<DocumentRecord> {
      return request<DocumentRecord>(`/api/v1/documents/${docId}`);
    },

    async uploadDocument(file: File, caseId: string, documentType: string): Promise<DocumentRecord> {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('case_id', caseId);
      formData.append('document_type', documentType);

      const token = localStorage.getItem('gov_session_token');
      const response = await fetch(`${API_BASE_URL}/api/v1/documents/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!response.ok) throw new Error('Document upload failed');
      return response.json();
    },

    async downloadDocument(docId: string): Promise<{ blob: Blob; fileName: string }> {
      const token = localStorage.getItem('gov_session_token');
      const response = await fetch(`${API_BASE_URL}/api/v1/documents/${docId}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error('Document download failed');
      const blob = await response.blob();
      const contentDisposition = response.headers.get('content-disposition');
      let fileName = 'document.pdf';
      if (contentDisposition && contentDisposition.includes('filename=')) {
        fileName = contentDisposition.split('filename=')[1].replace(/"/g, '');
      }
      return { blob, fileName };
    },
  },

  ocr: {
    async processDocument(file: File): Promise<OCRResult> {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('gov_session_token');
      const response = await fetch(`${API_BASE_URL}/api/v1/ocr/process`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!response.ok) throw new Error('OCR process failed');
      return response.json();
    },
  },

  departments: {
    async getDepartments(): Promise<DepartmentInfo[]> {
      return request<DepartmentInfo[]>('/api/v1/departments');
    },
    async getOfficers(): Promise<OfficerInfo[]> {
      return request<OfficerInfo[]>('/api/v1/officers');
    },
  },

  audit: {
    async getAuditLogs(params?: { fileId?: string; officerId?: string; search?: string }): Promise<AuditLog[]> {
      const queryParams = new URLSearchParams();
      if (params?.fileId) queryParams.append('file_id', params.fileId);
      if (params?.officerId) queryParams.append('officer_id', params.officerId);
      if (params?.search) queryParams.append('q', params.search);
      return request<AuditLog[]>(`/api/v1/audit-logs?${queryParams.toString()}`);
    },
  },

  simulation: {
    async getScenarios(): Promise<SimulationScenarioOption[]> {
      return request<SimulationScenarioOption[]>('/api/v1/simulation/scenarios');
    },

    async runSimulation(intervention: SimulationIntervention, threshold: number): Promise<SimulationResult> {
      return request<SimulationResult>('/api/v1/simulation/run', {
        method: 'POST',
        body: JSON.stringify({ intervention, threshold }),
      });
    },
  },

  analytics: {
    async getPerformanceMetrics(): Promise<ProcessPerformanceMetrics> {
      return request<ProcessPerformanceMetrics>('/api/v1/analytics/performance');
    },
  },
};
