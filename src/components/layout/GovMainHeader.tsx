import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, NavLink, Link, useLocation } from 'react-router-dom';
import {
  Landmark,
  Bell,
  Settings,
  Search,
  User as UserIcon,
  ChevronDown,
  LogOut,
  ShieldCheck,
  PlusCircle,
  CheckCircle2,
  Eye,
  Globe,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSystem } from '../../context/SystemContext';
import { useLanguage } from '../../context/LanguageContext';

export const GovMainHeader: React.FC = () => {
  const { user, signOut } = useAuth();
  const { openSearch, alerts, unreadAlertCount, markAlertAsRead } = useSystem();
  const { language, setLanguage, fontSize, setFontSize, highContrast, setHighContrast, t } = useLanguage();
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const alertRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside anywhere on the page
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (alertRef.current && !alertRef.current.contains(event.target as Node)) {
        setIsAlertOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsAlertOpen(false);
        setIsUserMenuOpen(false);
        setIsLangOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleAlertClick = (alertId: string, link?: string) => {
    markAlertAsRead(alertId);
    setIsAlertOpen(false);
    if (link) navigate(link);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const navLinks = [
    { name: t('nav.dashboard', 'Dashboard'), path: '/dashboard' },
    { name: t('nav.procurement', 'Procurement'), path: '/tenders' },
    { name: t('nav.workflow', 'Verification'), path: '/verification' },
    { name: t('nav.risk', 'Integrity'), path: '/integrity' },
    { name: t('nav.auditLogs', 'Audit'), path: '/audit-trail' },
  ];

  return (
    <header className="gov-glass-header sticky top-0 z-40 select-none font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Left: Landmark Icon + Platform Title (3-lines) */}
        <Link to="/dashboard" className="flex items-center gap-3 shrink-0 group transition-transform duration-200 hover:scale-[1.01]">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#2E0854] to-[#0B2A4A] flex items-center justify-center text-white shadow-md transition-transform duration-300 group-hover:scale-105 group-hover:rotate-[-2deg]">
            <Landmark className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="font-bold text-xs leading-[1.15] text-[#0F172A] tracking-tight">
            <div className="group-hover:text-[#2E0854] transition-colors">Procurement</div>
            <div className="group-hover:text-[#2E0854] transition-colors">Intelligence</div>
            <div className="text-[#64748B]">Platform</div>
          </div>
        </Link>

        {/* Center: Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-5 lg:space-x-7 text-xs font-semibold h-full">
          {navLinks.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => {
                const active = isActive || (item.path === '/verification' && location.pathname.startsWith('/verification'));
                return `h-full flex items-center border-b-2 pt-0.5 transition-all duration-200 ${
                  active
                    ? 'border-[#2E0854] text-[#2E0854] font-bold shadow-xs'
                    : 'border-transparent text-[#64748B] hover:text-[#0F172A] hover:border-gray-200'
                }`;
              }}
            >
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Right: Quick Search, Notifications, A-, A, A+, Accessibility, English ▼, Settings, User Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* 1. Quick Search Shortcut */}
          <div className="relative hidden sm:block">
            <button
              onClick={openSearch}
              className="flex items-center gap-2 pl-3 pr-3.5 py-1.5 bg-white/70 hover:bg-white/90 border border-white/60 hover:border-white/90 backdrop-blur-md rounded-full text-xs text-[#94A3B8] transition-all duration-200 hover:shadow-xs active:scale-[0.98] cursor-pointer w-32 lg:w-36 xl:w-44 group"
              title="Global Search (Ctrl+K)"
              aria-label="Search"
            >
              <Search className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#2E0854] transition-colors duration-200 shrink-0" />
              <span className="text-[#64748B] text-xs group-hover:text-[#0F172A] transition-colors duration-200 truncate">
                {t('header.searchPlaceholder', 'Search...')}
              </span>
            </button>
          </div>

          {/* 2. Notifications / Operational Alerts Popover */}
          <div className="relative" ref={alertRef}>
            <button
              onClick={() => setIsAlertOpen((prev) => !prev)}
              className="p-2 text-[#64748B] hover:text-[#2E0854] hover:bg-white/60 rounded-full relative transition-all duration-200 cursor-pointer active:scale-90 group"
              title="Operational Alerts"
              aria-label="Notifications"
              aria-expanded={isAlertOpen}
            >
              <Bell className="w-4 h-4 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
              {unreadAlertCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#DC2626]" />
                </span>
              )}
            </button>

            {isAlertOpen && (
              <div className="absolute right-0 mt-2 w-80 gov-glass-card rounded-lg shadow-2xl z-50 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200 ease-out origin-top-right overflow-hidden border border-white/60">
                <div className="px-3.5 py-2.5 bg-[#2E0854]/95 text-white flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-purple-200" />
                    Notifications ({alerts.length})
                  </span>
                  <span className="text-[10px] text-purple-200 bg-purple-900/60 px-2 py-0.5 rounded-full font-medium">Pending Actions</span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                  {alerts.length > 0 ? (
                    alerts.map((alert) => (
                      <div
                        key={alert.id}
                        onClick={() => handleAlertClick(alert.id, alert.link)}
                        className={`p-3 text-xs cursor-pointer hover:bg-white/80 transition-all duration-150 ${
                          !alert.read ? 'bg-[#FFFBEB]/80 font-medium border-l-3 border-[#D97706]' : 'bg-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                          <span
                            className={`font-semibold uppercase tracking-wider ${
                              alert.type === 'CRITICAL'
                                ? 'text-[#DC2626]'
                                : alert.type === 'WARNING'
                                ? 'text-[#D97706]'
                                : 'text-[#2563EB]'
                            }`}
                          >
                            {alert.type}
                          </span>
                          <span className="text-gray-400">{alert.timestamp}</span>
                        </div>
                        <h4 className="font-semibold text-[#0F172A] mb-0.5">{alert.title}</h4>
                        <p className="text-[11px] text-[#64748B] leading-relaxed">
                          {alert.message}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs text-[#64748B]">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
                      <span>All notifications clear</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 3. Font Size Controls (A- / A / A+) - UX4G Standard */}
          <div
            className="flex items-center space-x-0.5 bg-white/80 border border-gray-200/90 rounded-[4px] p-0.5 shadow-2xs"
            role="group"
            aria-label="Text Size Controls"
          >
            <button
              type="button"
              onClick={() => setFontSize('small')}
              title="Decrease text scale (A-)"
              aria-label="Decrease text scale"
              className={`px-1.5 py-0.5 rounded-[2px] font-mono text-[11px] font-semibold transition-all duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2E0854] focus-visible:outline-none ${
                fontSize === 'small'
                  ? 'bg-[#2E0854] text-white font-bold shadow-xs'
                  : 'text-[#475569] hover:text-[#0F172A] hover:bg-gray-100'
              }`}
            >
              A-
            </button>
            <button
              type="button"
              onClick={() => setFontSize('normal')}
              title="Reset text scale (A)"
              aria-label="Reset text scale"
              className={`px-1.5 py-0.5 rounded-[2px] font-mono text-[11px] font-semibold transition-all duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2E0854] focus-visible:outline-none ${
                fontSize === 'normal'
                  ? 'bg-[#2E0854] text-white font-bold shadow-xs'
                  : 'text-[#475569] hover:text-[#0F172A] hover:bg-gray-100'
              }`}
            >
              A
            </button>
            <button
              type="button"
              onClick={() => setFontSize('large')}
              title="Increase text scale (A+)"
              aria-label="Increase text scale"
              className={`px-1.5 py-0.5 rounded-[2px] font-mono text-[11px] font-semibold transition-all duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2E0854] focus-visible:outline-none ${
                fontSize === 'large'
                  ? 'bg-[#2E0854] text-white font-bold shadow-xs'
                  : 'text-[#475569] hover:text-[#0F172A] hover:bg-gray-100'
              }`}
            >
              A+
            </button>
          </div>

          {/* 4. Accessibility High Contrast Toggle */}
          <button
            type="button"
            onClick={() => setHighContrast(!highContrast)}
            title={highContrast ? "Standard Contrast Mode" : "High Contrast Accessibility Theme"}
            aria-label="Accessibility high contrast toggle"
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-[4px] border text-xs font-semibold transition-all duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2E0854] focus-visible:outline-none ${
              highContrast
                ? 'bg-[#FF9933] text-black border-[#D97706] font-bold shadow-xs'
                : 'bg-white/80 hover:bg-white border-gray-200/90 text-[#475569] hover:text-[#0F172A] shadow-2xs hover:shadow-xs'
            }`}
          >
            <Eye className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden xl:inline text-[11px]">Accessibility</span>
          </button>

          <span className="text-gray-300 hidden sm:inline select-none">|</span>

          {/* 5. Language Control Dropdown (English ▼ / हिन्दी ▼) */}
          <div className="relative" ref={langMenuRef}>
            <button
              type="button"
              onClick={() => setIsLangOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/80 hover:bg-white border border-gray-200/90 rounded-[4px] text-xs font-semibold text-[#0F172A] transition-all duration-150 shadow-2xs hover:shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2E0854] focus-visible:outline-none"
              aria-label="Select Language"
              aria-expanded={isLangOpen}
              title="Select Language"
            >
              <Globe className="w-3.5 h-3.5 text-[#2E0854] shrink-0" />
              <span>{language === 'hi' ? 'हिन्दी' : 'English'}</span>
              <ChevronDown className={`w-3 h-3 text-[#64748B] transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''}`} />
            </button>

            {isLangOpen && (
              <div className="absolute right-0 mt-1.5 w-36 bg-white rounded-[4px] shadow-xl border border-gray-200 z-50 py-1 text-xs animate-in fade-in zoom-in-95 duration-150">
                <button
                  type="button"
                  onClick={() => {
                    setLanguage('en');
                    setIsLangOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 flex items-center justify-between cursor-pointer hover:bg-purple-50 transition-colors ${
                    language === 'en' ? 'text-[#2E0854] font-bold bg-purple-50/60' : 'text-[#334155]'
                  }`}
                >
                  <span>English</span>
                  {language === 'en' && <Check className="w-3.5 h-3.5 text-[#2E0854]" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLanguage('hi');
                    setIsLangOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 flex items-center justify-between cursor-pointer hover:bg-purple-50 transition-colors ${
                    language === 'hi' ? 'text-[#2E0854] font-bold bg-purple-50/60' : 'text-[#334155]'
                  }`}
                >
                  <span>हिन्दी (Hindi)</span>
                  {language === 'hi' && <Check className="w-3.5 h-3.5 text-[#2E0854]" />}
                </button>
              </div>
            )}
          </div>

          {/* Settings Icon */}
          <button
            onClick={() => navigate('/settings')}
            className="p-2 text-[#64748B] hover:text-[#2E0854] hover:bg-white/60 rounded-full transition-all duration-200 cursor-pointer active:scale-90 group"
            title="Portal Settings"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4 transition-transform duration-500 ease-out group-hover:rotate-90 group-hover:scale-110" />
          </button>

          {/* Create Tender Button (Glossy button) */}
          <button
            onClick={() => navigate('/tenders')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#2E0854] hover:bg-[#1E053A] border border-[#2E0854] rounded-[4px] text-xs font-semibold text-white gov-btn-glossy transition-all duration-200 shadow-sm cursor-pointer group"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#FF9933] group-hover:rotate-90 transition-transform duration-300" />
            <span>Create Tender</span>
          </button>

          {/* User Profile Avatar */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              className="w-8 h-8 rounded-full bg-[#E0E7FF] hover:bg-[#C7D2FE] text-[#3730A3] flex items-center justify-center font-bold text-xs transition-all duration-200 hover:scale-105 active:scale-95 ring-2 ring-transparent hover:ring-purple-200 cursor-pointer"
              title="Officer Profile"
              aria-expanded={isUserMenuOpen}
            >
              <UserIcon className="w-4 h-4 text-[#3730A3]" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 gov-glass-card rounded-lg shadow-2xl z-50 divide-y divide-gray-100 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200 ease-out origin-top-right overflow-hidden border border-white/60">
                <div className="p-3 bg-white/70 backdrop-blur-md">
                  <p className="font-bold text-xs text-[#0F172A]">{user?.name || 'Officer Rajeshwar Verma'}</p>
                  <p className="text-[11px] text-[#64748B]">{user?.designation || 'Joint Secretary'}</p>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">{user?.department || 'Procurement & Contracts'}</p>
                </div>
                <div className="p-1 text-xs space-y-0.5">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      navigate('/settings');
                    }}
                    className="w-full text-left px-3 py-1.5 text-[#0F172A] hover:bg-white/80 rounded-[2px] flex items-center space-x-2 transition-colors cursor-pointer group"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[#2E0854] group-hover:scale-110 transition-transform" />
                    <span>System Credentials</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-1.5 text-[#DC2626] hover:bg-[#FEF2F2] rounded-[2px] flex items-center space-x-2 font-medium transition-colors cursor-pointer group"
                  >
                    <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                    <span>Logout</span>
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

export default GovMainHeader;
