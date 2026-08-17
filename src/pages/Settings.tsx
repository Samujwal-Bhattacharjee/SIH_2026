import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Server,
  Database,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Code2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isUsingMockApi } from '../services/api/apiClient';
import { GovCard } from '../components/common/GovCard';
import { GovButton } from '../components/common/GovButton';

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
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#D9DDE3] pb-3 gap-2">
        <div>
          <h1 className="font-serif font-bold text-2xl text-[#0B2A4A] tracking-tight">
            System Preferences &amp; Integration Architecture
          </h1>
          <p className="text-xs text-[#5F6368] mt-0.5">
            Operator profile, notification routing, and service adapter configuration.
          </p>
        </div>

        <span className="font-mono text-xs text-[#5F6368]">
          ENVIRONMENT: <strong className="text-[#0B2A4A]">GOI-PORTAL-2026</strong>
        </span>
      </div>

      {/* Operator Profile Card */}
      <GovCard title="Officer Identity &amp; Jurisdiction" highlightBorder="navy">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-[#F8F9FA] border border-[#D9DDE3] rounded-[3px] space-y-1">
            <span className="text-[10px] text-[#5F6368] uppercase font-bold">OFFICER NAME</span>
            <div className="font-bold text-sm text-[#0B2A4A] font-serif">{user?.name || 'Rajeshwar V. Verma, IAS'}</div>
          </div>

          <div className="p-3 bg-[#F8F9FA] border border-[#D9DDE3] rounded-[3px] space-y-1">
            <span className="text-[10px] text-[#5F6368] uppercase font-bold">OFFICIAL EMAIL</span>
            <div className="font-bold text-[#202124] font-mono">{user?.email || 'director.operations@goip.gov.in'}</div>
          </div>

          <div className="p-3 bg-[#F8F9FA] border border-[#D9DDE3] rounded-[3px] space-y-1">
            <span className="text-[10px] text-[#5F6368] uppercase font-bold">DEPARTMENT</span>
            <div className="font-semibold text-[#202124]">
              {user?.department || 'Department of Administrative Reforms & Public Grievances'}
            </div>
          </div>

          <div className="p-3 bg-[#F8F9FA] border border-[#D9DDE3] rounded-[3px] space-y-1">
            <span className="text-[10px] text-[#5F6368] uppercase font-bold">DESIGNATION &amp; ROLE</span>
            <div className="font-bold text-[#15803D]">ADMINISTRATOR • JOINT SECRETARY LEVEL</div>
          </div>
        </div>
      </GovCard>

      {/* Backend API Integration Architecture Status */}
      <GovCard
        title="Backend Integration Architecture Status"
        subtitle="Service abstraction status for Supabase, FastAPI, and PostgreSQL integration."
        highlightBorder="green"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-[3px] flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 text-[#15803D]">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>Service Layer Decoupled:</strong> The UI components interact strictly via modular TypeScript services (`fileService`, `ocrService`, `authService`), enabling immediate plug-and-play backend replacement.
              </span>
            </div>
            <span className="font-mono font-bold text-[#0B2A4A] bg-white px-2 py-0.5 border border-[#BBF7D0] rounded-[2px]">
              {isMock ? 'MOCK API MODE' : 'LIVE REST API'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-[11px]">
            <div className="p-3 bg-[#F8F9FA] border border-[#D9DDE3] rounded-[3px] space-y-1">
              <span className="text-[#5F6368] block">AUTH ADAPTER</span>
              <strong className="text-[#0B2A4A]">authService (Supabase Ready)</strong>
            </div>
            <div className="p-3 bg-[#F8F9FA] border border-[#D9DDE3] rounded-[3px] space-y-1">
              <span className="text-[#5F6368] block">OCR ENGINE</span>
              <strong className="text-[#0B2A4A]">ocrService (Tesseract 5.3)</strong>
            </div>
            <div className="p-3 bg-[#F8F9FA] border border-[#D9DDE3] rounded-[3px] space-y-1">
              <span className="text-[#5F6368] block">DELAY RISK ENGINE</span>
              <strong className="text-[#0B2A4A]">riskService (SHAP v2.4)</strong>
            </div>
          </div>
        </div>
      </GovCard>

      {/* Operational Notification Preferences */}
      <GovCard title="Administrative Notification Preferences">
        <div className="space-y-3 text-xs">
          <label className="flex items-center space-x-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyCritical}
              onChange={(e) => setNotifyCritical(e.target.checked)}
              className="accent-[#0B2A4A] w-4 h-4 rounded-[2px]"
            />
            <span className="text-[#202124] font-medium">
              Alert on statutory SLA breaches exceeding 30 days
            </span>
          </label>

          <label className="flex items-center space-x-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyBottlenecks}
              onChange={(e) => setNotifyBottlenecks(e.target.checked)}
              className="accent-[#0B2A4A] w-4 h-4 rounded-[2px]"
            />
            <span className="text-[#202124] font-medium">
              Notify when departmental queue dwell time exceeds 150% baseline
            </span>
          </label>

          <label className="flex items-center space-x-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyOCR}
              onChange={(e) => setNotifyOCR(e.target.checked)}
              className="accent-[#0B2A4A] w-4 h-4 rounded-[2px]"
            />
            <span className="text-[#202124] font-medium">
              Notify on automated OCR document extraction completion
            </span>
          </label>

          <div className="pt-3 border-t border-[#D9DDE3] flex items-center justify-between">
            {saved && (
              <span className="text-xs text-[#15803D] font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Preferences Saved Successfully</span>
              </span>
            )}
            <div className="ml-auto">
              <GovButton variant="primary" size="sm" onClick={handleSavePreferences}>
                Save Preferences
              </GovButton>
            </div>
          </div>
        </div>
      </GovCard>
    </div>
  );
};
