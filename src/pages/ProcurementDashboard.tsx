import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FilePlus2,
  Upload,
  ShieldCheck,
  AlertTriangle,
  ClipboardList,
  ChevronRight,
  Info,
} from 'lucide-react';
import { useProcurement } from '../context/ProcurementContext';
import { apiClient } from '../services/api/apiClient';
import { useLanguage } from '../context/LanguageContext';

export const ProcurementDashboard: React.FC = () => {
  const { bidders, audit, refreshData, error } = useProcurement();
  const { t } = useLanguage();
  const [metrics, setMetrics] = useState({ active_tenders: 0, bids_under_verification: 0, completed_assessments: 0, high_risk_bidders: 0, pending_documents: 0, verification_exceptions: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    refreshData();
    const fetchDashboard = async () => {
      try {
        setMetrics(await (apiClient as any).procurement.getDashboard());
      } catch {
        // ProcurementContext exposes the live API error; do not replace it with static metrics.
      }
    };
    fetchDashboard();
  }, []);

  const activeTendersCount = metrics.active_tenders;
  const underVerificationCount = metrics.bids_under_verification;
  const highRiskCount = metrics.high_risk_bidders;
  const pendingDocsCount = metrics.pending_documents;
  const totalExceptionsCount = metrics.verification_exceptions;

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
            onClick={() => navigate('/tenders')}
            className="ux4g-btn ux4g-btn-primary ux4g-btn-md flex items-center gap-1.5 cursor-pointer"
          >
            <FilePlus2 className="w-3.5 h-3.5" />
            <span>{t('action.createTender')}</span>
          </button>
          <button
            onClick={() => navigate('/documents')}
            className="ux4g-btn ux4g-btn-secondary ux4g-btn-md flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-[#0B2A4A]" />
            <span>{t('action.uploadDoc')}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="ux4g-alert ux4g-alert-error text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#B72025]" />
          <span>Unable to load persistent procurement data: {error}</span>
        </div>
      )}

      {/* Horizontal Operational Statistics Strip (UX4G Government Pattern) */}
      <section
        className="bg-white border border-[#CBD5E1] rounded-[2px] px-4 py-3 shadow-xs"
        aria-label="Summary Statistics"
      >
        <div className="flex flex-wrap items-center justify-between gap-y-2 divide-x divide-[#E2E8F0] text-xs">
          <div className="pr-4 py-0.5">
            <span className="text-[#64748B] block text-[11px] font-medium">{t('stat.activeTenders')}</span>
            <strong className="text-base font-bold text-[#0B2A4A] font-mono">
              {String(activeTendersCount).padStart(2, '0')}
            </strong>
          </div>

          <div className="px-4 py-0.5">
            <span className="text-[#64748B] block text-[11px] font-medium">{t('stat.underVerification')}</span>
            <strong className="text-base font-bold text-[#0B2A4A] font-mono">
              {String(underVerificationCount).padStart(2, '0')}
            </strong>
          </div>

          <div className="px-4 py-0.5">
            <span className="text-[#64748B] block text-[11px] font-medium">{t('stat.highRisk')}</span>
            <strong className="text-base font-bold text-[#B72025] font-mono">
              {String(highRiskCount).padStart(2, '0')}
            </strong>
          </div>

          <div className="px-4 py-0.5">
            <span className="text-[#64748B] block text-[11px] font-medium">{t('stat.pendingDocuments')}</span>
            <strong className="text-base font-bold text-[#D97706] font-mono">
              {String(pendingDocsCount).padStart(2, '0')}
            </strong>
          </div>

          <div className="pl-4 py-0.5">
            <span className="text-[#64748B] block text-[11px] font-medium">{t('stat.exceptionsIdentified')}</span>
            <strong className="text-base font-bold text-[#B72025] font-mono">
              {String(totalExceptionsCount).padStart(2, '0')}
            </strong>
          </div>
        </div>
      </section>

      {/* Main Operational Grid: Assessments Table + Administrative Work Queue */}
      <div className="grid lg:grid-cols-3 gap-4 items-start">
        {/* Left 2 Cols: Recent Tender Assessments Table */}
        <section className="lg:col-span-2 bg-white border border-[#CBD5E1] rounded-[2px] shadow-xs">
          <div className="px-4 py-3 border-b border-[#CBD5E1] bg-[#F8FAFC] flex items-center justify-between">
            <div>
              <h2 className="font-serif font-bold text-sm text-[#0B2A4A]">
                {t('page.dashboard.recentAssessments')}
              </h2>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                {t('page.dashboard.recentAssessmentsDesc')}
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
            <table className="ux4g-table">
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
              <tbody>
                {bidders.map((b) => (
                  <tr key={b.id}>
                    <td className="font-mono text-xs font-semibold text-[#0B2A4A]">
                      GEM/2026/B/418207
                    </td>
                    <td>
                      <strong className="text-xs text-[#202124] block">{b.name}</strong>
                      <span className="text-[11px] text-[#475569]">
                        Network infrastructure • {b.documents} documents
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
                      <span className="font-semibold text-xs text-[#0B2A4A]">
                        {b.score ? `${b.score}/100` : '—'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`inline-block px-1.5 py-0.5 border text-[10px] font-bold rounded-[2px] ${
                          b.risk === 'HIGH' || b.risk === 'CRITICAL'
                            ? 'bg-[#FEF2F2] text-[#B72025] border-[#FCA5A5]'
                            : b.risk === 'MEDIUM'
                            ? 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]'
                            : 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]'
                        }`}
                      >
                        {b.risk === 'HIGH' ? '[!] High' : b.risk === 'MEDIUM' ? '[!] Medium' : '[✓] Low'}
                      </span>
                    </td>
                    <td className="text-right">
                      <Link
                        to={`/verification/${b.id}`}
                        className="inline-flex items-center text-xs font-semibold text-[#0B2A4A] hover:underline"
                      >
                        {t('action.reviewEvidence')} →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right Column: Work Queue & Attention Required */}
        <aside className="space-y-4">
          {/* Attention Required Panel */}
          <section className="ux4g-alert ux4g-alert-warning rounded-[2px] shadow-xs">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-[#D97706]" />
            <div>
              <h2 className="font-bold text-xs uppercase tracking-wide text-[#92400E]">
                {t('page.dashboard.attentionRequired')}
              </h2>
              <p className="text-xs font-semibold text-[#0F172A] mt-1">
                Narmada Systems &amp; Services Pvt. Ltd.
              </p>
              <ul className="text-[11px] text-[#78350F] list-disc list-inside mt-1.5 space-y-0.5">
                <li>Legal-name inconsistency across documents</li>
                <li>Udyam registration certificate missing</li>
                <li>OEM authorization letter expired</li>
              </ul>
              <Link
                to="/verification/BID-002"
                className="inline-block mt-2.5 text-xs font-semibold underline hover:text-[#78350F] text-[#92400E]"
              >
                {t('page.dashboard.reviewExceptions')} →
              </Link>
            </div>
          </section>

          {/* Verification Activity Work Queue */}
          <section className="bg-white border border-[#CBD5E1] rounded-[2px] shadow-xs">
            <div className="p-3 border-b border-[#CBD5E1] bg-[#F8FAFC] flex items-center justify-between">
              <h2 className="font-serif font-bold text-xs text-[#0B2A4A] uppercase tracking-wide flex items-center gap-1.5">
                <ClipboardList className="w-3.5 h-3.5 text-[#0B2A4A]" />
                {t('page.dashboard.verificationActivity')}
              </h2>
              <span className="text-[10px] text-[#64748B] font-mono">{t('page.dashboard.workQueue')}</span>
            </div>

            <div className="divide-y divide-[#E2E8F0]">
              {audit.slice(0, 4).map((item) => (
                <div key={item.id} className="p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <strong className="text-xs text-[#0F172A] font-semibold">{item.action}</strong>
                    <span className="font-mono text-[10px] text-[#64748B]">{item.time}</span>
                  </div>
                  <p className="text-[11px] text-[#475569] mt-0.5 leading-relaxed">{item.detail}</p>
                </div>
              ))}
            </div>

            <div className="p-2.5 bg-[#F8FAFC] border-t border-[#CBD5E1] text-right">
              <Link
                to="/audit-trail"
                className="text-xs font-semibold text-[#0B2A4A] hover:underline"
              >
                {t('action.openAuditTrail')} →
              </Link>
            </div>
          </section>
        </aside>
      </div>

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
