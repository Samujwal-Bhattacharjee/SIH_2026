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
} from 'lucide-react';
import { dashboardService, casesService } from '../services/api';
import { DashboardMetrics, Case } from '../types';
import { GovCard } from '../components/common/GovCard';
import { GovButton } from '../components/common/GovButton';
import { StatusBadge } from '../components/common/GovBadge';
import { TableSkeleton } from '../components/common/LoadingSkeleton';
import { FileForwardModal } from '../components/files/FileForwardModal';
import { FileRegisterModal } from '../components/files/FileRegisterModal';
import { useLanguage } from '../context/LanguageContext';
import { MOCK_CASE_EVENTS, MOCK_DEPARTMENTS } from '../mock/data';

export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [overdueCases, setOverdueCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCaseForForward, setSelectedCaseForForward] = useState<Case | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const { t } = useLanguage();
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [dashMetrics, casesRes] = await Promise.all([
        dashboardService.getMetrics(),
        casesService.getCases(),
      ]);
      setMetrics(dashMetrics);
      // Filter overdue cases
      const overdue = casesRes.cases.filter(
        (c) => c.status === 'OVERDUE' || c.daysRemaining < 0 || c.riskLevel === 'HIGH'
      );
      setOverdueCases(overdue);
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
        <div className="h-8 w-64 bg-gray-200 rounded-[2px]" />
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 bg-white border border-[#D9DDE3] rounded-[3px]" />
          ))}
        </div>
        <TableSkeleton rows={4} cols={5} />
      </div>
    );
  }

  // Aggregate recent movement events across cases
  const allEvents = Object.values(MOCK_CASE_EVENTS)
    .flat()
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Page Title & Operational Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#D9DDE3] pb-3 gap-2">
        <div>
          <h1 className="font-serif font-bold text-2xl text-[#0B2A4A] tracking-tight">
            Executive Operations Dashboard
          </h1>
          <p className="text-xs text-[#5F6368] mt-0.5">
            Statewide registry overview, statutory SLA tracking, and departmental queue intelligence.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <GovButton
            variant="secondary"
            size="sm"
            onClick={fetchDashboardData}
            icon={<RefreshCw className="w-3.5 h-3.5 text-[#0B2A4A]" />}
          >
            Refresh
          </GovButton>
          <GovButton
            variant="primary"
            size="sm"
            onClick={() => setIsRegisterOpen(true)}
            icon={<PlusCircle className="w-3.5 h-3.5" />}
          >
            Register Inward File
          </GovButton>
        </div>
      </div>

      {/* 6 Clean Operational KPI Panels (Decluttered, High Contrast) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 select-none">
        <div className="p-3.5 bg-white border border-[#D9DDE3] border-t-[3px] border-t-[#0B2A4A] rounded-[3px] shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#5F6368] tracking-wider block">
            {t('stat.totalFiles')}
          </span>
          <div className="text-2xl font-bold font-serif text-[#0B2A4A]">
            {metrics.totalActiveCases.toLocaleString()}
          </div>
          <span className="text-[11px] text-[#5F6368] block">8 State Departments</span>
        </div>

        <div className="p-3.5 bg-white border border-[#D9DDE3] border-t-[3px] border-t-[#1D4ED8] rounded-[3px] shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#5F6368] tracking-wider block">
            {t('stat.todayReceived')}
          </span>
          <div className="text-2xl font-bold font-serif text-[#1D4ED8]">
            {metrics.todayReceivedCount || 148}
          </div>
          <span className="text-[11px] text-[#5F6368] block">Inward Register Entries</span>
        </div>

        <div className="p-3.5 bg-white border border-[#D9DDE3] border-t-[3px] border-t-[#173F67] rounded-[3px] shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#5F6368] tracking-wider block">
            {t('stat.inProcess')}
          </span>
          <div className="text-2xl font-bold font-serif text-[#173F67]">
            {(metrics.inProcessCount || 6820).toLocaleString()}
          </div>
          <span className="text-[11px] text-[#5F6368] block">Under Active Scrutiny</span>
        </div>

        <div className="p-3.5 bg-white border border-[#D9DDE3] border-t-[3px] border-t-[#D97706] rounded-[3px] shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#5F6368] tracking-wider block">
            {t('stat.pendingTotal')}
          </span>
          <div className="text-2xl font-bold font-serif text-[#D97706]">
            {metrics.pendingQueue.toLocaleString()}
          </div>
          <span className="text-[11px] text-[#D97706] font-semibold block">
            {metrics.slaAtRiskCount} Approaching SLA
          </span>
        </div>

        <div className="p-3.5 bg-white border border-[#D9DDE3] border-t-[3px] border-t-[#C62828] rounded-[3px] shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#C62828] tracking-wider block">
            {t('stat.slaOverdue')}
          </span>
          <div className="text-2xl font-bold font-serif text-[#C62828]">
            {metrics.slaBreachedCount}
          </div>
          <span className="text-[11px] text-[#C62828] font-semibold block">Exceeding SLA Limit</span>
        </div>

        <div className="p-3.5 bg-white border border-[#D9DDE3] border-t-[3px] border-t-[#15803D] rounded-[3px] shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#5F6368] tracking-wider block">
            {t('stat.disposedTotal')}
          </span>
          <div className="text-2xl font-bold font-serif text-[#15803D]">
            {(metrics.disposedCount || 4210).toLocaleString()}
          </div>
          <span className="text-[11px] text-[#15803D] font-semibold block">Quarterly Disposals</span>
        </div>
      </div>

      {/* Main 2-Column Structured Dashboard Layout (Clean & Decluttered) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Core Registry Priorities & Workload */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Critical Overdue SLA Queue */}
          <GovCard
            title={
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 bg-[#C62828] text-white text-[10px] font-bold uppercase rounded-[2px] tracking-wide">
                  STATUTORY SLA OVERDUE
                </span>
                <span className="font-serif font-bold text-sm text-[#0B2A4A]">
                  Priority Escalation Queue ({overdueCases.length})
                </span>
              </div>
            }
            subtitle="Files exceeding mandatory turnaround time under citizen charter rules."
            highlightBorder="red"
            headerAction={
              <Link
                to="/pending"
                className="text-xs text-[#0B2A4A] hover:underline font-semibold flex items-center space-x-1"
              >
                <span>View All ({overdueCases.length})</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            }
            noPadding
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0B2A4A] text-white border-b border-[#071A2E]">
                    <th className="p-2.5 font-semibold">File Number</th>
                    <th className="p-2.5 font-semibold">Subject Matter</th>
                    <th className="p-2.5 font-semibold">Department</th>
                    <th className="p-2.5 font-semibold text-center">Days Overdue</th>
                    <th className="p-2.5 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9DDE3]">
                  {overdueCases.slice(0, 4).map((item, idx) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-[#FFF8F8] transition-colors ${
                        idx % 2 === 1 ? 'bg-[#FCFDFD]' : 'bg-white'
                      }`}
                    >
                      <td className="p-2.5 font-mono font-bold text-[#0B2A4A]">
                        <Link to={`/files/${item.id}`} className="hover:underline">
                          {item.fileNumber || item.id}
                        </Link>
                      </td>
                      <td className="p-2.5 font-medium text-[#202124] max-w-[200px] truncate">
                        {item.subject || item.title}
                      </td>
                      <td className="p-2.5 text-[#5F6368]">{item.department}</td>
                      <td className="p-2.5 text-center font-mono">
                        <span className="px-2 py-0.5 bg-white text-[#C62828] border border-[#C62828] rounded-[2px] font-bold text-[11px]">
                          +{Math.abs(item.daysRemaining)}d
                        </span>
                      </td>
                      <td className="p-2.5 text-right space-x-1 whitespace-nowrap">
                        <GovButton
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate(`/files/${item.id}`)}
                        >
                          Docket
                        </GovButton>
                        <GovButton
                          variant="danger"
                          size="sm"
                          onClick={() => setSelectedCaseForForward(item)}
                        >
                          Forward
                        </GovButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GovCard>

          {/* 2. Department Workload & SLA Matrix */}
          <GovCard
            title="Department Workload &amp; SLA Compliance"
            subtitle="Current active inventory and compliance percentage across state departments."
            headerAction={
              <Link to="/departments" className="text-xs text-[#0B2A4A] hover:underline font-semibold">
                Directory →
              </Link>
            }
            noPadding
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0B2A4A] text-white border-b border-[#071A2E]">
                    <th className="p-2.5 font-semibold">Department</th>
                    <th className="p-2.5 font-semibold text-center">Active Dockets</th>
                    <th className="p-2.5 font-semibold text-center">Pending</th>
                    <th className="p-2.5 font-semibold text-center">Avg Disposal</th>
                    <th className="p-2.5 font-semibold text-right">SLA Adherence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9DDE3]">
                  {MOCK_DEPARTMENTS.slice(0, 5).map((dept, idx) => (
                    <tr
                      key={dept.id}
                      className={idx % 2 === 1 ? 'bg-[#F9FAFB]' : 'bg-white'}
                    >
                      <td className="p-2.5 font-semibold text-[#0B2A4A]">
                        {dept.name}
                      </td>
                      <td className="p-2.5 text-center font-mono">{dept.activeFilesCount.toLocaleString()}</td>
                      <td className="p-2.5 text-center font-mono font-semibold text-[#D97706]">
                        {dept.pendingFilesCount}
                      </td>
                      <td className="p-2.5 text-center font-mono text-[#5F6368]">
                        {dept.avgDisposalDays}d
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-[#15803D]">
                        {dept.slaCompliancePct}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GovCard>
        </div>

        {/* Right Column (5 cols): Actions, Bottleneck Alert & Live Feed */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. Administrative Action Portal */}
          <GovCard title="Administrative Action Portal">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => setIsRegisterOpen(true)}
                className="p-3 bg-[#F0F5FA] hover:bg-[#E6EEF5] border border-[#CBD2DE] rounded-[3px] text-left transition-colors cursor-pointer group"
              >
                <PlusCircle className="w-4 h-4 text-[#0B2A4A] mb-1 group-hover:scale-105 transition-transform" />
                <strong className="block text-[#0B2A4A]">Register File</strong>
                <span className="text-[10px] text-[#5F6368]">Issue new file docket</span>
              </button>

              <button
                onClick={() => navigate('/documents/upload')}
                className="p-3 bg-[#F0F5FA] hover:bg-[#E6EEF5] border border-[#CBD2DE] rounded-[3px] text-left transition-colors cursor-pointer group"
              >
                <ScanLine className="w-4 h-4 text-[#0B2A4A] mb-1 group-hover:scale-105 transition-transform" />
                <strong className="block text-[#0B2A4A]">Upload &amp; OCR</strong>
                <span className="text-[10px] text-[#5F6368]">Digitize document</span>
              </button>

              <button
                onClick={() => navigate('/search')}
                className="p-3 bg-[#F0F5FA] hover:bg-[#E6EEF5] border border-[#CBD2DE] rounded-[3px] text-left transition-colors cursor-pointer group"
              >
                <FileText className="w-4 h-4 text-[#0B2A4A] mb-1 group-hover:scale-105 transition-transform" />
                <strong className="block text-[#0B2A4A]">Search Registry</strong>
                <span className="text-[10px] text-[#5F6368]">Full-text &amp; OCR search</span>
              </button>

              <button
                onClick={() => navigate('/reports')}
                className="p-3 bg-[#F0F5FA] hover:bg-[#E6EEF5] border border-[#CBD2DE] rounded-[3px] text-left transition-colors cursor-pointer group"
              >
                <Building2 className="w-4 h-4 text-[#0B2A4A] mb-1 group-hover:scale-105 transition-transform" />
                <strong className="block text-[#0B2A4A]">SLA Reports</strong>
                <span className="text-[10px] text-[#5F6368]">Disposal matrix &amp; CSV</span>
              </button>
            </div>
          </GovCard>

          {/* 2. Bottleneck Delay Intelligence Summary */}
          <GovCard
            title="Sectional Bottleneck Intelligence"
            subtitle="Calculated delay deviations across state departments."
            highlightBorder="saffron"
            headerAction={
              <Link to="/intelligence" className="text-xs text-[#0B2A4A] hover:underline font-semibold">
                Intelligence →
              </Link>
            }
          >
            <div className="p-3 bg-white border-l-4 border-l-[#D97706] border border-[#D9DDE3] rounded-[3px] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#0B2A4A]">
                  {metrics.primaryBottleneck.stage} ({metrics.primaryBottleneck.department})
                </span>
                <span className="px-2 py-0.5 bg-white text-[#C62828] border border-[#C62828] rounded-[2px] font-bold text-[10px]">
                  +{metrics.primaryBottleneck.deviationPct.toFixed(0)}% ABOVE BASELINE
                </span>
              </div>
              <p className="text-[#202124] text-[11px] leading-relaxed">
                {metrics.primaryBottleneck.rootCauseDescription}
              </p>
              <div className="flex items-center justify-between text-[11px] text-[#5F6368] font-mono pt-1 border-t border-gray-100">
                <span>IMPACTED: <strong className="text-[#0B2A4A]">{metrics.primaryBottleneck.impactedCasesCount} Files</strong></span>
                <span>AVG WAIT: <strong className="text-[#C62828]">{metrics.primaryBottleneck.avgWaitDays}d</strong></span>
              </div>
            </div>
          </GovCard>

          {/* 3. Live File Movement Feed */}
          <GovCard
            title="Recent File Movement Ledger"
            subtitle="Latest handoffs recorded across desks."
            headerAction={
              <Link to="/audit-logs" className="text-xs text-[#0B2A4A] hover:underline font-semibold">
                Audit Trail →
              </Link>
            }
          >
            <div className="space-y-2.5">
              {allEvents.map((ev, index) => (
                <div
                  key={ev.id || index}
                  className="p-2.5 bg-[#F8F9FA] border border-[#D9DDE3] rounded-[3px] space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between text-[11px] text-[#5F6368]">
                    <span className="font-bold text-[#0B2A4A]">Docket: {ev.caseId}</span>
                    <span className="font-mono text-[10px]">{ev.timestamp}</span>
                  </div>
                  <div className="text-[#202124] font-medium text-xs">
                    <span>{ev.stage}</span>
                    <span className="text-gray-400 mx-1.5">•</span>
                    <span className="text-[#5F6368] text-[11px]">Officer: {ev.officer}</span>
                  </div>
                </div>
              ))}
            </div>
          </GovCard>
        </div>
      </div>

      {/* Forward Modal */}
      {selectedCaseForForward && (
        <FileForwardModal
          isOpen={!!selectedCaseForForward}
          onClose={() => setSelectedCaseForForward(null)}
          caseItem={selectedCaseForForward}
          onForwarded={() => {
            setSelectedCaseForForward(null);
            fetchDashboardData();
          }}
        />
      )}

      {/* Register Inward File Modal */}
      <FileRegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onCreated={(newCase) => {
          setIsRegisterOpen(false);
          navigate(`/files/${newCase.id}`);
        }}
      />
    </div>
  );
};
