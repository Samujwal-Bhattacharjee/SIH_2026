import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Home, PlusCircle, Search, Activity, FileText } from 'lucide-react';
import { useSystem } from '../../context/SystemContext';
import { useLanguage } from '../../context/LanguageContext';
import { FileRegisterModal } from '../files/FileRegisterModal';

export const GovBreadcrumb: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { openSearch } = useSystem();
  const { t } = useLanguage();
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const pathSegments = location.pathname.split('/').filter(Boolean);

  const formatSegment = (seg: string) => {
    if (seg === 'dashboard') return t('nav.dashboard');
    if (seg === 'files' || seg === 'cases') return t('nav.files');
    if (seg === 'pending') return t('nav.pending');
    if (seg === 'documents') return t('nav.documents');
    if (seg === 'upload') return t('nav.upload');
    if (seg === 'search') return t('nav.search');
    if (seg === 'intelligence') return t('nav.intelligence');
    if (seg === 'workflow') return t('nav.workflow');
    if (seg === 'risk') return t('nav.risk');
    if (seg === 'simulation') return t('nav.simulation');
    if (seg === 'reports') return t('nav.reports');
    if (seg === 'audit-logs') return t('nav.auditLogs');
    if (seg === 'departments') return t('nav.departments');
    if (seg === 'settings') return t('nav.settings');
    return seg.toUpperCase();
  };

  return (
    <>
      <div className="bg-[#F0F2F5] border-b border-[#D9DDE3] px-4 sm:px-6 py-2 select-none">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Breadcrumb Trail */}
          <nav className="flex items-center space-x-1.5 text-[#5F6368] font-medium" aria-label="Breadcrumb">
            <Link to="/dashboard" className="hover:text-[#0B2A4A] flex items-center space-x-1">
              <Home className="w-3.5 h-3.5 text-[#0B2A4A]" />
              <span>Portal</span>
            </Link>

            {pathSegments.map((segment, index) => {
              const url = `/${pathSegments.slice(0, index + 1).join('/')}`;
              const isLast = index === pathSegments.length - 1;

              return (
                <React.Fragment key={url}>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                  {isLast ? (
                    <span className="text-[#0B2A4A] font-bold tracking-tight">
                      {formatSegment(segment)}
                    </span>
                  ) : (
                    <Link to={url} className="hover:text-[#0B2A4A]">
                      {formatSegment(segment)}
                    </Link>
                  )}
                </React.Fragment>
              );
            })}
          </nav>

          {/* Right Status Counters & Quick Actions */}
          <div className="flex items-center space-x-3">
            <div className="hidden lg:flex items-center space-x-3 text-[11px] text-[#5F6368] border-r border-[#CBD2DE] pr-3 font-mono">
              <span>
                ACTIVE FILES: <strong className="text-[#0B2A4A]">10,482</strong>
              </span>
              <span>•</span>
              <span className="text-[#B72025] font-semibold">
                OVERDUE (&gt; SLA): <strong>127</strong>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1 text-[#15803D] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]" />
                <span>NIC-VPN CONNECTED</span>
              </span>
            </div>

            {/* Quick Register Inward File */}
            <button
              onClick={() => setIsRegisterOpen(true)}
              className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-[#0B2A4A] hover:bg-[#123B63] text-white text-xs font-semibold rounded-[3px] shadow-sm transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Register Inward File</span>
            </button>
          </div>
        </div>
      </div>

      {/* Inward File Registration Dialog */}
      <FileRegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onCreated={(newCase) => {
          setIsRegisterOpen(false);
          navigate(`/files/${newCase.id}`);
        }}
      />
    </>
  );
};
