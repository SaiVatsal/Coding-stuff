import React from 'react';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { SEO } from '../../components/common/SEO';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-luxury-text">
      <SEO title="Privacy Policy — Nitro Hub" />
      <Breadcrumbs items={[{ label: 'Privacy Policy' }]} />

      <div className="pb-4 border-b border-luxury-border">
        <h1 className="font-serif text-3xl sm:text-4xl text-luxury-dark">Privacy Policy</h1>
        <p className="text-xs text-luxury-muted mt-1">Information Technology (Reasonable Security Practices) Rules 2011</p>
      </div>

      <div className="bg-white p-8 border border-luxury-border space-y-6 text-xs sm:text-sm text-luxury-text leading-relaxed">
        <section className="space-y-2">
          <h3 className="font-serif text-lg font-semibold text-luxury-dark">1. Information We Collect</h3>
          <p>We collect personal information necessary to fulfill your orders and enhance your shopping experience: name, shipping address, contact phone number, and email address. We do not store complete credit card or debit card numbers on our servers; all payment transactions are tokenized and processed through PCI-DSS Level 1 compliant gateways (Razorpay).</p>
        </section>

        <section className="space-y-2">
          <h3 className="font-serif text-lg font-semibold text-luxury-dark">2. Purpose of Collection & Usage</h3>
          <p>Your data is used exclusively to fulfill orders, issue GST tax invoices, provide live shipment tracking via SMS and email, process eligible returns, and communicate with you regarding your orders.</p>
        </section>

        <section className="space-y-2">
          <h3 className="font-serif text-lg font-semibold text-luxury-dark">3. Data Security & Zero-Trust Architecture</h3>
          <p>We implement industry-standard 256-bit encryption, strict Row-Level Security (RLS) on all customer databases, and tokenized API sessions to ensure your personal data is inaccessible to unauthorized third parties.</p>
        </section>
      </div>
    </div>
  );
};
