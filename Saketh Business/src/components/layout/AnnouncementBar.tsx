import React from 'react';
import { X, Sparkles } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';

export const AnnouncementBar: React.FC = () => {
  const { isAnnouncementVisible, dismissAnnouncement } = useUIStore();

  if (!isAnnouncementVisible) return null;

  return (
    <div className="bg-luxury-dark text-luxury-bg text-[11px] font-sans tracking-widest uppercase py-2 px-4 relative flex items-center justify-center border-b border-luxury-charcoal select-none">
      <div className="flex items-center space-x-2 text-center">
        <Sparkles className="w-3 h-3 text-luxury-gold inline" />
        <span>COMPLIMENTARY SHIPPING ACROSS INDIA ON ORDERS ABOVE ₹999</span>
        <span className="hidden sm:inline text-luxury-faint">|</span>
        <span className="hidden sm:inline text-luxury-gold">USE CODE: WELCOME10</span>
      </div>
      <button
        onClick={dismissAnnouncement}
        className="absolute right-3 p-1 text-luxury-faint hover:text-white transition-colors"
        aria-label="Dismiss announcement"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
