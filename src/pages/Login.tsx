import React, { useState, useEffect, useCallback } from 'react';
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
  Loader2,
  Building,
  UserPlus,
} from 'lucide-react';
import { Emblem } from '../assets/Emblem';
import { useAuth } from '../context/AuthContext';
import { GovButton } from '../components/common/GovButton';
import { FormField, inputBaseClasses, inputErrorClasses } from '../components/common/FormField';
import { PetroleumBackground } from '../components/background/PetroleumBackground';
import { usePetroleumBackground } from '../context/BackgroundContext';

// Helper to generate a randomized 5-character alphanumeric captcha
const getRandomCaptcha = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const Login: React.FC = () => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('director.operations@goip.gov.in');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('General Administration');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaCode, setCaptchaCode] = useState<string>(() => getRandomCaptcha());
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasCaptchaError, setHasCaptchaError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  
  const { signIn, signUp, signInWithGoogle, isSupabaseActive } = useAuth();
  const { isPeekMode, glassIntensity } = usePetroleumBackground();
  const navigate = useNavigate();

  const generateCaptcha = useCallback(() => {
    const newCode = getRandomCaptcha();
    setCaptchaCode(newCode);
    setCaptchaInput('');
    setHasCaptchaError(false);
  }, []);

  // Regenerate dynamic captcha on every fresh mount / login screen visit
  useEffect(() => {
    generateCaptcha();
  }, [generateCaptcha]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setHasCaptchaError(false);

    if (captchaInput.trim().toUpperCase() !== captchaCode.toUpperCase()) {
      setError('Please enter the valid 5-character security code shown in the image to proceed.');
      setHasCaptchaError(true);
      generateCaptcha();
      return;
    }

    setSubmitting(true);
    try {
      if (authMode === 'register') {
        await signUp(email, password, name, department, 'Section Officer', 'SECTION_OFFICER');
        setSuccessMessage('Registration successful! Redirecting to government portal...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 600);
      } else {
        await signIn(email, password);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(
        err.message ||
          (authMode === 'register'
            ? 'Registration failed. Please verify the information entered.'
            : 'Invalid officer credentials. Please verify your official employee ID and password.')
      );
      generateCaptcha();
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleSubmitting(true);
    try {
      await signInWithGoogle();
      // In mock mode it resolves immediately and updates state; in real OAuth it redirects
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Google Authentication failed. Please check your Supabase OAuth configuration.');
      setGoogleSubmitting(false);
      generateCaptcha();
    }
  };

  const handleDemoSignIn = async (demoEmail: string) => {
    setAuthMode('login');
    setEmail(demoEmail);
    const demoPassword = (import.meta as any).env?.VITE_DEMO_PASSWORD || 'GovOfficer@2026';
    setPassword(demoPassword);
    setCaptchaInput(captchaCode);
    setError(null);
    setHasCaptchaError(false);
    setSubmitting(true);
    try {
      await signIn(demoEmail, demoPassword);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
      generateCaptcha();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      data-glass={glassIntensity}
      className={`min-h-screen relative flex flex-col justify-between selection:bg-[#0B2A4A] selection:text-white overflow-hidden font-sans ${
        isPeekMode ? 'peek-active' : ''
      }`}
    >
      {/* Dynamic Petroleum Industrial Canvas Background */}
      <PetroleumBackground />

      {/* Top Ministry Header Strip (Frosted Glass) */}
      <div className={`w-full bg-[#040E1A]/85 backdrop-blur-md text-white py-1.5 px-4 text-center text-xs select-none z-10 shadow-md border-b border-white/10 transition-opacity duration-300 ${isPeekMode ? 'opacity-15 pointer-events-none' : 'opacity-100'}`}>
        <div className="gov-tricolour-bar mb-1.5" />
        <div className="flex items-center justify-center space-x-2 text-[11px] sm:text-xs">
          <span className="font-serif font-bold tracking-wide">भारत सरकार • Government of India</span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-300">Government Procurement • Prototype / Demonstration • SIH26100</span>
        </div>
      </div>

      {/* Main Container */}
      <div className={`max-w-5xl mx-auto w-full my-auto px-4 py-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch relative z-10 font-sans transition-all duration-300 ${isPeekMode ? 'opacity-10 pointer-events-none' : 'opacity-100'}`}>
        {/* Left Column: Institutional Branding (Frosted Translucent Glass Card) */}
        <div className="md:col-span-6 gov-glass-card rounded-xl p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden shadow-2xl">
          {/* Subtle Top Tricolour Accent Line on Left Card */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#138808]" />

          <div className="space-y-6">
            <div className="flex items-center space-x-3.5 pt-1">
              <Emblem size={56} />
              <div>
                <h2 className="font-serif font-extrabold text-lg sm:text-xl text-[#0B3558] leading-tight">
                  Government of India
                </h2>
                <p className="text-xs text-[#5F6368] font-medium">
                  CPCL • Ministry of Petroleum & Natural Gas • SIH26100
                </p>
              </div>
            </div>

            <div className="h-0.5 w-16 bg-[#FF9933]" />

            <div className="space-y-3">
              <h1 className="font-serif font-bold text-xl sm:text-2xl text-[#0B3558] leading-snug">
                Government Procurement Intelligence Platform
              </h1>
              <p className="text-xs text-[#5F6368] leading-relaxed">
                An evidence-first procurement intelligence platform for verifying bidder compliance and identifying explainable procurement-integrity risks in government procurement.
              </p>
            </div>

            {/* Official Feature Points */}
            <div className="space-y-2.5 text-xs text-[#202124] pt-2">
              <div className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#15803D] flex-shrink-0 mt-0.5" />
                <span>Evidence-Backed Bid Compliance Verification &amp; Risk Scoring</span>
              </div>
              <div className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#15803D] flex-shrink-0 mt-0.5" />
                <span>Optical Character Recognition (OCR) &amp; Certificate Extraction</span>
              </div>
              <div className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#15803D] flex-shrink-0 mt-0.5" />
                <span>Secure Evidence &amp; Audit Infrastructure</span>
              </div>
              <div className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#15803D] flex-shrink-0 mt-0.5" />
                <span>Tamper-Evident Procurement Audit Trail</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-[#D9DDE3] flex items-center justify-between text-[11px] text-[#5F6368]">
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#15803D]" />
              <span>National Informatics Centre (NIC)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`inline-block w-2 h-2 rounded-full ${isSupabaseActive ? 'bg-green-500 animate-pulse' : 'bg-blue-400'}`} />
              <span className="font-mono text-[#0B2A4A] font-bold text-[10px]">
                {isSupabaseActive ? 'SECURE AUTH: CONNECTED' : 'SECURE AUTH: SANDBOX'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Government Official Login / Register Form (Frosted Translucent Glass Card) */}
        <div className="md:col-span-6 gov-glass-card rounded-xl p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden shadow-2xl">
          {/* Top Tricolour Header Band on Form Card */}
          <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#138808]" />

          <div>
            {/* Mode Switcher Tabs */}
            <div className="flex border-b border-[#D9DDE3] mb-4">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setError(null);
                  setSuccessMessage(null);
                  generateCaptcha();
                }}
                className={`flex-1 pb-2.5 text-xs sm:text-sm font-serif font-bold text-center border-b-2 transition-colors cursor-pointer ${
                  authMode === 'login'
                    ? 'border-[#0B2A4A] text-[#0B2A4A]'
                    : 'border-transparent text-[#5F6368] hover:text-[#0B2A4A]'
                }`}
              >
                <Lock className="w-3.5 h-3.5 inline mr-1.5" />
                Officer Sign-In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setError(null);
                  setSuccessMessage(null);
                  generateCaptcha();
                }}
                className={`flex-1 pb-2.5 text-xs sm:text-sm font-serif font-bold text-center border-b-2 transition-colors cursor-pointer ${
                  authMode === 'register'
                    ? 'border-[#0B2A4A] text-[#0B2A4A]'
                    : 'border-transparent text-[#5F6368] hover:text-[#0B2A4A]'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5 inline mr-1.5" />
                New Registration
              </button>
            </div>

            {/* Subheading */}
            <p className="text-xs text-[#5F6368] mb-3">
              {authMode === 'login'
                ? 'Sign in with your authorized official email and password.'
                : 'Create an officer credentials account for this government portal.'}
            </p>

            {/* Official Indian Government Error Box */}
            {error && (
              <div className="p-3 mb-3 bg-[#FFF8F8] border border-[#C62828] rounded-[2px] text-xs text-[#C62828] flex items-start space-x-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-[#C62828] flex-shrink-0 mt-0.5" />
                <div className="leading-snug">
                  <strong className="font-bold block mb-0.5">Authentication Alert:</strong>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Success Box */}
            {successMessage && (
              <div className="p-3 mb-3 bg-[#F0FDF4] border border-[#15803D] rounded-[2px] text-xs text-[#15803D] flex items-start space-x-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-[#15803D] flex-shrink-0 mt-0.5" />
                <div className="leading-snug">
                  <strong className="font-bold block mb-0.5">Success:</strong>
                  <span>{successMessage}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Optional Registration Fields */}
              {authMode === 'register' && (
                <>
                  <FormField label="Full Officer Name" required>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Smt. Anita Deshmukh"
                        className={`${inputBaseClasses} pl-9`}
                        required
                      />
                    </div>
                  </FormField>

                  <FormField label="Assigned Department" required>
                    <div className="relative">
                      <Building className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className={`${inputBaseClasses} pl-9`}
                        required
                      >
                        <option value="Department of Administrative Reforms">Department of Administrative Reforms</option>
                        <option value="Ministry of Electronics & Information Technology">Ministry of Electronics & IT</option>
                        <option value="Department of Telecommunications">Department of Telecommunications</option>
                        <option value="Department of Personnel & Training">Department of Personnel & Training</option>
                        <option value="Department of Expenditure">Department of Expenditure</option>
                        <option value="General Administration">General Administration</option>
                      </select>
                    </div>
                  </FormField>
                </>
              )}

              {/* 1. Officer Email */}
              <FormField label="Officer ID / Official Email" required>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. director.operations@goip.gov.in"
                    className={`${inputBaseClasses} pl-9`}
                    required
                  />
                </div>
              </FormField>

              {/* 2. Secret Password */}
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

              {/* 3. Google OAuth Login Button (In Login Mode, below Email & Password, above Captcha) */}
              {authMode === 'login' && (
                <div className="pt-0.5 pb-0.5">
                  <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[#D9DDE3]" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase">
                      <span className="bg-white px-2 text-[#5F6368] font-bold tracking-wider">
                        Or Sign In with Google SSO
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    id="google-signin-button"
                    onClick={handleGoogleSignIn}
                    disabled={googleSubmitting || submitting}
                    className="w-full flex items-center justify-center space-x-3 py-2 px-4 bg-white hover:bg-[#F8FAFC] text-[#1E293B] border-2 border-[#CBD2DE] hover:border-[#94A3B8] rounded-[4px] font-medium text-xs shadow-sm transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed group cursor-pointer"
                  >
                    {googleSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 text-[#0B2A4A] animate-spin" />
                        <span>Connecting to Government OAuth...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                        <span className="font-semibold text-[#0F172A] group-hover:text-[#0B2A4A]">
                          Sign in with Google (Government SSO)
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* 4. Security Captcha Box (Dynamic & Randomized) */}
              <FormField label="Security Verification (Captcha)" required>
                <div className="flex items-center space-x-2">
                  <div
                    className="px-4 py-2 bg-[#0B2A4A] text-white font-mono font-bold text-base tracking-[0.35em] rounded-[3px] select-none border border-[#071A2E] shadow-inner"
                    style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.4)' }}
                    title="Security Verification Code"
                  >
                    {captchaCode}
                  </div>
                  <button
                    type="button"
                    onClick={generateCaptcha}
                    title="Generate New Security Code"
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

              {/* 5. Submit Button */}
              <div className="pt-1">
                <GovButton
                  variant="primary"
                  size="lg"
                  loading={submitting}
                  type="submit"
                  className="w-full"
                  icon={<ArrowRight className="w-4 h-4" />}
                  iconPosition="right"
                >
                  {authMode === 'register' ? 'Register Officer Account' : 'Access Government Portal'}
                </GovButton>
              </div>
            </form>

            {/* Quick Demo Login Presets */}
            {authMode === 'login' && (
              <div className="mt-3 pt-3 border-t border-[#D9DDE3] space-y-1.5">
                <span className="text-[10px] font-bold text-[#5F6368] uppercase tracking-wider block">
                  Quick Evaluator Access (Preset Officers)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDemoSignIn('director.operations@goip.gov.in')}
                    className="p-2 text-left bg-[#F0F5FA] hover:bg-[#E6EEF5] border border-[#CBD2DE] rounded-[3px] text-xs transition-colors cursor-pointer"
                  >
                    <strong className="block text-[#0B2A4A] text-[11px]">Joint Secretary</strong>
                    <span className="text-[10px] text-[#5F6368]">Operations Director</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDemoSignIn('krmohan.rev@goip.gov.in')}
                    className="p-2 text-left bg-[#F0F5FA] hover:bg-[#E6EEF5] border border-[#CBD2DE] rounded-[3px] text-xs transition-colors cursor-pointer"
                  >
                    <strong className="block text-[#0B2A4A] text-[11px]">Deputy Secretary</strong>
                    <span className="text-[10px] text-[#5F6368]">Technical Evaluation Desk</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 pt-2 border-t border-gray-200 text-[11px] text-gray-500 text-center">
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
