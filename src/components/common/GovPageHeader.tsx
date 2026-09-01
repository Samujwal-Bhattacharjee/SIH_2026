import React from 'react';

interface GovPageHeaderProps {
  title: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  tag?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const GovPageHeader: React.FC<GovPageHeaderProps> = ({
  title,
  subtitle,
  tag,
  badge,
  actions,
  className = '',
}) => {
  return (
    <div
      className={`gov-glass-card rounded-xl p-4 sm:p-5 border border-white/75 shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 font-sans ${className}`}
    >
      {/* Top Tricolour Subtle Sovereign Glow Line */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#138808]" />

      <div className="space-y-1">
        {(tag || badge) && (
          <div className="flex items-center gap-2 mb-1">
            {tag && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-[#0B2A4A]/10 text-[#0B2A4A] border border-[#0B2A4A]/20">
                {tag}
              </span>
            )}
            {badge}
          </div>
        )}

        <h1 className="font-serif font-extrabold text-xl sm:text-2xl text-[#0B2A4A] tracking-tight leading-snug">
          {title}
        </h1>

        {subtitle && (
          <p className="text-xs sm:text-sm text-[#475569] font-medium leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center flex-wrap gap-2.5 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};

export default GovPageHeader;
