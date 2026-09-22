import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  position?: 'right' | 'left';
  width?: 'sm' | 'md' | 'lg';
  footer?: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  position = 'right',
  width = 'md',
  footer,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const widthClasses = {
    sm: 'max-w-xs',
    md: 'max-w-md',
    lg: 'max-w-lg',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity animate-fade-in"
        onClick={onClose}
      />
      <div
        className={clsx(
          'fixed inset-y-0 flex max-w-full pointer-events-none',
          position === 'right' ? 'right-0' : 'left-0'
        )}
      >
        <div
          className={clsx(
            'w-screen pointer-events-auto bg-luxury-bg shadow-drawer flex flex-col',
            widthClasses[width],
            position === 'right' ? 'animate-slide-left' : 'animate-fade-in'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-luxury-border bg-white">
            <div className="font-serif text-lg text-luxury-dark">{title}</div>
            <button
              onClick={onClose}
              className="p-1 text-luxury-muted hover:text-luxury-dark transition-colors"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="p-6 border-t border-luxury-border bg-white">{footer}</div>
          )}
        </div>
      </div>
    </div>
  );
};
