import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface GovModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string | React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | 'full';
}

export const GovModal: React.FC<GovModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    full: 'max-w-[95vw]',
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4">
      <div
        className={`bg-white border-2 border-[#0B2A4A] rounded-[4px] shadow-2xl w-full ${maxWidthClasses} flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150`}
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-[#0B2A4A] text-white flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-base tracking-tight leading-tight">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-gray-300 mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 hover:bg-white/20 rounded-[2px] transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1">{children}</div>

        {/* Modal Footer */}
        {footer && (
          <div className="px-5 py-3 bg-[#F8F9FA] border-t border-[#D9DDE3] flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
