import React from 'react';
import { Outlet } from 'react-router-dom';
import { GovMainHeader } from './GovMainHeader';
import { GovBreadcrumb } from './GovBreadcrumb';
import { GovFooter } from './GovFooter';
import { GlobalSearchModal } from './GlobalSearchModal';

export const AppLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] text-[#0F172A] selection:bg-[#2E0854] selection:text-white font-sans">
      {/* 1. Main Navigation Header (Logo, Nav Tabs, Search, Profile) */}
      <GovMainHeader />

      {/* 2. Breadcrumb Trail */}
      <GovBreadcrumb />

      {/* 3. Main Page Content View */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-4">
        <Outlet />
      </main>

      {/* 4. Institutional Footer */}
      <GovFooter />

      {/* Global Modals */}
      <GlobalSearchModal />
    </div>
  );
};

export default AppLayout;
