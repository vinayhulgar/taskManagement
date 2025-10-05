import React from 'react';
import { cn } from '@/utils';
import type { BaseComponentProps } from '@/types';

export interface LoadingProps extends BaseComponentProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  overlay?: boolean;
}

const spinnerSizes = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export const Spinner: React.FC<LoadingProps> = ({ 
  size = 'md', 
  className,
  ...props 
}) => {
  return (
    <svg
      className={cn(
        'animate-spin text-current',
        spinnerSizes[size],
        className
      )}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      {...props}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

export const Loading: React.FC<LoadingProps> = ({ 
  size = 'md', 
  text = 'Loading...', 
  overlay = false,
  className,
  ...props 
}) => {
  const content = (
    <div
      className={cn(
        'flex items-center justify-center space-x-2',
        overlay && 'min-h-[200px]',
        className
      )}
      {...props}
    >
      <Spinner size={size} />
      {text && (
        <span className="text-sm text-muted-foreground">
          {text}
        </span>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
};

export interface SkeletonProps extends BaseComponentProps {
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  lines = 1,
  className,
  ...props
}) => {
  const baseClasses = 'animate-pulse bg-muted rounded';
  
  if (variant === 'text' && lines > 1) {
    return (
      <div className={cn('space-y-2', className)} {...props}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(
              baseClasses,
              'h-4',
              index === lines - 1 && 'w-3/4' // Last line is shorter
            )}
            style={{ width: index === lines - 1 ? undefined : width }}
          />
        ))}
      </div>
    );
  }

  const variantClasses = {
    text: 'h-4',
    rectangular: 'h-20',
    circular: 'rounded-full aspect-square',
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )}
      style={{ width, height }}
      {...props}
    />
  );
};

// Skeleton components for common UI patterns
export const SkeletonCard: React.FC<BaseComponentProps> = ({ className, ...props }) => (
  <div className={cn('space-y-3 p-4', className)} {...props}>
    <Skeleton variant="rectangular" height="120px" />
    <div className="space-y-2">
      <Skeleton variant="text" />
      <Skeleton variant="text" width="60%" />
    </div>
  </div>
);

export const SkeletonList: React.FC<{ items?: number } & BaseComponentProps> = ({ 
  items = 3, 
  className, 
  ...props 
}) => (
  <div className={cn('space-y-3', className)} {...props}>
    {Array.from({ length: items }).map((_, index) => (
      <div key={index} className="flex items-center space-x-3">
        <Skeleton variant="circular" width="40px" height="40px" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" />
          <Skeleton variant="text" width="70%" />
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; cols?: number } & BaseComponentProps> = ({ 
  rows = 5, 
  cols = 4, 
  className, 
  ...props 
}) => (
  <div className={cn('space-y-3', className)} {...props}>
    {/* Header */}
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: cols }).map((_, index) => (
        <Skeleton key={index} variant="text" height="20px" />
      ))}
    </div>
    
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, colIndex) => (
          <Skeleton key={colIndex} variant="text" />
        ))}
      </div>
    ))}
  </div>
);