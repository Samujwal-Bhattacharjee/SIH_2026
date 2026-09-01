import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Upload,
  Search,
  Check,
  Clock,
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { useProcurement } from '../context/ProcurementContext';
import { useLanguage } from '../context/LanguageContext';
import { GovPageHeader } from '../components/common/GovPageHeader';

export const Tenders: React.FC = () => {
  const { bidders, addTender, addBidder, error } = useProcurement();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Department of Administrative Reforms');
  const [closingDate, setClosingDate] = useState('2026-08-30');
  const [bidderName, setBidderName] = useState('');
  const [bidderGstin, setBidderGstin] = useState('');
  const [bidderPan, setBidderPan] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const submitTender = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      await addTender(title.trim());
      setStatusMessage(`Tender record created: "${title.trim()}".`);
      setTitle('');
    }
  };

  const submitBidder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bidderName.trim()) {
      await addBidder(bidderName.trim(), bidderGstin.trim() || undefined, bidderPan.trim() || undefined);
      setStatusMessage(`Participating bidder enrolled: "${bidderName.trim()}".`);
      setBidderName('');
      setBidderGstin('');
      setBidderPan('');
    }
  };

  const statutoryRequirements = [
    { id: '1', category: t('page.tenders.catStatutory', 'STATUTORY COMPLIANCE'), name: t('page.tenders.reqGst', 'Valid GST registration'), mandatory: true },
    { id: '2', category: t('page.tenders.catStatutory', 'STATUTORY COMPLIANCE'), name: t('page.tenders.reqPan', 'PAN and Income Tax declaration'), mandatory: true },
    { id: '3', category: t('page.tenders.catGovRec', 'GOVERNMENT RECOGNITION'), name: t('page.tenders.reqUdyam', 'Udyam / MSME registration'), mandatory: false },
    { id: '4', category: t('page.tenders.catTech', 'TECHNICAL ELIGIBILITY'), name: t('page.tenders.reqOem', 'OEM authorization (MAF)'), mandatory: true },
    { id: '5', category: t('page.tenders.catFin', 'FINANCIAL ELIGIBILITY'), name: t('page.tenders.reqTurnover', 'Minimum annual turnover'), mandatory: true },
    { id: '6', category: t('page.tenders.catMandatoryDecl', 'MANDATORY DECLARATION'), name: t('page.tenders.reqDebarment', 'No blacklisting / debarment'), mandatory: true },
    { id: '7', category: t('page.tenders.catPref', 'PREFERENCE ORDER'), name: t('page.tenders.reqLocalContent', 'Local content declaration (Make in India)'), mandatory: false },
  ];

  const filteredBidders = bidders.filter(
    (b) =>
      b.name.toLowerCase().includes(filterSearch.toLowerCase()) ||
      b.id.toLowerCase().includes(filterSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans pb-10 max-w-7xl mx-auto">
      {/* ── Page Header Strip ────────────────────────────────────────────── */}
      <GovPageHeader
        title={t('page.tenders.title', 'Procurement Tenders')}
        tag={t('page.tenders.tag', 'TENDER SPECIFICATION & ENROLLMENT')}
        subtitle={t('page.tenders.subtitle', 'Active government procurement files, statutory compliance status, and registered bidders.')}
        actions={
          <Link
            to="/documents"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2E0854] hover:bg-[#1E053A] text-white rounded-[4px] text-xs font-semibold shadow-xs gov-btn-glossy transition-all"
          >
            <Upload className="w-4 h-4 text-white" />
            <span>{t('page.tenders.uploadBidderDocs', 'Upload Bidder Documents')}</span>
          </Link>
        }
      />

      {statusMessage && (
        <div className="bg-[#F0FDF4] border border-[#BBF7D0] p-3 rounded-[4px] text-xs text-[#15803D] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-[#15803D] underline cursor-pointer text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="bg-[#FEF2F2] border border-[#FCA5A5] p-3 rounded-[4px] text-xs text-[#B72025] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#B72025] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Active Tender Specification Card ──────────────────────────────── */}
      <section className="bg-white border border-[#E5E7EB] rounded-[4px] p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#0F172A]">
                GEM/2026/B/418207
              </span>
              <span className="px-2.5 py-0.5 bg-[#EDE9FE] text-[#6D28D9] rounded-full text-[11px] font-semibold">
                {t('page.tenders.activeTenderBadge', 'Active tender')}
              </span>
            </div>

            <h2 className="font-serif font-bold text-base sm:text-lg text-[#0F172A] mt-2 leading-snug">
              Supply and Installation of Network Infrastructure for Government Administrative Offices
            </h2>

            <p className="text-xs text-[#64748B] mt-1">
              Department of Administrative Reforms • Bid closing: 30 Aug 2026 • Estimated value: ₹4,50,00,000
            </p>
          </div>

          <Link
            to="/documents"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#0F172A] hover:text-[#2E0854] shrink-0 transition-colors"
          >
            <Upload className="w-4 h-4 text-[#0F172A]" />
            <span>{t('page.tenders.uploadBidderDocs', 'Upload bidder documents')}</span>
          </Link>
        </div>
      </section>

      {/* ── Structured Eligibility Criteria (7 Requirements) ───────────────── */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
          {t('page.tenders.structuredCriteria', 'STRUCTURED ELIGIBILITY CRITERIA (7 REQUIREMENTS):')}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {statutoryRequirements.map((req) => (
            <div
              key={req.id}
              className="bg-white border border-[#E5E7EB] rounded-[4px] p-4 shadow-2xs hover:border-[#CBD5E1] transition-colors"
            >
              <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider block">
                {req.category}
              </span>
              <strong className="text-xs font-bold text-[#0F172A] block mt-1.5 leading-snug">
                {req.name}
              </strong>
              <span
                className={`text-[11px] font-semibold block mt-2.5 ${
                  req.mandatory ? 'text-[#DC2626]' : 'text-[#4F46E5]'
                }`}
              >
                {req.mandatory ? t('page.tenders.reqMandatory', 'Mandatory') : t('page.tenders.reqOptional', 'Optional / Preference')}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Two Forms: Create Tender Record & Add Participating Bidder ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Form: Create Tender Record */}
        <section className="bg-white border border-[#E5E7EB] rounded-[4px] p-5 shadow-2xs">
          <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
            <FileText className="w-4 h-4 text-[#0F172A]" />
            <div>
              <h2 className="font-bold text-sm text-[#0F172A]">
                {t('page.tenders.createTenderRecord', 'Create tender record')}
              </h2>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                {t('page.tenders.createTenderDesc', 'Official GeM or CPPP procurement description.')}
              </p>
            </div>
          </div>

          <form onSubmit={submitTender} className="mt-4 space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[#0F172A] mb-1">
                {t('page.tenders.tenderTitleLabel', 'Tender title *')}
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('page.tenders.tenderTitlePlaceholder', 'Enter procurement tender title')}
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-[2px] px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#2E0854]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#0F172A] mb-1">
                  {t('page.tenders.departmentLabel', 'Department *')}
                </label>
                <input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-[2px] px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#2E0854]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#0F172A] mb-1">
                  {t('page.tenders.closingDateLabel', 'Bid closing date *')}
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={closingDate}
                    onChange={(e) => setClosingDate(e.target.value)}
                    className="w-full bg-white border border-[#CBD5E1] rounded-[2px] px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#2E0854]"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="text-xs font-semibold text-[#0F172A] hover:text-[#2E0854] cursor-pointer"
              >
                {t('page.tenders.createRecordBtn', 'Create tender record')}
              </button>
            </div>
          </form>
        </section>

        {/* Right Form: Add Participating Bidder */}
        <section className="bg-white border border-[#E5E7EB] rounded-[4px] p-5 shadow-2xs">
          <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
            <Plus className="w-4 h-4 text-[#0F172A]" />
            <div>
              <h2 className="font-bold text-sm text-[#0F172A]">
                {t('page.tenders.addBidderTitle', 'Add participating bidder')}
              </h2>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                {t('page.tenders.addBidderDesc', 'Name must match statutory registration certificates.')}
              </p>
            </div>
          </div>

          <form onSubmit={submitBidder} className="mt-4 space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[#0F172A] mb-1">
                {t('page.tenders.bidderNameLabel', 'Bidder legal name *')}
              </label>
              <input
                value={bidderName}
                onChange={(e) => setBidderName(e.target.value)}
                placeholder={t('page.tenders.bidderNamePlaceholder', 'Enter legal business entity name')}
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-[2px] px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#2E0854]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#0F172A] mb-1">
                  {t('page.tenders.gstinLabel', 'GSTIN (15 characters)')}
                </label>
                <input
                  value={bidderGstin}
                  onChange={(e) => setBidderGstin(e.target.value)}
                  placeholder="27AABCT4180Q1ZV"
                  className="w-full bg-white border border-[#CBD5E1] rounded-[2px] px-3 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#2E0854]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#0F172A] mb-1">
                  {t('page.tenders.panLabel', 'PAN (10 characters)')}
                </label>
                <input
                  value={bidderPan}
                  onChange={(e) => setBidderPan(e.target.value)}
                  placeholder="AABCT4180Q"
                  className="w-full bg-white border border-[#CBD5E1] rounded-[2px] px-3 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#2E0854]"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-[#0B1536] hover:bg-[#1E053A] text-white rounded-[2px] text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
              >
                {t('page.tenders.enrollBidderBtn', 'Enroll participating bidder')}
              </button>
            </div>
          </form>
        </section>
      </div>

      {/* ── Participating Bidders Register Table ───────────────────────────── */}
      <section className="bg-white border border-[#E5E7EB] rounded-[4px] shadow-2xs overflow-hidden">
        {/* Soft Lavender Header Banner */}
        <div className="bg-[#FAF8FD] p-4 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-base text-[#0F172A]">
              {t('page.tenders.enrolledBiddersTitle', 'Participating bidders register')}
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              {t('page.tenders.subtitle', 'Enrolled bidders, document submission status, compliance scores, and evidence links.')}
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder={t('page.tenders.searchBidderPlaceholder', 'Search enrolled bidder by name or ID...')}
              className="w-full bg-white border border-[#CBD5E1] rounded-[4px] pl-8 pr-3 py-1.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#2E0854]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[#475569]">
                <th className="py-3 px-4 font-semibold w-[120px]">{t('page.tenders.thBidderId', 'BIDDER ID & LEGAL ENTITY')}</th>
                <th className="py-3 px-4 font-semibold">{t('page.tenders.thIdentifiers', 'STATUTORY IDENTIFIERS')}</th>
                <th className="py-3 px-4 font-semibold w-[180px]">{t('page.tenders.thEvidence', 'SUBMITTED EVIDENCE')}</th>
                <th className="py-3 px-4 font-semibold w-[140px]">{t('page.bidderVerification.complianceScore', 'COMPLIANCE SCORE')}</th>
                <th className="py-3 px-4 font-semibold w-[120px]">{t('page.bidderVerification.complianceRisk', 'RISK LEVEL')}</th>
                <th className="py-3 px-4 font-semibold w-[140px]">{t('page.bidderVerification.complianceStatus', 'STATUS')}</th>
                <th className="py-3 px-4 font-semibold text-right w-[160px]">{t('page.tenders.thAction', 'OFFICER ACTION')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filteredBidders.length > 0 ? (
                filteredBidders.map((b) => (
                  <tr key={b.id} className="hover:bg-[#F9FAFB] transition-colors">
                    {/* Bidder ID */}
                    <td className="py-3.5 px-4 font-mono text-xs text-[#0F172A]">
                      {b.id}
                    </td>

                    {/* Legal Entity Name */}
                    <td className="py-3.5 px-4">
                      <strong className="text-xs text-[#1E0A45] block font-bold">
                        {b.name}
                      </strong>
                      <span className="text-[11px] block mt-0.5">
                        {b.exceptions > 0 ? (
                          <span className="text-[#DC2626] font-medium">
                            {b.exceptions} {t('page.bidderVerification.exceptions', 'exception(s) detected')}
                          </span>
                        ) : (
                          <span className="text-[#64748B]">
                            {t('page.bidderVerification.verified', 'All statutory requirements verified')}
                          </span>
                        )}
                      </span>
                    </td>

                    {/* Submitted Documents */}
                    <td className="py-3.5 px-4 text-xs text-[#0F172A]">
                      {b.documents || 0} {t('page.bidderVerification.documents', 'files attached')}
                    </td>

                    {/* Compliance Score */}
                    <td className="py-3.5 px-4 font-bold text-sm text-[#0F172A] font-mono">
                      {b.score ? `${Math.round(b.score)}/100` : '—'}
                    </td>

                    {/* Risk Level */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#15803D]">
                        <Check className="w-3.5 h-3.5 text-[#15803D]" />
                        <span>{t('status.lowRisk', 'Low')}</span>
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-0.5 text-xs font-medium rounded-[2px] bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
                        {b.status === 'UNDER_REVIEW' || b.status === 'Under Review'
                          ? t('status.underReview', 'Under Review')
                          : b.status === 'QUALIFIED' || b.status === 'Qualified'
                          ? t('status.qualified', 'Qualified')
                          : b.status === 'DISQUALIFIED' || b.status === 'Disqualified'
                          ? t('status.disqualified', 'Disqualified')
                          : b.status || t('status.underReview', 'Under Review')}
                      </span>
                    </td>

                    {/* Action Link */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Link
                        to={`/verification/${b.id}`}
                        className="text-xs font-semibold text-[#2E0854] hover:underline inline-flex items-center gap-0.5"
                      >
                        <span>{t('page.hub.verifyBidder', 'Open assessment')}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-[#64748B]">
                    No participating bidders enrolled yet. Add a bidder above to begin compliance verification.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Tenders;
