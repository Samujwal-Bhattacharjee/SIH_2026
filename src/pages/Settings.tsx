import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Server,
  Database,
  Cpu,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Code2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isUsingMockApi } from '../services/api/apiClient';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const isMock = isUsingMockApi();
  const [notifyCritical, setNotifyCritical] = useState(true);
  const [notifyBottlenecks, setNotifyBottlenecks] = useState(true);
  const [notifyOCR, setNotifyOCR] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSavePreferences = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border-hairline pb-4 gap-4">
        <div>
          <div className="flex items-center space-x-2 font-mono text-3xs text-ink-500 uppercase tracking-widest">
            <span>GOIP</span>
            <span>/</span>
            <span>SYSTEM PREFERENCES</span>
            <span>/</span>
            <span>CONSOLE CONFIGURATION</span>
          </div>
          <h1 className="font-sans font-extrabold text-2xl text-ink-950 tracking-tight mt-1">
            OPERATOR IDENTITY &amp; ARCHITECTURAL CONFIGURATION
          </h1>
        </div>

        <div className="font-mono text-3xs text-ink-500 flex items-center space-x-3">
          <span>ENVIRONMENT: <strong>SIH-PHASE-01-PROTOTYPE</strong></span>
        </div>
      </div>

      {/* Operator Profile */}
      <div className="bg-surface border border-border-hairline p-6 shadow-subtle-1 space-y-4">
        <div className="flex items-center space-x-2 border-b border-border-hairline pb-3">
          <User className="w-4 h-4 text-ink-700" />
          <h3 className="font-sans font-bold text-sm text-ink-950 uppercase">
            OPERATOR IDENTITY &amp; JURISDICTION
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
          <div className="p-3 bg-surface-subtle border border-border-hairline space-y-1">
            <span className="text-3xs text-ink-400 uppercase">OFFICER NAME</span>
            <div className="font-bold text-ink-950">{user?.name || 'Rajeshwar V. Verma, IAS'}</div>
          </div>

          <div className="p-3 bg-surface-subtle border border-border-hairline space-y-1">
            <span className="text-3xs text-ink-400 uppercase">OFFICIAL EMAIL</span>
            <div className="font-bold text-ink-950">{user?.email || 'director.operations@goip.gov.in'}</div>
          </div>

          <div className="p-3 bg-surface-subtle border border-border-hairline space-y-1">
            <span className="text-3xs text-ink-400 uppercase">DEPARTMENT JURISDICTION</span>
            <div className="font-bold text-ink-950">
              {user?.department || 'Department of Administrative Reforms & Public Grievances'}
            </div>
          </div>

          <div className="p-3 bg-surface-subtle border border-border-hairline space-y-1">
            <span className="text-3xs text-ink-400 uppercase">SECURITY CLEARANCE</span>
            <div className="font-bold text-sageSuccess">ADMINISTRATOR // LEVEL-A CLEARANCE</div>
          </div>
        </div>
      </div>

      {/* Backend API Integration Architecture Status */}
      <div className="bg-surface border border-border-hairline p-6 shadow-subtle-1 space-y-4">
        <div className="flex items-center justify-between border-b border-border-hairline pb-3">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-vermilion" />
            <div>
              <h3 className="font-sans font-bold text-sm text-ink-950 uppercase">
                BACKEND INTEGRATION &amp; ADAPTER STATUS
              </h3>
              <p className="font-mono text-3xs text-ink-500">
                ARCHITECTURE READY FOR FASTAPI / POSTGRESQL / PM4PY DROP-IN
              </p>
            </div>
          </div>

          <span
            className={`font-mono text-2xs font-bold px-2 py-1 border ${
              isMock
                ? 'bg-amberRisk-subtle text-amberRisk border-amberRisk-border'
                : 'bg-sageSuccess-subtle text-sageSuccess border-sageSuccess-border'
            }`}
          >
            {isMock ? 'SYNTHETIC DATA MODE (MOCK ADAPTER)' : 'FASTAPI REST BACKEND ACTIVE'}
          </span>
        </div>

        <div className="p-4 bg-surface-subtle border border-border-hairline space-y-3 font-mono text-2xs">
          <div className="flex items-start space-x-2">
            <Code2 className="w-4 h-4 text-ink-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-ink-950">HOW TO SWITCH TO PRODUCTION FASTAPI BACKEND:</div>
              <p className="text-ink-600 font-sans text-xs mt-1 leading-relaxed">
                The frontend uses a clean service/adapter layer. To connect your real Python/FastAPI service without altering UI components, simply configure the following in your environment:
              </p>
            </div>
          </div>

          <pre className="p-3 bg-ink-950 text-white font-mono text-3xs overflow-x-auto selection:bg-vermilion">
{`# .env configuration
VITE_USE_MOCK_API=false
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key`}
          </pre>

          <p className="font-sans text-3xs text-ink-500">
            All endpoints adhere strictly to the documented schema in <code className="font-mono text-ink-900 bg-surface px-1 border border-border-hairline">/docs/API_CONTRACT.md</code>.
          </p>
        </div>
      </div>

      {/* Operational Alert Preferences */}
      <div className="bg-surface border border-border-hairline p-6 shadow-subtle-1 space-y-4">
        <div className="flex items-center justify-between border-b border-border-hairline pb-3">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-ink-700" />
            <h3 className="font-sans font-bold text-sm text-ink-950 uppercase">
              OPERATIONAL NOTIFICATION ROUTING
            </h3>
          </div>
          {saved && (
            <span className="font-mono text-3xs text-sageSuccess font-bold flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>PREFERENCES SAVED</span>
            </span>
          )}
        </div>

        <div className="space-y-3 font-mono text-2xs">
          <label className="flex items-center justify-between p-3 bg-surface border border-border-hairline cursor-pointer hover:bg-surface-hover">
            <div>
              <div className="font-bold text-ink-950">CRITICAL SLA BREACH ALERTS</div>
              <div className="font-sans text-3xs text-ink-500">
                Receive instant alert popovers for cases exceeding &gt;80% delay probability
              </div>
            </div>
            <input
              type="checkbox"
              checked={notifyCritical}
              onChange={(e) => setNotifyCritical(e.target.checked)}
              className="w-4 h-4 accent-ink-900"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-surface border border-border-hairline cursor-pointer hover:bg-surface-hover">
            <div>
              <div className="font-bold text-ink-950">PROCESS BOTTLENECK THRESHOLD ALERTS</div>
              <div className="font-sans text-3xs text-ink-500">
                Notify when queue accumulation in any stage exceeds +50% above baseline
              </div>
            </div>
            <input
              type="checkbox"
              checked={notifyBottlenecks}
              onChange={(e) => setNotifyBottlenecks(e.target.checked)}
              className="w-4 h-4 accent-ink-900"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-surface border border-border-hairline cursor-pointer hover:bg-surface-hover">
            <div>
              <div className="font-bold text-ink-950">OCR INGESTION COMPLETION NOTIFICATIONS</div>
              <div className="font-sans text-3xs text-ink-500">
                Show notification when Tesseract finishes parsing new case attachments
              </div>
            </div>
            <input
              type="checkbox"
              checked={notifyOCR}
              onChange={(e) => setNotifyOCR(e.target.checked)}
              className="w-4 h-4 accent-ink-900"
            />
          </label>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSavePreferences}
            className="px-4 py-2 bg-ink-900 hover:bg-ink-800 text-white font-mono text-2xs uppercase tracking-wider font-bold transition-colors"
          >
            SAVE PREFERENCES
          </button>
        </div>
      </div>
    </div>
  );
};
