import React from 'react';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { SEO } from '../../components/common/SEO';

export const ReturnsPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-luxury-text">
      <SEO title="Returns & Exchange Policy — Nitro Hub" />
      <Breadcrumbs items={[{ label: 'Returns & Exchange Policy' }]} />

      <div className="pb-4 border-b border-luxury-border">
        <h1 className="font-serif text-3xl sm:text-4xl text-luxury-dark">Returns & Refund Policy</h1>
        <p className="text-xs text-luxury-muted mt-1">7-Day Doorstep Pickup & Full Refund Guarantee</p>
      </div>

      <div className="bg-white p-8 border border-luxury-border space-y-6 text-xs sm:text-sm text-luxury-text leading-relaxed">
        <section className="space-y-2">
          <h3 className="font-serif text-lg font-semibold text-luxury-dark">1. 7-Day Return Window</h3>
          <p>We want you to be completely delighted with your purchase. You may initiate a return or size exchange request for any unworn garment within <strong>7 days</strong> of delivery directly through your Account dashboard.</p>
        </section>

        <section className="space-y-2">
          <h3 className="font-serif text-lg font-semibold text-luxury-dark">2. Conditions for Return</h3>
          <ul className="list-disc list-inside space-y-1 text-luxury-muted">
            <li>Item must be unused, unwashed, and undamaged.</li>
            <li>Original garment tags, brand packaging, and spare buttons must remain intact.</li>
            <li>Customized or altered items are not eligible for return unless a manufacturing defect is present.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h3 className="font-serif text-lg font-semibold text-luxury-dark">3. Doorstep Pickup & Refund Timeline</h3>
          <p>Once your return request is approved, our courier partner will arrange a doorstep pickup within 24-48 hours. Following a quick quality inspection upon arrival at our facility, refunds are initiated via Razorpay to your original payment method (3-5 business days) or via UPI for COD orders.</p>
        </section>
      </div>
    </div>
  );
};
