import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GitBranch,
  AlertTriangle,
  Clock,
  ArrowRight,
  RefreshCw,
  Layers,
  CheckCircle2,
  AlertOctagon,
  ChevronDown,
} from 'lucide-react';
import { workflowService } from '../services/api';
import { ProcessMapData } from '../types';
import { GovCard } from '../components/common/GovCard';
import { GovButton } from '../components/common/GovButton';
import { TableSkeleton } from '../components/common/LoadingSkeleton';

interface LandWorkflowStage {
  id: string;
  name: string;
  expectedDays: number;
  actualDays: number;
  delayDays: number;
  activeProjects: number;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
  primaryIssue: string;
  recommendedIntervention: string;
}

const LA_WORKFLOW_STAGES: LandWorkflowStage[] = [
  { id: '1', name: '1. Project Initiation', expectedDays: 15, actualDays: 14, delayDays: 0, activeProjects: 82, status: 'NORMAL', primaryIssue: 'Requisition docket verification', recommendedIntervention: 'Routine processing by Requisitioning Dept.' },
  { id: '2', name: '2. Land Identification', expectedDays: 30, actualDays: 28, delayDays: 0, activeProjects: 110, status: 'NORMAL', primaryIssue: 'Cadastral map alignment', recommendedIntervention: 'Confirm alignment with State Master Plan.' },
  { id: '3', name: '3. Preliminary Notification (Sec 11)', expectedDays: 30, actualDays: 35, delayDays: 5, activeProjects: 145, status: 'WARNING', primaryIssue: 'Gazette and newspaper printing queue', recommendedIntervention: 'Expedite Gazette Directorate sign-off.' },
  { id: '4', name: '4. Survey & Verification', expectedDays: 45, actualDays: 48, delayDays: 3, activeProjects: 128, status: 'NORMAL', primaryIssue: 'Joint measurement survey on site', recommendedIntervention: 'Deploy additional survey inspection teams.' },
  { id: '5', name: '5. Ownership Verification', expectedDays: 30, actualDays: 46, delayDays: 16, activeProjects: 164, status: 'CRITICAL', primaryIssue: 'Disputed 7/12 land titles and heirs', recommendedIntervention: 'Convene Special SDM Title Inquiry.' },
  { id: '6', name: '6. Objection & Legal Review (Sec 15)', expectedDays: 60, actualDays: 59, delayDays: 0, activeProjects: 96, status: 'NORMAL', primaryIssue: 'Hearing citizen objections under Sec 15', recommendedIntervention: 'Complete summary objection hearings.' },
  { id: '7', name: '7. Compensation Assessment', expectedDays: 60, actualDays: 68, delayDays: 8, activeProjects: 132, status: 'WARNING', primaryIssue: 'Market rate calculation / Solatium factor', recommendedIntervention: 'Fast-track District Valuation Committee approval.' },
  { id: '8', name: '8. Compensation Disbursement (Sec 23/31)', expectedDays: 90, actualDays: 118, delayDays: 28, activeProjects: 184, status: 'CRITICAL', primaryIssue: 'Treasury grant release & DBT bank verification', recommendedIntervention: 'Escalate to SLAO & District Collector for DBT release.' },
  { id: '9', name: '9. R&R and Rehabilitation', expectedDays: 120, actualDays: 127, delayDays: 7, activeProjects: 74, status: 'NORMAL', primaryIssue: 'Rehabilitation plot allotment & amenities', recommendedIntervention: 'Review R&R Commissioner scheme sanction.' },
  { id: '10', name: '10. Final Acquisition (Sec 37)', expectedDays: 30, actualDays: 29, delayDays: 0, activeProjects: 52, status: 'NORMAL', primaryIssue: 'Award declaration & vesting in Govt.', recommendedIntervention: 'Execute statutory vesting deed.' },
  { id: '11', name: '11. Possession & Handover', expectedDays: 30, actualDays: 31, delayDays: 1, activeProjects: 33, status: 'NORMAL', primaryIssue: 'Physical site boundary fencing and handover', recommendedIntervention: 'Complete formal handover certificate to agency.' },
];

export const Workflow: React.FC = () => {
  const [processMap, setProcessMap] = useState<ProcessMapData | null>(null);
  const [selectedStage, setSelectedStage] = useState<LandWorkflowStage>(LA_WORKFLOW_STAGES[7]); // Select Compensation by default
  const [loading, setLoading] = useState(true);

  const fetchWorkflow = async () => {
    setLoading(true);
    try {
      const data = await workflowService.getProcessMap();
      setProcessMap(data);
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
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#D9DDE3] pb-3 gap-2">
        <div>
          <h1 className="font-serif font-bold text-2xl text-[#0B3558] tracking-tight">
            Procurement Bid Compliance Verification Workflow Map
          </h1>
          <p className="text-xs text-[#5F6368] mt-0.5">
            Sequential stage verification tracking, statutory validation benchmarks, and exception diagnostics.
          </p>
        </div>

        <GovButton
          variant="secondary"
          size="sm"
          onClick={fetchWorkflow}
          icon={<RefreshCw className="w-3.5 h-3.5 text-[#0B3558]" />}
        >
          Refresh Workflow
        </GovButton>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white border border-[#CBD2DE] rounded-[3px]">
          <span className="text-[10px] text-[#5F6368] uppercase font-bold tracking-wider block">TOTAL STAGES</span>
          <div className="text-2xl font-bold text-[#0B3558] font-serif">6 Verification Stages</div>
          <span className="text-[11px] text-[#5F6368] font-medium block">GeM Standard Rule Baseline</span>
        </div>

        <div className="p-3 bg-white border border-[#CBD2DE] rounded-[3px]">
          <span className="text-[10px] text-[#5F6368] uppercase font-bold tracking-wider block">EVALUATED BIDDERS</span>
          <div className="text-2xl font-bold text-[#0B3558] font-serif">10 Bidders</div>
          <span className="text-[11px] text-[#15803D] font-medium block">Active Cycle</span>
        </div>

        <div className="p-3 bg-white border border-[#CBD2DE] rounded-[3px]">
          <span className="text-[10px] text-[#5F6368] uppercase font-bold tracking-wider block">EXCEPTIONS FOUND</span>
          <div className="text-2xl font-bold text-[#B72025] font-serif">02 Exceptions</div>
          <span className="text-[11px] text-[#B72025] font-semibold block">Under Officer Action</span>
        </div>

        <div className="p-3 bg-white border border-[#CBD2DE] rounded-[3px]">
          <span className="text-[10px] text-[#D97706] uppercase font-bold tracking-wider block">AVG COMPLIANCE</span>
          <div className="text-2xl font-bold text-[#0B3558] font-serif">88.8%</div>
          <span className="text-[11px] text-[#15803D] font-semibold block">Across Active Tenders</span>
        </div>
      </div>

      {/* Main 2-Column Process Flow & Stage Diagnostic Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Vertical Sequential Process Timeline */}
        <div className="lg:col-span-7 space-y-3">
          <GovCard
            title="Sequential Procurement Compliance Verification Lifecycle"
            subtitle="Click any stage below to inspect verification benchmarks and evidence requirements."
            noPadding
          >
            <div className="divide-y divide-[#D9DDE3]">
              {LA_WORKFLOW_STAGES.map((stg) => {
                const isSelected = selectedStage.id === stg.id;
                return (
                  <div
                    key={stg.id}
                    onClick={() => setSelectedStage(stg)}
                    className={`p-3.5 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#EBF3FB] border-l-4 border-l-[#0B3558]'
                        : 'hover:bg-[#F8FAFC] bg-white'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-[#0B3558] text-xs flex items-center space-x-2">
                        <span>{stg.name}</span>
                        {stg.status === 'CRITICAL' && (
                          <span className="px-1.5 py-0.2 bg-red-100 text-red-800 border border-red-300 rounded text-[9px] font-bold">
                            CRITICAL BOTTLENECK
                          </span>
                        )}
                        {stg.status === 'WARNING' && (
                          <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 border border-amber-300 rounded text-[9px] font-bold">
                            MODERATE DELAY
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#5F6368]">
                        Statutory Baseline: <strong>{stg.expectedDays}d</strong> • Observed Avg: <strong>{stg.actualDays}d</strong>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <div className={`font-bold ${
                        stg.delayDays > 10 ? 'text-[#B72025]' : stg.delayDays > 0 ? 'text-[#D97706]' : 'text-[#15803D]'
                      }`}>
                        {stg.delayDays > 0 ? `+${stg.delayDays}d Excess` : 'On Track'}
                      </div>
                      <span className="text-[10px] text-[#64748B]">
                        {stg.activeProjects} active projects
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </GovCard>
        </div>

        {/* Right Column (5 cols): Selected Stage Detailed Diagnostic Dossier */}
        <div className="lg:col-span-5 space-y-6">
          <GovCard
            title={
              <div className="flex items-center space-x-2">
                <span className="font-serif font-bold text-sm text-[#0B3558]">
                  Stage Diagnostic: {selectedStage.name}
                </span>
              </div>
            }
            subtitle="Specific statutory compliance requirements and recommended administrative resolution."
            highlightBorder={selectedStage.status === 'CRITICAL' ? 'red' : selectedStage.status === 'WARNING' ? 'saffron' : 'green'}
          >
            <div className="space-y-4 text-xs">
              {/* Duration Benchmark Box */}
              <div className="grid grid-cols-3 gap-2 bg-[#F8FAFC] p-3 border border-[#CBD5E1] rounded-[3px] text-center font-mono">
                <div>
                  <span className="text-[10px] text-[#64748B] uppercase block">Baseline</span>
                  <strong className="text-sm text-[#0B3558]">{selectedStage.expectedDays} Days</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748B] uppercase block">Observed Avg</span>
                  <strong className="text-sm text-[#0B3558]">{selectedStage.actualDays} Days</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748B] uppercase block">Deviation</span>
                  <strong className={`text-sm ${
                    selectedStage.delayDays > 10 ? 'text-[#B72025]' : selectedStage.delayDays > 0 ? 'text-[#D97706]' : 'text-[#15803D]'
                  }`}>
                    {selectedStage.delayDays > 0 ? `+${selectedStage.delayDays}d` : '0d'}
                  </strong>
                </div>
              </div>

              {/* Observed Root Cause */}
              <div className="p-3 bg-white border border-[#D9DDE3] rounded-[3px] space-y-1">
                <span className="font-bold text-[#0B3558] uppercase tracking-wider text-[10px] block">
                  Observed Administrative Roadblock:
                </span>
                <p className="text-[#202124] text-[11px] leading-relaxed">
                  {selectedStage.primaryIssue}
                </p>
              </div>

              {/* Action Directive */}
              <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-[3px] space-y-1">
                <div className="flex items-center space-x-1.5 text-[#166534] font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                  <span>Prescribed Administrative Directive:</span>
                </div>
                <p className="text-[#14532D] text-[11px] leading-relaxed font-medium">
                  {selectedStage.recommendedIntervention}
                </p>
              </div>

              {/* Active Projects in this stage */}
              <div className="pt-2 border-t border-[#D9DDE3] flex items-center justify-between text-[11px] text-[#5F6368]">
                <span>Currently Active: <strong>{selectedStage.activeProjects} Projects</strong></span>
                <Link
                  to={`/projects?stage=${encodeURIComponent(selectedStage.name.split('. ')[1] || selectedStage.name)}`}
                  className="text-xs text-[#0B3558] font-bold hover:underline"
                >
                  View Filtered Projects →
                </Link>
              </div>
            </div>
          </GovCard>
        </div>
      </div>
    </div>
  );
};

export default Workflow;
