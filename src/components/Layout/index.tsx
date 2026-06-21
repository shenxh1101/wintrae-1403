import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileTabs } from './MobileTabs';
import { useAppStore } from '@/store/useAppStore';

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentView, setCurrentView } = useAppStore();

  return (
    <div className="min-h-screen bg-background-cream">
      <div className="flex">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentView={currentView}
          onViewChange={(view) => {
            setCurrentView(view);
            setSidebarOpen(false);
          }}
        />

        <div className="flex-1 min-w-0">
          <Header onMenuClick={() => setSidebarOpen(true)} />

          <main className="p-4 lg:p-6 pb-20 lg:pb-6 animate-fade-in">
            <Outlet />
          </main>
        </div>
      </div>

      <MobileTabs currentView={currentView} />
    </div>
  );
};
