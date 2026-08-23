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

export const ProcurementDashboard: React.FC = () => {
  const { bidders, audit, refreshData } = useProcurement();
  const [tendersCount, setTendersCount] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    refreshData();
    // Fetch live tenders count from API if available
    const fetchTenders = async () => {
      try {
        if ((apiClient as any).procurement?.getTenders) {
          const tenders = await (apiClient as any).procurement.getTenders();
          if (Array.isArray(tenders) && tenders.length > 0) {
            setTendersCount(tenders.length);
          }
        }
      } catch (e) {
        console.warn('Dashboard tenders fetch note:', e);
      }
    };
    fetchTenders();
  }, []);

  const activeTendersCount = tendersCount;
  const underVerificationCount = bidders.filter((b) => b.status === 'Under Review' || b.status === 'Exception Found' || b.status === 'Pending Documents').length;
  const highRiskCount = bidders.filter((b) => b.risk === 'HIGH' || b.risk === 'CRITICAL').length;
  const pendingDocsCount = bidders.filter((b) => b.status.includes('Pending') || b.documents === 0).length;
  const totalExceptionsCount = bidders.reduce((acc, b) => acc + (b.exceptions || (b.discrepancies?.length || 0)), 0);

  return (
    <div className="space-y-4 font-sans pb-8">
      {/* Top Header Strip */}
      <div className="border-b border-[#D9DDE3] pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <span className="text-[11px] uppercase font-semibold text-[#475569] tracking-wider block">
            Procurement Officer Workspace
          </span>
          <h1 className="font-serif font-bold text-2xl text-[#0B2A4A] mt-0.5">
            Procurement Compliance Dashboard
          </h1>
          <p className="text-xs text-[#475569] mt-0.5">
            Procurement compliance assessment • Prototype / Demonstration • SIH26100
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/tenders')}
            className="px-3 py-1.5 bg-[#0B2A4A] hover:bg-[#123B63] text-white text-xs font-semibold rounded-[2px] border border-[#0B2A4A] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FilePlus2 className="w-3.5 h-3.5" />
            <span>Create tender</span>
          </button>
          <button
            onClick={() => navigate('/documents')}
            className="px-3 py-1.5 bg-white hover:bg-[#F0F4F8] text-[#0B2A4A] text-xs font-semibold rounded-[2px] border border-[#CBD2DE] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-[#0B2A4A]" />
            <span>Upload document</span>
          </button>
        </div>
      </div>

      {/* Horizontal Operational Statistics Strip (UX4G Government Pattern) */}
      <section
        className="bg-white border border-[#D9DDE3] rounded-[2px] px-4 py-2.5 shadow-none"
        aria-label="Summary Statistics"
      >
        <div className="flex flex-wrap items-center justify-between gap-y-2 divide-x divide-[#E6E9EF] text-xs">
          <div className="pr-4 py-0.5">
            <span className="text-[#475569] block text-[11px]">Active tenders</span>
            <strong className="text-base font-semibold text-[#0B2A4A] font-mono">
              {String(activeTendersCount).padStart(2, '0')}
            </strong>
          </div>

          <div className="px-4 py-0.5">
            <span className="text-[#475569] block text-[11px]">Under verification</span>
            <strong className="text-base font-semibold text-[#0B2A4A] font-mono">
              {String(underVerificationCount).padStart(2, '0')}
            </strong>
          </div>

          <div className="px-4 py-0.5">
            <span className="text-[#475569] block text-[11px]">High risk</span>
            <strong className="text-base font-semibold text-[#B72025] font-mono">
              {String(highRiskCount).padStart(2, '0')}
            </strong>
          </div>

          <div className="px-4 py-0.5">
            <span className="text-[#475569] block text-[11px]">Pending documents</span>
            <strong className="text-base font-semibold text-[#D97706] font-mono">
              {String(pendingDocsCount).padStart(2, '0')}
            </strong>
          </div>

          <div className="pl-4 py-0.5">
            <span className="text-[#475569] block text-[11px]">Exceptions identified</span>
            <strong className="text-base font-semibold text-[#B72025] font-mono">
              {String(totalExceptionsCount).padStart(2, '0')}
            </strong>
          </div>
        </div>
      </section>

      {/* Main Operational Grid: Assessments Table + Administrative Work Queue */}
      <div className="grid lg:grid-cols-3 gap-4 items-start">
        {/* Left 2 Cols: Recent Tender Assessments Table */}
        <section className="lg:col-span-2 bg-white border border-[#D9DDE3] rounded-[2px]">
          <div className="px-4 py-3 border-b border-[#D9DDE3] flex items-center justify-between">
            <div>
              <h2 className="font-serif font-bold text-sm text-[#0B2A4A]">
                Recent tender assessments
              </h2>
              <p className="text-[11px] text-[#475569] mt-0.5">
                Compliance status is evidence-backed and requires officer review before final qualification.
              </p>
            </div>
            <Link
              to="/tenders"
              className="text-xs font-semibold text-[#0B2A4A] hover:underline flex items-center gap-0.5"
            >
              View tender register <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="gov-table">
              <thead>
                <tr>
                  <th>Tender ID</th>
                  <th>Tender title / bidder</th>
                  <th>Status</th>
                  <th>Compliance</th>
                  <th>Risk</th>
                  <th className="text-right">Officer action</th>
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
                        Review evidence →
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
          <section className="border border-[#FDE68A] bg-[#FFFBEB] p-3.5 rounded-[2px]">
            <div className="flex items-start gap-2 text-[#92400E]">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-[#D97706]" />
              <div>
                <h2 className="font-bold text-xs uppercase tracking-wide text-[#92400E]">
                  Attention required
                </h2>
                <p className="text-xs font-semibold text-[#202124] mt-1">
                  Narmada Systems &amp; Services Pvt. Ltd.
                </p>
                <ul className="text-[11px] text-[#78350F] list-disc list-inside mt-1.5 space-y-0.5">
                  <li>Legal-name inconsistency across documents</li>
                  <li>Udyam registration certificate missing</li>
                  <li>OEM authorization letter expired</li>
                </ul>
                <Link
                  to="/verification/BID-002"
                  className="inline-block mt-2.5 text-xs font-semibold text-[#92400E] underline hover:text-[#78350F]"
                >
                  Review exception details →
                </Link>
              </div>
            </div>
          </section>

          {/* Verification Activity Work Queue */}
          <section className="bg-white border border-[#D9DDE3] rounded-[2px]">
            <div className="p-3 border-b border-[#D9DDE3] flex items-center justify-between">
              <h2 className="font-serif font-bold text-xs text-[#0B2A4A] uppercase tracking-wide flex items-center gap-1.5">
                <ClipboardList className="w-3.5 h-3.5 text-[#0B2A4A]" />
                Verification activity
              </h2>
              <span className="text-[10px] text-[#475569] font-mono">Work queue</span>
            </div>

            <div className="divide-y divide-[#E6E9EF]">
              {audit.slice(0, 4).map((item) => (
                <div key={item.id} className="p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <strong className="text-xs text-[#202124] font-medium">{item.action}</strong>
                    <span className="font-mono text-[10px] text-[#475569]">{item.time}</span>
                  </div>
                  <p className="text-[11px] text-[#475569] mt-0.5 leading-relaxed">{item.detail}</p>
                </div>
              ))}
            </div>

            <div className="p-2.5 bg-[#F8F9FA] border-t border-[#D9DDE3] text-right">
              <Link
                to="/audit-trail"
                className="text-xs font-semibold text-[#0B2A4A] hover:underline"
              >
                Open audit trail →
              </Link>
            </div>
          </section>
        </aside>
      </div>

      {/* Institutional Decision-Support Notice */}
      <section className="border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-2.5 rounded-[2px] flex items-start gap-2 text-xs text-[#1E3A8A]">
        <ShieldCheck className="w-4 h-4 shrink-0 text-[#1D4ED8] mt-0.5" />
        <div className="leading-relaxed">
          <strong>Decision-support notice:</strong> System-generated compliance assessment based on submitted bidder documents and Sandbox verification adapters. Final qualification or disqualification decision rests strictly with the designated Procurement Officer.
        </div>
      </section>
    </div>
  );
};

export default ProcurementDashboard;
