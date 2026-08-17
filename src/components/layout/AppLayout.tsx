import React from 'react';
import { Outlet } from 'react-router-dom';
import { GovTopStrip } from './GovTopStrip';
import { GovMainHeader } from './GovMainHeader';
import { GovHorizontalNav } from './GovHorizontalNav';
import { GovNotificationTicker } from './GovNotificationTicker';
import { GovBreadcrumb } from './GovBreadcrumb';
import { GovFooter } from './GovFooter';
import { GlobalSearchModal } from './GlobalSearchModal';

export const AppLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-[#F5F6F8] text-[#202124] selection:bg-[#0B2A4A] selection:text-white">
      {/* 1. Top Utility Strip (Accessibility, Language, Font Size) */}
      <GovTopStrip />

      {/* 2. Main Institutional Header (Emblem, Title, Officer Profile) */}
      <GovMainHeader />

      {/* 3. Horizontal Government Navigation Bar */}
      <GovHorizontalNav />

      {/* 4. Official Government Notification & Circular Marquee Bar */}
      <GovNotificationTicker />

      {/* 5. Breadcrumb & Operational Status Strip */}
      <GovBreadcrumb />

      {/* 6. Main Execution View */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>

      {/* 7. Official Government Footer */}
      <GovFooter />

      {/* Global Modals */}
      <GlobalSearchModal />
    </div>
  );
};
