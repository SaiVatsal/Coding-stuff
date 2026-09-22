import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ShieldCheck,
  CreditCard,
  Truck,
  CheckCircle2,
  Lock,
  ArrowRight,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { SEO } from '../components/common/SEO';
import { lookupIndianPincode } from '../lib/pincode/delivery';
import { calculateOrderGST } from '../lib/gst/calculator';
import { nitroDataService } from '../lib/supabase/service';
import { Address } from '../types';

// Zod Address & Checkout Validation Schema
const checkoutSchema = z.object({
  recipient_name: z.string().min(2, 'Recipient name is required (min 2 characters)'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  email: z.string().email('Enter a valid email address'),
  address_line1: z.string().min(5, 'Address line 1 is required'),
  address_line2: z.string().optional(),
  landmark: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, 'Enter a valid 6-digit Indian PIN code'),
  paymentMethod: z.enum(['razorpay_upi', 'razorpay_card', 'razorpay_netbanking', 'cod']),
  notes: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, subtotal, discountAmount, couponCode, shippingFee, clearCart } = useCartStore();
  const { user, addresses, addAddress } = useAuthStore();

  const [step, setStep] = useState<1 | 2>(1); // 1: Address & Shipping, 2: Payment & Review
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    addresses[0]?.id || null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const defaultAddr = addresses.find((a) => a.id === selectedAddressId) || addresses[0];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      recipient_name: defaultAddr?.recipient_name || user?.full_name || '',
      phone: defaultAddr?.phone || user?.phone || '',
      email: user?.email || '',
      address_line1: defaultAddr?.address_line1 || '',
      address_line2: defaultAddr?.address_line2 || '',
      landmark: defaultAddr?.landmark || '',
      city: defaultAddr?.city || '',
      state: defaultAddr?.state || '',
      pincode: defaultAddr?.pincode || '',
      paymentMethod: 'razorpay_upi',
    },
  });

  const watchedPincode = watch('pincode');
  const watchedState = watch('state') || 'Karnataka';
  const watchedPaymentMethod = watch('paymentMethod');

  // Auto lookup pincode
  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue('pincode', val);
    if (val.length === 6 && /^[1-9][0-9]{5}$/.test(val)) {
      const res = lookupIndianPincode(val);
      if (res) {
        setValue('city', res.city);
        setValue('state', res.state);
      }
    }
  };

  // Indian GST calculation
  const gstBreakdown = calculateOrderGST(
    items.map((i) => ({ unit_price: i.unit_price, quantity: i.quantity })),
    watchedState,
    discountAmount
  );

  const codFee = watchedPaymentMethod === 'cod' ? 49 : 0;
  const finalPayableTotal = Math.max(0, subtotal - discountAmount + shippingFee + codFee);

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-serif text-2xl text-luxury-dark">Your Bag is Empty</h2>
        <p className="text-xs text-luxury-muted">You cannot proceed to checkout with an empty bag.</p>
        <Link to="/women">
          <Button variant="primary">Explore Catalog</Button>
        </Link>
      </div>
    );
  }

  const onProcessOrder = (data: CheckoutFormData) => {
    setIsProcessing(true);
    setOrderError(null);

    const shippingAddress: Address = {
      id: `addr-${Date.now()}`,
      recipient_name: data.recipient_name,
      phone: data.phone,
      address_line1: data.address_line1,
      address_line2: data.address_line2,
      landmark: data.landmark,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
    };

    // Save address if authenticated
    if (user && !addresses.some((a) => a.pincode === data.pincode && a.address_line1 === data.address_line1)) {
      addAddress(shippingAddress);
    }

    // Call zero-trust server service layer to validate prices & create order
    setTimeout(() => {
      const result = nitroDataService.createOrder({
        userId: user?.id,
        guestEmail: data.email,
        guestPhone: data.phone,
        shippingAddress,
        billingAddress: shippingAddress,
        items: items.map((i) => ({
          product_id: i.product_id,
          variant_id: i.variant_id,
          quantity: i.quantity,
        })),
        couponCode: couponCode || undefined,
        paymentMethod:
          data.paymentMethod === 'cod'
            ? 'Cash on Delivery (COD)'
            : data.paymentMethod === 'razorpay_upi'
            ? 'Razorpay UPI (Google Pay / PhonePe)'
            : data.paymentMethod === 'razorpay_card'
            ? 'Razorpay Credit / Debit Card'
            : 'Razorpay NetBanking',
        notes: data.notes,
      });

      setIsProcessing(false);

      if (result.success && result.order) {
        clearCart();
        navigate(`/order-confirmation/${result.order.id}`);
      } else {
        setOrderError(result.error || 'Failed to place order. Please try again.');
      }
    }, 1200);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <SEO title="Secure Checkout — Nitro Hub" description="Complete your luxury fashion purchase securely with Nitro Hub." />

      <Breadcrumbs items={[{ label: 'Bag', href: '/cart' }, { label: 'Secure Checkout' }]} />

      <div className="pb-4 border-b border-luxury-border flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-luxury-dark">Secure Checkout</h1>
          <p className="text-xs text-luxury-muted mt-0.5">Zero-Trust 256-Bit Encrypted Indian Payment Gateway</p>
        </div>
        <div className="flex items-center space-x-1 text-xs text-luxury-green font-semibold uppercase tracking-wider">
          <Lock className="w-3.5 h-3.5" />
          <span>SSL Secured</span>
        </div>
      </div>

      {orderError && (
        <div className="p-4 bg-luxury-red-light border border-luxury-red text-luxury-red text-xs font-medium flex items-center space-x-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{orderError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onProcessOrder)}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Multi-Step Forms */}
          <div className="lg:col-span-8 space-y-6">
            {/* Step 1: Delivery Address */}
            <div className="bg-white p-6 border border-luxury-border space-y-5">
              <div className="flex items-center space-x-2 pb-3 border-b border-luxury-border">
                <span className="w-5 h-5 bg-luxury-dark text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                  1
                </span>
                <h2 className="font-serif text-lg text-luxury-dark font-semibold">
                  Delivery Address & Contact
                </h2>
              </div>

              {/* Saved Addresses for quick selection */}
              {addresses.length > 0 && (
                <div className="space-y-2 pb-3 border-b border-luxury-border/60">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-luxury-muted block">
                    Saved Addresses
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        onClick={() => {
                          setSelectedAddressId(addr.id);
                          setValue('recipient_name', addr.recipient_name);
                          setValue('phone', addr.phone);
                          setValue('address_line1', addr.address_line1);
                          setValue('address_line2', addr.address_line2 || '');
                          setValue('landmark', addr.landmark || '');
                          setValue('city', addr.city);
                          setValue('state', addr.state);
                          setValue('pincode', addr.pincode);
                        }}
                        className={`p-3 border text-xs cursor-pointer transition-colors ${
                          selectedAddressId === addr.id
                            ? 'border-luxury-dark bg-luxury-bg-subtle font-medium'
                            : 'border-luxury-border hover:border-luxury-border-dark'
                        }`}
                      >
                        <div className="font-semibold text-luxury-dark">{addr.recipient_name}</div>
                        <div className="text-luxury-muted text-[11px] truncate">{addr.address_line1}</div>
                        <div className="text-luxury-muted text-[11px]">{addr.city}, {addr.state} - {addr.pincode}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Address Form Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name *"
                  placeholder="e.g. Priya Sharma"
                  error={errors.recipient_name?.message}
                  {...register('recipient_name')}
                />
                <Input
                  label="10-Digit Mobile Number *"
                  placeholder="e.g. 9876543210"
                  error={errors.phone?.message}
                  {...register('phone')}
                />
                <div className="sm:col-span-2">
                  <Input
                    label="Email Address for Invoicing & Tracking *"
                    type="email"
                    placeholder="e.g. priya@example.com"
                    error={errors.email?.message}
                    {...register('email')}
                  />
                </div>

                {/* PIN Code with live city/state lookup */}
                <div>
                  <Input
                    label="6-Digit PIN Code *"
                    placeholder="e.g. 560066"
                    maxLength={6}
                    error={errors.pincode?.message}
                    value={watchedPincode}
                    onChange={handlePincodeChange}
                  />
                </div>

                <Input
                  label="City / Town *"
                  placeholder="City"
                  error={errors.city?.message}
                  {...register('city')}
                />

                <div className="sm:col-span-2">
                  <Input
                    label="State / UT *"
                    placeholder="State"
                    error={errors.state?.message}
                    {...register('state')}
                  />
                </div>

                <div className="sm:col-span-2">
                  <Input
                    label="Flat / House No. / Building / Street *"
                    placeholder="e.g. A-402, Palm Meadows, Varthur Main Road"
                    error={errors.address_line1?.message}
                    {...register('address_line1')}
                  />
                </div>

                <Input
                  label="Area / Colony / Landmark (Optional)"
                  placeholder="e.g. Opposite Shell Station"
                  {...register('landmark')}
                />

                <Input
                  label="Delivery Instructions (Optional)"
                  placeholder="e.g. Leave at security"
                  {...register('notes')}
                />
              </div>
            </div>

            {/* Step 2: Payment Rail Selection */}
            <div className="bg-white p-6 border border-luxury-border space-y-5">
              <div className="flex items-center space-x-2 pb-3 border-b border-luxury-border">
                <span className="w-5 h-5 bg-luxury-dark text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                  2
                </span>
                <h2 className="font-serif text-lg text-luxury-dark font-semibold">
                  Payment Method (Razorpay India Rails)
                </h2>
              </div>

              <div className="space-y-3">
                {/* UPI Option */}
                <label className="flex items-start p-3.5 border border-luxury-border cursor-pointer hover:bg-luxury-bg-subtle transition-colors">
                  <input
                    type="radio"
                    value="razorpay_upi"
                    {...register('paymentMethod')}
                    className="mt-1 text-luxury-dark focus:ring-luxury-dark"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-luxury-dark uppercase tracking-wider">
                        UPI Instant Checkout
                      </span>
                      <span className="text-[10px] font-bold text-luxury-green bg-luxury-green-light px-1.5 py-0.5 border border-luxury-green/20">
                        RECOMMENDED
                      </span>
                    </div>
                    <p className="text-[11px] text-luxury-muted mt-0.5">
                      Pay instantly with Google Pay, PhonePe, Paytm, CRED or any UPI App.
                    </p>
                  </div>
                </label>

                {/* Cards Option */}
                <label className="flex items-start p-3.5 border border-luxury-border cursor-pointer hover:bg-luxury-bg-subtle transition-colors">
                  <input
                    type="radio"
                    value="razorpay_card"
                    {...register('paymentMethod')}
                    className="mt-1 text-luxury-dark focus:ring-luxury-dark"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-luxury-dark uppercase tracking-wider">
                        Credit & Debit Cards (RuPay / Visa / Mastercard)
                      </span>
                    </div>
                    <p className="text-[11px] text-luxury-muted mt-0.5">
                      Encrypted Razorpay tokenized gateway with instant OTP verification.
                    </p>
                  </div>
                </label>

                {/* NetBanking */}
                <label className="flex items-start p-3.5 border border-luxury-border cursor-pointer hover:bg-luxury-bg-subtle transition-colors">
                  <input
                    type="radio"
                    value="razorpay_netbanking"
                    {...register('paymentMethod')}
                    className="mt-1 text-luxury-dark focus:ring-luxury-dark"
                  />
                  <div className="ml-3 flex-1">
                    <span className="text-xs font-semibold text-luxury-dark uppercase tracking-wider">
                      Net Banking (50+ Indian Banks)
                    </span>
                    <p className="text-[11px] text-luxury-muted mt-0.5">
                      HDFC, ICICI, SBI, Axis, Kotak, and all major scheduled banks.
                    </p>
                  </div>
                </label>

                {/* Cash on Delivery */}
                <label className="flex items-start p-3.5 border border-luxury-border cursor-pointer hover:bg-luxury-bg-subtle transition-colors">
                  <input
                    type="radio"
                    value="cod"
                    {...register('paymentMethod')}
                    className="mt-1 text-luxury-dark focus:ring-luxury-dark"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-luxury-dark uppercase tracking-wider">
                        Cash on Delivery (COD)
                      </span>
                      <span className="text-[10px] text-luxury-muted">+₹49 Handling Fee</span>
                    </div>
                    <p className="text-[11px] text-luxury-muted mt-0.5">
                      Pay with cash or UPI QR at your doorstep on courier delivery.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right: Order Breakdown & Indian GST Invoicing */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 border border-luxury-border space-y-5">
              <h3 className="font-serif text-base font-semibold text-luxury-dark pb-3 border-b border-luxury-border">
                Order Review ({items.reduce((s, i) => s + i.quantity, 0)} Items)
              </h3>

              {/* Item thumbnails rail */}
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2.5 truncate">
                      <img
                        src={item.product.images[0]?.image_url}
                        alt={item.product.name}
                        className="w-10 h-12 object-cover border border-luxury-border flex-shrink-0"
                      />
                      <div className="truncate">
                        <div className="font-medium text-luxury-dark truncate">{item.product.name}</div>
                        <div className="text-[10px] text-luxury-muted">
                          Qty: {item.quantity} | Size: {item.variant.size.code}
                        </div>
                      </div>
                    </div>
                    <span className="font-semibold text-luxury-dark flex-shrink-0 ml-2">
                      ₹{item.total_price.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Calculations with Indian GST */}
              <div className="border-t border-luxury-border pt-4 space-y-2.5 text-xs">
                <div className="flex justify-between text-luxury-muted">
                  <span>Bag Subtotal</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-luxury-accent font-medium">
                    <span>Coupon ({couponCode})</span>
                    <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between text-luxury-muted">
                  <span>Express Shipping</span>
                  <span>{shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}</span>
                </div>

                {codFee > 0 && (
                  <div className="flex justify-between text-luxury-muted">
                    <span>COD Convenience Fee</span>
                    <span>₹{codFee}</span>
                  </div>
                )}

                {/* GST Itemization */}
                <div className="py-2 border-y border-luxury-border/60 text-[11px] text-luxury-muted space-y-1">
                  <div className="font-semibold text-luxury-dark flex justify-between">
                    <span>GST Tax (Included):</span>
                    <span>₹{gstBreakdown.total_tax.toFixed(2)}</span>
                  </div>
                  {gstBreakdown.is_interstate ? (
                    <div className="flex justify-between text-[10px]">
                      <span>IGST ({gstBreakdown.igst_rate}% to {watchedState})</span>
                      <span>₹{gstBreakdown.igst_amount.toFixed(2)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-[10px]">
                        <span>CGST ({gstBreakdown.cgst_rate}%)</span>
                        <span>₹{gstBreakdown.cgst_amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span>SGST ({gstBreakdown.sgst_rate}%)</span>
                        <span>₹{gstBreakdown.sgst_amount.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="pt-2 flex justify-between font-serif text-lg font-bold text-luxury-dark">
                  <span>Final Payable Total</span>
                  <span>₹{finalPayableTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full shadow-lift"
                isLoading={isProcessing}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {watchedPaymentMethod === 'cod' ? 'Confirm COD Order' : 'Pay with Razorpay'}
              </Button>

              <div className="pt-2 text-center text-[10px] text-luxury-muted leading-relaxed">
                By placing this order, you agree to Nitro Hub's 7-Day Return Policy and Terms of Sale.
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
