import React from 'react';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { SEO } from '../../components/common/SEO';

export const ShippingPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-luxury-text">
      <SEO title="Shipping & Delivery Policy — Nitro Hub" />
      <Breadcrumbs items={[{ label: 'Shipping & Delivery Policy' }]} />

      <div className="pb-4 border-b border-luxury-border">
        <h1 className="font-serif text-3xl sm:text-4xl text-luxury-dark">Shipping & Delivery Policy</h1>
        <p className="text-xs text-luxury-muted mt-1">Last updated: January 2025</p>
      </div>

      <div className="bg-white p-8 border border-luxury-border space-y-6 text-xs sm:text-sm text-luxury-text leading-relaxed">
        <section className="space-y-2">
          <h3 className="font-serif text-lg font-semibold text-luxury-dark">1. Shipping Charges & Free Delivery</h3>
          <p>We provide <strong>Complimentary Pan-India Shipping</strong> on all orders with a net merchandise value of ₹999 or above. For orders below ₹999, a flat standard delivery fee of ₹99 applies.</p>
        </section>

        <section className="space-y-2">
          <h3 className="font-serif text-lg font-semibold text-luxury-dark">2. Delivery Timeframes</h3>
          <ul className="list-disc list-inside space-y-1 text-luxury-muted">
            <li><strong>Tier 1 Metro Hubs:</strong> 2 to 3 business days via BlueDart Air / Express.</li>
            <li><strong>Rest of India (Tier 2 & 3):</strong> 3 to 5 business days via Delhivery Surface.</li>
            <li><strong>Special Transit Zones:</strong> 5 to 7 business days for Jammu & Kashmir, Ladakh, and North-Eastern States.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h3 className="font-serif text-lg font-semibold text-luxury-dark">3. Order Dispatch & Real-Time Tracking</h3>
          <p>Orders are dispatched within 24 business hours from our Bengaluru central hub. Once shipped, you will receive an automated notification containing your courier tracking number (AWB) and live tracking link.</p>
        </section>
      </div>
    </div>
  );
};
