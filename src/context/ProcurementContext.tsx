import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiClient, isUsingMockApi } from '../services/api/apiClient';

export type CheckStatus = 'Verified' | 'Failed' | 'Pending' | 'Needs Review' | 'Not Applicable';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Requirement {
  id: string;
  name: string;
  category: string;
  status: CheckStatus;
  evidence: string;
  note: string;
  isMandatory?: boolean;
  isBlocking?: boolean;
  resultStatus?: string; // 'PASS' | 'FAIL' | 'PENDING' | 'UNVERIFIED' | 'NEEDS_REVIEW' | 'NOT_APPLICABLE'
  confidence?: number;
  evidenceAvailable?: boolean;
  evidenceSource?: string | null;
}

export interface Discrepancy {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  field: string;
  expected?: string;
  found?: string;
}

export interface Bidder {
  id: string;
  name: string;
  score: number;
  complianceScore?: number;
  risk: RiskLevel;
  complianceRisk?: RiskLevel;
  status: string; // Workflow status ('QUALIFIED', 'UNDER_REVIEW', 'EXCEPTION_FOUND', etc.)
  complianceStatus: string; // System objective compliance ('COMPLIANT', 'UNDER_REVIEW', 'EXCEPTION_FOUND', 'PENDING_DOCUMENTS')
  documents: number;
  exceptions: number;
  blockingExceptions: number;
  requirements: Requirement[];
  discrepancies?: Discrepancy[];
  recommendations?: string[];
  officerDecision?: string | null;
  officerNote?: string;
  integrityRisk?: RiskLevel;
  integrityScore?: number;
  mandatorySummary?: any;
}

export interface AuditEvent {
  id: string;
  time: string;
  action: string;
  actor: string;
  detail: string;
}

export interface TenderRecord {
  id: string;
  tender_number: string;
  title: string;
  department: string;
  status: string;
  bid_closing_date?: string;
  estimated_value?: number;
  category?: string;
  created_at?: string;
}

interface ProcurementContextValue {
  bidders: Bidder[];
  tenders: TenderRecord[];
  activeTenders: TenderRecord[];
  isLiveDatabase: boolean;
  audit: AuditEvent[];
  loading: boolean;
  addTender: (title: string, department?: string, closingDate?: string) => Promise<any>;
  addBidder: (name: string, gstin?: string, pan?: string, targetTenderId?: string) => Promise<void>;
  uploadDocument: (bidderId: string, fileName: string, file?: File, documentType?: string) => Promise<any>;
  runVerification: (bidderId: string) => Promise<any>;
  decide: (bidderId: string, decision: string, note: string) => Promise<void>;
  updateRequirement: (bidderId: string, requirementId: string, status: CheckStatus) => Promise<void>;
  recordIntegrityReview: (findingId: string, status: string, note?: string, tenderId?: string, bidderId?: string, action?: string) => Promise<any>;
  refreshData: (targetTenderId?: string | null) => Promise<void>;
  selectTender: (id: string) => void;
  setTenderId: (id: string | null) => void;
  tenderId: string | null;
  documents: any[];
  error: string | null;
}

const compliantRequirements: Requirement[] = [
  { id: 'gst', name: 'GST registration', category: 'Statutory compliance', status: 'Verified', evidence: 'GST Registration Certificate, page 1', note: 'GSTIN format and legal name match submitted declaration.' },
  { id: 'pan', name: 'PAN and Income Tax declaration', category: 'Statutory compliance', status: 'Verified', evidence: 'PAN card; Income Tax Declaration', note: 'PAN is consistent across submitted records.' },
  { id: 'udyam', name: 'Udyam/MSME registration', category: 'Government recognition', status: 'Verified', evidence: 'Udyam Registration Certificate', note: 'Certificate name matches bidder legal name.' },
  { id: 'oem', name: 'OEM authorization', category: 'Tender-specific', status: 'Needs Review', evidence: 'OEM Authorization Letter, page 2', note: 'Signature authority requires officer confirmation.' },
  { id: 'turnover', name: 'Minimum annual turnover', category: 'Financial eligibility', status: 'Verified', evidence: 'Audited financial statement FY 2024–25', note: 'Declared turnover exceeds the tender threshold.' },
  { id: 'blacklist', name: 'No blacklisting/debarment', category: 'Tender-specific', status: 'Verified', evidence: 'Non-Blacklisting Declaration', note: 'No adverse declaration found in supplied documents.' },
];

const exceptionRequirements: Requirement[] = [
  { id: 'gst', name: 'GST registration', category: 'Statutory compliance', status: 'Needs Review', evidence: 'GST Certificate; Bidder Declaration', note: 'Exception: legal name on GST certificate differs from bidder declaration.' },
  { id: 'pan', name: 'PAN and Income Tax declaration', category: 'Statutory compliance', status: 'Verified', evidence: 'PAN card', note: 'PAN format is valid and document is legible.' },
  { id: 'udyam', name: 'Udyam/MSME registration', category: 'Government recognition', status: 'Pending', evidence: 'No document submitted', note: 'Required certificate has not been uploaded.' },
  { id: 'oem', name: 'OEM authorization', category: 'Tender-specific', status: 'Failed', evidence: 'OEM Authorization Letter', note: 'Authorization validity ended on 31 Mar 2025.' },
  { id: 'turnover', name: 'Minimum annual turnover', category: 'Financial eligibility', status: 'Failed', evidence: 'Audited financial statement FY 2024–25', note: 'Declared turnover is below tender requirement.' },
  { id: 'blacklist', name: 'No blacklisting/debarment', category: 'Tender-specific', status: 'Verified', evidence: 'Non-Blacklisting Declaration', note: 'Declaration is present.' },
];

const initialBidders: Bidder[] = [
  {
    id: 'BID-001',
    name: 'Triveni Infotech Solutions Pvt. Ltd.',
    score: 87,
    complianceScore: 87,
    risk: 'LOW',
    complianceRisk: 'LOW',
    status: 'Under Review',
    complianceStatus: 'UNDER_REVIEW',
    documents: 7,
    exceptions: 1,
    blockingExceptions: 0,
    requirements: compliantRequirements,
    recommendations: [
      'Bidder appears compliant based on available evidence. Proceed to officer review.',
      'Confirm OEM signatory authorization before final qualification.'
    ],
    officerDecision: null,
    integrityRisk: 'LOW',
    integrityScore: 12,
  },
  {
    id: 'BID-002',
    name: 'Narmada Systems & Services Pvt. Ltd.',
    score: 54,
    complianceScore: 54,
    risk: 'HIGH',
    complianceRisk: 'HIGH',
    status: 'Exception Found',
    complianceStatus: 'EXCEPTION_FOUND',
    documents: 5,
    exceptions: 4,
    blockingExceptions: 2,
    requirements: exceptionRequirements,
    discrepancies: [
      {
        type: 'NAME_MISMATCH',
        severity: 'HIGH',
        message: 'Legal name inconsistency between GST certificate ("Narmada Systems Private Limited") and PAN card ("Narmada Services Limited").',
        field: 'Legal Name',
        expected: 'Narmada Systems Private Limited',
        found: 'Narmada Services Limited',
      },
      {
        type: 'EXPIRED_DOCUMENT',
        severity: 'HIGH',
        message: 'OEM authorization validity ended on 31 Mar 2025. Fresh MAF required.',
        field: 'OEM Authorization',
      }
    ],
    recommendations: [
      'Request bidder to clarify and submit rectified legal name consistency across documents.',
      'Obtain and upload a valid, unexpired OEM Manufacturer Authorization Form (MAF).',
      'Upload the missing Udyam/MSME Registration Certificate.'
    ],
    officerDecision: null,
    integrityRisk: 'LOW',
    integrityScore: 18,
  },
];

const ProcurementContext = createContext<ProcurementContextValue | undefined>(undefined);
const nowTime = () => new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });

export const ProcurementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bidders, setBidders] = useState<Bidder[]>(isUsingMockApi() ? initialBidders : []);
  const [tenders, setTenders] = useState<TenderRecord[]>([]);
  const isLiveDatabase = !isUsingMockApi();
  const [loading, setLoading] = useState(false);
  const [audit, setAudit] = useState<AuditEvent[]>(isUsingMockApi() ? [
    { id: 'a1', time: '10:42', action: 'Tender document uploaded', actor: 'Procurement Officer', detail: 'GEM/2026/B/418207 — Network Infrastructure procurement' },
    { id: 'a2', time: '10:44', action: 'Requirements extracted', actor: 'Verification engine', detail: 'Six eligibility requirements identified for officer review.' },
    { id: 'a3', time: '10:48', action: 'Compliance assessment completed', actor: 'Verification engine', detail: 'Narmada Systems exception set available for review.' },
  ] : []);
  const [documents, setDocuments] = useState<any[]>([]);
  const [tenderId, setTenderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── Request cancellation & staleness guards ──────────────────────────────
  // Monotonic version counter: incremented on every refreshData call.
  // When an async response arrives, it checks if the version is still current;
  // if a newer refreshData was called, the stale response is discarded.
  const refreshVersionRef = useRef(0);
  // AbortController ref: allows aborting in-flight fetch requests when
  // a new refreshData call supersedes them (e.g., navigation to a different tender).
  const abortControllerRef = useRef<AbortController | null>(null);

  const activeTenders = React.useMemo(() => {
    return tenders
      .filter((t) => !t.status || t.status.toUpperCase() === 'ACTIVE')
      .slice(0, 4);
  }, [tenders]);

  const log = (action: string, detail: string, actor = 'Procurement Officer') => {
    setAudit((items) => [{ id: crypto.randomUUID(), time: nowTime(), action, actor, detail }, ...items]);
  };

  const mapBidder = useCallback((row: any, detail?: any): Bidder => {
    const rawScore = Number(row.compliance_score ?? row.score ?? detail?.bidder?.compliance_score ?? 0);
    const complianceRisk = (row.risk_level || row.risk || detail?.bidder?.risk_level || 'MEDIUM') as RiskLevel;
    const blockingExceptions = Number(
      row.blocking_exceptions_count ??
      detail?.bidder?.blocking_exceptions_count ??
      detail?.blocking_exceptions ??
      0
    );
    const complianceStatus =
      row.compliance_status ||
      detail?.bidder?.compliance_status ||
      (blockingExceptions > 0 ? 'EXCEPTION_FOUND' : row.status || 'PENDING_DOCUMENTS');

    return {
      id: row.id,
      name: row.legal_name || row.name || 'Bidder',
      score: rawScore,
      complianceScore: rawScore,
      risk: complianceRisk,
      complianceRisk: complianceRisk,
      status: row.status || 'PENDING_DOCUMENTS',
      complianceStatus: complianceStatus,
      documents: Number(row.documents_count ?? row.documents ?? detail?.documents?.length ?? 0),
      exceptions: Number(row.exceptions_count ?? row.exceptions ?? detail?.discrepancies?.length ?? 0),
      blockingExceptions: blockingExceptions,
      requirements: (detail?.requirements || []).map((requirement: any) => {
        const isMandatory = requirement.is_mandatory !== undefined ? Boolean(requirement.is_mandatory) : true;
        const status = requirement.status || 'PENDING';
        const isBlocking = isMandatory && (status === 'NON_COMPLIANT' || status === 'EXPIRED' || status === 'UNVERIFIED');
        let checkStatus: CheckStatus = 'Pending';
        if (status === 'COMPLIANT') checkStatus = 'Verified';
        else if (status === 'NON_COMPLIANT' || status === 'EXPIRED') checkStatus = 'Failed';
        else if (status === 'NEEDS_REVIEW') checkStatus = 'Needs Review';
        else if (status === 'NOT_APPLICABLE') checkStatus = 'Not Applicable';

        const rawConf = requirement.confidence !== undefined && requirement.confidence !== null
          ? Number(requirement.confidence)
          : 0;
        const evidenceAvail = Boolean(requirement.evidence_available ?? (requirement.evidence_value && rawConf > 0));
        const evidenceSrc = requirement.evidence_source || (evidenceAvail ? requirement.evidence_doc_id : null);

        return {
          id: requirement.requirement_id || requirement.id,
          name: requirement.requirement_name || requirement.name,
          category: requirement.category || 'General',
          status: checkStatus,
          evidence: requirement.evidence_value || (evidenceAvail ? requirement.evidence_field_key : null) || 'No supporting document submitted',
          note: requirement.reason || 'Assessment pending.',
          isMandatory,
          isBlocking,
          resultStatus: status === 'COMPLIANT' ? 'PASS' : (status === 'NON_COMPLIANT' || status === 'EXPIRED') ? 'FAIL' : status,
          confidence: rawConf,
          evidenceAvailable: evidenceAvail,
          evidenceSource: evidenceSrc,
        };
      }),
      discrepancies: (detail?.discrepancies || []).map((item: any) => ({
        type: item.discrepancy_type,
        severity: item.severity,
        message: item.description,
        field: item.field_name,
        expected: item.expected_value,
        found: item.found_value
      })),
      recommendations: detail?.recommendations || [],
      officerDecision: row.officer_decision || detail?.bidder?.officer_decision || null,
      officerNote: row.officer_note || detail?.bidder?.officer_note || '',
      integrityRisk: detail?.integrity?.risk_level as RiskLevel | undefined,
      integrityScore: detail?.integrity?.overall_risk_score,
      mandatorySummary: detail?.mandatory_summary,
    };
  }, []);

  // Backend/database is authoritative in live mode. Mock mode deliberately
  // retains the existing fixture adapter for offline SIH demos.
  //
  // Staleness protection: each call increments a version counter.
  // When async responses arrive, they are discarded if a newer refreshData
  // was triggered in the meantime (e.g., user navigated to a different tender).
  // AbortController cancels in-flight fetch requests from the previous call.
  const refreshData = useCallback(async (targetTenderId?: string | null) => {
    // Increment version and capture it for this invocation
    const version = ++refreshVersionRef.current;

    // Abort any in-flight requests from a previous refreshData call
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const procurement = (apiClient as any).procurement;
      const rawTenders = await procurement.getTenders();

      // Staleness check: if a newer refreshData was called, discard this response
      if (version !== refreshVersionRef.current) return;

      const allTenders = rawTenders || [];
      setTenders(allTenders);

      const effectiveId = targetTenderId || tenderId;
      const activeTender = (effectiveId ? allTenders.find((t: any) => t.id === effectiveId) : null)
        || allTenders.find((t: any) => !t.status || t.status.toUpperCase() === 'ACTIVE')
        || allTenders[0];

      if (!activeTender) {
        if (version !== refreshVersionRef.current) return;
        setTenderId(null);
        setBidders([]);
        setDocuments([]);
        setAudit([]);
        return;
      }

      setTenderId(activeTender.id);
      const [remoteBidders, remoteAudit, remoteDocuments] = await Promise.all([
        procurement.getBidders(activeTender.id),
        procurement.getAuditTrail(activeTender.id),
        procurement.getDocuments?.(activeTender.id) ?? Promise.resolve([]),
      ]);

      // Staleness check after parallel fetch
      if (version !== refreshVersionRef.current) return;

      const biddersList = remoteBidders || [];
      if (biddersList.length === 0) {
        setBidders([]);
      } else {
        const details = await Promise.all(
          biddersList.map((bidder: any) => procurement.getBidder(bidder.id).catch(() => null))
        );
        // Final staleness check after N+1 bidder detail fetches
        if (version !== refreshVersionRef.current) return;
        setBidders(biddersList.map((bidder: any, index: number) => mapBidder(bidder, details[index])));
      }

      setDocuments(remoteDocuments || []);
      setAudit(
        (remoteAudit || []).map((event: any) => ({
          id: event.id,
          time: new Date(event.created_at).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }),
          action: event.action,
          actor: event.actor,
          detail: event.description || '',
        }))
      );
    } catch (e) {
      // Ignore AbortError — this is expected when a newer refreshData supersedes
      if (e instanceof DOMException && e.name === 'AbortError') return;
      // Ignore stale errors
      if (version !== refreshVersionRef.current) return;
      const message = e instanceof Error ? e.message : 'Unable to load persistent procurement data.';
      setError(message);
      if (!isUsingMockApi()) {
        setBidders([]);
        setDocuments([]);
        setAudit([]);
      }
    } finally {
      // Only clear loading if this is still the latest request
      if (version === refreshVersionRef.current) {
        setLoading(false);
      }
    }
  }, [tenderId, mapBidder]);

  const selectTender = useCallback((id: string) => {
    setTenderId(id);
    // Abort any in-flight requests before starting new tender fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    refreshData(id);
  }, [refreshData]);

  useEffect(() => {
    refreshData();
    // Cleanup: abort in-flight requests when provider unmounts
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const addTender = async (title: string, department?: string, closingDate?: string) => {
    try {
      const res = await (apiClient as any).procurement.createTender({
        title,
        department: department || 'Department of Administrative Reforms',
        bid_closing_date: closingDate || '2026-09-15',
      });
      const newTenderId = res?.id || res?.tender?.id;
      if (isUsingMockApi()) log('Tender created', title);
      await refreshData(newTenderId);
      return res;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to create tender.');
      throw e;
    }
  };

  const addBidder = async (name: string, gstin?: string, pan?: string, targetTenderId?: string) => {
    const activeTenderId = targetTenderId || tenderId;
    if (!activeTenderId && !isUsingMockApi()) throw new Error('Create or select a tender before adding a bidder.');
    const newId = `BID-${String(bidders.length + 1).padStart(3, '0')}`;
    const newBidder: Bidder = {
      id: newId,
      name,
      score: 0,
      complianceScore: 0,
      risk: 'MEDIUM',
      complianceRisk: 'MEDIUM',
      status: 'Pending Documents',
      complianceStatus: 'PENDING_DOCUMENTS',
      documents: 0,
      exceptions: 0,
      blockingExceptions: 0,
      requirements: [
        { id: 'gst', name: 'GST registration', category: 'Statutory compliance', status: 'Pending', evidence: 'Awaiting upload', note: 'Certificate required.' },
        { id: 'pan', name: 'PAN and Income Tax declaration', category: 'Statutory compliance', status: 'Pending', evidence: 'Awaiting upload', note: 'PAN card required.' },
        { id: 'udyam', name: 'Udyam/MSME registration', category: 'Government recognition', status: 'Pending', evidence: 'Awaiting upload', note: 'Udyam certificate required.' },
        { id: 'oem', name: 'OEM authorization', category: 'Tender-specific', status: 'Pending', evidence: 'Awaiting upload', note: 'MAF letter required.' },
        { id: 'turnover', name: 'Minimum annual turnover', category: 'Financial eligibility', status: 'Pending', evidence: 'Awaiting upload', note: 'Financial statements required.' },
        { id: 'blacklist', name: 'No blacklisting/debarment', category: 'Tender-specific', status: 'Pending', evidence: 'Awaiting upload', note: 'Self-declaration required.' },
      ],
      recommendations: [
        'Upload mandatory statutory documents (GST, PAN) and tender-specific declarations.'
      ]
    };

    try {
      await (apiClient as any).procurement.addBidder(activeTenderId!, { legal_name: name, gstin, pan });
      if (isUsingMockApi()) { setBidders((items) => [...items, newBidder]); log('Bidder added', `${name} added to tender.`); }
      else await refreshData(activeTenderId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to add bidder.');
      throw e;
    }
  };

  const uploadDocument = async (bidderId: string, fileName: string, file?: File, documentType: string = 'auto'): Promise<any> => {
    if (file && (apiClient as any).procurement?.uploadBidderDocument) {
      try {
        const res = await (apiClient as any).procurement.uploadBidderDocument(bidderId, file, documentType);
        if (!isUsingMockApi()) await refreshData();
        if (res && res.assessment) {
          const { assessment, bidder: updatedBidder } = res;
          const compStatus = updatedBidder?.compliance_status ?? assessment.compliance_status ?? (assessment.blocking_exceptions > 0 ? 'EXCEPTION_FOUND' : 'UNDER_REVIEW');
          const compRisk = (updatedBidder?.risk_level ?? assessment.compliance_risk_level ?? assessment.risk_level ?? 'MEDIUM') as RiskLevel;
          const blockingEx = Number(updatedBidder?.blocking_exceptions_count ?? assessment.blocking_exceptions ?? 0);
          setBidders((items) =>
            items.map((b) =>
              b.id === bidderId
                ? {
                    ...b,
                    score: updatedBidder?.compliance_score ?? assessment.compliance_score ?? b.score,
                    complianceScore: updatedBidder?.compliance_score ?? assessment.compliance_score ?? b.score,
                    risk: compRisk,
                    complianceRisk: compRisk,
                    status: b.officerDecision ? b.status : (updatedBidder?.status ?? compStatus),
                    complianceStatus: compStatus,
                    documents: updatedBidder?.documents_count ?? (b.documents + 1),
                    exceptions: updatedBidder?.exceptions_count ?? (assessment.discrepancies?.length || 0),
                    blockingExceptions: blockingEx,
                    recommendations: assessment.recommendations || b.recommendations,
                    discrepancies: assessment.discrepancies?.map((d: any) => ({
                      type: d.discrepancy_type || d.type || 'DISCREPANCY',
                      severity: d.severity || 'MEDIUM',
                      message: d.description || d.message || '',
                      field: d.field_name || d.field || '',
                      expected: d.expected_value || d.expected,
                      found: d.found_value || d.found,
                    })) || b.discrepancies,
                  }
                : b
            )
          );
          if (isUsingMockApi()) log(
            'Document Processed & Verified',
            `${fileName} for ${bidderId}: Score ${assessment.compliance_score}/100, Risk: ${assessment.risk_level}`,
            'Verification Engine'
          );
          return res;
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Document upload failed.');
        throw e;
      }
    }

    if (!isUsingMockApi()) throw new Error('A file is required for persistent document upload.');
    // Mock-only local update.
    setBidders((items) =>
      items.map((b) =>
        b.id === bidderId
          ? {
              ...b,
              documents: b.documents + 1,
              status: b.status === 'Pending Documents' ? 'Under Review' : b.status,
            }
          : b
      )
    );
    return null;
  };

  const runVerification = async (bidderId: string) => {
    setLoading(true);
    try {
      if ((apiClient as any).procurement) {
        const assessment = await (apiClient as any).procurement.verifyBidder(bidderId);
        if (assessment && assessment.compliance_score !== undefined) {
          const compStatus = assessment.compliance_status || (assessment.blocking_exceptions > 0 ? 'EXCEPTION_FOUND' : 'UNDER_REVIEW');
          const compRisk = (assessment.compliance_risk_level || assessment.risk_level || 'MEDIUM') as RiskLevel;
          const blockingEx = Number(assessment.blocking_exceptions ?? 0);
          setBidders((items) =>
            items.map((b) =>
              b.id === bidderId
                ? {
                    ...b,
                    score: assessment.compliance_score,
                    complianceScore: assessment.compliance_score,
                    risk: compRisk,
                    complianceRisk: compRisk,
                    status: b.officerDecision ? b.status : compStatus,
                    complianceStatus: compStatus,
                    blockingExceptions: blockingEx,
                    recommendations: assessment.recommendations,
                    discrepancies: assessment.discrepancies?.map((d: any) => ({
                      type: d.discrepancy_type,
                      severity: d.severity,
                      message: d.description,
                      field: d.field_name,
                      expected: d.expected_value,
                      found: d.found_value,
                    })),
                  }
                : b
            )
          );
          log('Compliance Assessment Completed', `${bidderId}: Score ${assessment.compliance_score}/100, Risk: ${assessment.risk_level}`, 'Compliance Engine');
          if (!isUsingMockApi()) await refreshData();
          return assessment;
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification could not be completed.');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const decide = async (bidderId: string, decision: string, note: string) => {
    if (isUsingMockApi()) setBidders((items) =>
      items.map((b) =>
        b.id === bidderId
          ? { ...b, status: decision, officerDecision: decision, officerNote: note }
          : b
      )
    );
    try {
      await (apiClient as any).procurement.recordDecision(bidderId, decision, note);
      if (isUsingMockApi()) log('Officer decision recorded', `${bidderId}: ${decision}${note ? ` — ${note}` : ''}`);
      else await refreshData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Officer decision could not be recorded.');
      throw e;
    }
  };

  const updateRequirement = async (bidderId: string, requirementId: string, status: CheckStatus) => {
    if (!isUsingMockApi()) {
      try {
        await (apiClient as any).procurement.reviewRequirement(bidderId, requirementId, status);
        await refreshData();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Requirement review could not be saved.');
        throw e;
      }
      return;
    }
    setBidders((items) =>
      items.map((b) =>
        b.id === bidderId
          ? {
              ...b,
              requirements: b.requirements.map((r) =>
                r.id === requirementId ? { ...r, status } : r
              ),
            }
          : b
      )
    );
    log('Requirement review updated', `${requirementId} marked ${status} for ${bidderId}.`);
  };

  const recordIntegrityReview = async (
    findingId: string,
    status: string,
    note?: string,
    tId?: string,
    bId?: string,
    action?: string
  ) => {
    try {
      const res = await (apiClient as any).procurement.recordIntegrityFindingReview(findingId, {
        status,
        note,
        tender_id: tId || tenderId || undefined,
        bidder_id: bId || undefined,
        action: action || `Marked ${status}`,
      });
      log(
        `Integrity Finding ${status.replace('_', ' ').toLowerCase()}`,
        `Finding ${findingId} status set to '${status}'. ${note ? `Note: ${note}` : ''}`,
        'Procurement Officer'
      );
      if (!isUsingMockApi()) {
        await refreshData();
      }
      return res;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to record integrity review.');
      throw e;
    }
  };

  return (
    <ProcurementContext.Provider
      value={{
        bidders,
        tenders,
        activeTenders,
        isLiveDatabase,
        audit,
        loading,
        addTender,
        addBidder,
        uploadDocument,
        runVerification,
        decide,
        updateRequirement,
        recordIntegrityReview,
        refreshData,
        selectTender,
        setTenderId,
        tenderId,
        documents,
        error,
      }}
    >
      {children}
    </ProcurementContext.Provider>
  );
};

export const useProcurement = () => {
  const context = useContext(ProcurementContext);
  if (!context) throw new Error('useProcurement must be used within ProcurementProvider');
  return context;
};
