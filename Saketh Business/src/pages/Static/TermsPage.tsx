import React from 'react';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { SEO } from '../../components/common/SEO';

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-luxury-text">
      <SEO title="Terms & Conditions — Nitro Hub" />
      <Breadcrumbs items={[{ label: 'Terms & Conditions' }]} />

      <div className="pb-4 border-b border-luxury-border">
        <h1 className="font-serif text-3xl sm:text-4xl text-luxury-dark">Terms & Conditions</h1>
        <p className="text-xs text-luxury-muted mt-1">Governed by Indian Law and Bengaluru Jurisdiction</p>
      </div>

      <div className="bg-white p-8 border border-luxury-border space-y-6 text-xs sm:text-sm text-luxury-text leading-relaxed">
        <section className="space-y-2">
          <h3 className="font-serif text-lg font-semibold text-luxury-dark">1. Agreement to Terms</h3>
          <p>By accessing and placing an order on Nitro Hub (operated by Nitro Hub Apparel Pvt. Ltd.), you agree to be bound by these Terms of Sale and our associated policies.</p>
        </section>

        <section className="space-y-2">
          <h3 className="font-serif text-lg font-semibold text-luxury-dark">2. Pricing, Invoicing & Taxes</h3>
          <p>All prices displayed on the website are in Indian Rupees (INR) and are inclusive of applicable Goods and Services Tax (GST). Product prices are verified server-side at the time of checkout.</p>
        </section>

        <section className="space-y-2">
          <h3 className="font-serif text-lg font-semibold text-luxury-dark">3. Governing Law & Dispute Resolution</h3>
          <p>These terms shall be governed by and construed in accordance with the laws of the Republic of India. Any disputes arising in connection with transactions on this platform shall be subject to the exclusive jurisdiction of the competent courts in Bengaluru, Karnataka.</p>
        </section>
      </div>
    </div>
  );
};
