import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/utils';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/auth-store';

// Icons
const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const SettingsIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const LogoutIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

export interface UserMenuProps {
  className?: string;
}

export const UserMenu: React.FC<UserMenuProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  
  const { user, logout } = useAuthStore();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
    setIsOpen(false);
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName || !lastName) return 'U';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getDisplayName = () => {
    if (!user) return 'User';
    return `${user.firstName} ${user.lastName}`.trim() || user.email;
  };

  return (
    <div className={cn("relative", className)}>
      {/* User menu button */}
      <Button
        ref={buttonRef}
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 h-auto"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User menu"
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
          {user?.avatar ? (
            <img 
              src={user.avatar} 
              alt={getDisplayName()}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            getInitials(user?.firstName, user?.lastName)
          )}
        </div>

        {/* Name and chevron (hidden on mobile) */}
        <div className="hidden sm:flex items-center space-x-1">
          <span className="text-sm font-medium text-foreground">
            {getDisplayName()}
          </span>
          <ChevronDownIcon className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )} />
        </div>
      </Button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 mt-2 w-56 bg-popover border rounded-lg shadow-lg z-50 animate-slide-down"
          role="menu"
          aria-orientation="vertical"
        >
          {/* User info */}
          <div className="px-4 py-3 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={getDisplayName()}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  getInitials(user?.firstName, user?.lastName)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {getDisplayName()}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <Link
              to="/profile"
              className="flex items-center space-x-3 px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              role="menuitem"
              onClick={() => setIsOpen(false)}
            >
              <UserIcon className="h-4 w-4" />
              <span>Profile</span>
            </Link>

            <Link
              to="/settings"
              className="flex items-center space-x-3 px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              role="menuitem"
              onClick={() => setIsOpen(false)}
            >
              <SettingsIcon className="h-4 w-4" />
              <span>Settings</span>
            </Link>
          </div>

          {/* Logout */}
          <div className="border-t py-1">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              role="menuitem"
            >
              <LogoutIcon className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;