import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Clock,
  FileText,
  ScanLine,
  Search,
  BrainCircuit,
  GitBranch,
  AlertOctagon,
  Cpu,
  BarChart3,
  ScrollText,
  Building2,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface NavItem {
  name: string;
  key: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  subItems?: { name: string; path: string }[];
}

export const GovHorizontalNav: React.FC = () => {
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    { name: t('nav.dashboard'), key: 'dashboard', path: '/dashboard', icon: LayoutDashboard },
    {
      name: t('nav.files'),
      key: 'files',
      path: '/files',
      icon: FolderKanban,
    },
    {
      name: t('nav.pending'),
      key: 'pending',
      path: '/pending',
      icon: Clock,
      badge: '127',
    },
    {
      name: t('nav.documents'),
      key: 'documents',
      path: '/documents',
      icon: FileText,
    },
    {
      name: t('nav.upload'),
      key: 'upload',
      path: '/documents/upload',
      icon: ScanLine,
    },
    { name: t('nav.search'), key: 'search', path: '/search', icon: Search },
    {
      name: t('nav.intelligence'),
      key: 'intelligence',
      path: '/intelligence',
      icon: BrainCircuit,
    },
    { name: t('nav.workflow'), key: 'workflow', path: '/workflow', icon: GitBranch },
    {
      name: t('nav.risk'),
      key: 'risk',
      path: '/risk',
      icon: AlertOctagon,
    },
    { name: t('nav.simulation'), key: 'simulation', path: '/simulation', icon: Cpu },
    { name: t('nav.reports'), key: 'reports', path: '/reports', icon: BarChart3 },
    { name: t('nav.auditLogs'), key: 'auditLogs', path: '/audit-logs', icon: ScrollText },
    { name: t('nav.departments'), key: 'departments', path: '/departments', icon: Building2 },
  ];

  return (
    <nav className="bg-[#0B2A4A] text-white border-b-2 border-[#D97706] shadow-sm select-none sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-11">
          {/* Desktop Navigation Links */}
          <div className="hidden xl:flex items-center space-x-0.5 overflow-x-auto h-full scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center space-x-1.5 px-3 py-2 text-xs font-sans font-medium whitespace-nowrap transition-colors border-b-2 h-full ${
                      isActive
                        ? 'bg-[#123B63] text-white border-[#FF9933] font-bold shadow-inner'
                        : 'text-gray-200 hover:bg-[#123B63] hover:text-white border-transparent'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0 opacity-90" />
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className="ml-1 px-1 py-0.2 text-[10px] font-bold bg-[#B72025] text-white rounded-[2px]">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Compact Tablet View (Scrollable or condensed) */}
          <div className="hidden md:flex xl:hidden items-center space-x-1 overflow-x-auto h-full">
            {navItems.slice(0, 7).map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center space-x-1 px-2.5 py-1.5 text-xs font-sans whitespace-nowrap transition-colors border-b-2 h-full ${
                      isActive
                        ? 'bg-[#123B63] text-white border-[#FF9933] font-bold'
                        : 'text-gray-200 hover:bg-[#123B63] hover:text-white border-transparent'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5 opacity-90" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex xl:hidden items-center justify-between w-full md:w-auto">
            <span className="md:hidden text-xs font-serif font-bold text-white flex items-center space-x-1.5">
              <span>NIC Government Portal</span>
            </span>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-white hover:bg-[#123B63] rounded-[3px] focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-[#071A2E] border-t border-[#123B63] px-4 py-3 space-y-1 divide-y divide-gray-800">
          <div className="grid grid-cols-2 gap-1 pb-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-3 py-2 text-xs rounded-[3px] font-sans ${
                      isActive
                        ? 'bg-[#123B63] text-white font-bold'
                        : 'text-gray-300 hover:bg-[#123B63] hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span className="truncate">{item.name}</span>
                  {item.badge && (
                    <span className="ml-auto px-1 py-0.2 text-[9px] font-bold bg-[#B72025] text-white rounded-[2px]">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
};
