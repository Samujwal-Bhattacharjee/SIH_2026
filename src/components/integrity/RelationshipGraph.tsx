/**
 * RelationshipGraph.tsx — Procurement Integrity Relationship Network
 * ===================================================================
 * Renders a government-style entity relationship graph using @xyflow/react,
 * sourced entirely from real IntegrityAssessment findings.
 *
 * Entities: Tender → Bidder → Shared Identifier (PAN/GSTIN/Address/etc.)
 * IMPORTANT: No data is fabricated. Shows professional empty state if no
 * relationship findings exist.
 */
import React, { useCallback, useMemo, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeTypes,
  type NodeProps,
  Handle,
  Position,
  MarkerType,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { X, Building, FileText, Link2, Network } from 'lucide-react';
import { IntegrityAssessment } from '../../types';

// ─── Design Tokens (NIC government palette) ───────────────────────────────────
const C = {
  tender:       { bg: '#EFF6FF', bd: '#1D4ED8', tx: '#1E3A8A' },
  bidder:       { bg: '#F0F5FA', bd: '#0B2A4A', tx: '#0B2A4A' },
  bidderRisk:   { bg: '#FEF2F2', bd: '#B91C1C', tx: '#7F1D1D' },
  sharedPan:    { bg: '#FFF7ED', bd: '#C2410C', tx: '#7C2D12' },
  sharedGstin:  { bg: '#FEFCE8', bd: '#A16207', tx: '#713F12' },
  sharedAddr:   { bg: '#F0FDF4', bd: '#15803D', tx: '#14532D' },
  sharedDirector: { bg: '#F0F9FF', bd: '#0284C7', tx: '#0369A1' },
  sharedOfficer: { bg: '#FAF5FF', bd: '#7C3AED', tx: '#5B21B6' },
  sharedMismatch: { bg: '#FEF2F2', bd: '#E11D48', tx: '#9F1239' },
  sharedOther:  { bg: '#F5F3FF', bd: '#6D28D9', tx: '#4C1D95' },
};

function colForField(field: string) {
  const f = (field || '').toUpperCase();
  if (f.includes('DIRECTOR') || f.includes('SIGNATORY')) return C.sharedDirector;
  if (f.includes('OFFICER')) return C.sharedOfficer;
  if (f.includes('MISMATCH') || f.includes('CROSS') || f.includes('INCONSISTENCY')) return C.sharedMismatch;
  if (f.includes('PAN') || f.includes('CIN') || f.includes('UDYAM')) return C.sharedPan;
  if (f.includes('GSTIN')) return C.sharedGstin;
  if (f.includes('ADDRESS')) return C.sharedAddr;
  return C.sharedOther;
}

function edgeColorForField(field: string): string {
  const f = (field || '').toUpperCase();
  if (f.includes('DIRECTOR') || f.includes('SIGNATORY')) return '#0284C7';
  if (f.includes('OFFICER')) return '#7C3AED';
  if (f.includes('MISMATCH') || f.includes('CROSS') || f.includes('INCONSISTENCY')) return '#E11D48';
  if (f.includes('PAN') || f.includes('CIN')) return '#C2410C';
  if (f.includes('GSTIN')) return '#A16207';
  if (f.includes('ADDRESS')) return '#15803D';
  return '#6D28D9';
}

function fieldLabel(field: string): string {
  const f = (field || '').toUpperCase();
  if (f.includes('DIRECTOR')) return 'Common Director';
  if (f.includes('OFFICER')) return 'Administrative Link';
  if (f.includes('MISMATCH') || f.includes('INCONSISTENCY')) return 'Cross-Document Link';
  if (f.includes('PAN')) return 'PAN';
  if (f.includes('GSTIN')) return 'GSTIN';
  if (f.includes('ADDRESS')) return 'Address';
  if (f.includes('CIN')) return 'CIN';
  if (f.includes('UDYAM')) return 'Udyam';
  if (f.includes('PHONE')) return 'Phone';
  if (f.includes('EMAIL')) return 'Email Domain';
  return field.replace(/_/g, ' ');
}

// ─── Node Data Shapes ─────────────────────────────────────────────────────────
interface TenderNodeData extends Record<string, unknown> {
  kind: 'tender'; label: string; tenderId: string;
  department?: string; estimatedValue?: number; bidderCount: number;
}
interface BidderNodeData extends Record<string, unknown> {
  kind: 'bidder'; label: string; bidderId: string; risk: string; hasFindings: boolean;
}
interface SharedNodeData extends Record<string, unknown> {
  kind: 'shared'; label: string; field: string; value: string;
  description: string; bidderNames: string[]; findingId: string; confidence: number;
}

// ─── Tender Node ──────────────────────────────────────────────────────────────
function TenderNode({ data, selected }: NodeProps) {
  const d = data as TenderNodeData;
  return (
    <div style={{
      background: C.tender.bg, border: `2px solid ${C.tender.bd}`,
      outline: selected ? '2px solid #BFDBFE' : 'none',
      borderRadius: 2, padding: '8px 14px', minWidth: 192,
      boxShadow: '0 1px 4px rgba(0,0,0,0.10)', fontFamily: 'Inter,sans-serif',
    }}>
      <Handle type="source" position={Position.Bottom}
        style={{ background: C.tender.bd, width: 7, height: 7 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
        <FileText size={13} color={C.tender.tx} />
        <span style={{ fontSize: 9, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tender</span>
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.tender.tx, lineHeight: 1.3, maxWidth: 200, wordBreak: 'break-word' }}>{d.label}</div>
      <div style={{ fontSize: 9, color: '#64748B', marginTop: 3 }}>{d.bidderCount} bidder{d.bidderCount !== 1 ? 's' : ''} participating</div>
      {d.estimatedValue ? <div style={{ fontSize: 9, color: '#475569', marginTop: 1 }}>Est. ₹{Number(d.estimatedValue).toLocaleString('en-IN')}</div> : null}
    </div>
  );
}

// ─── Bidder Node ──────────────────────────────────────────────────────────────
function BidderNode({ data, selected }: NodeProps) {
  const d = data as BidderNodeData;
  const col = d.hasFindings ? C.bidderRisk : C.bidder;
  return (
    <div style={{
      background: col.bg, border: `2px solid ${col.bd}`,
      outline: selected ? '2px solid #BAE6FD' : 'none',
      borderRadius: 2, padding: '8px 12px', minWidth: 155,
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)', fontFamily: 'Inter,sans-serif',
    }}>
      <Handle type="target" position={Position.Top} style={{ background: col.bd, width: 7, height: 7 }} />
      <Handle type="source" position={Position.Bottom} style={{ background: col.bd, width: 7, height: 7 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
        <Building size={12} color={col.tx} />
        <span style={{ fontSize: 9, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Bidder</span>
        {d.hasFindings && (
          <span style={{ fontSize: 8, fontWeight: 700, color: '#B91C1C', background: '#FEE2E2', padding: '1px 5px', borderRadius: 2 }}>FLAGGED</span>
        )}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: col.tx, lineHeight: 1.3, maxWidth: 178, wordBreak: 'break-word' }}>{d.label}</div>
      <div style={{ fontSize: 9, color: '#64748B', fontFamily: 'monospace', marginTop: 2 }}>{d.bidderId}</div>
    </div>
  );
}

// ─── Shared Identifier Node ───────────────────────────────────────────────────
function SharedNode({ data, selected }: NodeProps) {
  const d = data as SharedNodeData;
  const col = colForField(d.field);
  const fl = fieldLabel(d.field);
  const displayVal = String(d.value ?? '').length > 22
    ? String(d.value ?? '').slice(0, 20) + '…'
    : String(d.value ?? '');
  return (
    <div style={{
      background: col.bg, border: `2px dashed ${col.bd}`,
      outline: selected ? `2px solid ${col.bd}44` : 'none',
      borderRadius: 2, padding: '7px 12px', minWidth: 135,
      boxShadow: '0 1px 3px rgba(0,0,0,0.07)', fontFamily: 'Inter,sans-serif',
    }}>
      <Handle type="target" position={Position.Left} style={{ background: col.bd, width: 7, height: 7 }} />
      <Handle type="source" position={Position.Right} style={{ background: col.bd, width: 7, height: 7 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
        <Link2 size={11} color={col.tx} />
        <span style={{ fontSize: 9, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Shared {fl}</span>
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color: col.tx, fontFamily: 'monospace', lineHeight: 1.3, wordBreak: 'break-all' }}>{displayVal}</div>
      <div style={{ fontSize: 9, color: '#64748B', marginTop: 2 }}>{d.bidderNames.length} entit{d.bidderNames.length === 1 ? 'y' : 'ies'} share this</div>
    </div>
  );
}

const NODE_TYPES: NodeTypes = { tender: TenderNode, bidder: BidderNode, shared: SharedNode };

// ─── Graph Builder ────────────────────────────────────────────────────────────
interface BidderInput { id: string; name: string; risk: string; }

function buildGraph(
  tenderId: string, tenderLabel: string, tenderDept: string | undefined,
  tenderValue: number | undefined, bidders: BidderInput[], assessment: IntegrityAssessment
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const relFindings = assessment.findings.filter(
    (f) => f.signal_type === 'RELATED_BIDDER' ||
           f.signal_type === 'SHARED_ENTITY' ||
           f.signal_type === 'COMMON_DIRECTOR_LINK' ||
           f.signal_type === 'OFFICER_VENDOR_ASSOCIATION' ||
           f.signal_type === 'DOCUMENT_IDENTITY_INCONSISTENCY'
  );

  const flaggedIds = new Set<string>();
  relFindings.forEach((f) => {
    f.related_bidder_ids.forEach((id) => flaggedIds.add(id));
    if (f.bidder_id) flaggedIds.add(f.bidder_id);
  });

  // Tender node (centered horizontally)
  const tenderNodeId = `t-${tenderId}`;
  const totalBidderWidth = (bidders.length - 1) * 220;
  nodes.push({
    id: tenderNodeId, type: 'tender',
    position: { x: totalBidderWidth / 2 - 96, y: 0 },
    data: { kind: 'tender', label: tenderLabel, tenderId, department: tenderDept,
            estimatedValue: tenderValue, bidderCount: bidders.length } satisfies TenderNodeData,
  });

  // Bidder nodes
  bidders.forEach((b, idx) => {
    const nid = `b-${b.id}`;
    nodes.push({
      id: nid, type: 'bidder',
      position: { x: idx * 220, y: 160 },
      data: { kind: 'bidder', label: b.name, bidderId: b.id, risk: b.risk,
              hasFindings: flaggedIds.has(b.id) } satisfies BidderNodeData,
    });
    edges.push({
      id: `ep-${tenderId}-${b.id}`,
      source: tenderNodeId, target: nid, type: 'smoothstep',
      label: 'Participating',
      labelStyle: { fontSize: 9, fill: '#64748B' },
      labelBgStyle: { fill: '#F8FAFC', fillOpacity: 0.85 },
      style: { stroke: '#94A3B8', strokeWidth: 1.5, strokeDasharray: '4 3' },
      markerEnd: { type: MarkerType.ArrowClosed, width: 10, height: 10, color: '#94A3B8' },
    });
  });

  // Shared identifier nodes
  const totalEvidence = relFindings.reduce((s, f) => s + f.evidence.length, 0);
  const sharedSpacing = 200;
  const totalSharedWidth = (totalEvidence - 1) * sharedSpacing;
  let sharedIdx = 0;

  relFindings.forEach((finding) => {
    finding.evidence.forEach((ev) => {
      const snid = `s-${finding.id}-${ev.field}`;
      const sharedX = -totalSharedWidth / 2 + sharedIdx * sharedSpacing + totalBidderWidth / 2;
      sharedIdx++;

      const involvedIds = finding.related_bidder_ids.length > 0
        ? finding.related_bidder_ids
        : [finding.bidder_id].filter(Boolean) as string[];
      const bNames = involvedIds.map(
        (bid) => bidders.find((b) => b.id === bid)?.name || bid
      );

      nodes.push({
        id: snid, type: 'shared',
        position: { x: sharedX - 67, y: 360 },
        data: {
          kind: 'shared',
          label: `SHARED ${(ev.field || '').toUpperCase()}`,
          field: ev.field,
          value: String(ev.value ?? ''),
          description: ev.description,
          bidderNames: bNames,
          findingId: finding.id,
          confidence: finding.confidence,
        } satisfies SharedNodeData,
      });

      involvedIds.forEach((bid) => {
        const color = edgeColorForField(ev.field);
        edges.push({
          id: `es-${bid}-${snid}`,
          source: `b-${bid}`, target: snid,
          type: 'smoothstep',
          label: `Shared ${ev.field.replace(/_/g, ' ')}`,
          labelStyle: { fontSize: 9, fill: color, fontWeight: 700 },
          labelBgStyle: { fill: '#FFFBEB', fillOpacity: 0.9 },
          style: { stroke: color, strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, width: 10, height: 10, color },
          data: {
            edgeKind: 'shared',
            field: ev.field,
            value: String(ev.value ?? ''),
            description: ev.description,
            confidence: finding.confidence,
            findingId: finding.id,
            sourceLabel: bidders.find((b) => b.id === bid)?.name || bid,
            targetLabel: `Shared ${ev.field.replace(/_/g, ' ')}`,
          },
        });
      });
    });
  });

  return { nodes, edges };
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────
interface NodeSel { type: 'node'; data: TenderNodeData | BidderNodeData | SharedNodeData; }
interface EdgeSel { type: 'edge'; edgeData: Record<string, unknown>; }
type Selection = NodeSel | EdgeSel | null;

function Rows({ rows }: { rows: { l: string; v: string; mono?: boolean }[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {rows.map((r) => (
        <div key={r.l}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 1 }}>{r.l}</div>
          <div style={{ fontSize: 11, color: '#1E293B', fontFamily: r.mono ? 'monospace' : 'inherit',
                        background: r.mono ? '#F1F5F9' : 'transparent', padding: r.mono ? '2px 5px' : 0,
                        borderRadius: 2, wordBreak: 'break-all' }}>{r.v}</div>
        </div>
      ))}
    </div>
  );
}

function DetailPanel({ sel, onClose }: { sel: Selection; onClose: () => void }) {
  if (!sel) return null;
  return (
    <div style={{
      position: 'absolute', top: 12, right: 12, width: 280,
      background: 'white', border: '1px solid #CBD5E1', borderRadius: 3,
      boxShadow: '0 4px 16px rgba(0,0,0,0.10)', zIndex: 20, fontFamily: 'Inter,sans-serif',
    }}>
      <div style={{ background: '#0B2A4A', color: 'white', padding: '8px 12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderRadius: '3px 3px 0 0' }}>
        <span style={{ fontWeight: 700, fontSize: 11 }}>
          {sel.type === 'node' ? 'Entity Detail' : 'Relationship Detail'}
        </span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0, display: 'flex' }}>
          <X size={14} />
        </button>
      </div>
      <div style={{ padding: '10px 12px', maxHeight: 420, overflowY: 'auto' }}>
        {sel.type === 'node' && (() => {
          const d = sel.data;
          if (d.kind === 'tender') return (
            <Rows rows={[
              { l: 'Type', v: 'Procurement Tender' },
              { l: 'Tender ID', v: d.tenderId, mono: true },
              { l: 'Title', v: d.label },
              ...(d.department ? [{ l: 'Department', v: d.department }] : []),
              ...(d.estimatedValue ? [{ l: 'Estimated Value', v: `₹${Number(d.estimatedValue).toLocaleString('en-IN')}` }] : []),
              { l: 'Participating Bidders', v: String(d.bidderCount) },
            ]} />
          );
          if (d.kind === 'bidder') return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Rows rows={[
                { l: 'Type', v: 'Participating Bidder' },
                { l: 'Bidder ID', v: d.bidderId, mono: true },
                { l: 'Legal Name', v: d.label },
                { l: 'Risk Level', v: d.risk },
              ]} />
              {d.hasFindings && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: '6px 8px', borderRadius: 2, color: '#7F1D1D', fontSize: 10, lineHeight: 1.5 }}>
                  This bidder is involved in one or more integrity findings. Review the Key Findings section for full detail.
                </div>
              )}
            </div>
          );
          if (d.kind === 'shared') {
            const isStatutory = ['PAN','GSTIN','CIN','UDYAM'].some((k) => (d.field || '').toUpperCase().includes(k));
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Rows rows={[
                  { l: 'Type', v: 'Shared Entity Attribute' },
                  { l: 'Field', v: d.field.replace(/_/g, ' '), mono: true },
                  { l: 'Matched Value', v: String(d.value), mono: true },
                  { l: 'Entities Sharing', v: d.bidderNames.join(', ') },
                  { l: 'Evidence Confidence', v: `${(d.confidence * 100).toFixed(0)}%` },
                ]} />
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '6px 8px', borderRadius: 2, color: '#334155', fontSize: 10, lineHeight: 1.5 }}>
                  {d.description}
                </div>
                {isStatutory && (
                  <div style={{ background: '#FEFCE8', border: '1px solid #FEF08A', padding: '6px 8px', borderRadius: 2, color: '#713F12', fontSize: 10, lineHeight: 1.5 }}>
                    Recommended: Issue a clarification notice to establish whether the entities possess independent operational control and separate bidding autonomy under GFR 2017.
                  </div>
                )}
              </div>
            );
          }
          return null;
        })()}
        {sel.type === 'edge' && (() => {
          const d = sel.edgeData;
          const isStatutory = ['PAN','GSTIN','CIN'].some((k) => String(d.field || '').toUpperCase().includes(k));
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Rows rows={[
                { l: 'Relationship', v: `Shared ${String(d.field || '').replace(/_/g, ' ')}` },
                { l: 'From', v: String(d.sourceLabel || '') },
                { l: 'To', v: String(d.targetLabel || '') },
                ...(d.field ? [{ l: 'Shared Field', v: String(d.field).replace(/_/g, ' '), mono: true }] : []),
                ...(d.value ? [{ l: 'Matched Value', v: String(d.value), mono: true }] : []),
                ...(d.confidence ? [{ l: 'Confidence', v: `${(Number(d.confidence) * 100).toFixed(0)}%` }] : []),
              ]} />
              {typeof d.description === 'string' && d.description && (
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '6px 8px', borderRadius: 2, fontSize: 10, lineHeight: 1.5 }}>
                  <span style={{ fontWeight: 700, color: '#0B2A4A', display: 'block', marginBottom: 2 }}>Evidence:</span>
                  <span style={{ color: '#334155' }}>{d.description}</span>
                </div>
              )}
              {isStatutory && (
                <div style={{ background: '#FEFCE8', border: '1px solid #FEF08A', padding: '6px 8px', borderRadius: 2, color: '#713F12', fontSize: 10, lineHeight: 1.5 }}>
                  Verify whether the bidders represent independent competing entities as required under GFR 2017. This finding indicates an administrative review trigger, not proof of wrongdoing.
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ msg }: { msg: string }) {
  return (
    <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 3,
                  padding: '32px 24px', textAlign: 'center', fontFamily: 'Inter,sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
        <Network size={28} color="#94A3B8" />
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
        No Material Entity Relationships
      </div>
      <div style={{ fontSize: 11, color: '#64748B', maxWidth: 440, margin: '0 auto', lineHeight: 1.6 }}>
        {msg}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export interface RelationshipGraphProps {
  tenderId: string;
  tenderLabel: string;
  tenderDepartment?: string;
  tenderEstimatedValue?: number;
  bidders: BidderInput[];
  assessment: IntegrityAssessment;
}

export const RelationshipGraph: React.FC<RelationshipGraphProps> = ({
  tenderId, tenderLabel, tenderDepartment, tenderEstimatedValue, bidders, assessment,
}) => {
  const relFindings = useMemo(
    () => assessment.findings.filter(
      (f) => f.signal_type === 'RELATED_BIDDER' || f.signal_type === 'SHARED_ENTITY'
    ),
    [assessment.findings]
  );

  const { nodes: initN, edges: initE } = useMemo(
    () => buildGraph(tenderId, tenderLabel, tenderDepartment, tenderEstimatedValue, bidders, assessment),
    [tenderId, tenderLabel, tenderDepartment, tenderEstimatedValue, bidders, assessment]
  );

  const [nodes, , onNodesChange] = useNodesState(initN);
  const [edges, , onEdgesChange] = useEdgesState(initE);
  const [sel, setSel] = useState<Selection>(null);

  useEffect(() => { setSel(null); }, [tenderId, assessment]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSel({ type: 'node', data: node.data as TenderNodeData | BidderNodeData | SharedNodeData });
  }, []);

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    if (edge.data?.edgeKind === 'shared') {
      setSel({ type: 'edge', edgeData: edge.data as Record<string, unknown> });
    }
  }, []);

  const onPaneClick = useCallback(() => setSel(null), []);

  if (bidders.length === 0) {
    return <EmptyState msg="No bidder data available for this tender. Relationship network cannot be rendered." />;
  }
  if (relFindings.length === 0) {
    return <EmptyState msg="No material entity relationships are available for this procurement. No shared identifiers (PAN, GSTIN, Address) or linked entities were detected in the current dataset." />;
  }

  return (
    <div style={{
      width: '100%', height: 500, position: 'relative',
      background: '#FAFBFC', border: '1px solid #CBD5E1', borderRadius: 3,
      fontFamily: 'Inter,sans-serif', overflow: 'hidden',
    }}>
      <ReactFlow
        nodes={nodes} edges={edges}
        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
        nodeTypes={NODE_TYPES}
        onNodeClick={onNodeClick} onEdgeClick={onEdgeClick} onPaneClick={onPaneClick}
        fitView fitViewOptions={{ padding: 0.22, maxZoom: 1.15 }}
        minZoom={0.25} maxZoom={2.5}
        attributionPosition="bottom-left"
      >
        <Background color="#E2E8F0" gap={20} size={1} />
        <Controls style={{ bottom: 12, left: 12 }} showInteractive={false} />
        <MiniMap
          style={{ bottom: 12, right: 12, background: '#F1F5F9', border: '1px solid #CBD5E1' }}
          nodeColor={(n) => {
            const d = n.data as any;
            if (d?.kind === 'tender') return C.tender.bd;
            if (d?.kind === 'bidder') return d.hasFindings ? C.bidderRisk.bd : C.bidder.bd;
            return colForField(String(d?.field || '')).bd;
          }}
          maskColor="rgba(241,245,249,0.6)"
        />
        <Panel position="top-left" style={{ margin: 10 }}>
          <div style={{ background: 'white', border: '1px solid #CBD5E1', borderRadius: 2,
                        padding: '5px 10px', fontSize: 9, color: '#64748B', fontWeight: 700,
                        letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Procurement Relationship Network — {tenderLabel}
          </div>
        </Panel>
        <Panel position="top-right" style={{ margin: 10 }}>
          <div style={{ background: 'white', border: '1px solid #CBD5E1', borderRadius: 2,
                        padding: '8px 10px', fontSize: 9, color: '#475569', minWidth: 128 }}>
            <div style={{ fontWeight: 700, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Legend</div>
            {([
              { color: C.tender.bd,      label: 'Tender',           dashed: false },
              { color: C.bidder.bd,      label: 'Bidder',           dashed: false },
              { color: C.bidderRisk.bd,  label: 'Bidder (flagged)',  dashed: false },
              { color: C.sharedPan.bd,   label: 'Shared PAN / CIN', dashed: true },
              { color: C.sharedGstin.bd, label: 'Shared GSTIN',     dashed: true },
              { color: C.sharedAddr.bd,  label: 'Shared Address',   dashed: true },
              { color: C.sharedOther.bd, label: 'Shared Other',     dashed: true },
            ] as const).map(({ color, label, dashed }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                <div style={{ width: 12, height: 12, borderRadius: 1,
                              border: `2px ${dashed ? 'dashed' : 'solid'} ${color}`,
                              background: color + '22', flexShrink: 0 }} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </Panel>
      </ReactFlow>
      <DetailPanel sel={sel} onClose={() => setSel(null)} />
    </div>
  );
};

export default RelationshipGraph;

