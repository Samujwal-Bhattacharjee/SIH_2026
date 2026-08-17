import React from 'react';

interface TechnicalCardProps {
  children: React.ReactNode;
  headerIndex?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const TechnicalCard: React.FC<TechnicalCardProps> = ({
  children,
  headerIndex,
  title,
  subtitle,
  action,
  className = '',
  noPadding = false,
}) => {
  return (
    <div className={`bg-surface border border-border-hairline shadow-subtle-1 relative ${className}`}>
      {(title || headerIndex || action) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-hairline bg-surface">
          <div className="flex items-center space-x-2.5">
            {headerIndex && (
              <span className="font-mono text-3xs font-semibold text-ink-500 bg-surface-subtle px-1.5 py-0.5 border border-border-hairline">
                {headerIndex}
              </span>
            )}
            <div>
              {title && <h3 className="font-sans font-semibold text-sm text-ink-900 tracking-tight">{title}</h3>}
              {subtitle && <p className="font-mono text-3xs text-ink-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="flex items-center space-x-2">{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-4'}>{children}</div>
    </div>
  );
};
