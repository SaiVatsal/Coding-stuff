import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Plus, DollarSign, Image as ImageIcon } from 'lucide-react';
import { nitroDataService } from '../../lib/supabase/service';
import { SEED_CATEGORIES } from '../../data/seedCategories';
import { SEED_SIZES, SEED_COLORS } from '../../data/seedProducts';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Product, ProductVariant } from '../../types';

export const ProductEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const isEditing = Boolean(id && id !== 'new');

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    slug: '',
    sku: '',
    category_id: 'cat-women',
    gender: 'women',
    brand: 'Nitro Hub',
    short_description: '',
    description: '',
    mrp: 2499,
    selling_price: 1299,
    purchase_cost: 400,
    material: 'Pure European Linen',
    fabric_composition: '100% Organic Linen',
    care_instructions: 'Hand wash cold. Line dry in shade.',
    weight_grams: 350,
    hsn_code: '62044220',
    is_returnable: true,
    return_window_days: 7,
    is_active: true,
    is_featured: false,
    is_new_arrival: true,
    is_bestseller: false,
    images: [
      {
        id: 'img-1',
        image_url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=900&auto=format&fit=crop',
        alt_text: 'Primary front view',
        display_order: 1,
        is_primary: true,
      },
    ],
    variants: [
      {
        id: 'var-1',
        product_id: '',
        size_id: 'size-s',
        size: SEED_SIZES.S,
        color_id: 'col-ivory',
        color: SEED_COLORS.ivory,
        sku: 'NH-NEW-S',
        stock: 10,
        reserved_stock: 0,
        available_stock: 10,
        is_active: true,
      },
      {
        id: 'var-2',
        product_id: '',
        size_id: 'size-m',
        size: SEED_SIZES.M,
        color_id: 'col-ivory',
        color: SEED_COLORS.ivory,
        sku: 'NH-NEW-M',
        stock: 15,
        reserved_stock: 0,
        available_stock: 15,
        is_active: true,
      },
      {
        id: 'var-3',
        product_id: '',
        size_id: 'size-l',
        size: SEED_SIZES.L,
        color_id: 'col-ivory',
        color: SEED_COLORS.ivory,
        sku: 'NH-NEW-L',
        stock: 8,
        reserved_stock: 0,
        available_stock: 8,
        is_active: true,
      },
    ],
  });

  useEffect(() => {
    if (isEditing && id) {
      const existing = nitroDataService.getProductById(id);
      if (existing) {
        setFormData(existing);
      }
    }
  }, [isEditing, id]);

  // Margin calculation
  const mrp = Number(formData.mrp || 0);
  const selling = Number(formData.selling_price || 0);
  const cost = Number(formData.purchase_cost || 0);
  const profitPerItem = selling - cost;
  const marginPercent = selling > 0 ? Math.round((profitPerItem / selling) * 100) : 0;

  // Slug generator
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    setFormData((prev) => ({
      ...prev,
      name,
      slug: prev.slug && isEditing ? prev.slug : slug,
    }));
  };

  const handleAddImageUrl = () => {
    const newImg = {
      id: `img-${Date.now()}`,
      image_url: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=900',
      alt_text: 'Secondary view',
      display_order: (formData.images?.length || 0) + 1,
      is_primary: false,
    };
    setFormData((prev) => ({
      ...prev,
      images: [...(prev.images || []), newImg],
    }));
  };

  const handleRemoveImage = (imgId: string) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images?.filter((i) => i.id !== imgId),
    }));
  };

  const handleUpdateVariantStock = (variantId: string, stock: number) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants?.map((v) => {
        if (v.id === variantId) {
          return {
            ...v,
            stock,
            available_stock: Math.max(0, stock - v.reserved_stock),
          };
        }
        return v;
      }),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sku) return;

    const productId = isEditing && id ? id : `prod-${Date.now()}`;
    const productToSave: Product = {
      ...(formData as Product),
      id: productId,
      rating_avg: formData.rating_avg || 4.8,
      review_count: formData.review_count || 12,
      created_at: formData.created_at || new Date().toISOString(),
    };

    nitroDataService.saveProduct(productToSave);
    navigate('/admin/products');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-12 max-w-5xl">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-luxury-border">
        <Link
          to="/admin/products"
          className="text-xs text-luxury-muted hover:text-luxury-dark inline-flex items-center"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          <span>Back to Products</span>
        </Link>

        <Button
          type="submit"
          variant="primary"
          size="md"
          leftIcon={<Save className="w-4 h-4" />}
        >
          {isEditing ? 'Save Product Changes' : 'Create Product'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form: Details, Descriptions & Pricing */}
        <div className="lg:col-span-8 space-y-6">
          {/* General Information */}
          <div className="bg-white p-6 border border-luxury-border space-y-4 shadow-soft">
            <h3 className="font-serif text-base font-semibold text-luxury-dark pb-2 border-b border-luxury-border">
              General Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="Product Title *"
                  required
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
              </div>

              <Input
                label="Product Slug *"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />

              <Input
                label="SKU Code *"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              />

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-luxury-muted mb-1.5">
                  Category *
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-luxury-border text-xs focus:outline-none focus:border-luxury-dark"
                >
                  {SEED_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-luxury-muted mb-1.5">
                  Gender Scope *
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 bg-white border border-luxury-border text-xs focus:outline-none focus:border-luxury-dark"
                >
                  <option value="women">Women</option>
                  <option value="men">Men</option>
                  <option value="unisex">Unisex / Collections</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-luxury-muted mb-1.5">
                Short Tagline
              </label>
              <Input
                value={formData.short_description}
                onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-luxury-muted mb-1.5">
                Full Description & Editorial Notes *
              </label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-luxury-border text-xs focus:outline-none focus:border-luxury-dark rounded-none"
              />
            </div>
          </div>

          {/* Pricing & Confidential Purchase Cost */}
          <div className="bg-white p-6 border border-luxury-border space-y-4 shadow-soft">
            <h3 className="font-serif text-base font-semibold text-luxury-dark pb-2 border-b border-luxury-border flex items-center justify-between">
              <span>Pricing & Wholesale Margins</span>
              <span className="text-[10px] text-luxury-gold uppercase font-bold tracking-wider">
                Admin Confidential
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="MRP (₹) *"
                type="number"
                required
                value={formData.mrp}
                onChange={(e) => setFormData({ ...formData, mrp: Number(e.target.value) })}
              />

              <Input
                label="Selling Price (₹) *"
                type="number"
                required
                value={formData.selling_price}
                onChange={(e) => setFormData({ ...formData, selling_price: Number(e.target.value) })}
              />

              <Input
                label="Wholesale Purchase Cost (₹) *"
                type="number"
                required
                value={formData.purchase_cost}
                onChange={(e) => setFormData({ ...formData, purchase_cost: Number(e.target.value) })}
              />
            </div>

            {/* Live Profit Calculation Block */}
            <div className="p-4 bg-luxury-bg-subtle border border-luxury-border grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-[10px] text-luxury-muted uppercase tracking-wider block">Estimated Profit / Unit</span>
                <span className="font-serif text-base font-bold text-luxury-green">
                  ₹{profitPerItem.toLocaleString('en-IN')}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-luxury-muted uppercase tracking-wider block">Gross Margin %</span>
                <span className="font-serif text-base font-bold text-luxury-green">
                  {marginPercent}%
                </span>
              </div>

              <div>
                <span className="text-[10px] text-luxury-muted uppercase tracking-wider block">Customer Discount</span>
                <span className="font-serif text-base font-bold text-luxury-accent">
                  {mrp > 0 ? Math.round(((mrp - selling) / mrp) * 100) : 0}% Off
                </span>
              </div>
            </div>
          </div>

          {/* Variants & Sizing Stock Matrix */}
          <div className="bg-white p-6 border border-luxury-border space-y-4 shadow-soft">
            <h3 className="font-serif text-base font-semibold text-luxury-dark pb-2 border-b border-luxury-border">
              Variant Stocks & Inventory Allocation
            </h3>

            <div className="space-y-3">
              {formData.variants?.map((v) => (
                <div
                  key={v.id}
                  className="p-3 bg-luxury-bg-subtle border border-luxury-border flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-luxury-dark">
                      Size: {v.size.code} | Color: {v.color.name}
                    </span>
                    <div className="text-[10px] text-luxury-muted">SKU: {v.sku}</div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-[11px] text-luxury-muted uppercase tracking-wider">
                      Stock Count:
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={v.stock}
                      onChange={(e) => handleUpdateVariantStock(v.id, Number(e.target.value))}
                      className="w-20 px-2 py-1 bg-white border border-luxury-border text-center font-bold text-xs focus:outline-none focus:border-luxury-dark"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Images & Compliance */}
        <div className="lg:col-span-4 space-y-6">
          {/* Images Manager */}
          <div className="bg-white p-6 border border-luxury-border space-y-4 shadow-soft">
            <div className="flex items-center justify-between pb-2 border-b border-luxury-border">
              <h3 className="font-serif text-base font-semibold text-luxury-dark">
                Product Photography
              </h3>
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="text-xs font-semibold text-luxury-accent hover:underline flex items-center"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>Add Image</span>
              </button>
            </div>

            <div className="space-y-3">
              {formData.images?.map((img, idx) => (
                <div key={img.id} className="p-3 border border-luxury-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-luxury-muted">
                      {img.is_primary ? '★ Primary Image' : `Image #${idx + 1}`}
                    </span>
                    {formData.images && formData.images.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(img.id)}
                        className="text-luxury-muted hover:text-luxury-red"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <Input
                    placeholder="https://..."
                    value={img.image_url}
                    onChange={(e) => {
                      const url = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        images: prev.images?.map((i) => (i.id === img.id ? { ...i, image_url: url } : i)),
                      }));
                    }}
                  />
                  <div className="aspect-[3/4] max-h-36 overflow-hidden bg-luxury-bg-subtle border border-luxury-border">
                    <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance & Fabric Specs */}
          <div className="bg-white p-6 border border-luxury-border space-y-4 shadow-soft text-xs">
            <h3 className="font-serif text-base font-semibold text-luxury-dark pb-2 border-b border-luxury-border">
              Indian GST & Fabric Compliance
            </h3>

            <Input
              label="HSN Code *"
              value={formData.hsn_code}
              onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })}
            />

            <Input
              label="Fabric Material *"
              value={formData.material}
              onChange={(e) => setFormData({ ...formData, material: e.target.value })}
            />

            <Input
              label="Fabric Composition *"
              value={formData.fabric_composition}
              onChange={(e) => setFormData({ ...formData, fabric_composition: e.target.value })}
            />

            <Input
              label="Weight in Grams"
              type="number"
              value={formData.weight_grams}
              onChange={(e) => setFormData({ ...formData, weight_grams: Number(e.target.value) })}
            />
          </div>
        </div>
      </div>
    </form>
  );
};
