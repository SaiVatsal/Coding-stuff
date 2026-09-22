import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export interface StockUrgencyProps {
  availableStock: number;
  selectedSizeCode?: string;
}

export const StockUrgency: React.FC<StockUrgencyProps> = ({
  availableStock,
  selectedSizeCode,
}) => {
  if (availableStock <= 0) {
    return (
      <div className="flex items-center space-x-1.5 text-xs text-luxury-red font-medium">
        <AlertCircle className="w-4 h-4 text-luxury-red flex-shrink-0" />
        <span>Currently out of stock{selectedSizeCode ? ` in size ${selectedSizeCode}` : ''}.</span>
      </div>
    );
  }

  if (availableStock <= 3) {
    return (
      <div className="flex items-center space-x-1.5 text-xs text-luxury-accent font-semibold animate-fade-in">
        <AlertCircle className="w-4 h-4 text-luxury-accent flex-shrink-0" />
        <span>Only {availableStock} {availableStock === 1 ? 'piece' : 'pieces'} remaining{selectedSizeCode ? ` in size ${selectedSizeCode}` : ''} — order soon.</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-1.5 text-xs text-luxury-green font-medium">
      <CheckCircle2 className="w-4 h-4 text-luxury-green flex-shrink-0" />
      <span>In stock & ready for express dispatch.</span>
    </div>
  );
};
