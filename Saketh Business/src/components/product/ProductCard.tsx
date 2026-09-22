import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, ShoppingBag, Check } from 'lucide-react';
import { Product } from '../../types';
import { Badge } from '../common/Badge';
import { useWishlistStore } from '../../store/useWishlistStore';
import { useCartStore } from '../../store/useCartStore';

export interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);
  const [isQuickAdding, setIsQuickAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const { isInWishlist, toggleWishlist } = useWishlistStore();
  const addItemToCart = useCartStore((state) => state.addItem);

  const inWishlist = isInWishlist(product.id);
  const primaryImage = product.images.find((i) => i.is_primary) || product.images[0];
  const secondaryImage = product.images.find((i) => !i.is_primary) || product.images[1] || primaryImage;

  // Stock calculation across variants
  const totalAvailableStock = product.variants.reduce((sum, v) => sum + v.available_stock, 0);
  const isOutOfStock = totalAvailableStock === 0;
  const isLowStock = totalAvailableStock > 0 && totalAvailableStock <= 5;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // If only 1 variant or already selected size
    const targetVariant = selectedSizeId
      ? product.variants.find((v) => v.size_id === selectedSizeId && v.available_stock > 0)
      : product.variants.find((v) => v.available_stock > 0);

    if (targetVariant) {
      const success = addItemToCart(product, targetVariant, 1);
      if (success) {
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 1500);
      }
    }
  };

  return (
    <div
      className="group relative flex flex-col bg-white border border-luxury-border/60 hover:border-luxury-border-dark transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsQuickAdding(false);
      }}
    >
      {/* Image Container with Hover Swap */}
      <Link
        to={`/product/${product.slug}`}
        className="relative w-full aspect-[3/4] bg-luxury-bg-subtle overflow-hidden block"
      >
        <img
          src={isHovered && secondaryImage ? secondaryImage.image_url : primaryImage.image_url}
          alt={primaryImage.alt_text || product.name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
        />

        {/* Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10 pointer-events-none">
          {product.is_new_arrival && <Badge variant="new">New</Badge>}
          {product.discount_percent > 0 && (
            <Badge variant="sale">-{product.discount_percent}%</Badge>
          )}
          {product.is_bestseller && <Badge variant="bestseller">Bestseller</Badge>}
          {isOutOfStock ? (
            <Badge variant="out_of_stock">Sold Out</Badge>
          ) : isLowStock ? (
            <Badge variant="low_stock">Only {totalAvailableStock} Left</Badge>
          ) : null}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className={`absolute top-2.5 right-2.5 z-10 p-2 rounded-none transition-all duration-200 ${
            inWishlist
              ? 'bg-luxury-accent text-white shadow-soft'
              : 'bg-white/90 text-luxury-dark hover:bg-white hover:text-luxury-accent backdrop-blur-sm'
          }`}
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-3.5 h-3.5 ${inWishlist ? 'fill-white' : ''}`} />
        </button>

        {/* Desktop Quick Add Bar on Hover */}
        <div
          className={`hidden md:block absolute bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-luxury-border transition-all duration-300 z-10 ${
            isHovered && !isOutOfStock ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
          }`}
        >
          {isQuickAdding ? (
            <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
              <div className="text-[10px] uppercase font-semibold text-luxury-muted tracking-wider">
                Select Size:
              </div>
              <div className="flex flex-wrap gap-1">
                {product.variants.map((v) => {
                  const available = v.available_stock > 0;
                  return (
                    <button
                      key={v.id}
                      disabled={!available}
                      onClick={() => {
                        setSelectedSizeId(v.size_id);
                        addItemToCart(product, v, 1);
                        setJustAdded(true);
                        setTimeout(() => {
                          setJustAdded(false);
                          setIsQuickAdding(false);
                        }, 1200);
                      }}
                      className={`px-2.5 py-1 text-[11px] font-medium border uppercase transition-colors ${
                        !available
                          ? 'border-luxury-border bg-luxury-bg-hover text-luxury-faint line-through'
                          : selectedSizeId === v.size_id
                          ? 'border-luxury-dark bg-luxury-dark text-white'
                          : 'border-luxury-border bg-white text-luxury-text hover:border-luxury-dark'
                      }`}
                    >
                      {v.size.code}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (product.variants.length > 1) {
                  setIsQuickAdding(true);
                } else {
                  handleQuickAdd(e);
                }
              }}
              className="w-full py-2 bg-luxury-dark text-luxury-bg text-xs font-medium uppercase tracking-wider hover:bg-luxury-charcoal flex items-center justify-center space-x-1.5 transition-colors"
            >
              {justAdded ? (
                <>
                  <Check className="w-3.5 h-3.5 text-luxury-gold" />
                  <span>Added to Bag</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Quick Add</span>
                </>
              )}
            </button>
          )}
        </div>
      </Link>

      {/* Product Details Section */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Brand & Rating row */}
          <div className="flex items-center justify-between text-[11px] text-luxury-muted mb-1">
            <span className="uppercase tracking-wider font-semibold text-luxury-accent">
              {product.brand}
            </span>
            {product.rating_avg > 0 && (
              <div className="flex items-center text-luxury-gold">
                <Star className="w-3 h-3 fill-luxury-gold mr-0.5" />
                <span className="font-semibold text-luxury-dark">{product.rating_avg.toFixed(1)}</span>
                <span className="text-luxury-faint text-[10px] ml-0.5">({product.review_count})</span>
              </div>
            )}
          </div>

          {/* Product Name */}
          <Link
            to={`/product/${product.slug}`}
            className="font-serif text-sm font-medium text-luxury-dark group-hover:text-luxury-accent transition-colors line-clamp-1 mb-1.5 block"
          >
            {product.name}
          </Link>
        </div>

        {/* Price Block */}
        <div className="mt-2 pt-2 border-t border-luxury-border/50 flex items-baseline space-x-2">
          <span className="font-sans font-semibold text-sm sm:text-base text-luxury-dark">
            ₹{product.selling_price.toLocaleString('en-IN')}
          </span>
          {product.mrp > product.selling_price && (
            <span className="text-xs text-luxury-muted line-through">
              ₹{product.mrp.toLocaleString('en-IN')}
            </span>
          )}
          {product.discount_percent > 0 && (
            <span className="text-[11px] font-semibold text-luxury-accent">
              ({product.discount_percent}% off)
            </span>
          )}
        </div>

        {/* Mobile Quick Add Button */}
        <button
          onClick={handleQuickAdd}
          disabled={isOutOfStock}
          className="md:hidden mt-3 w-full py-2 bg-luxury-bg-subtle border border-luxury-border text-luxury-dark text-[11px] font-semibold uppercase tracking-wider hover:bg-luxury-dark hover:text-white transition-colors flex items-center justify-center space-x-1"
        >
          {justAdded ? (
            <>
              <Check className="w-3 h-3 text-luxury-gold" />
              <span>Added</span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-3 h-3" />
              <span>{isOutOfStock ? 'Sold Out' : 'Add to Bag'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
