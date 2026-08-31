import React from 'react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  error,
  helperText,
  children,
  className = '',
  id,
}) => {
  return (
    <div className={`space-y-1 ${className}`}>
      <label
        htmlFor={id}
        className="block font-sans text-xs font-semibold text-[#202124] select-none"
      >
        {label}
        {required && <span className="text-[#C62828] ml-1 font-bold">*</span>}
      </label>

      {children}

      {error ? (
        <p className="text-xs text-[#C62828] font-normal mt-1">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-[#5F6368] mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
};

export const inputBaseClasses =
  'w-full px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-[2px] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#0B2A4A] focus:ring-1 focus:ring-[#0B2A4A] transition-colors disabled:bg-[#F1F5F9] disabled:cursor-not-allowed';

export const inputErrorClasses =
  'w-full px-3 py-1.5 text-xs bg-white border border-[#B72025] rounded-[2px] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#B72025] focus:ring-1 focus:ring-[#B72025] transition-colors disabled:bg-[#F1F5F9] disabled:cursor-not-allowed';

export const selectBaseClasses =
  'w-full px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-[2px] text-[#0F172A] focus:outline-none focus:border-[#0B2A4A] focus:ring-1 focus:ring-[#0B2A4A] transition-colors disabled:bg-[#F1F5F9] disabled:cursor-not-allowed';

export const textareaBaseClasses =
  'w-full px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-[2px] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#0B2A4A] focus:ring-1 focus:ring-[#0B2A4A] transition-colors disabled:bg-[#F1F5F9] disabled:cursor-not-allowed';
