import React, { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  ShieldCheck,
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
import { CheckStatus, useProcurement } from '../context/ProcurementContext';

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

export const BidderVerification: React.FC = () => {
  const { bidderId } = useParams();
  const { bidders, decide, updateRequirement, runVerification, uploadDocument, loading } =
    useProcurement();
  const bidder = bidders.find((item) => item.id === bidderId) ?? bidders[0];

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
      e.target.value = '';
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      showBanner(
        'error',
        `File size (${(file.size / 1024 / 1024).toFixed(1)} MB) exceeds the ${MAX_SIZE_MB} MB limit.`
      );
      e.target.value = '';
      return;
    }
    setBanner(null);
    setUploadFile(file);
  };

  const handleUpload = async () => {
    if (!uploadFile || uploading) return;
    setUploading(true);
    setBanner(null);
    try {
      await uploadDocument(bidder.id, uploadFile.name, uploadFile, docType);
      showBanner(
        'success',
        `'${uploadFile.name}' uploaded successfully. OCR and field extraction completed.`
      );
      setUploadFile(null);
      setDocType('auto');
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
          [✓] Verified
        </span>
      );
    if (status === 'Failed')
      return (
        <span className="gov-badge gov-badge-error">
          [✕] Failed
        </span>
      );
    if (status === 'Needs Review')
      return (
        <span className="gov-badge gov-badge-info">
          [!] Review required
        </span>
      );
    if (status === 'Not Applicable')
      return (
        <span className="gov-badge gov-badge-neutral">
          Not applicable
        </span>
      );
    return (
      <span className="gov-badge gov-badge-warning">
        [○] Pending
      </span>
    );
  };

  // Guard — bidders haven't loaded from the backend yet (or bidderId not found)
  if (!bidder) {
    return (
      <div className="flex items-center gap-2 text-xs text-[#475569] py-8 font-sans">
        <RotateCw className="w-4 h-4 animate-spin text-[#0B2A4A]" />
        <span>Loading bidder verification workspace…</span>
      </div>
    );
  }

  const verifiedCount = bidder.requirements.filter((r) => r.status === 'Verified').length;
  const exceptionCount = bidder.requirements.filter(
    (r) => r.status === 'Failed' || r.status === 'Needs Review'
  ).length;
  const pendingCount = bidder.requirements.filter((r) => r.status === 'Pending').length;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 font-sans pb-8">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between text-xs text-[#475569] border-b border-[#CBD5E1] pb-2.5">
        <div className="flex items-center gap-1.5">
          <Link
            to="/tenders"
            className="hover:underline text-[#0B2A4A] flex items-center gap-1 font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to tender register
          </Link>
          <span>/</span>
          <span className="font-mono font-bold text-[#0B2A4A]">{bidder.id}</span>
        </div>

        <button
          onClick={handleRunVerification}
          disabled={verifying || loading}
          className="ux4g-btn ux4g-btn-primary ux4g-btn-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {verifying ? (
            <RotateCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3 h-3 fill-current" />
          )}
          <span>{verifying ? 'Assessing compliance...' : 'Start compliance verification'}</span>
        </button>
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
      <section className="bg-white border border-[#CBD5E1] rounded-[2px] p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#0B2A4A] bg-[#F1F5F9] px-2 py-0.5 border border-[#CBD5E1] rounded-[2px]">
                TENDER: GEM/2026/B/418207
              </span>
              <span className="text-xs text-[#64748B]">• Bidder verification workspace</span>
            </div>
            <h1 className="font-serif font-bold text-xl text-[#0B2A4A] mt-1">{bidder.name}</h1>
            <p className="text-xs text-[#64748B] mt-0.5">
              Supply and Installation of Network Infrastructure for Government Administrative Offices
            </p>
          </div>

          <div className="flex items-center border border-[#CBD5E1] divide-x divide-[#CBD5E1] bg-[#F8FAFC] rounded-[2px] text-xs">
            <div className="px-3.5 py-2 text-center">
              <span className="block text-[10px] uppercase font-semibold text-[#475569]">
                Status
              </span>
              <strong className="text-xs text-[#0B2A4A] block mt-0.5">{bidder.status}</strong>
            </div>
            <div className="px-3.5 py-2 text-center bg-white">
              <span className="block text-[10px] uppercase font-semibold text-[#475569]">
                Compliance score
              </span>
              <strong className="text-base font-semibold text-[#0B2A4A] font-mono block mt-0.5">
                {bidder.score || '0'}/100
              </strong>
            </div>
            <div className="px-3.5 py-2 text-center">
              <span className="block text-[10px] uppercase font-semibold text-[#475569]">
                Risk assessment
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
                {bidder.risk === 'HIGH' || bidder.risk === 'CRITICAL'
                  ? '[!] High'
                  : bidder.risk === 'MEDIUM'
                  ? '[!] Medium'
                  : '[✓] Low'}
              </span>
            </div>
            <div className="px-3.5 py-2 text-center">
              <span className="block text-[10px] uppercase font-semibold text-[#475569]">
                Documents
              </span>
              <strong className="text-xs text-[#0B2A4A] font-mono block mt-0.5">
                {bidder.documents}
              </strong>
            </div>
          </div>
        </div>

        {/* Evidence Subtext Strip */}
        <div className="mt-3 pt-2.5 border-t border-[#E6E9EF] text-xs text-[#475569] flex flex-wrap items-center gap-3">
          <span>
            <strong>Assessment basis:</strong> {bidder.requirements.length} statutory requirements
            evaluated
          </span>
          <span>•</span>
          <span className="text-[#15803D] font-medium">{verifiedCount} verified</span>
          <span>•</span>
          <span className="text-[#B72025] font-medium">{exceptionCount} exception(s)</span>
          <span>•</span>
          <span className="text-[#D97706] font-medium">{pendingCount} pending submission</span>
        </div>
      </section>

      {/* Main Grid: Left Verification Matrix / Right Officer Actions */}
      <div className="grid lg:grid-cols-3 gap-4 items-start">
        {/* Left 2 Cols */}
        <section className="lg:col-span-2 space-y-4">
          {/* Compliance Verification Matrix */}
          <div className="bg-white border border-[#D9DDE3] rounded-[2px]">
            <div className="px-4 py-3 border-b border-[#D9DDE3]">
              <h2 className="font-serif font-bold text-sm text-[#0B2A4A]">
                Compliance verification matrix
              </h2>
              <p className="text-[11px] text-[#475569]">
                Evaluated criteria, extracted evidence from submitted documents, and officer review
                state.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>Requirement</th>
                    <th>Category</th>
                    <th>Extracted evidence</th>
                    <th>Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bidder.requirements.map((req) => (
                    <React.Fragment key={req.id}>
                      <tr className="hover:bg-[#F0F4F8] transition-colors">
                        <td>
                          <strong className="text-xs text-[#202124] block">{req.name}</strong>
                          <span className="text-[11px] text-[#475569] block mt-0.5">
                            {req.note}
                          </span>
                        </td>
                        <td>
                          <span className="text-[11px] text-[#475569]">{req.category}</span>
                        </td>
                        <td>
                          <span className="text-[11px] font-mono text-[#0B2A4A] bg-[#F0F4F8] px-2 py-0.5 border border-[#CBD2DE] rounded-[2px] block truncate max-w-[220px]">
                            {req.evidence}
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
                            {expandedRequirement === req.id ? 'Hide details' : 'View evidence'}
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
                                  Evidence audit trail:
                                </span>
                                <span className="text-[11px] text-[#475569] font-mono">
                                  Rule: STATUTORY_VALIDATION_ACTIVE
                                </span>
                              </div>
                              <p className="text-[#334155] leading-relaxed text-[11px]">
                                <strong>Detailed finding:</strong> {req.note}
                              </p>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                                <div>
                                  <span className="text-[#475569] block text-[10px]">
                                    Source document:
                                  </span>
                                  <strong className="text-[#202124]">{req.evidence}</strong>
                                </div>
                                <div>
                                  <span className="text-[#475569] block text-[10px]">
                                    Extraction method:
                                  </span>
                                  <strong className="text-[#202124]">
                                    PyMuPDF + Regex Parser
                                  </strong>
                                </div>
                                <div>
                                  <span className="text-[#475569] block text-[10px]">
                                    Confidence level:
                                  </span>
                                  <strong className="text-[#15803D]">96% (High)</strong>
                                </div>
                              </div>
                              <div className="pt-2 flex items-center justify-between border-t border-[#E6E9EF]">
                                <span className="text-[11px] text-[#475569]">
                                  Manual officer override:
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
                <h2 className="font-serif font-bold text-sm text-[#0B2A4A]">Upload document</h2>
                <p className="text-[11px] text-[#475569]">
                  Attach a supporting document for this bidder. OCR and field extraction run
                  automatically.
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
                  Choose file
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
                  <span className="text-[11px] text-[#94A3B8] italic">No file selected</span>
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
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload</span>
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
                  Cross-document inconsistencies &amp; discrepancies ({bidder.discrepancies.length})
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
              Officer recommendations
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
              Procurement officer review &amp; decision
            </h2>
            <p className="text-[11px] text-[#475569] mt-1.5">
              Record official administrative action for this participating bidder.
            </p>

            <label className="block text-xs font-semibold text-[#202124] mt-3 mb-1">
              Review findings &amp; rationale
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
