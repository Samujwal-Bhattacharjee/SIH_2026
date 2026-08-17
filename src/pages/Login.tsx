import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  User as UserIcon,
  RefreshCw,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { Emblem } from '../assets/Emblem';
import { useAuth } from '../context/AuthContext';
import { GovButton } from '../components/common/GovButton';
import { FormField, inputBaseClasses, inputErrorClasses } from '../components/common/FormField';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('director.operations@goip.gov.in');
  const [password, setPassword] = useState('your-password-here');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaCode, setCaptchaCode] = useState('8N4K9');
  const [error, setError] = useState<string | null>(null);
  const [hasCaptchaError, setHasCaptchaError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(code);
    setCaptchaInput('');
    setHasCaptchaError(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setHasCaptchaError(false);

    if (captchaInput.toUpperCase() !== captchaCode) {
      setError('Please enter the valid 5-character security code shown in the image to proceed.');
      setHasCaptchaError(true);
      generateCaptcha();
      return;
    }

    setSubmitting(true);
    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid officer credentials. Please verify your official employee ID and password.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoSignIn = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('your-password-here');
    setCaptchaInput(captchaCode);
    setError(null);
    setHasCaptchaError(false);
    setSubmitting(true);
    try {
      await signIn(demoEmail, 'your-password-here');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-between selection:bg-[#0B2A4A] selection:text-white overflow-hidden bg-gradient-to-b from-[#FFF5EB] via-[#FFFFFF] to-[#F0FDF4]">
      {/* Subtle Ambient India Tricolour Atmospheric Wash */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 80% 45% at 50% -10%, rgba(255, 140, 0, 0.12) 0%, rgba(255, 255, 255, 0) 70%),
            radial-gradient(ellipse 80% 45% at 50% 110%, rgba(21, 128, 61, 0.10) 0%, rgba(255, 255, 255, 0) 70%),
            linear-gradient(180deg, rgba(255, 153, 51, 0.04) 0%, rgba(255, 255, 255, 0) 35%, rgba(255, 255, 255, 0) 65%, rgba(19, 136, 8, 0.04) 100%)
          `,
        }}
      />

      {/* Ultra-faint Watermark Ashoka Chakra in Center Background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.035] z-0 select-none">
        <svg
          viewBox="0 0 200 200"
          className="w-[580px] h-[580px] text-[#0B2A4A]"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <circle cx="100" cy="100" r="92" strokeWidth="3" />
          <circle cx="100" cy="100" r="22" strokeWidth="2.5" fill="currentColor" fillOpacity="0.1" />
          <circle cx="100" cy="100" r="6" fill="currentColor" />
          {Array.from({ length: 24 }).map((_, i) => {
            const angle = (i * 360) / 24;
            return (
              <g key={i} transform={`rotate(${angle} 100 100)`}>
                <line x1="100" y1="100" x2="100" y2="8" strokeWidth="1.6" />
                <circle cx="100" cy="18" r="1.5" fill="currentColor" />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Top Ministry Header Strip */}
      <div className="w-full bg-[#071A2E] text-white py-1.5 px-4 text-center text-xs select-none z-10 shadow-sm">
        <div className="gov-tricolour-bar mb-1.5" />
        <div className="flex items-center justify-center space-x-2 text-[11px] sm:text-xs">
          <span className="font-serif font-bold tracking-wide">भारत सरकार • Government of India</span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-300">Department of Administrative Reforms &amp; Public Grievances</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto w-full my-auto px-4 py-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch relative z-10">
        {/* Left Column: Institutional Branding */}
        <div className="md:col-span-6 bg-white/95 backdrop-blur-sm border border-[#D9DDE3] rounded-[4px] p-6 sm:p-8 flex flex-col justify-between shadow-sm relative overflow-hidden">
          {/* Subtle Top Tricolour Accent Line on Left Card */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#138808]" />

          <div className="space-y-6">
            <div className="flex items-center space-x-3.5 pt-1">
              <Emblem size={56} />
              <div>
                <h2 className="font-serif font-extrabold text-lg sm:text-xl text-[#0B2A4A] leading-tight">
                  Government of India
                </h2>
                <p className="text-xs text-[#5F6368] font-medium">
                  File Tracking &amp; Administrative Intelligence System
                </p>
              </div>
            </div>

            <div className="h-0.5 w-16 bg-[#FF9933]" />

            <div className="space-y-3">
              <h1 className="font-serif font-bold text-xl sm:text-2xl text-[#0B2A4A] leading-snug">
                Official Administrative Workflow &amp; e-File Gateway
              </h1>
              <p className="text-xs text-[#5F6368] leading-relaxed">
                Secure internal portal for tracking government file movement, OCR document processing, statutory SLA compliance monitoring, and bottleneck delay intelligence across state departments.
              </p>
            </div>

            {/* Official Feature Points */}
            <div className="space-y-2.5 text-xs text-[#202124] pt-2">
              <div className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#15803D] flex-shrink-0 mt-0.5" />
                <span>Statutory SLA Compliance &amp; Delay Risk Intelligence</span>
              </div>
              <div className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#15803D] flex-shrink-0 mt-0.5" />
                <span>Optical Character Recognition (OCR) &amp; Metadata Extraction</span>
              </div>
              <div className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#15803D] flex-shrink-0 mt-0.5" />
                <span>Complete Official Movement Register &amp; Immutable Audit Trail</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-[#D9DDE3] flex items-center justify-between text-[11px] text-[#5F6368]">
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#15803D]" />
              <span>National Informatics Centre (NIC)</span>
            </div>
            <span className="font-mono text-[#0B2A4A] font-bold">SEC-VPN: ACTIVE</span>
          </div>
        </div>

        {/* Right Column: Government Official Login Form */}
        <div className="md:col-span-6 bg-white/95 backdrop-blur-sm border-2 border-[#0B2A4A] rounded-[4px] p-6 sm:p-8 flex flex-col justify-between shadow-md relative overflow-hidden">
          {/* Top Tricolour Header Band on Form Card */}
          <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#138808]" />

          <div>
            <div className="border-b border-[#D9DDE3] pb-3 mb-5 pt-1">
              <div className="flex items-center space-x-2 text-[#0B2A4A] font-serif font-bold text-lg">
                <Lock className="w-5 h-5 text-[#0B2A4A]" />
                <span>Official Officer Sign-In</span>
              </div>
              <p className="text-xs text-[#5F6368] mt-0.5">
                Enter your authorized employee identifier and password.
              </p>
            </div>

            {/* Official Indian Government Error Box (Clean, flat, non-AI) */}
            {error && (
              <div className="p-3 mb-4 bg-[#FFF8F8] border border-[#C62828] rounded-[2px] text-xs text-[#C62828] flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-[#C62828] flex-shrink-0 mt-0.5" />
                <div className="leading-snug">
                  <strong className="font-bold block mb-0.5">Authentication Alert:</strong>
                  <span>{error}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField label="Officer ID / Official Email" required>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. director.operations@goip.gov.in"
                    className={`${inputBaseClasses} pl-9`}
                    required
                  />
                </div>
              </FormField>

              <FormField label="Secret Password" required>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className={`${inputBaseClasses} pl-9`}
                    required
                  />
                </div>
              </FormField>

              {/* Security Captcha Box */}
              <FormField label="Security Verification (Captcha)" required>
                <div className="flex items-center space-x-2">
                  <div className="px-4 py-2 bg-[#0B2A4A] text-white font-mono font-bold text-base tracking-[0.3em] rounded-[3px] select-none border border-[#071A2E] shadow-inner">
                    {captchaCode}
                  </div>
                  <button
                    type="button"
                    onClick={generateCaptcha}
                    title="Reload Captcha"
                    className="p-2 border border-[#CBD2DE] rounded-[3px] hover:bg-gray-100 text-[#5F6368] transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    maxLength={5}
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                    placeholder="Enter code"
                    className={`${hasCaptchaError ? inputErrorClasses : inputBaseClasses} uppercase font-mono font-bold`}
                    required
                  />
                </div>
              </FormField>

              <div className="pt-2">
                <GovButton
                  variant="primary"
                  size="lg"
                  loading={submitting}
                  type="submit"
                  className="w-full"
                  icon={<ArrowRight className="w-4 h-4" />}
                  iconPosition="right"
                >
                  Access Government Portal
                </GovButton>
              </div>
            </form>

            {/* Quick Demo Login Presets */}
            <div className="mt-5 pt-4 border-t border-[#D9DDE3] space-y-2">
              <span className="text-[11px] font-bold text-[#5F6368] uppercase tracking-wider block">
                Quick Evaluator Access (Demo Mode)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleDemoSignIn('director.operations@goip.gov.in')
                  }
                  className="p-2 text-left bg-[#F0F5FA] hover:bg-[#E6EEF5] border border-[#CBD2DE] rounded-[3px] text-xs transition-colors cursor-pointer"
                >
                  <strong className="block text-[#0B2A4A]">Joint Secretary</strong>
                  <span className="text-[10px] text-[#5F6368]">Operations Director</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleDemoSignIn('krmohan.rev@goip.gov.in')
                  }
                  className="p-2 text-left bg-[#F0F5FA] hover:bg-[#E6EEF5] border border-[#CBD2DE] rounded-[3px] text-xs transition-colors cursor-pointer"
                >
                  <strong className="block text-[#0B2A4A]">Asst. Commissioner</strong>
                  <span className="text-[10px] text-[#5F6368]">Land Revenue Desk</span>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-200 text-[11px] text-gray-500 text-center">
            Unauthorized access to this government portal is punishable under the IT Act 2000.
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full bg-[#040E1A] text-gray-400 py-3 text-center text-xs select-none relative z-10 border-t border-[#123B63]/30">
        © 2026 Government of India • National Informatics Centre (NIC) • Demonstration &amp; Prototype Gateway
      </div>
    </div>
  );
};
