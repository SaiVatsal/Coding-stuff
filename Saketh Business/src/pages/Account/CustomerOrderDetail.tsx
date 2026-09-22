import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Download,
  Truck,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Package,
} from 'lucide-react';
import { nitroDataService } from '../../lib/supabase/service';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { generateGSTInvoicePDF } from '../../lib/gst/invoicePdf';

export const CustomerOrderDetail: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();

  const order = useMemo(() => {
    return orderId ? nitroDataService.getOrderById(orderId) : null;
  }, [orderId]);

  // Return request modal state
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [returnReason, setReturnReason] = useState('size_issue');
  const [returnDescription, setReturnDescription] = useState('');
  const [returnSubmitted, setReturnSubmitted] = useState(false);

  if (!order) {
    return (
      <div className="bg-white p-12 text-center border border-luxury-border space-y-4">
        <h3 className="font-serif text-lg text-luxury-dark">Order Not Found</h3>
        <p className="text-xs text-luxury-muted">The requested order reference does not exist.</p>
        <Link to="/account/orders">
          <Button variant="secondary" size="sm">
            Back to Orders
          </Button>
        </Link>
      </div>
    );
  }

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) return;

    const res = nitroDataService.submitReturnRequest(
      order.id,
      selectedItemId,
      returnReason,
      returnDescription,
      order.guest_email || 'customer@nitrohub.in'
    );

    if (res) {
      setReturnSubmitted(true);
      setTimeout(() => {
        setIsReturnModalOpen(false);
        setReturnSubmitted(false);
        setReturnDescription('');
      }, 1500);
    }
  };

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
    <div className="space-y-6">
      {/* Top Breadcrumb & Action */}
      <div className="flex items-center justify-between pb-4 border-b border-luxury-border">
        <Link
          to="/account/orders"
          className="text-xs text-luxury-muted hover:text-luxury-dark font-medium inline-flex items-center"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          <span>Back to All Orders</span>
        </Link>

        <Button
          variant="outline"
          size="sm"
          leftIcon={<Download className="w-3.5 h-3.5 text-luxury-accent" />}
          onClick={() => generateGSTInvoicePDF(order)}
        >
          Download Tax Invoice
        </Button>
      </div>

      {/* Header Info */}
      <div className="bg-white p-6 border border-luxury-border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-luxury-border">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-luxury-accent">
              Order Reference
            </div>
            <h2 className="font-serif text-2xl text-luxury-dark font-semibold">
              {order.order_number}
            </h2>
            <div className="text-xs text-luxury-muted">
              Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>

          <div className="text-right">
            <Badge variant="bestseller">{order.status.replace(/_/g, ' ').toUpperCase()}</Badge>
            <div className="font-serif text-xl font-bold text-luxury-dark mt-1">
              ₹{order.total_amount.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Live Status Timeline */}
        <div className="py-4">
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
        </div>

        {/* Shipment Tracker Details */}
        {order.shipment && (
          <div className="p-4 bg-luxury-bg-subtle border border-luxury-border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <Truck className="w-5 h-5 text-luxury-accent flex-shrink-0" />
              <div>
                <div className="font-semibold text-luxury-dark">
                  Courier Partner: {order.shipment.courier_name}
                </div>
                <div className="text-luxury-muted">
                  AWB Tracking Number: <strong>{order.shipment.tracking_number}</strong>
                </div>
              </div>
            </div>

            {order.shipment.tracking_url && (
              <a
                href={order.shipment.tracking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-luxury-accent hover:underline uppercase tracking-wider"
              >
                Track on Courier Site →
              </a>
            )}
          </div>
        )}
      </div>

      {/* Ordered Items Table */}
      <div className="bg-white p-6 border border-luxury-border space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-luxury-border">
          <h3 className="font-serif text-base text-luxury-dark font-semibold">
            Line Items ({order.items.length})
          </h3>
          {order.status === 'delivered' && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RotateCcw className="w-3 h-3" />}
              onClick={() => {
                setSelectedItemId(order.items[0]?.id || '');
                setIsReturnModalOpen(true);
              }}
            >
              Initiate Return Request
            </Button>
          )}
        </div>

        <div className="divide-y divide-luxury-border">
          {order.items.map((item) => (
            <div key={item.id} className="py-4 first:pt-0 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-4">
                <img
                  src={item.product?.images[0]?.image_url || 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=300'}
                  alt={item.product_name}
                  className="w-14 h-18 object-cover border border-luxury-border flex-shrink-0"
                />
                <div>
                  <div className="font-serif font-semibold text-luxury-dark text-sm">
                    {item.product_name}
                  </div>
                  <div className="text-luxury-muted text-xs">
                    Variant: {item.variant_name} | SKU: {item.sku}
                  </div>
                  <div className="text-[10px] text-luxury-faint">
                    HSN: {item.hsn_code} | Qty: {item.quantity} × ₹{item.unit_price.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div className="font-serif font-bold text-sm text-luxury-dark">
                ₹{item.total_price.toLocaleString('en-IN')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Address & Payment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 border border-luxury-border space-y-3 text-xs">
          <h3 className="font-serif text-sm font-semibold text-luxury-dark pb-2 border-b border-luxury-border uppercase tracking-wider">
            Shipping Address
          </h3>
          <div className="text-luxury-muted space-y-1 leading-relaxed">
            <div className="font-semibold text-luxury-dark">{order.shipping_address.recipient_name}</div>
            <div>{order.shipping_address.address_line1}</div>
            {order.shipping_address.address_line2 && <div>{order.shipping_address.address_line2}</div>}
            <div>{order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}</div>
            <div>Phone: {order.shipping_address.phone}</div>
          </div>
        </div>

        <div className="bg-white p-6 border border-luxury-border space-y-3 text-xs">
          <h3 className="font-serif text-sm font-semibold text-luxury-dark pb-2 border-b border-luxury-border uppercase tracking-wider">
            Payment & Taxes
          </h3>
          <div className="space-y-1.5 text-luxury-muted">
            <div className="flex justify-between">
              <span>Payment Mode:</span>
              <strong className="text-luxury-dark">{order.payment?.payment_method || 'Online Razorpay'}</strong>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <strong className="text-luxury-green uppercase">Verified Paid</strong>
            </div>
            {order.gst_breakdown && (
              <div className="flex justify-between pt-1 border-t border-luxury-border/60">
                <span>GST Tax Breakdown:</span>
                <span>
                  {order.gst_breakdown.is_interstate
                    ? `IGST (${order.gst_breakdown.igst_rate}%): ₹${order.gst_breakdown.igst_amount}`
                    : `CGST + SGST: ₹${order.gst_breakdown.total_tax}`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Return Request Modal */}
      <Modal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        title="Initiate Return / Exchange Request"
      >
        {returnSubmitted ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-luxury-green mx-auto" />
            <h4 className="font-serif text-lg font-semibold text-luxury-dark">
              Return Request Logged
            </h4>
            <p className="text-xs text-luxury-muted">
              Our courier will schedule a doorstep quality check within 24 hours.
            </p>
          </div>
        ) : (
          <form onSubmit={handleReturnSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-luxury-muted mb-1">
                Select Item to Return *
              </label>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-luxury-border text-xs focus:outline-none focus:border-luxury-dark"
              >
                {order.items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.product_name} ({i.variant_name}) — ₹{i.total_price}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-luxury-muted mb-1">
                Reason for Return *
              </label>
              <select
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-luxury-border text-xs focus:outline-none focus:border-luxury-dark"
              >
                <option value="size_too_small">Size too small</option>
                <option value="size_too_large">Size too large</option>
                <option value="fabric_quality_expectation">Fabric feel different from expectation</option>
                <option value="color_mismatch">Color shade difference</option>
                <option value="defect_found">Defect / Stitching issue</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-luxury-muted mb-1">
                Additional Comments (Optional)
              </label>
              <textarea
                rows={3}
                value={returnDescription}
                onChange={(e) => setReturnDescription(e.target.value)}
                placeholder="Let us know how we can improve..."
                className="w-full px-3 py-2 border border-luxury-border text-xs focus:outline-none focus:border-luxury-dark"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsReturnModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Submit Return Request
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
