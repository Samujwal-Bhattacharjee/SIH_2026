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
  Layers,
  FileCheck,
} from 'lucide-react';
import { workflowService, analyticsService, projectService } from '../services/api';
import { ProcessMapData, ProcessPerformanceMetrics, Case } from '../types';
import { GovCard } from '../components/common/GovCard';
import { GovButton } from '../components/common/GovButton';
import { TableSkeleton } from '../components/common/LoadingSkeleton';

export const Intelligence: React.FC = () => {
  const [processMap, setProcessMap] = useState<ProcessMapData | null>(null);
  const [metrics, setMetrics] = useState<ProcessPerformanceMetrics | null>(null);
  const [projects, setProjects] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchIntelligenceData = async () => {
    setLoading(true);
    try {
      const [mapRes, perfRes, projRes] = await Promise.all([
        workflowService.getProcessMap(),
        analyticsService.getPerformanceMetrics(),
        projectService.getProjects({ riskLevel: 'HIGH' }),
      ]);
      setProcessMap(mapRes);
      setMetrics(perfRes);
      setProjects(projRes.projects || []);
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

  const delayFactors = [
    { factor: 'Compensation Disbursement Backlog', weight: '36.6%', impacted: 184, impact: 'CRITICAL', avgDelay: '+28d', desc: 'Awaiting sanction from District Treasury or multi-party award apportionment.' },
    { factor: 'Ownership & Title Conflict', weight: '22.1%', impacted: 126, impact: 'CRITICAL', avgDelay: '+22d', desc: 'Contested claims between co-sharers or unregistered land revenue partitions.' },
    { factor: 'Incomplete Documentation / RoR', weight: '11.9%', impacted: 98, impact: 'HIGH', avgDelay: '+14d', desc: 'Missing 7/12 land records, sub-division maps, or cadastral boundary sheets.' },
    { factor: 'Court Litigation / Stay Orders', weight: '11.4%', impacted: 64, impact: 'HIGH', avgDelay: '+45d', desc: 'High Court writ petitions or stay orders on Section 11 preliminary notifications.' },
    { factor: 'Joint Survey & Measurement Discrepancies', weight: '6.2%', impacted: 45, impact: 'MEDIUM', avgDelay: '+9d', desc: 'Area discrepancy between physical possession and revenue record registers.' },
    { factor: 'Inter-departmental NOC Dependencies', weight: '4.8%', impacted: 52, impact: 'MEDIUM', avgDelay: '+12d', desc: 'Pending forest clearance, railway crossing NOC, or utility relocation approvals.' },
    { factor: 'R&R Package Sanction Delays', weight: '4.0%', impacted: 38, impact: 'MEDIUM', avgDelay: '+16d', desc: 'Rehabilitation and resettlement scheme approval pending under Section 16.' },
    { factor: 'Gazette Publication Lapses', weight: '3.0%', impacted: 19, impact: 'LOW', avgDelay: '+6d', desc: 'Delay in local newspaper publication or official state gazette printing.' },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#D9DDE3] pb-3 gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-serif font-bold text-2xl text-[#0B3558] tracking-tight">
              Procurement Compliance Intelligence &amp; Exception Analysis
            </h1>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase rounded-[2px] border border-emerald-300">
              Rule Evaluator (v2.1)
            </span>
          </div>
          <p className="text-xs text-[#5F6368] mt-0.5">
            Government Procurement • AI-assisted bid compliance attribution and exception detection across tender records.
          </p>
        </div>

        <GovButton
          variant="secondary"
          size="sm"
          onClick={fetchIntelligenceData}
          icon={<RefreshCw className="w-3.5 h-3.5 text-[#0B3558]" />}
        >
          Refresh Analysis
        </GovButton>
      </div>

      {/* Continuous Government Metric Strip */}
      <div className="bg-white border border-[#CBD2DE] border-t-2 border-t-[#0B3558] rounded-[2px] grid grid-cols-2 md:grid-cols-4 divide-x divide-[#CBD2DE] select-none">
        <div className="p-3.5 space-y-0.5">
          <span className="text-[10px] uppercase font-bold text-[#5F6368] tracking-wider block">PROJECTS ANALYZED</span>
          <div className="text-2xl font-bold font-serif text-[#0B3558]">1,200</div>
          <span className="text-[11px] text-[#5F6368] block">Across 8 State Districts</span>
        </div>
        <div className="p-3.5 space-y-0.5 bg-[#FFF9F9]">
          <span className="text-[10px] uppercase font-bold text-[#B72025] tracking-wider block">HIGH DELAY RISK (≥60%)</span>
          <div className="text-2xl font-bold font-serif text-[#B72025]">48</div>
          <span className="text-[11px] text-[#B72025] font-semibold block">Require SLAO Escalation</span>
        </div>
        <div className="p-3.5 space-y-0.5 bg-[#FFFDF5]">
          <span className="text-[10px] uppercase font-bold text-[#D97706] tracking-wider block">PRIMARY BOTTLENECK</span>
          <div className="text-sm font-bold font-serif text-[#D97706] truncate">Compensation Disbursement</div>
          <span className="text-[11px] text-[#D97706] font-semibold block">+28d Excess Dwell</span>
        </div>
        <div className="p-3.5 space-y-0.5 bg-[#F9FDF9]">
          <span className="text-[10px] uppercase font-bold text-[#15803D] tracking-wider block">MODEL ACCURACY</span>
          <div className="text-2xl font-bold font-serif text-[#15803D]">94.58%</div>
          <span className="text-[11px] text-[#15803D] font-mono block">ROC-AUC: 0.9934</span>
        </div>
      </div>

      {/* Delay Factor Attribution Matrix */}
      <GovCard
        title="Observable Delay Factor Attribution &amp; Global Feature Importance"
        subtitle="Random Forest feature weights evaluating empirical contribution to statutory timeline deviations."
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#0B3558] text-white border-b-2 border-[#040E1A]">
                <th className="p-2.5 font-semibold">Contributing Delay Factor</th>
                <th className="p-2.5 font-semibold text-center">Model Importance</th>
                <th className="p-2.5 font-semibold text-center">Impacted Projects</th>
                <th className="p-2.5 font-semibold text-center">Avg Timeline Delay</th>
                <th className="p-2.5 font-semibold">Severity Classification</th>
                <th className="p-2.5 font-semibold">Observed Administrative Trigger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9DDE3]">
              {delayFactors.map((row, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-[#EEF2F7] transition-colors ${idx % 2 === 1 ? 'bg-[#F9FAFB]' : 'bg-white'}`}
                >
                  <td className="p-2.5 font-bold text-[#0B3558]">{row.factor}</td>
                  <td className="p-2.5 text-center font-mono font-bold text-[#0B3558]">{row.weight}</td>
                  <td className="p-2.5 text-center font-mono font-semibold">{row.impacted}</td>
                  <td className="p-2.5 text-center font-mono font-bold text-[#B72025]">{row.avgDelay}</td>
                  <td className="p-2.5">
                    <span className={`px-2 py-0.5 rounded-[2px] font-bold text-[10px] border ${
                      row.impact === 'CRITICAL' ? 'bg-red-50 text-red-800 border-red-300' :
                      row.impact === 'HIGH' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                      row.impact === 'MEDIUM' ? 'bg-blue-50 text-blue-800 border-blue-300' :
                      'bg-green-50 text-green-800 border-green-300'
                    }`}>
                      {row.impact}
                    </span>
                  </td>
                  <td className="p-2.5 text-[#5F6368] text-[11px]">{row.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GovCard>

      {/* Procurement Verification Stage Breakdown */}
      <GovCard
        title="Verification Stage Turnaround vs Baseline"
        subtitle="Comparison of observed average stage duration versus procurement evaluation benchmarks."
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#0B3558] text-white border-b-2 border-[#040E1A]">
                <th className="p-2.5 font-semibold">Verification Stage</th>
                <th className="p-2.5 font-semibold text-center">Statutory Baseline</th>
                <th className="p-2.5 font-semibold text-center">Observed Avg Dwell</th>
                <th className="p-2.5 font-semibold text-center">Timeline Deviation</th>
                <th className="p-2.5 font-semibold text-center">Active Projects</th>
                <th className="p-2.5 font-semibold">Status Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9DDE3]">
              {[
                { stage: 'Project Initiation', baseline: '15d', actual: '14.2d', dev: '-5%', count: 82, status: 'NORMAL' },
                { stage: 'Land Identification', baseline: '30d', actual: '28.6d', dev: '-4%', count: 110, status: 'NORMAL' },
                { stage: 'Preliminary Notification (Sec 11)', baseline: '30d', actual: '34.8d', dev: '+16%', count: 145, status: 'WARNING' },
                { stage: 'Survey and Verification', baseline: '45d', actual: '48.2d', dev: '+7%', count: 128, status: 'NORMAL' },
                { stage: 'Ownership Verification', baseline: '30d', actual: '46.4d', dev: '+54%', count: 164, status: 'CRITICAL' },
                { stage: 'Objection & Legal Review', baseline: '60d', actual: '59.1d', dev: '-1%', count: 96, status: 'NORMAL' },
                { stage: 'Compensation Assessment', baseline: '60d', actual: '67.5d', dev: '+12%', count: 132, status: 'WARNING' },
                { stage: 'Compensation Disbursement', baseline: '90d', actual: '118.4d', dev: '+31%', count: 184, status: 'CRITICAL' },
                { stage: 'R&R and Rehabilitation', baseline: '120d', actual: '126.8d', dev: '+5%', count: 74, status: 'NORMAL' },
                { stage: 'Final Acquisition', baseline: '30d', actual: '29.2d', dev: '-2%', count: 52, status: 'NORMAL' },
                { stage: 'Possession and Handover', baseline: '30d', actual: '31.0d', dev: '+3%', count: 33, status: 'NORMAL' },
              ].map((stg, i) => (
                <tr
                  key={i}
                  className={`hover:bg-[#EEF2F7] transition-colors ${i % 2 === 1 ? 'bg-[#F9FAFB]' : 'bg-white'}`}
                >
                  <td className="p-2.5 font-bold text-[#0B3558]">{stg.stage}</td>
                  <td className="p-2.5 text-center font-mono">{stg.baseline}</td>
                  <td className="p-2.5 text-center font-mono font-bold text-[#0B3558]">{stg.actual}</td>
                  <td className={`p-2.5 text-center font-mono font-bold ${
                    stg.dev.startsWith('+') && parseInt(stg.dev) >= 20 ? 'text-[#B72025]' :
                    stg.dev.startsWith('+') ? 'text-[#D97706]' : 'text-[#15803D]'
                  }`}>
                    {stg.dev}
                  </td>
                  <td className="p-2.5 text-center font-mono font-semibold">{stg.count}</td>
                  <td className="p-2.5">
                    <span className={`px-2 py-0.5 rounded-[2px] font-bold text-[10px] border ${
                      stg.status === 'CRITICAL' ? 'bg-red-50 text-red-800 border-red-300' :
                      stg.status === 'WARNING' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                      'bg-green-50 text-green-800 border-green-300'
                    }`}>
                      {stg.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GovCard>

      {/* Priority Escalation Project List */}
      <GovCard
        title="High-Priority Escalation Queue (Exceptions & High Risk)"
        subtitle="Bidder submissions currently flagged with compliance exceptions or high risk."
        highlightBorder="red"
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#0B3558] text-white border-b-2 border-[#040E1A]">
                <th className="p-2.5 font-semibold">Project Code</th>
                <th className="p-2.5 font-semibold">Project Description &amp; District</th>
                <th className="p-2.5 font-semibold">Current Stage</th>
                <th className="p-2.5 font-semibold text-center">Delay Prob (ML)</th>
                <th className="p-2.5 font-semibold text-center">Est. Delay</th>
                <th className="p-2.5 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9DDE3]">
              {projects.slice(0, 5).map((p, idx) => {
                const prob = p.delayProbability ?? (p.riskScore / 100);
                const probPct = Math.round(prob * 100);
                return (
                  <tr
                    key={p.id}
                    className={`hover:bg-[#FFF8F8] transition-colors ${idx % 2 === 1 ? 'bg-[#FCFDFD]' : 'bg-white'}`}
                  >
                    <td className="p-2.5 font-mono font-bold text-[#0B3558]">
                      <Link to={`/projects/${p.id}`} className="hover:underline">
                        {p.projectCode || p.fileNumber || p.id}
                      </Link>
                    </td>
                    <td className="p-2.5 max-w-sm">
                      <div className="font-semibold text-[#202124] truncate">{p.title}</div>
                      <div className="text-[11px] text-[#5F6368]">{p.district || 'Pune'} • {p.department}</div>
                    </td>
                    <td className="p-2.5">
                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-800 font-mono text-[11px] rounded-[2px] border border-gray-300">
                        {p.currentStage}
                      </span>
                    </td>
                    <td className="p-2.5 text-center font-mono">
                      <span className="px-2 py-0.5 bg-red-100 text-red-800 border border-red-300 rounded-[2px] font-bold text-[11px]">
                        {probPct}%
                      </span>
                    </td>
                    <td className="p-2.5 text-center font-mono font-bold text-red-700">
                      +{p.predictedDelayDays || 23}d
                    </td>
                    <td className="p-2.5 text-right whitespace-nowrap">
                      <GovButton
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/projects/${p.id}`)}
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
    </div>
  );
};

export default Intelligence;
