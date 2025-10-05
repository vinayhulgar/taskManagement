import React from 'react';
import { cn } from '@/utils';
import type { SelectProps } from '@/types';

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ 
    className, 
    label, 
    error, 
    disabled = false, 
    required = false,
    placeholder,
    value,
    defaultValue,
    options,
    multiple = false,
    onChange,
    ...props 
  }, ref) => {
    const selectId = React.useId();
    const errorId = React.useId();

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (multiple) {
        const selectedValues = Array.from(e.target.selectedOptions, option => option.value);
        onChange?.(selectedValues);
      } else {
        onChange?.(e.target.value);
      }
    };

    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={selectId}
            className={cn(
              'text-sm font-medium leading-none',
              'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
              required && "after:content-['*'] after:ml-0.5 after:text-error"
            )}
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          required={required}
          value={value}
          defaultValue={defaultValue}
          multiple={multiple}
          onChange={handleChange}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            // Base styles
            'flex h-10 w-full rounded-md border px-3 py-2 text-sm',
            'ring-offset-background',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            // Multiple select height adjustment
            multiple && 'h-auto min-h-[80px]',
            // Conditional styles
            error 
              ? 'border-error bg-error/5 focus-visible:ring-error' 
              : 'border-input bg-background',
            className
          )}
          {...props}
        >
          {placeholder && !multiple && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value} 
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p id={errorId} className="text-sm text-error" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';