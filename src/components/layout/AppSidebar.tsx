import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  ScanLine,
  Search,
  BarChart3,
  ScrollText,
  Settings,
  ShieldCheck,
  ClipboardCheck,
} from 'lucide-react';
import { isUsingMockApi } from '../../services/api/apiClient';

const NAV_ITEMS = [
  { id: '01', name: 'DASHBOARD', path: '/dashboard', icon: LayoutDashboard },
  { id: '02', name: 'TENDERS', path: '/tenders', icon: FolderKanban },
  { id: '03', name: 'BIDDER VERIFICATION', path: '/verification/BID-001', icon: ShieldCheck },
  { id: '04', name: 'DOCUMENTS', path: '/documents', icon: FileText },
  { id: '05', name: 'UPLOAD & EXTRACT', path: '/documents/upload', icon: ScanLine },
  { id: '06', name: 'COMPLIANCE', path: '/verification/BID-002', icon: ClipboardCheck },
  { id: '07', name: 'VERIFICATION SOURCES', path: '/verification-sources', icon: Search },
  { id: '08', name: 'REPORTS', path: '/reports', icon: BarChart3 },
  { id: '09', name: 'AUDIT TRAIL', path: '/audit-trail', icon: ScrollText },
  { id: '10', name: 'SETTINGS', path: '/settings', icon: Settings },
];

export const AppSidebar: React.FC = () => {
  const isMock = isUsingMockApi();

  return (
    <aside className="w-64 bg-surface border-r border-border-hairline flex flex-col justify-between h-screen sticky top-0 select-none z-20 font-sans">
      {/* Brand Header */}
      <div>
        <div className="p-4 border-b border-border-hairline bg-surface">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 bg-[#0B2A4A] flex items-center justify-center text-white flex-shrink-0 rounded-[2px]">
              <span className="font-mono font-bold text-xs text-amber-400">GM</span>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-mono font-bold text-xs text-ink-950 tracking-tight">SIH26100</span>
                <span className="font-mono text-3xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 py-0.2">
                  PROTOTYPE
                </span>
              </div>
              <p className="font-sans text-3xs text-[#5F6368] font-medium tracking-tight">
                GeM Bid Compliance Intel
              </p>
            </div>
          </div>
        </div>

        {/* Section Label */}
        <div className="px-4 py-2 bg-surface-subtle/50 border-b border-border-hairline flex items-center justify-between">
          <span className="font-mono text-3xs text-ink-500 uppercase tracking-widest">
            PROCUREMENT DESK
          </span>
          <span className="font-mono text-3xs text-ink-400">DECISION SUPPORT</span>
        </div>

        {/* Nav Links */}
        <nav className="p-2 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 text-xs font-mono transition-all ${
                    isActive
                      ? 'bg-ink-900 text-white font-medium shadow-subtle-1'
                      : 'text-ink-700 hover:bg-surface-hover hover:text-ink-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center space-x-2.5">
                      <span
                        className={`text-3xs font-mono ${
                          isActive ? 'text-vermilion' : 'text-ink-400'
                        }`}
                      >
                        {item.id}
                      </span>
                      <Icon
                        className={`w-3.5 h-3.5 ${
                          isActive ? 'text-white' : 'text-ink-500'
                        }`}
                      />
                      <span className="tracking-wide text-[11px]">{item.name}</span>
                    </div>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Technical Status Box */}
      <div className="p-3 border-t border-border-hairline bg-surface-subtle/40 space-y-2">
        <div className="p-2.5 bg-surface border border-border-hairline">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-mono text-3xs text-ink-500 uppercase tracking-widest">
              SYSTEM STATUS
            </span>
            <span className="flex items-center space-x-1 font-mono text-3xs text-sageSuccess font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-sageSuccess animate-pulse" />
              <span>SANDBOX READY</span>
            </span>
          </div>

          <div className="font-mono text-3xs text-ink-600 space-y-0.5 border-t border-border-hairline pt-1.5">
            <div className="flex justify-between">
              <span className="text-ink-400">DATASET:</span>
              <span className="font-medium text-ink-900">DEMO TENDERS</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-400">ADAPTER:</span>
              <span className="font-semibold text-sageSuccess">
                {isMock ? 'SANDBOX ADAPTERS' : 'LIVE API'}
              </span>
            </div>
          </div>
        </div>

        <div className="px-1 flex items-center justify-between text-3xs font-mono text-ink-400">
          <span>SIH26100.GOV.IN</span>
          <span>v2.0-DEMO</span>
        </div>
      </div>
    </aside>
  );
};
