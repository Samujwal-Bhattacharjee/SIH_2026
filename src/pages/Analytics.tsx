import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  GitBranch,
  Clock,
  TrendingDown,
  RefreshCw,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { analyticsService } from '../services/api';
import { ProcessPerformanceMetrics } from '../types';
import { TableSkeleton } from '../components/common/LoadingSkeleton';

export const Analytics: React.FC = () => {
  const [data, setData] = useState<ProcessPerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await analyticsService.getPerformanceMetrics();
        setData(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-72 bg-ink-200 animate-pulse rounded-sm" />
        <TableSkeleton rows={5} cols={5} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border-hairline pb-4 gap-4">
        <div>
          <div className="flex items-center space-x-2 font-mono text-3xs text-ink-500 uppercase tracking-widest">
            <span>GOIP</span>
            <span>/</span>
            <span>PROCESS MINING ANALYTICS</span>
            <span>/</span>
            <span>THROUGHPUT &amp; CONFORMANCE</span>
          </div>
          <h1 className="font-sans font-extrabold text-2xl text-ink-950 tracking-tight mt-1">
            PROCESS MINING PERFORMANCE &amp; VARIANT METRICS
          </h1>
        </div>

        <div className="font-mono text-3xs text-ink-500 flex items-center space-x-3">
          <span>SAMPLE: <strong>10,482 COMPLETED &amp; ACTIVE RUNS</strong></span>
        </div>
      </div>

      {/* Stage Time Decomposition (Active vs Wait) */}
      <div className="bg-surface border border-border-hairline p-6 shadow-subtle-1 space-y-4">
        <div className="flex justify-between items-center border-b border-border-hairline pb-3">
          <div>
            <span className="font-mono text-3xs font-bold text-ink-500 uppercase tracking-widest">
              STAGE THROUGHPUT ANALYSIS
            </span>
            <h3 className="font-sans font-bold text-base text-ink-950 mt-0.5">
              ACTIVE DESK SCRUTINY VS. QUEUE WAITING TIME (DAYS)
            </h3>
          </div>
          <div className="flex items-center space-x-4 font-mono text-3xs">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 bg-ink-900" />
              <span>ACTIVE SCRUTINY</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 bg-vermilion" />
              <span>QUEUE WAIT TIME</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-border-hairline bg-surface-subtle/60 text-3xs text-ink-500 uppercase">
                <th className="py-2.5 px-4">WORKFLOW STAGE</th>
                <th className="py-2.5 px-4">ACTIVE DESK TIME</th>
                <th className="py-2.5 px-4">QUEUE WAITING TIME</th>
                <th className="py-2.5 px-4">TOTAL STAGE TIME</th>
                <th className="py-2.5 px-4">ACTIVE QUEUE</th>
                <th className="py-2.5 px-4">STAGE LATENCY VISUAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-hairline">
              {data.stageBreakdown.map((item, idx) => {
                const total = item.totalDays;
                const isBottleneck = item.waitingDays > 4;
                return (
                  <tr key={idx} className="hover:bg-surface-hover">
                    <td className="py-3 px-4 font-semibold text-ink-950">
                      {item.stage}
                    </td>
                    <td className="py-3 px-4 text-ink-700">{item.activeProcessingDays}d</td>
                    <td className={`py-3 px-4 font-bold ${isBottleneck ? 'text-vermilion' : 'text-ink-700'}`}>
                      {item.waitingDays}d
                    </td>
                    <td className="py-3 px-4 font-bold text-ink-950">{total}d</td>
                    <td className="py-3 px-4 text-ink-600">{item.queueCount} cases</td>
                    <td className="py-3 px-4 w-72">
                      <div className="w-full bg-surface-subtle h-3 flex overflow-hidden border border-border-hairline">
                        <div
                          className="bg-ink-800 h-full"
                          style={{ width: `${(item.activeProcessingDays / 16) * 100}%` }}
                          title={`Active: ${item.activeProcessingDays}d`}
                        />
                        <div
                          className={`h-full ${isBottleneck ? 'bg-vermilion' : 'bg-ink-400'}`}
                          style={{ width: `${(item.waitingDays / 16) * 100}%` }}
                          title={`Wait: ${item.waitingDays}d`}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Discovered Process Variants */}
      <div className="bg-surface border border-border-hairline p-6 shadow-subtle-1 space-y-4">
        <div className="flex justify-between items-center border-b border-border-hairline pb-3">
          <div>
            <span className="font-mono text-3xs font-bold text-ink-500 uppercase tracking-widest">
              CONFORMANCE &amp; VARIANT ANALYSIS
            </span>
            <h3 className="font-sans font-bold text-base text-ink-950 mt-0.5">
              DISCOVERED WORKFLOW VARIANT PATHS
            </h3>
          </div>
          <span className="font-mono text-3xs text-ink-500">4 PRIMARY EXECUTION PATHS</span>
        </div>

        <div className="space-y-3">
          {data.variants.map((v) => (
            <div
              key={v.id}
              className={`p-4 border font-mono text-xs ${
                v.isOptimal
                  ? 'bg-sageSuccess-subtle/20 border-sageSuccess-border'
                  : 'bg-surface border-border-hairline'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-ink-950">{v.name}</span>
                  {v.isOptimal ? (
                    <span className="font-mono text-3xs font-bold uppercase bg-sageSuccess-subtle text-sageSuccess border border-sageSuccess-border px-1.5 py-0.2">
                      OPTIMAL HAPPY PATH
                    </span>
                  ) : (
                    <span className="font-mono text-3xs font-semibold uppercase bg-amberRisk-subtle text-amberRisk border border-amberRisk-border px-1.5 py-0.2">
                      REWORK VARIANT
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-3 font-mono text-2xs text-ink-600">
                  <span>
                    CASES: <strong className="text-ink-900">{v.caseCount.toLocaleString()} ({v.percentage}%)</strong>
                  </span>
                  <span>
                    AVG TIME: <strong className="text-ink-900">{v.avgDurationDays} days</strong>
                  </span>
                </div>
              </div>

              {/* Path sequence breadcrumbs */}
              <div className="flex flex-wrap items-center gap-1.5 text-3xs font-mono text-ink-700 bg-surface-subtle/50 p-2.5 border border-border-hairline">
                {v.path.map((stg, i) => (
                  <React.Fragment key={i}>
                    <span className="px-1.5 py-0.5 bg-surface border border-border-hairline text-ink-900 font-semibold">
                      {stg}
                    </span>
                    {i < v.path.length - 1 && <span className="text-ink-400">➔</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SLA Adherence Trajectory */}
      <div className="bg-surface border border-border-hairline p-6 shadow-subtle-1 space-y-4">
        <div className="border-b border-border-hairline pb-3">
          <span className="font-mono text-3xs font-bold text-ink-500 uppercase tracking-widest">
            HISTORICAL SLA COMPLIANCE TRAJECTORY
          </span>
          <h3 className="font-sans font-bold text-base text-ink-950 mt-0.5">
            MONTHLY SLA ON-TIME VS. AT-RISK VS. BREACHED TRENDS
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-2xs">
          {data.slaAdherenceTrends.map((t, idx) => (
            <div key={idx} className="p-3.5 bg-surface border border-border-hairline space-y-2">
              <span className="text-3xs text-ink-400 font-bold uppercase block">{t.month}</span>
              <div className="space-y-1">
                <div className="flex justify-between text-sageSuccess font-bold">
                  <span>ON-TIME:</span>
                  <span>{t.onTimePct}%</span>
                </div>
                <div className="flex justify-between text-amberRisk">
                  <span>AT RISK:</span>
                  <span>{t.atRiskPct}%</span>
                </div>
                <div className="flex justify-between text-vermilion font-semibold">
                  <span>BREACHED:</span>
                  <span>{t.breachedPct}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
