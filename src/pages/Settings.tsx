import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Server,
  Database,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Cpu,
  Bell,
  Sliders,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isUsingMockApi } from '../services/api/apiClient';
import { GovCard } from '../components/common/GovCard';
import { GovButton } from '../components/common/GovButton';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const isMock = isUsingMockApi();

  const [notifyExceptions, setNotifyExceptions] = useState(true);
  const [notifyMissingDocs, setNotifyMissingDocs] = useState(true);
  const [notifyHighRisk, setNotifyHighRisk] = useState(true);
  const [notifyPendingReview, setNotifyPendingReview] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSavePreferences = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-5xl font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#D9DDE3] pb-3 gap-2">
        <div>
          <p className="text-[11px] uppercase font-bold tracking-wider text-[#5F6368]">
            System Preferences &amp; Officer Profile
          </p>
          <h1 className="font-serif font-bold text-2xl text-[#0B3558] tracking-tight">
            Procurement Configuration &amp; Settings
          </h1>
          <p className="text-xs text-[#5F6368] mt-0.5">
            Officer jurisdiction, automated verification engines, and procurement notification routing.
          </p>
        </div>

        <span className="font-mono text-xs text-[#5F6368]">
          ENVIRONMENT: <strong className="text-[#0B2A4A]">SIH26100-PROTOTYPE</strong>
        </span>
      </div>

      {/* 1. Officer Profile & Jurisdiction Card */}
      <GovCard title="Officer Profile & Jurisdiction" highlightBorder="navy">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-[#F8F9FA] border border-[#D9DDE3] rounded-[3px] space-y-1">
            <span className="text-[10px] text-[#5F6368] uppercase font-bold">OFFICER NAME</span>
            <div className="font-bold text-sm text-[#0B2A4A] font-serif">
              {user?.name || 'Rajeshwar V. Verma, IAS'}
            </div>
          </div>

          <div className="p-3 bg-[#F8F9FA] border border-[#D9DDE3] rounded-[3px] space-y-1">
            <span className="text-[10px] text-[#5F6368] uppercase font-bold">DEPARTMENT</span>
            <div className="font-semibold text-[#202124]">
              {user?.department || 'Department of Administrative Reforms & Public Grievances'}
            </div>
          </div>

          <div className="p-3 bg-[#F8F9FA] border border-[#D9DDE3] rounded-[3px] space-y-1">
            <span className="text-[10px] text-[#5F6368] uppercase font-bold">OFFICIAL DESIGNATION</span>
            <div className="font-bold text-[#202124]">
              {user?.designation || 'Joint Secretary (Procurement & Technical Evaluation)'}
            </div>
          </div>

          <div className="p-3 bg-[#F8F9FA] border border-[#D9DDE3] rounded-[3px] space-y-1">
            <span className="text-[10px] text-[#5F6368] uppercase font-bold">ROLE & JURISDICTION</span>
            <div className="font-bold text-[#15803D]">
              PROCUREMENT OFFICER • EVALUATOR & DECISION AUTHORITY
            </div>
          </div>
        </div>
      </GovCard>

      {/* 2. Verification Configuration Card */}
      <GovCard
        title="Verification Engine Configuration"
        subtitle="Active OCR, statutory compliance matcher, advisory assessment and adapter mode status."
        highlightBorder="green"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-[3px] flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 text-[#15803D]">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>Decoupled Verification Architecture:</strong> Modular adapters process document OCR, parse statutory identifiers, and feed evidence into the decision-support evaluator.
              </span>
            </div>
            <span className="font-mono font-bold text-[#0B2A4A] bg-white px-2 py-0.5 border border-[#BBF7D0] rounded-[2px]">
              {isMock ? 'SANDBOX / MOCK ADAPTERS' : 'LIVE API MODE'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-[11px]">
            <div className="p-3 bg-[#F8F9FA] border border-[#D9DDE3] rounded-[3px] space-y-1">
              <span className="text-[#5F6368] block">OCR ENGINE</span>
              <strong className="text-[#0B2A4A]">Tesseract 5.3 + PDF Parser</strong>
            </div>
            <div className="p-3 bg-[#F8F9FA] border border-[#D9DDE3] rounded-[3px] space-y-1">
              <span className="text-[#5F6368] block">COMPLIANCE ENGINE</span>
              <strong className="text-[#0B2A4A]">GeM Rule Matcher v2.1</strong>
            </div>
            <div className="p-3 bg-[#F8F9FA] border border-[#D9DDE3] rounded-[3px] space-y-1">
              <span className="text-[#5F6368] block">AI ASSESSMENT ENGINE</span>
              <strong className="text-[#0B2A4A]">Advisory Rule Engine</strong>
            </div>
            <div className="p-3 bg-[#F8F9FA] border border-[#D9DDE3] rounded-[3px] space-y-1">
              <span className="text-[#5F6368] block">SOURCE ADAPTER MODE</span>
              <strong className="text-[#15803D]">Sandbox / Mock (Demo)</strong>
            </div>
          </div>
        </div>
      </GovCard>

      {/* 3. Procurement Notification Preferences Card */}
      <GovCard title="Procurement Notifications & Alerts">
        <div className="space-y-3 text-xs">
          <label className="flex items-center space-x-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyExceptions}
              onChange={(e) => setNotifyExceptions(e.target.checked)}
              className="accent-[#0B2A4A] w-4 h-4 rounded-[2px]"
            />
            <span className="text-[#202124] font-medium">
              Notify when bidder verification has exceptions or document discrepancies
            </span>
          </label>

          <label className="flex items-center space-x-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyMissingDocs}
              onChange={(e) => setNotifyMissingDocs(e.target.checked)}
              className="accent-[#0B2A4A] w-4 h-4 rounded-[2px]"
            />
            <span className="text-[#202124] font-medium">
              Notify when required statutory documents or OEM authorizations are missing
            </span>
          </label>

          <label className="flex items-center space-x-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyHighRisk}
              onChange={(e) => setNotifyHighRisk(e.target.checked)}
              className="accent-[#0B2A4A] w-4 h-4 rounded-[2px]"
            />
            <span className="text-[#202124] font-medium">
              Notify when a high-risk bidder or blacklisting conflict is detected
            </span>
          </label>

          <label className="flex items-center space-x-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyPendingReview}
              onChange={(e) => setNotifyPendingReview(e.target.checked)}
              className="accent-[#0B2A4A] w-4 h-4 rounded-[2px]"
            />
            <span className="text-[#202124] font-medium">
              Notify when officer review and final qualification decision is pending
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
