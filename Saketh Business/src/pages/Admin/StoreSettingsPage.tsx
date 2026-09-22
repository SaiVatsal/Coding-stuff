import React, { useState } from 'react';
import { Save, CheckCircle2, Shield, Lock } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { SELLER_GSTIN, SELLER_STATE, SELLER_LEGAL_NAME } from '../../lib/gst/calculator';

export const StoreSettingsPage: React.FC = () => {
  const [formData, setFormData] = useState({
    legalName: SELLER_LEGAL_NAME,
    gstin: SELLER_GSTIN,
    sellerState: SELLER_STATE,
    freeShippingThreshold: 999,
    standardShippingFee: 99,
    codConvenienceFee: 49,
    razorpayKeyId: 'rzp_live_9481948194819481',
    razorpaySecret: '••••••••••••••••••••••••••••••',
    supportEmail: 'support@nitrohub.in',
    supportPhone: '+91 80 4912 3456',
  });

  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="pb-4 border-b border-luxury-border">
        <h1 className="font-serif text-2xl sm:text-3xl text-luxury-dark font-semibold">
          Store Configuration & Legal Identity
        </h1>
        <p className="text-xs text-luxury-muted">
          Configure GST tax registration, fulfillment fees, and payment gateway keys
        </p>
      </div>

      {isSaved && (
        <div className="p-4 bg-luxury-green-light border border-luxury-green/30 text-luxury-green text-xs font-medium flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>Store settings successfully committed and saved.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* GST & Legal Identity */}
        <div className="bg-white p-6 border border-luxury-border space-y-4 shadow-soft">
          <h3 className="font-serif text-base font-semibold text-luxury-dark pb-2 border-b border-luxury-border">
            Legal Entity & Tax Credentials
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Registered Legal Entity Name *"
              value={formData.legalName}
              onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
            />

            <Input
              label="Seller GSTIN *"
              value={formData.gstin}
              onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
            />

            <Input
              label="Origin State / UT *"
              value={formData.sellerState}
              onChange={(e) => setFormData({ ...formData, sellerState: e.target.value })}
            />

            <Input
              label="Support Concierge Email *"
              value={formData.supportEmail}
              onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
            />
          </div>
        </div>

        {/* Shipping & Delivery Rules */}
        <div className="bg-white p-6 border border-luxury-border space-y-4 shadow-soft">
          <h3 className="font-serif text-base font-semibold text-luxury-dark pb-2 border-b border-luxury-border">
            Shipping & COD Convenience Fees
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Free Shipping Order Threshold (₹) *"
              type="number"
              value={formData.freeShippingThreshold}
              onChange={(e) =>
                setFormData({ ...formData, freeShippingThreshold: Number(e.target.value) })
              }
            />

            <Input
              label="Standard Shipping Fee (₹) *"
              type="number"
              value={formData.standardShippingFee}
              onChange={(e) =>
                setFormData({ ...formData, standardShippingFee: Number(e.target.value) })
              }
            />

            <Input
              label="Cash on Delivery (COD) Surcharge (₹) *"
              type="number"
              value={formData.codConvenienceFee}
              onChange={(e) =>
                setFormData({ ...formData, codConvenienceFee: Number(e.target.value) })
              }
            />
          </div>
        </div>

        {/* Payment Gateways */}
        <div className="bg-white p-6 border border-luxury-border space-y-4 shadow-soft">
          <div className="flex items-center justify-between pb-2 border-b border-luxury-border">
            <h3 className="font-serif text-base font-semibold text-luxury-dark">
              Razorpay API Rails
            </h3>
            <span className="text-[10px] text-luxury-green font-bold flex items-center space-x-1">
              <Lock className="w-3 h-3" />
              <span>Zero-Trust 256-Bit Vault</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Razorpay Key ID"
              value={formData.razorpayKeyId}
              onChange={(e) => setFormData({ ...formData, razorpayKeyId: e.target.value })}
            />

            <Input
              label="Razorpay Key Secret (Masked)"
              type="password"
              value={formData.razorpaySecret}
              onChange={(e) => setFormData({ ...formData, razorpaySecret: e.target.value })}
            />
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Configuration
          </Button>
        </div>
      </form>
    </div>
  );
};
