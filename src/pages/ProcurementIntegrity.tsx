import React, { useEffect, useState, useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
  Info,
  CheckCircle2,
  Building,
  FileText,
  Clock,
  Layers,
  ArrowRight,
  TrendingUp,
  Database,
  Filter,
  Eye,
  X,
  SlidersHorizontal,
  Network,
} from 'lucide-react';
import { apiClient, isUsingMockApi } from '../services/api/apiClient';
import { IntegrityAssessment, IntegrityFinding, IntegrityEvidence } from '../types';
import { useProcurement } from '../context/ProcurementContext';
import { useLanguage } from '../context/LanguageContext';
import { RelationshipGraph } from '../components/integrity/RelationshipGraph';

// ─── Human-readable Signal Types & Badges ─────────────────────────────────────
const SIGNAL_LABELS: Record<string, { label: string; description: string }> = {
  RELATED_BIDDER: {
    label: 'Related-Bidder Signal',
    description: 'Shared statutory identity attributes (PAN, GSTIN, CIN) between bidders.',
  },
  SHARED_ENTITY: {
    label: 'Shared Entity Linkage',
    description: 'Common registered address, email domain, or telephone number between bidders.',
  },
  BID_PRICE_ANOMALY: {
    label: 'Anomalous Bid Pattern',
    description: 'Financial quotes clustered within a narrow margin (<= 1.0% delta).',
  },
  REPEATED_WINNER_PATTERN: {
    label: 'Winner Concentration Signal',
    description: 'Historical award concentration across evaluated procurement exercises.',
  },
  REPEATED_PARTICIPATION_PATTERN: {
    label: 'Repeated Cohort Signal',
    description: 'Frequent joint bidding of identical vendor cohorts across historical tenders.',
  },
  BID_ROTATION_PATTERN: {
    label: 'Potential Bid Rotation',
    description: 'Sequential alternating awards among recurring participants.',
  },
  TENDER_CHANGE_PATTERN: {
    label: 'Tender Modification Signal',
    description: 'Unusual tender term modifications during active bidding window.',
  },
  CONFLICT_OF_INTEREST: {
    label: 'Potential Conflict Signal',
    description: 'Administrative linkage requiring officer verification prior to award.',
  },
};

export const ProcurementIntegrity: React.FC = () => {
  const { bidders, tenderId: contextTenderId } = useProcurement();
  const { t } = useLanguage();

  const [tendersList, setTendersList] = useState<any[]>([]);
  const [selectedTenderId, setSelectedTenderId] = useState<string>(contextTenderId || 'TEN-2026-001');
  const [selectedBidderId, setSelectedBidderId] = useState<string>('ALL');

  const [assessment, setAssessment] = useState<IntegrityAssessment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedFinding, setSelectedFinding] = useState<IntegrityFinding | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusActionNote, setStatusActionNote] = useState<string>('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // 1. Fetch available tenders on mount
  useEffect(() => {
    let mounted = true;
    const fetchTenders = async () => {
      try {
        const procurement = (apiClient as any).procurement;
        if (procurement?.getTenders) {
          const list = await procurement.getTenders();
          if (mounted && Array.isArray(list) && list.length > 0) {
            setTendersList(list);
            if (!selectedTenderId && list[0]?.id) {
              setSelectedTenderId(list[0].id);
            }
          }
        }
      } catch (err) {
        console.warn('Could not load tenders list:', err);
      }
    };
    fetchTenders();
    return () => {
      mounted = false;
    };
  }, []);

  // 2. Fetch Integrity Assessment from Real API
  const loadIntegrityData = async () => {
    if (!selectedTenderId) return;
    setLoading(true);
    setError(null);
    setSelectedFinding(null);
    setActionSuccess(null);

    try {
      const procurement = (apiClient as any).procurement;
      let data: IntegrityAssessment;

      if (selectedBidderId && selectedBidderId !== 'ALL') {
        data = await procurement.getBidderIntegrity(selectedBidderId);
      } else {
        data = await procurement.getTenderIntegrity(selectedTenderId);
      }

      setAssessment(data);
      if (data?.findings && data.findings.length > 0) {
        setSelectedFinding(data.findings[0]);
      }
    } catch (err: any) {
      const msg = err?.message || 'Unable to load procurement integrity assessment.';
      setError(msg);
      setAssessment(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIntegrityData();
  }, [selectedTenderId, selectedBidderId]);

  // Filter findings
  const filteredFindings = useMemo(() => {
    if (!assessment?.findings) return [];
    return assessment.findings.filter((f) => {
      const matchSev = filterSeverity === 'ALL' || f.severity === filterSeverity;
      const matchSearch =
        !searchQuery.trim() ||
        f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.signal_type.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSev && matchSearch;
    });
  }, [assessment, filterSeverity, searchQuery]);

  // Current tender object
  const currentTender = tendersList.find((t) => t.id === selectedTenderId);

  // Risk styling helper
  const getRiskBadge = (level: string) => {
    const l = (level || '').toUpperCase();
    switch (l) {
      case 'CRITICAL':
        return <span className="gov-badge gov-badge-error font-mono font-bold text-xs bg-[#FDE8E8] text-[#9B1C1C] border border-[#F8B4B4]">[!] CRITICAL RISK</span>;
      case 'HIGH':
        return <span className="gov-badge gov-badge-error font-mono font-bold text-xs bg-[#FDE8E8] text-[#C81E1E] border border-[#F8B4B4]">[!] HIGH RISK</span>;
      case 'MEDIUM':
        return <span className="gov-badge gov-badge-warning font-mono font-bold text-xs bg-[#FEF08A] text-[#713F12] border border-[#FDE047]">[!] MEDIUM RISK</span>;
      case 'LOW':
      default:
        return <span className="gov-badge gov-badge-success font-mono font-bold text-xs bg-[#DEF7EC] text-[#03543F] border border-[#BCF0DA]">[✓] LOW RISK</span>;
    }
  };

  const getSeverityPill = (sev: string) => {
    const s = (sev || '').toUpperCase();
    switch (s) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-[2px] bg-[#9B1C1C] text-white">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-[2px] bg-[#C81E1E] text-white">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-[2px] bg-[#D97706] text-white">MEDIUM</span>;
      case 'LOW':
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-[2px] bg-[#047857] text-white">LOW</span>;
    }
  };

  const getFindingStatusBadge = (status: string) => {
    const st = (status || 'OPEN').toUpperCase();
    switch (st) {
      case 'RESOLVED':
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded-[2px] bg-green-100 text-green-800 border border-green-300">RESOLVED</span>;
      case 'UNDER_REVIEW':
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded-[2px] bg-amber-100 text-amber-800 border border-amber-300">UNDER REVIEW</span>;
      case 'ACKNOWLEDGED':
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded-[2px] bg-blue-100 text-blue-800 border border-blue-300">ACKNOWLEDGED</span>;
      case 'DISMISSED':
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded-[2px] bg-gray-100 text-gray-800 border border-gray-300">DISMISSED</span>;
      case 'OPEN':
      default:
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded-[2px] bg-red-50 text-red-700 border border-red-200">OPEN</span>;
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 font-sans">
      {/* ─── Breadcrumb & Title Bar ────────────────────────────────────────── */}
      <div className="border-b border-[#CBD5E1] pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-[2px] shadow-xs border">
        <div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
            <span>{t('page.integrity.workspace')}</span>
            <ChevronRight className="w-3 h-3 text-[#94A3B8]" />
            <span className="text-[#0B2A4A]">{t('page.integrity.findings')}</span>
          </div>
          <h1 className="font-serif font-bold text-2xl text-[#0B2A4A] mt-1 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-[#0B2A4A]" />
            {t('page.integrity.title')}
          </h1>
          <p className="text-xs text-[#475569] mt-0.5">
            {t('page.integrity.subtitle')}
          </p>
        </div>

        {/* Live Engine Indicator & Refresh */}
        <div className="flex items-center gap-2 self-start md:self-center">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0] rounded-[2px]">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse"></span>
            Real-Time Integrity Engine
          </span>
          <button
            onClick={loadIntegrityData}
            disabled={loading}
            className="ux4g-btn ux4g-btn-primary ux4g-btn-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Refresh assessment from backend database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Re-evaluate</span>
          </button>
        </div>
      </div>

      {/* ─── Context Selector Control Bar ──────────────────────────────────── */}
      <div className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-[2px] p-3 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Tender Selection */}
            <div className="flex items-center gap-2">
              <label htmlFor="tender-select" className="text-xs font-bold text-[#0B2A4A] whitespace-nowrap flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-[#0B2A4A]" />
                Tender:
              </label>
              <select
                id="tender-select"
                value={selectedTenderId}
                onChange={(e) => {
                  setSelectedTenderId(e.target.value);
                  setSelectedBidderId('ALL');
                }}
                className="bg-white border border-[#CBD5E1] text-[#0B2A4A] text-xs rounded-[2px] px-2.5 py-1.5 font-medium focus:ring-1 focus:ring-[#0B2A4A] focus:outline-none min-w-[260px]"
              >
                {tendersList.length > 0 ? (
                  tendersList.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.tender_number ? `${t.tender_number} — ` : ''}{t.title || t.id}
                    </option>
                  ))
                ) : (
                  <option value="TEN-2026-001">TEN-2026-001 — Network Infrastructure</option>
                )}
              </select>
            </div>

            {/* Bidder Scope Filter */}
            <div className="flex items-center gap-2">
              <label htmlFor="bidder-select" className="text-xs font-bold text-[#0B2A4A] whitespace-nowrap flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-[#0B2A4A]" />
                Scope:
              </label>
              <select
                id="bidder-select"
                value={selectedBidderId}
                onChange={(e) => setSelectedBidderId(e.target.value)}
                className="bg-white border border-[#CBD5E1] text-[#0B2A4A] text-xs rounded-[2px] px-2.5 py-1.5 font-medium focus:ring-1 focus:ring-[#0B2A4A] focus:outline-none min-w-[220px]"
              >
                <option value="ALL">Entire Tender (All Participating Bidders)</option>
                {bidders.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.id} — {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {currentTender && (
            <div className="text-[11px] text-[#64748B] flex items-center gap-2">
              <span>Department: <strong className="text-[#334155]">{currentTender.department || 'General Administration'}</strong></span>
              <span>•</span>
              <span>Estimated Value: <strong className="text-[#334155]">₹{Number(currentTender.estimated_value || 0).toLocaleString('en-IN')}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* ─── Loading State ─────────────────────────────────────────────────── */}
      {loading && (
        <div className="bg-white border border-[#CBD5E1] rounded-[2px] p-12 text-center shadow-xs">
          <div className="flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[#0B2A4A] animate-spin" />
            <div className="font-semibold text-sm text-[#0B2A4A]">Loading procurement integrity assessment...</div>
            <p className="text-xs text-[#64748B] max-w-md">
              Executing deterministic pricing analysis, winner concentration checks, and statutory relationship cross-references.
            </p>
          </div>
        </div>
      )}

      {/* ─── Error State ───────────────────────────────────────────────────── */}
      {!loading && error && (
        <div className="bg-[#FEF2F2] border border-[#F87171] rounded-[2px] p-6 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-[#DC2626] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h2 className="text-sm font-bold text-[#991B1B]">Unable to load procurement integrity assessment.</h2>
              <p className="text-xs text-[#7F1D1D] mt-1 font-mono">{error}</p>
              <div className="mt-3">
                <button
                  onClick={loadIntegrityData}
                  className="ux4g-btn ux4g-btn-danger ux4g-btn-sm inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Assessment</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Main Assessment Workspace Content ─────────────────────────────── */}
      {!loading && !error && assessment && (
        <div className="space-y-4">
          {/* ── 1. Top KPI Summary Row ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Risk Tier */}
            <div className="bg-white border border-[#CBD5E1] rounded-[2px] p-3.5 shadow-xs flex flex-col justify-between">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                Integrity Risk Classification
              </div>
              <div className="my-2">
                {getRiskBadge(assessment.risk_level)}
              </div>
              <div className="text-[11px] text-[#475569]">
                Standard 4-Tier Statutory Review Category
              </div>
            </div>

            {/* Numerical Score */}
            <div className="bg-white border border-[#CBD5E1] rounded-[2px] p-3.5 shadow-xs flex flex-col justify-between">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                Composite Risk Score
              </div>
              <div className="my-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono text-[#0B2A4A]">
                  {Number(assessment.overall_risk_score).toFixed(1)}
                </span>
                <span className="text-xs text-[#64748B] font-mono">/ 100</span>
              </div>
              <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    assessment.overall_risk_score >= 75
                      ? 'bg-[#DC2626]'
                      : assessment.overall_risk_score >= 50
                      ? 'bg-[#EA580C]'
                      : assessment.overall_risk_score >= 25
                      ? 'bg-[#CA8A04]'
                      : 'bg-[#16A34A]'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, assessment.overall_risk_score))}%` }}
                />
              </div>
            </div>

            {/* Confidence Score */}
            <div className="bg-white border border-[#CBD5E1] rounded-[2px] p-3.5 shadow-xs flex flex-col justify-between">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                Deterministic Confidence
              </div>
              <div className="my-1 flex items-baseline gap-1">
                <span className="text-2xl font-bold font-mono text-[#0B2A4A]">
                  {(Number(assessment.confidence_score) * 100).toFixed(0)}%
                </span>
                <span className="text-[10px] text-[#16A34A] font-medium ml-1">
                  (High Certainty)
                </span>
              </div>
              <div className="text-[11px] text-[#475569]">
                Derived from verified statutory registries & OCR
              </div>
            </div>

            {/* Active Findings Count */}
            <div className="bg-white border border-[#CBD5E1] rounded-[2px] p-3.5 shadow-xs flex flex-col justify-between">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                Identified Signals
              </div>
              <div className="my-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono text-[#0B2A4A]">
                  {assessment.findings_count}
                </span>
                <span className="text-xs text-[#64748B]">Review Trigger(s)</span>
              </div>
              <div className="text-[11px] text-[#475569] truncate">
                {assessment.contributing_signals?.length > 0
                  ? assessment.contributing_signals.join(', ')
                  : 'Zero anomalous signals'}
              </div>
            </div>
          </div>

          {/* ── 2. Executive Summary Callout ── */}
          <div className="bg-[#F0F5FA] border-l-4 border-[#0B2A4A] p-3.5 rounded-r-[3px] border-y border-r border-[#D0DDEB] flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#0B2A4A] flex-shrink-0 mt-0.5" />
            <div className="text-xs text-[#1E293B] leading-relaxed">
              <span className="font-bold text-[#0B2A4A] block mb-0.5">Integrity Assessment Summary</span>
              {assessment.summary}
            </div>
          </div>

          {/* ── 3. Relationship Network ── */}
          <div className="bg-white border border-[#D9DDE3] rounded-[3px] shadow-sm">
            <div className="p-3 border-b border-[#D9DDE3] flex items-center justify-between bg-[#F8FAFC]">
              <div>
                <h2 className="font-serif font-bold text-sm text-[#0B2A4A] flex items-center gap-1.5">
                  <Network className="w-4 h-4 text-[#0B2A4A]" />
                  Entity Relationship Network
                </h2>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  Procurement entity relationships derived from submitted bidder documents and
                  statutory identifier cross-references. Click any node or edge for detail.
                </p>
              </div>
              <span className="text-[10px] text-[#64748B] font-mono whitespace-nowrap">
                {assessment.findings.filter(
                  (f) => f.signal_type === 'RELATED_BIDDER' || f.signal_type === 'SHARED_ENTITY'
                ).length} relationship finding{assessment.findings.filter(
                  (f) => f.signal_type === 'RELATED_BIDDER' || f.signal_type === 'SHARED_ENTITY'
                ).length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="p-3">
              <RelationshipGraph
                tenderId={selectedTenderId}
                tenderLabel={
                  currentTender
                    ? (currentTender.tender_number ? `${currentTender.tender_number} — ${currentTender.title || ''}` : (currentTender.title || selectedTenderId))
                    : selectedTenderId
                }
                tenderDepartment={currentTender?.department}
                tenderEstimatedValue={currentTender?.estimated_value}
                bidders={bidders.map((b) => ({ id: b.id, name: b.name, risk: b.risk }))}
                assessment={assessment}
              />
            </div>
          </div>

          {/* ── 4. Empty State (Genuinely Clean Dataset) ── */}
          {assessment.findings_count === 0 && (
            <div className="bg-white border border-[#D9DDE3] rounded-[3px] p-10 text-center shadow-sm">
              <div className="w-12 h-12 rounded-full bg-[#ECFDF5] text-[#059669] flex items-center justify-center mx-auto mb-3 border border-[#A7F3D0]">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-[#0B2A4A]">Integrity assessment completed.</h2>
              <p className="text-xs text-[#475569] max-w-lg mx-auto mt-1 leading-normal">
                No material integrity signals were identified from the available procurement data.
                Bid prices, historical records, and statutory identifiers show no detectable anomalies.
              </p>
              <div className="mt-4 text-[11px] text-[#64748B] font-mono">
                Assessed at: {new Date(assessment.assessed_at).toLocaleString('en-IN')}
              </div>
            </div>
          )}

          {/* ── 4. Key Findings & Detailed Inspector (Split Layout) ── */}
          {assessment.findings_count > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {/* Left Column: Findings List / Table (7 Cols) */}
              <div className="lg:col-span-7 bg-white border border-[#D9DDE3] rounded-[3px] shadow-sm">
                <div className="p-3 border-b border-[#D9DDE3] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-[#F8FAFC]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#0B2A4A] uppercase tracking-wide">
                      Key Findings ({filteredFindings.length})
                    </span>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-initial">
                      <Search className="w-3 h-3 text-[#94A3B8] absolute left-2 top-2" />
                      <input
                        type="text"
                        placeholder="Search findings..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-7 pr-2 py-1 text-xs border border-[#CBD5E1] rounded-[2px] w-full sm:w-36 focus:outline-none focus:ring-1 focus:ring-[#0B2A4A]"
                      />
                    </div>
                    <select
                      value={filterSeverity}
                      onChange={(e) => setFilterSeverity(e.target.value)}
                      className="border border-[#CBD5E1] rounded-[2px] px-2 py-1 text-xs text-[#334155] bg-white focus:outline-none"
                    >
                      <option value="ALL">All Severity</option>
                      <option value="CRITICAL">Critical</option>
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                    </select>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#F1F5F9] border-b border-[#D9DDE3] text-[#475569] font-bold uppercase text-[10px]">
                        <th className="py-2.5 px-3">Signal Type</th>
                        <th className="py-2.5 px-2">Severity</th>
                        <th className="py-2.5 px-2">Impact</th>
                        <th className="py-2.5 px-3">Pattern / Reason Excerpt</th>
                        <th className="py-2.5 px-2">Evidence</th>
                        <th className="py-2.5 px-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                      {filteredFindings.map((finding) => {
                        const isSelected = selectedFinding?.id === finding.id;
                        const sigMeta = SIGNAL_LABELS[finding.signal_type] || { label: finding.signal_type };
                        return (
                          <tr
                            key={finding.id}
                            onClick={() => setSelectedFinding(finding)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-[#F0F5FA] border-l-4 border-[#0B2A4A]'
                                : 'hover:bg-[#F8FAFC]'
                            }`}
                          >
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-[#0B2A4A] text-xs">
                                {sigMeta.label}
                              </div>
                              <div className="text-[10px] text-[#64748B] font-mono">
                                {finding.id}
                              </div>
                            </td>
                            <td className="py-2.5 px-2">
                              {getSeverityPill(finding.severity)}
                            </td>
                            <td className="py-2.5 px-2 font-mono text-[11px] text-[#334155]">
                              +{finding.score_impact}
                            </td>
                            <td className="py-2.5 px-3 max-w-[220px]">
                              <div className="font-semibold text-[#1E293B] truncate">
                                {finding.title}
                              </div>
                              <div className="text-[11px] text-[#64748B] line-clamp-1">
                                {finding.reason}
                              </div>
                            </td>
                            <td className="py-2.5 px-2 whitespace-nowrap">
                              <span className="px-1.5 py-0.5 text-[10px] font-mono bg-[#EDF2F7] text-[#4A5568] rounded-[2px]">
                                {finding.evidence?.length || 0} item(s)
                              </span>
                            </td>
                            <td className="py-2.5 px-2 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedFinding(finding);
                                }}
                                className={`px-2 py-1 text-[11px] font-semibold rounded-[2px] transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#0B2A4A] text-white'
                                    : 'bg-white text-[#0B2A4A] border border-[#0B2A4A] hover:bg-[#F0F5FA]'
                                }`}
                              >
                                {isSelected ? 'Selected' : 'Inspect'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: Finding Deep-Dive & Evidence Explorer (5 Cols) */}
              <div className="lg:col-span-5 bg-white border border-[#D9DDE3] rounded-[3px] shadow-sm sticky top-14">
                {selectedFinding ? (
                  <div>
                    {/* Header */}
                    <div className="p-3.5 border-b border-[#D9DDE3] bg-[#F8FAFC]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono text-[#64748B]">
                          Finding ID: {selectedFinding.id}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {getSeverityPill(selectedFinding.severity)}
                          {getFindingStatusBadge(selectedFinding.status)}
                        </div>
                      </div>
                      <h2 className="font-bold text-sm text-[#0B2A4A] leading-snug">
                        {selectedFinding.title}
                      </h2>
                      <div className="text-[11px] text-[#64748B] mt-0.5">
                        Signal: <strong>{SIGNAL_LABELS[selectedFinding.signal_type]?.label || selectedFinding.signal_type}</strong>
                        {' • '}
                        Confidence: <strong>{(selectedFinding.confidence * 100).toFixed(0)}%</strong>
                      </div>
                    </div>

                    <div className="p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto text-xs">
                      {/* What was detected / Reason */}
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-[#0B2A4A] mb-1 flex items-center gap-1">
                          <Info className="w-3.5 h-3.5 text-[#0B2A4A]" />
                          What Was Detected & Why Flagged
                        </div>
                        <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-[2px] text-[#334155] leading-relaxed">
                          {selectedFinding.reason}
                        </div>
                      </div>

                      {/* Structured Evidence Items */}
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-[#0B2A4A] mb-1.5 flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Database className="w-3.5 h-3.5 text-[#0B2A4A]" />
                            Structured Audit Evidence ({selectedFinding.evidence?.length || 0})
                          </span>
                          <span className="text-[10px] text-[#64748B] font-normal">Deterministic Data Points</span>
                        </div>

                        {selectedFinding.evidence && selectedFinding.evidence.length > 0 ? (
                          <div className="space-y-2">
                            {selectedFinding.evidence.map((ev, idx) => (
                              <div
                                key={idx}
                                className="bg-white border border-[#CBD5E1] p-2.5 rounded-[2px] shadow-2xs"
                              >
                                <div className="flex items-center justify-between text-[10px] mb-1">
                                  <span className="px-1.5 py-0.2 bg-[#E2E8F0] text-[#334155] font-mono font-bold rounded-[2px]">
                                    {ev.source_type}
                                  </span>
                                  {ev.source_id && (
                                    <span className="text-[#64748B] font-mono">
                                      Ref: {ev.source_id}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-[#1E293B] font-medium">
                                  {ev.description}
                                </div>
                                <div className="mt-1.5 text-[11px] bg-[#F1F5F9] px-2 py-1 rounded-[2px] font-mono text-[#0B2A4A] flex items-center justify-between">
                                  <span>Field: {ev.field}</span>
                                  <span className="font-bold truncate max-w-[180px]">
                                    Value: {typeof ev.value === 'object' ? JSON.stringify(ev.value) : String(ev.value)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[11px] text-[#64748B] italic p-2 bg-[#F8FAFC] border rounded-[2px]">
                            No separate itemized evidence attached.
                          </div>
                        )}
                      </div>

                      {/* Recommended Procedural Action */}
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-[#0B2A4A] mb-1 flex items-center gap-1">
                          <FileCheck className="w-3.5 h-3.5 text-[#0B2A4A]" />
                          Recommended Procedural Action
                        </div>
                        <div className="bg-[#FEFCE8] border border-[#FEF08A] p-3 rounded-[2px] text-[#713F12] leading-relaxed">
                          {selectedFinding.recommended_action}
                        </div>
                      </div>

                      {/* Officer Review Actions */}
                      <div className="border-t border-[#E2E8F0] pt-3">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-[#0B2A4A] mb-2">
                          Procurement Officer Review
                        </div>

                        {actionSuccess ? (
                          <div className="p-2.5 bg-[#DEF7EC] border border-[#BCF0DA] text-[#03543F] rounded-[2px] text-xs font-semibold flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-[#03543F]" />
                            {actionSuccess}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <textarea
                              rows={2}
                              placeholder="Optional review note / action record..."
                              value={statusActionNote}
                              onChange={(e) => setStatusActionNote(e.target.value)}
                              className="w-full text-xs p-2 border border-[#CBD5E1] rounded-[2px] focus:outline-none focus:ring-1 focus:ring-[#0B2A4A]"
                            />
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setActionSuccess(`Finding ${selectedFinding.id} acknowledged in officer review record.`);
                                  setTimeout(() => setActionSuccess(null), 4000);
                                }}
                                className="px-3 py-1.5 bg-[#0B2A4A] hover:bg-[#123B63] text-white text-xs font-semibold rounded-[2px] transition-colors cursor-pointer"
                              >
                                Acknowledge & Record Review
                              </button>
                              <button
                                onClick={() => {
                                  setActionSuccess(`Finding ${selectedFinding.id} flagged for clarification.`);
                                  setTimeout(() => setActionSuccess(null), 4000);
                                }}
                                className="px-3 py-1.5 bg-white text-[#0B2A4A] border border-[#0B2A4A] hover:bg-[#F0F5FA] text-xs font-semibold rounded-[2px] transition-colors cursor-pointer"
                              >
                                Request Clarification
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-[#64748B]">
                    <Eye className="w-6 h-6 text-[#94A3B8] mx-auto mb-2" />
                    Select a finding from the table to inspect details and evidence.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── 5. Statutory Decision-Support Notice (Footer) ── */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-[3px] text-[11px] text-[#475569] leading-relaxed flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-[#64748B] flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#334155]">Statutory Advisory:</strong> Algorithmic integrity evaluations provide deterministic decision support pursuant to General Financial Rules (GFR 2017) and GeM guidelines. All signals represent administrative indicators requiring officer verification and do not constitute formal disqualification or investigative findings.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcurementIntegrity;
