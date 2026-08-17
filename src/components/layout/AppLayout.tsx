import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { GlobalSearchModal } from './GlobalSearchModal';
import { SystemStatusDrawer } from './SystemStatusDrawer';

export const AppLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-paper text-ink-900 selection:bg-vermilion selection:text-white">
      {/* Swiss Numbered Navigation Sidebar */}
      <AppSidebar />

      {/* Main Execution View */}
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Modals & System Drawers */}
      <GlobalSearchModal />
      <SystemStatusDrawer />
    </div>
  );
};
