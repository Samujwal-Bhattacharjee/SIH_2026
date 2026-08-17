import {
  Case,
  CaseEvent,
  ProcessMapData,
  DocumentRecord,
  SimulationResult,
  SimulationScenarioOption,
  SimulationIntervention,
  DashboardMetrics,
  ProcessPerformanceMetrics,
  User,
  RiskPrediction,
} from '../../types';
import {
  MOCK_USER,
  MOCK_CASES,
  MOCK_CASE_EVENTS,
  MOCK_PROCESS_MAP,
  MOCK_DOCUMENTS,
  MOCK_SIMULATION_OPTIONS,
  MOCK_SIMULATION_RESULTS,
  MOCK_DASHBOARD_METRICS,
  MOCK_PROCESS_PERFORMANCE,
} from '../../mock/data';

// Stateful in-memory stores for runtime modifications during the session
let casesStore: Case[] = [...MOCK_CASES];
let documentsStore: DocumentRecord[] = [...MOCK_DOCUMENTS];
let sessionUser: User | null = null;

// Initialize session from localStorage if available
const storedAuth = localStorage.getItem('goip_mock_session');
if (storedAuth) {
  try {
    sessionUser = JSON.parse(storedAuth);
  } catch (e) {
    sessionUser = null;
  }
}

// Utility delay for realistic UX transitions
const delay = (ms: number = 350) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockApi = {
  // ----------------------------------------------------
  // AUTHENTICATION
  // ----------------------------------------------------
  auth: {
    async signIn(email: string, _password?: string): Promise<{ user: User; token: string }> {
      await delay(500);
      if (!email || !email.includes('@')) {
        throw new Error('Please provide a valid authorized government email address.');
      }
      const user: User = {
        ...MOCK_USER,
        email: email,
        name: email.split('@')[0].replace('.', ' ').toUpperCase(),
      };
      sessionUser = user;
      localStorage.setItem('goip_mock_session', JSON.stringify(user));
      return { user, token: 'mock_jwt_goip_token_xyz99281' };
    },

    async signOut(): Promise<void> {
      await delay(200);
      sessionUser = null;
      localStorage.removeItem('goip_mock_session');
    },

    async getCurrentUser(): Promise<User | null> {
      await delay(100);
      return sessionUser;
    },

    async getSession(): Promise<{ user: User | null; token: string | null }> {
      return {
        user: sessionUser,
        token: sessionUser ? 'mock_jwt_goip_token_xyz99281' : null,
      };
    },
  },

  // ----------------------------------------------------
  // DASHBOARD
  // ----------------------------------------------------
  dashboard: {
    async getMetrics(): Promise<DashboardMetrics> {
      await delay(250);
      const highRisk = casesStore.filter((c) => c.riskLevel === 'HIGH');
      const atRisk = casesStore.filter((c) => c.status === 'AT_RISK').length;
      const breached = casesStore.filter((c) => c.status === 'SLA_BREACHED').length;

      return {
        ...MOCK_DASHBOARD_METRICS,
        totalActiveCases: casesStore.length,
        slaAtRiskCount: atRisk,
        slaBreachedCount: breached,
        recentHighRiskCases: highRisk.slice(0, 5),
      };
    },
  },

  // ----------------------------------------------------
  // CASES
  // ----------------------------------------------------
  cases: {
    async getCases(params?: {
      department?: string;
      stage?: string;
      riskLevel?: string;
      status?: string;
      search?: string;
      caseType?: string;
    }): Promise<{ cases: Case[]; total: number }> {
      await delay(300);
      let filtered = [...casesStore];

      if (params?.department && params.department !== 'ALL') {
        filtered = filtered.filter((c) => c.department === params.department);
      }
      if (params?.stage && params.stage !== 'ALL') {
        filtered = filtered.filter((c) => c.currentStage === params.stage);
      }
      if (params?.riskLevel && params.riskLevel !== 'ALL') {
        filtered = filtered.filter((c) => c.riskLevel === params.riskLevel);
      }
      if (params?.status && params.status !== 'ALL') {
        filtered = filtered.filter((c) => c.status === params.status);
      }
      if (params?.caseType && params.caseType !== 'ALL') {
        filtered = filtered.filter((c) => c.caseType === params.caseType);
      }
      if (params?.search) {
        const query = params.search.toLowerCase();
        filtered = filtered.filter(
          (c) =>
            c.id.toLowerCase().includes(query) ||
            c.title.toLowerCase().includes(query) ||
            c.applicant.toLowerCase().includes(query) ||
            c.department.toLowerCase().includes(query)
        );
      }

      return {
        cases: filtered,
        total: filtered.length,
      };
    },

    async getCaseById(caseId: string): Promise<Case & { events: CaseEvent[]; documents: DocumentRecord[] }> {
      await delay(250);
      const found = casesStore.find((c) => c.id === caseId);
      if (!found) {
        throw new Error(`Case with ID ${caseId} not found in GOIP database.`);
      }

      const events = MOCK_CASE_EVENTS[caseId] || [
        {
          id: `ev-${caseId}-1`,
          caseId,
          stage: 'Application Received',
          timestamp: found.createdAt,
          durationDays: 0.5,
          waitDays: 0.2,
          officer: 'Intake Desk',
          status: 'COMPLETED',
        },
        {
          id: `ev-${caseId}-2`,
          caseId,
          stage: 'Document Verification',
          timestamp: '2026-08-05T10:00:00Z',
          durationDays: 1.8,
          waitDays: 1.0,
          officer: 'Verification Officer',
          status: 'COMPLETED',
        },
        {
          id: `ev-${caseId}-3`,
          caseId,
          stage: found.currentStage,
          timestamp: found.updatedAt,
          durationDays: 3.5,
          waitDays: 4.2,
          officer: found.assignedOfficer,
          status: 'IN_PROGRESS',
          isDelayed: found.riskLevel === 'HIGH',
        },
      ];

      const docs = documentsStore.filter((d) => d.caseId === caseId);

      return {
        ...found,
        events,
        documents: docs,
      };
    },

    async toggleFlagForReview(caseId: string): Promise<{ caseId: string; flaggedForReview: boolean }> {
      await delay(200);
      const index = casesStore.findIndex((c) => c.id === caseId);
      if (index === -1) {
        throw new Error(`Case ${caseId} not found.`);
      }
      casesStore[index] = {
        ...casesStore[index],
        flaggedForReview: !casesStore[index].flaggedForReview,
        updatedAt: new Date().toISOString(),
      };
      return {
        caseId,
        flaggedForReview: casesStore[index].flaggedForReview,
      };
    },

    async search(query: string): Promise<{ cases: Case[]; documents: DocumentRecord[] }> {
      await delay(150);
      const q = query.toLowerCase().trim();
      if (!q) return { cases: [], documents: [] };

      const matchedCases = casesStore.filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.applicant.toLowerCase().includes(q) ||
          c.department.toLowerCase().includes(q)
      );

      const matchedDocs = documentsStore.filter(
        (d) =>
          d.id.toLowerCase().includes(q) ||
          d.title.toLowerCase().includes(q) ||
          d.fileName.toLowerCase().includes(q) ||
          d.caseId.toLowerCase().includes(q)
      );

      return {
        cases: matchedCases,
        documents: matchedDocs,
      };
    },
  },

  // ----------------------------------------------------
  // WORKFLOW & PROCESS MINING
  // ----------------------------------------------------
  workflow: {
    async getProcessMap(_filters?: { department?: string; dateRange?: string }): Promise<ProcessMapData> {
      await delay(400);
      return MOCK_PROCESS_MAP;
    },

    async getNodeDetail(stageId: string) {
      await delay(150);
      const node = MOCK_PROCESS_MAP.nodes.find((n) => n.id === stageId || n.stage === stageId);
      if (!node) throw new Error(`Stage ${stageId} not found in process model.`);
      return node;
    },
  },

  // ----------------------------------------------------
  // RISK INTELLIGENCE
  // ----------------------------------------------------
  risk: {
    async getRiskCases(): Promise<Case[]> {
      await delay(250);
      return [...casesStore]
        .sort((a, b) => b.riskScore - a.riskScore)
        .filter((c) => c.status !== 'RESOLVED');
    },

    async getRiskPrediction(caseId: string): Promise<RiskPrediction | null> {
      await delay(200);
      const found = casesStore.find((c) => c.id === caseId);
      if (found?.riskPrediction) return found.riskPrediction;
      return null;
    },
  },

  // ----------------------------------------------------
  // DOCUMENTS & OCR
  // ----------------------------------------------------
  documents: {
    async getDocuments(params?: { caseId?: string; search?: string }): Promise<DocumentRecord[]> {
      await delay(250);
      let docs = [...documentsStore];
      if (params?.caseId) {
        docs = docs.filter((d) => d.caseId === params.caseId);
      }
      if (params?.search) {
        const q = params.search.toLowerCase();
        docs = docs.filter(
          (d) =>
            d.title.toLowerCase().includes(q) ||
            d.fileName.toLowerCase().includes(q) ||
            d.caseId.toLowerCase().includes(q)
        );
      }
      return docs;
    },

    async getDocumentById(docId: string): Promise<DocumentRecord> {
      await delay(200);
      const doc = documentsStore.find((d) => d.id === docId);
      if (!doc) {
        throw new Error(`Document with ID ${docId} not found.`);
      }
      return doc;
    },

    async uploadDocument(file: File, caseId: string, documentType: string): Promise<DocumentRecord> {
      await delay(600);
      const newId = `doc-up-${Date.now().toString().slice(-5)}`;
      const associatedCase = casesStore.find((c) => c.id === caseId);

      const newDoc: DocumentRecord = {
        id: newId,
        caseId: caseId || 'KA-10482',
        caseTitle: associatedCase?.title || 'Sy. No. 142/A Boundary Adjudication & Mutation Appeal',
        title: file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
        documentType: (documentType as any) || 'Affidavit',
        fileName: file.name,
        fileUrl: URL.createObjectURL(file),
        uploadDate: new Date().toISOString(),
        uploadedBy: sessionUser?.name || 'Operations Officer',
        status: 'READY',
        ocrStatus: 'COMPLETED',
        metadata: {
          fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          fileType: file.type || 'application/pdf',
          mimeType: file.type || 'application/pdf',
          pageCount: 2,
          author: sessionUser?.name || 'Authorized Upload',
          checksum: `sha256:${Math.random().toString(36).substring(2, 12)}`,
        },
        ocrResult: {
          documentId: newId,
          extractedText: `GOVERNMENT OF INDIA - OFFICIAL RECORD DOCUMENT\nFILE: ${file.name}\nASSOCIATED CASE REF: ${caseId}\nTIMESTAMP OF INGESTION: ${new Date().toISOString()}\n\nAUTOMATED OCR EXTRACTION RESULT:\nThe submitted document has been analyzed by the GOIP Optical Character Recognition engine. Key metadata attributes, statutory cross-references, and administrative endorsements have been parsed into structured fields.`,
          confidenceScore: 0.94,
          processingTimeMs: 1240,
          ocrEngine: 'Tesseract 5.3 + Indic OCR Module',
          status: 'READY',
          extractedFields: [
            { key: 'Source Document', value: file.name, confidence: 0.99, isExtracted: true },
            { key: 'Case Association', value: caseId || 'KA-10482', confidence: 0.98, isExtracted: true },
            { key: 'Classification', value: documentType || 'Verified Affidavit', confidence: 0.95, isExtracted: true },
            { key: 'Verification Status', value: 'Digitally Ingested', confidence: 0.92, isExtracted: true },
          ],
        },
      };

      documentsStore.unshift(newDoc);
      return newDoc;
    },

    async downloadDocument(docId: string): Promise<{ blob: Blob; fileName: string }> {
      await delay(300);
      const doc = documentsStore.find((d) => d.id === docId);
      const content = doc?.ocrResult?.extractedText || `GOIP Official Document Archive: ${docId}`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      return {
        blob,
        fileName: doc?.fileName || `${docId}.txt`,
      };
    },
  },

  // ----------------------------------------------------
  // WHAT-IF SIMULATION
  // ----------------------------------------------------
  simulation: {
    getScenarios(): SimulationScenarioOption[] {
      return MOCK_SIMULATION_OPTIONS;
    },

    async runSimulation(
      intervention: SimulationIntervention,
      threshold: number
    ): Promise<SimulationResult> {
      await delay(1200); // Allow multi-stage animation on the UI
      const baseResult = MOCK_SIMULATION_RESULTS[intervention] || MOCK_SIMULATION_RESULTS.ESCALATE_LEGAL_REVIEW_THRESHOLD;

      // Adjust dynamic outcome based on threshold value
      const factor = threshold / (baseResult.thresholdApplied || 5);
      const cycleReduction = Math.max(2.1, Math.min(11.4, baseResult.difference.cycleTimeReductionDays * (1 / factor)));

      return {
        ...baseResult,
        thresholdApplied: threshold,
        difference: {
          ...baseResult.difference,
          cycleTimeReductionDays: parseFloat(cycleReduction.toFixed(1)),
        },
        executionTimestamp: new Date().toISOString(),
      };
    },
  },

  // ----------------------------------------------------
  // ANALYTICS & PROCESS PERFORMANCE
  // ----------------------------------------------------
  analytics: {
    async getPerformanceMetrics(): Promise<ProcessPerformanceMetrics> {
      await delay(300);
      return MOCK_PROCESS_PERFORMANCE;
    },
  },
};
