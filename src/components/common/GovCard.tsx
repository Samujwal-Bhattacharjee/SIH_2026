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
  highlightBorder?: 'none' | 'navy' | 'red' | 'saffron' | 'green';
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
    none: 'border-[#D9DDE3]',
    navy: 'border-[#D9DDE3] border-t-4 border-t-[#0B2A4A]',
    red: 'border-[#D9DDE3] border-t-4 border-t-[#B72025]',
    saffron: 'border-[#D9DDE3] border-t-4 border-t-[#D97706]',
    green: 'border-[#D9DDE3] border-t-4 border-t-[#15803D]',
  }[highlightBorder];

  return (
    <div
      className={`bg-white border rounded-[4px] shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] overflow-hidden ${borderHighlightClass} ${className}`}
    >
      {(title || headerAction) && (
        <div
          className={`px-4 py-3 bg-[#F8F9FA] border-b border-[#D9DDE3] flex flex-wrap items-center justify-between gap-2 ${headerClassName}`}
        >
          <div>
            {typeof title === 'string' ? (
              <h3 className="font-serif font-bold text-base text-[#0B2A4A] tracking-tight">
                {title}
              </h3>
            ) : (
              title
            )}
            {subtitle && (
              <p className="text-xs text-[#5F6368] mt-0.5">{subtitle}</p>
            )}
          </div>
          {headerAction && <div className="flex items-center gap-2">{headerAction}</div>}
        </div>
      )}

      <div className={noPadding ? bodyClassName : `p-4 ${bodyClassName}`}>
        {children}
      </div>

      {footer && (
        <div className="px-4 py-2.5 bg-[#F8F9FA] border-t border-[#D9DDE3] text-xs text-[#5F6368]">
          {footer}
        </div>
      )}
    </div>
  );
};
