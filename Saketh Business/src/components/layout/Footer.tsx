import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import { SELLER_GSTIN } from '../../lib/gst/calculator';

export const Footer: React.FC = () => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setIsSubscribed(true);
      setNewsletterEmail('');
    }
  };

  return (
    <footer className="bg-luxury-bg-subtle border-t border-luxury-border pt-16 pb-20 md:pb-12 text-luxury-text">
      {/* Brand Value Pillars */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 border-b border-luxury-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-2 md:space-y-0 md:space-x-4">
            <div className="p-3 bg-white border border-luxury-border text-luxury-accent">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif text-sm font-semibold text-luxury-dark uppercase tracking-wider">
                Wholesale Sourcing. Fair Pricing.
              </h4>
              <p className="text-xs text-luxury-muted mt-1">
                Direct partnerships with artisanal Indian mills. No middleman boutique markup.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-start space-y-2 md:space-y-0 md:space-x-4">
            <div className="p-3 bg-white border border-luxury-border text-luxury-accent">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif text-sm font-semibold text-luxury-dark uppercase tracking-wider">
                Express Pan-India Delivery
              </h4>
              <p className="text-xs text-luxury-muted mt-1">
                Shipped via BlueDart & Delhivery with complimentary shipping on orders above ₹999.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-start space-y-2 md:space-y-0 md:space-x-4">
            <div className="p-3 bg-white border border-luxury-border text-luxury-accent">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif text-sm font-semibold text-luxury-dark uppercase tracking-wider">
                7-Day Seamless Returns
              </h4>
              <p className="text-xs text-luxury-muted mt-1">
                Hassle-free doorstep pickup and instant Razorpay refund processing.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Brand Col & Newsletter */}
          <div className="md:col-span-4 space-y-4">
            <Link to="/" className="inline-block">
              <span className="font-brand font-bold text-xl tracking-[0.2em] text-luxury-dark">
                NITRO HUB
              </span>
              <span className="block text-[8px] tracking-[0.25em] uppercase text-luxury-muted -mt-0.5">
                Accessible Luxury Apparel
              </span>
            </Link>
            <p className="text-xs text-luxury-muted leading-relaxed max-w-sm">
              Nitro Hub is built on the philosophy of quiet luxury. We craft garments from pure European linen, combed GOTS cotton, and hand-block silks without exorbitant retail markups.
            </p>

            {/* Newsletter Form */}
            <div className="pt-2">
              <span className="block text-[11px] font-semibold uppercase tracking-widest text-luxury-dark mb-2">
                Join the Private Edit
              </span>
              {isSubscribed ? (
                <div className="flex items-center space-x-2 text-xs text-luxury-green font-medium py-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Thank you. You are on the private access list.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address..."
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 bg-white border border-luxury-border text-xs text-luxury-text placeholder-luxury-faint focus:outline-none focus:border-luxury-dark"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-luxury-dark text-white text-xs uppercase tracking-wider font-medium hover:bg-luxury-charcoal transition-colors flex items-center"
                    aria-label="Subscribe to newsletter"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Col 2: Shop */}
          <div className="md:col-span-2">
            <h4 className="text-[11px] font-semibold uppercase tracking-widest text-luxury-dark mb-4">
              Shop
            </h4>
            <ul className="space-y-2.5 text-xs text-luxury-muted">
              <li>
                <Link to="/women" className="hover:text-luxury-accent transition-colors">
                  Women's Collection
                </Link>
              </li>
              <li>
                <Link to="/men" className="hover:text-luxury-accent transition-colors">
                  Men's Apparel
                </Link>
              </li>
              <li>
                <Link to="/new-arrivals" className="hover:text-luxury-accent transition-colors">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link to="/sale" className="hover:text-luxury-accent text-luxury-accent font-medium">
                  Seasonal Sale
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Customer Care */}
          <div className="md:col-span-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-widest text-luxury-dark mb-4">
              Customer Care
            </h4>
            <ul className="space-y-2.5 text-xs text-luxury-muted">
              <li>
                <Link to="/account/orders" className="hover:text-luxury-accent transition-colors">
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link to="/shipping-policy" className="hover:text-luxury-accent transition-colors">
                  Shipping & Delivery
                </Link>
              </li>
              <li>
                <Link to="/returns-policy" className="hover:text-luxury-accent transition-colors">
                  Returns & Exchanges
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-luxury-accent transition-colors">
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-luxury-accent transition-colors">
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Legal & Compliance */}
          <div className="md:col-span-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-widest text-luxury-dark mb-4">
              Legal & Disclosures
            </h4>
            <ul className="space-y-2 text-xs text-luxury-muted">
              <li>
                <Link to="/about" className="hover:text-luxury-accent transition-colors">
                  About Nitro Hub
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="hover:text-luxury-accent transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-luxury-accent transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/cancellation-policy" className="hover:text-luxury-accent transition-colors">
                  Cancellation Policy
                </Link>
              </li>
            </ul>
            <div className="mt-4 pt-3 border-t border-luxury-border/60 text-[10px] text-luxury-muted space-y-1">
              <div><strong className="text-luxury-dark">Entity:</strong> Nitro Hub Apparel Pvt. Ltd.</div>
              <div><strong className="text-luxury-dark">GSTIN:</strong> {SELLER_GSTIN}</div>
              <div><strong className="text-luxury-dark">Origin:</strong> Made in India (100%)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar & Indian Payment Badges */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-luxury-border flex flex-col sm:flex-row items-center justify-between text-xs text-luxury-muted space-y-4 sm:space-y-0">
        <div>
          © {new Date().getFullYear()} Nitro Hub Apparel Pvt. Ltd. All rights reserved. Consumer Protection (E-Commerce) Rules 2020 Compliant.
        </div>

        {/* Payment Rails */}
        <div className="flex items-center space-x-2 text-[10px] uppercase tracking-wider font-semibold text-luxury-muted">
          <span className="px-2 py-1 bg-white border border-luxury-border">UPI</span>
          <span className="px-2 py-1 bg-white border border-luxury-border">RuPay</span>
          <span className="px-2 py-1 bg-white border border-luxury-border">Cards</span>
          <span className="px-2 py-1 bg-white border border-luxury-border">NetBanking</span>
          <span className="px-2 py-1 bg-white border border-luxury-border">COD</span>
        </div>
      </div>
    </footer>
  );
};
