import React from 'react';
import { cn } from '../../utils';
import type { TextareaProps } from '../../types';

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className, 
    label, 
    error,
    required,
    ...props 
  }, ref) => {
    const textareaId = React.useId();
    const errorId = React.useId();

    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={textareaId}
            className={cn(
              'text-sm font-medium leading-none',
              'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
              required && "after:content-['*'] after:ml-0.5 after:text-red-500"
            )}
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            // Base styles
            'flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm',
            'ring-offset-background',
            'placeholder:text-gray-500',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'resize-vertical',
            // Conditional styles
            error 
              ? 'border-red-500 bg-red-50 focus-visible:ring-red-500' 
              : 'border-gray-300 bg-white',
            className
          )}
          {...props}
        />
        {error && (
          <p id={errorId} className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';