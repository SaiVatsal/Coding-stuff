import React, { useState } from 'react';
import { Plus, MapPin, Trash2, Edit2, Check } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { lookupIndianPincode } from '../../lib/pincode/delivery';
import { Address } from '../../types';

export const AddressesPage: React.FC = () => {
  const { addresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } = useAuthStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    recipient_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    is_default: false,
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      recipient_name: '',
      phone: '',
      address_line1: '',
      address_line2: '',
      landmark: '',
      city: '',
      state: '',
      pincode: '',
      is_default: addresses.length === 0,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (addr: Address) => {
    setEditingId(addr.id);
    setFormData({
      recipient_name: addr.recipient_name,
      phone: addr.phone,
      address_line1: addr.address_line1,
      address_line2: addr.address_line2 || '',
      landmark: addr.landmark || '',
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      is_default: Boolean(addr.is_default),
    });
    setIsModalOpen(true);
  };

  const handlePincodeChange = (pincode: string) => {
    setFormData((prev) => ({ ...prev, pincode }));
    if (pincode.length === 6 && /^[1-9][0-9]{5}$/.test(pincode)) {
      const res = lookupIndianPincode(pincode);
      if (res) {
        setFormData((prev) => ({ ...prev, city: res.city, state: res.state }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateAddress(editingId, formData);
    } else {
      addAddress(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-luxury-border">
        <div>
          <h2 className="font-serif text-xl text-luxury-dark font-semibold">Saved Addresses</h2>
          <p className="text-xs text-luxury-muted">Manage your shipping and billing delivery destinations</p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={handleOpenAdd}
        >
          Add New Address
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {addresses.map((addr) => (
          <div
            key={addr.id}
            className={`bg-white border p-5 space-y-3 relative flex flex-col justify-between ${
              addr.is_default ? 'border-luxury-dark shadow-soft' : 'border-luxury-border'
            }`}
          >
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-luxury-border/60">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-3.5 h-3.5 text-luxury-accent" />
                  <span className="font-serif font-semibold text-luxury-dark text-sm">
                    {addr.recipient_name}
                  </span>
                </div>
                {addr.is_default && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-luxury-green bg-luxury-green-light px-2 py-0.5 border border-luxury-green/30">
                    Default
                  </span>
                )}
              </div>

              <div className="text-xs text-luxury-muted space-y-1 pt-2 leading-relaxed">
                <div>{addr.address_line1}</div>
                {addr.address_line2 && <div>{addr.address_line2}</div>}
                {addr.landmark && <div>Landmark: {addr.landmark}</div>}
                <div className="font-medium text-luxury-dark">
                  {addr.city}, {addr.state} - {addr.pincode}
                </div>
                <div>Phone: {addr.phone}</div>
              </div>
            </div>

            <div className="pt-3 border-t border-luxury-border/60 flex items-center justify-between text-xs">
              {!addr.is_default ? (
                <button
                  onClick={() => setDefaultAddress(addr.id)}
                  className="text-[11px] text-luxury-accent hover:underline font-semibold uppercase tracking-wider"
                >
                  Set as Default
                </button>
              ) : (
                <span className="text-[11px] text-luxury-muted">Primary address</span>
              )}

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleOpenEdit(addr)}
                  className="p-1.5 text-luxury-muted hover:text-luxury-dark"
                  title="Edit"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => deleteAddress(addr.id)}
                  className="p-1.5 text-luxury-muted hover:text-luxury-red"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Address Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Address' : 'Add New Address'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Recipient Full Name *"
              required
              value={formData.recipient_name}
              onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
            />
            <Input
              label="10-Digit Mobile Number *"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input
              label="6-Digit PIN Code *"
              required
              maxLength={6}
              value={formData.pincode}
              onChange={(e) => handlePincodeChange(e.target.value)}
            />
            <Input
              label="City / Town *"
              required
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
            <div className="sm:col-span-2">
              <Input
                label="State / Union Territory *"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Input
                label="Street Address / Flat / Building *"
                required
                value={formData.address_line1}
                onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
              />
            </div>
            <Input
              label="Area / Sector (Optional)"
              value={formData.address_line2}
              onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
            />
            <Input
              label="Landmark (Optional)"
              value={formData.landmark}
              onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
            />
          </div>

          <label className="flex items-center space-x-2 text-xs text-luxury-dark pt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_default}
              onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
              className="text-luxury-dark focus:ring-luxury-dark rounded-none"
            />
            <span>Set as default shipping address</span>
          </label>

          <div className="flex justify-end space-x-3 pt-4 border-t border-luxury-border">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Address
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
