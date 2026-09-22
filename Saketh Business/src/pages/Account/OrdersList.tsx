import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Eye, Download, Truck, ArrowRight } from 'lucide-react';
import { nitroDataService } from '../../lib/supabase/service';
import { useAuthStore } from '../../store/useAuthStore';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { generateGSTInvoicePDF } from '../../lib/gst/invoicePdf';

export const OrdersList: React.FC = () => {
  const { user } = useAuthStore();
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const orders = nitroDataService.getOrders(user?.id);

  const filteredOrders = orders.filter((o) => {
    if (filterStatus === 'all') return true;
    return o.status === filterStatus;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'processing':
        return 'new';
      case 'shipped':
      case 'out_for_delivery':
        return 'sale';
      case 'delivered':
        return 'verified';
      case 'cancelled':
      case 'refunded':
        return 'out_of_stock';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-luxury-border">
        <div>
          <h2 className="font-serif text-xl text-luxury-dark font-semibold">Your Orders</h2>
          <p className="text-xs text-luxury-muted">Manage your recent shipments, invoices, and returns</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider">
          {['all', 'confirmed', 'shipped', 'delivered'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 border transition-colors ${
                filterStatus === st
                  ? 'bg-luxury-dark text-white border-luxury-dark'
                  : 'bg-white text-luxury-muted border-luxury-border hover:border-luxury-border-dark'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-white p-8 border border-luxury-border">
          <EmptyState
            icon={<ShoppingBag className="w-12 h-12 stroke-[1.2]" />}
            title="No orders found"
            description="You have not placed any orders yet. Discover our newest collection to elevate your wardrobe."
            actionText="Start Shopping"
            actionHref="/women"
          />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-luxury-border p-5 space-y-4 hover:border-luxury-border-dark transition-colors"
            >
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-luxury-border gap-2 text-xs">
                <div className="space-y-0.5">
                  <div className="font-serif text-sm font-semibold text-luxury-dark">
                    Order Ref: <span className="tracking-wider">{order.order_number}</span>
                  </div>
                  <div className="text-[11px] text-luxury-muted">
                    Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Badge variant={getStatusBadgeVariant(order.status) as any}>
                    {order.status.replace(/_/g, ' ')}
                  </Badge>
                  <span className="font-semibold text-luxury-dark text-sm">
                    ₹{order.total_amount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Items Thumbnails & Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3 text-xs">
                    <img
                      src={item.product?.images[0]?.image_url || 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=300'}
                      alt={item.product_name}
                      className="w-12 h-14 object-cover border border-luxury-border flex-shrink-0"
                    />
                    <div className="truncate">
                      <div className="font-medium text-luxury-dark truncate">{item.product_name}</div>
                      <div className="text-[11px] text-luxury-muted">
                        {item.variant_name} | Qty: {item.quantity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-luxury-border/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                {order.shipment ? (
                  <div className="text-[11px] text-luxury-muted flex items-center space-x-1.5">
                    <Truck className="w-3.5 h-3.5 text-luxury-accent" />
                    <span>
                      {order.shipment.courier_name} (AWB: {order.shipment.tracking_number})
                    </span>
                  </div>
                ) : (
                  <div className="text-[11px] text-luxury-muted">Processing dispatch</div>
                )}

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => generateGSTInvoicePDF(order)}
                    className="text-xs text-luxury-dark hover:text-luxury-accent font-medium inline-flex items-center"
                    title="Download Tax Invoice"
                  >
                    <Download className="w-3.5 h-3.5 mr-1" />
                    <span>GST Invoice</span>
                  </button>

                  <Link to={`/account/orders/${order.id}`}>
                    <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="w-3 h-3" />}>
                      View Detail
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
