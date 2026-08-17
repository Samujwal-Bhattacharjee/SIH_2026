import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  GitBranch,
  AlertOctagon,
  Cpu,
  FileText,
  BarChart3,
  Settings,
  ShieldAlert,
} from 'lucide-react';
import { isUsingMockApi } from '../../services/api/apiClient';

const NAV_ITEMS = [
  { id: '01', name: 'OVERVIEW', path: '/dashboard', icon: LayoutDashboard },
  { id: '02', name: 'CASES', path: '/cases', icon: FolderKanban },
  { id: '03', name: 'WORKFLOW', path: '/workflow', icon: GitBranch },
  { id: '04', name: 'RISK', path: '/risk', icon: AlertOctagon },
  { id: '05', name: 'SIMULATION', path: '/simulation', icon: Cpu },
  { id: '06', name: 'DOCUMENTS', path: '/documents', icon: FileText },
  { id: '07', name: 'ANALYTICS', path: '/analytics', icon: BarChart3 },
  { id: '08', name: 'SETTINGS', path: '/settings', icon: Settings },
];

export const AppSidebar: React.FC = () => {
  const isMock = isUsingMockApi();

  return (
    <aside className="w-64 bg-surface border-r border-border-hairline flex flex-col justify-between h-screen sticky top-0 select-none z-20">
      {/* Brand Header */}
      <div>
        <div className="p-4 border-b border-border-hairline bg-surface">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 bg-ink-900 flex items-center justify-center text-white flex-shrink-0">
              <span className="font-mono font-bold text-xs text-vermilion">G</span>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-mono font-bold text-sm text-ink-950 tracking-tight">GOIP</span>
                <span className="font-mono text-3xs font-semibold text-vermilion bg-vermilion-subtle border border-vermilion-border px-1 py-0.2">
                  PHASE 01
                </span>
              </div>
              <p className="font-mono text-3xs text-ink-500 uppercase tracking-wider">
                WORKFLOW INTELLIGENCE
              </p>
            </div>
          </div>
        </div>

        {/* Section Label */}
        <div className="px-4 py-2 bg-surface-subtle/50 border-b border-border-hairline flex items-center justify-between">
          <span className="font-mono text-3xs text-ink-500 uppercase tracking-widest">
            SYSTEM NAVIGATION
          </span>
          <span className="font-mono text-3xs text-ink-400">8 MODULES</span>
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
                      <span className="tracking-wide">{item.name}</span>
                    </div>
                    {item.id === '04' && (
                      <span
                        className={`text-3xs px-1 font-mono ${
                          isActive
                            ? 'bg-vermilion text-white font-bold'
                            : 'bg-vermilion-subtle text-vermilion border border-vermilion-border'
                        }`}
                      >
                        173 AT RISK
                      </span>
                    )}
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
              <span>ONLINE</span>
            </span>
          </div>

          <div className="font-mono text-3xs text-ink-600 space-y-0.5 border-t border-border-hairline pt-1.5">
            <div className="flex justify-between">
              <span className="text-ink-400">DATASET:</span>
              <span className="font-medium text-ink-900">10,482 CASES</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-400">DATA MODE:</span>
              <span
                className={`font-semibold ${
                  isMock ? 'text-amberRisk' : 'text-sageSuccess'
                }`}
              >
                {isMock ? 'SYNTHETIC' : 'FASTAPI LIVE'}
              </span>
            </div>
          </div>
        </div>

        <div className="px-1 flex items-center justify-between text-3xs font-mono text-ink-400">
          <span>GOIP.GOV.IN</span>
          <span>v1.0.4-PROD</span>
        </div>
      </div>
    </aside>
  );
};
