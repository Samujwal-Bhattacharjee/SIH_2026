import React, { useState } from 'react';
import { ShieldCheck, Search, Filter, Lock, Download, Printer } from 'lucide-react';
import { useProcurement } from '../context/ProcurementContext';

export const ProcurementAuditTrail: React.FC = () => {
  const { audit } = useProcurement();
  const [filterText, setFilterText] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const filteredAudit = audit.filter((e) => {
    const matchesSearch =
      e.action.toLowerCase().includes(filterText.toLowerCase()) ||
      e.detail.toLowerCase().includes(filterText.toLowerCase()) ||
      e.actor.toLowerCase().includes(filterText.toLowerCase());
    const matchesAction = actionFilter === 'ALL' || e.action.toLowerCase().includes(actionFilter.toLowerCase());
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-4 font-sans pb-8">
      {/* Header */}
      <div className="border-b border-[#D9DDE3] pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <span className="text-[11px] uppercase font-semibold text-[#475569] tracking-wider block">
            Tamper-Evident Activity Register
          </span>
          <h1 className="font-serif font-bold text-2xl text-[#0B2A4A] mt-0.5">
            Procurement Audit Trail
          </h1>
          <p className="text-xs text-[#475569] mt-0.5">
            Chronological log of document uploads, automated OCR extractions, compliance findings, and officer decisions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-white hover:bg-[#F0F4F8] text-[#0B2A4A] border border-[#CBD2DE] text-xs font-semibold rounded-[2px] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print register</span>
          </button>
          <span className="px-2.5 py-1 bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0] rounded-[2px] font-mono text-[11px] font-semibold flex items-center gap-1">
            <Lock className="w-3 h-3" /> SHA-256 Validated
          </span>
        </div>
      </div>

      {/* Tender Specification Strip */}
      <section className="bg-white border border-[#D9DDE3] rounded-[2px] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#15803D] shrink-0" />
          <div>
            <span className="font-mono text-xs font-bold text-[#0B2A4A]">TENDER: GEM/2026/B/418207</span>
            <span className="text-xs text-[#475569] block">
              Supply and Installation of Network Infrastructure for Government Administrative Offices
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-[#475569] absolute left-2.5 top-2" />
            <input
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Search action or user..."
              className="w-full pl-8 pr-2.5 py-1 border border-[#CBD2DE] text-xs rounded-[2px] focus:outline-[#0B2A4A]"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="border border-[#CBD2DE] px-2 py-1 text-xs rounded-[2px] bg-white text-[#202124]"
          >
            <option value="ALL">All actions</option>
            <option value="Upload">Uploads</option>
            <option value="Verification">Verifications</option>
            <option value="Decision">Officer decisions</option>
          </select>
        </div>
      </section>

      {/* Official Audit Register Table */}
      <section className="bg-white border border-[#D9DDE3] rounded-[2px]">
        <div className="p-3 border-b border-[#D9DDE3] flex items-center justify-between">
          <h2 className="font-serif font-bold text-sm text-[#0B2A4A]">
            Audit register entries ({filteredAudit.length})
          </h2>
          <span className="text-[10px] text-[#475569] font-mono">
            System timestamp: Asia/Kolkata (IST)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User / Actor</th>
                <th>Action</th>
                <th>Entity / Subject</th>
                <th>Result &amp; Details</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredAudit.map((event) => (
                <tr key={event.id}>
                  <td className="font-mono text-[11px] text-[#475569] whitespace-nowrap">
                    {event.time}
                  </td>
                  <td>
                    <strong className="text-xs text-[#202124] block">{event.actor}</strong>
                    <span className="text-[10px] text-[#475569]">Operations Officer</span>
                  </td>
                  <td>
                    <span className="font-semibold text-xs text-[#0B2A4A]">{event.action}</span>
                  </td>
                  <td className="font-mono text-xs text-[#202124]">
                    GEM/2026/B/418207
                  </td>
                  <td>
                    <p className="text-[11px] text-[#334155] leading-relaxed max-w-md">
                      {event.detail}
                    </p>
                    <span className="font-mono text-[9px] text-[#475569] block mt-0.5">
                      Event ID: {event.id}
                    </span>
                  </td>
                  <td>
                    <span className="gov-badge gov-badge-success text-[10px]">
                      [✓] Success
                    </span>
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

export default ProcurementAuditTrail;
