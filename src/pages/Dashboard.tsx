import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  GitBranch,
  ArrowRight,
  TrendingDown,
  RefreshCw,
  Layers,
  FolderKanban,
  CheckCircle2,
  Cpu,
  FileText,
} from 'lucide-react';
import { dashboardService, workflowService } from '../services/api';
import { DashboardMetrics, ProcessMapData, Case } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { StatutoryCountdown } from '../components/common/StatutoryCountdown';
import { TableSkeleton } from '../components/common/LoadingSkeleton';

export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [processMap, setProcessMap] = useState<ProcessMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashMetrics, flowData] = await Promise.all([
          dashboardService.getMetrics(),
          workflowService.getProcessMap(),
        ]);
        setMetrics(dashMetrics);
        setProcessMap(flowData);
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !metrics || !processMap) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-72 bg-ink-200 animate-pulse rounded-sm" />
        <TableSkeleton rows={4} cols={5} />
      </div>
    );
  }

  const primaryBottleneck = metrics.primaryBottleneck;

  return (
    <div className="space-y-8">
      {/* Editorial Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border-hairline pb-4 gap-4">
        <div>
          <div className="flex items-center space-x-2 font-mono text-3xs text-ink-500 uppercase tracking-widest">
            <span>GOIP</span>
            <span>/</span>
            <span>OPERATIONS OVERVIEW</span>
            <span>/</span>
            <span>STATE WIDE CONSOLE</span>
          </div>
          <h1 className="font-sans font-extrabold text-2xl text-ink-950 tracking-tight mt-1">
            WORKFLOW INTELLIGENCE FOR ACTIVE GOVERNMENT CASES
          </h1>
        </div>

        <div className="font-mono text-3xs text-ink-500 flex items-center space-x-4">
          <div>
            DATASET: <strong className="text-ink-900">{metrics.systemDatasetSize.toLocaleString()}</strong>
          </div>
          <div>
            ACTIVE CASES: <strong className="text-ink-900">{metrics.totalActiveCases.toLocaleString()}</strong>
          </div>
          <div>
            UPDATED: <strong className="text-ink-900">14:32:08 IST</strong>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 font-mono">
        <div className="p-4 bg-surface border border-border-hairline space-y-1 shadow-subtle-1">
          <span className="text-3xs text-ink-500 uppercase tracking-wider block">
            01 // ACTIVE CASES
          </span>
          <div className="text-2xl font-bold text-ink-950">
            {metrics.totalActiveCases.toLocaleString()}
          </div>
          <span className="text-3xs text-ink-400 block">Across 6 departments</span>
        </div>

        <div className="p-4 bg-surface border border-border-hairline space-y-1 shadow-subtle-1">
          <span className="text-3xs text-ink-500 uppercase tracking-wider block">
            02 // PENDING QUEUE
          </span>
          <div className="text-2xl font-bold text-ink-950">
            {metrics.pendingQueue.toLocaleString()}
          </div>
          <span className="text-3xs text-ink-400 block">Files awaiting desk review</span>
        </div>

        <div className="p-4 bg-surface border border-vermilion-border/40 bg-vermilion-subtle/20 space-y-1 shadow-subtle-1">
          <span className="text-3xs text-vermilion font-bold uppercase tracking-wider block">
            03 // SLA AT RISK
          </span>
          <div className="text-2xl font-bold text-vermilion">
            {metrics.slaAtRiskCount}
          </div>
          <span className="text-3xs text-vermilion/80 block">&gt;80% delay probability</span>
        </div>

        <div className="p-4 bg-surface border border-vermilion-border bg-vermilion-subtle/40 space-y-1 shadow-subtle-1">
          <span className="text-3xs text-vermilion font-bold uppercase tracking-wider block">
            04 // SLA BREACHED
          </span>
          <div className="text-2xl font-bold text-vermilion">
            {metrics.slaBreachedCount}
          </div>
          <span className="text-3xs text-vermilion/80 block">Statutory deadline passed</span>
        </div>

        <div className="p-4 bg-surface border border-border-hairline space-y-1 shadow-subtle-1">
          <span className="text-3xs text-ink-500 uppercase tracking-wider block">
            05 // AVG CYCLE TIME
          </span>
          <div className="text-2xl font-bold text-ink-950">
            {metrics.avgProcessingDays} <span className="text-xs font-normal text-ink-400">days</span>
          </div>
          <span className="text-3xs text-ink-400 block">Median: 31.4 days</span>
        </div>
      </div>

      {/* Live Bottleneck & Rework Loop Detected Banner */}
      <div className="p-5 bg-surface border-2 border-vermilion shadow-subtle-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="p-2 bg-vermilion text-white flex-shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2 font-mono text-3xs font-bold text-vermilion uppercase tracking-widest">
              <span>PRIMARY BOTTLENECK DETECTED</span>
              <span>•</span>
              <span>170.9% ABOVE BASELINE</span>
            </div>
            <h3 className="font-sans font-bold text-base text-ink-950">
              {primaryBottleneck.stage.toUpperCase()} — {primaryBottleneck.avgWaitDays} DAYS AVERAGE WAIT TIME
            </h3>
            <p className="font-sans text-xs text-ink-700 max-w-3xl leading-relaxed">
              {primaryBottleneck.rootCauseDescription} Active queue accumulation is currently{' '}
              <strong>{primaryBottleneck.queueSize.toLocaleString()} cases</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 flex-shrink-0">
          <button
            onClick={() => navigate('/workflow')}
            className="px-3.5 py-2 bg-surface hover:bg-surface-hover border border-border-hairline font-mono text-2xs uppercase tracking-wider text-ink-900 flex items-center space-x-1.5 transition-colors"
          >
            <GitBranch className="w-3 h-3 text-vermilion" />
            <span>INSPECT PROCESS GRAPH</span>
          </button>
          <button
            onClick={() => navigate('/simulation')}
            className="px-3.5 py-2 bg-ink-900 hover:bg-ink-800 text-white font-mono text-2xs uppercase tracking-wider font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <Cpu className="w-3 h-3 text-vermilion" />
            <span>SIMULATE MITIGATION</span>
          </button>
        </div>
      </div>

      {/* Discovered Process Progression Mini-Map */}
      <div className="bg-surface border border-border-hairline p-5 space-y-4 shadow-subtle-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border-hairline pb-3 gap-2">
          <div>
            <span className="font-mono text-3xs font-bold text-ink-500 uppercase tracking-widest">
              PROCESS TOPOLOGY // DISCOVERED WORKFLOW
            </span>
            <h3 className="font-sans font-bold text-sm text-ink-950 mt-0.5">
              END-TO-END ADMINISTRATIVE WORKFLOW PROGRESSION
            </h3>
          </div>
          <button
            onClick={() => navigate('/workflow')}
            className="font-mono text-2xs text-vermilion hover:underline flex items-center space-x-1"
          >
            <span>OPEN FULL WORKFLOW WORKSPACE</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Linear Stage Pipeline Preview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {processMap.nodes.map((node, i) => {
            const isCrit = node.isBottleneck;
            return (
              <div
                key={node.id}
                onClick={() => navigate('/workflow')}
                className={`p-3 border transition-all cursor-pointer ${
                  isCrit
                    ? 'bg-vermilion-subtle/40 border-vermilion hover:border-vermilion-hover'
                    : 'bg-surface border-border-hairline hover:border-ink-900'
                }`}
              >
                <div className="flex justify-between items-center text-3xs font-mono mb-1">
                  <span className="text-ink-400">0{i + 1}</span>
                  {isCrit && (
                    <span className="text-vermilion font-bold uppercase">BOTTLENECK</span>
                  )}
                </div>
                <h4 className="font-sans font-bold text-xs text-ink-900 truncate">
                  {node.stage}
                </h4>
                <div className="font-mono text-3xs text-ink-600 mt-2 space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-ink-400">WAIT:</span>
                    <span className={`font-bold ${isCrit ? 'text-vermilion' : 'text-ink-900'}`}>
                      {node.avgWaitDays}d
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-400">QUEUE:</span>
                    <span>{node.queueSize}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Rework Loop Notification */}
        <div className="p-3 bg-surface-subtle border border-border-hairline flex items-center justify-between font-mono text-2xs">
          <div className="flex items-center space-x-2 text-ink-700">
            <RefreshCw className="w-3.5 h-3.5 text-amberRisk" />
            <span>
              <strong>REWORK LOOP DETECTED:</strong> Legal Review ➔ Officer Review occurs in <strong>21.4%</strong> of cases (+4.8 days added cycle time).
            </span>
          </div>
          <button
            onClick={() => navigate('/workflow')}
            className="text-vermilion hover:underline text-3xs font-bold"
          >
            VIEW LOOP IN GRAPH
          </button>
        </div>
      </div>

      {/* Critical High-Risk Cases Priority Queue */}
      <div className="bg-surface border border-border-hairline shadow-subtle-1">
        <div className="p-4 border-b border-border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="font-mono text-3xs font-bold text-vermilion uppercase tracking-widest">
              OPERATIONAL PRIORITY // IMMEDIATE ATTENTION REQUIRED
            </span>
            <h3 className="font-sans font-bold text-sm text-ink-950 mt-0.5">
              TOP CRITICAL HIGH-RISK CASES
            </h3>
          </div>
          <button
            onClick={() => navigate('/risk')}
            className="px-3 py-1.5 bg-surface-subtle hover:bg-surface-hover border border-border-hairline font-mono text-2xs uppercase text-ink-900 flex items-center space-x-1"
          >
            <span>VIEW ALL 173 AT-RISK CASES</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-hairline bg-surface-subtle/60 font-mono text-3xs text-ink-500 uppercase tracking-wider">
                <th className="py-2.5 px-4">CASE REF</th>
                <th className="py-2.5 px-4">SUBJECT / CITIZEN</th>
                <th className="py-2.5 px-4">DEPARTMENT</th>
                <th className="py-2.5 px-4">CURRENT STAGE</th>
                <th className="py-2.5 px-4">STATUTORY SLA</th>
                <th className="py-2.5 px-4">RISK SCORE</th>
                <th className="py-2.5 px-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-hairline font-sans text-xs">
              {metrics.recentHighRiskCases.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/cases/${c.id}`)}
                  className="hover:bg-surface-hover cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 font-mono font-bold text-ink-950 text-xs">
                    {c.id}
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    <div className="font-medium text-ink-900 truncate">{c.title}</div>
                    <div className="font-mono text-3xs text-ink-500 mt-0.5 truncate">
                      {c.applicant}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-2xs text-ink-700">
                    {c.department}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-2xs px-2 py-0.5 bg-surface-subtle border border-border-hairline text-ink-800">
                      {c.currentStage}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <StatutoryCountdown
                      daysRemaining={c.daysRemaining}
                      statutoryDeadlineDays={c.statutoryDeadlineDays}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge riskLevel={c.riskLevel} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/cases/${c.id}`);
                      }}
                      className="px-2.5 py-1 bg-ink-900 hover:bg-ink-800 text-white font-mono text-3xs uppercase tracking-wider transition-colors"
                    >
                      INSPECT
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
