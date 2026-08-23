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
    navy: 'border-[#CBD2DE] border-t-2 border-t-[#0B3558]',
    red: 'border-[#CBD2DE] border-l-4 border-l-[#B72025]',
    saffron: 'border-[#CBD2DE] border-l-4 border-l-[#E87511]',
    green: 'border-[#CBD2DE] border-l-4 border-l-[#15803D]',
  }[highlightBorder];

  return (
    <section
      className={`bg-white border rounded-[2px] ${borderHighlightClass} ${className} font-sans`}
    >
      {(title || headerAction) && (
        <div
          className={`px-4 py-2.5 bg-[#F8F9FA] border-b border-[#D9DDE3] flex flex-wrap items-center justify-between gap-2 ${headerClassName}`}
        >
          <div>
            {typeof title === 'string' ? (
              <h3 className="font-serif font-bold text-sm text-[#0B3558] tracking-tight uppercase">
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
        <div className="px-4 py-2 bg-[#F8F9FA] border-t border-[#D9DDE3] text-[11px] text-[#5F6368]">
          {footer}
        </div>
      )}
    </section>
  );
};
