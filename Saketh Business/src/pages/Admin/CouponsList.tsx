import React, { useState } from 'react';
import { Plus, Tag, Trash2, Edit2, CheckCircle2 } from 'lucide-react';
import { nitroDataService } from '../../lib/supabase/service';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Coupon } from '../../types';

export const CouponsList: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>(() => nitroDataService.getCoupons());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Coupon>>({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 10,
    min_order_value: 999,
    max_discount_cap: 500,
    start_date: new Date().toISOString(),
    expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    usage_limit: 1000,
    per_user_limit: 1,
    is_active: true,
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 15,
      min_order_value: 999,
      max_discount_cap: 500,
      start_date: new Date().toISOString(),
      expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      usage_limit: 500,
      per_user_limit: 1,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Coupon) => {
    setEditingId(c.id);
    setFormData(c);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    nitroDataService.deleteCoupon(id);
    setCoupons(nitroDataService.getCoupons());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code) return;

    const couponId = editingId || `coup-${Date.now()}`;
    const couponToSave: Coupon = {
      ...(formData as Coupon),
      id: couponId,
      code: formData.code.toUpperCase().trim(),
    };

    nitroDataService.saveCoupon(couponToSave);
    setCoupons(nitroDataService.getCoupons());
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-luxury-border">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-luxury-dark font-semibold">
            Promotions & Coupons
          </h1>
          <p className="text-xs text-luxury-muted">
            Configure discount rules, order thresholds, caps, and validity periods
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={handleOpenAdd}
        >
          Create Coupon
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map((c) => (
          <div
            key={c.id}
            className="bg-white p-5 border border-luxury-border shadow-soft space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-luxury-border">
                <div className="flex items-center space-x-2">
                  <Tag className="w-4 h-4 text-luxury-accent" />
                  <span className="font-mono font-bold text-sm tracking-wider text-luxury-dark">
                    {c.code}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border ${
                    c.is_active
                      ? 'bg-luxury-green-light text-luxury-green border-luxury-green/30'
                      : 'bg-luxury-bg-hover text-luxury-muted border-luxury-border'
                  }`}
                >
                  {c.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="text-xs text-luxury-muted mt-2 space-y-1">
                <p className="font-medium text-luxury-dark">{c.description}</p>
                <div>
                  Discount:{' '}
                  <strong className="text-luxury-dark">
                    {c.discount_type === 'percentage'
                      ? `${c.discount_value}%`
                      : `₹${c.discount_value}`}
                  </strong>
                </div>
                <div>
                  Min Order Value: <strong>₹{c.min_order_value}</strong>
                </div>
                {c.max_discount_cap && (
                  <div>
                    Max Cap: <strong>₹{c.max_discount_cap}</strong>
                  </div>
                )}
                <div className="text-[11px] text-luxury-faint pt-1">
                  Valid until {new Date(c.expiry_date).toLocaleDateString('en-IN')}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-luxury-border/60 flex items-center justify-end space-x-2">
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Edit2 className="w-3 h-3" />}
                onClick={() => handleOpenEdit(c)}
              >
                Edit
              </Button>
              <button
                onClick={() => handleDelete(c.id)}
                className="p-1.5 text-luxury-muted hover:text-luxury-red transition-colors"
                title="Delete Coupon"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Coupon Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Coupon' : 'Create Promotional Coupon'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <Input
            label="Coupon Code *"
            required
            placeholder="e.g. FESTIVE25"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          />

          <Input
            label="Public Description *"
            required
            placeholder="e.g. 25% off on festive collections above ₹1,999"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-luxury-muted mb-1.5">
                Discount Type *
              </label>
              <select
                value={formData.discount_type}
                onChange={(e) =>
                  setFormData({ ...formData, discount_type: e.target.value as any })
                }
                className="w-full px-3 py-2 bg-white border border-luxury-border text-xs focus:outline-none focus:border-luxury-dark font-medium"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>

            <Input
              label="Discount Value *"
              type="number"
              required
              value={formData.discount_value}
              onChange={(e) =>
                setFormData({ ...formData, discount_value: Number(e.target.value) })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Min Order Value (₹)"
              type="number"
              value={formData.min_order_value}
              onChange={(e) =>
                setFormData({ ...formData, min_order_value: Number(e.target.value) })
              }
            />

            <Input
              label="Max Cap (₹, for % discounts)"
              type="number"
              value={formData.max_discount_cap || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  max_discount_cap: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
          </div>

          <label className="flex items-center space-x-2 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="text-luxury-dark focus:ring-luxury-dark"
            />
            <span className="font-semibold text-luxury-dark">Enable this coupon immediately</span>
          </label>

          <div className="flex justify-end space-x-3 pt-3 border-t border-luxury-border">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Coupon
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
