import React from 'react';
import { RiskLevel, CaseStatus } from '../../types';

interface StatusBadgeProps {
  status?: CaseStatus;
  riskLevel?: RiskLevel;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  riskLevel,
  className = '',
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-3xs' : 'px-2 py-0.5 text-2xs';

  if (riskLevel) {
    switch (riskLevel) {
      case 'HIGH':
        return (
          <span
            className={`inline-flex items-center font-mono font-semibold tracking-wider uppercase bg-vermilion-subtle text-vermilion border border-vermilion-border ${sizeClasses} ${className}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-vermilion mr-1.5 animate-pulse" />
            HIGH RISK
          </span>
        );
      case 'MEDIUM':
        return (
          <span
            className={`inline-flex items-center font-mono font-medium tracking-wider uppercase bg-amberRisk-subtle text-amberRisk border border-amberRisk-border ${sizeClasses} ${className}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amberRisk mr-1.5" />
            ELEVATED
          </span>
        );
      case 'LOW':
        return (
          <span
            className={`inline-flex items-center font-mono font-medium tracking-wider uppercase bg-sageSuccess-subtle text-sageSuccess border border-sageSuccess-border ${sizeClasses} ${className}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-sageSuccess mr-1.5" />
            STABLE
          </span>
        );
    }
  }

  if (status) {
    switch (status) {
      case 'SLA_BREACHED':
        return (
          <span
            className={`inline-flex items-center font-mono font-semibold tracking-wider uppercase bg-vermilion-subtle text-vermilion border border-vermilion-border ${sizeClasses} ${className}`}
          >
            <span className="w-1.5 h-1.5 bg-vermilion mr-1.5" />
            BREACHED
          </span>
        );
      case 'AT_RISK':
        return (
          <span
            className={`inline-flex items-center font-mono font-medium tracking-wider uppercase bg-amberRisk-subtle text-amberRisk border border-amberRisk-border ${sizeClasses} ${className}`}
          >
            <span className="w-1.5 h-1.5 bg-amberRisk mr-1.5" />
            AT RISK
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span
            className={`inline-flex items-center font-mono font-medium tracking-wider uppercase bg-navyInfo-subtle text-navyInfo border border-navyInfo-border ${sizeClasses} ${className}`}
          >
            <span className="w-1.5 h-1.5 bg-navyInfo mr-1.5" />
            ACTIVE
          </span>
        );
      case 'RESOLVED':
        return (
          <span
            className={`inline-flex items-center font-mono font-medium tracking-wider uppercase bg-sageSuccess-subtle text-sageSuccess border border-sageSuccess-border ${sizeClasses} ${className}`}
          >
            <span className="w-1.5 h-1.5 bg-sageSuccess mr-1.5" />
            RESOLVED
          </span>
        );
      case 'FLAGGED':
        return (
          <span
            className={`inline-flex items-center font-mono font-medium tracking-wider uppercase bg-purple-50 text-purple-700 border border-purple-200 ${sizeClasses} ${className}`}
          >
            <span className="w-1.5 h-1.5 bg-purple-600 mr-1.5" />
            FLAGGED
          </span>
        );
    }
  }

  return null;
};
