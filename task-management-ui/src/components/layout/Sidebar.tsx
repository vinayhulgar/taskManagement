import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/utils';
import { Button } from '@/components/ui/Button';
import type { MenuItem } from '@/types';

// Icons (using simple SVG icons for now)
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

const ChevronLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

export interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
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

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="sidebar flex flex-col h-full">
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between p-4 border-b",
        isCollapsed && "justify-center"
      )}>
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">TM</span>
            </div>
            <span className="font-semibold text-foreground">Task Manager</span>
          </div>
        )}
        
        {isCollapsed && (
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">TM</span>
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className={cn(
            "p-1.5 h-auto",
            isCollapsed && "hidden"
          )}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRightIcon className="h-4 w-4" />
          ) : (
            <ChevronLeftIcon className="h-4 w-4" />
          )}
        </Button>
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
                "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                active && "bg-primary text-primary-foreground hover:bg-primary/90",
                isCollapsed && "justify-center space-x-0"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <IconComponent className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && (
                <>
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
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse toggle for collapsed state */}
      {isCollapsed && (
        <div className="p-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="w-full p-2"
            aria-label="Expand sidebar"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;