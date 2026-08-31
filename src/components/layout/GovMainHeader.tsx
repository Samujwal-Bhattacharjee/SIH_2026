import React, { useState } from 'react';
import { useNavigate, NavLink, Link } from 'react-router-dom';
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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSystem } from '../../context/SystemContext';
import { useLanguage } from '../../context/LanguageContext';

export const GovMainHeader: React.FC = () => {
  const { user, signOut } = useAuth();
  const { openSearch, alerts, unreadAlertCount, markAlertAsRead } = useSystem();
  const { t } = useLanguage();
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

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Procurement', path: '/tenders' },
    { name: 'Verification', path: '/verification' },
    { name: 'Integrity', path: '/integrity' },
    { name: 'Audit', path: '/audit-trail' },
  ];

  return (
    <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-40 select-none shadow-2xs font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Landmark Icon + Platform Title (3-lines) */}
        <Link to="/dashboard" className="flex items-center gap-3 shrink-0 group">
          <div className="text-[#230B5C]">
            <Landmark className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div className="font-bold text-xs leading-[1.15] text-[#0F172A] tracking-tight">
            <div>Procurement</div>
            <div>Intelligence</div>
            <div>Platform</div>
          </div>
        </Link>

        {/* Center: Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-6 lg:space-x-8 text-xs font-semibold h-full">
          {navLinks.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => {
                const active = isActive || (item.name === 'Verification' && location.pathname.startsWith('/verification'));
                return `h-full flex items-center border-b-2 pt-0.5 transition-colors ${
                  active
                    ? 'border-[#2E0854] text-[#2E0854] font-bold'
                    : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
                }`;
              }}
            >
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Right: Quick Search, Notifications, Settings, Create Tender, User Profile */}
        <div className="flex items-center gap-3">
          {/* Quick Search Shortcut */}
          <div className="relative hidden sm:block">
            <button
              onClick={openSearch}
              className="flex items-center gap-2 pl-3 pr-4 py-1.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-full text-xs text-[#94A3B8] transition-all cursor-pointer w-44 lg:w-52"
              title="Global Search (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="text-[#64748B] text-xs">Search...</span>
            </button>
          </div>

          {/* Operational Alerts Popover */}
          <div className="relative">
            <button
              onClick={() => setIsAlertOpen(!isAlertOpen)}
              className="p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-gray-100 rounded-full relative transition-colors cursor-pointer"
              title="Operational Alerts"
              aria-label="Alerts"
            >
              <Bell className="w-4 h-4" />
              {unreadAlertCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#DC2626] rounded-full" />
              )}
            </button>

            {isAlertOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E5E7EB] rounded-[4px] shadow-xl z-50 animate-in fade-in">
                <div className="px-3.5 py-2.5 bg-[#2E0854] text-white flex items-center justify-between rounded-t-[3px]">
                  <span className="font-bold text-xs">
                    Notifications ({alerts.length})
                  </span>
                  <span className="text-[10px] text-purple-200">Pending Actions</span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-[#E5E7EB]">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      onClick={() => handleAlertClick(alert.id, alert.link)}
                      className={`p-3 text-xs cursor-pointer hover:bg-[#F9FAFB] transition-colors ${
                        !alert.read ? 'bg-[#FFFBEB]/60 font-medium' : 'bg-white'
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
                        <span>{alert.timestamp}</span>
                      </div>
                      <h4 className="font-semibold text-[#0F172A] mb-0.5">{alert.title}</h4>
                      <p className="text-[11px] text-[#64748B] leading-relaxed">
                        {alert.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Settings Icon */}
          <button
            onClick={() => navigate('/settings')}
            className="p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            title="Portal Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Create Tender Button */}
          <button
            onClick={() => navigate('/tenders')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#2E0854] hover:bg-[#1E053A] border border-[#2E0854] rounded-[4px] text-xs font-semibold text-white transition-colors shadow-xs cursor-pointer"
          >
            <span>Create Tender</span>
          </button>

          {/* User Profile Avatar */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="w-8 h-8 rounded-full bg-[#E0E7FF] hover:bg-[#C7D2FE] text-[#3730A3] flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
              title="Officer Profile"
            >
              <UserIcon className="w-4 h-4 text-[#3730A3]" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E5E7EB] rounded-[4px] shadow-xl z-50 divide-y divide-[#E5E7EB] animate-in fade-in">
                <div className="p-3 bg-[#F8FAFC]">
                  <p className="font-bold text-xs text-[#0F172A]">{user?.name || 'Officer Rajeshwar Verma'}</p>
                  <p className="text-[11px] text-[#64748B]">{user?.designation || 'Joint Secretary'}</p>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">{user?.department || 'Procurement & Contracts'}</p>
                </div>
                <div className="p-1 text-xs">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      navigate('/settings');
                    }}
                    className="w-full text-left px-3 py-1.5 text-[#0F172A] hover:bg-[#F1F5F9] rounded-[2px] flex items-center space-x-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[#2E0854]" />
                    <span>System Credentials</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-1.5 text-[#DC2626] hover:bg-[#FEF2F2] rounded-[2px] flex items-center space-x-2 font-medium cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
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
