import React, { useState } from 'react';
import { ShieldCheck, Search, Filter, Lock, Download, Printer } from 'lucide-react';
import { useProcurement } from '../context/ProcurementContext';
import { useLanguage } from '../context/LanguageContext';

export const ProcurementAuditTrail: React.FC = () => {
  const { audit } = useProcurement();
  const { t } = useLanguage();
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
      <div className="border-b border-[#CBD5E1] pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <span className="text-[11px] uppercase font-bold text-[#64748B] tracking-wider block">
            {t('page.audit.workspace')}
          </span>
          <h1 className="font-serif font-bold text-2xl text-[#0B2A4A] mt-0.5">
            {t('page.audit.title')}
          </h1>
          <p className="text-xs text-[#475569] mt-0.5">
            {t('page.audit.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="ux4g-btn ux4g-btn-secondary ux4g-btn-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t('page.audit.printRegister')}</span>
          </button>
          <span className="px-2.5 py-1 bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0] rounded-[2px] font-mono text-[11px] font-bold flex items-center gap-1">
            <Lock className="w-3 h-3" /> SHA-256 Validated
          </span>
        </div>
      </div>

      {/* Tender Specification Strip */}
      <section className="bg-white border border-[#CBD5E1] rounded-[2px] p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#15803D] shrink-0" />
          <div>
            <span className="font-mono text-xs font-bold text-[#0B2A4A]">TENDER: GEM/2026/B/418207</span>
            <span className="text-xs text-[#64748B] block">
              Supply and Installation of Network Infrastructure for Government Administrative Offices
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-2.5 top-2" />
            <input
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder={t('page.audit.searchPlaceholder')}
              className="ux4g-input pl-8"
            />
          </div>

            <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="border border-[#CBD5E1] px-2 py-1 text-xs rounded-[2px] bg-white text-[#0F172A] font-medium"
          >
            <option value="ALL">{t('page.audit.allActions')}</option>
            <option value="Upload">{t('page.audit.uploads')}</option>
            <option value="Verification">{t('page.audit.verifications')}</option>
            <option value="Decision">{t('page.audit.officerDecisions')}</option>
          </select>
        </div>
      </section>

      {/* Official Audit Register Table */}
      <section className="bg-white border border-[#CBD5E1] rounded-[2px] shadow-xs">
        <div className="p-3 border-b border-[#CBD5E1] bg-[#F8FAFC] flex items-center justify-between">
          <h2 className="font-serif font-bold text-sm text-[#0B2A4A]">
            {t('page.audit.registerEntries')} ({filteredAudit.length})
          </h2>
          <span className="text-[10px] text-[#64748B] font-mono">
            {t('page.audit.systemTimestamp')}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="ux4g-table">
            <thead>
              <tr>
                <th>{t('th.timestamp')}</th>
                <th>{t('th.userActor')}</th>
                <th>{t('th.action')}</th>
                <th>{t('th.entitySubject')}</th>
                <th>{t('th.resultDetails')}</th>
                <th>{t('th.status')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredAudit.map((event) => (
                <tr key={event.id}>
                  <td className="font-mono text-[11px] text-[#475569] whitespace-nowrap">
                    {event.time}
                  </td>
                  <td>
                    <strong className="text-xs text-[#0F172A] block font-semibold">{event.actor}</strong>
                    <span className="text-[10px] text-[#64748B]">Operations Officer</span>
                  </td>
                  <td>
                    <span className="font-semibold text-xs text-[#0B2A4A]">{event.action}</span>
                  </td>
                  <td className="font-mono text-xs text-[#0F172A]">
                    GEM/2026/B/418207
                  </td>
                  <td>
                    <p className="text-[11px] text-[#334155] leading-relaxed max-w-md">
                      {event.detail}
                    </p>
                    <span className="font-mono text-[9px] text-[#64748B] block mt-0.5">
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
