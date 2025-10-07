import React from 'react';
import { cn } from '@/utils';
import type { ButtonProps } from '@/types';
import { useAccessibilityContext } from '@/contexts/AccessibilityContext';

const buttonVariants = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary btn-primary',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-secondary btn-secondary',
  outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring btn-outline',
  ghost: 'hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring btn-ghost',
  destructive: 'bg-error text-error-foreground hover:bg-error/90 focus-visible:ring-error btn-destructive',
};

const buttonSizes = {
  sm: 'h-9 px-3 text-sm btn-sm',
  md: 'h-10 px-4 py-2 text-sm btn-md',
  lg: 'h-11 px-8 text-base btn-lg',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    disabled = false, 
    loading = false, 
    children, 
    type = 'button',
    onClick,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    ...props 
  }, ref) => {
    const isDisabled = disabled || loading;
    const { prefersReducedMotion } = useAccessibilityContext();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (onClick && !isDisabled) {
        onClick(e);
      }
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        onClick={handleClick}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-disabled={isDisabled}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center rounded-md font-medium',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:pointer-events-none',
          // Transition styles (respect reduced motion)
          !prefersReducedMotion && 'transition-colors duration-200',
          // Variant styles
          buttonVariants[variant],
          // Size styles
          buttonSizes[size],
          // Loading state
          loading && 'cursor-wait',
          // High contrast support
          'high-contrast:border-2 high-contrast:border-current',
          className
        )}
        {...props}
      >
        {loading && (
          <svg
            className={cn(
              "mr-2 h-4 w-4",
              !prefersReducedMotion && "animate-spin"
            )}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
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
        )}
        {loading && <span className="sr-only">Loading...</span>}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';