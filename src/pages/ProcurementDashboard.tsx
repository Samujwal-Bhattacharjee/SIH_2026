import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  ScrollText,
  AlertTriangle,
  ChevronRight,
  Info,
  Clock,
  Check,
} from 'lucide-react';
import { useProcurement } from '../context/ProcurementContext';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api/apiClient';
import { useLanguage } from '../context/LanguageContext';
import { GovPageHeader } from '../components/common/GovPageHeader';
import { getValidAuthToken } from '../services/api/realApi';

export const ProcurementDashboard: React.FC = () => {
  const { bidders, audit, isLiveDatabase, tenders, tenderId, error } = useProcurement();
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState<any>(null);

  // Fetch dashboard-specific metrics (KPI endpoint).
  useEffect(() => {
    let mounted = true;
    const hasToken = !!getValidAuthToken();
    if (!isAuthenticated && !hasToken) return;
    const fetchDashboard = async () => {
      try {
        const data = await (apiClient as any).procurement.getDashboard();
        if (mounted && data) setMetrics(data);
      } catch (err) {
        console.error('Failed to fetch procurement dashboard metrics:', err);
      }
    };
    fetchDashboard();
    return () => { mounted = false; };
  }, [isAuthenticated]);

  // Compute live real metrics dynamically without arbitrary fake fallbacks
  const activeTendersCount = metrics?.active_tenders ?? tenders.filter((t) => !t.status || t.status.toUpperCase() === 'ACTIVE').length;
  const underVerificationCount =
    metrics?.bids_under_verification ??
    bidders.filter((b) => b.status === 'Needs Review' || b.status === 'Pending' || b.status === 'Under Review' || b.complianceStatus === 'UNDER_REVIEW').length;
  const integrityReviews: any[] = metrics?.integrity_reviews ?? [];
  const integritySummary = metrics?.integrity_summary ?? {
    reviews_requiring_attention: integrityReviews.length,
    high_risk_cases: 0,
    total_findings: 0,
  };
  const patternAlertsCount = integritySummary.reviews_requiring_attention ?? integrityReviews.length;
  const complianceExceptionsCount =
    metrics?.compliance_exceptions ??
    bidders.filter((b) => b.complianceStatus === 'EXCEPTION_FOUND' || b.blockingExceptions > 0 || b.risk === 'HIGH' || b.risk === 'CRITICAL').length;

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

  // Effective bidders: context bidders take precedence; fallback seamlessly to metrics.bidders
  const effectiveBidders = useMemo(() => {
    if (bidders && bidders.length > 0) return bidders;
    if (metrics?.bidders && metrics.bidders.length > 0) {
      return metrics.bidders.map((b: any) => ({
        id: b.id,
        name: b.legal_name || b.name,
        tender_id: b.tender_id,
        score: b.compliance_score ?? b.score ?? 70,
        complianceScore: b.compliance_score ?? b.score ?? 70,
        risk: (b.risk_level || b.risk || 'MEDIUM').toUpperCase() as any,
        complianceRisk: (b.risk_level || b.risk || 'MEDIUM').toUpperCase() as any,
        status: b.status || 'Under Review',
        complianceStatus: b.compliance_status || (b.blocking_exceptions_count > 0 ? 'EXCEPTION_FOUND' : 'UNDER_REVIEW'),
        documents: b.documents_count ?? b.documents ?? 0,
        exceptions: b.exceptions_count ?? b.exceptions ?? 0,
        blockingExceptions: b.blocking_exceptions_count ?? b.blockingExceptions ?? 0,
        requirements: [],
        officerDecision: b.officer_decision,
        officerNote: b.officer_note,
        integrityRisk: (b.integrity_risk || 'LOW').toUpperCase() as any,
      }));
    }
    return [];
  }, [bidders, metrics?.bidders]);

  // ── Actionable Procurement Queue items computed dynamically from live integrity reviews & high-risk bidders
  const actionableItems = useMemo(() => {
    const items: any[] = [];

    if (integrityReviews && integrityReviews.length > 0) {
      integrityReviews.forEach((rev: any) => {
        items.push({
          id: rev.id,
          tender_number: rev.tender_id || 'TENDER-REF',
          tender_id: rev.tender_id || '',
          tender_title: rev.tender_title || 'Active Procurement Tender',
          bidder_names: rev.bidder_name || '',
          secondary_bidder: rev.contributing_signals?.[0] ? formatSignalLabel(rev.contributing_signals[0]) : '',
          risk_level: rev.risk_level || 'HIGH',
          risk_score: rev.risk_score || 80,
          issue: rev.summary || rev.description || 'Integrity anomaly pattern detected',
          action_url: `/procurement/integrity?tender=${rev.tender_id || ''}&finding=${rev.id}`,
        });
      });
    }

    // Include high-risk exception bidders from live bidder list
    effectiveBidders
      .filter((b: any) => b.risk === 'HIGH' || b.risk === 'CRITICAL' || b.status === 'Exception Found' || b.complianceStatus === 'EXCEPTION_FOUND')
      .forEach((b: any) => {
        if (!items.some((it) => (it.bidder_names || '').includes(b.name))) {
          const tMatch = tenders.find((t) => t.id === (b as any).tender_id || t.id === tenderId);
          items.push({
            id: `BID-${b.id}`,
            tender_number: (b as any).tender_number || tMatch?.id || tenderId || 'TENDER-REF',
            tender_id: (b as any).tender_id || tMatch?.id || tenderId || '',
            tender_title: tMatch?.title || 'Active Procurement Tender',
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
  }, [integrityReviews, effectiveBidders, tenders, tenderId]);

  // ── Recent Assessments Dataset computed from real live bidders
  const recentAssessments = useMemo(() => {
    return effectiveBidders.map((b: any) => {
      const tMatch = tenders.find((t) => t.id === (b as any).tender_id || t.id === tenderId);
      return {
        id: b.id,
        tender_id: (b as any).tender_number || tMatch?.id || tenderId || 'TENDER-REF',
        name: b.name,
        category: tMatch?.category || 'Procurement',
        documents: b.documents || 0,
        status: b.status || 'Under Review',
        compliance_status: b.complianceStatus || (b.blockingExceptions > 0 ? 'EXCEPTION_FOUND' : 'UNDER_REVIEW'),
        score: b.complianceScore !== undefined ? b.complianceScore : b.score,
        compliance_risk: (b.complianceRisk || b.risk || 'MEDIUM').toUpperCase(),
        integrity_risk: (b.integrityRisk || 'LOW').toUpperCase(),
        officer_decision: b.officerDecision,
        blocking_exceptions: b.blockingExceptions,
        action_url: `/verification/${b.id}`,
      };
    });
  }, [effectiveBidders, tenders, tenderId]);

  return (
    <div className="space-y-6 font-sans pb-10 max-w-7xl mx-auto">
      {/* ── Page Header Strip (Glossy Frosted Card Banner) ────────────────── */}
      {/* ── Page Header Strip (Glossy Frosted Card Banner) ────────────────── */}
      <GovPageHeader
        title={t('page.dashboard.title', 'Procurement Compliance Dashboard')}
        tag={t('page.dashboard.tag', 'PROCUREMENT OFFICER WORKSPACE')}
        subtitle={t('page.dashboard.subtitle', 'Consolidated evaluation register of active bids, compliance scores, and statutory document status.')}
        actions={
          <>
            <button
              onClick={() => navigate('/integrity')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/80 hover:bg-white border border-[#CBD5E1] rounded-[4px] text-xs font-semibold text-[#1F2937] transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-pointer group gov-btn-glossy"
            >
              <ShieldAlert className="w-4 h-4 text-[#1F2937] group-hover:text-[#2E0854] group-hover:scale-110 transition-all duration-200" />
              <span>{t('page.dashboard.integrityWorkspace', 'Integrity Workspace')}</span>
            </button>

            <button
              onClick={() => navigate('/audit-trail')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/80 hover:bg-white border border-[#CBD5E1] rounded-[4px] text-xs font-semibold text-[#1F2937] transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer group gov-btn-glossy"
            >
              <ScrollText className="w-4 h-4 text-[#1F2937] group-hover:text-[#2E0854] group-hover:scale-110 transition-all duration-200" />
              <span>{t('page.dashboard.auditRegister', 'Audit Register')}</span>
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
            {t('page.dashboard.activeTenders', 'Active Procurements')}
          </span>
          <div className="flex items-baseline gap-2.5 mt-3">
            <span className="text-4xl font-extrabold text-[#0F172A] font-mono leading-none tracking-tight">
              {String(activeTendersCount).padStart(2, '0')}
            </span>
            <span className="text-xs text-[#475569] font-medium">
              {t('page.dashboard.activeTenders', 'Active tenders')}
            </span>
          </div>
        </div>

        {/* Card 2: Pending Verification */}
        <div className="gov-glass-card rounded-lg p-5 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all">
          <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
            {t('page.dashboard.underVerification', 'Pending Verification')}
          </span>
          <div className="flex items-baseline gap-2.5 mt-3">
            <span className="text-4xl font-extrabold text-[#0F172A] font-mono leading-none tracking-tight">
              {String(underVerificationCount).padStart(2, '0')}
            </span>
            <span className="text-xs text-[#475569] font-medium">
              {t('page.dashboard.underVerification', 'Bids awaiting review')}
            </span>
          </div>
        </div>

        {/* Card 3: Integrity Reviews */}
        <div className="gov-glass-card rounded-lg p-5 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all">
          <span className="text-[11px] font-bold text-[#8A2C0E] uppercase tracking-wider block">
            {t('page.dashboard.patternAlerts', 'Integrity Reviews')}
          </span>
          <div className="flex items-baseline gap-2.5 mt-3">
            <span className="text-4xl font-extrabold text-[#8A2C0E] font-mono leading-none tracking-tight">
              {String(patternAlertsCount).padStart(2, '0')}
            </span>
            <span className="text-xs text-[#475569] font-medium">
              {t('page.dashboard.patternAlerts', 'Pattern alerts')}
            </span>
          </div>
        </div>

        {/* Card 4: Compliance Exceptions */}
        <div className="gov-glass-card rounded-lg p-5 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all">
          <span className="text-[11px] font-bold text-[#DC2626] uppercase tracking-wider block">
            {t('page.dashboard.complianceExceptions', 'Compliance Exceptions')}
          </span>
          <div className="flex items-baseline gap-2.5 mt-3">
            <span className="text-4xl font-extrabold text-[#DC2626] font-mono leading-none tracking-tight">
              {String(complianceExceptionsCount).padStart(2, '0')}
            </span>
            <span className="text-xs text-[#DC2626] font-medium">
              {t('page.dashboard.complianceExceptions', 'Mandatory exceptions')}
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
                {t('page.dashboard.actionableQueue', 'Attention Required (Actionable Procurement Queue)')}
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
                  <th className="py-3 px-4 font-semibold w-[220px]">{t('page.hub.thTenderFile', 'Tender Identifier')}</th>
                  <th className="py-3 px-4 font-semibold w-[280px]">{t('page.hub.thBidderEntity', 'Bidder / Participating Entities')}</th>
                  <th className="py-3 px-4 font-semibold w-[160px]">{t('page.bidderVerification.complianceRisk', 'Risk Tier')}</th>
                  <th className="py-3 px-4 font-semibold">{t('page.bidderVerification.detailedFinding', 'Identified Issue / Signal')}</th>
                  <th className="py-3 px-4 font-semibold text-right w-[150px]">{t('page.tenders.thAction', 'Officer Action')}</th>
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
                              <span>▲</span> {t('status.highRisk', 'HIGH RISK')}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-[2px] bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {t('status.mediumRisk', 'MEDIUM')}
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
                          <span>{t('page.hub.verifyBidder', 'Review Integrity')}</span>
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
              {t('page.dashboard.recentAssessments', 'Recent tender assessments')}
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              {t('page.dashboard.recentAssessmentsDesc', 'Consolidated evaluation register of active bids, compliance scores, and statutory document status.')}
            </p>
          </div>
          <Link
            to="/tenders"
            className="text-xs font-semibold text-[#2E0854] hover:underline inline-flex items-center gap-1 shrink-0"
          >
            <span>{t('page.bidderVerification.backToTender', 'View Tender Register')}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-[#FAF8FD]/80 backdrop-blur-xs text-[#475569]">
                <th className="py-3 px-4 font-semibold w-[160px]">{t('page.hub.thTenderFile', 'Tender ID')}</th>
                <th className="py-3 px-4 font-semibold">{t('page.hub.thBidderEntity', 'Tender Title / Bidder')}</th>
                <th className="py-3 px-4 font-semibold w-[180px]">{t('page.hub.thComplianceStatus', 'Compliance Evaluation')}</th>
                <th className="py-3 px-4 font-semibold w-[130px]">{t('page.bidderVerification.complianceRisk', 'Compliance Risk')}</th>
                <th className="py-3 px-4 font-semibold w-[130px]">{t('page.bidderVerification.officerDecision', 'Officer Decision')}</th>
                <th className="py-3 px-4 font-semibold text-right w-[140px]">{t('page.tenders.thAction', 'Officer Action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/50 bg-white/50 backdrop-blur-xs">
              {recentAssessments.length > 0 ? (
                recentAssessments.map((b: any) => (
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
                      {b.blocking_exceptions > 0 ? (
                        <span className="text-[10px] font-semibold text-[#B72025] inline-flex items-center gap-1 mt-0.5">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          {b.blocking_exceptions} {t('page.bidderVerification.exceptions', 'blocking exception(s)')}
                        </span>
                      ) : (
                        <span className="text-xs text-[#64748B] block mt-0.5">
                          {b.category} • {b.documents} {t('page.bidderVerification.documents', 'documents')}
                        </span>
                      )}
                    </td>

                    {/* Compliance Evaluation (Score + Status) */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#0F172A] font-mono">
                          {b.score}/100
                        </span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 border rounded-[2px] ${
                          b.compliance_status === 'COMPLIANT'
                            ? 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]'
                            : b.compliance_status === 'EXCEPTION_FOUND'
                            ? 'bg-[#FEF2F2] text-[#B72025] border-[#FCA5A5]'
                            : 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]'
                        }`}>
                          {b.compliance_status === 'COMPLIANT'
                            ? t('status.qualified', 'Compliant')
                            : b.compliance_status === 'EXCEPTION_FOUND'
                            ? t('status.exceptionFound', 'Exception Found')
                            : b.compliance_status === 'PENDING_DOCUMENTS'
                            ? t('status.pendingDocs', 'Pending Docs')
                            : t('status.underReview', 'Under Review')}
                        </span>
                      </div>
                    </td>

                    {/* Compliance Risk Badge */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-[2px] border ${
                        b.compliance_risk === 'HIGH' || b.compliance_risk === 'CRITICAL'
                          ? 'bg-[#FEF2F2] text-[#B72025] border-[#FCA5A5]'
                          : b.compliance_risk === 'MEDIUM'
                          ? 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]'
                          : 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]'
                      }`}>
                        {b.compliance_risk === 'HIGH' || b.compliance_risk === 'CRITICAL' ? (
                          <AlertTriangle className="w-3 h-3" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                        {b.compliance_risk === 'HIGH' || b.compliance_risk === 'CRITICAL'
                          ? t('status.highRisk', 'HIGH')
                          : b.compliance_risk === 'MEDIUM'
                          ? t('status.mediumRisk', 'MEDIUM')
                          : t('status.lowRisk', 'LOW')}
                      </span>
                    </td>

                    {/* Officer Decision */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-[2px] border ${
                        b.officer_decision === 'QUALIFIED'
                          ? 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]'
                          : b.officer_decision === 'DISQUALIFIED'
                          ? 'bg-[#FEF2F2] text-[#B72025] border-[#FCA5A5]'
                          : 'bg-white text-[#475569] border-[#CBD5E1]'
                      }`}>
                        {b.officer_decision === 'QUALIFIED'
                          ? t('status.qualified', 'Qualified')
                          : b.officer_decision === 'DISQUALIFIED'
                          ? t('status.disqualified', 'Disqualified')
                          : b.officer_decision || t('status.pending', 'Pending')}
                      </span>
                    </td>

                    {/* Officer Action */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Link
                        to={b.action_url}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F172A] hover:text-[#2E0854] transition-colors"
                      >
                        <span>{t('page.bidderVerification.viewEvidence', 'Review Evidence')}</span>
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
          <strong className="text-[#0F172A] font-semibold">{t('page.dashboard.decisionNotice', 'Decision-support notice:')}</strong>{' '}
          {t('page.dashboard.decisionNoticeText', 'System-generated compliance assessment based on submitted bidder documents and Sandbox verification adapters. Final qualification or disqualification decision rests strictly with the designated Procurement Officer.')}
        </div>
      </section>
    </div>
  );
};

export default ProcurementDashboard;
