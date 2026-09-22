import React from 'react';
import { clsx } from 'clsx';

export interface BadgeProps {
  variant?: 'new' | 'sale' | 'low_stock' | 'out_of_stock' | 'bestseller' | 'neutral' | 'verified';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', children, className }) => {
  const variantStyles = {
    new: 'bg-luxury-bg-subtle text-luxury-dark border-luxury-border-dark',
    sale: 'bg-luxury-accent-light text-luxury-accent border-luxury-accent/30 font-semibold',
    low_stock: 'bg-luxury-gold-light text-luxury-gold border-luxury-gold/30',
    out_of_stock: 'bg-luxury-bg-hover text-luxury-muted border-luxury-border line-through',
    bestseller: 'bg-luxury-dark text-white border-luxury-dark',
    neutral: 'bg-white text-luxury-muted border-luxury-border',
    verified: 'bg-luxury-green-light text-luxury-green border-luxury-green/30',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 text-[10px] font-sans tracking-widest uppercase border select-none',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
};
