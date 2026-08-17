import React from 'react';

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 6, cols = 6 }) => {
  return (
    <div className="w-full animate-pulse border border-border-hairline bg-surface">
      <div className="h-10 bg-surface-subtle border-b border-border-hairline flex items-center px-4 space-x-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-3 bg-ink-200 rounded-sm flex-1" />
        ))}
      </div>
      <div className="divide-y divide-border-hairline">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="h-12 px-4 flex items-center space-x-4">
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className="h-3.5 bg-ink-100 rounded-sm"
                style={{ width: `${Math.floor(40 + (c * 15) % 50)}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const GraphSkeleton: React.FC = () => {
  return (
    <div className="w-full h-96 bg-surface border border-border-hairline flex flex-col items-center justify-center p-8 animate-pulse tech-grid-bg">
      <div className="flex items-center space-x-8">
        <div className="w-28 h-20 bg-ink-100 border border-border-hairline rounded-sm" />
        <div className="w-12 h-0.5 bg-ink-300" />
        <div className="w-28 h-20 bg-ink-100 border border-border-hairline rounded-sm" />
        <div className="w-12 h-0.5 bg-ink-300" />
        <div className="w-32 h-24 bg-vermilion-subtle border border-vermilion-border rounded-sm" />
        <div className="w-12 h-0.5 bg-ink-300" />
        <div className="w-28 h-20 bg-ink-100 border border-border-hairline rounded-sm" />
      </div>
      <p className="font-mono text-3xs text-ink-500 uppercase tracking-widest mt-6">
        MINING WORKFLOW GRAPH TOPOLOGY...
      </p>
    </div>
  );
};
