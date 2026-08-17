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
  DepartmentInfo,
  OfficerInfo,
  AuditLog,
  OCRResult,
} from '../../types';
import {
  MOCK_USER,
  MOCK_CASES,
  MOCK_CASE_EVENTS,
  MOCK_PROCESS_MAP,
  MOCK_DOCUMENTS,
  MOCK_SCENARIOS,
  MOCK_DASHBOARD_METRICS,
  MOCK_PERFORMANCE_METRICS,
  MOCK_DEPARTMENTS,
  MOCK_OFFICERS,
  MOCK_AUDIT_LOGS,
  MOCK_BOTTLENECKS,
} from '../../mock/data';

// Stateful in-memory stores for runtime modifications during the session
let casesStore: Case[] = [...MOCK_CASES];
let caseEventsStore: Record<string, CaseEvent[]> = { ...MOCK_CASE_EVENTS };
let documentsStore: DocumentRecord[] = [...MOCK_DOCUMENTS];
let auditLogsStore: AuditLog[] = [...MOCK_AUDIT_LOGS];
let sessionUser: User | null = null;

// Initialize session from localStorage if available
const storedAuth = localStorage.getItem('gov_session_user');
if (storedAuth) {
  try {
    sessionUser = JSON.parse(storedAuth);
  } catch {
    sessionUser = null;
  }
}

const delay = (ms: number = 200) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockApi = {
  // ----------------------------------------------------
  // AUTHENTICATION
  // ----------------------------------------------------
  auth: {
    async signIn(email: string, _password?: string): Promise<{ user: User; token: string }> {
      await delay(350);
      const user: User = {
        ...MOCK_USER,
        email: email || MOCK_USER.email,
        name: email ? (email.includes('director') ? 'Rajeshwar V. Verma, IAS' : 'K. R. Mohan (Assistant Commissioner)') : MOCK_USER.name,
      };
      sessionUser = user;
      localStorage.setItem('gov_session_user', JSON.stringify(user));
      return { user, token: 'gov_nic_session_token_2026' };
    },

    async signOut(): Promise<void> {
      await delay(150);
      sessionUser = null;
      localStorage.removeItem('gov_session_user');
    },

    async getCurrentUser(): Promise<User | null> {
      await delay(100);
      return sessionUser;
    },

    async getSession(): Promise<{ user: User | null; token: string | null }> {
      return {
        user: sessionUser,
        token: sessionUser ? 'gov_nic_session_token_2026' : null,
      };
    },
  },

  // ----------------------------------------------------
  // DASHBOARD
  // ----------------------------------------------------
  dashboard: {
    async getMetrics(): Promise<DashboardMetrics> {
      await delay(200);
      const highRisk = casesStore.filter((c) => c.riskLevel === 'HIGH');
      const atRisk = casesStore.filter((c) => c.status === 'AT_RISK' || c.status === 'UNDER_SCRUTINY').length;
      const breached = casesStore.filter((c) => c.status === 'OVERDUE' || c.status === 'SLA_BREACHED' || c.daysRemaining < 0).length;
      const inProcess = casesStore.filter((c) => c.status === 'UNDER_PROCESSING' || c.status === 'IN_PROGRESS' || c.status === 'UNDER_SCRUTINY').length;

      return {
        ...MOCK_DASHBOARD_METRICS,
        totalActiveCases: casesStore.length,
        inProcessCount: inProcess,
        slaAtRiskCount: atRisk,
        slaBreachedCount: breached,
        recentHighRiskCases: highRisk.slice(0, 5),
      };
    },
  },

  // ----------------------------------------------------
  // FILE / CASE MANAGEMENT
  // ----------------------------------------------------
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
      await delay(200);
      let results = [...casesStore];

      if (params?.department && params.department !== 'ALL') {
        results = results.filter((c) => c.department === params.department);
      }
      if (params?.stage && params.stage !== 'ALL') {
        results = results.filter((c) => c.currentStage === params.stage);
      }
      if (params?.riskLevel && params.riskLevel !== 'ALL') {
        results = results.filter((c) => c.riskLevel === params.riskLevel);
      }
      if (params?.priority && params.priority !== 'ALL') {
        results = results.filter((c) => c.priority === params.priority);
      }
      if (params?.status && params.status !== 'ALL') {
        results = results.filter((c) => {
          if (params.status === 'OVERDUE') return c.status === 'OVERDUE' || c.daysRemaining < 0;
          return c.status === params.status;
        });
      }
      if (params?.search && params.search.trim() !== '') {
        const q = params.search.toLowerCase();
        results = results.filter(
          (c) =>
            c.id.toLowerCase().includes(q) ||
            (c.fileNumber && c.fileNumber.toLowerCase().includes(q)) ||
            c.title.toLowerCase().includes(q) ||
            (c.subject && c.subject.toLowerCase().includes(q)) ||
            c.applicant.toLowerCase().includes(q) ||
            c.assignedOfficer.toLowerCase().includes(q)
        );
      }

      return { cases: results, total: results.length };
    },

    async getCaseById(caseId: string): Promise<Case & { events: CaseEvent[]; documents: DocumentRecord[] }> {
      await delay(200);
      const caseItem = casesStore.find((c) => c.id === caseId || c.fileNumber === caseId);
      if (!caseItem) {
        throw new Error(`File Docket ${caseId} not found in active government registry.`);
      }

      const events = caseEventsStore[caseItem.id] || [];
      const documents = documentsStore.filter((d) => d.caseId === caseItem.id);

      return {
        ...caseItem,
        events,
        documents,
      };
    },

    async createCase(newCaseData: Partial<Case> & { initialDocument?: DocumentRecord }): Promise<Case> {
      await delay(350);
      const nextSeq = 10520 + casesStore.length + 1;
      const deptCode = newCaseData.department ? newCaseData.department.substring(0, 3).toUpperCase() : 'REV';
      const fileNumber = newCaseData.fileNumber || `KA/${deptCode}/2026/${String(nextSeq).padStart(6, '0')}`;
      const id = `KA-${nextSeq}`;

      const createdCase: Case = {
        id,
        fileNumber,
        title: newCaseData.title || newCaseData.subject || 'Inward File Registration',
        subject: newCaseData.subject || newCaseData.title || '',
        caseType: newCaseData.caseType || 'Administrative Inquiry',
        department: newCaseData.department || 'Land Revenue',
        section: newCaseData.section || 'General Administration Section',
        currentStage: 'Application Received',
        ageDays: 0,
        statutoryDeadlineDays: newCaseData.statutoryDeadlineDays || 30,
        daysRemaining: newCaseData.statutoryDeadlineDays || 30,
        riskScore: 12,
        riskLevel: 'LOW',
        status: 'REGISTERED',
        priority: newCaseData.priority || 'ROUTINE',
        applicant: newCaseData.applicant || 'Central Inward Counter',
        origin: newCaseData.origin || 'Government Secretariat',
        assignedOfficer: newCaseData.assignedOfficer || 'S. N. Hegde (Verification Officer)',
        currentDesk: 'DESK-INWARD-01',
        flaggedForReview: false,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
        lastMovementDate: 'Just now',
        documentIds: newCaseData.initialDocument ? [newCaseData.initialDocument.id] : [],
      };

      casesStore.unshift(createdCase);

      const initialEvent: CaseEvent = {
        id: `ev-${Date.now()}`,
        caseId: id,
        stage: 'Application Received',
        timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
        durationDays: 0,
        waitDays: 0,
        officer: sessionUser?.name || 'Inward Intake Officer',
        fromDesk: 'Central Inward Counter',
        toDesk: createdCase.currentDesk,
        status: 'COMPLETED',
        notes: `File formally registered with file number ${fileNumber}. Priority: ${createdCase.priority}.`,
      };

      caseEventsStore[id] = [initialEvent];

      // Audit Log
      auditLogsStore.unshift({
        id: `audit-${Date.now()}`,
        timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
        officerId: sessionUser?.id || 'OFC-1042',
        officerName: sessionUser?.name || 'Rajeshwar V. Verma, IAS',
        action: 'FILE_REGISTERED',
        fileId: id,
        fileNumber,
        previousState: 'Inward Receipt',
        newState: 'Registered in Official File Register',
        ipAddress: '10.14.22.104',
        terminalId: 'SEC-HQ-NODE-01',
        remarks: `Inward file ${fileNumber} registered under ${createdCase.department}.`,
      });

      return createdCase;
    },

    async forwardCase(
      caseId: string,
      targetOfficer: string,
      targetDesk: string,
      remarks: string,
      newStage?: Case['currentStage']
    ): Promise<Case> {
      await delay(300);
      const caseItem = casesStore.find((c) => c.id === caseId);
      if (!caseItem) throw new Error('File docket not found.');

      const previousOfficer = caseItem.assignedOfficer;
      const previousDesk = caseItem.currentDesk || 'Previous Desk';
      const stage = newStage || caseItem.currentStage;

      caseItem.assignedOfficer = targetOfficer;
      caseItem.currentDesk = targetDesk;
      caseItem.currentStage = stage;
      caseItem.status = 'FORWARDED';
      caseItem.lastMovementDate = 'Just now';
      caseItem.updatedAt = new Date().toISOString().split('T')[0];

      const newEvent: CaseEvent = {
        id: `ev-${Date.now()}`,
        caseId,
        stage,
        timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
        durationDays: 0.1,
        waitDays: 0,
        officer: targetOfficer,
        fromOfficer: previousOfficer,
        toOfficer: targetOfficer,
        fromDesk: previousDesk,
        toDesk: targetDesk,
        status: 'COMPLETED',
        notes: remarks || `File forwarded from ${previousOfficer} to ${targetOfficer}.`,
      };

      if (!caseEventsStore[caseId]) caseEventsStore[caseId] = [];
      caseEventsStore[caseId].push(newEvent);

      // Audit Log
      auditLogsStore.unshift({
        id: `audit-${Date.now()}`,
        timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
        officerId: sessionUser?.id || 'OFC-1042',
        officerName: sessionUser?.name || 'Rajeshwar V. Verma, IAS',
        action: 'FILE_FORWARDED',
        fileId: caseId,
        fileNumber: caseItem.fileNumber,
        previousState: `${previousOfficer} (${previousDesk})`,
        newState: `${targetOfficer} (${targetDesk})`,
        ipAddress: '10.14.22.104',
        terminalId: 'SEC-HQ-NODE-01',
        remarks: remarks || `Forwarded to ${targetOfficer}.`,
      });

      return caseItem;
    },

    async updateStatus(caseId: string, status: Case['status'], notes?: string): Promise<Case> {
      await delay(250);
      const caseItem = casesStore.find((c) => c.id === caseId);
      if (!caseItem) throw new Error('File docket not found.');

      const oldStatus = caseItem.status;
      caseItem.status = status;
      caseItem.updatedAt = new Date().toISOString().split('T')[0];

      // Audit Log
      auditLogsStore.unshift({
        id: `audit-${Date.now()}`,
        timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
        officerId: sessionUser?.id || 'OFC-1042',
        officerName: sessionUser?.name || 'Rajeshwar V. Verma, IAS',
        action: status === 'APPROVED' ? 'FILE_APPROVED' : status === 'DISPOSED' ? 'FILE_DISPOSED' : 'FILE_FORWARDED',
        fileId: caseId,
        fileNumber: caseItem.fileNumber,
        previousState: oldStatus,
        newState: status,
        ipAddress: '10.14.22.104',
        terminalId: 'SEC-HQ-NODE-01',
        remarks: notes || `Status transitioned to ${status}.`,
      });

      return caseItem;
    },

    async toggleFlagForReview(caseId: string): Promise<{ caseId: string; flaggedForReview: boolean }> {
      await delay(150);
      const caseItem = casesStore.find((c) => c.id === caseId);
      if (caseItem) {
        caseItem.flaggedForReview = !caseItem.flaggedForReview;
        auditLogsStore.unshift({
          id: `audit-${Date.now()}`,
          timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
          officerId: sessionUser?.id || 'OFC-1042',
          officerName: sessionUser?.name || 'Rajeshwar V. Verma, IAS',
          action: 'FLAGGED_REVIEW',
          fileId: caseId,
          fileNumber: caseItem.fileNumber,
          previousState: caseItem.flaggedForReview ? 'Normal Priority' : 'Flagged for High-Priority Oversight',
          newState: caseItem.flaggedForReview ? 'Flagged for High-Priority Oversight' : 'Normal Priority',
          ipAddress: '10.14.22.104',
          terminalId: 'SEC-HQ-NODE-01',
          remarks: caseItem.flaggedForReview ? 'Flagged for high-level monitoring.' : 'Flag cleared.',
        });
        return { caseId, flaggedForReview: caseItem.flaggedForReview };
      }
      return { caseId, flaggedForReview: false };
    },

    async search(query: string): Promise<{ cases: Case[]; documents: DocumentRecord[] }> {
      await delay(200);
      const q = query.toLowerCase();
      const matchedCases = casesStore.filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          (c.fileNumber && c.fileNumber.toLowerCase().includes(q)) ||
          c.title.toLowerCase().includes(q) ||
          (c.subject && c.subject.toLowerCase().includes(q)) ||
          c.applicant.toLowerCase().includes(q) ||
          c.department.toLowerCase().includes(q)
      );

      const matchedDocs = documentsStore.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.fileName.toLowerCase().includes(q) ||
          (d.ocrResult && d.ocrResult.extractedText.toLowerCase().includes(q)) ||
          (d.metadata.referenceNumber && d.metadata.referenceNumber.toLowerCase().includes(q))
      );

      return { cases: matchedCases, documents: matchedDocs };
    },
  },

  // ----------------------------------------------------
  // WORKFLOW & INTELLIGENCE
  // ----------------------------------------------------
  workflow: {
    async getProcessMap(_filters?: { department?: string; dateRange?: string }): Promise<ProcessMapData> {
      await delay(250);
      return MOCK_PROCESS_MAP;
    },

    async getNodeDetail(stageId: string) {
      await delay(150);
      const node = MOCK_PROCESS_MAP.nodes.find((n) => n.id === stageId || n.stage === stageId);
      const bottleneck = MOCK_BOTTLENECKS.find((b) => b.stage === stageId);
      return { node, bottleneck };
    },
  },

  // ----------------------------------------------------
  // DELAY RISK & PREDICTION
  // ----------------------------------------------------
  risk: {
    async getRiskCases(): Promise<Case[]> {
      await delay(200);
      return casesStore.filter((c) => c.riskPrediction !== undefined || c.riskLevel === 'HIGH' || c.daysRemaining < 5);
    },

    async getRiskPrediction(caseId: string): Promise<RiskPrediction | null> {
      await delay(150);
      const caseItem = casesStore.find((c) => c.id === caseId);
      return caseItem?.riskPrediction || null;
    },
  },

  // ----------------------------------------------------
  // DOCUMENT REPOSITORY & OCR
  // ----------------------------------------------------
  documents: {
    async getDocuments(params?: { caseId?: string; search?: string; ocrStatus?: string }): Promise<DocumentRecord[]> {
      await delay(200);
      let list = [...documentsStore];
      if (params?.caseId) {
        list = list.filter((d) => d.caseId === params.caseId);
      }
      if (params?.ocrStatus && params.ocrStatus !== 'ALL') {
        list = list.filter((d) => d.ocrStatus === params.ocrStatus);
      }
      if (params?.search && params.search.trim() !== '') {
        const q = params.search.toLowerCase();
        list = list.filter(
          (d) =>
            d.title.toLowerCase().includes(q) ||
            d.fileName.toLowerCase().includes(q) ||
            (d.ocrResult && d.ocrResult.extractedText.toLowerCase().includes(q))
        );
      }
      return list;
    },

    async getDocumentById(docId: string): Promise<DocumentRecord> {
      await delay(150);
      const doc = documentsStore.find((d) => d.id === docId);
      if (!doc) throw new Error('Document record not found.');
      return doc;
    },

    async uploadDocument(file: File, caseId: string, documentType: string): Promise<DocumentRecord> {
      await delay(400);
      const id = `doc-${Date.now()}`;
      const newDoc: DocumentRecord = {
        id,
        caseId,
        title: file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
        documentType: (documentType as DocumentRecord['documentType']) || 'Application Form',
        fileName: file.name,
        fileUrl: URL.createObjectURL(file),
        uploadDate: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
        uploadedBy: sessionUser?.name || 'Officer Intake',
        status: 'READY',
        ocrStatus: 'COMPLETED',
        metadata: {
          fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          fileType: file.type.includes('pdf') ? 'PDF' : 'IMAGE',
          mimeType: file.type || 'application/pdf',
          pageCount: 1,
          documentDate: new Date().toISOString().split('T')[0],
          issuingAuthority: 'Department of Administrative Reforms',
        },
      };

      documentsStore.unshift(newDoc);

      const targetCase = casesStore.find((c) => c.id === caseId);
      if (targetCase) {
        if (!targetCase.documentIds.includes(id)) {
          targetCase.documentIds.push(id);
        }
      }

      auditLogsStore.unshift({
        id: `audit-${Date.now()}`,
        timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
        officerId: sessionUser?.id || 'OFC-1042',
        officerName: sessionUser?.name || 'Rajeshwar V. Verma, IAS',
        action: 'DOCUMENT_UPLOADED',
        fileId: caseId,
        fileNumber: targetCase?.fileNumber,
        previousState: 'N/A',
        newState: `Document Attached: ${newDoc.fileName}`,
        ipAddress: '10.14.22.104',
        terminalId: 'SEC-HQ-NODE-01',
        remarks: `Document ${newDoc.fileName} successfully uploaded and linked to docket.`,
      });

      return newDoc;
    },

    async downloadDocument(docId: string): Promise<{ blob: Blob; fileName: string }> {
      await delay(150);
      const doc = documentsStore.find((d) => d.id === docId);
      const fileName = doc?.fileName || 'document.pdf';
      const sampleText = doc?.ocrResult?.extractedText || 'Government of India - Official Document Record\nAuthenticated by Digital Signature';
      const blob = new Blob([sampleText], { type: 'text/plain;charset=utf-8' });
      return { blob, fileName };
    },
  },

  // ----------------------------------------------------
  // OCR SERVICE ABSTRACTION
  // ----------------------------------------------------
  ocr: {
    async processDocument(file: File): Promise<OCRResult> {
      await delay(1200); // realistic OCR latency
      const extractedText = `GOVERNMENT OF KARNATAKA
DEPARTMENT OF ADMINISTRATIVE REFORMS & PUBLIC GRIEVANCES
INWARD RECEIPT & SCRUTINY MEMORANDUM

FILE IDENTIFIER: KA/REV/2026/00${Math.floor(1000 + Math.random() * 9000)}
REFERENCE NUMBER: GOI-REV-SEC-2026/8941
SUBJECT: Official scrutiny and sanction proposal regarding land title survey boundaries.
SENDER / ORIGIN: Office of District Collector, Revenue Administration Wing.
DATE OF DISPATCH: ${new Date().toISOString().split('T')[0]}

OPERATIVE SUMMARY:
The attached representation has been scrutinized in accordance with Karnataka Land Revenue Rules 1966.
All statutory title clearances and boundary sketch maps have been validated against district Bhoomi GIS repository.
File recommended for immediate administrative endorsement and legal scrutiny.`;

      return {
        documentId: `doc-${Date.now()}`,
        ocrEngine: 'Tesseract 5.3 + Multi-lingual Indic OCR v2.4',
        status: 'READY',
        processingTimeMs: 1180,
        confidenceScore: 0.96,
        extractedText,
        extractedFields: [
          { key: 'fileNumber', label: 'File Number', value: `KA/REV/2026/00${Math.floor(1000 + Math.random() * 9000)}`, confidence: 0.98, isExtracted: true },
          { key: 'subject', label: 'Subject', value: 'Official scrutiny and sanction proposal regarding land title survey boundaries', confidence: 0.95, isExtracted: true },
          { key: 'department', label: 'Department', value: 'Land Revenue', confidence: 0.97, isExtracted: true },
          { key: 'sender', label: 'Sender / Origin', value: 'Office of District Collector, Revenue Wing', confidence: 0.94, isExtracted: true },
          { key: 'date', label: 'Document Date', value: new Date().toISOString().split('T')[0], confidence: 0.99, isExtracted: true },
          { key: 'referenceNumber', label: 'Reference Number', value: 'GOI-REV-SEC-2026/8941', confidence: 0.96, isExtracted: true },
          { key: 'documentType', label: 'Document Type', value: 'Application Form', confidence: 0.97, isExtracted: true },
          { key: 'priority', label: 'Priority', value: 'URGENT', confidence: 0.92, isExtracted: true },
        ],
      };
    },
  },

  // ----------------------------------------------------
  // DEPARTMENTS & OFFICERS DIRECTORY
  // ----------------------------------------------------
  departments: {
    async getDepartments(): Promise<DepartmentInfo[]> {
      await delay(150);
      return MOCK_DEPARTMENTS;
    },

    async getOfficers(): Promise<OfficerInfo[]> {
      await delay(150);
      return MOCK_OFFICERS;
    },
  },

  // ----------------------------------------------------
  // AUDIT LOGS
  // ----------------------------------------------------
  audit: {
    async getAuditLogs(params?: { fileId?: string; officerId?: string; search?: string }): Promise<AuditLog[]> {
      await delay(150);
      let logs = [...auditLogsStore];
      if (params?.fileId) {
        logs = logs.filter((l) => l.fileId === params.fileId || l.fileNumber === params.fileId);
      }
      if (params?.officerId) {
        logs = logs.filter((l) => l.officerId === params.officerId);
      }
      if (params?.search && params.search.trim() !== '') {
        const q = params.search.toLowerCase();
        logs = logs.filter(
          (l) =>
            l.officerName.toLowerCase().includes(q) ||
            l.action.toLowerCase().includes(q) ||
            (l.fileNumber && l.fileNumber.toLowerCase().includes(q)) ||
            (l.remarks && l.remarks.toLowerCase().includes(q))
        );
      }
      return logs;
    },
  },

  // ----------------------------------------------------
  // SIMULATION
  // ----------------------------------------------------
  simulation: {
    async getScenarios(): Promise<SimulationScenarioOption[]> {
      await delay(150);
      return MOCK_SCENARIOS;
    },

    async runSimulation(intervention: SimulationIntervention, threshold: number): Promise<SimulationResult> {
      await delay(600);
      const isLegal = intervention === 'ESCALATE_LEGAL_REVIEW_THRESHOLD';
      const reductionDays = isLegal ? (8 - threshold) * 0.9 + 2.1 : 3.4;
      const slaImprovement = isLegal ? (8 - threshold) * 2.8 + 8.4 : 11.2;

      return {
        scenarioId: `sim-${Date.now()}`,
        intervention,
        interventionName: isLegal ? 'Chamber Opinion Fast-Track for Legal Review' : 'Automated Bhoomi GIS Pre-Verification on Intake',
        thresholdApplied: threshold,
        baseline: {
          medianCycleDays: 12.4,
          slaCompliancePct: 83.4,
          highRiskCasesCount: 142,
          reworkCasesPct: 18.2,
          avgLegalWaitDays: 5.8,
        },
        simulated: {
          medianCycleDays: Math.max(7.2, +(12.4 - reductionDays).toFixed(1)),
          slaCompliancePct: Math.min(96.5, +(83.4 + slaImprovement).toFixed(1)),
          highRiskCasesCount: Math.max(34, Math.round(142 - slaImprovement * 6)),
          reworkCasesPct: isLegal ? 8.4 : 12.1,
          avgLegalWaitDays: isLegal ? Math.max(1.8, +(5.8 - (8 - threshold) * 0.7).toFixed(1)) : 5.8,
        },
        difference: {
          cycleTimeReductionDays: +reductionDays.toFixed(1),
          slaImprovementPct: +slaImprovement.toFixed(1),
          riskCasesMitigated: Math.round(slaImprovement * 6),
          legalWaitReductionDays: isLegal ? +((8 - threshold) * 0.7).toFixed(1) : 0,
        },
        summaryExplanation: `Simulation indicates that applying threshold parameter ${threshold} reduces median turnaround by ${reductionDays.toFixed(1)} days and elevates SLA compliance by +${slaImprovement.toFixed(1)}%.`,
        stagesComparison: [
          { stage: 'Application Received', baselineWait: 0.2, simulatedWait: 0.2, baselineDuration: 0.5, simulatedDuration: 0.5 },
          { stage: 'Document Verification', baselineWait: 1.2, simulatedWait: isLegal ? 1.2 : 0.4, baselineDuration: 1.8, simulatedDuration: 1.8 },
          { stage: 'Department Assignment', baselineWait: 0.6, simulatedWait: 0.6, baselineDuration: 0.8, simulatedDuration: 0.8 },
          { stage: 'Officer Review', baselineWait: 2.1, simulatedWait: 1.8, baselineDuration: 3.4, simulatedDuration: 3.2 },
          { stage: 'Legal Review', baselineWait: 5.8, simulatedWait: isLegal ? 2.1 : 5.8, baselineDuration: 6.4, simulatedDuration: isLegal ? 3.2 : 6.4 },
          { stage: 'Approval', baselineWait: 1.4, simulatedWait: 1.1, baselineDuration: 2.1, simulatedDuration: 2.0 },
          { stage: 'Closure', baselineWait: 0.3, simulatedWait: 0.3, baselineDuration: 0.6, simulatedDuration: 0.6 },
        ],
        executionTimestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
      };
    },
  },

  // ----------------------------------------------------
  // ANALYTICS & REPORTS
  // ----------------------------------------------------
  analytics: {
    async getPerformanceMetrics(): Promise<ProcessPerformanceMetrics> {
      await delay(200);
      return MOCK_PERFORMANCE_METRICS;
    },
  },
};
