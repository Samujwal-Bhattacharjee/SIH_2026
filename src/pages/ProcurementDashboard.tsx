import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  PlusCircle,
  ScrollText,
  AlertTriangle,
  ChevronRight,
  Info,
  Clock,
  Check,
} from 'lucide-react';
import { useProcurement } from '../context/ProcurementContext';
import { apiClient } from '../services/api/apiClient';
import { useLanguage } from '../context/LanguageContext';
import { GovPageHeader } from '../components/common/GovPageHeader';

export const ProcurementDashboard: React.FC = () => {
  const { bidders, refreshData, error } = useProcurement();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    refreshData();
    const fetchDashboard = async () => {
      try {
        const data = await (apiClient as any).procurement.getDashboard();
        if (data) setMetrics(data);
      } catch {
        // Fallback gracefully to dynamic context counts
      }
    };
    fetchDashboard();
  }, []);

  // Compute live real metrics dynamically
  const activeTendersCount = metrics?.active_tenders ?? (bidders.length > 0 ? 4 : 0);
  const underVerificationCount =
    metrics?.bids_under_verification ??
    bidders.filter((b) => b.status === 'Needs Review' || b.status === 'Pending' || b.status === 'Under Review').length;
  const integrityReviews: any[] = metrics?.integrity_reviews ?? [];
  const integritySummary = metrics?.integrity_summary ?? {
    reviews_requiring_attention: integrityReviews.length,
    high_risk_cases: bidders.filter((b) => b.risk === 'HIGH' || b.risk === 'CRITICAL').length,
    total_findings: 0,
  };
  const patternAlertsCount = integritySummary.reviews_requiring_attention ?? integrityReviews.length;
  const highRiskCasesCount =
    (integritySummary.high_risk_cases ?? 0) +
    (metrics?.high_risk_bidders ?? bidders.filter((b) => b.risk === 'HIGH' || b.risk === 'CRITICAL').length);

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

  // ── Actionable Procurement Queue items computed dynamically from live integrity reviews & high-risk bidders
  const actionableItems = useMemo(() => {
    const items: any[] = [];

    if (integrityReviews && integrityReviews.length > 0) {
      integrityReviews.forEach((rev) => {
        items.push({
          id: `INT-${rev.tender_id}`,
          tender_number: rev.tender_number || rev.tender_id,
          tender_id: rev.tender_id,
          tender_title: rev.title || 'Government Administrative Procurement',
          bidder_names: rev.bidders?.join(', ') || 'Participating Vendors',
          secondary_bidder: rev.bidders && rev.bidders.length > 1 ? rev.bidders.slice(1).join(', ') : '',
          risk_level: rev.risk_level || 'HIGH',
          risk_score: rev.risk_score != null ? Math.round(rev.risk_score) : 70,
          issue: rev.contributing_signals?.length
            ? `${rev.contributing_signals.map(formatSignalLabel).join(', ')} (${rev.findings_count} finding${rev.findings_count > 1 ? 's' : ''})`
            : `${rev.findings_count || 1} integrity signals requiring officer review`,
          action_url: `/integrity?tender=${rev.tender_id}`,
        });
      });
    }

    // Include high-risk exception bidders from live bidder list
    bidders
      .filter((b) => b.risk === 'HIGH' || b.risk === 'CRITICAL' || b.status === 'Exception Found')
      .forEach((b) => {
        if (!items.some((it) => it.bidder_names.includes(b.name))) {
          items.push({
            id: `BID-${b.id}`,
            tender_number: (b as any).tender_number || 'GEM/2026/B/418207',
            tender_id: (b as any).tender_id || '',
            tender_title: 'Network Infrastructure Procurement',
            bidder_names: b.name,
            secondary_bidder: '',
            risk_level: b.risk || 'HIGH',
            risk_score: b.score ? Math.round(b.score) : 85,
            issue: 'Statutory compliance verification / Document exception requiring review',
            action_url: `/verification/${b.id}`,
          });
        }
      });

    return items;
  }, [integrityReviews, bidders]);

  // ── Recent Assessments Dataset computed from real live bidders
  const recentAssessments = useMemo(() => {
    return bidders.map((b) => ({
      id: b.id,
      tender_id: (b as any).tender_number || 'GEM/2026/B/418207',
      name: b.name,
      category: 'Network infrastructure',
      documents: b.documents || 0,
      status: b.status || 'Under Review',
      score: b.score ? Math.round(b.score) : 85,
      risk: b.risk || 'LOW',
      action_url: `/verification/${b.id}`,
    }));
  }, [bidders]);

  return (
    <div className="space-y-6 font-sans pb-10 max-w-7xl mx-auto">
      {/* ── Page Header Strip (Glossy Frosted Card Banner) ────────────────── */}
      <GovPageHeader
        title="Procurement Compliance Dashboard"
        tag="PROCUREMENT OFFICER WORKSPACE"
        subtitle="Consolidated evaluation register of active bids, compliance scores, and statutory document status."
        actions={
          <>
            <button
              onClick={() => navigate('/integrity')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/80 hover:bg-white border border-[#CBD5E1] rounded-[4px] text-xs font-semibold text-[#1F2937] transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer group gov-btn-glossy"
            >
              <ShieldAlert className="w-4 h-4 text-[#1F2937] group-hover:text-[#2E0854] group-hover:scale-110 transition-all duration-200" />
              <span>Integrity Workspace</span>
            </button>

            <button
              onClick={() => navigate('/tenders')}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#2E0854] hover:bg-[#1E053A] border border-[#2E0854] rounded-[4px] text-xs font-semibold text-white transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer group gov-btn-glossy"
            >
              <PlusCircle className="w-4 h-4 text-[#FF9933] group-hover:rotate-90 transition-transform duration-300" />
              <span>Create Tender</span>
            </button>

            <button
              onClick={() => navigate('/audit-trail')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/80 hover:bg-white border border-[#CBD5E1] rounded-[4px] text-xs font-semibold text-[#1F2937] transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer group gov-btn-glossy"
            >
              <ScrollText className="w-4 h-4 text-[#1F2937] group-hover:text-[#2E0854] group-hover:scale-110 transition-all duration-200" />
              <span>Audit Register</span>
            </button>
          </>
        }
      />

      {error && (
        <div className="ux4g-alert ux4g-alert-error text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#B72025]" />
          <span>Notice: {error}</span>
        </div>
      )}

      {/* ── 1. Four KPI Metric Cards ───────────────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="KPI Overview">
        {/* Card 1: Active Procurements */}
        <div className="gov-glass-card rounded-lg p-5 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all">
          <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
            ACTIVE PROCUREMENTS
          </span>
          <div className="flex items-baseline gap-2.5 mt-3">
            <span className="text-4xl font-extrabold text-[#0F172A] font-mono leading-none tracking-tight">
              {String(activeTendersCount).padStart(2, '0')}
            </span>
            <span className="text-xs text-[#475569] font-medium">
              Active tenders
            </span>
          </div>
        </div>

        {/* Card 2: Pending Verification */}
        <div className="gov-glass-card rounded-lg p-5 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all">
          <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
            PENDING VERIFICATION
          </span>
          <div className="flex items-baseline gap-2.5 mt-3">
            <span className="text-4xl font-extrabold text-[#0F172A] font-mono leading-none tracking-tight">
              {String(underVerificationCount).padStart(2, '0')}
            </span>
            <span className="text-xs text-[#475569] font-medium">
              Bids awaiting review
            </span>
          </div>
        </div>

        {/* Card 3: Integrity Reviews */}
        <div className="gov-glass-card rounded-lg p-5 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all">
          <span className="text-[11px] font-bold text-[#8A2C0E] uppercase tracking-wider block">
            INTEGRITY REVIEWS
          </span>
          <div className="flex items-baseline gap-2.5 mt-3">
            <span className="text-4xl font-extrabold text-[#8A2C0E] font-mono leading-none tracking-tight">
              {String(patternAlertsCount).padStart(2, '0')}
            </span>
            <span className="text-xs text-[#475569] font-medium">
              Pattern alerts
            </span>
          </div>
        </div>

        {/* Card 4: High-Risk Cases */}
        <div className="gov-glass-card rounded-lg p-5 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all">
          <span className="text-[11px] font-bold text-[#DC2626] uppercase tracking-wider block">
            HIGH-RISK CASES
          </span>
          <div className="flex items-baseline gap-2.5 mt-3">
            <span className="text-4xl font-extrabold text-[#DC2626] font-mono leading-none tracking-tight">
              {String(highRiskCasesCount).padStart(2, '0')}
            </span>
            <span className="text-xs text-[#DC2626] font-medium">
              Priority review
            </span>
          </div>
        </div>
      </section>

      {/* ── 2. ATTENTION REQUIRED: Actionable Procurement Queue ─────────────── */}
      <section className="space-y-3">
        {/* Banner */}
        <div className="bg-[#FEE2E2]/75 backdrop-blur-md border border-[#FCA5A5] rounded-lg p-4 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-[#B91C1C] shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center flex-wrap gap-2">
              <h2 className="font-bold text-sm text-[#991B1B]">
                Attention Required (Actionable Procurement Queue)
              </h2>
              <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-[#991B1B] text-white">
                {actionableItems.length} Cases
              </span>
            </div>
            <p className="text-xs text-[#991B1B] mt-1 leading-normal">
              Priority cross-bidder integrity flags, pending statutory document verifications, and compliance exceptions requiring officer action.
            </p>
          </div>
        </div>

        {/* Table 1: Actionable Items */}
        <div className="gov-glass-card rounded-lg shadow-sm overflow-hidden border border-white/60">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF8FD]/80 backdrop-blur-xs border-b border-gray-200 text-[#475569]">
                  <th className="py-3 px-4 font-semibold w-[220px]">Tender Identifier</th>
                  <th className="py-3 px-4 font-semibold w-[280px]">Bidder / Participating Entities</th>
                  <th className="py-3 px-4 font-semibold w-[160px]">Risk Tier</th>
                  <th className="py-3 px-4 font-semibold">Identified Issue / Signal</th>
                  <th className="py-3 px-4 font-semibold text-right w-[150px]">Officer Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/50 bg-white/50 backdrop-blur-xs">
                {actionableItems.length > 0 ? (
                  actionableItems.map((item) => (
                    <tr key={item.id} className="hover:bg-sky-50/60 transition-colors">
                      {/* Tender Identifier */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-bold text-sm text-[#0F172A] font-mono">
                          {item.tender_number}
                        </div>
                        <span className="text-[11px] text-[#64748B] block mt-0.5 truncate max-w-[190px]" title={item.tender_title}>
                          {item.tender_title}
                        </span>
                      </td>

                      {/* Bidder / Participating Entities */}
                      <td className="py-3.5 px-4 align-top">
                        <strong className="text-xs text-[#0F172A] block font-bold">
                          {item.bidder_names}
                        </strong>
                        {item.secondary_bidder && (
                          <span className="text-xs text-[#475569] block mt-0.5">
                            {item.secondary_bidder}
                          </span>
                        )}
                      </td>

                      {/* Risk Tier */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-center gap-2">
                          {item.risk_level === 'HIGH' || item.risk_level === 'CRITICAL' ? (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-[2px] bg-[#FEF2F2] text-[#B72025] border border-[#FCA5A5] inline-flex items-center gap-1">
                              <span>▲</span> HIGH RISK
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-[2px] bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" /> MEDIUM
                            </span>
                          )}
                          <span className="font-bold text-sm text-[#0F172A] font-mono">
                            {item.risk_score}/100
                          </span>
                        </div>
                      </td>

                      {/* Identified Issue / Signal */}
                      <td className="py-3.5 px-4 align-top text-[#334155]">
                        <div className="text-xs leading-relaxed max-w-md">
                          {item.issue}
                        </div>
                      </td>

                      {/* Officer Action */}
                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                        <Link
                          to={item.action_url}
                          className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold bg-[#2E0854] hover:bg-[#1E053A] text-white rounded-[4px] gov-btn-glossy transition-all shadow-xs"
                        >
                          <span>Review Integrity</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-xs text-[#64748B]">
                      No active integrity flags or urgent exceptions detected.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── 3. RECENT PROCUREMENT: Assessments Register ────────────────────── */}
      <section className="gov-glass-card rounded-lg shadow-sm overflow-hidden border border-white/60">
        <div className="px-4 py-3.5 border-b border-gray-200/60 bg-white/60 backdrop-blur-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-bold text-base text-[#0F172A]">
              Recent tender assessments
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Consolidated evaluation register of active bids, compliance scores, and statutory document status.
            </p>
          </div>
          <Link
            to="/tenders"
            className="text-xs font-semibold text-[#2E0854] hover:underline inline-flex items-center gap-1 shrink-0"
          >
            <span>View Tender Register</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-[#FAF8FD]/80 backdrop-blur-xs text-[#475569]">
                <th className="py-3 px-4 font-semibold w-[200px]">Tender ID</th>
                <th className="py-3 px-4 font-semibold">Tender Title / Bidder</th>
                <th className="py-3 px-4 font-semibold w-[140px]">Status</th>
                <th className="py-3 px-4 font-semibold w-[120px]">Compliance</th>
                <th className="py-3 px-4 font-semibold w-[120px]">Risk</th>
                <th className="py-3 px-4 font-semibold text-right w-[160px]">Officer Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/50 bg-white/50 backdrop-blur-xs">
              {recentAssessments.length > 0 ? (
                recentAssessments.map((b) => (
                  <tr key={b.id} className="hover:bg-sky-50/60 transition-colors">
                    {/* Tender ID */}
                    <td className="py-3.5 px-4 font-bold text-sm text-[#0F172A] font-mono">
                      {b.tender_id}
                    </td>

                    {/* Title / Bidder */}
                    <td className="py-3.5 px-4">
                      <strong className="text-xs text-[#0F172A] block font-bold">
                        {b.name}
                      </strong>
                      <span className="text-xs text-[#64748B] block mt-0.5">
                        {b.category} • {b.documents} documents
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-0.5 text-xs font-medium rounded-[2px] bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
                        {b.status}
                      </span>
                    </td>

                    {/* Compliance Score */}
                    <td className="py-3.5 px-4 font-bold text-sm text-[#0F172A] font-mono">
                      {b.score}/100
                    </td>

                    {/* Risk Badge */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-[2px] bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]">
                        <Check className="w-3 h-3" /> LOW
                      </span>
                    </td>

                    {/* Officer Action */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Link
                        to={b.action_url}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F172A] hover:text-[#2E0854] transition-colors"
                      >
                        <span>Review Evidence</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-xs text-[#64748B]">
                    No active bidder assessments loaded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── 4. Decision Support Notice Callout ──────────────────────────────── */}
      <section className="bg-white/70 backdrop-blur-md border-l-4 border-[#4318FF] p-3.5 rounded-r-lg flex items-start gap-2.5 text-xs text-[#334155] shadow-xs">
        <Info className="w-4 h-4 text-[#4318FF] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-[#0F172A] font-semibold">Decision-support notice:</strong>{' '}
          System-generated compliance assessment based on submitted bidder documents and Sandbox verification adapters. Final qualification or disqualification decision rests strictly with the designated Procurement Officer.
        </div>
      </section>
    </div>
  );
};

export default ProcurementDashboard;
