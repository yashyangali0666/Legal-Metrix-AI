import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { TopNav } from '../components/TopNav';
import { UserRole } from '../types';
import { ApiService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const MainLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, switchRole } = useAuth();
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    // Fetch pending verifications count
    ApiService.getPendingVerifications()
      .then((items) => setPendingCount(items.length))
      .catch(() => setPendingCount(0));
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-pageBg dark:bg-pageBgDark">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        pendingCount={pendingCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav
          currentUser={user}
          onSwitchRole={switchRole}
          pendingCount={pendingCount}
        />

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
