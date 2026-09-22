import React from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  ShoppingBag,
  Package,
  AlertTriangle,
  RotateCcw,
  Users,
  DollarSign,
  ArrowUpRight,
  Boxes,
} from 'lucide-react';
import { nitroDataService } from '../../lib/supabase/service';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';

export const Dashboard: React.FC = () => {
  const kpis = nitroDataService.getAdminKPIs();
  const orders = nitroDataService.getOrders().slice(0, 5);
  const products = nitroDataService.getAdminProducts();

  // Find low stock items
  const lowStockItems: Array<{ productName: string; variantName: string; stock: number; sku: string }> = [];
  products.forEach((p) => {
    p.variants.forEach((v) => {
      if (v.available_stock <= 3) {
        lowStockItems.push({
          productName: p.name,
          variantName: `${v.size.code} / ${v.color.name}`,
          stock: v.available_stock,
          sku: v.sku,
        });
      }
    });
  });

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-luxury-border">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-luxury-dark font-semibold">
            Operational Dashboard
          </h1>
          <p className="text-xs text-luxury-muted">
            Real-time business performance, inventory health, and order fulfillment
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link to="/admin/products/new">
            <Button variant="primary" size="sm">
              + Add New Style
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="bg-white p-5 border border-luxury-border space-y-2 shadow-soft">
          <div className="flex items-center justify-between text-xs text-luxury-muted">
            <span className="uppercase tracking-wider font-semibold">Today's Sales</span>
            <DollarSign className="w-4 h-4 text-luxury-accent" />
          </div>
          <div className="font-serif text-2xl font-bold text-luxury-dark">
            ₹{kpis.today_sales.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-luxury-green flex items-center font-medium">
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            <span>+18.4% vs last week</span>
          </div>
        </div>

        {/* Estimated Gross Profit */}
        <div className="bg-white p-5 border border-luxury-border space-y-2 shadow-soft">
          <div className="flex items-center justify-between text-xs text-luxury-muted">
            <span className="uppercase tracking-wider font-semibold">Estimated Gross Profit</span>
            <TrendingUp className="w-4 h-4 text-luxury-gold" />
          </div>
          <div className="font-serif text-2xl font-bold text-luxury-dark">
            ₹{kpis.estimated_gross_profit.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-luxury-muted">
            Gross Margin: <strong className="text-luxury-dark">{kpis.gross_margin_percent}%</strong>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white p-5 border border-luxury-border space-y-2 shadow-soft">
          <div className="flex items-center justify-between text-xs text-luxury-muted">
            <span className="uppercase tracking-wider font-semibold">Fulfillment Queue</span>
            <ShoppingBag className="w-4 h-4 text-luxury-accent" />
          </div>
          <div className="font-serif text-2xl font-bold text-luxury-dark">
            {kpis.pending_orders} <span className="text-xs font-normal text-luxury-muted">orders</span>
          </div>
          <div className="text-[11px] text-luxury-muted">
            Total lifetime orders: <strong>{kpis.total_orders}</strong>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-5 border border-luxury-border space-y-2 shadow-soft">
          <div className="flex items-center justify-between text-xs text-luxury-muted">
            <span className="uppercase tracking-wider font-semibold">Low Stock Warnings</span>
            <AlertTriangle className="w-4 h-4 text-luxury-accent" />
          </div>
          <div className="font-serif text-2xl font-bold text-luxury-accent">
            {kpis.low_stock_count} <span className="text-xs font-normal text-luxury-muted">SKUs</span>
          </div>
          <div className="text-[11px] text-luxury-muted">
            Requires restocking from mill
          </div>
        </div>
      </div>

      {/* Main Split: Recent Orders Left + Inventory Warnings Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Recent Orders */}
        <div className="lg:col-span-8 bg-white p-6 border border-luxury-border space-y-4 shadow-soft">
          <div className="flex items-center justify-between pb-3 border-b border-luxury-border">
            <h3 className="font-serif text-base font-semibold text-luxury-dark">
              Recent Customer Orders
            </h3>
            <Link
              to="/admin/orders"
              className="text-xs font-semibold text-luxury-accent hover:underline uppercase tracking-wider"
            >
              View All Orders →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-luxury-border text-luxury-muted uppercase tracking-wider text-[10px]">
                  <th className="pb-2">Order Ref</th>
                  <th className="pb-2">Customer</th>
                  <th className="pb-2">Items</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Total</th>
                  <th className="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-luxury-border/60">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-luxury-bg-subtle/50 transition-colors">
                    <td className="py-3 font-semibold text-luxury-dark">
                      {ord.order_number}
                    </td>
                    <td className="py-3 text-luxury-muted">
                      {ord.shipping_address.recipient_name}
                    </td>
                    <td className="py-3 text-luxury-muted">
                      {ord.items.length} {ord.items.length === 1 ? 'item' : 'items'}
                    </td>
                    <td className="py-3">
                      <Badge variant="new">{ord.status}</Badge>
                    </td>
                    <td className="py-3 font-semibold text-luxury-dark">
                      ₹{ord.total_amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        to={`/admin/orders`}
                        className="text-xs font-semibold text-luxury-accent hover:underline"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Urgent Table */}
        <div className="lg:col-span-4 bg-white p-6 border border-luxury-border space-y-4 shadow-soft">
          <div className="flex items-center justify-between pb-3 border-b border-luxury-border">
            <h3 className="font-serif text-base font-semibold text-luxury-dark flex items-center space-x-1.5">
              <Boxes className="w-4 h-4 text-luxury-accent" />
              <span>Low Stock Alerts</span>
            </h3>
            <Link
              to="/admin/inventory"
              className="text-xs font-semibold text-luxury-accent hover:underline uppercase tracking-wider"
            >
              Ledger →
            </Link>
          </div>

          <div className="space-y-3">
            {lowStockItems.slice(0, 5).map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-luxury-bg-subtle border border-luxury-border/80 flex items-center justify-between text-xs"
              >
                <div className="truncate pr-2">
                  <div className="font-medium text-luxury-dark truncate">{item.productName}</div>
                  <div className="text-[10px] text-luxury-muted">
                    {item.variantName} | {item.sku}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="px-2 py-0.5 bg-luxury-accent-light text-luxury-accent font-bold text-xs border border-luxury-accent/30">
                    {item.stock} left
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
