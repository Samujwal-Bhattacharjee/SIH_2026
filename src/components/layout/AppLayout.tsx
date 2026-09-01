import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { GovMainHeader } from './GovMainHeader';
import { GovBreadcrumb } from './GovBreadcrumb';
import { GovFooter } from './GovFooter';
import { GlobalSearchModal } from './GlobalSearchModal';
import { PetroleumBackground } from '../background/PetroleumBackground';
import { usePetroleumBackground } from '../../context/BackgroundContext';

export const AppLayout: React.FC = () => {
  const { isPeekMode, glassIntensity } = usePetroleumBackground();
  const location = useLocation();

  return (
    <div
      data-glass={glassIntensity}
      className={`flex flex-col min-h-screen text-[#0F172A] selection:bg-[#2E0854] selection:text-white font-sans relative overflow-x-hidden ${
        isPeekMode ? 'peek-active' : ''
      }`}
    >
      {/* 0. Multi-layer Petroleum Industrial Backdrop */}
      <PetroleumBackground />

      {/* 1. Main Navigation Header (Translucent Frosted Glass) */}
      <div className={`transition-all duration-300 z-30 sticky top-0 ${isPeekMode ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
        <GovMainHeader />
      </div>

      {/* 2. Breadcrumb Trail */}
      <div className={`transition-all duration-300 z-20 ${isPeekMode ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
        <GovBreadcrumb />
      </div>

      {/* 3. Main Page Content View with Smooth Glass Glide Route Transition */}
      <main
        id="main-content"
        key={location.pathname}
        className={`flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-4 relative z-10 animate-glass-glide transition-all duration-300 ${
          isPeekMode ? 'opacity-10 pointer-events-none' : 'opacity-100'
        }`}
      >
        <Outlet />
      </main>

      {/* 4. Institutional Footer (Translucent Frosted Glass) */}
      <div className={`transition-all duration-300 z-20 ${isPeekMode ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
        <GovFooter />
      </div>

      {/* Global Modals */}
      <GlobalSearchModal />
    </div>
  );
};

export default AppLayout;
