import React, { useState } from 'react';
import { Boxes, Edit, Plus, History, AlertTriangle, ArrowDown, ArrowUp } from 'lucide-react';
import { nitroDataService } from '../../lib/supabase/service';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { InventoryTransaction, Product } from '../../types';

export const InventoryPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(() => nitroDataService.getAdminProducts());
  const [transactions, setTransactions] = useState<InventoryTransaction[]>(() =>
    nitroDataService.getInventoryTransactions()
  );

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<{
    variantId: string;
    productName: string;
    variantName: string;
    currentStock: number;
  } | null>(null);

  const [newStockVal, setNewStockVal] = useState<number>(0);
  const [adjustNotes, setAdjustNotes] = useState('');

  // Extract all variants
  const allVariants: Array<{
    variantId: string;
    productName: string;
    sku: string;
    size: string;
    color: string;
    stock: number;
    reserved: number;
    available: number;
  }> = [];

  products.forEach((p) => {
    p.variants.forEach((v) => {
      allVariants.push({
        variantId: v.id,
        productName: p.name,
        sku: v.sku,
        size: v.size.code,
        color: v.color.name,
        stock: v.stock,
        reserved: v.reserved_stock,
        available: v.available_stock,
      });
    });
  });

  const handleOpenAdjust = (v: (typeof allVariants)[0]) => {
    setSelectedVariant({
      variantId: v.variantId,
      productName: v.productName,
      variantName: `${v.size} / ${v.color}`,
      currentStock: v.stock,
    });
    setNewStockVal(v.stock);
    setAdjustNotes('');
    setIsAdjustModalOpen(true);
  };

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariant) return;

    nitroDataService.adjustInventory(selectedVariant.variantId, newStockVal, adjustNotes);
    setProducts(nitroDataService.getAdminProducts());
    setTransactions(nitroDataService.getInventoryTransactions());
    setIsAdjustModalOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-luxury-border">
        <h1 className="font-serif text-2xl sm:text-3xl text-luxury-dark font-semibold">
          Inventory Ledger & Stock Allocation
        </h1>
        <p className="text-xs text-luxury-muted">
          Atomic stock reservation, available stock calculations, and immutable transaction history
        </p>
      </div>

      {/* Stock Table */}
      <div className="bg-white border border-luxury-border overflow-x-auto shadow-soft">
        <div className="p-4 border-b border-luxury-border flex items-center justify-between">
          <h3 className="font-serif text-base font-semibold text-luxury-dark">
            Live Variant Stock Matrix ({allVariants.length} Variants)
          </h3>
        </div>

        <table className="w-full text-xs text-left">
          <thead>
            <tr className="bg-luxury-bg-subtle border-b border-luxury-border text-luxury-muted uppercase tracking-wider text-[10px]">
              <th className="p-3.5">Style / Garment</th>
              <th className="p-3.5">SKU</th>
              <th className="p-3.5">Size / Color</th>
              <th className="p-3.5 text-center">Physical Stock</th>
              <th className="p-3.5 text-center">Reserved</th>
              <th className="p-3.5 text-center font-bold text-luxury-dark">Available to Sell</th>
              <th className="p-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-luxury-border">
            {allVariants.map((v) => (
              <tr key={v.variantId} className="hover:bg-luxury-bg-subtle/50 transition-colors">
                <td className="p-3.5 font-serif font-medium text-luxury-dark">
                  {v.productName}
                </td>
                <td className="p-3.5 font-mono text-[11px] text-luxury-muted">{v.sku}</td>
                <td className="p-3.5 font-semibold text-luxury-dark">
                  {v.size} / {v.color}
                </td>
                <td className="p-3.5 text-center font-medium text-luxury-dark">{v.stock}</td>
                <td className="p-3.5 text-center text-luxury-muted">{v.reserved}</td>
                <td className="p-3.5 text-center">
                  <span
                    className={`px-2 py-0.5 font-bold border text-[11px] ${
                      v.available <= 3
                        ? 'bg-luxury-accent-light text-luxury-accent border-luxury-accent/30'
                        : 'bg-luxury-green-light text-luxury-green border-luxury-green/30'
                    }`}
                  >
                    {v.available} units
                  </span>
                </td>
                <td className="p-3.5 text-right">
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Edit className="w-3 h-3" />}
                    onClick={() => handleOpenAdjust(v)}
                  >
                    Adjust
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Transaction History Ledger */}
      <div className="bg-white border border-luxury-border overflow-hidden shadow-soft">
        <div className="p-4 border-b border-luxury-border flex items-center justify-between">
          <h3 className="font-serif text-base font-semibold text-luxury-dark flex items-center space-x-2">
            <History className="w-4 h-4 text-luxury-accent" />
            <span>Auditable Inventory Transaction Ledger</span>
          </h3>
          <span className="text-xs text-luxury-muted">
            {transactions.length} recorded events
          </span>
        </div>

        <div className="overflow-x-auto max-h-72 overflow-y-auto">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-xs text-luxury-muted italic">
              No inventory adjustment transactions recorded yet.
            </div>
          ) : (
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-luxury-bg-subtle border-b border-luxury-border text-luxury-muted uppercase tracking-wider text-[10px] sticky top-0">
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Garment / SKU</th>
                  <th className="p-3">Event Type</th>
                  <th className="p-3 text-center">Change</th>
                  <th className="p-3">Notes & Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-luxury-border">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-luxury-bg-subtle/50">
                    <td className="p-3 text-luxury-muted whitespace-nowrap">
                      {new Date(tx.created_at).toLocaleString('en-IN')}
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-luxury-dark">{tx.product_name}</div>
                      <div className="text-[10px] text-luxury-muted font-mono">{tx.sku}</div>
                    </td>
                    <td className="p-3 uppercase font-semibold text-[10px] text-luxury-muted">
                      {tx.transaction_type.replace(/_/g, ' ')}
                    </td>
                    <td className="p-3 text-center font-mono font-bold">
                      <span
                        className={
                          tx.quantity_change >= 0 ? 'text-luxury-green' : 'text-luxury-red'
                        }
                      >
                        {tx.quantity_change > 0 ? `+${tx.quantity_change}` : tx.quantity_change}
                      </span>
                    </td>
                    <td className="p-3 text-luxury-muted">{tx.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Adjust Variant Stock"
      >
        {selectedVariant && (
          <form onSubmit={handleSaveAdjustment} className="space-y-4 text-xs">
            <div className="p-3 bg-luxury-bg-subtle border border-luxury-border space-y-1">
              <div className="font-serif text-sm font-semibold text-luxury-dark">
                {selectedVariant.productName}
              </div>
              <div className="text-luxury-muted">Variant: {selectedVariant.variantName}</div>
              <div className="text-luxury-muted">
                Current Physical Stock: <strong>{selectedVariant.currentStock} units</strong>
              </div>
            </div>

            <Input
              label="New Physical Stock Count *"
              type="number"
              min={0}
              required
              value={newStockVal}
              onChange={(e) => setNewStockVal(Number(e.target.value))}
            />

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-luxury-muted mb-1.5">
                Audit Reason / Mill Batch Notes *
              </label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Restocked batch #491 from weaver; damage write-off; manual inventory reconciliation"
                value={adjustNotes}
                onChange={(e) => setAdjustNotes(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-luxury-border text-xs focus:outline-none focus:border-luxury-dark rounded-none"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-luxury-border">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdjustModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Commit Stock Adjustment
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
