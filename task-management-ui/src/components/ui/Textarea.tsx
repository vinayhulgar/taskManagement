import React from 'react';
import { cn } from '@/utils';
import type { TextareaProps } from '@/types';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement, 
  TextareaProps & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, keyof TextareaProps>
>(({ 
    className, 
    label, 
    error, 
    disabled = false, 
    required = false,
    placeholder,
    value,
    defaultValue,
    onChange,
    rows = 3,
    ...props 
  }, ref) => {
    const textareaId = React.useId();
    const errorId = React.useId();

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(e.target.value);
    };

    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={textareaId}
            className={cn(
              'text-sm font-medium leading-none',
              'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
              required && "after:content-['*'] after:ml-0.5 after:text-error"
            )}
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          value={value}
          defaultValue={defaultValue}
          rows={rows}
          onChange={handleChange}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            // Base styles
            'flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm',
            'ring-offset-background',
            'placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'resize-vertical',
            // Conditional styles
            error 
              ? 'border-error bg-error/5 focus-visible:ring-error' 
              : 'border-input bg-background',
            className
          )}
          {...props}
        />
        {error && (
          <p id={errorId} className="text-sm text-error" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';