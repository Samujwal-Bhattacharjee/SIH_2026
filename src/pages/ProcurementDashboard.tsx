import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FilePlus2,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
  ScrollText,
} from 'lucide-react';
import { useProcurement } from '../context/ProcurementContext';
import { apiClient } from '../services/api/apiClient';
import { useLanguage } from '../context/LanguageContext';

export const ProcurementDashboard: React.FC = () => {
  const { bidders, refreshData, error } = useProcurement();
  const { t } = useLanguage();
  const [metrics, setMetrics] = useState<any>({
    active_tenders: 0,
    bids_under_verification: 0,
    completed_assessments: 0,
    high_risk_bidders: 0,
    pending_documents: 0,
    verification_exceptions: 0,
    integrity_reviews: [],
    integrity_summary: { reviews_requiring_attention: 0, high_risk_cases: 0, total_findings: 0 },
  });
  const navigate = useNavigate();

  useEffect(() => {
    refreshData();
    const fetchDashboard = async () => {
      try {
        const data = await (apiClient as any).procurement.getDashboard();
        if (data) setMetrics(data);
      } catch {
        // ProcurementContext exposes the live API error; do not replace it with static metrics.
      }
    };
    fetchDashboard();
  }, []);

  const activeTendersCount = metrics.active_tenders || 0;
  const underVerificationCount = metrics.bids_under_verification || 0;
  const integrityReviews: any[] = metrics.integrity_reviews || [];
  const integritySummary = metrics.integrity_summary || { reviews_requiring_attention: 0, high_risk_cases: 0, total_findings: 0 };
  const highRiskCasesCount = (integritySummary.high_risk_cases || 0) + (metrics.high_risk_bidders || 0);

  const getRiskBadge = (level: string) => {
    const l = (level || '').toUpperCase();
    switch (l) {
      case 'CRITICAL':
      case 'HIGH':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-[2px] bg-[#FEF2F2] text-[#B72025] border border-[#FCA5A5] whitespace-nowrap">[!] {l} RISK</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-[2px] bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] whitespace-nowrap">[!] MEDIUM</span>;
      case 'LOW':
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-[2px] bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0] whitespace-nowrap">[✓] LOW</span>;
    }
  };

  const formatSignalLabel = (sig: string) => {
    switch (sig) {
      case 'RELATED_BIDDER':
      case 'SHARED_ENTITY':
        return 'Related-Bidder Signal';
      case 'BID_PRICE_ANOMALY':
        return 'Price Clustering Anomaly';
      case 'REPEATED_PARTICIPATION_PATTERN':
        return 'Cohort Bidding Pattern';
      case 'REPEATED_WINNER_PATTERN':
        return 'Winner Concentration';
      case 'BID_ROTATION_PATTERN':
        return 'Bid Rotation Signal';
      default:
        return sig.replace(/_/g, ' ');
    }
  };

  // ── Unified Actionable Items (Priority Ordered: High-Risk Integrity -> Pending Verification -> Document Exceptions)
  const actionableItems = useMemo(() => {
    const items: any[] = [];

    // 1. High/Medium Integrity Reviews
    integrityReviews.forEach((rev) => {
      items.push({
        id: `INT-${rev.tender_id}`,
        category: 'INTEGRITY',
        tender_number: rev.tender_number || rev.tender_id,
        tender_id: rev.tender_id,
        tender_title: rev.title,
        bidder_names: rev.bidders?.join(', ') || 'Participating Vendors',
        risk_level: rev.risk_level || 'HIGH',
        risk_score: rev.risk_score,
        issue: rev.contributing_signals?.length
          ? `${rev.contributing_signals.map(formatSignalLabel).join(', ')} (${rev.findings_count} finding${rev.findings_count > 1 ? 's' : ''})`
          : `${rev.findings_count || 1} integrity signals requiring officer review`,
        action_label: 'Review Integrity',
        action_url: `/integrity?tender=${rev.tender_id}`,
        urgent: rev.risk_level === 'HIGH' || rev.risk_level === 'CRITICAL',
      });
    });

    // 2. Bidders with Discrepancies / High Risk
    bidders
      .filter((b) => b.risk === 'HIGH' || b.status === 'Exception Found' || b.status === 'Disqualified')
      .forEach((b) => {
        items.push({
          id: `EXC-${b.id}`,
          category: 'EXCEPTION',
          tender_number: (b as any).tender_number || 'GEM/2026/B/418207',
          tender_id: (b as any).tender_id || 'TEN-2026-001',
          tender_title: 'Network Infrastructure Modernization',
          bidder_names: b.name,
          risk_level: b.risk || 'HIGH',
          risk_score: b.score,
          issue: 'Cross-document discrepancy / Expired statutory declaration',
          action_label: 'Inspect Evidence',
          action_url: `/verification/${b.id}`,
          urgent: true,
        });
      });

    // 3. Bidders Pending Verification
    bidders
      .filter((b) => b.status === 'Needs Review' || b.status === 'Pending')
      .forEach((b) => {
        items.push({
          id: `VER-${b.id}`,
          category: 'VERIFICATION',
          tender_number: (b as any).tender_number || 'GEM/2026/B/418207',
          tender_id: (b as any).tender_id || 'TEN-2026-001',
          tender_title: 'Network Infrastructure Modernization',
          bidder_names: b.name,
          risk_level: b.risk || 'MEDIUM',
          risk_score: b.score,
          issue: 'Statutory compliance verification & document evaluation pending',
          action_label: 'Start Verification',
          action_url: `/verification/${b.id}`,
          urgent: false,
        });
      });

    return items;
  }, [integrityReviews, bidders]);

  return (
    <div className="space-y-4 font-sans pb-8">
      {/* Top Header Strip */}
      <div className="border-b border-[#CBD5E1] pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <span className="text-[11px] uppercase font-bold text-[#64748B] tracking-wider block">
            {t('page.dashboard.workspace')}
          </span>
          <h1 className="font-serif font-bold text-2xl text-[#0B2A4A] mt-0.5">
            {t('page.dashboard.title')}
          </h1>
          <p className="text-xs text-[#475569] mt-0.5">
            {t('page.dashboard.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/integrity')}
            className="ux4g-btn ux4g-btn-secondary ux4g-btn-md flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-[#0B2A4A]" />
            <span>Integrity Workspace</span>
          </button>
          <button
            onClick={() => navigate('/tenders')}
            className="ux4g-btn ux4g-btn-primary ux4g-btn-md flex items-center gap-1.5 cursor-pointer"
          >
            <FilePlus2 className="w-3.5 h-3.5" />
            <span>{t('action.createTender')}</span>
          </button>
          <button
            onClick={() => navigate('/audit-trail')}
            className="ux4g-btn ux4g-btn-secondary ux4g-btn-md flex items-center gap-1.5 cursor-pointer"
          >
            <ScrollText className="w-3.5 h-3.5 text-[#0B2A4A]" />
            <span>Audit Register</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="ux4g-alert ux4g-alert-error text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#B72025]" />
          <span>Unable to load persistent procurement data: {error}</span>
        </div>
      )}

      {/* ── 1. Summary: 4 Essential KPIs (No Decorative Redundancy) ─────────── */}
      <section
        className="bg-white border border-[#CBD5E1] rounded-[2px] p-3 shadow-xs"
        aria-label="Procurement Key Performance Indicators"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#E2E8F0] text-xs">
          {/* Active Procurements */}
          <div className="px-3 py-1">
            <span className="text-[#64748B] block text-[11px] font-semibold uppercase tracking-wider">
              Active Procurements
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <strong className="text-xl font-bold text-[#0B2A4A] font-mono">
                {String(activeTendersCount).padStart(2, '0')}
              </strong>
              <span className="text-[10px] text-[#64748B]">Active tenders</span>
            </div>
          </div>

          {/* Pending Verification */}
          <div className="px-3 py-1">
            <span className="text-[#64748B] block text-[11px] font-semibold uppercase tracking-wider">
              Pending Verification
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <strong className="text-xl font-bold text-[#0B2A4A] font-mono">
                {String(underVerificationCount).padStart(2, '0')}
              </strong>
              <span className="text-[10px] text-[#64748B]">Bids awaiting review</span>
            </div>
          </div>

          {/* Integrity Reviews */}
          <div className="px-3 py-1">
            <span className="text-[#64748B] block text-[11px] font-semibold uppercase tracking-wider">
              Integrity Reviews
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <strong className="text-xl font-bold text-[#D97706] font-mono">
                {String(integritySummary.reviews_requiring_attention || 0).padStart(2, '0')}
              </strong>
              <span className="text-[10px] text-[#64748B]">Pattern alerts</span>
            </div>
          </div>

          {/* High-Risk Cases */}
          <div className="px-3 py-1">
            <span className="text-[#64748B] block text-[11px] font-semibold uppercase tracking-wider">
              High-Risk Cases
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <strong className="text-xl font-bold text-[#B72025] font-mono">
                {String(highRiskCasesCount).padStart(2, '0')}
              </strong>
              <span className="text-[10px] text-[#B72025] font-semibold">Priority review</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. ATTENTION REQUIRED: Actionable Procurement Queue ─────────────── */}
      <section className="bg-white border border-[#CBD5E1] rounded-[2px] shadow-xs">
        <div className="px-4 py-3 border-b border-[#CBD5E1] bg-[#F8FAFC] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[2px] bg-[#B72025] text-white flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-sm text-[#0B2A4A] flex items-center gap-2">
                <span>Attention Required (Actionable Procurement Queue)</span>
                <span className="px-2 py-0.2 text-[10px] font-bold rounded-[2px] bg-[#FEF2F2] text-[#B72025] border border-[#FCA5A5]">
                  {actionableItems.length} Case{actionableItems.length === 1 ? '' : 's'}
                </span>
              </h2>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                Priority cross-bidder integrity flags, pending statutory document verifications, and compliance exceptions requiring officer action.
              </p>
            </div>
          </div>
        </div>

        {actionableItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="ux4g-table text-xs">
              <thead>
                <tr>
                  <th className="w-[180px]">Tender Identifier</th>
                  <th className="w-[220px]">Bidder / Participating Entities</th>
                  <th className="w-[120px]">Risk Tier</th>
                  <th>Identified Issue / Signal</th>
                  <th className="text-right w-[140px]">Officer Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {actionableItems.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-[#F8FAFC] transition-colors ${
                      item.urgent ? 'bg-[#FFFDFD]' : ''
                    }`}
                  >
                    <td className="font-mono text-xs font-semibold text-[#0B2A4A] align-top">
                      <div>{item.tender_number}</div>
                      <span className="text-[10px] text-[#64748B] font-normal block truncate max-w-[170px]" title={item.tender_title}>
                        {item.tender_title}
                      </span>
                    </td>
                    <td className="align-top">
                      <strong className="text-xs text-[#0F172A] block leading-tight">
                        {item.bidder_names}
                      </strong>
                    </td>
                    <td className="align-top">
                      <div className="flex items-center gap-1.5">
                        {getRiskBadge(item.risk_level)}
                        {item.risk_score != null && (
                          <span className="text-[11px] font-mono text-[#475569] font-bold">
                            {typeof item.risk_score === 'number' ? `${Math.round(item.risk_score)}/100` : ''}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="align-top text-[#334155]">
                      <div className="text-[11px] leading-relaxed">
                        {item.issue}
                      </div>
                    </td>
                    <td className="text-right align-top whitespace-nowrap">
                      <Link
                        to={item.action_url}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-[#0B2A4A] text-white hover:bg-[#123B63] rounded-[2px] transition-colors shadow-2xs"
                      >
                        <span>{item.action_label}</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-[#64748B]">
            <CheckCircle2 className="w-6 h-6 text-[#15803D] mx-auto mb-1.5" />
            <strong className="text-sm text-[#0F172A] block">All Procurements Clear</strong>
            No urgent exceptions or high-risk signals currently pending officer attention. All active procurements are within normal statutory thresholds.
          </div>
        )}
      </section>

      {/* ── 3. RECENT PROCUREMENT: Evaluations & Compliance Register ──────── */}
      <section className="bg-white border border-[#CBD5E1] rounded-[2px] shadow-xs">
        <div className="px-4 py-3 border-b border-[#CBD5E1] bg-[#F8FAFC] flex items-center justify-between">
          <div>
            <h2 className="font-serif font-bold text-sm text-[#0B2A4A]">
              {t('page.dashboard.recentAssessments')}
            </h2>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              Consolidated evaluation register of active bids, compliance scores, and statutory document status.
            </p>
          </div>
          <Link
            to="/tenders"
            className="text-xs font-semibold text-[#0B2A4A] hover:underline flex items-center gap-0.5"
          >
            {t('action.viewTenderRegister')} <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="ux4g-table text-xs">
            <thead>
              <tr>
                <th>{t('th.tenderId')}</th>
                <th>{t('th.tenderTitle')}</th>
                <th>{t('th.status')}</th>
                <th>{t('th.compliance')}</th>
                <th>{t('th.risk')}</th>
                <th className="text-right">{t('th.officerAction')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {bidders.map((b) => (
                <tr key={b.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="font-mono text-xs font-semibold text-[#0B2A4A] whitespace-nowrap">
                    {(b as any).tender_number || 'GEM/2026/B/418207'}
                  </td>
                  <td>
                    <strong className="text-xs text-[#0F172A] block">{b.name}</strong>
                    <span className="text-[11px] text-[#64748B]">
                      Network infrastructure • {b.documents} document{b.documents === 1 ? '' : 's'}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`inline-block px-2 py-0.5 border text-[11px] font-medium rounded-[2px] ${
                        b.status === 'Qualified' || b.status === 'Verified'
                          ? 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]'
                          : b.status === 'Exception Found' || b.status === 'Disqualified'
                          ? 'bg-[#FEF2F2] text-[#B72025] border-[#FCA5A5]'
                          : 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]'
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td>
                    <span className="font-semibold text-xs text-[#0B2A4A] font-mono">
                      {b.score ? `${Math.round(b.score)}/100` : '—'}
                    </span>
                  </td>
                  <td>
                    {getRiskBadge(b.risk)}
                  </td>
                  <td className="text-right whitespace-nowrap">
                    <Link
                      to={`/verification/${b.id}`}
                      className="inline-flex items-center text-xs font-semibold text-[#0B2A4A] hover:underline"
                    >
                      {t('action.reviewEvidence')} →
                    </Link>
                  </td>
                </tr>
              ))}
              {bidders.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-xs text-[#64748B]">
                    No active bidder assessments loaded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── 4. Statutory Advisory Notice (NIC/UX4G Pattern) ─────────────────── */}
      <section className="ux4g-alert ux4g-alert-info rounded-[2px] shadow-xs">
        <ShieldCheck className="w-4 h-4 shrink-0 text-[#1D4ED8] mt-0.5" />
        <div className="leading-relaxed text-xs text-[#1E3A8A]">
          <strong>{t('page.dashboard.decisionNotice')}</strong> {t('page.dashboard.decisionNoticeText')}
        </div>
      </section>
    </div>
  );
};

export default ProcurementDashboard;
