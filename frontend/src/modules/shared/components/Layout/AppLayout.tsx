/**
 * App Layout
 * Layout principal da aplicação com sidebar e topbar
 */

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { GlobalSearch, useGlobalSearch } from '../../../crm/components/GlobalSearch';

interface AppLayoutProps {
  children?: React.ReactNode;
}

/**
 * Layout principal da aplicação
 */
export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isOpen: searchOpen, setIsOpen: setSearchOpen } = useGlobalSearch();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TopBar */}
        <TopBar
          onMenuClick={toggleSidebar}
          sidebarOpen={sidebarOpen}
          onSearchClick={() => setSearchOpen(true)}
        />

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          {children || <Outlet />}
        </main>
      </div>

      {/* Global Search Modal (Cmd+K / Ctrl+K) */}
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
};

export default AppLayout;
