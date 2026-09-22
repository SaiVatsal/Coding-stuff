import React from 'react';
import { clsx } from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-[11px] font-semibold text-luxury-muted uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-luxury-faint">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={clsx(
              'w-full px-3.5 py-2.5 bg-white border text-luxury-text placeholder-luxury-faint font-sans text-xs transition-colors duration-150 rounded-none focus:outline-none focus:border-luxury-dark focus:ring-1 focus:ring-luxury-dark disabled:bg-luxury-bg-subtle disabled:text-luxury-muted',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error ? 'border-luxury-red focus:border-luxury-red focus:ring-luxury-red' : 'border-luxury-border',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 flex items-center text-luxury-faint">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-[11px] text-luxury-red font-medium tracking-tight mt-1">{error}</p>}
        {helperText && !error && <p className="text-[11px] text-luxury-muted mt-1">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
