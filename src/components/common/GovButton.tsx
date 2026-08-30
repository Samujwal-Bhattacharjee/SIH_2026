import React from 'react';
import { Loader2 } from 'lucide-react';

interface GovButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const GovButton: React.FC<GovButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  className = '',
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-sans font-semibold transition-colors border rounded-[2px] select-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#0B2A4A]';

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs gap-1.5 h-7.5',
    md: 'px-3.5 py-1.5 text-xs gap-2 h-9',
    lg: 'px-5 py-2 text-sm gap-2.5 h-10.5 font-bold',
  }[size];

  const variantClasses = {
    primary:
      'bg-[#0B2A4A] hover:bg-[#123B63] active:bg-[#071A2E] text-white border-[#0B2A4A] shadow-xs',
    secondary:
      'bg-white hover:bg-[#F0F2F5] active:bg-[#E2E6EC] text-[#1E293B] border-[#D9DDE3] shadow-xs',
    danger:
      'bg-[#B72025] hover:bg-[#991B1B] active:bg-[#7F1D1D] text-white border-[#B72025] shadow-xs',
    success:
      'bg-[#15803D] hover:bg-[#166534] active:bg-[#14532D] text-white border-[#15803D] shadow-xs',
    ghost:
      'bg-transparent hover:bg-[#F0F2F5] text-[#1E293B] border-transparent',
  }[variant];

  return (
    <button
      disabled={disabled || loading}
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>}
          {children}
          {icon && iconPosition === 'right' && <span className="flex-shrink-0">{icon}</span>}
        </>
      )}
    </button>
  );
};
