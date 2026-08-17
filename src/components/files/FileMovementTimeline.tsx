import React from 'react';
import {
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  User,
  Building,
  FileCheck,
} from 'lucide-react';
import { CaseEvent } from '../../types';
import { StatusBadge } from '../common/GovBadge';

interface FileMovementTimelineProps {
  events: CaseEvent[];
}

export const FileMovementTimeline: React.FC<FileMovementTimelineProps> = ({ events }) => {
  if (!events || events.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-[#5F6368] bg-[#F8F9FA] border border-[#D9DDE3] rounded-[3px]">
        No prior file movements recorded in the active ledger.
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-[#CBD2DE]">
      {events.map((event, index) => {
        const isLatest = index === events.length - 1;

        return (
          <div key={event.id || index} className="relative group">
            {/* Timeline Node Icon */}
            <div
              className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                event.isDelayed
                  ? 'bg-[#FEF2F2] border-[#B72025] text-[#B72025]'
                  : event.isRework
                  ? 'bg-[#FFFBEB] border-[#D97706] text-[#D97706]'
                  : isLatest
                  ? 'bg-[#0B2A4A] border-[#0B2A4A] text-white'
                  : 'bg-white border-[#123B63] text-[#123B63]'
              }`}
            >
              {event.isRework ? (
                <RotateCcw className="w-2.5 h-2.5" />
              ) : event.isDelayed ? (
                <AlertTriangle className="w-2.5 h-2.5" />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-current" />
              )}
            </div>

            {/* Event Panel */}
            <div className="bg-white border border-[#D9DDE3] rounded-[3px] p-3.5 shadow-sm space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F0F2F5] pb-2 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-serif font-bold text-sm text-[#0B2A4A]">
                    {event.stage}
                  </span>
                  {event.isDelayed && <StatusBadge status="OVERDUE" size="sm" />}
                  {event.isRework && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] rounded-[2px]">
                      Rework Loop
                    </span>
                  )}
                </div>

                <div className="text-[11px] font-mono text-[#5F6368] flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span>{event.timestamp}</span>
                </div>
              </div>

              {/* Officer & Desk Handoff */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center space-x-1.5 text-[#202124]">
                  <User className="w-3.5 h-3.5 text-[#0B2A4A] flex-shrink-0" />
                  <span className="text-[#5F6368]">Officer:</span>
                  <strong className="font-semibold">{event.officer}</strong>
                </div>

                {event.fromDesk && event.toDesk && (
                  <div className="flex items-center space-x-1.5 text-[11px] text-[#5F6368]">
                    <span>{event.fromDesk}</span>
                    <ArrowRight className="w-3 h-3 text-gray-400" />
                    <span className="font-semibold text-[#0B2A4A]">{event.toDesk}</span>
                  </div>
                )}
              </div>

              {/* Official Remarks / Note Sheet Excerpt */}
              {event.notes && (
                <div className="p-2.5 bg-[#FAF8F2] border-l-2 border-[#123B63] text-xs text-[#202124] leading-relaxed font-sans">
                  <div className="text-[10px] uppercase font-bold text-[#5F6368] tracking-wider mb-0.5">
                    Official Noting
                  </div>
                  {event.notes}
                </div>
              )}

              {/* Duration Metrics */}
              <div className="flex items-center space-x-4 text-[11px] text-[#5F6368] font-mono pt-1">
                <span>
                  DURATION: <strong>{event.durationDays} days</strong>
                </span>
                {event.waitDays > 0 && (
                  <span>
                    QUEUE WAIT: <strong className={event.waitDays > 3 ? 'text-[#B72025]' : ''}>{event.waitDays} days</strong>
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
