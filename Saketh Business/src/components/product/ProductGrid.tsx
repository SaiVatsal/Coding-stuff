import React from 'react';
import { Product } from '../../types';
import { ProductCard } from './ProductCard';
import { EmptyState } from '../common/EmptyState';
import { Filter } from 'lucide-react';

export interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  onResetFilters?: () => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading = false,
  onResetFilters,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white border border-luxury-border animate-pulse p-4 space-y-4">
            <div className="w-full aspect-[3/4] bg-luxury-bg-subtle" />
            <div className="space-y-2">
              <div className="h-3 bg-luxury-bg-subtle w-1/3" />
              <div className="h-4 bg-luxury-bg-subtle w-3/4" />
              <div className="h-4 bg-luxury-bg-subtle w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        icon={<Filter className="w-12 h-12 stroke-[1.2]" />}
        title="No matching styles found"
        description="We couldn't find any pieces matching your chosen filter criteria. Try adjusting your filters or price range."
        actionText="Reset All Filters"
        onAction={onResetFilters}
      />
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};
