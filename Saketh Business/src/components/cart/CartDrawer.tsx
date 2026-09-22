import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, Tag, CheckCircle2 } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { useUIStore } from '../../store/useUIStore';
import { Drawer } from '../common/Drawer';
import { Button } from '../common/Button';
import { EmptyState } from '../common/EmptyState';
import { DEFAULT_STORE_SETTINGS } from '../../lib/supabase/service';

export const CartDrawer: React.FC = () => {
  const { isCartDrawerOpen, closeCartDrawer } = useUIStore();
  const {
    items,
    subtotal,
    discountAmount,
    couponCode,
    appliedCoupon,
    shippingFee,
    totalAmount,
    updateQuantity,
    removeItem,
    applyCoupon,
    removeCoupon,
  } = useCartStore();

  const [inputCoupon, setInputCoupon] = useState('');
  const [couponError, setCouponError] = useState('');
  const navigate = useNavigate();

  const freeShippingThreshold = DEFAULT_STORE_SETTINGS.free_shipping_threshold;
  const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingProgress = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCoupon.trim()) return;
    setCouponError('');
    const res = useCartStore.getState().applyCoupon(inputCoupon);
    if (!res.success) {
      setCouponError(res.message);
    } else {
      setInputCoupon('');
    }
  };

  const handleCheckoutClick = () => {
    closeCartDrawer();
    navigate('/checkout');
  };

  return (
    <Drawer
      isOpen={isCartDrawerOpen}
      onClose={closeCartDrawer}
      title={
        <div className="flex items-center space-x-2">
          <span>Your Bag</span>
          <span className="text-xs font-sans text-luxury-muted font-normal">
            ({items.reduce((s, i) => s + i.quantity, 0)} {items.length === 1 ? 'item' : 'items'})
          </span>
        </div>
      }
      footer={
        items.length > 0 ? (
          <div className="space-y-4">
            {/* Price Calculations */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-luxury-muted">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-luxury-accent font-medium">
                  <span className="flex items-center">
                    <Tag className="w-3 h-3 mr-1" />
                    <span>Coupon ({appliedCoupon?.coupon?.code})</span>
                  </span>
                  <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between text-luxury-muted">
                <span>Estimated Shipping</span>
                <span>{shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}</span>
              </div>

              <div className="border-t border-luxury-border pt-2 flex justify-between font-serif text-base font-semibold text-luxury-dark">
                <span>Estimated Total</span>
                <span>₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Checkout Action */}
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={handleCheckoutClick}
            >
              Proceed to Checkout
            </Button>
          </div>
        ) : null
      }
    >
      {items.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="w-12 h-12 stroke-[1.2]" />}
          title="Your bag is empty"
          description="Discover our collection of handcrafted fabrics and modern silhouettes."
          actionText="Explore Collection"
          actionHref="/women"
          onAction={closeCartDrawer}
        />
      ) : (
        <div className="space-y-6">
          {/* Free Shipping Progress Indicator */}
          <div className="bg-luxury-bg-subtle p-3 border border-luxury-border/80">
            <div className="text-[11px] font-medium text-luxury-dark mb-1.5 flex justify-between">
              {amountNeededForFreeShipping > 0 ? (
                <span>
                  Add <strong className="text-luxury-accent">₹{amountNeededForFreeShipping.toLocaleString('en-IN')}</strong> more for FREE Pan-India shipping!
                </span>
              ) : (
                <span className="text-luxury-green font-semibold flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  <span>Complimentary Shipping Unlocked!</span>
                </span>
              )}
            </div>
            <div className="w-full bg-luxury-border h-1.5 overflow-hidden">
              <div
                className="bg-luxury-accent h-full transition-all duration-300"
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="space-y-4 divide-y divide-luxury-border/60">
            {items.map((item) => (
              <div key={item.id} className="pt-4 first:pt-0 flex space-x-3">
                {/* Thumbnail */}
                <Link
                  to={`/product/${item.product.slug}`}
                  onClick={closeCartDrawer}
                  className="w-20 h-24 bg-luxury-bg-subtle flex-shrink-0 overflow-hidden border border-luxury-border"
                >
                  <img
                    src={item.product.images[0]?.image_url}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </Link>

                {/* Info & Quantity */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <Link
                        to={`/product/${item.product.slug}`}
                        onClick={closeCartDrawer}
                        className="text-xs font-serif text-luxury-dark hover:text-luxury-accent line-clamp-1"
                      >
                        {item.product.name}
                      </Link>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-luxury-muted hover:text-luxury-red p-0.5 transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-[11px] text-luxury-muted mt-0.5">
                      Size: <span className="font-semibold text-luxury-dark">{item.variant.size.code}</span> | Color:{' '}
                      <span className="font-semibold text-luxury-dark">{item.variant.color.name}</span>
                    </div>

                    <div className="text-xs font-semibold text-luxury-dark mt-1">
                      ₹{item.unit_price.toLocaleString('en-IN')}
                    </div>
                  </div>

                  {/* Quantity Control */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-luxury-border bg-white">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1.5 text-luxury-muted hover:text-luxury-dark transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 text-xs font-semibold text-luxury-dark min-w-[24px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.variant.available_stock}
                        className="p-1.5 text-luxury-muted hover:text-luxury-dark disabled:opacity-30 transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-xs font-medium text-luxury-dark">
                      ₹{(item.unit_price * item.quantity).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Coupon Code Section */}
          <div className="pt-2 border-t border-luxury-border">
            {appliedCoupon?.is_valid ? (
              <div className="flex items-center justify-between p-2.5 bg-luxury-accent-light border border-luxury-accent/30 text-xs">
                <div className="flex items-center text-luxury-accent font-medium">
                  <Tag className="w-3.5 h-3.5 mr-1.5" />
                  <span>Code <strong>{appliedCoupon.coupon?.code}</strong> active</span>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-xs text-luxury-red hover:underline font-medium"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-luxury-muted">
                  Promotional Code
                </label>
                <div className="flex">
                  <input
                    type="text"
                    placeholder="e.g. WELCOME10, NITRO500"
                    value={inputCoupon}
                    onChange={(e) => {
                      setInputCoupon(e.target.value);
                      setCouponError('');
                    }}
                    className="flex-1 px-3 py-2 bg-white border border-luxury-border text-xs uppercase placeholder:normal-case placeholder-luxury-faint focus:outline-none focus:border-luxury-dark"
                  />
                  <Button variant="secondary" size="sm" type="submit" className="border-l-0">
                    Apply
                  </Button>
                </div>
                {couponError && <p className="text-[11px] text-luxury-red mt-1">{couponError}</p>}
              </form>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
};
