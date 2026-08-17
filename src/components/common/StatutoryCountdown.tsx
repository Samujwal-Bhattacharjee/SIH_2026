import React from 'react';
import { AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';

interface StatutoryCountdownProps {
  daysRemaining: number;
  statutoryDeadlineDays: number;
  className?: string;
  showIcon?: boolean;
}

export const StatutoryCountdown: React.FC<StatutoryCountdownProps> = ({
  daysRemaining,
  statutoryDeadlineDays,
  className = '',
  showIcon = true,
}) => {
  const isBreached = daysRemaining < 0;
  const isCritical = daysRemaining >= 0 && daysRemaining <= 3;
  const isWarning = daysRemaining > 3 && daysRemaining <= 7;

  if (isBreached) {
    return (
      <div className={`inline-flex items-center space-x-1.5 font-mono text-2xs text-vermilion ${className}`}>
        {showIcon && <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />}
        <span className="font-bold uppercase tracking-wider">
          {Math.abs(daysRemaining)}d OVERDUE
        </span>
        <span className="text-ink-400 text-3xs">({statutoryDeadlineDays}d max)</span>
      </div>
    );
  }

  if (isCritical) {
    return (
      <div className={`inline-flex items-center space-x-1.5 font-mono text-2xs text-vermilion ${className}`}>
        {showIcon && <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />}
        <span className="font-semibold">{daysRemaining} DAYS LEFT</span>
        <span className="text-ink-400 text-3xs">({statutoryDeadlineDays}d SLA)</span>
      </div>
    );
  }

  if (isWarning) {
    return (
      <div className={`inline-flex items-center space-x-1.5 font-mono text-2xs text-amberRisk ${className}`}>
        {showIcon && <Clock className="w-3.5 h-3.5 flex-shrink-0" />}
        <span className="font-medium">{daysRemaining} DAYS REMAINING</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center space-x-1.5 font-mono text-2xs text-ink-600 ${className}`}>
      {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-sageSuccess flex-shrink-0" />}
      <span>{daysRemaining} days remaining</span>
    </div>
  );
};
