import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  ShieldCheck,
  ShieldAlert,
  XCircle,
  Play,
  RotateCw,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Info,
  Upload,
  Paperclip,
  X,
} from 'lucide-react';
import { CheckStatus, Requirement, useProcurement } from '../context/ProcurementContext';
import { useLanguage } from '../context/LanguageContext';
import { apiClient } from '../services/api/apiClient';

// ─── Decision mapping: UI label → backend/DB enum ────────────────────────────
const DECISION_LABELS: { label: string; value: string; className: string }[] = [
  {
    label: 'Confirm qualified',
    value: 'QUALIFIED',
    className:
      'px-2.5 py-1.5 bg-[#15803D] hover:bg-[#166534] text-white text-xs font-semibold rounded-[2px] transition-colors cursor-pointer text-center',
  },
  {
    label: 'Record disqualification',
    value: 'DISQUALIFIED',
    className:
      'px-2.5 py-1.5 bg-[#B72025] hover:bg-[#991B1B] text-white text-xs font-semibold rounded-[2px] transition-colors cursor-pointer text-center',
  },
  {
    label: 'Request clarification',
    value: 'CLARIFICATION_REQUESTED',
    className:
      'px-2.5 py-1.5 bg-white text-[#92400E] border border-[#FDE68A] hover:bg-[#FFFBEB] text-xs font-semibold rounded-[2px] transition-colors cursor-pointer text-center',
  },
  {
    label: 'Mark for review',
    value: 'UNDER_REVIEW',
    className:
      'px-2.5 py-1.5 bg-white text-[#0B2A4A] border border-[#CBD2DE] hover:bg-[#F0F4F8] text-xs font-semibold rounded-[2px] transition-colors cursor-pointer text-center',
  },
];

// ─── Allowed file types (mirrors backend validate_file()) ─────────────────────
const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
const MAX_SIZE_MB = 20;

type BannerKind = 'success' | 'error';
interface Banner {
  kind: BannerKind;
  message: string;
}

interface BidderView {
  id: string;
  name: string;
  gstin?: string;
  pan?: string;
  status: string;
  compliance_status?: string;
  score: number;
  risk: string;
  compliance_risk?: string;
  integrity_risk?: string;
  integrity_score?: number;
  blocking_exceptions?: number;
  officer_decision?: string | null;
  officer_note?: string;
  documents: number;
  tender_id?: string;
  requirements: Requirement[];
  discrepancies?: any[];
  recommendations?: string[];
}

export const BidderVerification: React.FC = () => {
  const { bidderId } = useParams();
  const { bidders, decide, updateRequirement, runVerification, uploadDocument, loading } =
    useProcurement();
  const { t } = useLanguage();
  const [liveBidder, setLiveBidder] = useState<BidderView | null>(null);
  const [verificationRecord, setVerificationRecord] = useState<any | null>(null);

  useEffect(() => {
    if (!bidderId) return;
    const fetchLiveBidder = async () => {
      try {
        const res = await (apiClient as any).procurement.getBidder(bidderId);
        if (res?.bidder) {
          const b = res.bidder;
          const compScore = Number(b.compliance_score ?? b.score ?? 0);
          const compStatus = b.compliance_status || (b.blocking_exceptions_count > 0 ? 'EXCEPTION_FOUND' : b.status || 'UNDER_REVIEW');
          const compRisk = b.risk_level || (compScore < 60 ? 'HIGH' : compScore < 80 ? 'MEDIUM' : 'LOW');

          // Extract canonical verification record if present
          let vr = res.verification_record;
          if (!vr && res.documents && res.documents.length > 0) {
            for (const doc of res.documents) {
              const ef = doc.extracted_fields;
              if (ef && typeof ef === 'object') {
                if (ef.verification_record) {
                  vr = ef.verification_record;
                  break;
                } else if (ef.opportunity && ef.bidder) {
                  vr = ef;
                  break;
                }
              }
            }
          }
          setVerificationRecord(vr || null);

          setLiveBidder({
            id: b.id,
            name: (vr && vr.bidder && vr.bidder.bidder_name) || b.legal_name || b.name,
            gstin: (vr && vr.bidder && vr.bidder.gstin) || b.gstin,
            pan: (vr && vr.bidder && vr.bidder.pan) || b.pan,
            status: b.status || compStatus,
            compliance_status: compStatus,
            score: compScore,
            risk: compRisk,
            compliance_risk: compRisk,
            integrity_risk: res.integrity?.risk_level,
            integrity_score: res.integrity?.overall_risk_score,
            blocking_exceptions: b.blocking_exceptions_count,
            officer_decision: b.officer_decision,
            officer_note: b.officer_note,
            documents: res.documents?.length || b.documents_count || 0,
            tender_id: b.tender_id,
            requirements: (res.requirements && res.requirements.length > 0) ? res.requirements.map((r: any) => {
              const rawConf = r.confidence !== undefined && r.confidence !== null ? Number(r.confidence) : 0;
              const evidenceAvail = Boolean(r.evidence_available ?? (r.evidence_value && rawConf > 0));
              const evidenceSrc = r.evidence_source || (evidenceAvail ? r.evidence_doc_id : null);
              return {
                id: r.requirement_id || r.id,
                name: r.name || r.title || r.requirement_name || 'Statutory Requirement',
                category: r.category || 'Statutory compliance',
                status: r.status === 'COMPLIANT' ? 'Verified' : r.status === 'NON_COMPLIANT' || r.status === 'EXPIRED' ? 'Failed' : r.status === 'NEEDS_REVIEW' ? 'Needs Review' : r.status === 'NOT_APPLICABLE' ? 'Not Applicable' : 'Pending',
                evidence: r.evidence_value || (evidenceAvail ? r.evidence_field_key : null) || 'No supporting document submitted',
                note: r.reason || r.discrepancy_note || r.note || '',
                isMandatory: r.is_mandatory !== undefined ? Boolean(r.is_mandatory) : true,
                isBlocking: Boolean(r.is_blocking),
                resultStatus: r.result_status || (r.status === 'COMPLIANT' ? 'PASS' : r.status === 'NON_COMPLIANT' ? 'FAIL' : r.status),
                confidence: rawConf,
                evidenceAvailable: evidenceAvail,
                evidenceSource: evidenceSrc,
              };
            }) : [],
            discrepancies: res.discrepancies || [],
            recommendations: res.recommendations || [],
          });
        }
      } catch (err) {
        console.warn('Could not fetch live bidder:', err);
      }
    };
    fetchLiveBidder();
  }, [bidderId]);

  const matchedBidder = bidders.find((item) => item.id === bidderId);
  const bidder: BidderView | null = liveBidder || (matchedBidder ? {
    id: matchedBidder.id,
    name: matchedBidder.name,
    status: matchedBidder.status,
    compliance_status: matchedBidder.complianceStatus,
    score: matchedBidder.score,
    risk: matchedBidder.risk,
    compliance_risk: matchedBidder.complianceRisk || matchedBidder.risk,
    integrity_risk: matchedBidder.integrityRisk,
    integrity_score: matchedBidder.integrityScore,
    blocking_exceptions: matchedBidder.blockingExceptions,
    officer_decision: matchedBidder.officerDecision,
    officer_note: matchedBidder.officerNote,
    documents: matchedBidder.documents,
    requirements: matchedBidder.requirements || [],
    discrepancies: matchedBidder.discrepancies || [],
    recommendations: matchedBidder.recommendations || [],
  } : null);

  // ── Shared banner (replaces the previous single-tone actionMessage) ─────────
  const [banner, setBanner] = useState<Banner | null>(null);
  const [note, setNote] = useState('');
  const [expandedRequirement, setExpandedRequirement] = useState<string | null>(null);

  // ── Verification state ──────────────────────────────────────────────────────
  const [verifying, setVerifying] = useState(false);

  // ── Document-upload state ───────────────────────────────────────────────────
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('auto');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const showBanner = (kind: BannerKind, message: string) =>
    setBanner({ kind, message });

  const handleRunVerification = async () => {
    if (!bidder) return;
    setVerifying(true);
    setBanner(null);
    try {
      await runVerification(bidder.id);
      showBanner('success', 'Compliance assessment completed. Extracted evidence & score updated.');
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : 'Unable to complete the compliance assessment.';
      showBanner('error', `Verification failed. ${msg} Please retry.`);
    } finally {
      setVerifying(false);
    }
  };

  const handleDecision = async (backendStatus: string, label: string) => {
    if (!bidder) return;
    setBanner(null);
    try {
      await decide(bidder.id, backendStatus, note);
      showBanner('success', `Officer decision '${label}' recorded in the official audit register.`);
      setNote('');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Decision could not be recorded.';
      showBanner('error', `Decision failed. ${msg}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    // Client-side pre-validation (backend remains authoritative)
    if (!ALLOWED_TYPES.includes(file.type)) {
      showBanner('error', `File type '${file.type}' is not supported. Allowed: PDF, PNG, JPEG.`);
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      showBanner('error', `File size exceeds the ${MAX_SIZE_MB} MB limit.`);
      return;
    }
    setUploadFile(file);
    setBanner(null);
  };

  const handleUpload = async () => {
    if (!bidder || !uploadFile) return;
    setUploading(true);
    setBanner(null);
    try {
      await uploadDocument(
        bidder.id,
        uploadFile.name,
        uploadFile,
        docType === 'auto' ? undefined : docType
      );
      showBanner(
        'success',
        `Document '${uploadFile.name}' uploaded and processed with OCR successfully.`
      );
      setUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'The document could not be saved.';
      showBanner('error', `Document upload failed. ${msg} Please retry.`);
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setUploadFile(null);
    setBanner(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Derived counts ──────────────────────────────────────────────────────────
  const statusBadge = (status: CheckStatus) => {
    if (status === 'Verified')
      return (
        <span className="gov-badge gov-badge-success">
          [✓] {t('page.bidderVerification.verified', 'Verified')}
        </span>
      );
    if (status === 'Failed')
      return (
        <span className="gov-badge gov-badge-error">
          [✕] {t('status.rejected', 'Failed')}
        </span>
      );
    if (status === 'Needs Review')
      return (
        <span className="gov-badge gov-badge-info">
          [!] {t('status.forwarded', 'Review required')}
        </span>
      );
    if (status === 'Not Applicable')
      return (
        <span className="gov-badge gov-badge-neutral">
          {t('status.disposed', 'Not applicable')}
        </span>
      );
    return (
      <span className="gov-badge gov-badge-warning">
        [○] {t('status.pending', 'Pending')}
      </span>
    );
  };

  // Guard — bidders haven't loaded from the backend yet (or bidderId not found)
  if (!bidder) {
    return (
      <div className="flex items-center gap-2 text-xs text-[#475569] py-8 font-sans">
        <RotateCw className="w-4 h-4 animate-spin text-[#0B2A4A]" />
        <span>{t('page.verification.loadingQueue', 'Loading bidder verification workspace…')}</span>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  const hasEvaluated = bidder.requirements && bidder.requirements.length > 0;
  return (
    <div className="space-y-4 font-sans pb-8">
      {/* Navigation Breadcrumb & Actions Banner */}
      <div className="gov-glass-card rounded-lg px-4 py-3 flex flex-wrap items-center justify-between text-xs text-[#475569] shadow-sm border border-white/60">
        <div className="flex items-center gap-2">
          <Link
            to="/tenders"
            className="hover:underline text-[#0B2A4A] flex items-center gap-1.5 font-bold"
          >
            <ArrowLeft className="w-4 h-4 text-[#0B2A4A]" /> {t('page.bidderVerification.backToTender', 'Back to Tender Register')}
          </Link>
          <span>/</span>
          <span className="font-mono font-bold px-2 py-0.5 rounded bg-white/70 text-[#0B2A4A] border border-white/80">{bidder.id}</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={(bidder as any)?.tender_id ? `/integrity?tender=${(bidder as any).tender_id}` : '/integrity'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/80 hover:bg-white border border-[#CBD5E1] rounded-[4px] text-xs font-semibold text-[#0B2A4A] shadow-xs gov-btn-glossy transition-all cursor-pointer"
            title="Inspect cross-tender integrity signals and relationship graphs"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-[#0B2A4A]" />
            <span>{t('page.bidderVerification.integritySignals', 'Integrity Signals')}</span>
          </Link>
          <button
            onClick={handleRunVerification}
            disabled={verifying || loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#2E0854] hover:bg-[#1E053A] text-white rounded-[4px] text-xs font-semibold shadow-xs gov-btn-glossy transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {verifying ? (
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3 h-3 fill-current" />
            )}
            <span>
              {verifying
                ? t('page.bidderVerification.assessing', 'Assessing Compliance...')
                : hasEvaluated
                ? t('page.bidderVerification.reEvaluate', 'Re-evaluate Compliance')
                : t('page.bidderVerification.startVerification', 'Start Compliance Verification')}
            </span>
          </button>
        </div>
      </div>

      {/* Banner — success or error */}
      {banner && (
        <div
          className={`ux4g-alert text-xs font-medium shadow-xs ${
            banner.kind === 'success'
              ? 'ux4g-alert-success text-[#15803D]'
              : 'ux4g-alert-error text-[#B72025]'
          }`}
        >
          <div className="flex items-center gap-2 flex-1">
            {banner.kind === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#15803D]" />
            ) : (
              <XCircle className="w-4 h-4 shrink-0 text-[#B72025]" />
            )}
            <span>{banner.message}</span>
          </div>
          <button
            onClick={() => setBanner(null)}
            className="ml-4 underline text-xs cursor-pointer shrink-0 font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Bidder Identification & Compliance Header */}
      <section className="gov-glass-card rounded-xl p-5 shadow-md border border-white/70 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#138808]" />
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#0B2A4A] bg-white/70 px-2 py-0.5 border border-[#CBD5E1] rounded-[4px]">
                TENDER: {(bidder as any)?.tender_id || 'GEM/2026/B/418207'}
              </span>
              <span className="text-xs text-[#64748B] font-medium">• {t('page.bidderVerification.dossier', 'Bidder Verification Dossier')}</span>
            </div>
            <h1 className="font-serif font-extrabold text-xl sm:text-2xl text-[#0B2A4A] mt-1">{bidder.name}</h1>
            {verificationRecord?.opportunity ? (
              <p className="text-xs text-[#475569] font-medium mt-0.5">
                {verificationRecord.opportunity.oil_marketing_company || 'Petroleum'} Dealership Opportunity • {verificationRecord.opportunity.location} ({verificationRecord.opportunity.district}, {verificationRecord.opportunity.state})
              </p>
            ) : (
              <p className="text-xs text-[#475569] font-medium mt-0.5">
                {(bidder as any)?.tender_title || 'Procurement & Bid Compliance Verification Dossier'}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center border border-[#CBD5E1] divide-x divide-[#CBD5E1] bg-[#F8FAFC] rounded-[2px] text-xs">
            <div className="px-3 py-2 text-center">
              <span className="block text-[10px] uppercase font-semibold text-[#475569]">
                {t('page.bidderVerification.complianceStatus', 'Compliance Status')}
              </span>
              <span
                className={`inline-block mt-0.5 px-1.5 py-0.5 border text-[10px] font-bold rounded-[2px] ${
                  bidder.compliance_status === 'COMPLIANT'
                    ? 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]'
                    : bidder.compliance_status === 'EXCEPTION_FOUND'
                    ? 'bg-[#FEF2F2] text-[#B72025] border-[#FCA5A5]'
                    : 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]'
                }`}
              >
                {bidder.compliance_status === 'COMPLIANT'
                  ? 'COMPLIANT'
                  : bidder.compliance_status === 'EXCEPTION_FOUND'
                  ? 'EXCEPTION FOUND'
                  : bidder.compliance_status === 'PENDING_DOCUMENTS'
                  ? 'PENDING DOCS'
                  : 'UNDER REVIEW'}
              </span>
            </div>
            <div className="px-3.5 py-2 text-center bg-white">
              <span className="block text-[10px] uppercase font-semibold text-[#475569]">
                {t('page.bidderVerification.complianceScore', 'Compliance score')}
              </span>
              <strong className="text-base font-semibold text-[#0B2A4A] font-mono block mt-0.5">
                {bidder.score}/100
              </strong>
            </div>
            <div className="px-3 py-2 text-center">
              <span className="block text-[10px] uppercase font-semibold text-[#475569]">
                {t('page.bidderVerification.complianceRisk', 'Compliance Risk')}
              </span>
              <span
                className={`inline-block mt-0.5 px-1.5 py-0.5 border text-[10px] font-bold rounded-[2px] ${
                  bidder.risk === 'HIGH' || bidder.risk === 'CRITICAL'
                    ? 'bg-[#FEF2F2] text-[#B72025] border-[#FCA5A5]'
                    : bidder.risk === 'MEDIUM'
                    ? 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]'
                    : 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]'
                }`}
              >
                {bidder.risk}
              </span>
            </div>
            <div className="px-3 py-2 text-center bg-white">
              <span className="block text-[10px] uppercase font-semibold text-[#475569]">
                {t('page.bidderVerification.integrityRisk', 'Integrity Risk')}
              </span>
              <span
                className={`inline-block mt-0.5 px-1.5 py-0.5 border text-[10px] font-bold rounded-[2px] ${
                  bidder.integrity_risk === 'HIGH' || bidder.integrity_risk === 'CRITICAL'
                    ? 'bg-[#FEF2F2] text-[#B72025] border-[#FCA5A5]'
                    : bidder.integrity_risk === 'MEDIUM'
                    ? 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]'
                    : 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]'
                }`}
              >
                {bidder.integrity_risk || 'LOW'}
              </span>
            </div>
            <div className="px-3 py-2 text-center">
              <span className="block text-[10px] uppercase font-semibold text-[#475569]">
                {t('page.bidderVerification.officerDecision', 'Decision')}
              </span>
              <span
                className={`inline-block mt-0.5 px-1.5 py-0.5 border text-[10px] font-bold rounded-[2px] ${
                  bidder.officer_decision === 'QUALIFIED'
                    ? 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]'
                    : bidder.officer_decision === 'DISQUALIFIED'
                    ? 'bg-[#FEF2F2] text-[#B72025] border-[#FCA5A5]'
                    : 'bg-white text-[#475569] border-[#CBD5E1]'
                }`}
              >
                {bidder.officer_decision || 'Pending'}
              </span>
            </div>
            <div className="px-3 py-2 text-center">
              <span className="block text-[10px] uppercase font-semibold text-[#475569]">
                {t('page.bidderVerification.documents', 'Documents')}
              </span>
              <strong className="text-xs text-[#0B2A4A] font-mono block mt-0.5">
                {bidder.documents}
              </strong>
            </div>
          </div>
        </div>

        {/* Canonical FairBid Verification Details (when present) */}
        {verificationRecord && verificationRecord.opportunity && (
          <div className="mt-4 pt-3 border-t border-[#E6E9EF] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0B2A4A] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#15803D]" />
                Extracted Dealership &amp; Opportunity Specification (Source of Truth)
              </span>
              <span className="text-[11px] font-mono text-[#64748B]">
                Doc ID: {verificationRecord.document?.document_id || 'FB-RO-RECORD'} • Date: {verificationRecord.document?.issue_date || '03 Sep 2026'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {/* Card 1: Public Tender Specification */}
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[4px] p-3 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wide text-[#6D28D9] block">
                  1. Location &amp; OMC Parameters
                </span>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Company:</span>
                  <strong className="text-[#0F172A] text-right font-medium">{verificationRecord.opportunity.oil_marketing_company}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">State:</span>
                  <strong className="text-[#0F172A] font-bold">{verificationRecord.opportunity.state}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">District:</span>
                  <strong className="text-[#0F172A] font-bold">{verificationRecord.opportunity.district}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Location:</span>
                  <strong className="text-[#0F172A] text-right truncate max-w-[140px]" title={verificationRecord.opportunity.location}>{verificationRecord.opportunity.location}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Highway:</span>
                  <strong className="text-[#0F172A] font-mono">{verificationRecord.opportunity.road_highway} (Sl. {verificationRecord.opportunity.location_serial_number})</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Type / Site:</span>
                  <strong className="text-[#0F172A]">{verificationRecord.opportunity.retail_outlet_type} / {verificationRecord.opportunity.site_type} ({verificationRecord.opportunity.category})</strong>
                </div>
              </div>

              {/* Card 2: Commercial Parameters */}
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[4px] p-3 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wide text-[#15803D] block">
                  2. Commercial Parameters
                </span>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Security Deposit:</span>
                  <strong className="text-[#0F172A] font-mono font-bold text-[#15803D]">{verificationRecord.commercial?.security_deposit || 'Rs. 3 lakh'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Sales Potential:</span>
                  <strong className="text-[#0F172A]">{verificationRecord.commercial?.estimated_monthly_sales_potential}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Site Area:</span>
                  <strong className="text-[#0F172A] font-mono">{verificationRecord.commercial?.site_area}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Frontage x Depth:</span>
                  <strong className="text-[#0F172A] font-mono">{verificationRecord.commercial?.minimum_frontage} x {verificationRecord.commercial?.minimum_depth}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Working Capital:</span>
                  <strong className="text-[#0F172A] font-mono">{verificationRecord.commercial?.working_capital_requirement}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Selection Method:</span>
                  <strong className="text-[#0F172A]">{verificationRecord.opportunity?.selection_method}</strong>
                </div>
              </div>

              {/* Card 3: Bidder Verified Profile */}
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[4px] p-3 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wide text-[#0B2A4A] block">
                  3. Bidder Compliance Profile
                </span>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">GSTIN:</span>
                  <strong className="text-[#0F172A] font-mono">{verificationRecord.bidder?.gstin}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">PAN:</span>
                  <strong className="text-[#0F172A] font-mono">{verificationRecord.bidder?.pan}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Udyam:</span>
                  <strong className="text-[#0F172A] font-mono text-[11px] truncate max-w-[130px]">{verificationRecord.bidder?.udyam_registration_number}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Non-Blacklisting:</span>
                  <strong className="text-[#15803D] text-[11px]">{verificationRecord.compliance?.blacklisting_debarment || 'NOT BLACKLISTED'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Completeness:</span>
                  <strong className="text-[#15803D] text-[11px]">{verificationRecord.compliance?.application_completeness || 'COMPLETE'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Classification:</span>
                  <strong className="text-[#0F172A] text-[11px] truncate max-w-[130px]" title={verificationRecord.bidder?.bidder_classification}>{verificationRecord.bidder?.bidder_classification}</strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Main Grid: Left Verification Matrix / Right Officer Actions */}
      <div className="grid lg:grid-cols-3 gap-4 items-start">
        {/* Left 2 Cols */}
        <section className="lg:col-span-2 space-y-4">
          {/* Compliance Verification Matrix */}
          <div className="bg-white border border-[#D9DDE3] rounded-[2px]">
            <div className="px-4 py-3 border-b border-[#D9DDE3]">
              <h2 className="font-serif font-bold text-sm text-[#0B2A4A]">
                {t('page.bidderVerification.matrixTitle', 'Compliance verification matrix')}
              </h2>
              <p className="text-[11px] text-[#475569]">
                {t('page.bidderVerification.matrixSubtitle', 'Evaluated criteria, extracted evidence from submitted documents, and officer review state.')}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>{t('page.bidderVerification.thRequirement', 'Requirement')}</th>
                    <th>{t('page.bidderVerification.thCategory', 'Category')}</th>
                    <th>{t('page.bidderVerification.thEvidence', 'Extracted evidence')}</th>
                    <th>{t('page.bidderVerification.thStatus', 'Status')}</th>
                    <th className="text-right">{t('page.bidderVerification.thAction', 'Action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {bidder.requirements.map((req) => (
                    <React.Fragment key={req.id}>
                      <tr className="hover:bg-[#F0F4F8] transition-colors">
                        <td>
                          <div className="flex items-center gap-1.5">
                            <strong className="text-xs text-[#202124] block">{req.name}</strong>
                            {req.isMandatory && (
                              <span className="text-[9px] font-bold px-1 py-0.5 text-[#991B1B] bg-[#FEE2E2] rounded-[2px] border border-[#FCA5A5]" title="Mandatory condition in tender terms">
                                MANDATORY
                              </span>
                            )}
                            {req.isBlocking && (
                              <span className="text-[9px] font-bold px-1 py-0.5 text-[#B72025] bg-[#FEF2F2] rounded-[2px] border border-[#EF4444]" title="Blocking exception: prevents qualification until resolved">
                                BLOCKING
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[#475569] block mt-0.5">
                            {req.note}
                          </span>
                        </td>
                        <td>
                          <span className="text-[11px] text-[#475569]">{req.category}</span>
                        </td>
                        <td>
                          <span className={`text-[11px] font-mono px-2 py-0.5 border rounded-[2px] block truncate max-w-[220px] ${
                            req.evidenceAvailable
                              ? 'text-[#0B2A4A] bg-[#F0F4F8] border-[#CBD2DE]'
                              : 'text-[#64748B] bg-[#F8F9FA] border-[#E2E8F0] italic'
                          }`}>
                            {req.evidence || 'No supporting document submitted'}
                          </span>
                        </td>
                        <td>{statusBadge(req.status)}</td>
                        <td className="text-right">
                          <button
                            onClick={() =>
                              setExpandedRequirement(
                                expandedRequirement === req.id ? null : req.id
                              )
                            }
                            className="text-xs text-[#0B2A4A] font-semibold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                          >
                            {expandedRequirement === req.id ? t('page.bidderVerification.hideDetails', 'Hide details') : t('page.bidderVerification.viewEvidence', 'View evidence')}
                            {expandedRequirement === req.id ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Progressive Disclosure Details */}
                      {expandedRequirement === req.id && (
                        <tr className="bg-[#F8F9FA]">
                          <td colSpan={5} className="p-3 border-b border-[#D9DDE3]">
                            <div className="bg-white p-3 border border-[#CBD2DE] rounded-[2px] text-xs space-y-2">
                              <div className="flex items-center justify-between border-b border-[#E6E9EF] pb-1.5">
                                <span className="font-bold text-[#0B2A4A]">
                                  {t('page.bidderVerification.evidenceAuditTrail', 'Evidence audit trail:')}
                                </span>
                                <span className="text-[11px] text-[#475569] font-mono font-semibold">
                                  Rule: RULE_{req.id.toUpperCase().replace(/-/g, '_')}
                                </span>
                              </div>
                              <p className="text-[#334155] leading-relaxed text-[11px]">
                                <strong>{t('page.bidderVerification.detailedFinding', 'Detailed finding:')}</strong> {req.note}
                              </p>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                                <div>
                                  <span className="text-[#475569] block text-[10px]">
                                    {t('page.bidderVerification.sourceDocument', 'Source document:')}
                                  </span>
                                  <strong className="text-[#202124]">
                                    {req.evidenceSource || (req.evidenceAvailable ? req.evidence : 'No document submitted')}
                                  </strong>
                                </div>
                                <div>
                                  <span className="text-[#475569] block text-[10px]">
                                    {t('page.bidderVerification.extractionMethod', 'Extraction method:')}
                                  </span>
                                  <strong className="text-[#202124]">
                                    {req.evidenceAvailable ? 'PyMuPDF + Deterministic Rule Engine' : 'None (No document / unextracted)'}
                                  </strong>
                                </div>
                                <div>
                                  <span className="text-[#475569] block text-[10px]">
                                    {t('page.bidderVerification.confidenceLevel', 'Confidence level:')}
                                  </span>
                                  {req.confidence !== undefined && req.confidence > 0 ? (
                                    <strong className={req.confidence >= 0.8 ? "text-[#15803D]" : "text-[#D97706]"}>
                                      {Math.round(req.confidence * 100)}% ({req.confidence >= 0.8 ? 'High' : 'Medium'})
                                    </strong>
                                  ) : (
                                    <strong className="text-[#64748B]">
                                      0% (None)
                                    </strong>
                                  )}
                                </div>
                              </div>
                              <div className="pt-2 flex items-center justify-between border-t border-[#E6E9EF]">
                                <span className="text-[11px] text-[#475569]">
                                  {t('page.bidderVerification.manualOverride', 'Manual officer override:')}
                                </span>
                                <select
                                  value={req.status}
                                  onChange={(e) =>
                                    updateRequirement(
                                      bidder.id,
                                      req.id,
                                      e.target.value as CheckStatus
                                    )
                                  }
                                  className="text-xs border border-[#CBD2DE] px-2 py-0.5 rounded-[2px] bg-white text-[#0B2A4A] font-medium cursor-pointer"
                                >
                                  <option>Verified</option>
                                  <option>Failed</option>
                                  <option>Pending</option>
                                  <option>Needs Review</option>
                                  <option>Not Applicable</option>
                                </select>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Inline Document Upload ───────────────────────────────────────── */}
          <div className="bg-white border border-[#D9DDE3] rounded-[2px]">
            <div className="px-4 py-3 border-b border-[#D9DDE3] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#0B2A4A] shrink-0" />
              <div>
                <h2 className="font-serif font-bold text-sm text-[#0B2A4A]">{t('page.bidderVerification.uploadDocTitle', 'Upload document')}</h2>
                <p className="text-[11px] text-[#475569]">
                  {t('page.bidderVerification.uploadDocSubtitle', 'Attach a supporting document for this bidder. OCR and field extraction run automatically.')}
                </p>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {/* File picker row */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  id="bidder-doc-upload"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="sr-only"
                  disabled={uploading}
                />
                <label
                  htmlFor="bidder-doc-upload"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 border text-xs font-semibold rounded-[2px] cursor-pointer transition-colors ${
                    uploading
                      ? 'border-[#D9DDE3] text-[#94A3B8] bg-[#F8F9FA] cursor-not-allowed'
                      : 'border-[#CBD2DE] text-[#0B2A4A] bg-white hover:bg-[#F0F4F8]'
                  }`}
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  {t('page.bidderVerification.chooseFile', 'Choose file')}
                </label>

                {/* Selected file pill */}
                {uploadFile ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F0F4F8] border border-[#CBD2DE] rounded-[2px] text-[11px] font-mono text-[#0B2A4A] max-w-[260px] truncate">
                    <Paperclip className="w-3 h-3 shrink-0 text-[#475569]" />
                    <span className="truncate">{uploadFile.name}</span>
                    <button
                      onClick={clearFile}
                      className="ml-0.5 text-[#475569] hover:text-[#B72025] cursor-pointer shrink-0"
                      title="Remove file"
                      disabled={uploading}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ) : (
                  <span className="text-[11px] text-[#94A3B8] italic">{t('page.bidderVerification.noFileChosen', 'No file selected')}</span>
                )}
              </div>

              {/* Document type + upload button row */}
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-[11px] text-[#475569] font-semibold shrink-0">
                  Document type:
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  disabled={uploading}
                  className="text-xs border border-[#CBD2DE] px-2 py-1 rounded-[2px] bg-white text-[#0B2A4A] font-medium cursor-pointer disabled:opacity-60"
                >
                  <option value="auto">Auto-detect</option>
                  <option value="GST Certificate">GST Certificate</option>
                  <option value="PAN Card">PAN Card</option>
                  <option value="Udyam/MSME Certificate">Udyam/MSME Certificate</option>
                  <option value="OEM Authorization">OEM Authorization</option>
                  <option value="Financial Statement">Financial Statement</option>
                  <option value="Income Tax / ITR">Income Tax / ITR</option>
                  <option value="Non-Blacklisting Declaration">
                    Non-Blacklisting Declaration
                  </option>
                  <option value="Local Content / Make in India Declaration">
                    Local Content Declaration
                  </option>
                  <option value="Other">Other</option>
                </select>

                <button
                  onClick={handleUpload}
                  disabled={!uploadFile || uploading}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#0B2A4A] hover:bg-[#123B63] text-white text-xs font-semibold rounded-[2px] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{t('page.bidderVerification.uploading', 'Uploading...')}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>{t('page.bidderVerification.uploadBtn', 'Upload & Extract')}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Allowed-types note */}
              <p className="text-[10px] text-[#94A3B8]">
                Accepted: PDF, PNG, JPEG — max {MAX_SIZE_MB} MB. OCR and compliance re-assessment
                run automatically on upload.
              </p>
            </div>
          </div>

          {/* Cross-Document Discrepancies */}
          {bidder.discrepancies && bidder.discrepancies.length > 0 && (
            <div className="bg-white border border-[#FCA5A5] rounded-[2px]">
              <div className="px-4 py-2.5 bg-[#FFF1F2] border-b border-[#FCA5A5] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#B72025]" />
                <h2 className="font-serif font-bold text-xs uppercase tracking-wide text-[#991B1B]">
                  {t('page.bidderVerification.discrepanciesTitle', 'Cross-document inconsistencies & discrepancies')} ({bidder.discrepancies.length})
                </h2>
              </div>

              <div className="divide-y divide-[#FEE2E2] p-4 space-y-3">
                {bidder.discrepancies.map((d, idx) => (
                  <div key={idx} className="text-xs space-y-1.5 pt-2 first:pt-0">
                    <div className="flex items-center justify-between">
                      <strong className="text-[#991B1B] text-xs font-semibold">{d.type}</strong>
                      <span className="px-1.5 bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5] rounded-[2px] font-mono text-[10px] font-bold">
                        SEVERITY: {d.severity}
                      </span>
                    </div>
                    <p className="text-[#7F1D1D] leading-relaxed text-[11px]">{d.message}</p>
                    {d.expected && d.found && (
                      <div className="grid grid-cols-2 gap-2 bg-[#FFF8F8] border border-[#FECDD3] p-2 rounded-[2px] text-[11px]">
                        <div>
                          <span className="block font-semibold text-[#475569] text-[10px]">
                            What was expected:
                          </span>
                          <span className="font-mono text-[#0B2A4A]">{d.expected}</span>
                        </div>
                        <div>
                          <span className="block font-semibold text-[#475569] text-[10px]">
                            What was found:
                          </span>
                          <span className="font-mono text-[#B72025]">{d.found}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Right Column: Recommendations & Officer Decision */}
        <aside className="space-y-4">
          {/* Officer Actionable Recommendations */}
          <section className="bg-white border border-[#D9DDE3] p-4 rounded-[2px]">
            <h2 className="font-serif font-bold text-xs text-[#0B2A4A] uppercase tracking-wide flex items-center gap-1.5 border-b border-[#E6E9EF] pb-2">
              <Info className="w-3.5 h-3.5 text-[#0B2A4A]" />
              {t('page.integrity.recommendedAction', 'Officer recommendations')}
            </h2>

            <ul className="mt-3 space-y-2 text-xs text-[#334155]">
              {(
                bidder.recommendations || [
                  'Review legal entity name consistency across submitted documents.',
                  'Obtain valid OEM authorization before final qualification decision.',
                ]
              ).map((rec, idx) => (
                <li
                  key={idx}
                  className="bg-[#F8F9FA] p-2 border border-[#E6E9EF] rounded-[2px] flex items-start gap-1.5 text-[11px] leading-relaxed"
                >
                  <span className="text-[#0B2A4A] font-bold font-mono shrink-0">#{idx + 1}</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Officer Decision Box */}
          <section className="bg-white border border-[#D9DDE3] p-4 rounded-[2px]">
            <h2 className="font-serif font-bold text-xs text-[#0B2A4A] uppercase tracking-wide border-b border-[#E6E9EF] pb-2">
              {t('page.bidderVerification.officerDecisionTitle', 'Procurement officer review & decision')}
            </h2>
            <p className="text-[11px] text-[#475569] mt-1.5">
              {t('page.bidderVerification.officerDecisionSubtitle', 'Record official administrative action for this participating bidder.')}
            </p>

            {bidder.officer_decision && (
              <div className="mt-2.5 p-2 bg-[#F0FDF4] border border-[#BBF7D0] rounded-[2px] text-xs">
                <span className="font-bold text-[#15803D] block">Current Recorded Decision: {bidder.officer_decision}</span>
                {bidder.officer_note && <p className="text-[#166534] text-[11px] mt-0.5 font-medium">{bidder.officer_note}</p>}
              </div>
            )}

            {bidder.blocking_exceptions && bidder.blocking_exceptions > 0 ? (
              <div className="mt-2.5 p-2 bg-[#FFF1F2] border border-[#FCA5A5] rounded-[2px] text-[11px] text-[#991B1B]">
                <strong>Notice:</strong> Bidder has {bidder.blocking_exceptions} unresolved mandatory requirement exception(s). If qualifying under special authority or waiver, record the justification in the rationale below.
              </div>
            ) : null}

            <label className="block text-xs font-semibold text-[#202124] mt-3 mb-1">
              {t('page.bidderVerification.officerNote', 'Review findings & rationale')}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border border-[#CBD2DE] p-2 text-xs rounded-[2px] min-h-[72px] focus:outline-[#0B2A4A]"
              placeholder="Record the official basis and reasoning for the decision..."
            />

            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {DECISION_LABELS.map(({ label, value, className }) => (
                <button
                  key={value}
                  onClick={() => handleDecision(value, label)}
                  className={className}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-3 pt-2.5 border-t border-[#E6E9EF] flex items-center gap-1.5 text-[10px] text-[#475569]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#15803D] shrink-0" />
              <span>Immutable audit trail entry created with every recorded action.</span>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default BidderVerification;
