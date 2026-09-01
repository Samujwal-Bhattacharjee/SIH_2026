import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Search,
  FilePlus2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { useProcurement } from '../context/ProcurementContext';
import { useLanguage } from '../context/LanguageContext';
import { GovPageHeader } from '../components/common/GovPageHeader';

// ─── Human-readable status label & badge style ───────────────────────────────
const STATUS_META: Record<string, { label: string; badgeClass: string }> = {
  PENDING_DOCUMENTS: { label: 'Pending documents', badgeClass: 'gov-badge-neutral' },
  'Pending Documents': { label: 'Pending documents', badgeClass: 'gov-badge-neutral' },
  UNDER_REVIEW: { label: 'Under review', badgeClass: 'gov-badge-warning' },
  'Under Review': { label: 'Under review', badgeClass: 'gov-badge-warning' },
  EXCEPTION_FOUND: { label: 'Exception found', badgeClass: 'gov-badge-error' },
  'Exception Found': { label: 'Exception found', badgeClass: 'gov-badge-error' },
  QUALIFIED: { label: 'Qualified', badgeClass: 'gov-badge-success' },
  Qualified: { label: 'Qualified', badgeClass: 'gov-badge-success' },
  DISQUALIFIED: { label: 'Disqualified', badgeClass: 'gov-badge-error' },
  Disqualified: { label: 'Disqualified', badgeClass: 'gov-badge-error' },
  CLARIFICATION_REQUESTED: { label: 'Clarification requested', badgeClass: 'gov-badge-warning' },
  'Clarification Requested': { label: 'Clarification requested', badgeClass: 'gov-badge-warning' },
};

function statusBadge(status: string) {
  const meta = STATUS_META[status] ?? { label: status, badgeClass: 'gov-badge-neutral' };
  return (
    <span className={`gov-badge ${meta.badgeClass}`}>
      {meta.label}
    </span>
  );
}

function riskBadge(risk: string) {
  const r = (risk || '').toUpperCase();
  if (r === 'HIGH' || r === 'CRITICAL') {
    return (
      <span className="gov-badge gov-badge-error font-mono text-[11px]">
        [!] {r === 'CRITICAL' ? 'Critical' : 'High'}
      </span>
    );
  }
  if (r === 'MEDIUM') {
    return (
      <span className="gov-badge gov-badge-warning font-mono text-[11px]">
        [!] Medium
      </span>
    );
  }
  if (r === 'LOW') {
    return (
      <span className="gov-badge gov-badge-success font-mono text-[11px]">
        [✓] Low
      </span>
    );
  }
  return <span className="text-[11px] text-[#475569]">—</span>;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export const VerificationHub: React.FC = () => {
  const { bidders, loading, error, refreshData } = useProcurement();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return bidders;
    const q = query.trim().toLowerCase();
    return bidders.filter(
      (b) =>
        b.id.toLowerCase().includes(q) ||
        b.name.toLowerCase().includes(q)
    );
  }, [bidders, query]);

  const total = bidders.length;
  const withExceptions = bidders.filter(
    (b) =>
      b.status === 'EXCEPTION_FOUND' ||
      b.status === 'Exception Found' ||
      b.exceptions > 0
  ).length;
  const highRisk = bidders.filter(
    (b) => b.risk === 'HIGH' || b.risk === 'CRITICAL'
  ).length;
  const pendingDocs = bidders.filter(
    (b) =>
      b.status === 'PENDING_DOCUMENTS' ||
      b.status === 'Pending Documents' ||
      b.documents === 0
  ).length;

  const headerBlock = (
    <GovPageHeader
      title={
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-[#0B2A4A]" />
          <span>{t('page.verification.title') || 'Bidder Verification Hub'}</span>
        </div>
      }
      tag="STATUTORY VERIFICATION & ADAPTERS"
      subtitle={t('page.verification.subtitle') || 'Verify statutory documents against official government registries and evaluate compliance status.'}
      actions={
        <>
          <button
            onClick={() => navigate('/tenders')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2E0854] hover:bg-[#1E053A] text-white rounded-[4px] text-xs font-semibold shadow-xs gov-btn-glossy transition-all cursor-pointer"
          >
            <FilePlus2 className="w-3.5 h-3.5 text-[#FF9933]" />
            <span>{t('action.addBidder') || 'Add Bidder'}</span>
          </button>
          <button
            onClick={() => refreshData()}
            disabled={loading}
            className="inline-flex items-center justify-center p-2 bg-white/80 hover:bg-white border border-[#CBD5E1] rounded-[4px] text-xs text-[#0B2A4A] shadow-xs gov-btn-glossy transition-all cursor-pointer disabled:opacity-50"
            aria-label="Refresh verification queue"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </>
      }
    />
  );

  // ── Loading (first load, no cached data) ────────────────────────────────────
  if (loading && bidders.length === 0) {
    return (
      <div className="space-y-4 font-sans pb-8">
        {headerBlock}
        <div className="bg-white border border-[#CBD5E1] rounded-[2px] px-4 py-8 flex items-center justify-center gap-2 text-xs text-[#64748B] shadow-xs">
          <Loader2 className="w-4 h-4 animate-spin text-[#0B2A4A]" />
          <span>{t('page.verification.loadingQueue')}</span>
        </div>
      </div>
    );
  }

  // ── Hard error (no cached data) ─────────────────────────────────────────────
  if (error && bidders.length === 0) {
    return (
      <div className="space-y-4 font-sans pb-8">
        {headerBlock}
        <div className="bg-white border border-[#FCA5A5] rounded-[2px] px-4 py-6 text-center shadow-xs">
          <p className="text-xs font-bold text-[#B72025]">
            {t('page.verification.unableToLoad')}
          </p>
          <p className="text-[11px] text-[#64748B] mt-1">{error}</p>
          <button
            onClick={() => refreshData()}
            className="ux4g-btn ux4g-btn-secondary ux4g-btn-sm mt-3 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans pb-8">
      {headerBlock}

      {/* Soft error banner (data present from previous load) */}
      {error && bidders.length > 0 && (
        <div className="ux4g-alert ux4g-alert-error text-xs rounded-[2px] shadow-xs">
          <AlertTriangle className="w-4 h-4 text-[#B72025] shrink-0 mt-0.5" />
          <span>Last refresh failed: {error}</span>
        </div>
      )}

      {/* Summary Statistics Strip */}
      <section
        className="bg-white border border-[#CBD5E1] rounded-[2px] px-4 py-3 shadow-xs"
        aria-label="Verification Queue Summary"
      >
        <div className="flex flex-wrap items-center divide-x divide-[#E2E8F0] text-xs">
          <div className="pr-4 py-0.5">
            <span className="text-[#64748B] block text-[11px] font-medium">Total bidders</span>
            <strong className="text-base font-bold text-[#0B2A4A] font-mono">
              {String(total).padStart(2, '0')}
            </strong>
          </div>
          <div className="px-4 py-0.5">
            <span className="text-[#64748B] block text-[11px] font-medium">Compliance exceptions</span>
            <strong className="text-base font-bold text-[#B72025] font-mono">
              {String(withExceptions).padStart(2, '0')}
            </strong>
          </div>
          <div className="px-4 py-0.5">
            <span className="text-[#64748B] block text-[11px] font-medium">High compliance risk</span>
            <strong className="text-base font-bold text-[#B72025] font-mono">
              {String(highRisk).padStart(2, '0')}
            </strong>
          </div>
          <div className="px-4 py-0.5">
            <span className="text-[#64748B] block text-[11px] font-medium">Pending documents</span>
            <strong className="text-base font-bold text-[#D97706] font-mono">
              {String(pendingDocs).padStart(2, '0')}
            </strong>
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <div className="bg-white border border-[#CBD5E1] rounded-[2px] px-3 py-2 flex items-center gap-2 shadow-xs">
        <Search className="w-4 h-4 text-[#64748B] flex-shrink-0" />
        <input
          id="verification-hub-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by bidder ID or legal entity name…"
          className="flex-1 text-xs text-[#0F172A] placeholder-[#94A3B8] bg-transparent border-none outline-none"
          aria-label="Search bidders"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="text-[11px] text-[#64748B] hover:text-[#0B2A4A] cursor-pointer px-1.5 py-0.5 border border-[#CBD5E1] rounded-[2px] transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Bidder Verification Queue Table */}
      <section
        className="bg-white border border-[#CBD5E1] rounded-[2px] shadow-xs"
        aria-label="Bidder Verification Queue"
      >
        <div className="px-4 py-3 border-b border-[#CBD5E1] bg-[#F8FAFC] flex items-center justify-between">
          <div>
            <h2 className="font-serif font-bold text-sm text-[#0B2A4A]">
              Bidder verification queue
            </h2>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              {filtered.length === total
                ? `${total} participating bidder${total !== 1 ? 's' : ''}`
                : `${filtered.length} of ${total} bidder${total !== 1 ? 's' : ''} matching "${query}"`}
            </p>
          </div>
          <Link
            to="/tenders"
            className="text-xs font-semibold text-[#0B2A4A] hover:underline flex items-center gap-0.5"
          >
            Tender register <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Empty State — no bidders at all */}
        {bidders.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <FileText className="w-8 h-8 text-[#CBD5E1] mx-auto mb-3" />
            <p className="text-xs font-bold text-[#475569]">
              No participating bidders found.
            </p>
            <p className="text-[11px] text-[#64748B] mt-1 max-w-xs mx-auto leading-relaxed">
              Create a tender and enrol participating bidders to begin
              verification.
            </p>
            <button
              onClick={() => navigate('/tenders')}
              className="ux4g-btn ux4g-btn-primary ux4g-btn-md mt-4 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <FilePlus2 className="w-3.5 h-3.5" />
              Go to Procurement
            </button>
          </div>
        ) : filtered.length === 0 ? (
          /* Empty State — no search results */
          <div className="px-4 py-8 text-center">
            <p className="text-xs text-[#475569]">
              No bidders match <strong>"{query}"</strong>.
            </p>
            <button
              onClick={() => setQuery('')}
              className="mt-2 text-xs font-semibold text-[#0B2A4A] underline cursor-pointer"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="ux4g-table">
              <thead>
                <tr>
                  <th>Bidder ID</th>
                  <th>Legal entity</th>
                  <th>Compliance Evaluation</th>
                  <th>Compliance Risk</th>
                  <th>Integrity Risk</th>
                  <th>Officer Decision</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr
                    key={b.id}
                    className={
                      b.complianceStatus === 'EXCEPTION_FOUND' ||
                      b.blockingExceptions > 0
                        ? 'bg-[#FFFDF5]'
                        : ''
                    }
                  >
                    {/* Bidder ID */}
                    <td className="font-mono text-xs font-semibold text-[#0B2A4A] whitespace-nowrap">
                      {b.id}
                    </td>

                    {/* Legal Entity + exceptions indicator */}
                    <td>
                      <strong className="text-xs text-[#0F172A] block leading-snug">
                        {b.name}
                      </strong>
                      {b.blockingExceptions > 0 ? (
                        <span className="inline-flex items-center gap-0.5 mt-0.5 text-[10px] font-semibold text-[#B72025]">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          {b.blockingExceptions} blocking exception
                          {b.blockingExceptions !== 1 ? 's' : ''}
                        </span>
                      ) : b.exceptions > 0 ? (
                        <span className="inline-flex items-center gap-0.5 mt-0.5 text-[10px] font-medium text-[#D97706]">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          {b.exceptions} discrepancy
                          {b.exceptions !== 1 ? 'ies' : ''}
                        </span>
                      ) : null}
                    </td>

                    {/* Compliance Evaluation */}
                    <td>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold font-mono ${
                            b.score >= 80
                              ? 'text-[#15803D]'
                              : b.score >= 60
                              ? 'text-[#D97706]'
                              : 'text-[#B72025]'
                          }`}
                        >
                          {b.score}/100
                        </span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 border rounded-[2px] ${
                          b.complianceStatus === 'COMPLIANT'
                            ? 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]'
                            : b.complianceStatus === 'EXCEPTION_FOUND'
                            ? 'bg-[#FEF2F2] text-[#B72025] border-[#FCA5A5]'
                            : 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]'
                        }`}>
                          {b.complianceStatus === 'COMPLIANT'
                            ? 'Compliant'
                            : b.complianceStatus === 'EXCEPTION_FOUND'
                            ? 'Exception Found'
                            : b.complianceStatus === 'PENDING_DOCUMENTS'
                            ? 'Pending Docs'
                            : 'Under Review'}
                        </span>
                      </div>
                    </td>

                    {/* Compliance Risk */}
                    <td>{riskBadge(b.complianceRisk || b.risk)}</td>

                    {/* Integrity Risk */}
                    <td>{riskBadge(b.integrityRisk || 'LOW')}</td>

                    {/* Officer Decision */}
                    <td>
                      <span className={`inline-block px-1.5 py-0.5 border text-[10px] font-bold rounded-[2px] ${
                        b.officerDecision === 'QUALIFIED'
                          ? 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]'
                          : b.officerDecision === 'DISQUALIFIED'
                          ? 'bg-[#FEF2F2] text-[#B72025] border-[#FCA5A5]'
                          : 'bg-white text-[#475569] border-[#CBD5E1]'
                      }`}>
                        {b.officerDecision || 'Pending Decision'}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="text-right">
                      <Link
                        to={`/verification/${b.id}`}
                        id={`review-bidder-${b.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B2A4A] hover:underline whitespace-nowrap"
                        aria-label={`Review ${b.name}`}
                      >
                        Review <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Decision-support notice */}
      <section className="ux4g-alert ux4g-alert-info rounded-[2px] text-xs text-[#1E3A8A] shadow-xs">
        <ShieldCheck className="w-4 h-4 shrink-0 text-[#1D4ED8] mt-0.5" />
        <div className="leading-relaxed">
          <strong>Decision-support notice:</strong> Compliance assessment is
          evidence-backed and generated from submitted bidder documents. Final
          qualification or disqualification rests strictly with the designated
          Procurement Officer. SIH26100 — Procurement Integrity Engine prototype.
        </div>
      </section>
    </div>
  );
};

export default VerificationHub;
