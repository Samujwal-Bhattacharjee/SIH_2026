import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Play,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sliders,
  RefreshCw,
} from 'lucide-react';
import { simulationService } from '../services/api';
import { SimulationScenarioOption, SimulationResult, SimulationIntervention } from '../types';
import { GovCard } from '../components/common/GovCard';
import { GovButton } from '../components/common/GovButton';
import { StatusBadge } from '../components/common/GovBadge';

export const Simulation: React.FC = () => {
  const [scenarios, setScenarios] = useState<SimulationScenarioOption[]>([]);
  const [selectedIntervention, setSelectedIntervention] =
    useState<SimulationIntervention>('ESCALATE_LEGAL_REVIEW_THRESHOLD');
  const [threshold, setThreshold] = useState(4);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        const data = await simulationService.getScenarios();
        setScenarios(data);
        if (data.length > 0) {
          setSelectedIntervention(data[0].id);
          setThreshold(data[0].defaultThreshold);
        }
      } catch (err) {
        console.error('Failed to load scenarios:', err);
      }
    };
    fetchScenarios();
  }, []);

  const handleRunSimulation = async () => {
    setRunning(true);
    try {
      const simResult = await simulationService.runSimulation(selectedIntervention, threshold);
      setResult(simResult);
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    if (scenarios.length > 0) {
      handleRunSimulation();
    }
  }, [selectedIntervention]);

  const activeScenario = scenarios.find((s) => s.id === selectedIntervention);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#D9DDE3] pb-3 gap-2">
        <div>
          <h1 className="font-serif font-bold text-2xl text-[#0B2A4A] tracking-tight">
            Administrative Policy &amp; Workflow Simulation Engine
          </h1>
          <p className="text-xs text-[#5F6368] mt-0.5">
            Model the systemic turnaround impacts of routing thresholds, staffing capacity, and fast-track procedures.
          </p>
        </div>
      </div>

      {/* Scenario Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scenarios.map((sc) => {
          const isSelected = sc.id === selectedIntervention;
          return (
            <div
              key={sc.id}
              onClick={() => {
                setSelectedIntervention(sc.id);
                setThreshold(sc.defaultThreshold);
              }}
              className={`p-4 border rounded-[4px] cursor-pointer transition-all ${
                isSelected
                  ? 'border-[#0B2A4A] ring-2 ring-[#0B2A4A] bg-[#F0F5FA]'
                  : 'border-[#D9DDE3] bg-white hover:bg-[#F8F9FA]'
              }`}
            >
              <h3 className="font-serif font-bold text-sm text-[#0B2A4A] mb-1">
                {sc.title}
              </h3>
              <p className="text-xs text-[#5F6368] leading-relaxed">
                {sc.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Parameter Control Panel */}
      {activeScenario && (
        <GovCard title="Configure Intervention Parameters" highlightBorder="navy">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-8 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-[#202124]">
                  {activeScenario.parameterName}:
                </span>
                <strong className="font-mono text-[#0B2A4A] text-sm">
                  {threshold} {activeScenario.unit}
                </strong>
              </div>
              <input
                type="range"
                min={activeScenario.minVal}
                max={activeScenario.maxVal}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full accent-[#0B2A4A] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#5F6368] font-mono">
                <span>Min: {activeScenario.minVal}</span>
                <span>Default: {activeScenario.defaultThreshold}</span>
                <span>Max: {activeScenario.maxVal}</span>
              </div>
            </div>

            <div className="md:col-span-4 flex justify-end">
              <GovButton
                variant="primary"
                size="md"
                loading={running}
                onClick={handleRunSimulation}
                icon={<Play className="w-4 h-4" />}
              >
                Execute Simulation Replay
              </GovButton>
            </div>
          </div>
        </GovCard>
      )}

      {/* Simulation Results Output */}
      {result && (
        <div className="space-y-6">
          {/* Comparative Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono select-none">
            <div className="p-3.5 bg-white border border-[#D9DDE3] border-l-4 border-l-[#15803D] rounded-[3px] space-y-1">
              <span className="text-[10px] text-[#5F6368] uppercase">CYCLE TIME REDUCTION</span>
              <div className="text-2xl font-bold font-serif text-[#15803D]">
                -{result.difference.cycleTimeReductionDays} Days
              </div>
              <span className="text-[11px] text-[#5F6368]">
                {result.baseline.medianCycleDays}d → {result.simulated.medianCycleDays}d
              </span>
            </div>

            <div className="p-3.5 bg-white border border-[#D9DDE3] border-l-4 border-l-[#0B2A4A] rounded-[3px] space-y-1">
              <span className="text-[10px] text-[#5F6368] uppercase">SLA ADHERENCE GAIN</span>
              <div className="text-2xl font-bold font-serif text-[#0B2A4A]">
                +{result.difference.slaImprovementPct}%
              </div>
              <span className="text-[11px] text-[#5F6368]">
                {result.baseline.slaCompliancePct}% → {result.simulated.slaCompliancePct}%
              </span>
            </div>

            <div className="p-3.5 bg-white border border-[#D9DDE3] border-l-4 border-l-[#D97706] rounded-[3px] space-y-1">
              <span className="text-[10px] text-[#5F6368] uppercase">AT-RISK CASES MITIGATED</span>
              <div className="text-2xl font-bold font-serif text-[#D97706]">
                {result.difference.riskCasesMitigated} Files
              </div>
              <span className="text-[11px] text-[#5F6368]">
                {result.baseline.highRiskCasesCount} → {result.simulated.highRiskCasesCount} High Risk
              </span>
            </div>

            <div className="p-3.5 bg-white border border-[#D9DDE3] border-l-4 border-l-[#173F67] rounded-[3px] space-y-1">
              <span className="text-[10px] text-[#5F6368] uppercase">LEGAL QUEUE DWELL GAIN</span>
              <div className="text-2xl font-bold font-serif text-[#173F67]">
                -{result.difference.legalWaitReductionDays} Days
              </div>
              <span className="text-[11px] text-[#5F6368]">
                {result.baseline.avgLegalWaitDays}d → {result.simulated.avgLegalWaitDays}d
              </span>
            </div>
          </div>

          {/* Comparative Stage Turnaround Table */}
          <GovCard
            title="Stage-By-Stage Workflow Comparison (Baseline vs Simulated)"
            subtitle="Projected turnaround reductions across all 7 administrative stages."
            noPadding
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0B2A4A] text-white border-b-2 border-[#071A2E]">
                    <th className="p-2.5 font-semibold">Workflow Stage</th>
                    <th className="p-2.5 font-semibold text-center">Baseline Wait</th>
                    <th className="p-2.5 font-semibold text-center">Simulated Wait</th>
                    <th className="p-2.5 font-semibold text-center">Baseline Scrutiny</th>
                    <th className="p-2.5 font-semibold text-center">Simulated Scrutiny</th>
                    <th className="p-2.5 font-semibold text-right">Net Gain</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9DDE3]">
                  {result.stagesComparison.map((stage, idx) => {
                    const totalBase = stage.baselineWait + stage.baselineDuration;
                    const totalSim = stage.simulatedWait + stage.simulatedDuration;
                    const diff = +(totalBase - totalSim).toFixed(1);

                    return (
                      <tr
                        key={stage.stage}
                        className={idx % 2 === 1 ? 'bg-[#F9FAFB]' : 'bg-white'}
                      >
                        <td className="p-2.5 font-bold text-[#0B2A4A]">{stage.stage}</td>
                        <td className="p-2.5 text-center font-mono">{stage.baselineWait}d</td>
                        <td className="p-2.5 text-center font-mono font-bold text-[#15803D]">
                          {stage.simulatedWait}d
                        </td>
                        <td className="p-2.5 text-center font-mono">{stage.baselineDuration}d</td>
                        <td className="p-2.5 text-center font-mono font-bold text-[#15803D]">
                          {stage.simulatedDuration}d
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold">
                          {diff > 0 ? (
                            <span className="text-[#15803D]">-{diff} Days</span>
                          ) : (
                            <span className="text-gray-400">0.0d</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </GovCard>
        </div>
      )}
    </div>
  );
};
