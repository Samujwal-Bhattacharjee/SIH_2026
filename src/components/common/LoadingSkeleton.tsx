import React from 'react';

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 6,
}) => {
  return (
    <div className="border border-[#D9DDE3] rounded-[4px] bg-white overflow-hidden">
      <div className="h-10 bg-[#0B2A4A] animate-pulse" />
      <div className="divide-y divide-[#D9DDE3]">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="p-3.5 flex items-center space-x-4 animate-pulse">
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className="h-3.5 bg-gray-200 rounded-[2px]"
                style={{ width: `${Math.floor(60 + (c * 17) % 35)}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 bg-white border border-[#D9DDE3] rounded-[4px] space-y-3 animate-pulse"
        >
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-8 bg-gray-300 rounded w-1/2" />
          <div className="h-3 bg-gray-100 rounded w-2/3" />
        </div>
      ))}
    </div>
  );
};
