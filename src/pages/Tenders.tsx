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
    { id: '1', category: 'STATUTORY COMPLIANCE', name: 'Valid GST registration', mandatory: true },
    { id: '2', category: 'STATUTORY COMPLIANCE', name: 'PAN and Income Tax declaration', mandatory: true },
    { id: '3', category: 'GOVERNMENT RECOGNITION', name: 'Udyam / MSME registration', mandatory: false },
    { id: '4', category: 'TECHNICAL ELIGIBILITY', name: 'OEM authorization (MAF)', mandatory: true },
    { id: '5', category: 'FINANCIAL ELIGIBILITY', name: 'Minimum annual turnover', mandatory: true },
    { id: '6', category: 'MANDATORY DECLARATION', name: 'No blacklisting / debarment', mandatory: true },
    { id: '7', category: 'PREFERENCE ORDER', name: 'Local content declaration (Make in India)', mandatory: false },
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
        tag="TENDER SPECIFICATION & ENROLLMENT"
        subtitle={t('page.tenders.subtitle', 'Active government procurement files, statutory compliance status, and registered bidders.')}
        actions={
          <Link
            to="/documents"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2E0854] hover:bg-[#1E053A] text-white rounded-[4px] text-xs font-semibold shadow-xs gov-btn-glossy transition-all"
          >
            <Upload className="w-4 h-4 text-white" />
            <span>{t('action.uploadDoc', 'Upload Bidder Documents')}</span>
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
                Active tender
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
            <span>Upload bidder documents</span>
          </Link>
        </div>
      </section>

      {/* ── Structured Eligibility Criteria (7 Requirements) ───────────────── */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
          STRUCTURED ELIGIBILITY CRITERIA (7 REQUIREMENTS):
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
                {req.mandatory ? 'Mandatory' : 'Optional / Preference'}
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
                Create tender record
              </h2>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                Official GeM or CPPP procurement description.
              </p>
            </div>
          </div>

          <form onSubmit={submitTender} className="mt-4 space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[#0F172A] mb-1">
                Tender title *
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter procurement tender title"
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-[2px] px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#2E0854]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#0F172A] mb-1">
                  Department *
                </label>
                <input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-[2px] px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#2E0854]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#0F172A] mb-1">
                  Bid closing date *
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
                Create tender record
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
                Add participating bidder
              </h2>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                Name must match statutory registration certificates.
              </p>
            </div>
          </div>

          <form onSubmit={submitBidder} className="mt-4 space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[#0F172A] mb-1">
                Bidder legal name *
              </label>
              <input
                value={bidderName}
                onChange={(e) => setBidderName(e.target.value)}
                placeholder="Enter bidder registered legal entity name"
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-[2px] px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#2E0854]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#0F172A] mb-1">
                  GSTIN (Optional)
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
                  PAN (Optional)
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
                Enroll bidder in tender
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
              Participating bidders register
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Enrolled bidders, document submission status, compliance scores, and evidence links.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="Search bidder ID or name..."
              className="w-full bg-white border border-[#CBD5E1] rounded-[4px] pl-8 pr-3 py-1.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#2E0854]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[#475569]">
                <th className="py-3 px-4 font-semibold w-[120px]">Bidder ID</th>
                <th className="py-3 px-4 font-semibold">Legal entity name</th>
                <th className="py-3 px-4 font-semibold w-[180px]">Submitted documents</th>
                <th className="py-3 px-4 font-semibold w-[140px]">Compliance score</th>
                <th className="py-3 px-4 font-semibold w-[120px]">Risk level</th>
                <th className="py-3 px-4 font-semibold w-[140px]">Status</th>
                <th className="py-3 px-4 font-semibold text-right w-[160px]">Action</th>
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
                            {b.exceptions} exception(s) detected
                          </span>
                        ) : (
                          <span className="text-[#64748B]">
                            All statutory requirements verified
                          </span>
                        )}
                      </span>
                    </td>

                    {/* Submitted Documents */}
                    <td className="py-3.5 px-4 text-xs text-[#0F172A]">
                      {b.documents || 0} files attached
                    </td>

                    {/* Compliance Score */}
                    <td className="py-3.5 px-4 font-bold text-sm text-[#0F172A] font-mono">
                      {b.score ? `${Math.round(b.score)}/100` : '—'}
                    </td>

                    {/* Risk Level */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#15803D]">
                        <Check className="w-3.5 h-3.5 text-[#15803D]" />
                        <span>Low</span>
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-0.5 text-xs font-medium rounded-[2px] bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
                        {b.status || 'Under Review'}
                      </span>
                    </td>

                    {/* Action Link */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Link
                        to={`/verification/${b.id}`}
                        className="text-xs font-semibold text-[#2E0854] hover:underline inline-flex items-center gap-0.5"
                      >
                        <span>Open assessment</span>
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
