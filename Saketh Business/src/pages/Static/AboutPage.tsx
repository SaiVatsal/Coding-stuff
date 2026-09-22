import React from 'react';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { SEO } from '../../components/common/SEO';
import { ShieldCheck, Sparkles, Feather, TrendingDown } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 text-luxury-text">
      <SEO title="About Nitro Hub — Accessible Luxury Apparel" />

      <Breadcrumbs items={[{ label: 'About Nitro Hub' }]} />

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-luxury-accent">
          Our Heritage & Philosophy
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl text-luxury-dark font-medium leading-tight">
          Quiet Luxury. Honest Prices.
        </h1>
        <p className="text-xs sm:text-sm text-luxury-muted leading-relaxed">
          Nitro Hub was born from a singular question: Why do high-grade natural fabrics like pure European linen and combed Mulmul cotton carry 500% markups in luxury boutiques?
        </p>
      </div>

      {/* Hero Image */}
      <div className="aspect-[21/9] overflow-hidden border border-luxury-border">
        <img
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1600&auto=format&fit=crop"
          alt="Nitro Hub Apparel Weave"
          className="w-full h-full object-cover"
        />
      </div>

      {/* The 4 Brand Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6">
        <div className="p-6 bg-white border border-luxury-border space-y-3 shadow-soft">
          <Feather className="w-6 h-6 text-luxury-accent" />
          <h3 className="font-serif text-base font-semibold text-luxury-dark">
            Artisanal Natural Fibers
          </h3>
          <p className="text-xs text-luxury-muted leading-relaxed">
            We work exclusively with pure European flax linen, GOTS-certified combed cotton, and hand-spun Chanderi silk. No cheap polyester fillers or synthetic blends.
          </p>
        </div>

        <div className="p-6 bg-white border border-luxury-border space-y-3 shadow-soft">
          <TrendingDown className="w-6 h-6 text-luxury-accent" />
          <h3 className="font-serif text-base font-semibold text-luxury-dark">
            Direct-From-Mill Sourcing
          </h3>
          <p className="text-xs text-luxury-muted leading-relaxed">
            By purchasing directly from manufacturers in wholesale volumes, we pass the margin savings directly to our customers.
          </p>
        </div>

        <div className="p-6 bg-white border border-luxury-border space-y-3 shadow-soft">
          <ShieldCheck className="w-6 h-6 text-luxury-accent" />
          <h3 className="font-serif text-base font-semibold text-luxury-dark">
            Consumer Protection Compliant
          </h3>
          <p className="text-xs text-luxury-muted leading-relaxed">
            Full compliance with India's Consumer Protection (E-Commerce) Rules 2020. 7-day doorstep return pickup and instant Razorpay refunds.
          </p>
        </div>
      </div>
    </div>
  );
};
