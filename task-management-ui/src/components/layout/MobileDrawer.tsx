import React, { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/utils';
import type { MenuItem } from '@/types';

// Icons (reusing from Sidebar)
const HomeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const TaskIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

const ProjectIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const TeamIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigationItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: 'home',
  },
  {
    id: 'tasks',
    label: 'Tasks',
    href: '/tasks',
    icon: 'task',
  },
  {
    id: 'projects',
    label: 'Projects',
    href: '/projects',
    icon: 'project',
  },
  {
    id: 'teams',
    label: 'Teams',
    href: '/teams',
    icon: 'team',
  },
];

const iconMap = {
  home: HomeIcon,
  task: TaskIcon,
  project: ProjectIcon,
  team: TeamIcon,
};

export const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose }) => {
  const location = useLocation();

  // Close drawer on route change
  useEffect(() => {
    onClose();
  }, [location.pathname, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-background border-r transform transition-transform duration-300 ease-in-out lg:hidden",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">TM</span>
          </div>
          <span className="font-semibold text-foreground">Task Manager</span>
        </div>
        
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
          aria-label="Close menu"
        >
          <XIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const IconComponent = iconMap[item.icon as keyof typeof iconMap];
          const active = isActive(item.href!);
          
          return (
            <NavLink
              key={item.id}
              to={item.href!}
              className={cn(
                "flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                active && "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              <IconComponent className="h-5 w-5 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className={cn(
                  "px-2 py-0.5 text-xs rounded-full",
                  active 
                    ? "bg-primary-foreground/20 text-primary-foreground" 
                    : "bg-muted text-muted-foreground"
                )}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t">
        <div className="text-xs text-muted-foreground text-center">
          Task Management v1.0
        </div>
      </div>
    </div>
  );
};

export default MobileDrawer;