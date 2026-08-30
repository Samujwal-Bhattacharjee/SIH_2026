import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FilePlus2,
  Plus,
  ScanLine,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  FolderKanban,
  Building2,
  Calendar,
} from 'lucide-react';
import { useProcurement } from '../context/ProcurementContext';

export const Tenders: React.FC = () => {
  const { bidders, addTender, addBidder } = useProcurement();
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Department of Administrative Reforms');
  const [closingDate, setClosingDate] = useState('2026-08-30');
  const [estimatedValue, setEstimatedValue] = useState('4,50,00,000');
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
    { id: '1', name: 'Valid GST registration', category: 'Statutory compliance', mandatory: true },
    { id: '2', name: 'PAN and Income Tax declaration', category: 'Statutory compliance', mandatory: true },
    { id: '3', name: 'Udyam / MSME registration', category: 'Government recognition', mandatory: false },
    { id: '4', name: 'OEM authorization (MAF)', category: 'Technical eligibility', mandatory: true },
    { id: '5', name: 'Minimum annual turnover', category: 'Financial eligibility', mandatory: true },
    { id: '6', name: 'No blacklisting / debarment', category: 'Mandatory declaration', mandatory: true },
    { id: '7', name: 'Local content declaration (Make in India)', category: 'Preference order', mandatory: false },
  ];

  const filteredBidders = bidders.filter(
    (b) =>
      b.name.toLowerCase().includes(filterSearch.toLowerCase()) ||
      b.id.toLowerCase().includes(filterSearch.toLowerCase())
  );

  return (
    <div className="space-y-4 font-sans pb-8">
      {/* Header */}
      <div className="border-b border-[#D9DDE3] pb-3">
        <span className="text-[11px] uppercase font-semibold text-[#475569] tracking-wider block">
          Tender Register &amp; Bidder Management
        </span>
        <h1 className="font-serif font-bold text-2xl text-[#0B2A4A] mt-0.5">
          Tender Compliance Workspace
        </h1>
        <p className="text-xs text-[#475569] mt-0.5">
          Define tender criteria, enroll participating bidders, and initiate document verification workflows.
        </p>
      </div>

      {statusMessage && (
        <div className="gov-alert gov-alert-success text-xs">
          <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
          <span className="flex-1">{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="text-[#15803D] text-xs underline cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* Active Tender Specification */}
      <section className="bg-white border border-[#D9DDE3] rounded-[2px]">
        <div className="p-4 border-b border-[#D9DDE3] flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-[#F8F9FA]">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#0B2A4A] bg-white px-2 py-0.5 border border-[#CBD2DE]">
                GEM/2026/B/418207
              </span>
              <span className="px-2 py-0.5 bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] rounded-[2px] text-[10px] font-bold">
                Active tender
              </span>
            </div>
            <h2 className="font-serif font-bold text-base text-[#0B2A4A] mt-1.5">
              Supply and Installation of Network Infrastructure for Government Administrative Offices
            </h2>
            <p className="text-xs text-[#475569] mt-0.5">
              Department of Administrative Reforms • Bid closing: 30 Aug 2026 • Estimated value: ₹4,50,00,000
            </p>
          </div>

          <Link
            to="/documents"
            className="px-3 py-1.5 bg-[#0B2A4A] hover:bg-[#123B63] text-white text-xs font-semibold rounded-[2px] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <ScanLine className="w-3.5 h-3.5" />
            <span>Upload bidder documents</span>
          </Link>
        </div>

        {/* Structured Eligibility Rules Strip */}
        <div className="p-4">
          <span className="text-[11px] uppercase font-semibold text-[#475569] block mb-2">
            Structured eligibility criteria (7 requirements):
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {statutoryRequirements.map((req) => (
              <div key={req.id} className="p-2.5 bg-[#F5F5F5] border border-[#D9DDE3] rounded-[2px] text-xs">
                <span className="text-[10px] uppercase font-semibold text-[#737373] block">
                  {req.category}
                </span>
                <strong className="text-[#0B2A4A] text-xs block mt-0.5">
                  {req.name}
                </strong>
                <span className={`text-[10px] font-semibold mt-1 block ${req.mandatory ? 'text-[#B72025]' : 'text-[#15803D]'}`}>
                  {req.mandatory ? 'Mandatory' : 'Optional / Preference'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Forms Section: Create Tender & Add Bidder */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Create Tender Form */}
        <form onSubmit={submitTender} className="bg-white border border-[#D9DDE3] p-4 rounded-[2px]">
          <h2 className="font-serif font-bold text-sm text-[#0B2A4A] flex items-center gap-1.5 border-b border-[#E6E9EF] pb-2">
            <FilePlus2 className="w-4 h-4 text-[#0B2A4A]" />
            Create tender record
          </h2>

          <div className="mt-3 space-y-2.5">
            <div>
              <label className="block text-xs font-semibold text-[#202124] mb-0.5">
                Tender title *
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter procurement tender title"
                className="w-full border border-[#CBD2DE] px-2.5 py-1.5 text-xs rounded-[2px] focus:outline-[#0B2A4A]"
              />
              <span className="text-[10px] text-[#475569] block mt-0.5">
                Official GeM or CPPP procurement description.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-0.5">
                  Department *
                </label>
                <input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full border border-[#CBD2DE] px-2.5 py-1.5 text-xs rounded-[2px] focus:outline-[#0B2A4A]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-0.5">
                  Bid closing date *
                </label>
                <input
                  type="date"
                  value={closingDate}
                  onChange={(e) => setClosingDate(e.target.value)}
                  className="w-full border border-[#CBD2DE] px-2.5 py-1.5 text-xs rounded-[2px] focus:outline-[#0B2A4A]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-1 px-3 py-1.5 bg-[#0B2A4A] hover:bg-[#123B63] text-white text-xs font-semibold rounded-[2px] transition-colors cursor-pointer"
            >
              Create tender record
            </button>
          </div>
        </form>

        {/* Add Bidder Form */}
        <form onSubmit={submitBidder} className="bg-white border border-[#D9DDE3] p-4 rounded-[2px]">
          <h2 className="font-serif font-bold text-sm text-[#0B2A4A] flex items-center gap-1.5 border-b border-[#E6E9EF] pb-2">
            <Plus className="w-4 h-4 text-[#0B2A4A]" />
            Add participating bidder
          </h2>

          <div className="mt-3 space-y-2.5">
            <div>
              <label className="block text-xs font-semibold text-[#202124] mb-0.5">
                Bidder legal name *
              </label>
              <input
                value={bidderName}
                onChange={(e) => setBidderName(e.target.value)}
                placeholder="Enter bidder registered legal entity name"
                className="w-full border border-[#CBD2DE] px-2.5 py-1.5 text-xs rounded-[2px] focus:outline-[#0B2A4A]"
              />
              <span className="text-[10px] text-[#475569] block mt-0.5">
                Name must match statutory registration certificates.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-0.5">
                  GSTIN (Optional)
                </label>
                <input
                  value={bidderGstin}
                  onChange={(e) => setBidderGstin(e.target.value)}
                  placeholder="27AABCT4180Q1ZV"
                  className="w-full border border-[#CBD2DE] px-2.5 py-1.5 text-xs rounded-[2px] font-mono focus:outline-[#0B2A4A]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-0.5">
                  PAN (Optional)
                </label>
                <input
                  value={bidderPan}
                  onChange={(e) => setBidderPan(e.target.value)}
                  placeholder="AABCT4180Q"
                  className="w-full border border-[#CBD2DE] px-2.5 py-1.5 text-xs rounded-[2px] font-mono focus:outline-[#0B2A4A]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-1 px-3 py-1.5 bg-[#0B2A4A] hover:bg-[#123B63] text-white text-xs font-semibold rounded-[2px] transition-colors cursor-pointer"
            >
              Enroll bidder in tender
            </button>
          </div>
        </form>
      </div>

      {/* Participating Bidders Register Table */}
      <section className="bg-white border border-[#D9DDE3] rounded-[2px]">
        <div className="p-3 border-b border-[#D9DDE3] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-serif font-bold text-sm text-[#0B2A4A]">
              Participating bidders register
            </h2>
            <p className="text-[11px] text-[#475569]">
              Enrolled bidders, document submission status, compliance scores, and evidence links.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#475569] absolute left-2.5 top-2.5" />
            <input
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="Search bidder ID or name..."
              className="w-full pl-8 pr-3 py-1.5 border border-[#CBD2DE] text-xs rounded-[2px] focus:outline-[#0B2A4A]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Bidder ID</th>
                <th>Legal entity name</th>
                <th>Submitted documents</th>
                <th>Compliance score</th>
                <th>Risk level</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredBidders.map((b) => (
                <tr key={b.id}>
                  <td className="font-mono text-xs font-semibold text-[#0B2A4A]">
                    {b.id}
                  </td>
                  <td>
                    <strong className="text-xs text-[#202124] block">{b.name}</strong>
                    <span className="text-[11px] text-[#475569]">
                      {b.exceptions > 0 ? `${b.exceptions} exception(s) detected` : 'All statutory requirements verified'}
                    </span>
                  </td>
                  <td>
                    <span className="text-xs text-[#202124] font-medium">
                      {b.documents} files attached
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
                  <td className="text-right">
                    <Link
                      to={`/verification/${b.id}`}
                      className="inline-flex items-center text-xs font-semibold text-[#0B2A4A] hover:underline"
                    >
                      Open assessment →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Tenders;
