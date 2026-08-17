import React from 'react';
import { FileQuestion, RefreshCw } from 'lucide-react';
import { GovButton } from './GovButton';

interface EmptyStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Records Found',
  message = 'No files or document records match the active search or department filter.',
  actionLabel,
  onAction,
  icon,
  className = '',
}) => {
  return (
    <div
      className={`p-8 bg-white border border-[#D9DDE3] rounded-[4px] text-center space-y-3 max-w-md mx-auto my-6 ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-[#F0F5FA] border border-[#CBD2DE] flex items-center justify-center mx-auto text-[#0B2A4A]">
        {icon || <FileQuestion className="w-6 h-6" />}
      </div>

      <h4 className="font-serif font-bold text-base text-[#202124]">
        {title}
      </h4>

      <p className="text-xs text-[#5F6368] leading-relaxed">
        {message}
      </p>

      {actionLabel && onAction && (
        <div className="pt-2">
          <GovButton
            variant="secondary"
            size="sm"
            onClick={onAction}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            {actionLabel}
          </GovButton>
        </div>
      )}
    </div>
  );
};
