import React from 'react';
import { CaseEvent } from '../../types';
import { Clock, AlertTriangle, RefreshCw, CheckCircle2, UserCheck } from 'lucide-react';

interface CaseTimelineProps {
  events: CaseEvent[];
}

export const CaseTimeline: React.FC<CaseTimelineProps> = ({ events }) => {
  if (!events || events.length === 0) {
    return (
      <div className="p-6 text-center font-mono text-2xs text-ink-500">
        NO EVENT LOGS AVAILABLE FOR THIS CASE FILE.
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-border-hairline">
      {events.map((event, index) => {
        const isCurrent = event.status === 'IN_PROGRESS';
        const isRework = event.isRework || event.status === 'REWORK_TRIGGERED';
        const isDelayed = event.isDelayed;

        return (
          <div key={event.id || index} className="relative group">
            {/* Timeline Node Icon / Dot */}
            <div
              className={`absolute -left-6 top-1 w-5 h-5 flex items-center justify-center border ${
                isDelayed
                  ? 'bg-vermilion text-white border-vermilion'
                  : isRework
                  ? 'bg-amberRisk text-white border-amberRisk'
                  : isCurrent
                  ? 'bg-ink-900 text-white border-ink-900 animate-pulse'
                  : 'bg-surface text-ink-700 border-border-hairline'
              }`}
            >
              {isDelayed ? (
                <AlertTriangle className="w-2.5 h-2.5" />
              ) : isRework ? (
                <RefreshCw className="w-2.5 h-2.5" />
              ) : isCurrent ? (
                <span className="w-1.5 h-1.5 bg-white rounded-full" />
              ) : (
                <CheckCircle2 className="w-2.5 h-2.5 text-sageSuccess" />
              )}
            </div>

            {/* Event Content Box */}
            <div
              className={`p-4 border transition-all ${
                isCurrent
                  ? 'bg-surface border-ink-900 shadow-subtle-2'
                  : isDelayed
                  ? 'bg-vermilion-subtle/30 border-vermilion-border'
                  : 'bg-surface border-border-hairline'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-border-hairline">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-ink-950 uppercase tracking-tight">
                    {event.stage}
                  </span>
                  {isCurrent && (
                    <span className="font-mono text-3xs font-bold uppercase bg-ink-900 text-white px-1.5 py-0.2">
                      CURRENT STAGE
                    </span>
                  )}
                  {isRework && (
                    <span className="font-mono text-3xs font-semibold uppercase bg-amberRisk-subtle text-amberRisk border border-amberRisk-border px-1">
                      REWORK LOOP
                    </span>
                  )}
                  {isDelayed && (
                    <span className="font-mono text-3xs font-semibold uppercase bg-vermilion-subtle text-vermilion border border-vermilion-border px-1">
                      DELAY WARNING
                    </span>
                  )}
                </div>

                <span className="font-mono text-3xs text-ink-500">
                  {new Date(event.timestamp).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              {/* Event Metrics & Details */}
              <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-3xs">
                <div className="flex items-center space-x-1.5 text-ink-600">
                  <Clock className="w-3 h-3 text-ink-400" />
                  <span className="text-ink-400">ACTIVE DURATION:</span>
                  <span className="font-bold text-ink-900">{event.durationDays}d</span>
                </div>

                <div className="flex items-center space-x-1.5 text-ink-600">
                  <span className="text-ink-400">QUEUE WAIT:</span>
                  <span className={`font-bold ${event.waitDays > 3 ? 'text-vermilion' : 'text-ink-900'}`}>
                    {event.waitDays}d
                  </span>
                </div>

                <div className="flex items-center space-x-1.5 text-ink-600 truncate">
                  <UserCheck className="w-3 h-3 text-ink-400" />
                  <span className="text-ink-400">OFFICER:</span>
                  <span className="font-medium text-ink-900 truncate">{event.officer}</span>
                </div>
              </div>

              {/* Officer Scrutiny Notes */}
              {event.notes && (
                <div className="mt-2.5 p-2 bg-surface-subtle/60 border border-border-hairline text-xs font-sans text-ink-800">
                  <span className="font-mono text-3xs text-ink-500 font-semibold block mb-0.5">
                    SCRUTINY NOTE // LOGGED ACTION:
                  </span>
                  {event.notes}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
