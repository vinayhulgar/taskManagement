import React from 'react';
import { cn } from '../../utils';
import type { InputProps } from '../../types';
import { useAccessibilityContext } from '@/contexts/AccessibilityContext';

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type = 'text', 
    label, 
    error,
    'aria-describedby': ariaDescribedBy,
    ...props 
  }, ref) => {
    const inputId = React.useId();
    const errorId = React.useId();
    const { prefersReducedMotion } = useAccessibilityContext();

    const describedBy = [
      error ? errorId : null,
      ariaDescribedBy
    ].filter(Boolean).join(' ') || undefined;

    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={inputId}
            className={cn(
              'text-sm font-medium leading-none',
              'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
              props.required && "after:content-['*'] after:ml-0.5 after:text-red-500"
            )}
          >
            {label}
            {props.required && <span className="sr-only">required</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy}
          aria-required={props.required}
          className={cn(
            // Base styles
            'flex h-10 w-full rounded-md border px-3 py-2 text-sm',
            'ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium',
            'placeholder:text-gray-500',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            // Transition styles (respect reduced motion)
            !prefersReducedMotion && 'transition-colors duration-200',
            // Conditional styles
            error 
              ? 'border-red-500 bg-red-50 focus-visible:ring-red-500' 
              : 'border-gray-300 bg-white focus-visible:ring-blue-500',
            // High contrast support
            'high-contrast:border-2 high-contrast:border-current',
            className
          )}
          {...props}
        />
        {error && (
          <p id={errorId} className="text-sm text-red-600" role="alert" aria-live="polite">
            <span className="sr-only">Error: </span>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';