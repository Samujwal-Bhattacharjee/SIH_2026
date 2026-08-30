import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bell,
  LogOut,
  User as UserIcon,
  Search,
  ExternalLink,
  ChevronDown,
  ShieldCheck,
  Building2,
  FileText,
} from 'lucide-react';
import { Emblem } from '../../assets/Emblem';
import { useAuth } from '../../context/AuthContext';
import { useSystem } from '../../context/SystemContext';
import { useLanguage } from '../../context/LanguageContext';

export const GovMainHeader: React.FC = () => {
  const { user, signOut } = useAuth();
  const { openSearch, alerts, unreadAlertCount, markAlertAsRead } = useSystem();
  const { language, t } = useLanguage();
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleAlertClick = (alertId: string, link?: string) => {
    markAlertAsRead(alertId);
    setIsAlertOpen(false);
    if (link) navigate(link);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-[#D9DDE3] shadow-[0_1px_2px_0_rgba(0,0,0,0.03)] select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Emblem + Institutional Portal Name */}
        <Link to="/dashboard" className="flex items-center space-x-3.5 group focus:outline-none">
          <Emblem size={52} />
          <div className="border-l border-[#CBD2DE] pl-3">
            <div className="font-serif font-extrabold text-lg sm:text-xl text-[#0B2A4A] tracking-tight leading-tight group-hover:text-[#123B63] transition-colors">
              {t('gov.systemTitle')}
            </div>
            <div className="text-[11px] sm:text-xs text-[#5F6368] font-sans font-medium flex items-center space-x-1.5 mt-0.5">
              <span>{t('gov.ministry')}</span>
            </div>
          </div>
        </Link>

        {/* Right: Quick Search, System Status, Alerts & Officer Profile */}
        <div className="flex items-center space-x-3">
          {/* Quick Search Shortcut */}
          <button
            onClick={openSearch}
            className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-[#F5F6F8] hover:bg-[#EEF2F7] border border-[#CBD2DE] rounded-[2px] text-xs text-[#475569] transition-colors cursor-pointer"
            title="Global Search (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-[#0B2A4A]" />
            <span>{t('header.searchPlaceholder')}</span>
            <kbd className="font-mono text-[10px] px-1 py-0.5 bg-white border border-[#CBD2DE] rounded-[2px] text-gray-500">
              Ctrl+K
            </kbd>
          </button>

          {/* Operational Alerts Popover */}
          <div className="relative">
            <button
              onClick={() => setIsAlertOpen(!isAlertOpen)}
              className="p-1.5 text-[#202124] hover:bg-[#F0F2F5] border border-[#CBD2DE] rounded-[2px] relative transition-colors cursor-pointer"
              title="Operational Alerts"
              aria-label="Alerts"
            >
              <Bell className="w-4 h-4 text-[#0B2A4A]" />
              {unreadAlertCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#B72025] text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                  {unreadAlertCount}
                </span>
              )}
            </button>

            {isAlertOpen && (
              <div className="absolute right-0 mt-2 w-84 bg-white border border-[#0B2A4A] rounded-[2px] shadow-xl z-50 animate-in fade-in">
                <div className="px-3.5 py-2 bg-[#0B2A4A] text-white flex items-center justify-between">
                  <span className="font-serif font-bold text-xs">
                    {t('header.notifications')} ({alerts.length})
                  </span>
                  <span className="text-[10px] text-gray-300 font-mono">{t('header.pendingActions')}</span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-[#D9DDE3]">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      onClick={() => handleAlertClick(alert.id, alert.link)}
                      className={`p-3 text-xs cursor-pointer hover:bg-[#F0F5FA] transition-colors ${
                        !alert.read ? 'bg-[#FFFBEB]/60 font-medium' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                        <span
                          className={`font-semibold uppercase tracking-wider ${
                            alert.type === 'CRITICAL'
                              ? 'text-[#B72025]'
                              : alert.type === 'WARNING'
                              ? 'text-[#D97706]'
                              : 'text-[#1D4ED8]'
                          }`}
                        >
                          {alert.type}
                        </span>
                        <span>{alert.timestamp}</span>
                      </div>
                      <h4 className="font-semibold text-[#202124] mb-0.5">{alert.title}</h4>
                      <p className="text-[11px] text-[#5F6368] leading-relaxed">
                        {alert.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Officer Identity Card */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center space-x-2.5 px-2.5 py-1.5 bg-[#F8F9FA] hover:bg-[#EEF2F7] border border-[#CBD2DE] rounded-[3px] text-left transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-[#0B2A4A] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                {user?.name ? user.name.charAt(0) : 'O'}
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-bold text-[#0B2A4A] leading-tight truncate max-w-[140px]">
                  {user?.name || 'Officer Rajeshwar Verma'}
                </div>
                <div className="text-[10px] text-[#5F6368] leading-tight">
                  {user?.badgeNumber || 'OFC-1042'} • IAS
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-[#D9DDE3] rounded-[3px] shadow-xl z-50 divide-y divide-[#D9DDE3] animate-in fade-in">
                <div className="p-3 bg-[#F8F9FA]">
                  <p className="font-bold text-xs text-[#0B2A4A]">{user?.name}</p>
                  <p className="text-[11px] text-[#5F6368]">{user?.designation || 'Joint Secretary'}</p>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">{user?.department}</p>
                </div>
                <div className="p-1">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      navigate('/settings');
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-[#202124] hover:bg-[#F0F2F5] rounded-[2px] flex items-center space-x-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0B2A4A]" />
                    <span>{t('header.systemCredentials')}</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-1.5 text-xs text-[#B72025] hover:bg-[#FEF2F2] rounded-[2px] flex items-center space-x-2 font-medium cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t('action.logout')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
