import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../services/api/apiClient';

export type CheckStatus = 'Verified' | 'Failed' | 'Pending' | 'Needs Review' | 'Not Applicable';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Requirement {
  id: string;
  name: string;
  category: string;
  status: CheckStatus;
  evidence: string;
  note: string;
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
  risk: RiskLevel;
  status: string;
  documents: number;
  exceptions: number;
  requirements: Requirement[];
  discrepancies?: Discrepancy[];
  recommendations?: string[];
  officerDecision?: string;
  officerNote?: string;
}

export interface AuditEvent {
  id: string;
  time: string;
  action: string;
  actor: string;
  detail: string;
}

interface ProcurementContextValue {
  bidders: Bidder[];
  audit: AuditEvent[];
  loading: boolean;
  addTender: (title: string) => Promise<void>;
  addBidder: (name: string, gstin?: string, pan?: string) => Promise<void>;
  uploadDocument: (bidderId: string, fileName: string, file?: File, documentType?: string) => Promise<any>;
  runVerification: (bidderId: string) => Promise<any>;
  decide: (bidderId: string, decision: string, note: string) => Promise<void>;
  updateRequirement: (bidderId: string, requirementId: string, status: CheckStatus) => void;
  refreshData: () => Promise<void>;
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
    risk: 'LOW',
    status: 'Under Review',
    documents: 7,
    exceptions: 1,
    requirements: compliantRequirements,
    recommendations: [
      'Bidder appears compliant based on available evidence. Proceed to officer review.',
      'Confirm OEM signatory authorization before final qualification.'
    ],
  },
  {
    id: 'BID-002',
    name: 'Narmada Systems & Services Pvt. Ltd.',
    score: 54,
    risk: 'HIGH',
    status: 'Exception Found',
    documents: 5,
    exceptions: 4,
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
  },
];

const ProcurementContext = createContext<ProcurementContextValue | undefined>(undefined);
const nowTime = () => new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });

export const ProcurementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bidders, setBidders] = useState<Bidder[]>(initialBidders);
  const [loading, setLoading] = useState(false);
  const [audit, setAudit] = useState<AuditEvent[]>([
    { id: 'a1', time: '10:42', action: 'Tender document uploaded', actor: 'Procurement Officer', detail: 'GEM/2026/B/418207 — Network Infrastructure procurement' },
    { id: 'a2', time: '10:44', action: 'Requirements extracted', actor: 'Verification engine', detail: 'Six eligibility requirements identified for officer review.' },
    { id: 'a3', time: '10:48', action: 'Compliance assessment completed', actor: 'Verification engine', detail: 'Narmada Systems exception set available for review.' },
  ]);

  const log = (action: string, detail: string, actor = 'Procurement Officer') => {
    setAudit((items) => [{ id: crypto.randomUUID(), time: nowTime(), action, actor, detail }, ...items]);
  };

  // Sync with backend if reachable
  const refreshData = async () => {
    try {
      if ((apiClient as any).procurement) {
        const remoteBidders = await (apiClient as any).procurement.getBidders('TEN-2026-001');
        if (Array.isArray(remoteBidders) && remoteBidders.length > 0) {
          setBidders((prev) => {
            // merge with local state
            return remoteBidders.map((rb: any) => {
              const existing = prev.find((p) => p.id === rb.id);
              return {
                id: rb.id,
                name: rb.legal_name || rb.name || 'Bidder',
                score: rb.compliance_score ?? rb.score ?? 0,
                risk: rb.risk_level || rb.risk || 'MEDIUM',
                status: rb.status || 'Pending Documents',
                documents: rb.documents_count ?? rb.documents ?? 0,
                exceptions: rb.exceptions_count ?? rb.exceptions ?? 0,
                requirements: existing ? existing.requirements : compliantRequirements,
                discrepancies: existing?.discrepancies,
                recommendations: existing?.recommendations,
              };
            });
          });
        }
      }
    } catch (e) {
      console.warn('Procurement context backend sync note (operating normally with local state):', e);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const addTender = async (title: string) => {
    log('Tender created', title);
    try {
      if ((apiClient as any).procurement) {
        await (apiClient as any).procurement.createTender({ title });
      }
    } catch (e) {
      console.warn('Tender creation backend note:', e);
    }
  };

  const addBidder = async (name: string, gstin?: string, pan?: string) => {
    const newId = `BID-${String(bidders.length + 1).padStart(3, '0')}`;
    const newBidder: Bidder = {
      id: newId,
      name,
      score: 0,
      risk: 'MEDIUM',
      status: 'Pending Documents',
      documents: 0,
      exceptions: 0,
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

    setBidders((items) => [...items, newBidder]);
    log('Bidder added', `${name} added to GEM/2026/B/418207.`);

    try {
      if ((apiClient as any).procurement) {
        await (apiClient as any).procurement.addBidder('TEN-2026-001', { legal_name: name, gstin, pan });
      }
    } catch (e) {
      console.warn('Add bidder backend note:', e);
    }
  };

  const uploadDocument = async (bidderId: string, fileName: string, file?: File, documentType: string = 'auto'): Promise<any> => {
    log('Bidder document uploaded', `${fileName} attached to ${bidderId}.`);

    if (file && (apiClient as any).procurement?.uploadBidderDocument) {
      try {
        const res = await (apiClient as any).procurement.uploadBidderDocument(bidderId, file, documentType);
        if (res && res.assessment) {
          const { assessment, bidder: updatedBidder, doc_record } = res;
          setBidders((items) =>
            items.map((b) =>
              b.id === bidderId
                ? {
                    ...b,
                    score: updatedBidder?.compliance_score ?? assessment.compliance_score ?? b.score,
                    risk: updatedBidder?.risk_level ?? assessment.risk_level ?? b.risk,
                    status: updatedBidder?.status ?? (assessment.risk_level === 'HIGH' ? 'Exception Found' : 'Under Review'),
                    documents: updatedBidder?.documents_count ?? (b.documents + 1),
                    exceptions: updatedBidder?.exceptions_count ?? (assessment.discrepancies?.length || 0),
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
          log(
            'Document Processed & Verified',
            `${fileName} for ${bidderId}: Score ${assessment.compliance_score}/100, Risk: ${assessment.risk_level}`,
            'Verification Engine'
          );
          return res;
        }
      } catch (e) {
        console.warn('Document storage upload note:', e);
      }
    }

    // Fallback local increment if offline or upload failed
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
          setBidders((items) =>
            items.map((b) =>
              b.id === bidderId
                ? {
                    ...b,
                    score: assessment.compliance_score,
                    risk: assessment.risk_level,
                    status: assessment.risk_level === 'HIGH' ? 'Exception Found' : 'Under Review',
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
          return assessment;
        }
      }
    } catch (e) {
      console.warn('Verification API note:', e);
    } finally {
      setLoading(false);
    }
  };

  const decide = async (bidderId: string, decision: string, note: string) => {
    setBidders((items) =>
      items.map((b) =>
        b.id === bidderId
          ? { ...b, status: decision, officerDecision: decision, officerNote: note }
          : b
      )
    );
    log('Officer decision recorded', `${bidderId}: ${decision}${note ? ` — ${note}` : ''}`);

    try {
      if ((apiClient as any).procurement) {
        await (apiClient as any).procurement.recordDecision(bidderId, decision, note);
      }
    } catch (e) {
      console.warn('Officer decision API note:', e);
    }
  };

  const updateRequirement = (bidderId: string, requirementId: string, status: CheckStatus) => {
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

  return (
    <ProcurementContext.Provider
      value={{
        bidders,
        audit,
        loading,
        addTender,
        addBidder,
        uploadDocument,
        runVerification,
        decide,
        updateRequirement,
        refreshData,
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
