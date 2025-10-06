import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '@/utils';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileDrawer } from './MobileDrawer';

export interface AppLayoutProps {
  children?: React.ReactNode;
  sidebar?: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ 
  children, 
  sidebar = true 
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);
  const toggleCollapsed = () => setSidebarCollapsed(!sidebarCollapsed);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile drawer overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <div className="flex h-screen">
        {/* Desktop Sidebar */}
        {sidebar && (
          <div className={cn(
            "hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 z-50 transition-all duration-300",
            sidebarCollapsed ? "lg:w-16" : "lg:w-64"
          )}>
            <Sidebar 
              isCollapsed={sidebarCollapsed}
              onToggle={toggleCollapsed}
            />
          </div>
        )}

        {/* Mobile Drawer */}
        {sidebar && (
          <MobileDrawer 
            isOpen={sidebarOpen}
            onClose={closeSidebar}
          />
        )}

        {/* Main content area */}
        <div className={cn(
          "flex flex-col flex-1 min-w-0",
          sidebar && "lg:pl-64",
          sidebar && sidebarCollapsed && "lg:pl-16"
        )}>
          {/* Top bar */}
          <TopBar 
            onMenuClick={toggleSidebar}
            showMenuButton={sidebar}
          />

          {/* Main content */}
          <main className="flex-1 overflow-auto">
            <div className="main-content">
              {children || <Outlet />}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;