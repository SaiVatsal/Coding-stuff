import React, { useState } from 'react';
import { Mail, Phone, MapPin, Shield, CheckCircle2, Clock } from 'lucide-react';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { SEO } from '../../components/common/SEO';
import { SELLER_GSTIN, SELLER_STATE } from '../../lib/gst/calculator';

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    orderNumber: '',
    message: '',
  });
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSent(true);
    setTimeout(() => {
      setIsSent(false);
      setFormData({ name: '', email: '', phone: '', orderNumber: '', message: '' });
    }, 3000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 text-luxury-text">
      <SEO title="Contact & Seller Disclosures — Nitro Hub" />

      <Breadcrumbs items={[{ label: 'Contact Us & Seller Disclosures' }]} />

      <div className="pb-4 border-b border-luxury-border">
        <h1 className="font-serif text-3xl sm:text-4xl text-luxury-dark">Customer Support & Disclosures</h1>
        <p className="text-xs text-luxury-muted mt-1">
          Consumer Protection (E-Commerce) Rules 2020 Official Seller Disclosures
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left: Contact Form */}
        <div className="md:col-span-7 bg-white p-6 sm:p-8 border border-luxury-border shadow-soft space-y-6">
          <div>
            <h2 className="font-serif text-xl text-luxury-dark font-semibold">Send Us a Message</h2>
            <p className="text-xs text-luxury-muted">Our concierge team responds within 2-4 business hours.</p>
          </div>

          {isSent && (
            <div className="p-4 bg-luxury-green-light border border-luxury-green/30 text-luxury-green text-xs font-medium flex items-center space-x-2 animate-fade-in">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>Your message has been received. Our support team will follow up via email.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name *"
                required
                placeholder="e.g. Priya Sharma"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <Input
                label="Email Address *"
                type="email"
                required
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Mobile Phone"
                placeholder="e.g. 9876543210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <Input
                label="Order Number (If applicable)"
                placeholder="e.g. NH-2025-08491"
                value={formData.orderNumber}
                onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-luxury-muted mb-1.5">
                How Can We Assist You? *
              </label>
              <textarea
                required
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Describe your inquiry regarding styling, sizing, dispatch, or returns..."
                className="w-full px-3.5 py-2.5 bg-white border border-luxury-border text-xs text-luxury-text focus:outline-none focus:border-luxury-dark rounded-none"
              />
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full sm:w-auto">
              Submit Inquiry
            </Button>
          </form>
        </div>

        {/* Right: Seller Legal Disclosures */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-white p-6 border border-luxury-border space-y-4 text-xs">
            <h3 className="font-serif text-base font-semibold text-luxury-dark pb-2 border-b border-luxury-border">
              Registered Seller Entity
            </h3>

            <div className="space-y-2.5 text-luxury-muted leading-relaxed">
              <div>
                <strong className="text-luxury-dark block">Legal Business Name:</strong>
                Nitro Hub Apparel Private Limited
              </div>

              <div>
                <strong className="text-luxury-dark block">GST Identification Number (GSTIN):</strong>
                {SELLER_GSTIN} (Karnataka - Code 29)
              </div>

              <div className="flex items-start space-x-2 pt-1">
                <MapPin className="w-4 h-4 text-luxury-accent flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Headquarters & Fulfillment Hub:</strong>
                  <div>104, Indiranagar 100ft Road, Stage 2</div>
                  <div>Bengaluru, Karnataka - 560038, India</div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-luxury-accent flex-shrink-0" />
                <div>
                  <strong>Email:</strong> support@nitrohub.in
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-luxury-accent flex-shrink-0" />
                <div>
                  <strong>Phone:</strong> +91 80 4912 3456 (Mon - Sat, 10 AM - 7 PM IST)
                </div>
              </div>
            </div>
          </div>

          {/* Grievance Redressal Officer */}
          <div className="bg-luxury-bg-subtle p-6 border border-luxury-border space-y-3 text-xs">
            <div className="flex items-center space-x-2 text-luxury-accent font-semibold uppercase tracking-wider">
              <Shield className="w-4 h-4" />
              <span>Grievance Redressal Officer</span>
            </div>
            <p className="text-luxury-muted text-[11px] leading-relaxed">
              In accordance with the Information Technology Act 2000 and Consumer Protection Rules:
            </p>
            <div className="text-luxury-dark font-medium space-y-1">
              <div>Name: <strong>Mr. Rajesh K. Nair</strong></div>
              <div>Designation: Head of Consumer Grievance & Compliance</div>
              <div>Email: grievance@nitrohub.in</div>
              <div>Acknowledgment timeline: Within 48 hours | Resolution: Max 30 days</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
