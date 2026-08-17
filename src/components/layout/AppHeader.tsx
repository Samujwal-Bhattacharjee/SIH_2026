import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Activity,
  Shield,
  LogOut,
  ChevronDown,
  Building2,
  ExternalLink,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSystem } from '../../context/SystemContext';

export const AppHeader: React.FC = () => {
  const { user, signOut } = useAuth();
  const { openSearch, alerts, unreadAlertCount, markAlertAsRead, setIsStatusDrawerOpen } = useSystem();
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
    <header className="h-14 bg-surface border-b border-border-hairline px-6 flex items-center justify-between sticky top-0 z-10 select-none">
      {/* Left Area: Department Scope & Context */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-ink-700">
          <Building2 className="w-4 h-4 text-ink-500" />
          <span className="font-mono text-xs font-semibold text-ink-950 uppercase tracking-tight">
            STATE OPERATIONS CONSOLE
          </span>
          <span className="text-ink-300">/</span>
          <span className="font-mono text-2xs text-ink-500 uppercase">
            ALL DEPARTMENTS
          </span>
        </div>
      </div>

      {/* Right Area: Search trigger, Status indicator, Notifications, User */}
      <div className="flex items-center space-x-3">
        {/* Global Search Trigger */}
        <button
          onClick={openSearch}
          className="flex items-center space-x-2 px-3 py-1.5 bg-surface-subtle hover:bg-surface-hover border border-border-hairline text-ink-600 hover:text-ink-900 transition-colors"
        >
          <Search className="w-3.5 h-3.5 text-ink-400" />
          <span className="font-mono text-2xs">SEARCH CASES / DOCS...</span>
          <kbd className="font-mono text-3xs px-1 py-0.5 bg-surface border border-border-hairline text-ink-400">
            Ctrl+K
          </kbd>
        </button>

        {/* Live Subsystem Health Status Trigger */}
        <button
          onClick={() => setIsStatusDrawerOpen(true)}
          className="hidden md:flex items-center space-x-1.5 px-2.5 py-1.5 bg-sageSuccess-subtle border border-sageSuccess-border hover:bg-sageSuccess-subtle/80 transition-colors"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-sageSuccess animate-pulse" />
          <span className="font-mono text-3xs font-bold text-sageSuccess tracking-wider">
            SYS: READY (5/5)
          </span>
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setIsAlertOpen(!isAlertOpen)}
            className="p-2 hover:bg-surface-subtle border border-border-hairline text-ink-600 hover:text-ink-900 relative"
          >
            <Bell className="w-4 h-4" />
            {unreadAlertCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-vermilion text-white font-mono text-3xs font-bold flex items-center justify-center rounded-full">
                {unreadAlertCount}
              </span>
            )}
          </button>

          {isAlertOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-surface border border-border-hairline shadow-xl z-50">
              <div className="p-3 border-b border-border-hairline flex items-center justify-between bg-surface-subtle/50">
                <span className="font-mono text-3xs font-bold text-ink-900 uppercase tracking-widest">
                  OPERATIONAL ALERTS ({alerts.length})
                </span>
                <span className="font-mono text-3xs text-ink-400">LIVE FEED</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-border-hairline">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => handleAlertClick(alert.id, alert.link)}
                    className={`p-3 hover:bg-surface-hover cursor-pointer transition-colors ${
                      !alert.read ? 'bg-surface-subtle/40' : 'bg-surface'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span
                        className={`font-mono text-3xs font-bold uppercase ${
                          alert.type === 'CRITICAL'
                            ? 'text-vermilion'
                            : alert.type === 'WARNING'
                            ? 'text-amberRisk'
                            : 'text-navyInfo'
                        }`}
                      >
                        {alert.type} // {alert.title}
                      </span>
                      <span className="font-mono text-3xs text-ink-400">{alert.timestamp}</span>
                    </div>
                    <p className="font-sans text-xs text-ink-700 mt-1">{alert.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Account / Signout Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center space-x-2 pl-2 pr-2.5 py-1 hover:bg-surface-subtle border border-border-hairline"
          >
            <div className="w-6 h-6 bg-ink-900 text-white flex items-center justify-center font-mono text-3xs font-bold">
              {user?.name ? user.name.slice(0, 2) : 'RV'}
            </div>
            <div className="text-left hidden lg:block">
              <div className="font-mono text-2xs font-semibold text-ink-900 leading-tight">
                {user?.name || 'R. V. VERMA, IAS'}
              </div>
              <div className="font-mono text-3xs text-ink-500">
                ADMINISTRATOR
              </div>
            </div>
            <ChevronDown className="w-3 h-3 text-ink-400" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-surface border border-border-hairline shadow-xl z-50">
              <div className="p-3 border-b border-border-hairline bg-surface-subtle/50">
                <div className="font-mono text-xs font-bold text-ink-900">{user?.name}</div>
                <div className="font-mono text-3xs text-ink-500 mt-0.5 truncate">{user?.email}</div>
                <div className="font-mono text-3xs text-ink-400 mt-1">
                  BADGE: {user?.badgeNumber || 'GOIP-DIR-2026-A1'}
                </div>
              </div>
              <div className="p-1">
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-mono text-ink-700 hover:bg-surface-hover flex items-center justify-between"
                >
                  <span>SYSTEM SETTINGS</span>
                  <ExternalLink className="w-3 h-3 text-ink-400" />
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-xs font-mono text-vermilion hover:bg-vermilion-subtle flex items-center justify-between"
                >
                  <span>END SESSION (LOG OUT)</span>
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
