import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, Tag, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { SEO } from '../components/common/SEO';
import { DEFAULT_STORE_SETTINGS } from '../lib/supabase/service';

export const CartPage: React.FC = () => {
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
    const res = applyCoupon(inputCoupon);
    if (!res.success) {
      setCouponError(res.message);
    } else {
      setInputCoupon('');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <SEO title="Shopping Bag — Nitro Hub" description="Review and manage items in your Nitro Hub shopping bag." />

      <Breadcrumbs items={[{ label: 'Shopping Bag' }]} />

      <div className="pb-4 border-b border-luxury-border">
        <h1 className="font-serif text-3xl sm:text-4xl text-luxury-dark">Shopping Bag</h1>
        <p className="text-xs text-luxury-muted mt-1">
          {items.reduce((s, i) => s + i.quantity, 0)} {items.length === 1 ? 'piece' : 'pieces'} in your bag
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="w-16 h-16 stroke-[1.2]" />}
          title="Your shopping bag is waiting"
          description="You have no items in your bag. Explore our curated selection of breathable linens and handcrafted silhouettes."
          actionText="Explore Collection"
          actionHref="/women"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Items List */}
          <div className="lg:col-span-8 space-y-6">
            {/* Free shipping progress */}
            <div className="bg-luxury-bg-subtle p-4 border border-luxury-border">
              <div className="text-xs font-medium text-luxury-dark mb-2 flex justify-between">
                {amountNeededForFreeShipping > 0 ? (
                  <span>
                    Add <strong className="text-luxury-accent">₹{amountNeededForFreeShipping.toLocaleString('en-IN')}</strong> more for FREE Pan-India shipping!
                  </span>
                ) : (
                  <span className="text-luxury-green font-semibold flex items-center">
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    <span>Complimentary Pan-India Express Shipping Unlocked!</span>
                  </span>
                )}
              </div>
              <div className="w-full bg-luxury-border h-2 overflow-hidden">
                <div
                  className="bg-luxury-accent h-full transition-all duration-300"
                  style={{ width: `${freeShippingProgress}%` }}
                />
              </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-luxury-border divide-y divide-luxury-border">
              {items.map((item) => (
                <div key={item.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  {/* Left: Thumbnail & Info */}
                  <div className="flex items-center space-x-4">
                    <Link
                      to={`/product/${item.product.slug}`}
                      className="w-20 h-24 bg-luxury-bg-subtle border border-luxury-border flex-shrink-0 overflow-hidden"
                    >
                      <img
                        src={item.product.images[0]?.image_url}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </Link>

                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-semibold text-luxury-accent tracking-wider">
                        {item.product.brand}
                      </span>
                      <Link
                        to={`/product/${item.product.slug}`}
                        className="font-serif text-sm font-semibold text-luxury-dark hover:text-luxury-accent block"
                      >
                        {item.product.name}
                      </Link>
                      <div className="text-xs text-luxury-muted">
                        Size: <strong className="text-luxury-dark">{item.variant.size.code}</strong> | Color:{' '}
                        <strong className="text-luxury-dark">{item.variant.color.name}</strong>
                      </div>
                      <div className="text-xs font-semibold text-luxury-dark pt-1">
                        ₹{item.unit_price.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* Right: Quantity Controls & Subtotal */}
                  <div className="flex items-center justify-between w-full sm:w-auto sm:space-x-8">
                    <div className="flex items-center border border-luxury-border bg-white">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-2 text-luxury-muted hover:text-luxury-dark"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-xs font-semibold text-luxury-dark min-w-[28px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.variant.available_stock}
                        className="p-2 text-luxury-muted hover:text-luxury-dark disabled:opacity-30"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-sm font-semibold text-luxury-dark min-w-[80px] text-right">
                      ₹{(item.unit_price * item.quantity).toLocaleString('en-IN')}
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 text-luxury-muted hover:text-luxury-red transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Summary Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Coupon Box */}
            <div className="bg-white p-5 border border-luxury-border space-y-3">
              <h3 className="font-serif text-sm font-semibold text-luxury-dark uppercase tracking-wider">
                Promotions & Coupons
              </h3>

              {appliedCoupon?.is_valid ? (
                <div className="p-3 bg-luxury-accent-light border border-luxury-accent/30 text-xs flex items-center justify-between">
                  <div className="flex items-center text-luxury-accent font-medium">
                    <Tag className="w-4 h-4 mr-1.5 flex-shrink-0" />
                    <span>Coupon <strong>{appliedCoupon.coupon?.code}</strong> active</span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-xs text-luxury-red hover:underline font-semibold"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="space-y-2">
                  <div className="flex">
                    <input
                      type="text"
                      placeholder="Coupon code (e.g. WELCOME10)"
                      value={inputCoupon}
                      onChange={(e) => {
                        setInputCoupon(e.target.value);
                        setCouponError('');
                      }}
                      className="flex-1 px-3 py-2 border border-luxury-border text-xs uppercase placeholder:normal-case focus:outline-none focus:border-luxury-dark"
                    />
                    <Button variant="secondary" size="sm" type="submit" className="border-l-0">
                      Apply
                    </Button>
                  </div>
                  {couponError && <p className="text-[11px] text-luxury-red">{couponError}</p>}
                </form>
              )}
            </div>

            {/* Order Calculations */}
            <div className="bg-white p-6 border border-luxury-border space-y-4">
              <h3 className="font-serif text-base font-semibold text-luxury-dark pb-3 border-b border-luxury-border">
                Order Summary
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-luxury-muted">
                  <span>Bag Subtotal</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-luxury-accent font-medium">
                    <span>Coupon Discount</span>
                    <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between text-luxury-muted">
                  <span>Shipping Fee</span>
                  <span>{shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}</span>
                </div>

                <div className="border-t border-luxury-border pt-3 flex justify-between font-serif text-lg font-bold text-luxury-dark">
                  <span>Total Amount</span>
                  <span>₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="text-[10px] text-luxury-muted text-right">
                  Inclusive of all taxes (GST)
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full shadow-lift mt-4"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={() => navigate('/checkout')}
              >
                Proceed to Checkout
              </Button>

              <div className="flex items-center justify-center space-x-2 text-[11px] text-luxury-muted pt-2">
                <ShieldCheck className="w-4 h-4 text-luxury-accent" />
                <span>Zero-Risk 256-Bit Encrypted Checkout</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
