import React, { useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { CheckCircle2, Download, Package, Truck, ArrowRight, Clock } from 'lucide-react';
import { Button } from '../components/common/Button';
import { SEO } from '../components/common/SEO';
import { nitroDataService } from '../lib/supabase/service';
import { generateGSTInvoicePDF } from '../lib/gst/invoicePdf';

export const OrderConfirmationPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();

  const order = useMemo(() => {
    return orderId ? nitroDataService.getOrderById(orderId) : null;
  }, [orderId]);

  useEffect(() => {
    // Fire confetti on successful order load
    if (order) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#9E4A28', '#A87A2A', '#141414', '#FBF9F5'],
      });
    }
  }, [order]);

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-serif text-2xl text-luxury-dark">Order Not Found</h2>
        <p className="text-xs text-luxury-muted">We could not locate this order reference.</p>
        <Link to="/">
          <Button variant="primary">Return Home</Button>
        </Link>
      </div>
    );
  }

  // Order status steps
  const statusSteps = [
    { label: 'Confirmed', status: 'confirmed', completed: true },
    {
      label: 'Processing',
      status: 'processing',
      completed: ['processing', 'packed', 'shipped', 'out_for_delivery', 'delivered'].includes(order.status),
    },
    {
      label: 'Packed',
      status: 'packed',
      completed: ['packed', 'shipped', 'out_for_delivery', 'delivered'].includes(order.status),
    },
    {
      label: 'Shipped',
      status: 'shipped',
      completed: ['shipped', 'out_for_delivery', 'delivered'].includes(order.status),
    },
    {
      label: 'Delivered',
      status: 'delivered',
      completed: order.status === 'delivered',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <SEO title={`Order Confirmed ${order.order_number} — Nitro Hub`} />

      {/* Success Banner */}
      <div className="bg-white p-8 border border-luxury-border text-center space-y-4 shadow-soft">
        <div className="w-14 h-14 bg-luxury-green-light border border-luxury-green/30 text-luxury-green rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-luxury-accent">
            Order Successfully Placed
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-luxury-dark font-medium">
            Thank you for choosing Nitro Hub
          </h1>
          <p className="text-xs text-luxury-muted">
            Order Reference:{' '}
            <strong className="text-luxury-dark tracking-wider">{order.order_number}</strong>
          </p>
        </div>

        <p className="text-xs text-luxury-muted max-w-lg mx-auto leading-relaxed">
          An invoice and tracking confirmation will be dispatched to{' '}
          <strong>{order.guest_email || 'your registered email'}</strong>. Our master tailors and packing team have initiated your order dispatch.
        </p>

        {/* GST Invoice Download CTA */}
        <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-3.5 h-3.5 text-luxury-accent" />}
            onClick={() => generateGSTInvoicePDF(order)}
          >
            Download GST Tax Invoice (PDF)
          </Button>

          <Link to={`/account/orders/${order.id}`}>
            <Button variant="secondary" size="sm">
              View Order in Account
            </Button>
          </Link>
        </div>
      </div>

      {/* Live Order Timeline */}
      <div className="bg-white p-6 border border-luxury-border space-y-5">
        <h3 className="font-serif text-base text-luxury-dark font-semibold">
          Fulfillment & Transit Timeline
        </h3>

        <div className="relative flex items-center justify-between">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-luxury-border -translate-y-1/2 -z-0" />
          {statusSteps.map((s, idx) => (
            <div key={idx} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors ${
                  s.completed
                    ? 'bg-luxury-dark text-white border-luxury-dark'
                    : 'bg-white text-luxury-muted border-luxury-border'
                }`}
              >
                {s.completed ? '✓' : idx + 1}
              </div>
              <span className="text-[10px] uppercase tracking-wider text-luxury-dark font-medium mt-2 text-center">
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {order.shipment && (
          <div className="p-3.5 bg-luxury-bg-subtle border border-luxury-border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <Truck className="w-4 h-4 text-luxury-accent" />
              <span>
                Courier Partner: <strong>{order.shipment.courier_name}</strong> | AWB Tracking No:{' '}
                <strong className="text-luxury-dark">{order.shipment.tracking_number}</strong>
              </span>
            </div>
            <span className="text-[11px] text-luxury-muted">
              Estimated Delivery:{' '}
              {order.shipment.estimated_delivery
                ? new Date(order.shipment.estimated_delivery).toLocaleDateString('en-IN')
                : '3-4 Business Days'}
            </span>
          </div>
        )}
      </div>

      {/* Items & Shipping Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Purchased Items */}
        <div className="md:col-span-7 bg-white p-6 border border-luxury-border space-y-4">
          <h3 className="font-serif text-base text-luxury-dark font-semibold pb-3 border-b border-luxury-border">
            Ordered Items ({order.items.length})
          </h3>

          <div className="divide-y divide-luxury-border">
            {order.items.map((item) => (
              <div key={item.id} className="py-3 first:pt-0 flex items-center justify-between text-xs">
                <div>
                  <div className="font-serif font-medium text-luxury-dark">{item.product_name}</div>
                  <div className="text-luxury-muted text-[11px]">
                    Size & Color: {item.variant_name} | Qty: {item.quantity}
                  </div>
                  <div className="text-[10px] text-luxury-faint">HSN: {item.hsn_code}</div>
                </div>
                <div className="font-semibold text-luxury-dark">
                  ₹{item.total_price.toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-luxury-border space-y-1.5 text-xs text-luxury-muted">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₹{order.subtotal.toLocaleString('en-IN')}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-luxury-accent">
                <span>Discount ({order.coupon_code || 'Coupon'}):</span>
                <span>-₹{order.discount_amount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Shipping:</span>
              <span>{order.shipping_fee === 0 ? 'FREE' : `₹${order.shipping_fee}`}</span>
            </div>
            <div className="flex justify-between font-serif text-base font-bold text-luxury-dark pt-2 border-t border-luxury-border">
              <span>Total Paid:</span>
              <span>₹{order.total_amount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Shipping Address & Payment */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-white p-6 border border-luxury-border space-y-3 text-xs">
            <h3 className="font-serif text-base text-luxury-dark font-semibold pb-2 border-b border-luxury-border">
              Delivery Details
            </h3>
            <div className="space-y-1 text-luxury-muted leading-relaxed">
              <div className="font-semibold text-luxury-dark">{order.shipping_address.recipient_name}</div>
              <div>{order.shipping_address.address_line1}</div>
              {order.shipping_address.address_line2 && <div>{order.shipping_address.address_line2}</div>}
              <div>{order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}</div>
              <div>Phone: {order.shipping_address.phone}</div>
            </div>
          </div>

          <div className="bg-white p-6 border border-luxury-border space-y-3 text-xs">
            <h3 className="font-serif text-base text-luxury-dark font-semibold pb-2 border-b border-luxury-border">
              Payment Method
            </h3>
            <div className="text-luxury-muted space-y-1">
              <div>Method: <strong className="text-luxury-dark">{order.payment?.payment_method || 'Online'}</strong></div>
              <div>Status: <strong className="text-luxury-green uppercase">Verified Paid</strong></div>
              {order.payment?.razorpay_payment_id && (
                <div className="text-[10px]">Payment ID: {order.payment.razorpay_payment_id}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="text-center pt-4">
        <Link to="/women">
          <Button variant="secondary" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
            Continue Shopping
          </Button>
        </Link>
      </div>
    </div>
  );
};
