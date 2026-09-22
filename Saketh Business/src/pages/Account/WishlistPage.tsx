import React from 'react';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { useWishlistStore } from '../../store/useWishlistStore';
import { useCartStore } from '../../store/useCartStore';
import { useUIStore } from '../../store/useUIStore';
import { ProductCard } from '../../components/product/ProductCard';
import { EmptyState } from '../../components/common/EmptyState';
import { Button } from '../../components/common/Button';

export const WishlistPage: React.FC = () => {
  const { items, clearWishlist } = useWishlistStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-luxury-border">
        <div>
          <h2 className="font-serif text-xl text-luxury-dark font-semibold">Your Wishlist</h2>
          <p className="text-xs text-luxury-muted">
            {items.length} {items.length === 1 ? 'saved piece' : 'saved pieces'}
          </p>
        </div>

        {items.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearWishlist}>
            Clear Wishlist
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-white p-8 border border-luxury-border">
          <EmptyState
            icon={<Heart className="w-12 h-12 stroke-[1.2]" />}
            title="Your wishlist is empty"
            description="Save your favorite silhouettes and seasonal edits here to revisit anytime."
            actionText="Discover Styles"
            actionHref="/women"
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};
