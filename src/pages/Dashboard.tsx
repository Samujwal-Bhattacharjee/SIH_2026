import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  RefreshCw,
  PlusCircle,
  ScanLine,
  FileText,
  Building2,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  BrainCircuit,
} from 'lucide-react';
import { dashboardService, casesService, auditService, departmentService } from '../services/api';
import { DashboardMetrics, Case, AuditLog, DepartmentInfo } from '../types';
import { GovCard } from '../components/common/GovCard';
import { GovButton } from '../components/common/GovButton';
import { StatusBadge } from '../components/common/GovBadge';
import { TableSkeleton } from '../components/common/LoadingSkeleton';
import { FileRegisterModal } from '../components/files/FileRegisterModal';
import { useLanguage } from '../context/LanguageContext';

export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [overdueCases, setOverdueCases] = useState<Case[]>([]);
  const [recentAuditLogs, setRecentAuditLogs] = useState<AuditLog[]>([]);
  const [departments, setDepartments] = useState<DepartmentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [dashMetrics, casesRes, auditRes, deptsRes] = await Promise.all([
        dashboardService.getMetrics(),
        casesService.getCases(),
        auditService.getAuditLogs(),
        departmentService.getDepartments(),
      ]);
      setMetrics(dashMetrics);
      const overdue = casesRes.cases.filter(
        (c) => c.status === 'OVERDUE' || c.daysRemaining < 0 || c.riskLevel === 'HIGH' || (c.delayProbability && c.delayProbability >= 0.6)
      );
      setOverdueCases(overdue);
      setRecentAuditLogs(auditRes.slice(0, 5));
      if (deptsRes && deptsRes.length > 0) setDepartments(deptsRes);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading || !metrics) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-64 bg-gray-200 rounded-[2px]" />
        <div className="h-20 bg-white border border-[#D9DDE3] rounded-[2px]" />
        <TableSkeleton rows={5} cols={5} />
      </div>
    );
  }

  const stageBottlenecks = [
    { name: 'Survey and Verification', expected: 45, actual: 48, pct: 106, status: 'NORMAL' },
    { name: 'Ownership Verification', expected: 30, actual: 46, pct: 153, status: 'CRITICAL', delay: '+16d' },
    { name: 'Compensation Assessment', expected: 60, actual: 68, pct: 113, status: 'WARNING', delay: '+8d' },
    { name: 'Compensation Disbursement', expected: 90, actual: 118, pct: 131, status: 'CRITICAL', delay: '+28d' },
    { name: 'R&R and Rehabilitation', expected: 120, actual: 127, pct: 105, status: 'NORMAL' },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Page Title with Institutional Accent Rule */}
      <div className="border-b border-[#D9DDE3] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-serif font-bold text-xl sm:text-2xl text-[#0B3558] tracking-tight">
              {language === 'hi' ? 'खरीद बोली अनुपालन डैशबोर्ड' : 'Government Procurement Compliance & Intelligence Dashboard'}
            </h1>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-bold uppercase rounded-[2px] border border-emerald-300 font-mono">
              Rule Evaluator v2.1
            </span>
          </div>
          <p className="text-xs text-[#5F6368] mt-0.5 font-sans">
            Government Procurement • Evidence-Based Bid Compliance Verification &amp; Decision Support Platform (SIH26100)
          </p>
          <div className="h-0.5 w-20 bg-[#E87511] mt-1.5" />
        </div>

        <div className="flex items-center space-x-2">
          <GovButton
            variant="secondary"
            size="sm"
            onClick={fetchDashboardData}
            icon={<RefreshCw className="w-3.5 h-3.5 text-[#0B3558]" />}
          >
            Refresh Data
          </GovButton>
          <GovButton
            variant="primary"
            size="sm"
            onClick={() => setIsRegisterOpen(true)}
            icon={<PlusCircle className="w-3.5 h-3.5" />}
          >
            New Land Project
          </GovButton>
        </div>
      </div>

      {/* CONTINUOUS GOVERNMENT METRIC STRIP (Single cohesive bar, NOT 6 floating boxes) */}
      <div className="bg-white border border-[#CBD2DE] border-t-2 border-t-[#0B3558] rounded-[2px] grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-y sm:divide-y-0 divide-[#D9DDE3] select-none">
        <div className="p-3.5 space-y-0.5">
          <span className="text-[10px] uppercase font-bold text-[#5F6368] tracking-wider block">
            TOTAL PROJECTS
          </span>
          <div className="text-2xl font-bold font-serif text-[#0B3558]">
            {metrics.totalActiveCases.toLocaleString()}
          </div>
          <span className="text-[11px] text-[#5F6368] block">Statewide Registry</span>
        </div>

        <div className="p-3.5 space-y-0.5 bg-[#FFFDF8]">
          <span className="text-[10px] uppercase font-bold text-[#D97706] tracking-wider block">
            HIGH DELAY RISK
          </span>
          <div className="text-2xl font-bold font-serif text-[#D97706]">
            {metrics.slaAtRiskCount || 14}
          </div>
          <span className="text-[11px] text-[#D97706] font-semibold block">P(Delay) ≥ 60%</span>
        </div>

        <div className="p-3.5 space-y-0.5 bg-[#FFF9F9]">
          <span className="text-[10px] uppercase font-bold text-[#B72025] tracking-wider block">
            STAGE OVERDUE
          </span>
          <div className="text-2xl font-bold font-serif text-[#B72025]">
            {metrics.slaBreachedCount || 6}
          </div>
          <span className="text-[11px] text-[#B72025] font-semibold block">Exceeded Baseline</span>
        </div>

        <div className="p-3.5 space-y-0.5">
          <span className="text-[10px] uppercase font-bold text-[#5F6368] tracking-wider block">
            AVG STAGE DWELL
          </span>
          <div className="text-2xl font-bold font-serif text-[#0B3558]">
            {metrics.avgProcessingDays || 28.4}d
          </div>
          <span className="text-[11px] text-[#5F6368] block">Processing Days</span>
        </div>

        <div className="p-3.5 space-y-0.5">
          <span className="text-[10px] uppercase font-bold text-[#5F6368] tracking-wider block">
            TOP BOTTLENECK
          </span>
          <div className="text-sm font-bold font-serif text-[#1E5C99] truncate">
            {metrics.primaryBottleneck.stage || 'Compensation'}
          </div>
          <span className="text-[11px] text-[#1E5C99] font-semibold block">
            +{metrics.primaryBottleneck.avgWaitDays}d Avg Excess
          </span>
        </div>

        <div className="p-3.5 space-y-0.5 bg-[#F9FDF9]">
          <span className="text-[10px] uppercase font-bold text-[#15803D] tracking-wider block">
            ON TRACK
          </span>
          <div className="text-2xl font-bold font-serif text-[#15803D]">
            {(metrics.totalActiveCases - metrics.slaBreachedCount - metrics.slaAtRiskCount).toLocaleString()}
          </div>
          <span className="text-[11px] text-[#15803D] font-semibold block">Within Statutory SLA</span>
        </div>
      </div>

      {/* Main 2-Column Section Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): High-Priority Escalation Table & Bottleneck Chart */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Critical Delay Risk Projects Table */}
          <GovCard
            title={
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 bg-[#B72025] text-white text-[10px] font-bold uppercase rounded-[2px]">
                  ACTION REQUIRED
                </span>
                <span className="font-serif font-bold text-sm text-[#0B3558]">
                  High Risk &amp; Exception Bidders ({overdueCases.length})
                </span>
              </div>
            }
            subtitle="Bidder submissions flagged with compliance exceptions or requiring officer intervention."
            highlightBorder="red"
            headerAction={
              <Link
                to="/tenders"
                className="text-xs text-[#0B3558] hover:underline font-semibold flex items-center space-x-1"
              >
                <span>View Tender Register</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
            noPadding
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0B3558] text-white border-b-2 border-[#040E1A]">
                    <th className="p-2.5 font-semibold">Project Code</th>
                    <th className="p-2.5 font-semibold">Project &amp; District</th>
                    <th className="p-2.5 font-semibold">Current Stage</th>
                    <th className="p-2.5 font-semibold text-center">Delay Prob / Est</th>
                    <th className="p-2.5 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9DDE3]">
                  {overdueCases.slice(0, 5).map((item, idx) => {
                    const prob = item.delayProbability ?? (item.riskScore / 100);
                    const probPct = Math.round(prob * 100);
                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-[#FFF8F8] transition-colors ${idx % 2 === 1 ? 'bg-[#F9FAFB]' : 'bg-white'}`}
                      >
                        <td className="p-2.5 font-mono font-bold text-[#0B3558]">
                          <Link to={`/projects/${item.id}`} className="hover:underline">
                            {item.projectCode || item.fileNumber || item.id}
                          </Link>
                        </td>
                        <td className="p-2.5 max-w-[220px]">
                          <div className="font-semibold text-[#202124] truncate">{item.title}</div>
                          <div className="text-[11px] text-[#5F6368] flex items-center space-x-1">
                            <span className="font-medium text-[#0B3558]">{item.district || 'Nashik'}</span>
                            <span>•</span>
                            <span className="text-amber-800">{item.department}</span>
                          </div>
                        </td>
                        <td className="p-2.5">
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-800 font-mono text-[11px] rounded-[2px] border border-gray-300">
                            {item.currentStage}
                          </span>
                        </td>
                        <td className="p-2.5 text-center font-mono">
                          <div className="flex flex-col items-center">
                            <span className={`px-2 py-0.5 rounded-[2px] font-bold text-[11px] border ${
                              probPct >= 80 ? 'bg-red-50 text-red-800 border-red-300' :
                              probPct >= 60 ? 'bg-amber-50 text-amber-800 border-amber-300' :
                              'bg-green-50 text-green-800 border-green-300'
                            }`}>
                              {probPct}% P(Delay)
                            </span>
                            {item.predictedDelayDays ? (
                              <span className="text-[10px] text-red-700 font-bold mt-0.5">
                                +{item.predictedDelayDays}d est. delay
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="p-2.5 text-right whitespace-nowrap">
                          <GovButton
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate(`/projects/${item.id}`)}
                          >
                            Inspect Dossier
                          </GovButton>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </GovCard>

          {/* 2. Statutory Stage Bottleneck Comparison (Horizontal Progress Analysis) */}
          <GovCard
            title="Statutory Stage Bottleneck Analysis (Expected vs Observed Dwell)"
            subtitle="Identification of procedural stages causing timeline deviations across districts."
            highlightBorder="saffron"
            headerAction={
              <Link to="/workflow" className="text-xs text-[#0B3558] hover:underline font-semibold">
                Process Map →
              </Link>
            }
          >
            <div className="space-y-3 text-xs">
              {stageBottlenecks.map((stg, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#0B3558] flex items-center space-x-1.5">
                      <span>{stg.name}</span>
                      {stg.status === 'CRITICAL' && (
                        <span className="px-1 py-0.2 bg-red-100 text-red-800 text-[9px] font-bold rounded">
                          CRITICAL {stg.delay}
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-[#5F6368]">
                      Baseline: <strong>{stg.expected}d</strong> | Actual: <strong className={stg.status === 'CRITICAL' ? 'text-red-700 font-bold' : ''}>{stg.actual}d</strong>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-[1px] overflow-hidden flex">
                    <div
                      className={`h-full transition-all ${
                        stg.status === 'CRITICAL' ? 'bg-[#B72025]' :
                        stg.status === 'WARNING' ? 'bg-[#D97706]' :
                        'bg-[#1E5C99]'
                      }`}
                      style={{ width: `${Math.min(stg.pct, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GovCard>
        </div>

        {/* Right Column (5 cols): Operational Directives & Live Movement Ledger */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. Quick Administrative Action Console */}
          <GovCard title="Administrative Directives &amp; Quick Ingestion">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => navigate('/tenders')}
                className="p-3 bg-[#F8F9FA] hover:bg-[#EEF2F7] border border-[#CBD2DE] rounded-[2px] text-left transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-[#0B3558] mb-1" />
                <strong className="block text-[#0B3558]">Create Tender</strong>
                <span className="text-[10px] text-[#5F6368]">Initiate procurement</span>
              </button>

              <button
                onClick={() => navigate('/documents/upload')}
                className="p-3 bg-[#F8F9FA] hover:bg-[#EEF2F7] border border-[#CBD2DE] rounded-[2px] text-left transition-colors cursor-pointer"
              >
                <ScanLine className="w-4 h-4 text-[#0B3558] mb-1" />
                <strong className="block text-[#0B3558]">Upload &amp; OCR</strong>
                <span className="text-[10px] text-[#5F6368]">Certificates &amp; bid docs</span>
              </button>

              <button
                onClick={() => navigate('/verification/BID-001')}
                className="p-3 bg-[#F8F9FA] hover:bg-[#EEF2F7] border border-[#CBD2DE] rounded-[2px] text-left transition-colors cursor-pointer"
              >
                <TrendingUp className="w-4 h-4 text-[#0B3558] mb-1" />
                <strong className="block text-[#0B3558]">Bidder Verification</strong>
                <span className="text-[10px] text-[#5F6368]">Review compliance</span>
              </button>

              <button
                onClick={() => navigate('/verification-sources')}
                className="p-3 bg-[#F8F9FA] hover:bg-[#EEF2F7] border border-[#CBD2DE] rounded-[2px] text-left transition-colors cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-[#0B3558] mb-1" />
                <strong className="block text-[#0B3558]">Verification Sources</strong>
                <span className="text-[10px] text-[#5F6368]">Sandbox adapters</span>
              </button>
            </div>
          </GovCard>

          {/* 2. Critical Bottleneck Diagnostic Summary */}
          <GovCard
            title={
              <div className="flex items-center space-x-2">
                <span className="px-1.5 py-0.5 bg-[#D97706] text-white text-[10px] font-bold uppercase rounded-[2px]">
                  SYSTEM BOTTLENECK
                </span>
                <span className="font-serif font-bold text-xs text-[#0B3558]">
                  {metrics.primaryBottleneck.stage || 'Compensation Disbursement'}
                </span>
              </div>
            }
            highlightBorder="saffron"
          >
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between font-mono bg-[#FFFBEB] p-2.5 border border-[#FDE68A] rounded-[2px]">
                <span className="text-[#92400E] font-medium">Excess Dwell Beyond Baseline:</span>
                <span className="font-bold text-[#D97706] text-sm">
                  +{metrics.primaryBottleneck.avgWaitDays} Days
                </span>
              </div>
              <p className="text-[#5F6368] text-[11px] leading-relaxed">
                Projects undergoing {metrics.primaryBottleneck.stage || 'Compensation Disbursement'} are accumulating the largest dwell backlogs. Primary causes include multi-party co-sharer title disputes and delay in District Treasury grant allocations.
              </p>
              <div className="pt-2 border-t border-[#D9DDE3] flex items-center justify-between">
                <span className="text-[11px] text-[#5F6368]">Recommended Action:</span>
                <Link
                  to="/intelligence"
                  className="text-xs text-[#0B3558] font-bold hover:underline flex items-center space-x-1"
                >
                  <span>Diagnostic Report →</span>
                </Link>
              </div>
            </div>
          </GovCard>

          {/* 3. Recent Official Movement Register */}
          <GovCard
            title="Recent Movement Ledger &amp; OCR Extractions"
            subtitle="Tamper-evident log of project transitions and document OCR indexing."
            headerAction={
              <Link to="/audit-logs" className="text-xs text-[#0B3558] hover:underline font-semibold">
                Full Log →
              </Link>
            }
            noPadding
          >
            <div className="divide-y divide-[#D9DDE3] text-xs">
              {recentAuditLogs.map((log) => (
                <div key={log.id} className="p-3 hover:bg-[#F8F9FA] transition-colors">
                  <div className="flex items-center justify-between text-[11px] text-gray-500 mb-0.5">
                    <span className="font-mono font-semibold text-[#0B3558]">
                      {log.fileNumber || 'LA-1024'}
                    </span>
                    <span className="font-mono">{log.timestamp.split('T')[1]?.slice(0, 5) || '11:42'}</span>
                  </div>
                  <div className="font-medium text-[#202124]">{log.action}</div>
                  <div className="text-[11px] text-[#5F6368] flex items-center space-x-2 mt-0.5">
                    <span>{log.officerName || 'System Admin'}</span>
                    <span>•</span>
                    <span className="text-[#15803D] font-mono font-semibold">RECORDED</span>
                  </div>
                </div>
              ))}
            </div>
          </GovCard>
        </div>
      </div>

      {/* Inward Project Register Modal */}
      <FileRegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onCreated={(newCase) => {
          setIsRegisterOpen(false);
          navigate(`/projects/${newCase.id}`);
        }}
      />
    </div>
  );
};

export default Dashboard;
