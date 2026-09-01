import React from 'react';

interface GovCardProps {
  title?: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  highlightBorder?: 'none' | 'purple' | 'navy' | 'red' | 'saffron' | 'green';
  noPadding?: boolean;
}

export const GovCard: React.FC<GovCardProps> = ({
  title,
  subtitle,
  headerAction,
  children,
  footer,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  highlightBorder = 'none',
  noPadding = false,
}) => {
  const borderHighlightClass = {
    none: 'border-white/60',
    purple: 'border-white/60 border-t-3 border-t-[#4A154B]',
    navy: 'border-white/60 border-t-3 border-t-[#0B2A4A]',
    red: 'border-white/60 border-l-4 border-l-[#B72025]',
    saffron: 'border-white/60 border-l-4 border-l-[#D97706]',
    green: 'border-white/60 border-l-4 border-l-[#15803D]',
  }[highlightBorder];

  return (
    <section
      className={`gov-glass-card rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ${borderHighlightClass} ${className} font-sans overflow-hidden`}
    >
      {(title || headerAction) && (
        <div
          className={`px-4 py-3 bg-white/65 backdrop-blur-sm border-b border-white/40 flex flex-wrap items-center justify-between gap-2 ${headerClassName}`}
        >
          <div>
            {typeof title === 'string' ? (
              <h3 className="font-serif font-bold text-sm text-[#0B2A4A] tracking-tight uppercase">
                {title}
              </h3>
            ) : (
              title
            )}
            {subtitle && (
              <p className="text-[11px] text-[#5F6368] mt-0.5">{subtitle}</p>
            )}
          </div>
          {headerAction && <div className="flex items-center gap-2">{headerAction}</div>}
        </div>
      )}

      <div className={noPadding ? bodyClassName : `p-4 ${bodyClassName}`}>
        {children}
      </div>

      {footer && (
        <div className="px-4 py-2.5 bg-white/50 backdrop-blur-xs border-t border-white/40 text-[11px] text-[#5F6368]">
          {footer}
        </div>
      )}
    </section>
  );
};
