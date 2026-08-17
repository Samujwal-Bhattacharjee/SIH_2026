import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BrainCircuit,
  AlertTriangle,
  Clock,
  TrendingUp,
  BarChart3,
  Building2,
  ArrowRight,
  ShieldAlert,
  GitBranch,
  RefreshCw,
} from 'lucide-react';
import { workflowService, analyticsService, riskService } from '../services/api';
import { ProcessMapData, ProcessPerformanceMetrics, Case } from '../types';
import { GovCard } from '../components/common/GovCard';
import { GovButton } from '../components/common/GovButton';
import { StatusBadge } from '../components/common/GovBadge';
import { TableSkeleton } from '../components/common/LoadingSkeleton';
import { MOCK_BOTTLENECKS } from '../mock/data';

export const Intelligence: React.FC = () => {
  const [processMap, setProcessMap] = useState<ProcessMapData | null>(null);
  const [metrics, setMetrics] = useState<ProcessPerformanceMetrics | null>(null);
  const [riskCases, setRiskCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchIntelligenceData = async () => {
    setLoading(true);
    try {
      const [mapRes, perfRes, riskRes] = await Promise.all([
        workflowService.getProcessMap(),
        analyticsService.getPerformanceMetrics(),
        riskService.getRiskCases(),
      ]);
      setProcessMap(mapRes);
      setMetrics(perfRes);
      setRiskCases(riskRes);
    } catch (err) {
      console.error('Failed to load intelligence data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntelligenceData();
  }, []);

  if (loading || !processMap || !metrics) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-gray-200 animate-pulse rounded-[2px]" />
        <TableSkeleton rows={5} cols={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#D9DDE3] pb-3 gap-2">
        <div>
          <h1 className="font-serif font-bold text-2xl text-[#0B2A4A] tracking-tight">
            Administrative Intelligence &amp; Bottleneck Analysis
          </h1>
          <p className="text-xs text-[#5F6368] mt-0.5">
            Identify recurring queue delays, inter-departmental rework loops, and section workload bottlenecks.
          </p>
        </div>

        <GovButton
          variant="secondary"
          size="sm"
          onClick={fetchIntelligenceData}
          icon={<RefreshCw className="w-3.5 h-3.5 text-[#0B2A4A]" />}
        >
          Refresh Analysis
        </GovButton>
      </div>

      {/* Analytical Insight Callout Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-[#D9DDE3] border-l-4 border-l-[#B72025] rounded-[3px] shadow-sm space-y-1.5">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-[#B72025]">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>Critical Section Delay</span>
          </div>
          <p className="text-xs text-[#202124] leading-relaxed">
            <strong>142 files</strong> currently delayed at the <strong>Legal Review Desk</strong>, running at <strong>+191%</strong> above standard SLA baseline.
          </p>
          <span className="text-[11px] text-[#5F6368] font-mono block pt-1">
            Avg Turnaround: 6.4 Days (Baseline: 2.2d)
          </span>
        </div>

        <div className="p-4 bg-white border border-[#D9DDE3] border-l-4 border-l-[#D97706] rounded-[3px] shadow-sm space-y-1.5">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-[#D97706]">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span>Rework Loop Accumulation</span>
          </div>
          <p className="text-xs text-[#202124] leading-relaxed">
            <strong>24% of legal scrutiny cases</strong> trigger rework back to Officer Review for missing survey sketches, adding <strong>+4.2 days</strong> delay.
          </p>
          <span className="text-[11px] text-[#5F6368] font-mono block pt-1">
            820 Affected Cases This Quarter
          </span>
        </div>

        <div className="p-4 bg-white border border-[#D9DDE3] border-l-4 border-l-[#15803D] rounded-[3px] shadow-sm space-y-1.5">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-[#15803D]">
            <TrendingUp className="w-4 h-4 flex-shrink-0" />
            <span>State SLA Compliance Trend</span>
          </div>
          <p className="text-xs text-[#202124] leading-relaxed">
            Overall statutory SLA adherence stands at <strong>83.4%</strong> across 10,482 active state file dockets.
          </p>
          <span className="text-[11px] text-[#5F6368] font-mono block pt-1">
            Median Cycle Time: 12.4 Days
          </span>
        </div>
      </div>

      {/* Stage-wise Processing Time vs Baseline Comparison Table */}
      <GovCard
        title="Stage-Wise Turnaround Time &amp; Queue Breakdown"
        subtitle="Active processing time versus queue dwell wait across workflow stages."
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#0B2A4A] text-white border-b-2 border-[#071A2E]">
                <th className="p-2.5 font-semibold">Workflow Stage</th>
                <th className="p-2.5 font-semibold text-center">Active Dwell (Days)</th>
                <th className="p-2.5 font-semibold text-center">Queue Wait (Days)</th>
                <th className="p-2.5 font-semibold text-center">Total Cycle Time</th>
                <th className="p-2.5 font-semibold text-center">Current Queue</th>
                <th className="p-2.5 font-semibold text-center">SLA Breach Rate</th>
                <th className="p-2.5 font-semibold">Bottleneck Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9DDE3]">
              {metrics.stageBreakdown.map((row, idx) => {
                const isCritical = row.waitingDays > 3 || row.slaBreachRatePct > 20;
                const isWarning = row.waitingDays > 1.5 || row.slaBreachRatePct > 8;

                return (
                  <tr
                    key={row.stage}
                    className={`hover:bg-[#EEF2F7] transition-colors ${
                      idx % 2 === 1 ? 'bg-[#F9FAFB]' : 'bg-white'
                    }`}
                  >
                    <td className="p-2.5 font-bold text-[#0B2A4A]">{row.stage}</td>
                    <td className="p-2.5 text-center font-mono">{row.activeProcessingDays}d</td>
                    <td
                      className={`p-2.5 text-center font-mono font-bold ${
                        isCritical ? 'text-[#B72025]' : isWarning ? 'text-[#D97706]' : 'text-[#202124]'
                      }`}
                    >
                      {row.waitingDays}d
                    </td>
                    <td className="p-2.5 text-center font-mono font-semibold">{row.totalDays}d</td>
                    <td className="p-2.5 text-center font-mono font-bold text-[#0B2A4A]">
                      {row.queueCount} files
                    </td>
                    <td
                      className={`p-2.5 text-center font-mono font-bold ${
                        isCritical ? 'text-[#B72025]' : isWarning ? 'text-[#D97706]' : 'text-[#15803D]'
                      }`}
                    >
                      {row.slaBreachRatePct}%
                    </td>
                    <td className="p-2.5">
                      {isCritical ? (
                        <span className="px-2 py-0.5 bg-[#FEF2F2] text-[#B72025] border border-[#FCA5A5] rounded-[2px] font-bold text-[11px]">
                          CRITICAL BOTTLENECK
                        </span>
                      ) : isWarning ? (
                        <span className="px-2 py-0.5 bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] rounded-[2px] font-semibold text-[11px]">
                          MODERATE DELAY
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0] rounded-[2px] text-[11px]">
                          NORMAL
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GovCard>

      {/* Delay Risk Rankings with Explicit Mathematical Rationale */}
      <GovCard
        title="Delay Risk &amp; Statutory SLA Breach Forecaster"
        subtitle="Calculated probability of statutory deadline breach with explicit mathematical attribution."
        highlightBorder="saffron"
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#0B2A4A] text-white border-b-2 border-[#071A2E]">
                <th className="p-2.5 font-semibold">File Docket</th>
                <th className="p-2.5 font-semibold">Department &amp; Current Stage</th>
                <th className="p-2.5 font-semibold text-center">Days in Queue</th>
                <th className="p-2.5 font-semibold text-center">Historical Benchmark</th>
                <th className="p-2.5 font-semibold text-center">Risk Level</th>
                <th className="p-2.5 font-semibold">Attribution Reason</th>
                <th className="p-2.5 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9DDE3]">
              {riskCases.map((c, idx) => {
                const rp = c.riskPrediction;
                return (
                  <tr
                    key={c.id}
                    className={`hover:bg-[#FAF8F2] transition-colors ${
                      idx % 2 === 1 ? 'bg-[#F9FAFB]' : 'bg-white'
                    }`}
                  >
                    <td className="p-2.5 font-mono font-bold text-[#0B2A4A]">
                      <Link to={`/files/${c.id}`} className="hover:underline">
                        {c.fileNumber || c.id}
                      </Link>
                    </td>
                    <td className="p-2.5">
                      <div className="font-semibold text-[#0B2A4A]">{c.department}</div>
                      <div className="text-[11px] text-[#5F6368]">{c.currentStage}</div>
                    </td>
                    <td className="p-2.5 text-center font-mono font-bold text-[#B72025]">
                      {c.ageDays} Days
                    </td>
                    <td className="p-2.5 text-center font-mono text-[#5F6368]">
                      {rp?.historicalBaselineDays || 7} Days
                    </td>
                    <td className="p-2.5 text-center">
                      <StatusBadge status={c.riskLevel} size="sm" />
                    </td>
                    <td className="p-2.5 text-[#202124] max-w-sm">
                      <p className="line-clamp-2">
                        {rp?.primaryFactor || 'Queue dwell time exceeds stage historical baseline.'}
                      </p>
                    </td>
                    <td className="p-2.5 text-right whitespace-nowrap">
                      <GovButton
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/files/${c.id}`)}
                      >
                        Inspect Docket
                      </GovButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GovCard>
    </div>
  );
};
