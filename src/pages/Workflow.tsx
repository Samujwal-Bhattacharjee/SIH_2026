import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  AlertTriangle,
  Clock,
  ArrowRight,
  RefreshCw,
  Layers,
  RotateCcw,
  CheckCircle2,
  Building2,
} from 'lucide-react';
import { workflowService } from '../services/api';
import { ProcessMapData, WorkflowNodeData, BottleneckAnalysis } from '../types';
import { GovCard } from '../components/common/GovCard';
import { GovButton } from '../components/common/GovButton';
import { StatusBadge } from '../components/common/GovBadge';
import { TableSkeleton } from '../components/common/LoadingSkeleton';

export const Workflow: React.FC = () => {
  const [processMap, setProcessMap] = useState<ProcessMapData | null>(null);
  const [selectedNode, setSelectedNode] = useState<WorkflowNodeData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWorkflow = async () => {
    setLoading(true);
    try {
      const data = await workflowService.getProcessMap();
      setProcessMap(data);
      if (data.nodes.length > 0) setSelectedNode(data.nodes[4]); // Select Legal Review by default
    } catch (err) {
      console.error('Failed to fetch workflow map:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflow();
  }, []);

  if (loading || !processMap) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-gray-200 animate-pulse rounded-[2px]" />
        <TableSkeleton rows={4} cols={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#D9DDE3] pb-3 gap-2">
        <div>
          <h1 className="font-serif font-bold text-2xl text-[#0B2A4A] tracking-tight">
            Workflow Process Map &amp; Stage Graph
          </h1>
          <p className="text-xs text-[#5F6368] mt-0.5">
            Discovered government file movement transitions, queue accumulation, and rework loops.
          </p>
        </div>

        <GovButton
          variant="secondary"
          size="sm"
          onClick={fetchWorkflow}
          icon={<RefreshCw className="w-3.5 h-3.5 text-[#0B2A4A]" />}
        >
          Refresh Graph
        </GovButton>
      </div>

      {/* Top Process Metrics Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="p-3 bg-white border border-[#D9DDE3] rounded-[3px] space-y-0.5">
          <span className="text-[10px] text-[#5F6368] uppercase">TOTAL ANALYZED FILES</span>
          <div className="text-xl font-bold text-[#0B2A4A] font-serif">
            {processMap.metrics.totalActiveCases.toLocaleString()}
          </div>
        </div>

        <div className="p-3 bg-white border border-[#D9DDE3] rounded-[3px] space-y-0.5">
          <span className="text-[10px] text-[#5F6368] uppercase">MEDIAN CYCLE TIME</span>
          <div className="text-xl font-bold text-[#0B2A4A] font-serif">
            {processMap.metrics.medianCycleDays} Days
          </div>
        </div>

        <div className="p-3 bg-white border border-[#D9DDE3] rounded-[3px] space-y-0.5">
          <span className="text-[10px] text-[#D97706] uppercase">REWORK LOOP FREQUENCY</span>
          <div className="text-xl font-bold text-[#D97706] font-serif">
            {processMap.metrics.reworkRatePct}%
          </div>
        </div>

        <div className="p-3 bg-white border border-[#D9DDE3] rounded-[3px] space-y-0.5">
          <span className="text-[10px] text-[#15803D] uppercase">SLA COMPLIANCE RATE</span>
          <div className="text-xl font-bold text-[#15803D] font-serif">
            {processMap.metrics.slaComplianceRatePct}%
          </div>
        </div>
      </div>

      {/* Horizontal Workflow Stage Pipeline Diagram */}
      <GovCard
        title="Standard Administrative File Progression Pathway"
        subtitle="Click any stage block to inspect queue dwell metrics and root causes."
        highlightBorder="navy"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 select-none">
          {processMap.nodes.map((node, idx) => {
            const isSelected = selectedNode?.id === node.id;
            const isCritical = node.isBottleneck;

            return (
              <div
                key={node.id}
                onClick={() => setSelectedNode(node)}
                className={`p-3 border rounded-[3px] text-xs cursor-pointer transition-all ${
                  isSelected
                    ? 'border-[#0B2A4A] ring-2 ring-[#0B2A4A] bg-[#F0F5FA]'
                    : isCritical
                    ? 'border-[#FCA5A5] bg-[#FEF2F2]/60 hover:bg-[#FEF2F2]'
                    : 'border-[#D9DDE3] bg-white hover:bg-[#F8F9FA]'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-[#5F6368] font-mono mb-1">
                  <span>STAGE 0{idx + 1}</span>
                  {isCritical && (
                    <span className="text-[#B72025] font-bold">CRITICAL</span>
                  )}
                </div>

                <h4 className="font-serif font-bold text-xs text-[#0B2A4A] leading-tight mb-2 min-h-[28px]">
                  {node.stage}
                </h4>

                <div className="space-y-1 text-[11px] text-[#5F6368] font-mono border-t border-gray-200 pt-1.5">
                  <div className="flex justify-between">
                    <span>Queue:</span>
                    <strong className="text-[#202124]">{node.queueSize} files</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Dwell:</span>
                    <strong className={isCritical ? 'text-[#B72025]' : 'text-[#202124]'}>
                      {node.avgDurationDays}d
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Wait Time:</span>
                    <strong className={isCritical ? 'text-[#B72025]' : 'text-[#202124]'}>
                      {node.avgWaitDays}d
                    </strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </GovCard>

      {/* Selected Stage Detail Inspector */}
      {selectedNode && (
        <GovCard
          title={`Stage Deep-Dive: ${selectedNode.stage}`}
          subtitle="Detailed turnaround metrics, officer desk capacity, and rework causes."
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            {/* Left: Turnaround Stats */}
            <div className="space-y-3 p-4 bg-[#F8F9FA] border border-[#D9DDE3] rounded-[3px]">
              <h4 className="font-serif font-bold text-sm text-[#0B2A4A]">
                Processing Parameters
              </h4>
              <div className="space-y-2 font-mono">
                <div className="flex justify-between border-b border-[#E6E9EF] pb-1">
                  <span className="text-[#5F6368]">Total Volume Traversed:</span>
                  <strong className="text-[#0B2A4A]">{selectedNode.caseCount.toLocaleString()} Files</strong>
                </div>
                <div className="flex justify-between border-b border-[#E6E9EF] pb-1">
                  <span className="text-[#5F6368]">Active Scrutiny Time:</span>
                  <strong>{selectedNode.avgDurationDays} Days</strong>
                </div>
                <div className="flex justify-between border-b border-[#E6E9EF] pb-1">
                  <span className="text-[#5F6368]">Queue Dwell Wait:</span>
                  <strong className={selectedNode.avgWaitDays > 3 ? 'text-[#B72025]' : ''}>
                    {selectedNode.avgWaitDays} Days
                  </strong>
                </div>
                <div className="flex justify-between border-b border-[#E6E9EF] pb-1">
                  <span className="text-[#5F6368]">Historical Baseline:</span>
                  <strong>{selectedNode.historicalBaselineDays} Days</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5F6368]">Desk Workload Capacity:</span>
                  <strong className={selectedNode.officerCapacityPct > 90 ? 'text-[#B72025]' : 'text-[#15803D]'}>
                    {selectedNode.officerCapacityPct}%
                  </strong>
                </div>
              </div>
            </div>

            {/* Center: Bottleneck Severity & Root Cause */}
            <div className="md:col-span-2 space-y-3 p-4 bg-[#FAF8F2] border border-[#D9D4C7] rounded-[3px]">
              <div className="flex items-center justify-between">
                <h4 className="font-serif font-bold text-sm text-[#0B2A4A]">
                  Operational Diagnosis &amp; Root Cause Analysis
                </h4>
                {selectedNode.isBottleneck ? (
                  <span className="px-2 py-0.5 bg-[#FEF2F2] text-[#B72025] border border-[#FCA5A5] rounded-[2px] font-bold text-xs">
                    CRITICAL BOTTLENECK
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0] rounded-[2px] font-semibold text-xs">
                    WITHIN NORMAL TOLERANCE
                  </span>
                )}
              </div>

              {selectedNode.isBottleneck ? (
                <div className="space-y-2 text-[#202124] leading-relaxed">
                  <p>
                    <strong>Observed Bottleneck:</strong> Queue dwell time currently deviates by <strong>+{selectedNode.deviationFromBaselinePct}%</strong> from historical state norms. Active officer backlog is accumulating at <strong>{selectedNode.queueSize} files</strong>.
                  </p>
                  <p className="text-[#5F6368]">
                    <strong>Inter-Departmental Rework:</strong> 24% of files return back from this stage to Officer Review due to incomplete certified High Court orders and missing village survey maps.
                  </p>
                  <div className="p-3 bg-white border border-[#D9DDE3] rounded-[2px] text-xs">
                    <strong className="text-[#0B2A4A]">Recommended Administrative Intervention:</strong>
                    <p className="text-[#5F6368] mt-0.5">
                      Enable chamber empanelled counsel routing and pre-verification GIS checks to reduce queue dwell by 4.2 days.
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-[#5F6368] leading-relaxed">
                  This workflow stage is operating efficiently within statutory SLA thresholds. Average queue dwell is under 1.5 days and officer capacity remains balanced.
                </p>
              )}
            </div>
          </div>
        </GovCard>
      )}
    </div>
  );
};
