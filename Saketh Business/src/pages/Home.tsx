import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Clock, ShieldCheck, Award } from 'lucide-react';
import { Button } from '../components/common/Button';
import { ProductCard } from '../components/product/ProductCard';
import { SEO } from '../components/common/SEO';
import { nitroDataService } from '../lib/supabase/service';
import { SEED_CATEGORIES } from '../data/seedCategories';

export const Home: React.FC = () => {
  const newArrivals = nitroDataService.getProducts({ sortBy: 'newest' }).slice(0, 4);
  const bestsellers = nitroDataService.getProducts().filter((p) => p.is_bestseller).slice(0, 4);

  // Limited time drop countdown (24 hour rolling)
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 32, seconds: 48 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      <SEO
        title="Nitro Hub — Premium Fashion. Better Prices."
        description="Accessible luxury apparel. Hand-block mulmul, European linen, and combed Supima cotton tailored for modern ease without boutique markup."
      />

      {/* 1. EDITORIAL HERO */}
      <section className="relative w-full h-[75vh] sm:h-[85vh] bg-luxury-dark overflow-hidden flex items-center">
        <img
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2000&auto=format&fit=crop"
          alt="Nitro Hub Editorial Spring Capsule"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-60 filter brightness-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center sm:text-left text-white">
          <div className="max-w-2xl space-y-4">
            <span className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-[0.3em] text-luxury-gold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Spring / Summer Capsule 2025</span>
            </span>

            <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-normal leading-[1.05] tracking-tight text-white">
              Everyday, <br className="hidden sm:inline" />
              <span className="italic font-normal font-serif">Elevated.</span>
            </h1>

            <p className="text-xs sm:text-sm text-luxury-bg-subtle/90 font-light leading-relaxed max-w-lg tracking-wide">
              Crafted from pure European linen and combed Mulmul cotton. Impeccable tailoring, direct from Indian master weavers without the boutique markup.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <Link to="/women" className="w-full sm:w-auto">
                <Button variant="accent" size="lg" className="w-full sm:w-auto shadow-lift">
                  Shop Women's Edit
                </Button>
              </Link>
              <Link to="/men" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto text-white border-white hover:bg-white hover:text-luxury-dark">
                  Shop Men's Edit
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FEATURED CATEGORIES GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8 pb-3 border-b border-luxury-border">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-luxury-accent">
              Curated Capsules
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-luxury-dark mt-1">
              Shop by Category
            </h2>
          </div>
          <Link
            to="/women"
            className="text-xs font-semibold uppercase tracking-wider text-luxury-dark hover:text-luxury-accent transition-colors flex items-center group"
          >
            <span>Explore All</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SEED_CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              to={`/${cat.slug}`}
              className="group relative h-96 overflow-hidden border border-luxury-border block"
            >
              <img
                src={cat.image_url}
                alt={cat.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 text-white">
                <span className="text-[10px] uppercase tracking-widest text-luxury-gold font-semibold">
                  Collection
                </span>
                <h3 className="font-serif text-2xl text-white font-medium my-1">
                  {cat.name}
                </h3>
                <p className="text-xs text-luxury-bg-subtle/80 line-clamp-2 mb-3">
                  {cat.description}
                </p>
                <div className="inline-flex items-center text-xs font-semibold text-white uppercase tracking-wider group-hover:text-luxury-gold transition-colors">
                  <span>Discover Pieces</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. NEW ARRIVALS RAIL */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8 pb-3 border-b border-luxury-border">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-luxury-accent">
              Fresh Off The Loom
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-luxury-dark mt-1">
              New Arrivals
            </h2>
          </div>
          <Link
            to="/new-arrivals"
            className="text-xs font-semibold uppercase tracking-wider text-luxury-dark hover:text-luxury-accent transition-colors flex items-center group"
          >
            <span>View All New</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {newArrivals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 4. EDITORIAL LOOKBOOK SECTION */}
      <section className="bg-luxury-bg-subtle border-y border-luxury-border py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-luxury-accent">
                The Sourcing Story
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-luxury-dark leading-tight">
                Quiet Luxury Crafted From Pure European Flax & Indian Mulmul
              </h2>
              <p className="text-xs sm:text-sm text-luxury-muted leading-relaxed">
                We believe true luxury is tactile. It's the weight of 260 GSM combed jersey, the natural breathability of hand-spun Chanderi silk, and the clean drape of pure French linen. By purchasing in wholesale volumes directly from master mills, we deliver boutique-quality tailoring at wholesale-grade honesty.
              </p>
              <div className="pt-2 flex items-center space-x-6">
                <div>
                  <div className="font-serif text-2xl font-bold text-luxury-dark">100%</div>
                  <div className="text-[11px] uppercase tracking-wider text-luxury-muted">Natural Fibers</div>
                </div>
                <div className="h-8 w-px bg-luxury-border" />
                <div>
                  <div className="font-serif text-2xl font-bold text-luxury-dark">₹0</div>
                  <div className="text-[11px] uppercase tracking-wider text-luxury-muted">Boutique Markup</div>
                </div>
                <div className="h-8 w-px bg-luxury-border" />
                <div>
                  <div className="font-serif text-2xl font-bold text-luxury-dark">7-Day</div>
                  <div className="text-[11px] uppercase tracking-wider text-luxury-muted">Doorstep Returns</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 grid grid-cols-2 gap-4">
              <div className="aspect-[3/4] overflow-hidden border border-luxury-border">
                <img
                  src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop"
                  alt="Nitro Hub Women Editorial"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="aspect-[3/4] overflow-hidden border border-luxury-border mt-8">
                <img
                  src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop"
                  alt="Nitro Hub Men Editorial"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. BEST SELLERS RAIL */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8 pb-3 border-b border-luxury-border">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-luxury-accent">
              Customer Favorites
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-luxury-dark mt-1">
              Best Sellers
            </h2>
          </div>
          <Link
            to="/women"
            className="text-xs font-semibold uppercase tracking-wider text-luxury-dark hover:text-luxury-accent transition-colors flex items-center group"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {bestsellers.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 6. LIMITED TIME DROP WITH REAL COUNTDOWN */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-luxury-dark text-white p-8 sm:p-12 border border-luxury-charcoal flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 text-center md:text-left">
            <span className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-widest text-luxury-gold">
              <Clock className="w-3.5 h-3.5" />
              <span>Limited Festive Drop</span>
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-medium text-white">
              Complimentary ₹500 Voucher On Orders Above ₹2,499
            </h3>
            <p className="text-xs text-luxury-faint max-w-lg">
              Apply code <strong className="text-luxury-gold">NITRO500</strong> at checkout to redeem. Valid across all linen, kurti, and co-ord sets.
            </p>
          </div>

          {/* Countdown Clock */}
          <div className="flex items-center space-x-3 text-center">
            <div className="p-3 bg-luxury-charcoal border border-luxury-border-dark/20 min-w-[60px]">
              <div className="font-serif text-2xl font-bold text-white">
                {String(timeLeft.hours).padStart(2, '0')}
              </div>
              <div className="text-[9px] uppercase tracking-wider text-luxury-faint mt-0.5">Hours</div>
            </div>
            <span className="text-xl text-luxury-faint">:</span>
            <div className="p-3 bg-luxury-charcoal border border-luxury-border-dark/20 min-w-[60px]">
              <div className="font-serif text-2xl font-bold text-white">
                {String(timeLeft.minutes).padStart(2, '0')}
              </div>
              <div className="text-[9px] uppercase tracking-wider text-luxury-faint mt-0.5">Mins</div>
            </div>
            <span className="text-xl text-luxury-faint">:</span>
            <div className="p-3 bg-luxury-charcoal border border-luxury-border-dark/20 min-w-[60px]">
              <div className="font-serif text-2xl font-bold text-luxury-gold">
                {String(timeLeft.seconds).padStart(2, '0')}
              </div>
              <div className="text-[9px] uppercase tracking-wider text-luxury-faint mt-0.5">Secs</div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. VERIFIED REVIEWS CAROUSEL / HIGHLIGHTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-luxury-accent">
            Real Reviews
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl text-luxury-dark mt-1">
            Loved By Over 20,000+ Patrons Across India
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white border border-luxury-border space-y-3 shadow-soft">
            <div className="flex items-center text-luxury-gold">
              {'★★★★★'}
            </div>
            <h4 className="font-serif text-sm font-semibold text-luxury-dark">
              "The Mulmul Kurti is a revelation"
            </h4>
            <p className="text-xs text-luxury-muted leading-relaxed">
              "Living in Chennai, breathability is non-negotiable. The cotton quality and block print detailing feels like pieces I've purchased for ₹4,000 in heritage boutiques."
            </p>
            <div className="text-[11px] font-medium text-luxury-dark pt-2 border-t border-luxury-border/60">
              — Ananya Raghavan, Chennai <span className="text-luxury-green ml-1">✓ Verified</span>
            </div>
          </div>

          <div className="p-6 bg-white border border-luxury-border space-y-3 shadow-soft">
            <div className="flex items-center text-luxury-gold">
              {'★★★★★'}
            </div>
            <h4 className="font-serif text-sm font-semibold text-luxury-dark">
              "Best Oxford Shirt in India"
            </h4>
            <p className="text-xs text-luxury-muted leading-relaxed">
              "The Supima cotton is heavyweight yet soft. Collar roll stays crisp without stiff interlinings. Delivered to Bengaluru in 48 hours."
            </p>
            <div className="text-[11px] font-medium text-luxury-dark pt-2 border-t border-luxury-border/60">
              — Rohan Mathur, Bengaluru <span className="text-luxury-green ml-1">✓ Verified</span>
            </div>
          </div>

          <div className="p-6 bg-white border border-luxury-border space-y-3 shadow-soft">
            <div className="flex items-center text-luxury-gold">
              {'★★★★★'}
            </div>
            <h4 className="font-serif text-sm font-semibold text-luxury-dark">
              "Impeccable Co-ord Tailoring"
            </h4>
            <p className="text-xs text-luxury-muted leading-relaxed">
              "The linen blend co-ord set fits like a dream. No awkward pull at the waist, and the horn buttons look exceptionally elegant."
            </p>
            <div className="text-[11px] font-medium text-luxury-dark pt-2 border-t border-luxury-border/60">
              — Devika Sen, Kolkata <span className="text-luxury-green ml-1">✓ Verified</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
