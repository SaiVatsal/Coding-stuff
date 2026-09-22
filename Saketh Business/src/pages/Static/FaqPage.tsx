import React, { useState } from 'react';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { SEO } from '../../components/common/SEO';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    q: 'How does Nitro Hub offer premium fabrics at accessible prices?',
    a: 'We source fabric rolls and finished garments in wholesale quantities directly from certified mills in India and Europe, eliminating third-party brand licensing fees and expensive traditional boutique overheads.',
  },
  {
    q: 'What are the delivery timelines across India?',
    a: 'Metro cities (Bengaluru, Mumbai, Delhi NCR, Hyderabad, Chennai) receive deliveries within 2-3 business days via BlueDart Air. Tier 2 and Tier 3 regions take 3-5 business days via Delhivery surface express.',
  },
  {
    q: 'What is your return & exchange policy?',
    a: 'We offer a 7-day hassle-free doorstep return policy. You can request a return from your Account page. Our courier will pick up the package from your doorstep, and your refund will be credited back to your original payment method or bank account.',
  },
  {
    q: 'Are GST invoices provided for every purchase?',
    a: 'Yes, every order includes a downloadable GST-compliant Tax Invoice featuring our GSTIN (Karnataka), HSN codes for each line item, and CGST/SGST or IGST itemization.',
  },
  {
    q: 'Is Cash on Delivery (COD) available?',
    a: 'Yes, COD is available for serviceable Indian pincodes on orders up to ₹5,000. A standard convenience fee of ₹49 is applied to COD orders.',
  },
  {
    q: 'How do I determine my size accurately?',
    a: 'Every product page features a Size Guide with precise garment measurements in both centimeters and inches. You can also refer to our visual measuring instructions.',
  },
];

export const FaqPage: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-luxury-text">
      <SEO title="Frequently Asked Questions — Nitro Hub" />

      <Breadcrumbs items={[{ label: 'Frequently Asked Questions' }]} />

      <div className="pb-4 border-b border-luxury-border">
        <h1 className="font-serif text-3xl sm:text-4xl text-luxury-dark">Frequently Asked Questions</h1>
        <p className="text-xs text-luxury-muted mt-1">Everything you need to know about our fabrics, shipping, and returns</p>
      </div>

      <div className="divide-y divide-luxury-border bg-white border border-luxury-border">
        {FAQS.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div key={idx} className="p-5">
              <button
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full flex items-center justify-between text-left font-serif text-base font-semibold text-luxury-dark hover:text-luxury-accent transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-luxury-muted transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-luxury-accent' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <p className="text-xs sm:text-sm text-luxury-muted mt-3 leading-relaxed animate-fade-in">
                  {faq.a}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
