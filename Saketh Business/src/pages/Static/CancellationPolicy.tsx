import React from 'react';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { SEO } from '../../components/common/SEO';

export const CancellationPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-luxury-text">
      <SEO title="Cancellation Policy — Nitro Hub" />
      <Breadcrumbs items={[{ label: 'Cancellation Policy' }]} />

      <div className="pb-4 border-b border-luxury-border">
        <h1 className="font-serif text-3xl sm:text-4xl text-luxury-dark">Cancellation Policy</h1>
        <p className="text-xs text-luxury-muted mt-1">Direct and transparent order cancellation terms</p>
      </div>

      <div className="bg-white p-8 border border-luxury-border space-y-6 text-xs sm:text-sm text-luxury-text leading-relaxed">
        <section className="space-y-2">
          <h3 className="font-serif text-lg font-semibold text-luxury-dark">1. Cancellation Before Dispatch</h3>
          <p>You can cancel your order free of charge at any point prior to physical dispatch from our fulfillment warehouse. To cancel, visit your Account &gt; My Orders page or reach out to our concierge support team at support@nitrohub.in.</p>
        </section>

        <section className="space-y-2">
          <h3 className="font-serif text-lg font-semibold text-luxury-dark">2. Refund on Cancellation</h3>
          <p>For prepaid orders cancelled before dispatch, the entire transaction amount will be automatically refunded to your original payment method via Razorpay within 24 business hours.</p>
        </section>

        <section className="space-y-2">
          <h3 className="font-serif text-lg font-semibold text-luxury-dark">3. Post-Dispatch Cancellation</h3>
          <p>Once an order has been shipped and assigned a courier tracking number, it cannot be cancelled in transit. You may simply refuse the delivery upon arrival or initiate a 7-day doorstep return after receipt.</p>
        </section>
      </div>
    </div>
  );
};
