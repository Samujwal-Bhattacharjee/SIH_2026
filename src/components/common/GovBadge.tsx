import React from 'react';
import { GovFileStatus, PriorityLevel, RiskLevel } from '../../types';

interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className = '',
  size = 'md',
}) => {
  const normalized = status.toUpperCase().replace(/\s+/g, '_');
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs';

  let colorClasses = 'bg-gray-100 text-gray-800 border-gray-300';
  let label = status;

  switch (normalized) {
    case 'RECEIVED':
      colorClasses = 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]';
      label = 'Received';
      break;
    case 'REGISTERED':
      colorClasses = 'bg-[#F0F5FA] text-[#0B2A4A] border-[#CBD2DE] font-semibold';
      label = 'Registered';
      break;
    case 'UNDER_SCRUTINY':
      colorClasses = 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]';
      label = 'Under Scrutiny';
      break;
    case 'FORWARDED':
      colorClasses = 'bg-[#F0F5FA] text-[#123B63] border-[#CBD2DE]';
      label = 'Forwarded';
      break;
    case 'UNDER_PROCESSING':
    case 'IN_PROGRESS':
      colorClasses = 'bg-[#EFF6FF] text-[#1E4E79] border-[#BFDBFE]';
      label = 'Under Processing';
      break;
    case 'PENDING':
      colorClasses = 'bg-[#FFFBEB] text-[#92400E] border-[#FCD34D]';
      label = 'Pending';
      break;
    case 'APPROVED':
    case 'RESOLVED':
      colorClasses = 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0] font-semibold';
      label = 'Approved';
      break;
    case 'REJECTED':
      colorClasses = 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA] font-semibold';
      label = 'Rejected';
      break;
    case 'DISPOSED':
      colorClasses = 'bg-[#F1F5F9] text-[#475569] border-[#CBD5E1] font-semibold';
      label = 'Disposed';
      break;
    case 'OVERDUE':
    case 'SLA_BREACHED':
      colorClasses = 'bg-[#FEF2F2] text-[#B72025] border-[#FCA5A5] font-bold';
      label = 'Overdue (> SLA)';
      break;
    case 'AT_RISK':
      colorClasses = 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A] font-semibold';
      label = 'At Risk';
      break;
    case 'FLAGGED':
      colorClasses = 'bg-[#FEF2F2] text-[#B72025] border-[#F87171] font-semibold';
      label = 'Flagged';
      break;
    // Priorities
    case 'IMMEDIATE':
      colorClasses = 'bg-[#FEF2F2] text-[#B72025] border-[#B72025] font-bold';
      label = 'Immediate';
      break;
    case 'URGENT':
      colorClasses = 'bg-[#FFFBEB] text-[#D97706] border-[#F59E0B] font-semibold';
      label = 'Urgent';
      break;
    case 'ROUTINE':
      colorClasses = 'bg-[#F3F4F6] text-[#4B5563] border-[#D1D5DB]';
      label = 'Routine';
      break;
    // Risk Levels
    case 'HIGH':
      colorClasses = 'bg-[#FEF2F2] text-[#B72025] border-[#FCA5A5] font-bold';
      label = 'High Risk';
      break;
    case 'MEDIUM':
      colorClasses = 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A] font-semibold';
      label = 'Medium Risk';
      break;
    case 'LOW':
      colorClasses = 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]';
      label = 'Low Risk';
      break;
    // OCR Statuses
    case 'COMPLETED':
    case 'READY':
      colorClasses = 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0] font-semibold';
      label = 'OCR Ready';
      break;
    case 'PROCESSING':
      colorClasses = 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]';
      label = 'OCR Processing';
      break;
    case 'FAILED':
    case 'ERROR':
      colorClasses = 'bg-[#FEF2F2] text-[#B72025] border-[#FCA5A5]';
      label = 'OCR Failed';
      break;
    default:
      label = status;
      break;
  }

  return (
    <span
      className={`inline-flex items-center justify-center font-sans uppercase tracking-wider border rounded-[3px] select-none ${sizeClasses} ${colorClasses} ${className}`}
    >
      {label}
    </span>
  );
};

export const GovBadge = StatusBadge;

