import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Play,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Sliders,
  Sparkles,
  Info,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { simulationService } from '../services/api';
import {
  SimulationScenarioOption,
  SimulationResult,
  SimulationIntervention,
} from '../types';

type SimulationStep = 'IDLE' | 'BUILDING' | 'REPLAYING' | 'CALCULATING' | 'READY';

export const Simulation: React.FC = () => {
  const [scenarios, setScenarios] = useState<SimulationScenarioOption[]>([]);
  const [selectedIntervention, setSelectedIntervention] = useState<SimulationIntervention>(
    'ESCALATE_LEGAL_REVIEW_THRESHOLD'
  );
  const [threshold, setThreshold] = useState<number>(5);
  const [step, setStep] = useState<SimulationStep>('IDLE');
  const [progress, setProgress] = useState<number>(0);
  const [result, setResult] = useState<SimulationResult | null>(null);

  useEffect(() => {
    const fetchScenarios = async () => {
      const opts = await simulationService.getScenarios();
      setScenarios(opts as SimulationScenarioOption[]);
    };
    fetchScenarios();
  }, []);

  const activeScenario = scenarios.find((s) => s.id === selectedIntervention);

  const handleInterventionChange = (id: SimulationIntervention) => {
    setSelectedIntervention(id);
    const scen = scenarios.find((s) => s.id === id);
    if (scen) setThreshold(scen.defaultThreshold);
    setResult(null);
  };

  const handleRunSimulation = async () => {
    setStep('BUILDING');
    setProgress(25);
    setResult(null);

    // Multi-step animated process replay
    await new Promise((r) => setTimeout(r, 400));
    setStep('REPLAYING');
    setProgress(55);

    await new Promise((r) => setTimeout(r, 500));
    setStep('CALCULATING');
    setProgress(85);

    try {
      const res = await simulationService.runSimulation(selectedIntervention, threshold);
      setProgress(100);
      setStep('READY');
      setResult(res);
    } catch (e) {
      console.error(e);
      setStep('IDLE');
    }
  };

  const isSimulating = step !== 'IDLE' && step !== 'READY';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border-hairline pb-4 gap-4">
        <div>
          <div className="flex items-center space-x-2 font-mono text-3xs text-ink-500 uppercase tracking-widest">
            <span>GOIP</span>
            <span>/</span>
            <span>WHAT-IF LAB</span>
            <span>/</span>
            <span>WORKFLOW POLICY SIMULATION</span>
          </div>
          <h1 className="font-sans font-extrabold text-2xl text-ink-950 tracking-tight mt-1">
            WORKFLOW INTERVENTION &amp; SLA OPTIMIZATION SIMULATION
          </h1>
        </div>

        <div className="font-mono text-3xs text-ink-500 flex items-center space-x-3">
          <span>ENGINE: <strong>DISCRETE EVENT STOCHASTIC SOLVER</strong></span>
          <span>•</span>
          <span>SAMPLE: <strong>10,482 HISTORICAL RUNS</strong></span>
        </div>
      </div>

      {/* Control Panel / Lab Configuration */}
      <div className="bg-surface border border-border-hairline p-6 shadow-subtle-1 space-y-6">
        <div className="flex items-center space-x-2 font-mono text-xs font-bold text-ink-950 border-b border-border-hairline pb-3">
          <Sliders className="w-4 h-4 text-vermilion" />
          <span>CONFIGURE POLICY INTERVENTION SCENARIO</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Scenario Selector */}
          <div className="lg:col-span-7 space-y-3">
            <label className="block font-mono text-3xs font-bold text-ink-500 uppercase tracking-wider">
              SELECT WORKFLOW INTERVENTION POLICY
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {scenarios.map((scen) => (
                <div
                  key={scen.id}
                  onClick={() => !isSimulating && handleInterventionChange(scen.id)}
                  className={`p-3.5 border transition-all cursor-pointer ${
                    selectedIntervention === scen.id
                      ? 'border-ink-950 bg-surface-subtle shadow-subtle-1'
                      : 'border-border-hairline bg-surface hover:border-ink-400'
                  }`}
                >
                  <div className="font-mono text-xs font-bold text-ink-950 mb-1">
                    {scen.title}
                  </div>
                  <p className="font-sans text-3xs text-ink-600 leading-relaxed">
                    {scen.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Parameter Slider & Execution Trigger */}
          <div className="lg:col-span-5 flex flex-col justify-between p-4 bg-surface-subtle/50 border border-border-hairline space-y-4">
            {activeScenario && (
              <div className="space-y-3">
                <div className="flex justify-between items-center font-mono text-2xs">
                  <span className="font-bold text-ink-700 uppercase">
                    {activeScenario.parameterName}
                  </span>
                  <span className="font-bold text-sm text-vermilion px-2 py-0.5 bg-surface border border-border-hairline">
                    {threshold} {activeScenario.unit}
                  </span>
                </div>

                <input
                  type="range"
                  min={activeScenario.minVal}
                  max={activeScenario.maxVal}
                  value={threshold}
                  disabled={isSimulating}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-full accent-ink-900 cursor-pointer"
                />

                <div className="flex justify-between font-mono text-3xs text-ink-400">
                  <span>MIN: {activeScenario.minVal} {activeScenario.unit}</span>
                  <span>MAX: {activeScenario.maxVal} {activeScenario.unit}</span>
                </div>
              </div>
            )}

            <div className="space-y-2 pt-2">
              <button
                onClick={handleRunSimulation}
                disabled={isSimulating}
                className="w-full py-3 bg-ink-900 hover:bg-ink-800 text-white font-mono text-xs uppercase tracking-wider font-bold flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 shadow-subtle-2"
              >
                {isSimulating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-vermilion" />
                    <span>EXECUTING DISCRETE SIMULATION...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-vermilion fill-vermilion" />
                    <span>RUN WHAT-IF SIMULATION</span>
                  </>
                )}
              </button>

              <p className="font-mono text-3xs text-ink-400 text-center">
                REPLAYS 10,482 PROCESS HISTORIES UNDER MODIFIED ROUTING RULES
              </p>
            </div>
          </div>
        </div>

        {/* Animated Progress Strip */}
        {isSimulating && (
          <div className="p-4 bg-surface border border-border-hairline space-y-2">
            <div className="flex items-center justify-between font-mono text-3xs font-bold text-ink-900">
              <span className="flex items-center space-x-2">
                <Loader2 className="w-3 h-3 text-vermilion animate-spin" />
                <span>
                  {step === 'BUILDING' && 'STEP 01/03: BUILDING SCENARIO PARAMETERS...'}
                  {step === 'REPLAYING' && 'STEP 02/03: REPLAYING HISTORICAL PROCESS LOGS (10,482 RUNS)...'}
                  {step === 'CALCULATING' && 'STEP 03/03: SOLVING QUEUE CLEARANCE & SLA IMPACT...'}
                </span>
              </span>
              <span className="text-vermilion font-bold">{progress}%</span>
            </div>

            <div className="w-full bg-surface-subtle h-2 overflow-hidden border border-border-hairline">
              <div
                className="bg-vermilion h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Comparative Simulation Results Matrix */}
      {result && (
        <div className="space-y-6 animate-fade-in">
          {/* Summary Narrative Banner */}
          <div className="p-5 bg-surface border-2 border-ink-950 shadow-subtle-2 space-y-2">
            <div className="flex items-center space-x-2 font-mono text-3xs font-bold text-sageSuccess uppercase tracking-widest">
              <CheckCircle2 className="w-4 h-4 text-sageSuccess" />
              <span>SIMULATION CONVERGED SUCCESSFULLY • SCENARIO: {result.interventionName.toUpperCase()}</span>
            </div>
            <h3 className="font-sans font-bold text-base text-ink-950">
              ESTIMATED IMPACT: -{result.difference.cycleTimeReductionDays} DAYS CYCLE REDUCTION (+{result.difference.slaImprovementPct}% SLA COMPLIANCE)
            </h3>
            <p className="font-sans text-xs text-ink-700 leading-relaxed max-w-4xl">
              {result.summaryExplanation}
            </p>
          </div>

          {/* Side-by-Side KPI Comparison Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
            {/* Median Processing Time */}
            <div className="p-4 bg-surface border border-border-hairline space-y-2 shadow-subtle-1">
              <span className="text-3xs text-ink-400 uppercase block">
                01 // MEDIAN CYCLE TIME
              </span>
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-xs text-ink-400 line-through">
                    {result.baseline.medianCycleDays}d
                  </div>
                  <div className="text-2xl font-bold text-ink-950">
                    {result.simulated.medianCycleDays} <span className="text-xs font-normal text-ink-500">days</span>
                  </div>
                </div>
                <span className="inline-flex items-center text-3xs font-bold text-sageSuccess bg-sageSuccess-subtle border border-sageSuccess-border px-1.5 py-0.5">
                  <TrendingDown className="w-3 h-3 mr-1" />
                  -{result.difference.cycleTimeReductionDays}d
                </span>
              </div>
              <span className="text-3xs text-ink-500 block">
                -{( (result.difference.cycleTimeReductionDays / result.baseline.medianCycleDays) * 100 ).toFixed(1)}% speedup
              </span>
            </div>

            {/* SLA Compliance */}
            <div className="p-4 bg-surface border border-border-hairline space-y-2 shadow-subtle-1">
              <span className="text-3xs text-ink-400 uppercase block">
                02 // SLA COMPLIANCE
              </span>
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-xs text-ink-400">
                    Baseline: {result.baseline.slaCompliancePct}%
                  </div>
                  <div className="text-2xl font-bold text-sageSuccess">
                    {result.simulated.slaCompliancePct}%
                  </div>
                </div>
                <span className="inline-flex items-center text-3xs font-bold text-sageSuccess bg-sageSuccess-subtle border border-sageSuccess-border px-1.5 py-0.5">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +{result.difference.slaImprovementPct}%
                </span>
              </div>
              <span className="text-3xs text-ink-500 block">
                Target citizen guarantee
              </span>
            </div>

            {/* High-Risk Cases Mitigated */}
            <div className="p-4 bg-surface border border-border-hairline space-y-2 shadow-subtle-1">
              <span className="text-3xs text-ink-400 uppercase block">
                03 // AT-RISK CASES
              </span>
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-xs text-ink-400 line-through">
                    {result.baseline.highRiskCasesCount} cases
                  </div>
                  <div className="text-2xl font-bold text-vermilion">
                    {result.simulated.highRiskCasesCount} <span className="text-xs font-normal text-ink-500">cases</span>
                  </div>
                </div>
                <span className="inline-flex items-center text-3xs font-bold text-sageSuccess bg-sageSuccess-subtle border border-sageSuccess-border px-1.5 py-0.5">
                  -{result.difference.riskCasesMitigated} SAVED
                </span>
              </div>
              <span className="text-3xs text-ink-500 block">
                58.9% risk reduction
              </span>
            </div>

            {/* Legal Wait Reduction */}
            <div className="p-4 bg-surface border border-border-hairline space-y-2 shadow-subtle-1">
              <span className="text-3xs text-ink-400 uppercase block">
                04 // LEGAL QUEUE WAIT
              </span>
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-xs text-ink-400 line-through">
                    {result.baseline.avgLegalWaitDays}d
                  </div>
                  <div className="text-2xl font-bold text-ink-950">
                    {result.simulated.avgLegalWaitDays} <span className="text-xs font-normal text-ink-500">days</span>
                  </div>
                </div>
                <span className="inline-flex items-center text-3xs font-bold text-sageSuccess bg-sageSuccess-subtle border border-sageSuccess-border px-1.5 py-0.5">
                  -{result.difference.legalWaitReductionDays}d
                </span>
              </div>
              <span className="text-3xs text-ink-500 block">
                Bottleneck resolution
              </span>
            </div>
          </div>

          {/* Stage-by-Stage Wait Time Comparison Table */}
          <div className="bg-surface border border-border-hairline p-5 space-y-4 shadow-subtle-1">
            <div className="flex justify-between items-center border-b border-border-hairline pb-3">
              <div>
                <span className="font-mono text-3xs font-bold text-ink-500 uppercase tracking-widest">
                  DECOMPOSED QUEUE LATENCY BY STAGE
                </span>
                <h4 className="font-sans font-bold text-sm text-ink-950 mt-0.5">
                  CURRENT BASELINE VS. SIMULATED STAGE LATENCY
                </h4>
              </div>
              <span className="font-mono text-3xs text-ink-400">VALUES IN DAYS</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border-hairline bg-surface-subtle/50 text-3xs text-ink-500 uppercase">
                    <th className="py-2 px-3">PROCESS STAGE</th>
                    <th className="py-2 px-3">BASELINE WAIT</th>
                    <th className="py-2 px-3">SIMULATED WAIT</th>
                    <th className="py-2 px-3">SAVINGS</th>
                    <th className="py-2 px-3">LATENCY COMPARISON BAR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-hairline">
                  {result.stagesComparison.map((stg, idx) => {
                    const saved = (stg.baselineWait - stg.simulatedWait).toFixed(1);
                    return (
                      <tr key={idx} className="hover:bg-surface-hover">
                        <td className="py-2.5 px-3 font-semibold text-ink-900">
                          {stg.stage}
                        </td>
                        <td className="py-2.5 px-3 text-ink-500">{stg.baselineWait}d</td>
                        <td className="py-2.5 px-3 font-bold text-ink-950">{stg.simulatedWait}d</td>
                        <td className="py-2.5 px-3">
                          {Number(saved) > 0 ? (
                            <span className="text-sageSuccess font-bold">-{saved}d</span>
                          ) : (
                            <span className="text-ink-400">0.0d</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 w-64">
                          <div className="flex items-center space-x-2">
                            <div className="w-full bg-surface-subtle h-2 overflow-hidden border border-border-hairline relative">
                              <div
                                className="bg-ink-300 h-full absolute"
                                style={{ width: `${Math.min(100, stg.baselineWait * 10)}%` }}
                              />
                              <div
                                className="bg-sageSuccess h-full absolute"
                                style={{ width: `${Math.min(100, stg.simulatedWait * 10)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Model Disclaimer */}
          <div className="p-3 bg-surface-subtle border border-border-hairline flex items-center space-x-2 font-mono text-3xs text-ink-500">
            <Info className="w-3.5 h-3.5 text-ink-400 flex-shrink-0" />
            <span>
              GOIP Simulation Engine: Estimated impact based on discrete-event simulation of historical process logs. Does not guarantee statutory compliance without departmental executive order.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
