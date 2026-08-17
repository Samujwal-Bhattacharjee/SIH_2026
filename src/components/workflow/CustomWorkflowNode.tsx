import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { AlertTriangle, Clock, RefreshCw, Users } from 'lucide-react';
import { WorkflowNodeData } from '../../types';

export const CustomWorkflowNode = memo(({ data, selected }: { data: WorkflowNodeData; selected?: boolean }) => {
  const isBottleneck = data.isBottleneck;
  const isCritical = data.bottleneckSeverity === 'CRITICAL';

  return (
    <div
      className={`w-64 bg-surface border transition-all select-none shadow-subtle-2 ${
        selected
          ? 'border-ink-950 ring-2 ring-ink-950/20'
          : isCritical
          ? 'border-vermilion'
          : isBottleneck
          ? 'border-amberRisk'
          : 'border-border-hairline'
      }`}
    >
      {/* React Flow Connection Handles */}
      <Handle type="target" position={Position.Top} className="!bg-ink-900 !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-ink-900 !w-2 !h-2" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-ink-900 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-ink-900 !w-2 !h-2" />

      {/* Node Header */}
      <div
        className={`px-3 py-2 border-b flex items-center justify-between ${
          isCritical
            ? 'bg-vermilion text-white border-vermilion'
            : isBottleneck
            ? 'bg-amberRisk text-white border-amberRisk'
            : 'bg-surface-subtle border-border-hairline text-ink-900'
        }`}
      >
        <span className="font-mono text-2xs font-bold uppercase tracking-wide truncate">
          {data.stage}
        </span>
        {isCritical && (
          <span className="inline-flex items-center space-x-1 font-mono text-3xs font-bold uppercase bg-white text-vermilion px-1">
            <AlertTriangle className="w-2.5 h-2.5" />
            <span>BOTTLENECK</span>
          </span>
        )}
      </div>

      {/* Node Body Metrics */}
      <div className="p-3 space-y-2 font-mono text-3xs">
        {/* Active Cases & Queue */}
        <div className="flex items-center justify-between text-ink-700">
          <span className="text-ink-400">TOTAL CASES:</span>
          <span className="font-bold text-ink-950">{data.caseCount.toLocaleString()}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-ink-400">QUEUE SIZE:</span>
          <span
            className={`font-semibold ${
              data.queueSize > 500 ? 'text-vermilion' : 'text-ink-900'
            }`}
          >
            {data.queueSize.toLocaleString()} files
          </span>
        </div>

        {/* Avg Duration & Wait Days */}
        <div className="pt-1.5 border-t border-border-hairline space-y-1">
          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-1 text-ink-500">
              <Clock className="w-3 h-3 text-ink-400" />
              <span>AVG WAIT:</span>
            </span>
            <span
              className={`font-bold ${
                isCritical ? 'text-vermilion' : 'text-ink-900'
              }`}
            >
              {data.avgWaitDays} DAYS
            </span>
          </div>

          {data.deviationFromBaselinePct !== undefined && data.deviationFromBaselinePct > 0 && (
            <div className="flex items-center justify-between text-vermilion font-bold">
              <span>DEVIATION:</span>
              <span>+{data.deviationFromBaselinePct}% vs baseline</span>
            </div>
          )}

          {data.reworkFrequencyPct !== undefined && data.reworkFrequencyPct > 0 && (
            <div className="flex items-center justify-between text-amberRisk pt-0.5">
              <span className="flex items-center space-x-1">
                <RefreshCw className="w-2.5 h-2.5" />
                <span>REWORK RATE:</span>
              </span>
              <span>{data.reworkFrequencyPct}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Node Footer */}
      <div className="px-3 py-1 bg-surface-subtle/40 border-t border-border-hairline flex items-center justify-between text-3xs font-mono text-ink-400">
        <span>BASELINE: {data.historicalBaselineDays}d</span>
        <span>CAPACITY: {data.officerCapacityPct}%</span>
      </div>
    </div>
  );
});

CustomWorkflowNode.displayName = 'CustomWorkflowNode';
