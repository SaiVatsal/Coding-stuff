import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Download, Upload, Search, Edit2, CheckCircle2, XCircle } from 'lucide-react';
import { nitroDataService } from '../../lib/supabase/service';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Product } from '../../types';

export const ProductsList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(() => nitroDataService.getAdminProducts());
  const [searchQuery, setSearchQuery] = useState('');
  const [csvMessage, setCsvMessage] = useState('');

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleStatus = (id: string) => {
    const updated = nitroDataService.toggleProductStatus(id);
    if (updated) {
      setProducts(nitroDataService.getAdminProducts());
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['SKU', 'Name', 'Category', 'MRP', 'SellingPrice', 'PurchaseCost', 'TotalStock', 'IsActive'];
    const rows = products.map((p) => {
      const stock = p.variants.reduce((sum, v) => sum + v.available_stock, 0);
      return [
        `"${p.sku}"`,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.category_id}"`,
        p.mrp,
        p.selling_price,
        p.purchase_cost || 0,
        stock,
        p.is_active,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nitro_hub_catalog_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-luxury-border">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-luxury-dark font-semibold">
            Product Catalog & Sourcing
          </h1>
          <p className="text-xs text-luxury-muted">
            Manage product variants, wholesale purchase costs, and gross margins
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            onClick={handleExportCSV}
          >
            Export CSV
          </Button>

          <Link to="/admin/products/new">
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Add New Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Search Filter Bar */}
      <div className="bg-white p-4 border border-luxury-border flex items-center justify-between shadow-soft">
        <div className="w-full max-w-sm">
          <Input
            placeholder="Search by name, SKU, brand..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <div className="text-xs text-luxury-muted">
          Showing <strong>{filteredProducts.length}</strong> of {products.length} products
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-luxury-border overflow-x-auto shadow-soft">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="bg-luxury-bg-subtle border-b border-luxury-border text-luxury-muted uppercase tracking-wider text-[10px]">
              <th className="p-3.5">Style</th>
              <th className="p-3.5">SKU / Gender</th>
              <th className="p-3.5 text-right">MRP (₹)</th>
              <th className="p-3.5 text-right">Selling Price (₹)</th>
              <th className="p-3.5 text-right font-semibold text-luxury-accent">Purchase Cost (₹)</th>
              <th className="p-3.5 text-right font-semibold text-luxury-green">Gross Margin</th>
              <th className="p-3.5 text-center">Stock</th>
              <th className="p-3.5 text-center">Status</th>
              <th className="p-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-luxury-border">
            {filteredProducts.map((p) => {
              const totalStock = p.variants.reduce((sum, v) => sum + v.available_stock, 0);
              const cost = p.purchase_cost || 0;
              const profit = p.selling_price - cost;
              const margin = p.selling_price > 0 ? Math.round((profit / p.selling_price) * 100) : 0;

              return (
                <tr key={p.id} className="hover:bg-luxury-bg-subtle/50 transition-colors">
                  {/* Image + Title */}
                  <td className="p-3.5 flex items-center space-x-3">
                    <img
                      src={p.images[0]?.image_url}
                      alt={p.name}
                      className="w-12 h-14 object-cover border border-luxury-border flex-shrink-0"
                    />
                    <div className="truncate max-w-[200px]">
                      <div className="font-serif font-semibold text-luxury-dark truncate">
                        {p.name}
                      </div>
                      <div className="text-[10px] text-luxury-muted">{p.brand}</div>
                    </div>
                  </td>

                  {/* SKU / Gender */}
                  <td className="p-3.5 text-luxury-muted">
                    <div className="font-mono text-[11px] text-luxury-dark">{p.sku}</div>
                    <div className="capitalize text-[10px]">{p.gender}</div>
                  </td>

                  {/* MRP */}
                  <td className="p-3.5 text-right text-luxury-muted font-medium">
                    ₹{p.mrp.toLocaleString('en-IN')}
                  </td>

                  {/* Selling Price */}
                  <td className="p-3.5 text-right font-semibold text-luxury-dark">
                    ₹{p.selling_price.toLocaleString('en-IN')}
                  </td>

                  {/* Confidential Wholesale Purchase Cost */}
                  <td className="p-3.5 text-right font-mono font-semibold text-luxury-accent">
                    ₹{cost.toLocaleString('en-IN')}
                  </td>

                  {/* Gross Margin */}
                  <td className="p-3.5 text-right">
                    <span className="inline-block font-bold text-luxury-green">
                      {margin}% (₹{profit})
                    </span>
                  </td>

                  {/* Stock */}
                  <td className="p-3.5 text-center">
                    <span
                      className={`px-2 py-0.5 text-[11px] font-bold border ${
                        totalStock <= 3
                          ? 'bg-luxury-accent-light text-luxury-accent border-luxury-accent/30'
                          : 'bg-luxury-green-light text-luxury-green border-luxury-green/30'
                      }`}
                    >
                      {totalStock} units
                    </span>
                  </td>

                  {/* Status Toggle */}
                  <td className="p-3.5 text-center">
                    <button
                      onClick={() => handleToggleStatus(p.id)}
                      className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                        p.is_active
                          ? 'bg-luxury-green-light text-luxury-green border-luxury-green/30'
                          : 'bg-luxury-bg-hover text-luxury-muted border-luxury-border'
                      }`}
                    >
                      {p.is_active ? 'Active' : 'Draft'}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="p-3.5 text-right">
                    <Link
                      to={`/admin/products/${p.id}/edit`}
                      className="p-1.5 text-luxury-muted hover:text-luxury-dark inline-flex items-center space-x-1"
                      title="Edit Product"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
