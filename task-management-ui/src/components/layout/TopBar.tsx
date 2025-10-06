import React from 'react';
import { cn } from '@/utils';
import { Button } from '@/components/ui/Button';
import { Breadcrumbs } from './Breadcrumbs';
import { UserMenu } from './UserMenu';
import { NotificationBell } from './NotificationBell';
import { SearchBar } from './SearchBar';
import type { BreadcrumbItem } from '@/types';

// Icons
const MenuIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

export interface TopBarProps {
  title?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  onMenuClick?: () => void;
  showMenuButton?: boolean;
  showSearch?: boolean;
  className?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  breadcrumbs,
  actions,
  onMenuClick,
  showMenuButton = true,
  showSearch = true,
  className,
}) => {
  return (
    <header className={cn(
      "page-header sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      className
    )}>
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left section */}
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          {showMenuButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuClick}
              className="lg:hidden p-2"
              aria-label="Open menu"
            >
              <MenuIcon className="h-5 w-5" />
            </Button>
          )}

          {/* Title and Breadcrumbs */}
          <div className="flex flex-col">
            {breadcrumbs && breadcrumbs.length > 0 ? (
              <Breadcrumbs items={breadcrumbs} />
            ) : title ? (
              <h1 className="text-lg font-semibold text-foreground">{title}</h1>
            ) : null}
          </div>
        </div>

        {/* Center section - Search */}
        {showSearch && (
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <SearchBar />
          </div>
        )}

        {/* Right section */}
        <div className="flex items-center space-x-2">
          {/* Mobile search button */}
          {showSearch && (
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                className="p-2"
                aria-label="Search"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </Button>
            </div>
          )}

          {/* Custom actions */}
          {actions}

          {/* Notifications */}
          <NotificationBell />

          {/* User menu */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default TopBar;