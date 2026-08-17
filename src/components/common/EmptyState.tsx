import React from 'react';
import { Layers, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border-subtle bg-surface-subtle/30 rounded-sm">
      <div className="w-10 h-10 border border-border-hairline bg-surface flex items-center justify-center text-ink-500 mb-3">
        {icon || <Layers className="w-5 h-5" />}
      </div>
      <h4 className="font-sans font-semibold text-sm text-ink-900">{title}</h4>
      <p className="font-mono text-2xs text-ink-500 max-w-sm mt-1 mb-4">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-ink-900 hover:bg-ink-800 text-white font-mono text-2xs uppercase tracking-wider transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
};
