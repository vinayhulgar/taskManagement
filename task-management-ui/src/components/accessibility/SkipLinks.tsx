import React from 'react';
import { cn } from '@/utils';

export const SkipLinks: React.FC = () => {
  return (
    <div className="skip-links">
      <a
        href="#main-content"
        className={cn(
          'sr-only focus:not-sr-only',
          'absolute top-4 left-4 z-50',
          'px-4 py-2 bg-primary text-primary-foreground',
          'rounded-md font-medium text-sm',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary'
        )}
      >
        Skip to main content
      </a>
      <a
        href="#navigation"
        className={cn(
          'sr-only focus:not-sr-only',
          'absolute top-4 left-32 z-50',
          'px-4 py-2 bg-primary text-primary-foreground',
          'rounded-md font-medium text-sm',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary'
        )}
      >
        Skip to navigation
      </a>
      <a
        href="#search"
        className={cn(
          'sr-only focus:not-sr-only',
          'absolute top-4 left-60 z-50',
          'px-4 py-2 bg-primary text-primary-foreground',
          'rounded-md font-medium text-sm',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary'
        )}
      >
        Skip to search
      </a>
    </div>
  );
};