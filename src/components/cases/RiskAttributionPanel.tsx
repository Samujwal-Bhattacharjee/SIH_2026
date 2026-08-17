import React from 'react';
import { RiskPrediction } from '../../types';
import { ShieldAlert, AlertTriangle, ArrowRight, BrainCircuit } from 'lucide-react';

interface RiskAttributionPanelProps {
  prediction: RiskPrediction;
}

export const RiskAttributionPanel: React.FC<RiskAttributionPanelProps> = ({ prediction }) => {
  return (
    <div className="bg-surface border border-border-hairline p-5 space-y-5 shadow-subtle-1">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-hairline pb-3">
        <div className="flex items-center space-x-2">
          <BrainCircuit className="w-4 h-4 text-vermilion" />
          <div>
            <h3 className="font-sans font-bold text-sm text-ink-950">
              SLA BREACH RISK INTELLIGENCE & EXPLANATION
            </h3>
            <p className="font-mono text-3xs text-ink-500">
              XGBOOST MODEL PREDICTION (CONFIDENCE: {(prediction.confidenceScore * 100).toFixed(0)}%)
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="font-mono text-xl font-bold text-vermilion leading-none">
            {prediction.riskScore}%
          </div>
          <span className="font-mono text-3xs uppercase font-semibold text-vermilion">
            HIGH SLA RISK
          </span>
        </div>
      </div>

      {/* Delay & Timeline Forecast */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-3xs">
        <div className="p-3 bg-surface-subtle border border-border-hairline space-y-1">
          <span className="text-ink-400 uppercase">PROJECTED DELAY</span>
          <div className="text-base font-bold text-vermilion">
            +{prediction.expectedDelayDays} DAYS
          </div>
          <span className="text-ink-500">Beyond statutory limit</span>
        </div>

        <div className="p-3 bg-surface-subtle border border-border-hairline space-y-1">
          <span className="text-ink-400 uppercase">STATUTORY DEADLINE</span>
          <div className="text-base font-bold text-ink-900">
            {new Date(prediction.statutoryDeadlineDate).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </div>
          <span className="text-ink-500">Legal citizen SLA date</span>
        </div>

        <div className="p-3 bg-surface-subtle border border-border-hairline space-y-1">
          <span className="text-ink-400 uppercase">ESTIMATED COMPLETION</span>
          <div className="text-base font-bold text-vermilion">
            {new Date(prediction.predictedBreachDate).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </div>
          <span className="text-ink-500">Predicted breach window</span>
        </div>
      </div>

      {/* SHAP Feature Attribution Breakdown */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between font-mono text-3xs font-bold text-ink-500 uppercase tracking-widest">
          <span>ROOT CAUSE ATTRIBUTION (SHAP VALUES)</span>
          <span>RELATIVE IMPACT</span>
        </div>

        <div className="space-y-3">
          {prediction.shapAttribution.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between font-mono text-2xs">
                <span className="font-semibold text-ink-900">{item.factor}</span>
                <span
                  className={`font-bold ${
                    item.impact === 'HIGH'
                      ? 'text-vermilion'
                      : item.impact === 'MEDIUM'
                      ? 'text-amberRisk'
                      : 'text-ink-600'
                  }`}
                >
                  +{item.contributionScore}%
                </span>
              </div>

              <div className="w-full bg-surface-subtle h-2 overflow-hidden border border-border-hairline">
                <div
                  className={`h-full transition-all ${
                    item.impact === 'HIGH'
                      ? 'bg-vermilion'
                      : item.impact === 'MEDIUM'
                      ? 'bg-amberRisk'
                      : 'bg-ink-600'
                  }`}
                  style={{ width: `${item.contributionScore}%` }}
                />
              </div>

              <p className="font-sans text-3xs text-ink-500 leading-tight">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Action Box */}
      <div className="p-3.5 bg-vermilion-subtle border border-vermilion-border space-y-1.5">
        <div className="flex items-center space-x-1.5 text-vermilion font-mono text-3xs font-bold uppercase tracking-wider">
          <AlertTriangle className="w-3 h-3" />
          <span>RECOMMENDED OPERATIONAL ACTION</span>
        </div>
        <p className="font-sans text-xs text-ink-900 font-medium">
          {prediction.recommendedAction}
        </p>
      </div>
    </div>
  );
};
