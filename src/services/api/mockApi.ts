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

    async signUp(
      email: string,
      _password: string,
      name?: string,
      department?: string,
      designation?: string,
      role?: string
    ): Promise<{ user: User; token: string }> {
      await delay(350);
      const user: User = {
        ...MOCK_USER,
        id: `usr-${Date.now()}`,
        email: email,
        name: name || email.split('@')[0].replace('.', ' ').replace(/(^\w|\s\w)/g, (m) => m.toUpperCase()),
        department: (department as any) || 'General Administration',
        designation: designation || 'Section Officer',
        role: (role as any) || 'SECTION_OFFICER',
        badgeNumber: `GOI-REG-${Math.floor(1000 + Math.random() * 9000)}`,
      };
      sessionUser = user;
      localStorage.setItem('gov_session_user', JSON.stringify(user));
      localStorage.setItem('gov_session_token', 'gov_nic_session_token_2026');
      return { user, token: 'gov_nic_session_token_2026' };
    },

    async signInWithGoogle(): Promise<{ user: User; token: string }> {
      await delay(400);
      const user: User = {
        ...MOCK_USER,
        id: 'usr-google-officer-01',
        email: 'officer.google@goip.gov.in',
        name: 'Dr. Anand S. Shastry (Chief Technical Advisor)',
        designation: 'Chief Technical Advisor & Data Officer',
        department: 'Administrative Reforms',
        role: 'OPERATIONS_OFFICER',
        badgeNumber: 'GOI-GGL-8821',
      };
      sessionUser = user;
      localStorage.setItem('gov_session_user', JSON.stringify(user));
      localStorage.setItem('gov_session_token', 'gov_nic_session_token_2026');
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
  // LAND ACQUISITION PROJECTS (SIH26017)
  // ----------------------------------------------------
  projects: {
    async getProjects(params?: {
      district?: string;
      state?: string;
      stage?: string;
      riskLevel?: string;
      status?: string;
      search?: string;
    }): Promise<{ projects: Case[]; total: number }> {
      await delay(200);
      let results = [...casesStore];

      if (params?.district && params.district !== 'ALL') {
        results = results.filter((c) => c.district === params.district);
      }
      if (params?.state && params.state !== 'ALL') {
        results = results.filter((c) => c.state === params.state);
      }
      if (params?.stage && params.stage !== 'ALL') {
        results = results.filter((c) => c.currentStage === params.stage);
      }
      if (params?.riskLevel && params.riskLevel !== 'ALL') {
        results = results.filter((c) => c.riskLevel === params.riskLevel || c.mlRiskLevel === params.riskLevel);
      }
      if (params?.status && params.status !== 'ALL') {
        results = results.filter((c) => c.status === params.status);
      }
      if (params?.search && params.search.trim() !== '') {
        const q = params.search.toLowerCase();
        results = results.filter(
          (c) =>
            c.id.toLowerCase().includes(q) ||
            (c.fileNumber && c.fileNumber.toLowerCase().includes(q)) ||
            (c.projectCode && c.projectCode.toLowerCase().includes(q)) ||
            c.title.toLowerCase().includes(q) ||
            (c.district && c.district.toLowerCase().includes(q))
        );
      }

      return { projects: results, total: results.length };
    },

    async getProjectById(projectId: string): Promise<Case & { events: CaseEvent[]; documents: DocumentRecord[] }> {
      await delay(200);
      const proj = casesStore.find((c) => c.id === projectId || c.fileNumber === projectId || c.projectCode === projectId);
      if (!proj) {
        throw new Error(`Project ${projectId} not found in Land Acquisition registry.`);
      }
      const events = caseEventsStore[proj.id] || [];
      const documents = documentsStore.filter((d) => d.caseId === proj.id);

      return {
        ...proj,
        events,
        documents,
      };
    },

    async createProject(newProj: Partial<Case>): Promise<Case> {
      await delay(350);
      const nextSeq = 1080 + casesStore.length + 1;
      const code = newProj.projectCode || `LA-${nextSeq}`;
      const created: Case = {
        id: code,
        fileNumber: code,
        projectCode: code,
        title: newProj.title || 'New Land Acquisition Project',
        subject: newProj.subject || '',
        caseType: 'Land Acquisition',
        department: newProj.department || 'Land Revenue',
        section: newProj.section || 'Special Land Acquisition Office',
        currentStage: newProj.currentStage || 'Project Initiation',
        ageDays: 0,
        statutoryDeadlineDays: newProj.statutoryDeadlineDays || 180,
        daysRemaining: newProj.statutoryDeadlineDays || 180,
        riskScore: 25,
        riskLevel: 'LOW',
        status: 'REGISTERED',
        priority: 'ROUTINE',
        applicant: newProj.applicant || 'State Requisitioning Body',
        origin: 'Revenue Department',
        assignedOfficer: newProj.assignedOfficer || 'Unassigned',
        currentDesk: 'Desk-01',
        flaggedForReview: false,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
        lastMovementDate: 'Just now',
        documentIds: [],
        state: newProj.state || 'Maharashtra',
        district: newProj.district || 'Nashik',
        totalParcels: newProj.totalParcels || 0,
        completedParcels: 0,
        totalArea: newProj.totalArea || 0.0,
        documentationCompleteness: newProj.documentationCompleteness || 100.0,
        legalDispute: newProj.legalDispute || false,
        ownershipConflict: newProj.ownershipConflict || false,
        compensationPendingDays: newProj.compensationPendingDays || 0,
        rrStatus: newProj.rrStatus || 'NOT_APPLICABLE',
        interDeptDependency: newProj.interDeptDependency || false,
        delayProbability: 0.25,
        predictedDelayDays: 0,
        mlRiskLevel: 'LOW',
        modelVersion: 'land-delay-rf-v1',
      };

      casesStore.unshift(created);
      return created;
    },

    async updateProject(projectId: string, updates: Partial<Case>): Promise<Case> {
      await delay(200);
      const idx = casesStore.findIndex((c) => c.id === projectId || c.fileNumber === projectId);
      if (idx === -1) throw new Error(`Project ${projectId} not found`);
      casesStore[idx] = { ...casesStore[idx], ...updates, updatedAt: new Date().toISOString().split('T')[0] };
      return casesStore[idx];
    },

    async getPrediction(projectId: string): Promise<any> {
      await delay(250);
      const proj = casesStore.find((c) => c.id === projectId || c.fileNumber === projectId) || casesStore[0];
      const prob = proj.delayProbability ?? 0.82;
      return {
        project_id: projectId,
        project_code: proj.projectCode || proj.fileNumber || projectId,
        project_name: proj.title,
        district: proj.district || 'Nashik',
        current_stage: proj.currentStage,
        delay_probability: prob,
        risk_level: prob >= 0.80 ? 'CRITICAL' : prob >= 0.60 ? 'HIGH' : prob >= 0.30 ? 'MEDIUM' : 'LOW',
        predicted_delay_days: proj.predictedDelayDays ?? 23,
        model_version: 'land-delay-rf-v1',
        model_available: true,
        top_factors: proj.topFactors || [
          { factor: 'compensation_pending_days', label: 'Compensation Pending', value: proj.compensationPendingDays || 19, importance: 0.3664 },
          { factor: 'ownership_conflict', label: 'Ownership Conflict Active', value: proj.ownershipConflict || true, importance: 0.2205 },
          { factor: 'documentation_completeness', label: 'Documentation Completeness', value: proj.documentationCompleteness || 62.0, importance: 0.1188 },
        ],
        model_metrics: {
          accuracy: 0.9458,
          precision: 0.9358,
          recall: 0.9444,
          f1: 0.9401,
          roc_auc: 0.9934,
        },
        disclaimer: 'Calculated using trained RandomForest model on synthetic LARR dataset.',
      };
    },

    async getBottlenecks(projectId: string): Promise<any> {
      await delay(200);
      const proj = casesStore.find((c) => c.id === projectId || c.fileNumber === projectId) || casesStore[0];
      const isBottleneck = (proj.riskLevel === 'HIGH' || proj.riskLevel === 'CRITICAL');
      return {
        project_id: projectId,
        current_stage: proj.currentStage,
        stage_dwell_days: 31,
        stage_expected_days: 15,
        stage_delay_days: 16,
        is_bottleneck: isBottleneck,
        severity: proj.riskLevel === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
        bottleneck: isBottleneck ? {
          stage: proj.currentStage,
          expected_days: 15,
          actual_days: 31,
          delay_days: 16,
          severity: 'HIGH',
          root_cause: `File has been stalled at '${proj.currentStage}' for 31 days with active title/compensation queries.`,
          responsible_officer: proj.assignedOfficer,
        } : null,
      };
    },

    async getDelayFactors(projectId: string): Promise<any> {
      await delay(200);
      const proj = casesStore.find((c) => c.id === projectId || c.fileNumber === projectId) || casesStore[0];
      return {
        project_id: projectId,
        delay_probability: proj.delayProbability ?? 0.82,
        risk_level: proj.riskLevel ?? 'HIGH',
        observed_factors: [
          { factor: 'compensation_pending', name: 'Compensation Pending', observed_value: `${proj.compensationPendingDays || 19} days`, status: 'HIGH', description: 'Compensation processing awaiting sanction.' },
          { factor: 'ownership_conflict', name: 'Ownership Conflict', observed_value: proj.ownershipConflict ? 'Active Dispute' : 'Resolved', status: proj.ownershipConflict ? 'CRITICAL' : 'LOW', description: 'Dispute over survey boundaries and title.' },
          { factor: 'documentation_completeness', name: 'Documentation Completeness', observed_value: `${proj.documentationCompleteness || 62}%`, status: (proj.documentationCompleteness || 62) < 70 ? 'HIGH' : 'LOW', description: 'Required RoR and cadastral sheets indexed.' },
        ],
        model_feature_importance: [
          { feature: 'compensation_pending_days', importance: 0.3664 },
          { feature: 'ownership_conflict', importance: 0.2205 },
          { feature: 'documentation_completeness', importance: 0.1188 },
          { feature: 'legal_dispute', importance: 0.1140 },
        ],
      };
    },

    async getRecommendations(projectId: string): Promise<any> {
      await delay(200);
      const proj = casesStore.find((c) => c.id === projectId || c.fileNumber === projectId) || casesStore[0];
      return {
        project_id: projectId,
        priority: proj.priority || 'URGENT',
        primary_recommendation: 'Escalate compensation disbursement to Special Land Acquisition Officer (SLAO) and convene title verification summary inquiry.',
        recommended_actions: [
          { factor: 'Compensation Pending', reason: `Compensation disbursement pending for ${proj.compensationPendingDays || 19} days.`, action: 'Escalate compensation disbursement to SLAO / District Collector.', urgency: 'HIGH' },
          { factor: 'Ownership Conflict', reason: 'Disputed title / contested ownership on parcel.', action: 'Initiate Special Revenue Court summary inquiry with Sub-Divisional Magistrate.', urgency: 'HIGH' },
          { factor: 'Documentation Completeness', reason: `Documentation completeness at ${proj.documentationCompleteness || 62}%.`, action: 'Request missing cadastral and RoR extracts from Land Revenue office.', urgency: 'MEDIUM' },
        ],
      };
    },

    async getTimeline(projectId: string): Promise<any> {
      await delay(200);
      const proj = casesStore.find((c) => c.id === projectId || c.fileNumber === projectId) || casesStore[0];
      const stages = [
        { stage_index: 0, stage_name: 'Project Initiation', status: 'COMPLETED', expected_days: 15, actual_days: 12, delay_days: 0, is_delayed: false, is_current: false },
        { stage_index: 1, stage_name: 'Land Identification', status: 'COMPLETED', expected_days: 30, actual_days: 28, delay_days: 0, is_delayed: false, is_current: false },
        { stage_index: 2, stage_name: 'Preliminary Notification', status: 'COMPLETED', expected_days: 30, actual_days: 30, delay_days: 0, is_delayed: false, is_current: false },
        { stage_index: 3, stage_name: 'Survey and Verification', status: 'COMPLETED', expected_days: 45, actual_days: 44, delay_days: 0, is_delayed: false, is_current: false },
        { stage_index: 4, stage_name: 'Ownership Verification', status: 'COMPLETED', expected_days: 30, actual_days: 46, delay_days: 16, is_delayed: true, is_current: false },
        { stage_index: 5, stage_name: 'Objection and Legal Review', status: 'COMPLETED', expected_days: 60, actual_days: 58, delay_days: 0, is_delayed: false, is_current: false },
        { stage_index: 6, stage_name: 'Compensation Assessment', status: 'COMPLETED', expected_days: 60, actual_days: 62, delay_days: 2, is_delayed: true, is_current: false },
        { stage_index: 7, stage_name: 'Compensation Disbursement', status: 'IN_PROGRESS', expected_days: 90, actual_days: 104, delay_days: 14, is_delayed: true, is_current: true },
        { stage_index: 8, stage_name: 'R&R and Rehabilitation', status: 'UPCOMING', expected_days: 120, actual_days: 0, delay_days: 0, is_delayed: false, is_current: false },
        { stage_index: 9, stage_name: 'Final Acquisition', status: 'UPCOMING', expected_days: 30, actual_days: 0, delay_days: 0, is_delayed: false, is_current: false },
        { stage_index: 10, stage_name: 'Possession and Handover', status: 'UPCOMING', expected_days: 30, actual_days: 0, delay_days: 0, is_delayed: false, is_current: false },
      ];
      return {
        project_id: projectId,
        current_stage: proj.currentStage,
        total_stages: 11,
        stages,
      };
    },

    async uploadProjectDocument(projectId: string, file: File, documentType: string = 'Land Document'): Promise<any> {
      await delay(500);
      const docId = `doc-${Date.now()}`;
      const newDoc: DocumentRecord = {
        id: docId,
        caseId: projectId,
        title: file.name.replace(/\.[^/.]+$/, ''),
        documentType: (documentType as any) || 'Land Document',
        fileName: file.name,
        fileUrl: '#',
        uploadDate: new Date().toISOString(),
        uploadedBy: 'Rajeshwar V. Verma, IAS',
        status: 'READY',
        ocrStatus: 'COMPLETED',
        metadata: {
          fileSize: `${(file.size / 1024).toFixed(1)} KB`,
          fileType: file.type,
          mimeType: file.type,
          pageCount: 2,
        },
        ocrResult: {
          documentId: docId,
          extractedText: `Government of Maharashtra. Land Acquisition Notification. Survey No. 142/3A, Village Sinnar, District Nashik. Compensation amount: INR 45,00,000. Ownership dispute noted on record.`,
          confidenceScore: 0.94,
          ocrEngine: 'PyMuPDF-digital',
          status: 'READY',
          processingTimeMs: 420,
          extractedFields: [
            { key: 'project_id', label: 'Project ID', value: 'LA-1024', confidence: 0.95, isExtracted: true },
            { key: 'survey_number', label: 'Survey Number', value: '142/3A', confidence: 0.92, isExtracted: true },
            { key: 'district', label: 'District', value: 'Nashik', confidence: 0.96, isExtracted: true },
            { key: 'ownership_conflict', label: 'Ownership Conflict', value: 'true', confidence: 0.88, isExtracted: true },
            { key: 'compensation_status', label: 'Compensation Status', value: 'PENDING', confidence: 0.89, isExtracted: true },
          ],
        },
      };
      documentsStore.unshift(newDoc);
      return {
        document: newDoc,
        ocrResult: newDoc.ocrResult,
        projectUpdated: true,
        appliedUpdates: { ownership_conflict: true, compensation_status: 'PENDING' },
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

  // ----------------------------------------------------
  // PROCUREMENT COMPLIANCE (SIH26100)
  // ----------------------------------------------------
  procurement: {
    async getDashboard(): Promise<any> {
      await delay(150);
      return {
        active_tenders: 4,
        bids_under_verification: 3,
        completed_assessments: 12,
        high_risk_bidders: 1,
        pending_documents: 2,
        verification_exceptions: 5,
      };
    },
    async getTenders(): Promise<any[]> {
      await delay(150);
      return [
        {
          id: 'TEN-2026-001',
          tender_number: 'GEM/2026/B/418207',
          title: 'Supply and Installation of Network Infrastructure for Government Administrative Offices',
          department: 'Department of Administrative Reforms',
          status: 'ACTIVE',
          category: 'Network Infrastructure',
          estimated_value: 45000000.0,
        },
        {
          id: 'TEN-2026-002',
          tender_number: 'GEM/2026/B/519302',
          title: 'Procurement of Enterprise Cloud Storage and High-Availability Backup Subsystems',
          department: 'Department of Information Technology',
          status: 'ACTIVE',
          category: 'Cloud Infrastructure',
          estimated_value: 25000000.0,
        },
        {
          id: 'TEN-2026-003',
          tender_number: 'GEM/2026/B/621415',
          title: 'Supply of Edge Routing Hardware and Structured Switching Systems',
          department: 'Department of Information Technology',
          status: 'ACTIVE',
          category: 'IT & Telecommunications',
          estimated_value: 32000000.0,
        },
        {
          id: 'TEN-2026-004',
          tender_number: 'GEM/2026/B/732528',
          title: 'Turnkey EPC Contract for 50MW Solar Photovoltaic Power Plant Expansion',
          department: 'Ministry of New and Renewable Energy',
          status: 'ACTIVE',
          category: 'Renewable Energy',
          estimated_value: 350000000.0,
        },
        {
          id: 'TEN-2026-005',
          tender_number: 'GEM/2026/B/843639',
          title: 'Statewide Network Operation Center (NOC) Annual Operation & Maintenance',
          department: 'Department of Information Technology',
          status: 'ACTIVE',
          category: 'IT & Telecommunications',
          estimated_value: 50000000.0,
        },
        {
          id: 'TEN-2026-006',
          tender_number: 'GEM/2026/B/954741',
          title: 'Comprehensive Smart City Command & Control Software Modernization',
          department: 'Ministry of Housing and Urban Affairs',
          status: 'ACTIVE',
          category: 'Software Solutions',
          estimated_value: 60000000.0,
        },
        {
          id: 'TEN-2026-007',
          tender_number: 'GEM/2026/B/965852',
          title: 'Design, Deployment & Unified Management of High-Security Cyber Defense Operations',
          department: 'Department of Information Technology',
          status: 'ACTIVE',
          category: 'IT & Telecommunications',
          estimated_value: 80000000.0,
        },
        {
          id: 'TEN-2026-008',
          tender_number: 'GEM/2026/B/976963',
          title: 'Supply of Certified Precision Survey and GIS Photogrammetry Equipment',
          department: 'Survey of India',
          status: 'ACTIVE',
          category: 'Geospatial & Survey',
          estimated_value: 18000000.0,
        },
      ];
    },
    async getTender(id: string): Promise<any> {
      await delay(100);
      const tenders = await this.getTenders();
      return tenders.find((t: any) => t.id === id) || {
        id,
        tender_number: 'GEM/2026/B/418207',
        title: 'Supply and Installation of Network Infrastructure for Government Administrative Offices',
        department: 'Department of Administrative Reforms',
      };
    },
    async createTender(tender: any): Promise<any> {
      await delay(200);
      return { id: `TEN-${Date.now()}`, ...tender, tender_number: `GEM/2026/B/${Math.floor(100000 + Math.random() * 900000)}` };
    },
    async getBidders(tenderId: string): Promise<any[]> {
      await delay(150);
      if (tenderId === 'TEN-2026-006') {
        return [
          { id: 'BID-115', legal_name: 'Shivalik Cloud Matrix Pvt. Ltd.', name: 'Shivalik Cloud Matrix Pvt. Ltd.', score: 85, risk: 'HIGH', status: 'Under Review', documents: 2, exceptions: 1 },
          { id: 'BID-116', legal_name: 'Shivalik Enterprise Systems LLP', name: 'Shivalik Enterprise Systems LLP', score: 82, risk: 'HIGH', status: 'Under Review', documents: 2, exceptions: 1 },
          { id: 'BID-117', legal_name: 'Tapti Solutions & Analytics Pvt. Ltd.', name: 'Tapti Solutions & Analytics Pvt. Ltd.', score: 90, risk: 'LOW', status: 'Under Review', documents: 2, exceptions: 0 },
        ];
      }
      if (tenderId === 'TEN-2026-007') {
        return [
          { id: 'BID-118', legal_name: 'Shivalik Cloud Matrix Pvt. Ltd.', name: 'Shivalik Cloud Matrix Pvt. Ltd.', score: 85, risk: 'HIGH', status: 'Under Review', documents: 2, exceptions: 1 },
          { id: 'BID-119', legal_name: 'Shivalik Enterprise Systems LLP', name: 'Shivalik Enterprise Systems LLP', score: 82, risk: 'HIGH', status: 'Under Review', documents: 2, exceptions: 1 },
          { id: 'BID-120', legal_name: 'Kaveri Digital Solutions Ltd.', name: 'Kaveri Digital Solutions Ltd.', score: 92, risk: 'LOW', status: 'Under Review', documents: 2, exceptions: 0 },
        ];
      }
      return [
        { id: 'BID-001', legal_name: 'Triveni Infotech Solutions Pvt. Ltd.', name: 'Triveni Infotech Solutions Pvt. Ltd.', score: 87, risk: 'LOW', status: 'Under Review', documents: 7, exceptions: 1 },
        { id: 'BID-002', legal_name: 'Nilgiri Hardware & Telecom Pvt. Ltd.', name: 'Nilgiri Hardware & Telecom Pvt. Ltd.', score: 85, risk: 'LOW', status: 'Under Review', documents: 5, exceptions: 0 },
        { id: 'BID-003', legal_name: 'Mahanadi Security & Surveillance Pvt. Ltd.', name: 'Mahanadi Security & Surveillance Pvt. Ltd.', score: 88, risk: 'LOW', status: 'Under Review', documents: 4, exceptions: 0 },
      ];
    },
    async addBidder(tenderId: string, bidder: any): Promise<any> {
      await delay(200);
      return { id: `BID-${Date.now()}`, tenderId, name: bidder.legal_name, score: 0, risk: 'MEDIUM', status: 'Pending Documents', documents: 0, exceptions: 0 };
    },
    async getBidder(id: string): Promise<any> {
      await delay(100);
      return { id, name: id === 'BID-002' ? 'Nilgiri Hardware & Telecom Pvt. Ltd.' : 'Triveni Infotech Solutions Pvt. Ltd.' };
    },
    async verifyBidder(bidderId: string): Promise<any> {
      await delay(300);
      return { status: 'COMPLETED', bidderId };
    },
    async getCompliance(bidderId: string): Promise<any> {
      await delay(200);
      return { bidder_id: bidderId, compliance_score: 87, risk_level: 'LOW' };
    },
    async recordDecision(bidderId: string, decision: string, note?: string): Promise<any> {
      await delay(200);
      return { bidder_id: bidderId, status: decision, note, timestamp: new Date().toISOString() };
    },
    async getAuditTrail(): Promise<any[]> {
      await delay(150);
      return [];
    },
    async getDocuments(): Promise<any[]> {
      await delay(100);
      return [];
    },
    async getDocumentEvidence(documentId: string): Promise<any> {
      await delay(100);
      return { id: documentId, extracted_fields: [], extracted_text: '' };
    },
    async reviewRequirement(bidderId: string, requirementId: string, status: string): Promise<any> {
      await delay(100);
      return { bidder_id: bidderId, requirement_id: requirementId, status };
    },
    async uploadBidderDocument(bidderId: string, file: File, documentType: string = 'auto'): Promise<any> {
      await delay(400);
      return {
        doc_record: {
          id: `DOC-${bidderId}-${Date.now()}`,
          file_name: file.name,
          document_type: documentType === 'auto' ? 'GST Registration Certificate' : documentType,
          ocr_status: 'COMPLETED',
          extracted_fields: [
            { key: 'fileName', label: 'Document Name', value: file.name, confidence: 1.0 },
            { key: 'docType', label: 'Document Type', value: documentType, confidence: 0.95 }
          ],
          confidence: 0.95,
          engine: 'PyMuPDF + Regex Parser',
          created_at: new Date().toISOString(),
        },
        extracted_fields: [
          { key: 'fileName', label: 'Document Name', value: file.name, confidence: 1.0 },
          { key: 'docType', label: 'Document Type', value: documentType, confidence: 0.95 }
        ],
        assessment: {
          compliance_score: 85,
          risk_level: 'LOW',
          discrepancies: [],
          missing_documents: []
        },
        bidder: {
          id: bidderId,
          compliance_score: 85,
          risk_level: 'LOW',
          status: 'Under Review',
          documents_count: 1,
          exceptions_count: 0
        }
      };
    },
    async getTenderIntegrity(tenderId: string): Promise<any> {
      await delay(200);
      if (tenderId === 'TEN-2026-006' || tenderId === 'TEN-2026-007') {
        return {
          tender_id: tenderId,
          overall_risk_score: tenderId === 'TEN-2026-007' ? 70.0 : 35.0,
          risk_level: tenderId === 'TEN-2026-007' ? 'HIGH' : 'MEDIUM',
          confidence_score: 0.95,
          findings_count: tenderId === 'TEN-2026-007' ? 3 : 1,
          contributing_signals: ['RELATED_BIDDER', 'BID_PRICE_ANOMALY'],
          assessed_at: new Date().toISOString(),
          summary: `Integrity evaluation identified review signals for tender '${tenderId}'. Composite risk is categorized as elevated.`,
          findings: [
            {
              id: 'INT-REL-01',
              tender_id: tenderId,
              related_bidder_ids: ['BID-115', 'BID-116'],
              signal_type: 'RELATED_BIDDER',
              severity: 'HIGH',
              score_impact: 35.0,
              confidence: 0.98,
              title: 'Common Entity Linkage: Shivalik Cloud Matrix Pvt. Ltd. & Shivalik Enterprise Systems LLP',
              reason: "Entities 'Shivalik Cloud Matrix Pvt. Ltd.' and 'Shivalik Enterprise Systems LLP' share statutory identifiers (PAN: AABCS7007S, GSTIN: 05AABCS7007S1Z5) and registered address.",
              evidence: [
                { source_type: 'CORPORATE_REGISTRY', field: 'pan', value: 'AABCS7007S', description: 'Identical Permanent Account Number (PAN: AABCS7007S) submitted by both entities.' },
                { source_type: 'CORPORATE_REGISTRY', field: 'gstin', value: '05AABCS7007S1Z5', description: 'Identical GSTIN submitted by both entities.' },
                { source_type: 'BID_SUBMISSION', field: 'registered_address', value: 'Suite 201, IT Park Sahastradhara Road, Dehradun 248013', description: 'Identical registered office address submitted by both entities.' }
              ],
              recommended_action: 'Request clarification from bidders regarding corporate relationship under GFR Rule 144.',
              status: 'OPEN',
              detected_at: new Date().toISOString(),
            },
          ],
        };
      }
      return {
        tender_id: tenderId,
        overall_risk_score: 0.0,
        risk_level: 'LOW',
        confidence_score: 0.95,
        findings_count: 0,
        contributing_signals: [],
        assessed_at: new Date().toISOString(),
        summary: `Integrity evaluation for tender '${tenderId}' completed. No anomalous bid patterns detected. Overall status: LOW RISK (0/100).`,
        findings: [],
      };
    },
    async getBidderIntegrity(bidderId: string): Promise<any> {
      await delay(150);
      return {
        bidder_id: bidderId,
        overall_risk_score: 0.0,
        risk_level: 'LOW',
        confidence_score: 0.90,
        findings_count: 0,
        contributing_signals: [],
        assessed_at: new Date().toISOString(),
        summary: `No anomalous integrity signals identified for bidder '${bidderId}'. Status: LOW RISK (0/100).`,
        findings: [],
      };
    },
  },
};
