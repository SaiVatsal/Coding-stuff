import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck, Download, Search, Edit2, CheckCircle2, AlertCircle } from 'lucide-react';
import { nitroDataService } from '../../lib/supabase/service';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { generateGSTInvoicePDF } from '../../lib/gst/invoicePdf';
import { Order, OrderStatus } from '../../types';

export const AdminOrdersList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>(() => nitroDataService.getOrders());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Status update modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>('confirmed');
  const [courierName, setCourierName] = useState('BlueDart Express');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.shipping_address.recipient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.guest_email && o.guest_email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenStatusModal = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setCourierName(order.shipment?.courier_name || 'BlueDart Air');
    setTrackingNumber(order.shipment?.tracking_number || `BD${Math.floor(100000000 + Math.random() * 900000000)}IN`);
    setIsModalOpen(true);
  };

  const handleSaveStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    nitroDataService.updateOrderStatus(selectedOrder.id, newStatus, {
      courierName,
      trackingNumber,
    });

    setOrders(nitroDataService.getOrders());
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-luxury-border">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-luxury-dark font-semibold">
            Order Fulfillment & Logistics
          </h1>
          <p className="text-xs text-luxury-muted">
            Manage dispatch statuses, assign courier AWBs, and issue GST tax invoices
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 border border-luxury-border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-soft">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search by order ref, customer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto text-xs font-medium uppercase tracking-wider">
          {['all', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'refunded'].map(
            (st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 border whitespace-nowrap transition-colors ${
                  statusFilter === st
                    ? 'bg-luxury-dark text-white border-luxury-dark'
                    : 'bg-white text-luxury-muted border-luxury-border hover:border-luxury-border-dark'
                }`}
              >
                {st}
              </button>
            )
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-luxury-border overflow-x-auto shadow-soft">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="bg-luxury-bg-subtle border-b border-luxury-border text-luxury-muted uppercase tracking-wider text-[10px]">
              <th className="p-3.5">Order Ref</th>
              <th className="p-3.5">Date</th>
              <th className="p-3.5">Customer & City</th>
              <th className="p-3.5">Items</th>
              <th className="p-3.5">Payment</th>
              <th className="p-3.5 text-center">Status</th>
              <th className="p-3.5 text-right">Total (₹)</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-luxury-border">
            {filteredOrders.map((ord) => (
              <tr key={ord.id} className="hover:bg-luxury-bg-subtle/50 transition-colors">
                <td className="p-3.5 font-semibold text-luxury-dark">
                  {ord.order_number}
                </td>
                <td className="p-3.5 text-luxury-muted whitespace-nowrap">
                  {new Date(ord.created_at).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </td>
                <td className="p-3.5">
                  <div className="font-medium text-luxury-dark">{ord.shipping_address.recipient_name}</div>
                  <div className="text-[10px] text-luxury-muted">
                    {ord.shipping_address.city}, {ord.shipping_address.state}
                  </div>
                </td>
                <td className="p-3.5 text-luxury-muted">
                  {ord.items.length} {ord.items.length === 1 ? 'item' : 'items'}
                </td>
                <td className="p-3.5">
                  <span className="text-[11px] font-medium text-luxury-green uppercase">
                    {ord.payment?.status || 'Paid'}
                  </span>
                  <div className="text-[10px] text-luxury-muted truncate max-w-[120px]">
                    {ord.payment?.payment_method || 'Razorpay'}
                  </div>
                </td>
                <td className="p-3.5 text-center">
                  <Badge variant="bestseller">{ord.status.replace(/_/g, ' ').toUpperCase()}</Badge>
                </td>
                <td className="p-3.5 text-right font-serif font-bold text-luxury-dark">
                  ₹{ord.total_amount.toLocaleString('en-IN')}
                </td>
                <td className="p-3.5 text-right space-x-2 whitespace-nowrap">
                  <button
                    onClick={() => generateGSTInvoicePDF(ord)}
                    className="p-1.5 text-luxury-muted hover:text-luxury-dark inline-flex items-center"
                    title="Download Tax Invoice"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Edit2 className="w-3 h-3" />}
                    onClick={() => handleOpenStatusModal(ord)}
                  >
                    Status
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Status & Courier Dispatch Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Update Order Status & Dispatch"
      >
        {selectedOrder && (
          <form onSubmit={handleSaveStatus} className="space-y-4 text-xs">
            <div className="p-3 bg-luxury-bg-subtle border border-luxury-border space-y-1">
              <div className="font-serif text-sm font-semibold text-luxury-dark">
                Order {selectedOrder.order_number}
              </div>
              <div className="text-luxury-muted">
                Customer: {selectedOrder.shipping_address.recipient_name} | {selectedOrder.shipping_address.city}
              </div>
              <div className="text-luxury-muted font-bold text-luxury-dark">
                Total: ₹{selectedOrder.total_amount.toLocaleString('en-IN')}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-luxury-muted mb-1.5">
                Update Fulfillment Status *
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                className="w-full px-3.5 py-2.5 bg-white border border-luxury-border text-xs focus:outline-none focus:border-luxury-dark font-medium uppercase tracking-wider"
              >
                <option value="confirmed">Confirmed (Payment Verified)</option>
                <option value="processing">Processing (In Cutting / Tailoring)</option>
                <option value="packed">Packed (Ready at Warehouse)</option>
                <option value="shipped">Shipped (Handed to Courier)</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            {/* Courier Dispatch fields */}
            {(newStatus === 'packed' || newStatus === 'shipped' || newStatus === 'out_for_delivery') && (
              <div className="p-3 border border-luxury-border space-y-3 bg-white">
                <div className="font-semibold text-luxury-dark flex items-center space-x-1.5 text-xs">
                  <Truck className="w-3.5 h-3.5 text-luxury-accent" />
                  <span>Courier Partner Assignment</span>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-luxury-muted mb-1">
                    Courier Partner
                  </label>
                  <select
                    value={courierName}
                    onChange={(e) => setCourierName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-luxury-border text-xs focus:outline-none focus:border-luxury-dark"
                  >
                    <option value="BlueDart Air">BlueDart Air Express</option>
                    <option value="Delhivery Surface">Delhivery Surface</option>
                    <option value="DTDC Express">DTDC Express</option>
                    <option value="Shadowfax">Shadowfax Hyperlocal</option>
                  </select>
                </div>

                <Input
                  label="AWB Tracking Number *"
                  required
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                />
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-3 border-t border-luxury-border">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Commit Status Update
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
