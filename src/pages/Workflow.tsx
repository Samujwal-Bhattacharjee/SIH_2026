import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  GitBranch,
  AlertTriangle,
  RefreshCw,
  Clock,
  Layers,
  Filter,
  BarChart3,
  Maximize2,
} from 'lucide-react';
import { workflowService } from '../services/api';
import { ProcessMapData, WorkflowNodeData } from '../types';
import { CustomWorkflowNode } from '../components/workflow/CustomWorkflowNode';
import { WorkflowDrawer } from '../components/workflow/WorkflowDrawer';
import { GraphSkeleton } from '../components/common/LoadingSkeleton';

const nodeTypes = {
  customNode: CustomWorkflowNode,
};

export const Workflow: React.FC = () => {
  const [processData, setProcessData] = useState<ProcessMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [selectedDateRange, setSelectedDateRange] = useState('LAST_90_DAYS');
  const [selectedNodeData, setSelectedNodeData] = useState<WorkflowNodeData | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const fetchWorkflow = async () => {
    setLoading(true);
    try {
      const data = await workflowService.getProcessMap({
        department: selectedDepartment,
        dateRange: selectedDateRange,
      });
      setProcessData(data);

      // Construct React Flow graph topology (vertical/horizontal layout)
      const flowNodes: Node[] = data.nodes.map((n, idx) => {
        let x = 320;
        let y = idx * 160 + 40;

        // Custom offset for branching
        if (n.id === 'n5') {
          x = 480;
          y = 520;
        } else if (n.id === 'n4') {
          x = 220;
          y = 360;
        } else if (n.id === 'n6') {
          x = 320;
          y = 700;
        } else if (n.id === 'n7') {
          x = 320;
          y = 860;
        }

        return {
          id: n.id,
          type: 'customNode',
          position: { x, y },
          data: n,
        };
      });

      const flowEdges: Edge[] = data.edges.map((e) => {
        const isRework = e.isReworkLoop;
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          animated: isRework,
          sourceHandle: isRework ? 'right' : undefined,
          targetHandle: isRework ? 'left' : undefined,
          type: isRework ? 'smoothstep' : 'default',
          style: {
            stroke: isRework ? '#D97706' : '#111215',
            strokeWidth: isRework ? 2.5 : 1.5,
            strokeDasharray: isRework ? '5 5' : undefined,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isRework ? '#D97706' : '#111215',
            width: 14,
            height: 14,
          },
          label: isRework
            ? `REWORK LOOP (${e.loopPercentage}% / +${e.additionalDelayDays}d)`
            : `${e.caseCount.toLocaleString()} cases`,
          labelStyle: {
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize: 10,
            fill: isRework ? '#D97706' : '#5A6270',
            fontWeight: isRework ? 700 : 500,
          },
          labelBgStyle: {
            fill: '#FFFFFF',
            fillOpacity: 0.9,
            stroke: isRework ? '#FDE68A' : '#E2E5EB',
            strokeWidth: 1,
          },
        };
      });

      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch (err) {
      console.error('Failed to load process map:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflow();
  }, [selectedDepartment, selectedDateRange]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNodeData(node.data as unknown as WorkflowNodeData);
    },
    []
  );

  if (loading || !processData) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-80 bg-ink-200 animate-pulse rounded-sm" />
        <GraphSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border-hairline pb-4 gap-4">
        <div>
          <div className="flex items-center space-x-2 font-mono text-3xs text-ink-500 uppercase tracking-widest">
            <span>GOIP</span>
            <span>/</span>
            <span>PROCESS MINING WORKSPACE</span>
            <span>/</span>
            <span>DISCOVERED PETRI-NET TOPOLOGY</span>
          </div>
          <h1 className="font-sans font-extrabold text-2xl text-ink-950 tracking-tight mt-1">
            DATA-DRIVEN WORKFLOW TOPOLOGY &amp; BOTTLENECK MINING
          </h1>
        </div>

        {/* Workspace Filter Controls */}
        <div className="flex items-center space-x-2 font-mono text-2xs">
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-2.5 py-1.5 bg-surface border border-border-hairline text-ink-900 focus:outline-none"
          >
            <option value="ALL">DEPT: ALL DEPARTMENTS</option>
            <option value="Land Revenue">DEPT: LAND REVENUE</option>
            <option value="Urban Planning">DEPT: URBAN PLANNING</option>
            <option value="Commerce & Industry">DEPT: COMMERCE &amp; INDUSTRY</option>
          </select>

          <select
            value={selectedDateRange}
            onChange={(e) => setSelectedDateRange(e.target.value)}
            className="px-2.5 py-1.5 bg-surface border border-border-hairline text-ink-900 focus:outline-none"
          >
            <option value="LAST_90_DAYS">DATE: LAST 90 DAYS (Q2 2026)</option>
            <option value="LAST_30_DAYS">DATE: LAST 30 DAYS</option>
            <option value="ALL_TIME">DATE: ALL-TIME DATASET</option>
          </select>
        </div>
      </div>

      {/* Top Process KPI Overview Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-2xs">
        <div className="p-3.5 bg-surface border border-border-hairline space-y-1 shadow-subtle-1">
          <span className="text-3xs text-ink-400 uppercase">ACTIVE CASES MINED</span>
          <div className="text-xl font-bold text-ink-950">
            {processData.metrics.totalActiveCases.toLocaleString()}
          </div>
          <span className="text-3xs text-ink-500">Continuous log ingestion</span>
        </div>

        <div className="p-3.5 bg-surface border border-border-hairline space-y-1 shadow-subtle-1">
          <span className="text-3xs text-ink-400 uppercase">MEDIAN CYCLE TIME</span>
          <div className="text-xl font-bold text-ink-950">
            {processData.metrics.medianCycleDays} <span className="text-xs font-normal text-ink-400">days</span>
          </div>
          <span className="text-3xs text-ink-500">Statutory target: 21.0d</span>
        </div>

        <div className="p-3.5 bg-surface border border-amberRisk-border bg-amberRisk-subtle/30 space-y-1 shadow-subtle-1">
          <span className="text-3xs text-amberRisk font-bold uppercase">REWORK LOOP FREQUENCY</span>
          <div className="text-xl font-bold text-amberRisk">
            {processData.metrics.reworkRatePct}%
          </div>
          <span className="text-3xs text-ink-600">822 cases looped back</span>
        </div>

        <div className="p-3.5 bg-surface border border-border-hairline space-y-1 shadow-subtle-1">
          <span className="text-3xs text-ink-400 uppercase">SLA COMPLIANCE RATE</span>
          <div className="text-xl font-bold text-ink-950">
            {processData.metrics.slaComplianceRatePct}%
          </div>
          <span className="text-3xs text-vermilion">27.2% at risk or breached</span>
        </div>
      </div>

      {/* Interactive Process Mining Canvas */}
      <div className="bg-surface border border-border-hairline shadow-subtle-2 h-[680px] relative overflow-hidden">
        {/* Canvas HUD Overlay */}
        <div className="absolute top-3 left-3 z-10 p-2.5 bg-surface/95 border border-border-hairline font-mono text-3xs space-y-1 shadow-sm backdrop-blur-xs">
          <div className="flex items-center space-x-2 font-bold text-ink-900">
            <span className="w-2 h-2 rounded-full bg-sageSuccess animate-pulse" />
            <span>DISCOVERED PROCESS MAP (PM4PY ALPHA-MINER)</span>
          </div>
          <div className="text-ink-500 flex items-center space-x-3">
            <span>NODES: {nodes.length}</span>
            <span>TRANSITIONS: {edges.length}</span>
            <span>CLICK NODE TO INSPECT</span>
          </div>
        </div>

        {/* Legend Box */}
        <div className="absolute bottom-3 left-3 z-10 p-2.5 bg-surface/95 border border-border-hairline font-mono text-3xs space-y-1.5 shadow-sm backdrop-blur-xs">
          <div className="font-bold text-ink-900 uppercase">LEGEND</div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 bg-vermilion" />
            <span>CRITICAL BOTTLENECK (LEGAL REVIEW)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-0.5 border-t border-dashed border-amberRisk" />
            <span>DETECTED REWORK LOOP</span>
          </div>
        </div>

        {/* React Flow Component */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.5}
          maxZoom={1.5}
          defaultEdgeOptions={{ type: 'smoothstep' }}
        >
          <Background color="#CBD2DE" gap={24} size={1} />
          <Controls className="!bg-surface !border-border-hairline !shadow-sm" />
          <MiniMap
            className="!bg-surface !border-border-hairline"
            nodeColor={(n) => ((n.data as any)?.isBottleneck ? '#D9381E' : '#111215')}
          />
        </ReactFlow>
      </div>

      {/* Stage Inspector Drawer */}
      <WorkflowDrawer
        node={selectedNodeData}
        onClose={() => setSelectedNodeData(null)}
      />
    </div>
  );
};
