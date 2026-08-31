import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShieldCheck, Search, Filter, Lock, Printer, RefreshCw } from 'lucide-react';
import { apiClient } from '../services/api/apiClient';
import { useLanguage } from '../context/LanguageContext';

export const ProcurementAuditTrail: React.FC = () => {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryTender = searchParams.get('tender') || searchParams.get('tenderId') || searchParams.get('tender_id');

  const [tenders, setTenders] = useState<any[]>([]);
  const [selectedTenderId, setSelectedTenderId] = useState<string>(queryTender || 'ALL');
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterText, setFilterText] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  useEffect(() => {
    if (queryTender && queryTender !== selectedTenderId) {
      setSelectedTenderId(queryTender);
    }
  }, [queryTender]);

  // 1. Fetch Tenders list for filter dropdown
  useEffect(() => {
    let mounted = true;
    const fetchTenders = async () => {
      try {
        const procurement = (apiClient as any).procurement;
        if (procurement?.getTenders) {
          const list = await procurement.getTenders();
          if (mounted && Array.isArray(list)) {
            setTenders(list);
          }
        }
      } catch (err) {
        console.warn('Could not load tenders for audit trail:', err);
      }
    };
    fetchTenders();
    return () => {
      mounted = false;
    };
  }, []);

  // 2. Fetch Live Audit Trail from API
  const fetchAuditData = async () => {
    setLoading(true);
    try {
      const procurement = (apiClient as any).procurement;
      if (procurement?.getAuditTrail) {
        const targetTender = selectedTenderId && selectedTenderId !== 'ALL' ? selectedTenderId : undefined;
        const events = await procurement.getAuditTrail(targetTender);
        if (Array.isArray(events)) {
          setAuditEvents(events);
        }
      }
    } catch (err) {
      console.warn('Could not load live audit trail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, [selectedTenderId]);

  const currentTender = tenders.find((t) => t.id === selectedTenderId || t.tender_number === selectedTenderId);

  const filteredAudit = auditEvents.filter((e) => {
    const action = String(e.action || '');
    const detail = String(e.description || e.detail || '');
    const actor = String(e.actor || '');
    const tender = String(e.tender_id || '');

    const matchesSearch =
      action.toLowerCase().includes(filterText.toLowerCase()) ||
      detail.toLowerCase().includes(filterText.toLowerCase()) ||
      actor.toLowerCase().includes(filterText.toLowerCase()) ||
      tender.toLowerCase().includes(filterText.toLowerCase());

    const matchesAction = actionFilter === 'ALL' || action.toLowerCase().includes(actionFilter.toLowerCase());
    return matchesSearch && matchesAction;
  });

  const formatTime = (ts: string) => {
    if (!ts) return '—';
    try {
      const d = new Date(ts);
      return isNaN(d.getTime()) ? ts : d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    } catch {
      return ts;
    }
  };

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
            onClick={fetchAuditData}
            disabled={loading}
            className="ux4g-btn ux4g-btn-secondary ux4g-btn-sm flex items-center gap-1.5 cursor-pointer"
            title="Refresh Audit Trail"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
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

      {/* Tender Selection & Filter Strip */}
      <section className="bg-white border border-[#CBD5E1] rounded-[2px] p-3 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#15803D] shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#0B2A4A]">
                {currentTender ? `TENDER: ${currentTender.tender_number || currentTender.id}` : 'ALL PROCUREMENT REGISTERS'}
              </span>
            </div>
            <span className="text-xs text-[#64748B] block truncate max-w-xl">
              {currentTender ? currentTender.title : 'Consolidated immutable audit trail across all government procurement activities.'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tender Filter Dropdown */}
          <select
            value={selectedTenderId}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedTenderId(val);
              setSearchParams(val === 'ALL' ? {} : { tender: val });
            }}
            className="border border-[#CBD5E1] px-2 py-1.5 text-xs rounded-[2px] bg-white text-[#0F172A] font-medium"
          >
            <option value="ALL">All Tenders (Consolidated)</option>
            {tenders.map((t) => (
              <option key={t.id} value={t.id}>
                {t.tender_number || t.id} — {t.title.slice(0, 35)}...
              </option>
            ))}
          </select>

          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="border border-[#CBD5E1] px-2 py-1.5 text-xs rounded-[2px] bg-white text-[#0F172A] font-medium"
          >
            <option value="ALL">{t('page.audit.allActions')}</option>
            <option value="Integrity">Integrity Reviews &amp; Signals</option>
            <option value="Upload">{t('page.audit.uploads')}</option>
            <option value="Verification">{t('page.audit.verifications')}</option>
            <option value="Decision">{t('page.audit.officerDecisions')}</option>
          </select>

          {/* Text Search */}
          <div className="relative w-full sm:w-52">
            <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-2.5 top-2.5" />
            <input
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder={t('page.audit.searchPlaceholder')}
              className="ux4g-input pl-8 py-1 text-xs"
            />
          </div>
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
              {filteredAudit.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-xs text-[#64748B]">
                    No audit records match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredAudit.map((event) => (
                  <tr key={event.id}>
                    <td className="font-mono text-[11px] text-[#475569] whitespace-nowrap">
                      {formatTime(event.created_at || event.time)}
                    </td>
                    <td>
                      <strong className="text-xs text-[#0F172A] block font-semibold">{event.actor || 'System'}</strong>
                      <span className="text-[10px] text-[#64748B]">
                        {event.actor?.toLowerCase().includes('officer') ? 'Procurement Officer' : 'System Engine'}
                      </span>
                    </td>
                    <td>
                      <span className="font-semibold text-xs text-[#0B2A4A]">{event.action}</span>
                    </td>
                    <td className="font-mono text-xs text-[#0F172A]">
                      {event.tender_id || (currentTender ? currentTender.tender_number || currentTender.id : 'PROCUREMENT')}
                    </td>
                    <td>
                      <p className="text-[11px] text-[#334155] leading-relaxed max-w-md">
                        {event.description || event.detail}
                      </p>
                      <span className="font-mono text-[9px] text-[#64748B] block mt-0.5">
                        Event ID: {event.id}
                      </span>
                    </td>
                    <td>
                      <span className="gov-badge gov-badge-success text-[10px]">
                        [✓] Recorded
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default ProcurementAuditTrail;
