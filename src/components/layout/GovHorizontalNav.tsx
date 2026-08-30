import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  ShieldCheck,
  ShieldAlert,
  ScrollText,
  BarChart3,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface NavItem {
  name: string;
  nameHi?: string;
  key: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const GovHorizontalNav: React.FC = () => {
  const { t, language } = useLanguage();
  const location = useLocation();
  const navContainerRef = useRef<HTMLDivElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Primary Horizontal Navigation Items — 5-item structure (SIH final round)
  const primaryNavItems: NavItem[] = [
    { name: 'Dashboard', nameHi: 'डैशबोर्ड', key: 'dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Procurement', nameHi: 'खरीद', key: 'tenders', path: '/tenders', icon: FolderKanban },
    { name: 'Verification', nameHi: 'सत्यापन', key: 'verification', path: '/verification', icon: ShieldCheck },
    { name: 'Integrity', nameHi: 'अखंडता', key: 'integrity', path: '/integrity', icon: ShieldAlert },
    { name: 'Audit', nameHi: 'ऑडिट', key: 'audit', path: '/audit-trail', icon: ScrollText },
  ];

  // Secondary Navigation Items grouped in "More ▼" Dropdown
  const secondaryNavItems: NavItem[] = [
    { name: 'Reports', nameHi: 'प्रतिवेदन', key: 'reports', path: '/reports', icon: BarChart3 },
    { name: 'Settings', nameHi: 'सेटिंग्स', key: 'settings', path: '/settings', icon: Settings },
  ];

  const allNavItems = [...primaryNavItems, ...secondaryNavItems];

  const checkScrollability = () => {
    const el = navContainerRef.current;
    if (el) {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      setCanScrollLeft(scrollLeft > 4);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
    }
  };

  useEffect(() => {
    checkScrollability();
    window.addEventListener('resize', checkScrollability);
    return () => window.removeEventListener('resize', checkScrollability);
  }, []);

  // Automatically scroll active link into view
  useEffect(() => {
    const el = navContainerRef.current;
    if (el) {
      const activeLink = el.querySelector('a.active-nav-link') as HTMLElement;
      if (activeLink) {
        const containerRect = el.getBoundingClientRect();
        const activeRect = activeLink.getBoundingClientRect();
        if (activeRect.left < containerRect.left || activeRect.right > containerRect.right) {
          activeLink.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      }
      checkScrollability();
    }
  }, [location.pathname]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = navContainerRef.current;
    if (el) {
      const scrollAmount = 240;
      el.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
      setTimeout(checkScrollability, 300);
    }
  };

  const isSecondaryActive = secondaryNavItems.some((item) =>
    location.pathname.startsWith(item.path)
  );

  return (
    <nav
      className="bg-[#0B3558] text-white border-b-2 border-[#E67E22] shadow-sm select-none sticky top-0 z-30 font-sans"
      aria-label="Departmental Navigation"
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between h-10">
          {/* Left Arrow Button for Slider */}
          <button
            type="button"
            onClick={() => handleScroll('left')}
            disabled={!canScrollLeft}
            aria-label="Scroll navigation left"
            className={`hidden md:flex items-center justify-center w-7 h-8 text-white rounded-[2px] transition-opacity cursor-pointer ${
              canScrollLeft
                ? 'opacity-100 hover:bg-[#123F6D] bg-[#071A2E]'
                : 'opacity-20 cursor-default pointer-events-none'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Desktop & Tablet Scrollable Navigation Track */}
          <div
            ref={navContainerRef}
            onScroll={checkScrollability}
            className="hidden md:flex items-center space-x-0.5 overflow-x-auto h-full scroll-smooth scrollbar-none flex-1 mx-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const displayName = language === 'hi' && item.nameHi ? item.nameHi : item.name;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => {
                    const active = isActive || (item.key === 'verification' && location.pathname.startsWith('/verification'));
                    return `flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 h-full ${
                      active
                        ? 'active-nav-link bg-[#F0F5FA] text-[#0B2A4A] border-[#FF9933] font-semibold'
                        : 'text-gray-200 hover:bg-[#123F6D]/40 hover:text-white border-transparent'
                    }`;
                  }}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0 opacity-90" />
                  <span>{displayName}</span>
                  {item.badge && (
                    <span className="ml-1 px-1.5 py-0.2 text-[9px] font-bold bg-[#B72025] text-white rounded-[2px]">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Right Arrow Button for Slider */}
          <button
            type="button"
            onClick={() => handleScroll('right')}
            disabled={!canScrollRight}
            aria-label="Scroll navigation right"
            className={`hidden md:flex items-center justify-center w-7 h-8 text-white rounded-[2px] transition-opacity cursor-pointer ${
              canScrollRight
                ? 'opacity-100 hover:bg-[#123F6D] bg-[#071A2E]'
                : 'opacity-20 cursor-default pointer-events-none'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* "More ▼" Dropdown Menu */}
          <div className="relative hidden md:block ml-1">
            <button
              type="button"
              onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
              onBlur={() => setTimeout(() => setMoreDropdownOpen(false), 200)}
              className={`flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold rounded-[2px] transition-colors border ${
                isSecondaryActive
                  ? 'bg-[#123F6D] text-white border-[#FF9933]'
                  : 'bg-[#071A2E] text-gray-200 hover:text-white hover:bg-[#123F6D] border-[#174A7C]'
              }`}
            >
              <span>{language === 'hi' ? 'अन्य ▼' : 'More ▼'}</span>
              <ChevronDown className="w-3 h-3 ml-0.5" />
            </button>

            {moreDropdownOpen && (
              <div className="absolute right-0 mt-1 w-56 bg-[#0B3558] border border-[#174A7C] rounded-[2px] shadow-lg py-1 z-50 divide-y divide-[#123F6D]">
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-gray-300 tracking-wider">
                  Governance &amp; Administrative MIS
                </div>
                <div className="py-1">
                  {secondaryNavItems.map((sub) => {
                    const SubIcon = sub.icon;
                    const subName = language === 'hi' && sub.nameHi ? sub.nameHi : sub.name;
                    return (
                      <NavLink
                        key={sub.path}
                        to={sub.path}
                        onClick={() => setMoreDropdownOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center space-x-2 px-3 py-2 text-xs transition-colors ${
                            isActive
                              ? 'bg-[#123F6D] text-white font-bold border-l-2 border-[#FF9933]'
                              : 'text-gray-200 hover:bg-[#123F6D] hover:text-white'
                          }`
                        }
                      >
                        <SubIcon className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{subName}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Mobile Header Banner & Hamburger Toggle */}
          <div className="flex md:hidden items-center justify-between w-full">
            <span className="text-xs font-serif font-bold text-white flex items-center space-x-1.5">
              <span>SIH26100 • GeM Bid Compliance Verification</span>
            </span>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-white hover:bg-[#123F6D] rounded-[2px] focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu (Structured into Functional Sections) */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#071A2E] border-t border-[#123F6D] px-4 py-3 space-y-3 divide-y divide-gray-800">
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1.5">
              Core Operations &amp; Registries
            </span>
            <div className="grid grid-cols-2 gap-1">
              {primaryNavItems.map((item) => {
                const Icon = item.icon;
                const displayName = language === 'hi' && item.nameHi ? item.nameHi : item.name;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center space-x-2 px-2.5 py-2 text-xs rounded-[2px] font-sans ${
                        isActive
                          ? 'bg-[#123F6D] text-white font-bold'
                          : 'text-gray-300 hover:bg-[#123F6D] hover:text-white'
                      }`
                    }
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{displayName}</span>
                    {item.badge && (
                      <span className="ml-auto px-1 py-0.2 text-[8px] font-bold bg-[#B72025] text-white rounded-[1px]">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>

          <div className="pt-2">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1.5">
              Analytics &amp; System Administration
            </span>
            <div className="grid grid-cols-2 gap-1">
              {secondaryNavItems.map((item) => {
                const Icon = item.icon;
                const displayName = language === 'hi' && item.nameHi ? item.nameHi : item.name;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center space-x-2 px-2.5 py-2 text-xs rounded-[2px] font-sans ${
                        isActive
                          ? 'bg-[#123F6D] text-white font-bold'
                          : 'text-gray-300 hover:bg-[#123F6D] hover:text-white'
                      }`
                    }
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{displayName}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default GovHorizontalNav;
