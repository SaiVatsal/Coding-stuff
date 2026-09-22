import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  ShoppingBag,
  Star,
  Truck,
  RotateCcw,
  ShieldCheck,
  Ruler,
  ArrowRight,
} from 'lucide-react';
import { ImageGallery } from '../components/product/ImageGallery';
import { SizeGuideModal } from '../components/product/SizeGuideModal';
import { StockUrgency } from '../components/product/StockUrgency';
import { ReviewSection } from '../components/product/ReviewSection';
import { ProductCard } from '../components/product/ProductCard';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { SEO } from '../components/common/SEO';
import { useCartStore } from '../store/useCartStore';
import { useWishlistStore } from '../store/useWishlistStore';
import { useUIStore } from '../store/useUIStore';
import { nitroDataService } from '../lib/supabase/service';
import { lookupIndianPincode } from '../lib/pincode/delivery';
import type { Product, ProductVariant } from '../types';

export const ProductDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const product = useMemo<Product | null>(() => {
    return slug ? nitroDataService.getProductBySlug(slug) : null;
  }, [slug]);

  // Selected variant options
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'fabric' | 'care' | 'delivery' | 'reviews'>('details');

  // Pincode lookup state
  const [pincodeInput, setPincodeInput] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState<ReturnType<typeof lookupIndianPincode> | null>(null);
  const [pincodeError, setPincodeError] = useState('');

  const { addItem } = useCartStore();
  const { openCartDrawer } = useUIStore();
  const { isInWishlist, toggleWishlist } = useWishlistStore();

  // Set initial selected variant
  const availableVariants: ProductVariant[] = product?.variants || [];
  const activeColorId = selectedColorId || availableVariants[0]?.color_id;
  const activeSizeId =
    selectedSizeId ||
    availableVariants.find((v: ProductVariant) => v.available_stock > 0)?.size_id ||
    availableVariants[0]?.size_id;

  const currentVariant =
    availableVariants.find(
      (v: ProductVariant) => v.color_id === activeColorId && v.size_id === activeSizeId
    ) || availableVariants[0];

  const inWishlist = product ? isInWishlist(product.id) : false;

  const handlePincodeCheck = (e: React.FormEvent) => {
    e.preventDefault();
    setPincodeError('');
    const res = lookupIndianPincode(pincodeInput);
    if (!res) {
      setPincodeError('Please enter a valid 6-digit Indian PIN code.');
      setDeliveryInfo(null);
    } else {
      setDeliveryInfo(res);
    }
  };

  const handleAddToCart = () => {
    if (!product || !currentVariant) return;
    addItem(product, currentVariant, 1);
    openCartDrawer();
  };

  const handleBuyNow = () => {
    if (!product || !currentVariant) return;
    addItem(product, currentVariant, 1);
    navigate('/checkout');
  };

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-serif text-2xl text-luxury-dark">Garment Not Found</h2>
        <p className="text-xs text-luxury-muted">
          The requested style may be archived or out of production.
        </p>
        <Link to="/women">
          <Button variant="primary">Explore Catalog</Button>
        </Link>
      </div>
    );
  }

  const relatedProducts: Product[] = nitroDataService
    .getProducts({ gender: product.gender })
    .filter((p: Product) => p.id !== product.id)
    .slice(0, 4);

  const discountPercent =
    product.mrp > product.selling_price
      ? Math.round(((product.mrp - product.selling_price) / product.mrp) * 100)
      : 0;

  const isSoldOut = !product.variants.some((v: ProductVariant) => v.available_stock > 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      <SEO
        title={`${product.name} — Nitro Hub`}
        description={product.short_description || product.description}
        image={product.images[0]?.image_url}
      />

      <Breadcrumbs
        items={[
          { label: product.gender.toUpperCase(), href: `/${product.gender}` },
          { label: product.category?.name || 'Garments', href: `/category/${product.category?.slug}` },
          { label: product.name },
        ]}
      />

      {/* Main PDP Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left 7 Cols: Image Gallery */}
        <div className="lg:col-span-7">
          <ImageGallery images={product.images} productName={product.name} />
        </div>

        {/* Right 5 Cols: Garment Specs, Sizing & Actions */}
        <div className="lg:col-span-5 space-y-6">
          {/* Header & Title */}
          <div className="space-y-2 pb-4 border-b border-luxury-border">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-luxury-accent">
                {product.brand}
              </span>
              <div className="flex items-center space-x-1.5 text-xs text-luxury-muted">
                <div className="flex items-center text-luxury-gold">
                  <Star className="w-3.5 h-3.5 fill-luxury-gold text-luxury-gold" />
                  <span className="font-semibold ml-1 text-luxury-dark">{product.rating_avg}</span>
                </div>
                <span>•</span>
                <span className="text-[11px] underline cursor-pointer" onClick={() => setActiveTab('reviews')}>
                  {product.review_count} verified reviews
                </span>
              </div>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl text-luxury-dark font-medium leading-tight">
              {product.name}
            </h1>

            <p className="text-xs text-luxury-muted">{product.short_description}</p>
          </div>

          {/* Pricing Block */}
          <div className="flex items-baseline space-x-3">
            <span className="font-serif text-3xl font-bold text-luxury-dark">
              ₹{product.selling_price.toLocaleString('en-IN')}
            </span>
            {product.mrp > product.selling_price && (
              <>
                <span className="text-sm text-luxury-muted line-through">
                  ₹{product.mrp.toLocaleString('en-IN')}
                </span>
                <span className="text-xs font-semibold text-luxury-accent bg-luxury-accent-light px-2 py-0.5 border border-luxury-accent/20">
                  {discountPercent}% OFF
                </span>
              </>
            )}
            <div className="text-[10px] text-luxury-muted uppercase tracking-wider ml-auto">
              Inclusive of all taxes (GST)
            </div>
          </div>

          {/* Color Selector */}
          {product.variants.some((v: ProductVariant) => v.color) && (
            <div className="space-y-2">
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-luxury-muted">
                Color:{' '}
                <span className="text-luxury-dark font-medium">
                  {currentVariant?.color?.name || 'Selected'}
                </span>
              </label>
              <div className="flex flex-wrap gap-2.5">
                {Array.from(new Set(product.variants.map((v: ProductVariant) => v.color_id))).map((colorId) => {
                  const variant = product.variants.find((v: ProductVariant) => v.color_id === colorId);
                  if (!variant) return null;
                  const isSelected = activeColorId === colorId;
                  return (
                    <button
                      key={String(colorId)}
                      onClick={() => setSelectedColorId(String(colorId))}
                      className={`relative w-8 h-8 rounded-none border transition-all p-0.5 ${
                        isSelected
                          ? 'border-luxury-dark ring-2 ring-luxury-dark ring-offset-1'
                          : 'border-luxury-border hover:border-luxury-dark'
                      }`}
                      title={variant.color.name}
                    >
                      <span
                        className="w-full h-full block rounded-none"
                        style={{ backgroundColor: variant.color.hex_code }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Size Selector + Size Guide */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-luxury-muted">
                Select Size:
              </label>
              <button
                type="button"
                onClick={() => setIsSizeGuideOpen(true)}
                className="text-[11px] text-luxury-accent hover:underline font-semibold uppercase tracking-wider inline-flex items-center"
              >
                <Ruler className="w-3.5 h-3.5 mr-1" />
                <span>Size Guide (CM / INCH)</span>
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {product.variants.map((v: ProductVariant) => {
                const isSelected = activeSizeId === v.size_id;
                const isAvailable = v.available_stock > 0;

                return (
                  <button
                    key={v.id}
                    disabled={!isAvailable}
                    onClick={() => setSelectedSizeId(v.size_id)}
                    className={`py-2.5 text-xs font-semibold uppercase tracking-wider border transition-colors ${
                      isSelected
                        ? 'bg-luxury-dark text-white border-luxury-dark'
                        : isAvailable
                        ? 'bg-white text-luxury-dark border-luxury-border hover:border-luxury-border-dark'
                        : 'bg-luxury-bg-subtle text-luxury-faint border-luxury-border cursor-not-allowed line-through'
                    }`}
                  >
                    {v.size.code}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stock Urgency Indicator */}
          {currentVariant && (
            <StockUrgency availableStock={currentVariant.available_stock} />
          )}

          {/* Action CTAs: Add to Bag, Buy Now, Wishlist */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center space-x-3">
              <Button
                variant="primary"
                size="lg"
                className="flex-1 shadow-lift"
                disabled={isSoldOut || (currentVariant && currentVariant.available_stock <= 0)}
                leftIcon={<ShoppingBag className="w-4 h-4" />}
                onClick={handleAddToCart}
              >
                {isSoldOut ? 'Sold Out' : 'Add to Bag'}
              </Button>

              <button
                type="button"
                onClick={() => toggleWishlist(product)}
                className={`p-3.5 border transition-colors ${
                  inWishlist
                    ? 'border-luxury-accent text-luxury-accent bg-luxury-accent-light/50'
                    : 'border-luxury-border text-luxury-muted hover:text-luxury-dark hover:border-luxury-border-dark'
                }`}
                title={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
              >
                <Heart className={`w-5 h-5 ${inWishlist ? 'fill-luxury-accent' : ''}`} />
              </button>
            </div>

            <Button
              variant="secondary"
              size="lg"
              className="w-full font-semibold"
              disabled={isSoldOut || (currentVariant && currentVariant.available_stock <= 0)}
              onClick={handleBuyNow}
            >
              Instant Express Checkout
            </Button>
          </div>

          {/* Delivery & Pincode Checker */}
          <div className="p-4 bg-luxury-bg-subtle border border-luxury-border space-y-3">
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-luxury-dark">
              <Truck className="w-4 h-4 text-luxury-accent" />
              <span>Pan-India Delivery Estimate</span>
            </div>

            <form onSubmit={handlePincodeCheck} className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                placeholder="Enter 6-Digit PIN Code"
                value={pincodeInput}
                onChange={(e) => setPincodeInput(e.target.value)}
                className="flex-1 px-3 py-2 bg-white border border-luxury-border text-xs focus:outline-none focus:border-luxury-dark"
              />
              <Button type="submit" variant="secondary" size="sm">
                Check
              </Button>
            </form>

            {pincodeError && <p className="text-[11px] text-luxury-red">{pincodeError}</p>}

            {deliveryInfo && (
              <div className="space-y-1 text-xs text-luxury-dark animate-fade-in">
                <div className="font-semibold text-luxury-green">
                  ✓ Serviceable to {deliveryInfo.city}, {deliveryInfo.state}
                </div>
                <div className="text-[11px] text-luxury-muted">
                  Estimated delivery in <strong>{deliveryInfo.estimatedDays} business days</strong> ({deliveryInfo.courierPartner})
                </div>
                <div className="text-[11px] text-luxury-muted">
                  Cash on Delivery: {deliveryInfo.isCodAvailable ? 'Available' : 'Unavailable'}
                </div>
              </div>
            )}
          </div>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-luxury-muted">
            <div className="flex items-center space-x-2">
              <RotateCcw className="w-4 h-4 text-luxury-accent flex-shrink-0" />
              <span>7-Day Doorstep Returns</span>
            </div>
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-luxury-accent flex-shrink-0" />
              <span>100% Certified Fabrics</span>
            </div>
          </div>
        </div>
      </div>

      {/* Editorial Tabs: Story, Fabric Specs, Care, Shipping, Reviews */}
      <div className="pt-8 border-t border-luxury-border space-y-6">
        <div className="flex border-b border-luxury-border overflow-x-auto space-x-8 text-xs font-semibold uppercase tracking-wider">
          {[
            { key: 'details', label: 'Editorial Description' },
            { key: 'fabric', label: 'Fabric & Composition' },
            { key: 'care', label: 'Wash & Garment Care' },
            { key: 'delivery', label: 'Shipping & Returns' },
            { key: 'reviews', label: `Reviews (${product.review_count})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`pb-3 border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'border-luxury-dark text-luxury-dark'
                  : 'border-transparent text-luxury-muted hover:text-luxury-dark'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="text-xs sm:text-sm text-luxury-text leading-relaxed max-w-3xl">
          {activeTab === 'details' && (
            <div className="space-y-4">
              <p>{product.description}</p>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-luxury-border text-xs">
                <div>
                  <span className="text-luxury-muted block">Garment Weight:</span>
                  <span className="font-medium text-luxury-dark">{product.weight_grams} grams</span>
                </div>
                <div>
                  <span className="text-luxury-muted block">Indian HSN Code:</span>
                  <span className="font-mono text-luxury-dark">{product.hsn_code}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'fabric' && (
            <div className="space-y-3">
              <div>
                <strong className="text-luxury-dark block">Primary Material:</strong>
                <span>{product.material}</span>
              </div>
              <div>
                <strong className="text-luxury-dark block">Composition Breakdown:</strong>
                <span>{product.fabric_composition}</span>
              </div>
              <p className="text-xs text-luxury-muted pt-2">
                We strictly adhere to zero synthetic fillers. Our cottons and linens are ethically sourced from OEKO-TEX and GOTS certified mills across India and Europe.
              </p>
            </div>
          )}

          {activeTab === 'care' && (
            <div className="space-y-2">
              <p>{product.care_instructions}</p>
              <ul className="list-disc list-inside space-y-1 text-luxury-muted text-xs pt-2">
                <li>Always wash dark colors separately in cold water.</li>
                <li>Avoid chlorine-based bleaches to maintain fiber tensile strength.</li>
                <li>Warm iron on reverse side while slightly damp for crisp drape.</li>
              </ul>
            </div>
          )}

          {activeTab === 'delivery' && (
            <div className="space-y-3">
              <p>
                <strong>Dispatch:</strong> Orders are dispatched from our Bengaluru warehouse within 24 hours.
              </p>
              <p>
                <strong>Complimentary Delivery:</strong> Orders above ₹999 qualify for free express air shipping across India.
              </p>
              <p>
                <strong>7-Day Returns:</strong> If the fit or feel isn't perfect, initiate a doorstep pickup from your account within 7 days of delivery.
              </p>
            </div>
          )}

          {activeTab === 'reviews' && (
            <ReviewSection productId={product.id} ratingAvg={product.rating_avg} reviewCount={product.review_count} />
          )}
        </div>
      </div>

      {/* Related Products Rail */}
      {relatedProducts.length > 0 && (
        <div className="pt-12 border-t border-luxury-border space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-2xl text-luxury-dark">You May Also Admire</h3>
            <Link
              to={`/${product.gender}`}
              className="text-xs font-semibold uppercase tracking-wider text-luxury-accent hover:underline flex items-center"
            >
              <span>Explore More</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((p: Product) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Size Guide Modal */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        gender={product.gender}
        categorySlug={product.subcategory?.slug || 'women_dresses'}
      />
    </div>
  );
};
