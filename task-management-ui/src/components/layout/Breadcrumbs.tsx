import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/utils';
import type { BreadcrumbItem } from '@/types';

// Icons
const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const HomeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ 
  items, 
  className,
  showHome = true 
}) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <nav 
      className={cn("flex items-center space-x-1 text-sm", className)}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-1">
        {/* Home link */}
        {showHome && (
          <li>
            <Link
              to="/dashboard"
              className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Home"
            >
              <HomeIcon className="h-4 w-4" />
            </Link>
          </li>
        )}

        {/* Breadcrumb items */}
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isActive = item.isActive || isLast;

          return (
            <React.Fragment key={index}>
              {/* Separator */}
              {(showHome || index > 0) && (
                <li>
                  <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
                </li>
              )}

              {/* Breadcrumb item */}
              <li>
                {item.href && !isActive ? (
                  <Link
                    to={item.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span 
                    className={cn(
                      isActive 
                        ? "text-foreground font-medium" 
                        : "text-muted-foreground"
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {item.label}
                  </span>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;