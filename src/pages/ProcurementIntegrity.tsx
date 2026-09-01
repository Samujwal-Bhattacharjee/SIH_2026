import React, { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
  Building2,
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
  UserCheck,
  Scale,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { apiClient, isUsingMockApi } from '../services/api/apiClient';
import { IntegrityAssessment, IntegrityFinding, IntegrityEvidence } from '../types';
import { useProcurement } from '../context/ProcurementContext';
import { useLanguage } from '../context/LanguageContext';
import { RelationshipGraph } from '../components/integrity/RelationshipGraph';
import { GovPageHeader } from '../components/common/GovPageHeader';

// ─── Human-readable Signal Types & Badges ─────────────────────────────────────
const SIGNAL_LABELS: Record<string, { label: string; description: string }> = {
  RELATED_BIDDER: {
    label: 'Related-Bidder Signal',
    description: 'Shared statutory identity attributes (PAN, GSTIN, CIN) between bidders.',
  },
  COMMON_DIRECTOR_LINK: {
    label: 'Common Director Link',
    description: 'Shared corporate directors or designated partners identified across competing entities.',
  },
  DOCUMENT_IDENTITY_INCONSISTENCY: {
    label: 'Document Identity Inconsistency',
    description: 'Cross-bidder statutory credentials identified in submitted tender documents.',
  },
  BID_PRICE_ANOMALY: {
    label: 'Anomalous Bid Pricing Pattern',
    description: 'Financial quotes clustered within an unusually narrow margin (<= 1.0% delta).',
  },
  BID_TO_ESTIMATE_ANOMALY: {
    label: 'Bid-to-Estimate Anomaly',
    description: 'Submitted financial quotes clustered abnormally close to the confidential departmental estimate.',
  },
  COMMERCIAL_BOQ_ANOMALY: {
    label: 'Commercial BOQ Rate Uniformity',
    description: 'Identical itemized bill-of-quantities unit rates detected across competing bidders.',
  },
  REPEATED_WINNER_PATTERN: {
    label: 'Supplier Concentration Signal',
    description: 'Historical award concentration exceeding statistical thresholds in category.',
  },
  REPEATED_PARTICIPATION_PATTERN: {
    label: 'Repeated Cohort Signal',
    description: 'Frequent joint bidding of identical vendor cohorts across historical tenders.',
  },
  BID_ROTATION_PATTERN: {
    label: 'Possible Bid Rotation Pattern',
    description: 'Sequential alternating awards among recurring participants over time.',
  },
  LOSING_BID_PATTERN: {
    label: 'Losing-Bid Cover Pattern',
    description: 'Recurring runner-up submissions with consistent marginal price differentials.',
  },
  NON_COMPETITION_PATTERN: {
    label: 'Non-Competition Pattern Signal',
    description: 'Persistent participation without award in recurring small cohort competitions.',
  },
  NARROW_COMPETITION: {
    label: 'Narrow Competition Signal',
    description: 'Tenders repeatedly attracting <= 2 qualified bidders despite open procurement notices.',
  },
  OFFICER_VENDOR_ASSOCIATION: {
    label: 'Administrative Association Signal',
    description: 'High concentration of tender awards to a specific supplier by the same deciding officer.',
  },
  SUBMISSION_TIMING_ANOMALY: {
    label: 'Submission Timing Anomaly',
    description: 'Bids submitted within an unusually narrow clustered time window.',
  },
  SHARED_ENTITY: {
    label: 'Shared Entity Linkage',
    description: 'Common registered address, email domain, or telephone number between bidders.',
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
  const { bidders, tenderId: contextTenderId, recordIntegrityReview } = useProcurement();
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  const queryTender = searchParams.get('tender');
  const [tendersList, setTendersList] = useState<any[]>([]);
  const [selectedTenderId, setSelectedTenderId] = useState<string>(queryTender || contextTenderId || '');
  const [selectedBidderId, setSelectedBidderId] = useState<string>('ALL');

  const [assessment, setAssessment] = useState<IntegrityAssessment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedFinding, setSelectedFinding] = useState<IntegrityFinding | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusActionNote, setStatusActionNote] = useState<string>('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [showRiskBasis, setShowRiskBasis] = useState<boolean>(true);
  const [showDecomposition, setShowDecomposition] = useState<boolean>(true);

  // Sync selected tender with URL query param if changed
  useEffect(() => {
    if (queryTender && queryTender !== selectedTenderId) {
      setSelectedTenderId(queryTender);
    }
  }, [queryTender]);

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
            // Auto-select first real tender if nothing is selected yet
            if (!queryTender && !selectedTenderId && list[0]?.id) {
              setSelectedTenderId(list[0].id);
            } else if (!queryTender && selectedTenderId === '' && list[0]?.id) {
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

  const isHighOrCritical = assessment?.risk_level === 'HIGH' || assessment?.risk_level === 'CRITICAL';
  const isMedium = assessment?.risk_level === 'MEDIUM';

  const handleOfficerAction = async (
    status: 'ACKNOWLEDGED' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED',
    defaultNote: string,
    actionLabel: string
  ) => {
    if (!selectedFinding) return;
    try {
      await recordIntegrityReview(
        selectedFinding.id,
        status,
        statusActionNote || defaultNote,
        selectedTenderId,
        selectedFinding.bidder_id || undefined,
        actionLabel
      );
      setSelectedFinding({ ...selectedFinding, status });
      setAssessment((prev) =>
        prev
          ? {
              ...prev,
              findings: prev.findings.map((f) => (f.id === selectedFinding.id ? { ...f, status } : f)),
            }
          : prev
      );
      setActionSuccess(`Finding ${selectedFinding.id} set to '${status.replace('_', ' ')}' and recorded in official audit register.`);
    } catch (err: any) {
      setError('Failed to record review action.');
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 font-sans">
      {/* ─── Institutional Title & Engine Status Strip (Glossy Frosted Banner) ─── */}
      <GovPageHeader
        title={
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-[#0B2A4A]" />
            <span>{t('page.integrity.title') || 'Procurement Integrity Workspace'}</span>
          </div>
        }
        tag="INTEGRITY ENGINE & CORRUPTION RISK"
        subtitle={t('page.integrity.subtitle') || 'Detect explainable collusion, cohort bidding patterns, and cross-tender vendor relationships.'}
        actions={
          <>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0] rounded-[4px] shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse"></span>
              Real-Time Integrity Engine
            </span>
            <button
              onClick={loadIntegrityData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2E0854] hover:bg-[#1E053A] text-white rounded-[4px] text-xs font-semibold shadow-xs gov-btn-glossy transition-all cursor-pointer disabled:opacity-50"
              title="Refresh assessment from backend database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Re-evaluate</span>
            </button>
          </>
        }
      />

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
                  <option value="" disabled>No tenders loaded—connect to backend</option>
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
          {/* ════════════════════════════════════════════════════════════════════════
              LEVEL 1: ABOVE-THE-FOLD RISK SUMMARY
              ════════════════════════════════════════════════════════════════════════ */}
          <div className={`border rounded-[3px] p-4 shadow-xs transition-all ${
            isHighOrCritical
              ? 'bg-[#FEF2F2] border-[#F87171]'
              : isMedium
              ? 'bg-[#FEFCE8] border-[#FDE047]'
              : 'bg-[#F0FDF4] border-[#BBF7D0]'
          }`}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Procurement Information */}
              <div className="space-y-1 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-[2px] bg-white border border-[#CBD5E1] text-[#0B2A4A]">
                    {selectedTenderId}
                  </span>
                  {currentTender?.tender_number && currentTender.tender_number !== selectedTenderId && (
                    <span className="text-[11px] font-mono text-[#64748B]">
                      {currentTender.tender_number}
                    </span>
                  )}
                  <span className="text-xs text-[#CBD5E1]">|</span>
                  <span className="text-xs text-[#475569] font-medium">
                    {currentTender?.department || 'General Administration'}
                  </span>
                </div>
                <h1 className="text-base font-bold text-[#0B2A4A] leading-tight">
                  {currentTender?.title || selectedTenderId}
                </h1>
                <div className="text-xs text-[#64748B] flex flex-wrap items-center gap-3 pt-0.5">
                  <span>Category: <strong className="text-[#334155]">{currentTender?.category || 'Procurement'}</strong></span>
                  <span>•</span>
                  <span>Est. Value: <strong className="text-[#334155]">₹{Number(currentTender?.estimated_value || 0).toLocaleString('en-IN')}</strong></span>
                  <span>•</span>
                  <span>Scope: <strong className="text-[#334155]">{selectedBidderId === 'ALL' ? `${bidders.length} Bidders Evaluated` : `Bidder ${selectedBidderId}`}</strong></span>
                </div>
              </div>

              {/* Dominant Risk & Metric Badges */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-col items-start lg:items-end">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-1">
                    Review Priority
                  </div>
                  <span className={`px-3 py-1 text-xs font-bold rounded-[2px] border flex items-center gap-1.5 shadow-2xs ${
                    isHighOrCritical
                      ? 'bg-[#DC2626] text-white border-[#B91C1C]'
                      : isMedium
                      ? 'bg-[#CA8A04] text-white border-[#A16207]'
                      : 'bg-[#16A34A] text-white border-[#15803D]'
                  }`}>
                    {isHighOrCritical && <AlertTriangle className="w-3.5 h-3.5" />}
                    {!isHighOrCritical && <ShieldCheck className="w-3.5 h-3.5" />}
                    <span>
                      {isHighOrCritical
                        ? 'Procurement Review Required'
                        : isMedium
                        ? 'Procedural Review Advised'
                        : 'Routine / Cleared'}
                    </span>
                  </span>
                </div>

                <div className="bg-white border border-[#CBD5E1] rounded-[2px] p-2.5 px-3.5 flex items-center gap-3.5 shadow-2xs">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                      Overall Risk
                    </div>
                    <div className="mt-0.5">
                      {getRiskBadge(assessment.risk_level)}
                    </div>
                  </div>

                  <div className="h-8 w-px bg-[#E2E8F0]" />

                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                      Score
                    </div>
                    <div className="text-xl font-bold font-mono text-[#0B2A4A] leading-none mt-0.5">
                      {Number(assessment.overall_risk_score).toFixed(1)}
                      <span className="text-xs text-[#64748B] font-normal">/100</span>
                    </div>
                  </div>

                  <div className="h-8 w-px bg-[#E2E8F0]" />

                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                      Confidence
                    </div>
                    <div className="text-xl font-bold font-mono text-[#0B2A4A] leading-none mt-0.5">
                      {(Number(assessment.confidence_score) * 100).toFixed(0)}%
                    </div>
                  </div>

                  <div className="h-8 w-px bg-[#E2E8F0]" />

                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                      Findings
                    </div>
                    <div className="text-xl font-bold font-mono text-[#0B2A4A] leading-none mt-0.5">
                      {assessment.findings_count}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════════════
              LOW-RISK CLEAN PROCUREMENT PRESENTATION
              ════════════════════════════════════════════════════════════════════════ */}
          {assessment.findings_count === 0 ? (
            <div className="space-y-4">
              <div className="bg-white border border-[#CBD5E1] rounded-[3px] p-8 shadow-xs">
                <div className="max-w-2xl mx-auto text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-[#ECFDF5] text-[#059669] flex items-center justify-center mx-auto border border-[#A7F3D0]">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="px-2.5 py-1 text-xs font-bold font-mono bg-[#DEF7EC] text-[#03543F] border border-[#BCF0DA] rounded-[2px]">
                      [✓] LOW RISK — 0.0 / 100
                    </span>
                    <h2 className="text-base font-bold text-[#0B2A4A] mt-2">
                      No Material Integrity Signals Identified
                    </h2>
                    <p className="text-xs text-[#475569] mt-1 leading-relaxed">
                      Integrity evaluation completed from available procurement data. No anomalous bid pricing patterns,
                      shared statutory identities, or historical cohort concentration patterns detected.
                    </p>
                  </div>

                  {/* Data Examined Grid */}
                  <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[2px] text-left">
                    <div className="text-[11px] font-bold text-[#0B2A4A] uppercase tracking-wider mb-2.5">
                      Procurement Dimensions Examined:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-[#334155]">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                        <div>
                          <strong>Bid Price Spread:</strong> Fully independent quotations without artificial clustering.
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                        <div>
                          <strong>Bidder Identities:</strong> Distinct statutory PAN, GSTIN, CIN &amp; addresses.
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                        <div>
                          <strong>Participation History:</strong> Broad multi-vendor competition with no recurring cohort lock-in.
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                        <div>
                          <strong>Award Distribution:</strong> Fair historical category distribution across certified suppliers.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-[#64748B] font-mono">
                    Evaluation completed at: {new Date(assessment.assessed_at).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Expandable Risk Basis Parameters */}
              {assessment.risk_basis && (
                <div className="bg-white border border-[#CBD5E1] rounded-[3px] shadow-xs overflow-hidden">
                  <div
                    className="p-3 bg-[#F8FAFC] border-b border-[#CBD5E1] flex items-center justify-between cursor-pointer select-none"
                    onClick={() => setShowRiskBasis(!showRiskBasis)}
                  >
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-[#0B2A4A]" />
                      <h3 className="font-bold text-xs text-[#0B2A4A] uppercase tracking-wider">
                        Risk Basis &amp; Statutory Evaluation Parameters
                      </h3>
                    </div>
                    {showRiskBasis ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
                  </div>

                  {showRiskBasis && (
                    <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[2px]">
                        <div className="text-[10px] font-bold uppercase text-[#64748B]">Price Delta Margin</div>
                        <div className="text-sm font-bold font-mono text-[#0B2A4A] mt-0.5">
                          ≤ {assessment.risk_basis.price_similarity_threshold_pct}%
                        </div>
                      </div>
                      <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[2px]">
                        <div className="text-[10px] font-bold uppercase text-[#64748B]">Supplier Concentration</div>
                        <div className="text-sm font-bold font-mono text-[#0B2A4A] mt-0.5">
                          ≥ {(Number(assessment.risk_basis.winner_concentration_ratio) * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[2px]">
                        <div className="text-[10px] font-bold uppercase text-[#64748B]">Cohort Quorum</div>
                        <div className="text-sm font-bold font-mono text-[#0B2A4A] mt-0.5">
                          ≥ {assessment.risk_basis.min_co_participations} Joint Tenders
                        </div>
                      </div>
                      <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[2px]">
                        <div className="text-[10px] font-bold uppercase text-[#64748B]">Rotation Horizon</div>
                        <div className="text-sm font-bold font-mono text-[#0B2A4A] mt-0.5">
                          ≥ {assessment.risk_basis.min_rotation_tenders} Tenders
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* ════════════════════════════════════════════════════════════════════════
                HIGH / MEDIUM RISK CASE (POSITIVE SIGNALS DETECTED)
                ════════════════════════════════════════════════════════════════════════ */
            <div className="space-y-4">
              {/* Executive Summary Callout */}
              <div className="bg-[#F0F5FA] border-l-4 border-[#0B2A4A] p-3.5 rounded-r-[3px] border-y border-r border-[#D0DDEB] flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[#0B2A4A] flex-shrink-0 mt-0.5" />
                <div className="text-xs text-[#1E293B] leading-relaxed">
                  <span className="font-bold text-[#0B2A4A] block mb-0.5">Integrity Assessment Summary:</span>
                  {assessment.summary}
                </div>
              </div>

              {/* ════════════════════════════════════════════════════════════════════
                  LEVEL 2: "WHY THIS PROCUREMENT WAS FLAGGED" & SCORE BREAKDOWN
                  ════════════════════════════════════════════════════════════════════ */}
              <div className="bg-white border border-[#CBD5E1] rounded-[3px] shadow-xs overflow-hidden">
                <div className="p-3 bg-[#F8FAFC] border-b border-[#CBD5E1] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="font-bold text-sm text-[#0B2A4A] flex items-center gap-1.5">
                      <SlidersHorizontal className="w-4 h-4 text-[#0B2A4A]" />
                      Why This Procurement Was Flagged
                    </h2>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      Top contributing signals ranked by score impact • Contributor values mathematically sum to the final composite score ({Number(assessment.overall_risk_score).toFixed(1)} / 100)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-1 bg-white border border-[#CBD5E1] rounded-[2px] text-[#0B2A4A]">
                      Composite Score: {Number(assessment.overall_risk_score).toFixed(1)} / 100
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {/* Compact Visual Decomposition Waterfall Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase text-[#64748B]">
                      <span>Visual Score Decomposition</span>
                      <span className="font-mono">
                        {assessment.score_breakdown?.map((c) => `+${Number(c.points_added).toFixed(1)}`).join(' ')} = {Number(assessment.overall_risk_score).toFixed(1)} pts
                      </span>
                    </div>
                    <div className="w-full bg-[#E2E8F0] h-3.5 rounded-[2px] overflow-hidden flex shadow-inner">
                      {assessment.score_breakdown?.map((c, idx) => {
                        const widthPct = assessment.overall_risk_score > 0
                          ? (c.points_added / assessment.overall_risk_score) * 100
                          : 0;
                        const colors = [
                          'bg-[#DC2626]',
                          'bg-[#EA580C]',
                          'bg-[#D97706]',
                          'bg-[#2563EB]',
                          'bg-[#7C3AED]',
                          'bg-[#0D9488]',
                        ];
                        const color = colors[idx % colors.length];
                        return (
                          <div
                            key={idx}
                            className={`${color} h-full transition-all border-r border-white/20`}
                            style={{ width: `${widthPct}%` }}
                            title={`${c.title}: +${Number(c.points_added).toFixed(1)} pts (${widthPct.toFixed(1)}%)`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Compact Ranked Contributing Signal Rows */}
                  <div className="border border-[#E2E8F0] rounded-[2px] divide-y divide-[#E2E8F0] overflow-hidden">
                    {assessment.score_breakdown?.map((c, idx) => {
                      const matchedFinding = assessment.findings.find((f) => f.signal_type === c.signal_type);
                      const isSelected = selectedFinding?.signal_type === c.signal_type;
                      const widthPct = assessment.overall_risk_score > 0
                        ? (c.points_added / assessment.overall_risk_score) * 100
                        : 0;

                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            if (matchedFinding) {
                              setSelectedFinding(matchedFinding);
                              const el = document.getElementById('signal-detail-section');
                              if (el) el.scrollIntoView({ behavior: 'smooth' });
                            }
                          }}
                          className={`p-3 transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-[#F0F5FA] border-l-4 border-[#0B2A4A]'
                              : 'hover:bg-[#F8FAFC]'
                          }`}
                        >
                          {/* Left: Rank & Title */}
                          <div className="flex items-start gap-3">
                            <span className="text-xs font-mono font-bold text-[#64748B] w-6 pt-0.5">
                              {String(idx + 1).padStart(2, '0')}
                            </span>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-xs text-[#0B2A4A]">
                                  {c.title}
                                </span>
                                {c.rule_clause && (
                                  <span className="px-1.5 py-0.2 bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E3A8A] font-mono text-[10px] rounded-[2px]">
                                    {c.rule_clause}
                                  </span>
                                )}
                                {matchedFinding && getSeverityPill(matchedFinding.severity)}
                              </div>
                              <div className="text-[11px] text-[#64748B] mt-0.5">
                                {SIGNAL_LABELS[c.signal_type]?.description || c.signal_type}
                              </div>
                            </div>
                          </div>

                          {/* Right: Points Added, Contribution Bar & Action */}
                          <div className="flex items-center gap-4 ml-9 md:ml-0 flex-shrink-0">
                            {/* Proportional meter */}
                            <div className="w-24 hidden sm:block">
                              <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[#0B2A4A]"
                                  style={{ width: `${Math.min(100, widthPct)}%` }}
                                />
                              </div>
                              <div className="text-[9px] text-[#64748B] text-right font-mono mt-0.5">
                                {widthPct.toFixed(1)}% share
                              </div>
                            </div>

                            {/* Points added */}
                            <div className="text-right min-w-[70px]">
                              <div className="text-sm font-bold font-mono text-[#0B2A4A]">
                                +{Number(c.points_added).toFixed(1)}
                              </div>
                              <div className="text-[9px] text-[#64748B] font-mono">
                                Base: {Number(c.base_impact).toFixed(1)}
                              </div>
                            </div>

                            {/* Confidence */}
                            {matchedFinding && (
                              <div className="text-right min-w-[55px] hidden md:block">
                                <div className="text-xs font-mono font-semibold text-[#1E293B]">
                                  {(matchedFinding.confidence * 100).toFixed(0)}%
                                </div>
                                <div className="text-[9px] text-[#64748B]">Confidence</div>
                              </div>
                            )}

                            {/* Select Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (matchedFinding) {
                                  setSelectedFinding(matchedFinding);
                                  const el = document.getElementById('signal-detail-section');
                                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                                }
                              }}
                              className={`px-2.5 py-1 text-xs font-semibold rounded-[2px] transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-[#0B2A4A] text-white'
                                  : 'bg-white text-[#0B2A4A] border border-[#CBD5E1] hover:border-[#0B2A4A]'
                              }`}
                            >
                              {isSelected ? 'Viewing' : 'Inspect →'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ════════════════════════════════════════════════════════════════════
                  LEVEL 3: SIGNAL DETAIL, EVIDENCE-FIRST INSPECTOR & OFFICER ACTION
                  ════════════════════════════════════════════════════════════════════ */}
              <div id="signal-detail-section" className="bg-white border border-[#CBD5E1] rounded-[3px] shadow-xs overflow-hidden">
                {selectedFinding ? (
                  <div>
                    {/* Header */}
                    <div className="p-4 bg-[#F8FAFC] border-b border-[#CBD5E1] flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-[#E2E8F0] text-[#334155] rounded-[2px]">
                            Finding ID: {selectedFinding.id}
                          </span>
                          {getSeverityPill(selectedFinding.severity)}
                          {getFindingStatusBadge(selectedFinding.status)}
                        </div>
                        <h2 className="font-bold text-base text-[#0B2A4A]">
                          {selectedFinding.title}
                        </h2>
                        <div className="text-xs text-[#64748B] mt-0.5">
                          Signal Type: <strong className="text-[#334155]">{SIGNAL_LABELS[selectedFinding.signal_type]?.label || selectedFinding.signal_type}</strong>
                          {' • '}
                          Deterministic Confidence: <strong className="text-[#334155]">{(selectedFinding.confidence * 100).toFixed(0)}%</strong>
                        </div>
                      </div>

                      {/* Direct Bidder Dossier Quick Links */}
                      {selectedFinding.related_bidder_ids && selectedFinding.related_bidder_ids.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {selectedFinding.related_bidder_ids.map((bId: string) => {
                            const bidderObj = bidders.find((b) => b.id === bId);
                            return (
                              <Link
                                key={bId}
                                to={`/verification/${bId}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-white text-[#0B2A4A] border border-[#CBD5E1] hover:border-[#0B2A4A] hover:bg-[#F0F5FA] rounded-[2px] transition-colors shadow-2xs"
                                title={`Open verification dossier & statutory documents for ${bidderObj?.name || bId}`}
                              >
                                <span>{bidderObj?.name ? `${bidderObj.name} (${bId})` : `Bidder ${bId}`}</span>
                                <ExternalLink className="w-3 h-3 text-[#0B2A4A]" />
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="p-4 space-y-4">
                      {/* WHAT & WHY GRID */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        {/* WHAT */}
                        <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[2px] space-y-1.5">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-[#0B2A4A] flex items-center gap-1">
                            <Info className="w-3.5 h-3.5 text-[#0B2A4A]" />
                            WHAT: Pattern Detected
                          </div>
                          <div className="text-xs text-[#1E293B] font-medium leading-relaxed">
                            {selectedFinding.title}
                          </div>
                          <div className="text-[11px] text-[#475569] leading-relaxed">
                            {selectedFinding.reason}
                          </div>
                        </div>

                        {/* WHY / STATUTORY BASIS */}
                        <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[2px] space-y-1.5">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-[#0B2A4A] flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <Scale className="w-3.5 h-3.5 text-[#0B2A4A]" />
                              WHY: Statutory Rule Reference
                            </span>
                            {selectedFinding.rule_reference && (
                              <span className="font-mono px-1.5 py-0.2 bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E3A8A] font-bold text-[10px] rounded-[2px]">
                                {selectedFinding.rule_reference.clause_id}
                              </span>
                            )}
                          </div>
                          {selectedFinding.rule_reference ? (
                            <>
                              <div className="font-bold text-xs text-[#0B2A4A]">
                                {selectedFinding.rule_reference.title}
                              </div>
                              <div className="text-[11px] text-[#475569] leading-relaxed">
                                {selectedFinding.rule_reference.description}
                              </div>
                              <div className="text-[10px] text-[#64748B] font-mono">
                                Applicability: {selectedFinding.rule_reference.applicability}
                              </div>
                            </>
                          ) : (
                            <div className="text-[11px] text-[#475569]">
                              Pursuant to General Financial Rules (GFR 2017) Rule 173 and GeM GTC guidelines.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* EVIDENCE-FIRST DESIGN SECTION */}
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-[#0B2A4A] mb-2 flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Database className="w-3.5 h-3.5 text-[#0B2A4A]" />
                            EVIDENCE: Deterministic Supporting Records ({selectedFinding.evidence?.length || 0})
                          </span>
                          <span className="text-[10px] text-[#64748B] font-normal">
                            Zero Speculation • Verified Document Extractions &amp; Registry Lookups
                          </span>
                        </div>

                        {/* Evidence Records List */}
                        {selectedFinding.evidence && selectedFinding.evidence.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {selectedFinding.evidence.map((ev, idx) => (
                              <div
                                key={idx}
                                className="bg-[#F8FAFC] border border-[#CBD5E1] p-3 rounded-[2px] shadow-2xs space-y-1.5"
                              >
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="px-1.5 py-0.5 bg-[#E2E8F0] text-[#0B2A4A] font-mono font-bold rounded-[2px]">
                                    SOURCE: {ev.source_type}
                                  </span>
                                  {ev.source_id && (
                                    ev.source_id.startsWith('BID-') ? (
                                      <Link
                                        to={`/verification/${ev.source_id}`}
                                        className="text-[#0B2A4A] font-mono font-bold hover:underline inline-flex items-center gap-0.5"
                                        title={`Inspect bidder verification dossier for ${ev.source_id}`}
                                      >
                                        <span>Record: {ev.source_id}</span>
                                        <ExternalLink className="w-2.5 h-2.5" />
                                      </Link>
                                    ) : (
                                      <span className="text-[#64748B] font-mono">
                                        Record: {ev.source_id}
                                      </span>
                                    )
                                  )}
                                </div>

                                <div className="text-xs text-[#1E293B] font-medium leading-normal">
                                  {ev.description}
                                </div>

                                <div className="bg-white border border-[#E2E8F0] p-2 rounded-[2px] font-mono text-[11px] text-[#0B2A4A] flex items-center justify-between">
                                  <span className="text-[#64748B]">Field: <strong>{ev.field}</strong></span>
                                  <span className="font-bold text-[#DC2626] bg-[#FEF2F2] px-1.5 py-0.5 rounded-[2px] border border-[#FECACA] truncate max-w-[200px]">
                                    {typeof ev.value === 'object' ? JSON.stringify(ev.value) : String(ev.value)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 text-xs text-[#64748B] italic bg-[#F8FAFC] border border-[#E2E8F0] rounded-[2px]">
                            No separate itemized evidence records attached to this finding.
                          </div>
                        )}
                      </div>

                      {/* PROCEDURAL ACTION & OFFICER WORKSPACE */}
                      <div className="border-t border-[#E2E8F0] pt-3 space-y-3">
                        <div>
                          <div className="text-[11px] font-bold uppercase tracking-wider text-[#0B2A4A] mb-1 flex items-center gap-1">
                            <FileCheck className="w-3.5 h-3.5 text-[#0B2A4A]" />
                            Recommended Procedural Action
                          </div>
                          <div className="bg-[#FEFCE8] border border-[#FEF08A] p-3 rounded-[2px] text-xs text-[#713F12] leading-relaxed">
                            {selectedFinding.recommended_action}
                          </div>
                        </div>

                        {/* Officer Review Action Box */}
                        <div className="p-3.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-[2px] space-y-2.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-[#0B2A4A] uppercase tracking-wider text-[11px]">
                              Procurement Officer Review Action
                            </span>
                            <span className="text-[10px] text-[#64748B] font-mono">
                              Current Status: <strong>{selectedFinding.status}</strong>
                            </span>
                          </div>

                          {actionSuccess && (
                            <div className="p-2.5 bg-[#DEF7EC] border border-[#BCF0DA] text-[#03543F] rounded-[2px] text-xs font-semibold flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-[#03543F] shrink-0" />
                                <span>{actionSuccess}</span>
                              </div>
                              <Link to="/audit-trail" className="underline font-bold text-[#0B2A4A] hover:text-[#123B63] ml-2">
                                Audit Trail &rarr;
                              </Link>
                            </div>
                          )}

                          <textarea
                            rows={2}
                            placeholder="Enter administrative review note / clarification instruction..."
                            value={statusActionNote}
                            onChange={(e) => setStatusActionNote(e.target.value)}
                            className="w-full text-xs p-2 bg-white border border-[#CBD5E1] rounded-[2px] focus:outline-none focus:ring-1 focus:ring-[#0B2A4A]"
                          />

                          {/* Quick Templates */}
                          <div className="flex flex-wrap gap-1 items-center">
                            <span className="text-[10px] text-[#64748B] font-bold uppercase">Templates:</span>
                            <button
                              type="button"
                              onClick={() => setStatusActionNote("Called for itemized Bill of Quantities (BOQ) with unit material, labor, and equipment rates to verify independent cost estimation under GFR Rule 173.")}
                              className="px-2 py-0.5 text-[10px] bg-white hover:bg-[#E2E8F0] text-[#334155] border border-[#CBD5E1] rounded-[2px] cursor-pointer"
                            >
                              + BOQ Rate Break-up
                            </button>
                            <button
                              type="button"
                              onClick={() => setStatusActionNote("Required formal price justification and undertaking confirming independent bidding without collusion under GeM GTC Clause 19.")}
                              className="px-2 py-0.5 text-[10px] bg-white hover:bg-[#E2E8F0] text-[#334155] border border-[#CBD5E1] rounded-[2px] cursor-pointer"
                            >
                              + Price Justification
                            </button>
                            <button
                              type="button"
                              onClick={() => setStatusActionNote("Dispatched notice requesting corporate resolution and statutory PAN/GSTIN registration documentation to confirm independent management.")}
                              className="px-2 py-0.5 text-[10px] bg-white hover:bg-[#E2E8F0] text-[#334155] border border-[#CBD5E1] rounded-[2px] cursor-pointer"
                            >
                              + Statutory Verification
                            </button>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <button
                              onClick={() => handleOfficerAction('ACKNOWLEDGED', 'Finding acknowledged in official officer review record.', 'Acknowledge Finding')}
                              className="px-3 py-1.5 bg-[#0B2A4A] hover:bg-[#123B63] text-white text-xs font-semibold rounded-[2px] transition-colors cursor-pointer"
                            >
                              Acknowledge
                            </button>
                            <button
                              onClick={() => handleOfficerAction('UNDER_REVIEW', 'Flagged for formal bidder clarification under GFR 144.', 'Mark Under Review')}
                              className="px-3 py-1.5 bg-white text-[#0B2A4A] border border-[#0B2A4A] hover:bg-[#F0F5FA] text-xs font-semibold rounded-[2px] transition-colors cursor-pointer"
                            >
                              Under Review
                            </button>
                            <button
                              onClick={() => handleOfficerAction('UNDER_REVIEW', 'Dispatched clarification notice to participating bidders under GFR 173.', 'Request Clarification')}
                              className="px-3 py-1.5 bg-white text-[#0B2A4A] border border-[#0B2A4A] hover:bg-[#F0F5FA] text-xs font-semibold rounded-[2px] transition-colors cursor-pointer"
                            >
                              Request Clarification
                            </button>
                            <button
                              onClick={() => handleOfficerAction('RESOLVED', 'Bidder clarification verified and finding resolved.', 'Mark Resolved')}
                              className="px-3 py-1.5 bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0] hover:bg-[#DCFCE7] text-xs font-semibold rounded-[2px] transition-colors cursor-pointer"
                            >
                              Mark Resolved
                            </button>
                            <button
                              onClick={() => handleOfficerAction('DISMISSED', 'Evaluated as standard commercial market practice and dismissed.', 'Dismiss Finding')}
                              className="px-3 py-1.5 bg-[#F8FAFC] text-[#64748B] border border-[#CBD5E1] hover:bg-[#F1F5F9] text-xs font-semibold rounded-[2px] transition-colors cursor-pointer"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-[#64748B]">
                    <Eye className="w-6 h-6 text-[#94A3B8] mx-auto mb-2" />
                    Select a contributing signal above to inspect audit evidence and recommended procedural actions.
                  </div>
                )}
              </div>

              {/* ════════════════════════════════════════════════════════════════════
                  LEVEL 4: RELATIONSHIP NETWORK ("Who is connected to whom, and why?")
                  ════════════════════════════════════════════════════════════════════ */}
              <div className="bg-white border border-[#CBD5E1] rounded-[3px] shadow-xs overflow-hidden">
                <div className="p-3 bg-[#F8FAFC] border-b border-[#CBD5E1] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="font-bold text-sm text-[#0B2A4A] flex items-center gap-1.5">
                      <Network className="w-4 h-4 text-[#0B2A4A]" />
                      Entity Relationship Network
                    </h2>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      Answers: <em>&ldquo;Who is connected to whom, and why?&rdquo;</em> • Click any node or dashed connection to inspect evidence &amp; source.
                    </p>
                  </div>
                  <span className="text-[10px] text-[#64748B] font-mono whitespace-nowrap">
                    {assessment.findings.filter(
                      (f) => f.signal_type === 'RELATED_BIDDER' ||
                             f.signal_type === 'SHARED_ENTITY' ||
                             f.signal_type === 'COMMON_DIRECTOR_LINK' ||
                             f.signal_type === 'OFFICER_VENDOR_ASSOCIATION' ||
                             f.signal_type === 'DOCUMENT_IDENTITY_INCONSISTENCY'
                    ).length} relationship finding(s)
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

              {/* ════════════════════════════════════════════════════════════════════
                  LEVEL 5: STATUTORY RISK BASIS & EVALUATION PARAMETERS (Expandable)
                  ════════════════════════════════════════════════════════════════════ */}
              {assessment.risk_basis && (
                <div className="bg-white border border-[#CBD5E1] rounded-[3px] shadow-xs overflow-hidden">
                  <div
                    className="p-3 bg-[#F8FAFC] border-b border-[#CBD5E1] flex items-center justify-between cursor-pointer select-none"
                    onClick={() => setShowRiskBasis(!showRiskBasis)}
                  >
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-[#0B2A4A]" />
                      <h3 className="font-bold text-xs text-[#0B2A4A] uppercase tracking-wider">
                        Risk Basis &amp; Evaluation Parameters
                      </h3>
                      <span className="text-[10px] text-[#64748B] hidden md:inline">
                        Active statutory and statistical thresholds used to evaluate this procurement
                      </span>
                    </div>
                    {showRiskBasis ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
                  </div>

                  {showRiskBasis && (
                    <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[2px]">
                        <div className="text-[10px] font-bold uppercase text-[#64748B]">Price Delta Margin</div>
                        <div className="text-sm font-bold font-mono text-[#0B2A4A] mt-0.5">
                          ≤ {assessment.risk_basis.price_similarity_threshold_pct}%
                        </div>
                        <div className="text-[10px] text-[#64748B] mt-0.5">Quotes within 1% trigger verification</div>
                      </div>

                      <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[2px]">
                        <div className="text-[10px] font-bold uppercase text-[#64748B]">Supplier Concentration</div>
                        <div className="text-sm font-bold font-mono text-[#0B2A4A] mt-0.5">
                          ≥ {(Number(assessment.risk_basis.winner_concentration_ratio) * 100).toFixed(0)}%
                        </div>
                        <div className="text-[10px] text-[#64748B] mt-0.5">Min {assessment.risk_basis.min_historical_tenders_concentration} historical awards</div>
                      </div>

                      <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[2px]">
                        <div className="text-[10px] font-bold uppercase text-[#64748B]">Cohort / Rotation Quorum</div>
                        <div className="text-sm font-bold font-mono text-[#0B2A4A] mt-0.5">
                          ≥ {assessment.risk_basis.min_co_participations} Joint Tenders
                        </div>
                        <div className="text-[10px] text-[#64748B] mt-0.5">Rotation horizon: ≥ {assessment.risk_basis.min_rotation_tenders} tenders</div>
                      </div>

                      <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[2px]">
                        <div className="text-[10px] font-bold uppercase text-[#64748B]">Bid-to-Estimate Anomaly</div>
                        <div className="text-sm font-bold font-mono text-[#0B2A4A] mt-0.5">
                          ≤ {assessment.risk_basis.bid_to_estimate_threshold_pct}%
                        </div>
                        <div className="text-[10px] text-[#64748B] mt-0.5">Proximity to confidential estimate</div>
                      </div>

                      <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[2px]">
                        <div className="text-[10px] font-bold uppercase text-[#64748B]">Narrow Market Quorum</div>
                        <div className="text-sm font-bold font-mono text-[#0B2A4A] mt-0.5">
                          ≤ {assessment.risk_basis.narrow_competition_max_bidders} Qualified Bidders
                        </div>
                        <div className="text-[10px] text-[#64748B] mt-0.5">Repeated in category competitions</div>
                      </div>

                      <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[2px]">
                        <div className="text-[10px] font-bold uppercase text-[#64748B]">Officer-Bidder Linkage</div>
                        <div className="text-sm font-bold text-[#0B2A4A] mt-0.5">
                          Audited Decisions Only
                        </div>
                        <div className="text-[10px] text-[#64748B] mt-0.5">Zero speculative officer links</div>
                      </div>

                      <div className="sm:col-span-2 p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[2px]">
                        <div className="text-[10px] font-bold uppercase text-[#64748B]">Cross-Bidder Identity Keys</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {assessment.risk_basis.statutory_identity_keys?.map((k) => (
                            <span key={k} className="px-1.5 py-0.5 bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E3A8A] font-mono font-bold text-[10px] rounded-[2px]">
                              {k} (Statutory)
                            </span>
                          ))}
                          {assessment.risk_basis.operational_identity_keys?.map((k) => (
                            <span key={k} className="px-1.5 py-0.5 bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] font-mono text-[10px] rounded-[2px]">
                              {k} (Operational)
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Statutory Decision-Support Notice (Footer) ── */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-[3px] text-[11px] text-[#475569] leading-relaxed flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-[#64748B] flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#334155]">Statutory Advisory:</strong> Algorithmic integrity evaluations provide deterministic decision support pursuant to General Financial Rules (GFR 2017) and GeM guidelines. All signals represent administrative review triggers requiring officer verification and do not constitute formal disqualification or investigative findings.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcurementIntegrity;
