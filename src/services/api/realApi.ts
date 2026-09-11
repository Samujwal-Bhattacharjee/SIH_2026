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
import { supabase, isSupabaseConfigured, mapSupabaseUserToAppUser } from '../../lib/supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export function getValidAuthToken(): string | null {
  const token = localStorage.getItem('gov_session_token');
  if (!token) return null;
  // Discard mock tokens, whitespace, or stringified null/undefined
  if (
    token === 'gov_nic_session_token_2026' ||
    token.trim() === '' ||
    token === 'null' ||
    token === 'undefined'
  ) {
    localStorage.removeItem('gov_session_token');
    return null;
  }
  // Must follow JWT structure (header.payload.signature)
  const parts = token.split('.');
  if (parts.length !== 3 || parts.some(p => p.length === 0)) {
    localStorage.removeItem('gov_session_token');
    return null;
  }
  return token;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const isAuthPublicRoute =
    endpoint === '/api/v1/auth/login' ||
    endpoint === '/api/v1/auth/register';

  const token = isAuthPublicRoute ? null : getValidAuthToken();
  if (!isAuthPublicRoute && !token) {
    throw new Error('[401] Authentication credentials are required. Please log in.');
  }
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // Only clear the session if the authoritative /me session check itself is rejected as 401
    if (response.status === 401 && endpoint === '/api/v1/auth/me') {
      localStorage.removeItem('gov_session_token');
      localStorage.removeItem('gov_session_user');
    }
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
      localStorage.removeItem('gov_session_token');
      localStorage.removeItem('gov_session_user');

      try {
        const data = await request<{ user: User; token: string }>('/api/v1/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        if (data && data.token) {
          localStorage.setItem('gov_session_token', data.token);
          if (data.user) {
            localStorage.setItem('gov_session_user', JSON.stringify(data.user));
          }
          // Clear any stale Supabase session to prevent onAuthStateChange from
          // firing later with an invalid token and clobbering this fresh JWT.
          localStorage.removeItem('sb_gov_auth_token');
        }
        return data;
      } catch (err) {
        if (isSupabaseConfigured() && password) {
          const { data: authData, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;
          if (authData.session && authData.user) {
            localStorage.setItem('gov_session_token', authData.session.access_token);
            const user = mapSupabaseUserToAppUser(authData.user);
            localStorage.setItem('gov_session_user', JSON.stringify(user));
            return { user, token: authData.session.access_token };
          }
        }
        throw err;
      }
    },

    async signUp(
      email: string,
      password: string,
      name?: string,
      department?: string,
      designation?: string,
      role?: string
    ): Promise<{ user: User; token: string }> {
      localStorage.removeItem('gov_session_token');
      localStorage.removeItem('gov_session_user');

      try {
        const data = await request<{ user: User; token: string }>('/api/v1/auth/register', {
          method: 'POST',
          body: JSON.stringify({ email, password, name, department, designation, role }),
        });
        if (data && data.token) {
          localStorage.setItem('gov_session_token', data.token);
          if (data.user) {
            localStorage.setItem('gov_session_user', JSON.stringify(data.user));
          }
          // Clear any stale Supabase session to prevent token clobbering
          localStorage.removeItem('sb_gov_auth_token');
        }
        return data;
      } catch (err) {
        if (isSupabaseConfigured()) {
          const { data: authData, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: name || email.split('@')[0],
                department: department || 'General Administration',
                designation: designation || 'Section Officer',
                role: role || 'SECTION_OFFICER',
              },
            },
          });
          if (error) throw error;
          if (authData.user) {
            const user = mapSupabaseUserToAppUser(authData.user);
            const token = authData.session?.access_token || '';
            if (token) localStorage.setItem('gov_session_token', token);
            return { user, token };
          }
        }
        throw err;
      }
    },

    async signInWithGoogle(): Promise<void> {
      if (!isSupabaseConfigured()) {
        throw new Error(
          'Supabase credentials are not configured in your .env file (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).'
        );
      }

      const redirectUrl = `${window.location.origin}/login`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        throw error;
      }
    },

    async signOut(): Promise<void> {
      try {
        if (isSupabaseConfigured()) {
          await supabase.auth.signOut();
        }
        await request('/api/v1/auth/logout', { method: 'POST' });
      } catch (e) {
        console.warn('Sign out cleanup warning:', e);
      } finally {
        localStorage.removeItem('gov_session_token');
        localStorage.removeItem('gov_session_user');
      }
    },

    async getCurrentUser(): Promise<User | null> {
      const token = getValidAuthToken();
      if (!token) return null;

      // Try backend endpoint first
      try {
        const user = await request<User>('/api/v1/auth/me');
        if (user) {
          localStorage.setItem('gov_session_user', JSON.stringify(user));
          return user;
        }
      } catch {
        // Backend not reachable or error
      }

      if (isSupabaseConfigured()) {
        try {
          const { data: { user: sbUser } } = await supabase.auth.getUser();
          if (sbUser) {
            return mapSupabaseUserToAppUser(sbUser);
          }
        } catch (err) {
          console.warn('Error reading Supabase user:', err);
        }
      }

      return null;
    },

    async getSession(): Promise<{ user: User | null; token: string | null }> {
      let token = getValidAuthToken();
      if (!token) return { user: null, token: null };
      const user = await this.getCurrentUser();
      if (!user) return { user: null, token: null };
      return { user, token };
    },
  },

  dashboard: {
    async getMetrics(): Promise<DashboardMetrics> {
      return request<DashboardMetrics>('/api/v1/dashboard/metrics');
    },
  },

  projects: {
    async getProjects(params?: {
      district?: string;
      state?: string;
      stage?: string;
      riskLevel?: string;
      status?: string;
      search?: string;
    }): Promise<{ projects: Case[]; total: number }> {
      const queryParams = new URLSearchParams();
      if (params?.district && params.district !== 'ALL') queryParams.append('district', params.district);
      if (params?.state && params.state !== 'ALL') queryParams.append('state', params.state);
      if (params?.stage && params.stage !== 'ALL') queryParams.append('stage', params.stage);
      if (params?.riskLevel && params.riskLevel !== 'ALL') queryParams.append('risk_level', params.riskLevel);
      if (params?.status && params.status !== 'ALL') queryParams.append('status', params.status);
      if (params?.search) queryParams.append('q', params.search);

      return request<{ projects: Case[]; total: number }>(`/api/v1/projects?${queryParams.toString()}`);
    },

    async getProjectById(projectId: string): Promise<Case & { events: CaseEvent[]; documents: DocumentRecord[] }> {
      return request<Case & { events: CaseEvent[]; documents: DocumentRecord[] }>(`/api/v1/projects/${projectId}`);
    },

    async createProject(newProject: Partial<Case>): Promise<Case> {
      return request<Case>('/api/v1/projects', {
        method: 'POST',
        body: JSON.stringify(newProject),
      });
    },

    async updateProject(projectId: string, updates: Partial<Case>): Promise<Case> {
      return request<Case>(`/api/v1/projects/${projectId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },

    async getPrediction(projectId: string): Promise<any> {
      return request<any>(`/api/v1/projects/${projectId}/prediction`);
    },

    async getBottlenecks(projectId: string): Promise<any> {
      return request<any>(`/api/v1/projects/${projectId}/bottlenecks`);
    },

    async getDelayFactors(projectId: string): Promise<any> {
      return request<any>(`/api/v1/projects/${projectId}/delay-factors`);
    },

    async getRecommendations(projectId: string): Promise<any> {
      return request<any>(`/api/v1/projects/${projectId}/recommendations`);
    },

    async getTimeline(projectId: string): Promise<any> {
      return request<any>(`/api/v1/projects/${projectId}/timeline`);
    },

    async uploadProjectDocument(projectId: string, file: File, documentType: string = 'Land Document'): Promise<any> {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', documentType);

      const token = getValidAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/v1/projects/${projectId}/documents`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!response.ok) throw new Error('Document upload failed');
      return response.json();
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

      const token = getValidAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/v1/documents/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!response.ok) throw new Error('Document upload failed');
      return response.json();
    },

    async downloadDocument(docId: string): Promise<{ blob: Blob; fileName: string }> {
      const token = getValidAuthToken();
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
      const token = getValidAuthToken();
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
      return request<OfficerInfo[]>('/api/v1/departments/officers');
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

  procurement: {
    async getDashboard(): Promise<any> {
      return request<any>('/api/v1/procurement/dashboard');
    },
    async getTenders(): Promise<any[]> {
      return request<any[]>('/api/v1/procurement/tenders');
    },
    async getTender(id: string): Promise<any> {
      return request<any>(`/api/v1/procurement/tenders/${id}`);
    },
    async createTender(tender: { title: string; department?: string; estimated_value?: number; bid_closing_date?: string; description?: string }): Promise<any> {
      return request<any>('/api/v1/procurement/tenders', {
        method: 'POST',
        body: JSON.stringify(tender),
      });
    },
    async getBidders(tenderId: string): Promise<any[]> {
      return request<any[]>(`/api/v1/procurement/tenders/${tenderId}/bidders`);
    },
    async addBidder(tenderId: string, bidder: { legal_name: string; gstin?: string; pan?: string }): Promise<any> {
      return request<any>(`/api/v1/procurement/tenders/${tenderId}/bidders`, {
        method: 'POST',
        body: JSON.stringify(bidder),
      });
    },
    async getBidder(id: string): Promise<any> {
      return request<any>(`/api/v1/procurement/bidders/${id}`);
    },
    async verifyBidder(bidderId: string): Promise<any> {
      return request<any>(`/api/v1/procurement/bidders/${bidderId}/verify`, {
        method: 'POST',
      });
    },
    async getCompliance(bidderId: string): Promise<any> {
      return request<any>(`/api/v1/procurement/bidders/${bidderId}/compliance`);
    },
    async recordDecision(bidderId: string, decision: string, note?: string): Promise<any> {
      return request<any>(`/api/v1/procurement/bidders/${bidderId}/decision`, {
        method: 'POST',
        body: JSON.stringify({ decision, note }),
      });
    },
    async getAuditTrail(tenderId?: string): Promise<any[]> {
      const q = tenderId ? `?tender_id=${tenderId}` : '';
      return request<any[]>(`/api/v1/procurement/audit${q}`);
    },
    async getDocuments(tenderId?: string): Promise<any[]> {
      return request<any[]>(`/api/v1/procurement/documents${tenderId ? `?tender_id=${encodeURIComponent(tenderId)}` : ''}`);
    },
    async getDocumentEvidence(documentId: string): Promise<any> {
      return request<any>(`/api/v1/procurement/documents/${documentId}`);
    },
    async reviewRequirement(bidderId: string, requirementId: string, status: string): Promise<any> {
      return request<any>(`/api/v1/procurement/bidders/${bidderId}/requirements/${requirementId}/review`, { method: 'POST', body: JSON.stringify({ status }) });
    },

    async uploadBidderDocument(bidderId: string, file: File, documentType: string = 'auto'): Promise<any> {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', documentType);

      const token = getValidAuthToken();
      if (!token) {
        throw new Error('[401] Authentication credentials are required to upload documents. Please log in.');
      }
      const response = await fetch(`${API_BASE_URL}/api/v1/procurement/bidders/${bidderId}/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        let detail = 'Document upload failed';
        try { detail = (await response.json()).detail || detail; } catch { /* noop */ }
        throw new Error(`[${response.status}] ${detail}`);
      }
      return response.json();
    },

    async getTenderIntegrity(tenderId: string): Promise<any> {
      return request<any>(`/api/v1/procurement/tenders/${encodeURIComponent(tenderId)}/integrity`);
    },

    async getBidderIntegrity(bidderId: string): Promise<any> {
      return request<any>(`/api/v1/procurement/bidders/${encodeURIComponent(bidderId)}/integrity`);
    },

    async recordIntegrityFindingReview(findingId: string, data: { status: string; tender_id?: string; bidder_id?: string; action?: string; note?: string }): Promise<any> {
      return request<any>(`/api/v1/procurement/integrity/findings/${encodeURIComponent(findingId)}/review`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },
};
