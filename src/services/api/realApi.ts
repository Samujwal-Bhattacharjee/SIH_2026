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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('goip_auth_token');
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
    } catch (e) {
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
      localStorage.setItem('goip_auth_token', data.token);
      return data;
    },

    async signOut(): Promise<void> {
      try {
        await request('/api/v1/auth/logout', { method: 'POST' });
      } finally {
        localStorage.removeItem('goip_auth_token');
      }
    },

    async getCurrentUser(): Promise<User | null> {
      try {
        return await request<User>('/api/v1/auth/me');
      } catch (e) {
        return null;
      }
    },

    async getSession(): Promise<{ user: User | null; token: string | null }> {
      const token = localStorage.getItem('goip_auth_token');
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
      search?: string;
      caseType?: string;
    }): Promise<{ cases: Case[]; total: number }> {
      const queryParams = new URLSearchParams();
      if (params?.department && params.department !== 'ALL') queryParams.append('department', params.department);
      if (params?.stage && params.stage !== 'ALL') queryParams.append('stage', params.stage);
      if (params?.riskLevel && params.riskLevel !== 'ALL') queryParams.append('risk_level', params.riskLevel);
      if (params?.status && params.status !== 'ALL') queryParams.append('status', params.status);
      if (params?.search) queryParams.append('q', params.search);

      return request<{ cases: Case[]; total: number }>(`/api/v1/cases?${queryParams.toString()}`);
    },

    async getCaseById(caseId: string): Promise<Case & { events: CaseEvent[]; documents: DocumentRecord[] }> {
      return request<Case & { events: CaseEvent[]; documents: DocumentRecord[] }>(`/api/v1/cases/${caseId}`);
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
      return request<Case[]>('/api/v1/risk/ranked-cases');
    },

    async getRiskPrediction(caseId: string): Promise<RiskPrediction | null> {
      return request<RiskPrediction>(`/api/v1/risk/predictions/${caseId}`);
    },
  },

  documents: {
    async getDocuments(params?: { caseId?: string; search?: string }): Promise<DocumentRecord[]> {
      const queryParams = new URLSearchParams();
      if (params?.caseId) queryParams.append('case_id', params.caseId);
      if (params?.search) queryParams.append('q', params.search);
      return request<DocumentRecord[]>(`/api/v1/documents?${queryParams.toString()}`);
    },

    async getDocumentById(docId: string): Promise<DocumentRecord> {
      return request<DocumentRecord>(`/api/v1/documents/${docId}`);
    },

    async uploadDocument(file: File, caseId: string, documentType: string): Promise<DocumentRecord> {
      const token = localStorage.getItem('goip_auth_token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('case_id', caseId);
      formData.append('document_type', documentType);

      const response = await fetch(`${API_BASE_URL}/api/v1/documents/upload`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      return response.json();
    },

    async downloadDocument(docId: string): Promise<{ blob: Blob; fileName: string }> {
      const token = localStorage.getItem('goip_auth_token');
      const response = await fetch(`${API_BASE_URL}/api/v1/documents/${docId}/download`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('content-disposition');
      let fileName = `${docId}.pdf`;
      if (contentDisposition && contentDisposition.includes('filename=')) {
        fileName = contentDisposition.split('filename=')[1].replace(/["']/g, '');
      }

      return { blob, fileName };
    },
  },

  simulation: {
    getScenarios() {
      // Returns statically available interventions
      return request('/api/v1/simulation/scenarios');
    },

    async runSimulation(
      intervention: SimulationIntervention,
      threshold: number
    ): Promise<SimulationResult> {
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
