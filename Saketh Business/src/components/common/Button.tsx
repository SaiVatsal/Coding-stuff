import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3.5 py-2 text-[11px]',
    md: 'px-5 py-3 text-xs',
    lg: 'px-7 py-3.5 text-sm',
  };

  const variantClasses = {
    primary: 'bg-luxury-dark text-luxury-bg hover:bg-luxury-charcoal active:scale-[0.99]',
    secondary: 'border border-luxury-border-dark text-luxury-text bg-transparent hover:bg-luxury-bg-subtle active:scale-[0.99]',
    accent: 'bg-luxury-accent text-white hover:bg-luxury-accent-hover active:scale-[0.99]',
    outline: 'border border-luxury-dark text-luxury-dark bg-transparent hover:bg-luxury-dark hover:text-white',
    ghost: 'text-luxury-text hover:text-luxury-accent hover:bg-luxury-bg-subtle',
  };

  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center font-sans font-medium tracking-wider uppercase transition-all duration-150 select-none disabled:opacity-50 disabled:pointer-events-none rounded-none',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin text-current" />
      ) : (
        leftIcon && <span className="mr-2 inline-flex items-center">{leftIcon}</span>
      )}
      {children}
      {!isLoading && rightIcon && (
        <span className="ml-2 inline-flex items-center">{rightIcon}</span>
      )}
    </button>
  );
};
