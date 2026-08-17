import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, ArrowRight, AlertCircle, Loader2, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('director.operations@goip.gov.in');
  const [password, setPassword] = useState('your-password-here');
  const [rememberSession, setRememberSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoSignIn = async () => {
    setEmail('director.operations@goip.gov.in');
    setPassword('your-password-here');
    setError(null);
    setSubmitting(true);
    try {
      await signIn('director.operations@goip.gov.in', 'your-password-here');
      navigate('/dashboard');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col justify-between p-6 sm:p-12 selection:bg-vermilion selection:text-white">
      {/* Top Technical Metadata Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border-hairline pb-4 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="w-6 h-6 bg-ink-900 flex items-center justify-center text-white font-mono text-xs font-bold text-vermilion">
            G
          </div>
          <div>
            <span className="font-mono text-xs font-bold text-ink-950 tracking-wider">
              GOIP // OPERATIONAL ACCESS GATEWAY
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4 font-mono text-3xs text-ink-500">
          <span>ZONE: AP-SOUTH-1</span>
          <span>SECURITY: LEVEL-3 RESTRICTED</span>
          <span className="flex items-center space-x-1 text-sageSuccess font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-sageSuccess animate-pulse" />
            <span>AUTHENTICATOR ONLINE</span>
          </span>
        </div>
      </div>

      {/* Main Login Content */}
      <div className="max-w-4xl mx-auto w-full my-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
        {/* Left: Editorial Technical Branding */}
        <div className="md:col-span-7 flex flex-col justify-between p-8 bg-surface border border-border-hairline shadow-subtle-1">
          <div className="space-y-6">
            <div className="font-mono text-3xs font-bold text-vermilion uppercase tracking-widest">
              GOVERNMENT OPERATIONS INTELLIGENCE PLATFORM
            </div>

            <h1 className="font-sans font-extrabold text-3xl sm:text-4xl text-ink-950 tracking-tight leading-none uppercase">
              WORKFLOW <br />
              INTELLIGENCE &amp; <br />
              DELAY PREDICTION
            </h1>

            <div className="w-12 h-0.5 bg-vermilion" />

            <p className="font-sans text-xs sm:text-sm text-ink-600 leading-relaxed max-w-md">
              Automated process mining, bottleneck attribution, statutory SLA forecasting, and what-if policy simulation for state administrative workflows.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-border-hairline grid grid-cols-2 gap-4 font-mono text-3xs text-ink-500">
            <div>
              <span className="text-ink-400 block uppercase">CORE DATASET</span>
              <span className="font-bold text-ink-900">10,482 REVENUE CASES</span>
            </div>
            <div>
              <span className="text-ink-400 block uppercase">MINING ENGINE</span>
              <span className="font-bold text-ink-900">PM4Py / ALPHA DISCOVERY</span>
            </div>
          </div>
        </div>

        {/* Right: Minimal Form */}
        <div className="md:col-span-5 flex flex-col justify-between p-8 bg-surface border border-border-hairline shadow-subtle-1">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <span className="font-mono text-3xs font-bold text-ink-400 uppercase tracking-wider">
                AUTHORIZATION
              </span>
              <h2 className="font-mono text-sm font-bold text-ink-950 uppercase tracking-tight">
                SECURE SYSTEM ACCESS
              </h2>
            </div>

            {error && (
              <div className="p-3 bg-vermilion-subtle border border-vermilion-border flex items-start space-x-2 text-vermilion font-mono text-3xs">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="block font-mono text-3xs text-ink-500 uppercase">
                OFFICIAL GOV EMAIL
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@gov.in"
                className="w-full px-3 py-2 bg-surface-subtle border border-border-hairline font-mono text-xs text-ink-950 focus:outline-none focus:border-ink-900 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-mono text-3xs text-ink-500 uppercase">
                SECURITY PASSPHRASE
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 bg-surface-subtle border border-border-hairline font-mono text-xs text-ink-950 focus:outline-none focus:border-ink-900 transition-colors"
              />
            </div>

            <div className="flex items-center justify-between font-mono text-3xs text-ink-500 pt-1">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberSession}
                  onChange={(e) => setRememberSession(e.target.checked)}
                  className="rounded-none border-border-hairline accent-ink-900"
                />
                <span>REMEMBER SESSION (24H)</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-ink-900 hover:bg-ink-800 text-white font-mono text-xs uppercase tracking-wider font-semibold flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>VERIFYING CREDENTIALS...</span>
                </>
              ) : (
                <>
                  <span>SIGN IN TO CONSOLE</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Sign In Button */}
          <div className="mt-6 pt-4 border-t border-border-hairline space-y-2">
            <button
              onClick={handleDemoSignIn}
              disabled={submitting}
              className="w-full py-1.5 bg-surface-subtle hover:bg-surface-hover border border-border-hairline text-ink-700 font-mono text-3xs uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-colors"
            >
              <KeyRound className="w-3 h-3 text-vermilion" />
              <span>QUICK DEMO LOGIN (DIRECTOR VERMA)</span>
            </button>
            <p className="font-mono text-3xs text-ink-400 text-center">
              PREPARED FOR SUPABASE AUTH REST DEPLOYMENT
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Technical Footer */}
      <div className="border-t border-border-hairline pt-4 flex flex-col sm:flex-row sm:items-center justify-between font-mono text-3xs text-ink-400 gap-2">
        <span>GOIP // GOVERNMENT OPERATIONS INTELLIGENCE PLATFORM</span>
        <span>CONFIDENTIAL &amp; PROPRIETARY • STATE OPERATIONS CELL</span>
      </div>
    </div>
  );
};
