import React from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react';

interface StatutoryDeadlineEngineProps {
  statutoryDeadlineDays: number;
  daysRemaining: number;
  createdAt: string;
}

export const StatutoryDeadlineEngine: React.FC<StatutoryDeadlineEngineProps> = ({
  statutoryDeadlineDays,
  daysRemaining,
  createdAt,
}) => {
  const createdDate = new Date(createdAt);
  const slaTargetDate = new Date(createdDate);
  slaTargetDate.setDate(slaTargetDate.getDate() + statutoryDeadlineDays);

  const t7Date = new Date(createdDate);
  t7Date.setDate(t7Date.getDate() + 7);

  const t15Date = new Date(createdDate);
  t15Date.setDate(t15Date.getDate() + 15);

  const t30Date = new Date(createdDate);
  t30Date.setDate(t30Date.getDate() + 30);

  const isBreached = daysRemaining < 0;

  return (
    <div className="bg-surface border border-border-hairline p-5 space-y-4 shadow-subtle-1">
      <div className="flex items-center justify-between border-b border-border-hairline pb-3">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-ink-700" />
          <div>
            <h3 className="font-sans font-bold text-sm text-ink-950">
              STATUTORY DEADLINE ENGINE
            </h3>
            <p className="font-mono text-3xs text-ink-500">
              CITIZEN SERVICE CHARTER GUARANTEE (ACT SECTION 4)
            </p>
          </div>
        </div>

        <div className="font-mono text-xs font-semibold px-2 py-1 bg-surface-subtle border border-border-hairline">
          {isBreached ? (
            <span className="text-vermilion font-bold">
              {Math.abs(daysRemaining)} DAYS OVERDUE
            </span>
          ) : (
            <span className={daysRemaining <= 5 ? 'text-vermilion' : 'text-sageSuccess'}>
              {daysRemaining} DAYS REMAINING
            </span>
          )}
        </div>
      </div>

      {/* Threshold Step Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-3xs">
        <div className="p-3 bg-surface border border-border-hairline space-y-1">
          <div className="flex justify-between items-center text-ink-500">
            <span>7-DAY THRESHOLD</span>
            <span className="text-sageSuccess font-semibold">STAGE 1 SLA</span>
          </div>
          <div className="text-xs font-bold text-ink-900">
            {t7Date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
          </div>
          <p className="text-ink-400">Intake & Verification completion cutoff</p>
        </div>

        <div className="p-3 bg-surface border border-border-hairline space-y-1">
          <div className="flex justify-between items-center text-ink-500">
            <span>15-DAY THRESHOLD</span>
            <span className="text-amberRisk font-semibold">STAGE 2 SLA</span>
          </div>
          <div className="text-xs font-bold text-ink-900">
            {t15Date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
          </div>
          <p className="text-ink-400">Department review & inter-cell handoff</p>
        </div>

        <div className="p-3 bg-surface border border-border-hairline space-y-1">
          <div className="flex justify-between items-center text-ink-500">
            <span>STATUTORY MAX (30D)</span>
            <span className={isBreached ? 'text-vermilion font-bold' : 'text-ink-700'}>
              FINAL CITIZEN SLA
            </span>
          </div>
          <div className="text-xs font-bold text-vermilion">
            {slaTargetDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
          <p className="text-ink-400">Statutory penalty & escalation trigger</p>
        </div>
      </div>

      <div className="p-3 bg-surface-subtle/50 border border-border-hairline flex items-center space-x-2 font-mono text-3xs text-ink-600">
        <AlertCircle className="w-3.5 h-3.5 text-ink-500 flex-shrink-0" />
        <span>
          Statutory deadlines are deterministic legal bounds and operate independently of machine learning delay predictions.
        </span>
      </div>
    </div>
  );
};
