import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { TopNav } from '../components/TopNav';
import { User, UserRole } from '../types';
import { ApiService } from '../services/api';

export const MainLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState<User>({
    id: 2,
    username: 'inspector_rajesh',
    email: 'rajesh.kumar@legalmetrix.gov.in',
    full_name: 'Rajesh Kumar',
    role: 'inspector',
    department: 'Delhi North District Inspection Unit',
    badge_number: 'LM-DL-N-42',
    is_active: true,
  });
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    // Fetch pending verifications count
    ApiService.getPendingVerifications()
      .then((items) => setPendingCount(items.length))
      .catch(() => setPendingCount(0));
  }, []);

  const handleSwitchRole = (newRole: UserRole) => {
    let name = 'Rajesh Kumar';
    let dept = 'Delhi North District Inspection Unit';
    let badge = 'LM-DL-N-42';
    let uname = 'inspector_rajesh';

    if (newRole === 'admin') {
      name = 'Chief Legal Metrology Controller';
      dept = 'Headquarters Enforcement Cell';
      badge = 'LM-DL-HQ-01';
      uname = 'admin';
    } else if (newRole === 'reviewer') {
      name = 'Anita Sharma';
      dept = 'Statutory Standards Review Board';
      badge = 'LM-REV-07';
      uname = 'reviewer_anita';
    }

    setCurrentUser({
      id: newRole === 'admin' ? 1 : (newRole === 'inspector' ? 2 : 3),
      username: uname,
      email: `${uname}@legalmetrix.gov.in`,
      full_name: name,
      role: newRole,
      department: dept,
      badge_number: badge,
      is_active: true,
    });
  };

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
          currentUser={currentUser}
          onSwitchRole={handleSwitchRole}
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

