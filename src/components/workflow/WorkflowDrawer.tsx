import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Clock, AlertTriangle, RefreshCw, Users, ArrowRight, BarChart2 } from 'lucide-react';
import { WorkflowNodeData } from '../../types';

interface WorkflowDrawerProps {
  node: WorkflowNodeData | null;
  onClose: () => void;
}

export const WorkflowDrawer: React.FC<WorkflowDrawerProps> = ({ node, onClose }) => {
  const navigate = useNavigate();

  if (!node) return null;

  return (
    <div className="fixed inset-y-0 right-0 max-w-lg w-full bg-surface border-l border-border-hairline shadow-2xl z-40 flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-border-hairline bg-surface flex items-center justify-between">
        <div>
          <span className="font-mono text-3xs font-bold text-ink-500 uppercase tracking-widest">
            PROCESS MINING // STAGE INSPECTOR
          </span>
          <h2 className="font-sans font-bold text-base text-ink-950 mt-0.5">
            {node.stage}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-surface-subtle border border-border-hairline text-ink-500 hover:text-ink-900"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-6 space-y-6 overflow-y-auto flex-1 bg-paper">
        {/* Bottleneck Status Banner */}
        {node.isBottleneck ? (
          <div className="p-4 bg-vermilion-subtle border border-vermilion-border space-y-2">
            <div className="flex items-center space-x-2 text-vermilion font-mono text-xs font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>PRIMARY BOTTLENECK DETECTED</span>
            </div>
            <p className="font-sans text-xs text-ink-800 leading-relaxed">
              Files entering <strong className="text-ink-950">{node.stage}</strong> experience an average waiting time of{' '}
              <strong className="text-vermilion">{node.avgWaitDays} days</strong>, which is{' '}
              <strong className="text-vermilion">+{node.deviationFromBaselinePct}%</strong> higher than the statutory baseline of{' '}
              {node.historicalBaselineDays} days.
            </p>
          </div>
        ) : (
          <div className="p-4 bg-sageSuccess-subtle border border-sageSuccess-border">
            <div className="flex items-center space-x-2 text-sageSuccess font-mono text-xs font-bold">
              <span>PROCESS FLOW STABLE</span>
            </div>
            <p className="font-sans text-xs text-ink-700 mt-1">
              Throughput is within target bounds with an average cycle time of {node.avgDurationDays} days.
            </p>
          </div>
        )}

        {/* Process Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 bg-surface border border-border-hairline space-y-1">
            <span className="font-mono text-3xs text-ink-400 uppercase">ACTIVE QUEUE</span>
            <div className="font-mono text-lg font-bold text-ink-950">
              {node.queueSize.toLocaleString()} <span className="text-2xs font-normal text-ink-500">cases</span>
            </div>
            <span className="font-mono text-3xs text-ink-500">Accumulation rate: +14/day</span>
          </div>

          <div className="p-3.5 bg-surface border border-border-hairline space-y-1">
            <span className="font-mono text-3xs text-ink-400 uppercase">TOTAL PROCESSED</span>
            <div className="font-mono text-lg font-bold text-ink-950">
              {node.caseCount.toLocaleString()} <span className="text-2xs font-normal text-ink-500">cases</span>
            </div>
            <span className="font-mono text-3xs text-ink-500">Historical throughput</span>
          </div>

          <div className="p-3.5 bg-surface border border-border-hairline space-y-1">
            <span className="font-mono text-3xs text-ink-400 uppercase">AVG WAIT TIME</span>
            <div className={`font-mono text-lg font-bold ${node.isBottleneck ? 'text-vermilion' : 'text-ink-950'}`}>
              {node.avgWaitDays} <span className="text-2xs font-normal text-ink-500">days</span>
            </div>
            <span className="font-mono text-3xs text-ink-500">Target baseline: {node.historicalBaselineDays}d</span>
          </div>

          <div className="p-3.5 bg-surface border border-border-hairline space-y-1">
            <span className="font-mono text-3xs text-ink-400 uppercase">OFFICER CAPACITY</span>
            <div className={`font-mono text-lg font-bold ${node.officerCapacityPct > 120 ? 'text-vermilion' : 'text-ink-950'}`}>
              {node.officerCapacityPct}%
            </div>
            <span className="font-mono text-3xs text-ink-500">
              {node.officerCapacityPct > 100 ? 'Over-utilized backlog' : 'Balanced load'}
            </span>
          </div>
        </div>

        {/* Wait Time vs Active Duration Breakdown */}
        <div className="p-4 bg-surface border border-border-hairline space-y-3">
          <div className="flex items-center justify-between font-mono text-xs font-bold text-ink-900">
            <span>TIME DECOMPOSITION</span>
            <span className="text-ink-500">{(node.avgWaitDays + node.avgDurationDays).toFixed(1)} TOTAL DAYS</span>
          </div>

          <div className="space-y-2">
            <div>
              <div className="flex justify-between font-mono text-3xs text-ink-600 mb-1">
                <span>QUEUE WAITING TIME (INACTIVE)</span>
                <span className="font-bold text-vermilion">{node.avgWaitDays} days</span>
              </div>
              <div className="w-full bg-surface-subtle h-2 overflow-hidden">
                <div
                  className="bg-vermilion h-full"
                  style={{
                    width: `${(node.avgWaitDays / (node.avgWaitDays + node.avgDurationDays)) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-mono text-3xs text-ink-600 mb-1">
                <span>ACTIVE DESK SCRUTINY</span>
                <span className="font-bold text-ink-900">{node.avgDurationDays} days</span>
              </div>
              <div className="w-full bg-surface-subtle h-2 overflow-hidden">
                <div
                  className="bg-ink-800 h-full"
                  style={{
                    width: `${(node.avgDurationDays / (node.avgWaitDays + node.avgDurationDays)) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Rework Loop Diagnostics */}
        {node.reworkFrequencyPct ? (
          <div className="p-4 bg-surface border border-border-hairline space-y-2">
            <div className="flex items-center space-x-2 font-mono text-xs font-bold text-amberRisk">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>REWORK LOOP DETECTED</span>
            </div>
            <p className="font-sans text-xs text-ink-700">
              <strong className="text-ink-950">{node.reworkFrequencyPct}%</strong> of cases passing through this stage are returned back to previous review desks due to documentation queries, adding an average of <strong className="text-ink-950">+4.8 days</strong> to total case cycle time.
            </p>
          </div>
        ) : null}

        {/* Recommended Operational Action */}
        <div className="p-4 bg-surface border border-border-hairline space-y-3">
          <span className="font-mono text-3xs font-bold text-ink-500 uppercase tracking-widest">
            RECOMMENDED POLICY INTERVENTION
          </span>
          <p className="font-sans text-xs text-ink-800">
            {node.isBottleneck
              ? 'Enable automatic threshold escalation rule in What-If Simulation to cap queue latency at 5 days.'
              : 'Maintain current staffing profile. Monitor incoming queue velocity weekly.'}
          </p>
          {node.isBottleneck && (
            <button
              onClick={() => {
                onClose();
                navigate('/simulation');
              }}
              className="w-full py-2 bg-ink-900 hover:bg-ink-800 text-white font-mono text-2xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-colors"
            >
              <span>SIMULATE BOTTLENECK INTERVENTION</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Drawer Footer */}
      <div className="p-4 border-t border-border-hairline bg-surface flex justify-between items-center">
        <button
          onClick={() => {
            onClose();
            navigate(`/cases?stage=${encodeURIComponent(node.stage)}`);
          }}
          className="font-mono text-2xs text-ink-700 hover:text-ink-950 flex items-center space-x-1"
        >
          <span>VIEW {node.queueSize} CASES IN THIS STAGE</span>
          <ArrowRight className="w-3 h-3" />
        </button>
        <button
          onClick={onClose}
          className="px-3 py-1.5 bg-surface-subtle hover:bg-surface-hover border border-border-hairline font-mono text-2xs uppercase"
        >
          CLOSE
        </button>
      </div>
    </div>
  );
};
