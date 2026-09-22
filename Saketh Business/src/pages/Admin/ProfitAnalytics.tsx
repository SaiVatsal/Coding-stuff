import React from 'react';
import { TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, Package, PieChart } from 'lucide-react';
import { nitroDataService } from '../../lib/supabase/service';
import { Badge } from '../../components/common/Badge';

export const ProfitAnalytics: React.FC = () => {
  const products = nitroDataService.getAdminProducts();
  const orders = nitroDataService.getOrders();

  // Financial aggregates
  const validOrders = orders.filter((o) => o.status !== 'cancelled' && o.status !== 'refunded');

  const totalGrossRevenue = validOrders.reduce((sum, o) => sum + o.subtotal, 0);
  const totalDiscounts = validOrders.reduce((sum, o) => sum + o.discount_amount, 0);
  const totalNetRevenue = validOrders.reduce((sum, o) => sum + o.total_amount, 0);

  let totalCOGS = 0;
  validOrders.forEach((o) => {
    o.items.forEach((i) => {
      totalCOGS += (i.purchase_cost || 0) * i.quantity;
    });
  });

  const estimatedGatewayFees = Math.round(totalNetRevenue * 0.02 * 100) / 100; // Razorpay ~2%
  const shippingAbsorbed = validOrders.filter((o) => o.shipping_fee === 0).length * 99; // ₹99 absorbed per free ship

  const netGrossProfit = Math.max(
    0,
    totalNetRevenue - totalCOGS - estimatedGatewayFees - shippingAbsorbed
  );
  const netMarginPercent =
    totalNetRevenue > 0 ? Math.round((netGrossProfit / totalNetRevenue) * 1000) / 10 : 0;

  // Margin rankings
  const rankedProducts = [...products]
    .map((p) => {
      const cost = p.purchase_cost || 0;
      const profit = p.selling_price - cost;
      const margin = p.selling_price > 0 ? Math.round((profit / p.selling_price) * 100) : 0;
      return {
        ...p,
        profitPerUnit: profit,
        marginPercent: margin,
      };
    })
    .sort((a, b) => b.marginPercent - a.marginPercent);

  const bestMarginProducts = rankedProducts.slice(0, 4);
  const lowestMarginProducts = [...rankedProducts].reverse().slice(0, 4);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-luxury-border">
        <h1 className="font-serif text-2xl sm:text-3xl text-luxury-dark font-semibold">
          Gross Margin & Profit Analytics
        </h1>
        <p className="text-xs text-luxury-muted">
          Confidential financial accounting: Net revenue minus COGS, discounts, and payment gateway fees
        </p>
      </div>

      {/* Financial Formula Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Gross Revenue */}
        <div className="bg-white p-6 border border-luxury-border space-y-2 shadow-soft">
          <span className="text-[10px] font-bold uppercase tracking-wider text-luxury-muted block">
            Net Customer Revenue
          </span>
          <div className="font-serif text-3xl font-bold text-luxury-dark">
            ₹{totalNetRevenue.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-luxury-muted">
            Discounts Given: <strong>₹{totalDiscounts.toLocaleString('en-IN')}</strong>
          </div>
        </div>

        {/* COGS */}
        <div className="bg-white p-6 border border-luxury-border space-y-2 shadow-soft">
          <span className="text-[10px] font-bold uppercase tracking-wider text-luxury-accent block">
            Cost of Goods Sold (COGS)
          </span>
          <div className="font-serif text-3xl font-bold text-luxury-accent">
            ₹{totalCOGS.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-luxury-muted">
            Direct wholesale mill purchase cost
          </div>
        </div>

        {/* Net Contribution Profit */}
        <div className="bg-luxury-dark text-white p-6 border border-luxury-charcoal space-y-2 shadow-soft">
          <span className="text-[10px] font-bold uppercase tracking-wider text-luxury-gold block">
            Estimated Net Contribution
          </span>
          <div className="font-serif text-3xl font-bold text-white">
            ₹{netGrossProfit.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-luxury-faint">
            Blended Net Margin: <strong className="text-luxury-gold">{netMarginPercent}%</strong>
          </div>
        </div>
      </div>

      {/* Accounting Breakdown Equation */}
      <div className="bg-white p-6 border border-luxury-border shadow-soft space-y-4 text-xs">
        <h3 className="font-serif text-base font-semibold text-luxury-dark pb-2 border-b border-luxury-border">
          Contribution Margin Breakdown (P&L Ledger)
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
          <div className="p-3 bg-luxury-bg-subtle border border-luxury-border">
            <span className="text-[10px] uppercase text-luxury-muted block font-semibold">Gross Sales</span>
            <span className="font-serif text-base font-bold text-luxury-dark">
              ₹{totalGrossRevenue.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-3 bg-luxury-bg-subtle border border-luxury-border">
            <span className="text-[10px] uppercase text-luxury-muted block font-semibold">- Discounts</span>
            <span className="font-serif text-base font-bold text-luxury-accent">
              ₹{totalDiscounts.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-3 bg-luxury-bg-subtle border border-luxury-border">
            <span className="text-[10px] uppercase text-luxury-muted block font-semibold">- Sourcing COGS</span>
            <span className="font-serif text-base font-bold text-luxury-accent">
              ₹{totalCOGS.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-3 bg-luxury-bg-subtle border border-luxury-border">
            <span className="text-[10px] uppercase text-luxury-muted block font-semibold">- Gateway Fees (2%)</span>
            <span className="font-serif text-base font-bold text-luxury-muted">
              ₹{estimatedGatewayFees.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-3 bg-luxury-green-light border border-luxury-green/30 text-luxury-green">
            <span className="text-[10px] uppercase block font-bold">= Net Profit</span>
            <span className="font-serif text-base font-bold">
              ₹{netGrossProfit.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Margin Comparison Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Highest Margin Styles */}
        <div className="bg-white p-6 border border-luxury-border shadow-soft space-y-4">
          <div className="flex items-center space-x-2 text-luxury-green font-semibold text-xs uppercase tracking-wider pb-2 border-b border-luxury-border">
            <ArrowUpRight className="w-4 h-4" />
            <span>Highest Gross Margin Styles</span>
          </div>

          <div className="space-y-3">
            {bestMarginProducts.map((p) => (
              <div
                key={p.id}
                className="p-3 bg-luxury-bg-subtle border border-luxury-border flex items-center justify-between text-xs"
              >
                <div className="truncate pr-2">
                  <div className="font-serif font-semibold text-luxury-dark truncate">{p.name}</div>
                  <div className="text-[10px] text-luxury-muted">
                    Sell: ₹{p.selling_price} | Cost: ₹{p.purchase_cost}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-luxury-green text-sm">{p.marginPercent}% Margin</div>
                  <div className="text-[10px] text-luxury-muted">+₹{p.profitPerUnit} profit/unit</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lowest Margin Styles */}
        <div className="bg-white p-6 border border-luxury-border shadow-soft space-y-4">
          <div className="flex items-center space-x-2 text-luxury-accent font-semibold text-xs uppercase tracking-wider pb-2 border-b border-luxury-border">
            <ArrowDownRight className="w-4 h-4" />
            <span>Lowest Margin Styles (Review Sourcing)</span>
          </div>

          <div className="space-y-3">
            {lowestMarginProducts.map((p) => (
              <div
                key={p.id}
                className="p-3 bg-luxury-bg-subtle border border-luxury-border flex items-center justify-between text-xs"
              >
                <div className="truncate pr-2">
                  <div className="font-serif font-semibold text-luxury-dark truncate">{p.name}</div>
                  <div className="text-[10px] text-luxury-muted">
                    Sell: ₹{p.selling_price} | Cost: ₹{p.purchase_cost}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-luxury-accent text-sm">{p.marginPercent}% Margin</div>
                  <div className="text-[10px] text-luxury-muted">+₹{p.profitPerUnit} profit/unit</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
