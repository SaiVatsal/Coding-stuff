import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { ProductGrid } from '../components/product/ProductGrid';
import { ProductFilters } from '../components/product/ProductFilters';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { SEO } from '../components/common/SEO';
import { Drawer } from '../components/common/Drawer';
import { nitroDataService } from '../lib/supabase/service';
import { SEED_CATEGORIES } from '../data/seedCategories';
import { ProductFilters as FilterType, Product } from '../types';

export const CategoryListing: React.FC = () => {
  const location = useLocation();
  const { collectionSlug } = useParams<{ collectionSlug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Determine current gender / scope from path
  const path = location.pathname;
  let pageTitle = 'All Collections';
  let gender: 'women' | 'men' | 'unisex' | undefined = undefined;
  let categorySlug: string | undefined = undefined;

  if (path.startsWith('/women')) {
    gender = 'women';
    categorySlug = 'women';
    pageTitle = "Women's Collection";
  } else if (path.startsWith('/men')) {
    gender = 'men';
    categorySlug = 'men';
    pageTitle = "Men's Collection";
  } else if (path.startsWith('/new-arrivals')) {
    pageTitle = 'New Arrivals';
  } else if (path.startsWith('/sale')) {
    pageTitle = 'Seasonal Sale — Up to 50% Off';
  } else if (collectionSlug) {
    pageTitle = collectionSlug.replace(/-/g, ' ').toUpperCase();
  }

  const currentCategory = SEED_CATEGORIES.find((c) => c.slug === categorySlug);

  // Parse filters from URL searchParams
  const filters: FilterType = useMemo(() => {
    return {
      gender,
      subcategory: searchParams.get('sub') || undefined,
      sizes: searchParams.getAll('sizes'),
      colors: searchParams.getAll('colors'),
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      inStockOnly: searchParams.get('inStock') === 'true',
      sortBy: (searchParams.get('sort') as FilterType['sortBy']) || 'relevance',
      searchQuery: searchParams.get('q') || undefined,
    };
  }, [searchParams, gender]);

  // Update URL on filter changes
  const handleFilterChange = (newFilters: FilterType) => {
    const params = new URLSearchParams();

    if (newFilters.subcategory) params.set('sub', newFilters.subcategory);
    if (newFilters.sizes) newFilters.sizes.forEach((s) => params.append('sizes', s));
    if (newFilters.colors) newFilters.colors.forEach((c) => params.append('colors', c));
    if (newFilters.minPrice !== undefined) params.set('minPrice', String(newFilters.minPrice));
    if (newFilters.maxPrice !== undefined) params.set('maxPrice', String(newFilters.maxPrice));
    if (newFilters.inStockOnly) params.set('inStock', 'true');
    if (newFilters.sortBy && newFilters.sortBy !== 'relevance') params.set('sort', newFilters.sortBy);
    if (newFilters.searchQuery) params.set('q', newFilters.searchQuery);

    setSearchParams(params);
  };

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  // Fetch filtered products
  const products: Product[] = useMemo(() => {
    let list = nitroDataService.getProducts({
      gender: filters.gender,
      subcategory: filters.subcategory,
      sizes: filters.sizes,
      colors: filters.colors,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      inStockOnly: filters.inStockOnly,
      sortBy: filters.sortBy,
      search: filters.searchQuery,
    });

    if (path.startsWith('/sale')) {
      list = list.filter((p) => p.discount_percent > 0);
    }
    if (path.startsWith('/new-arrivals')) {
      list = list.filter((p) => p.is_new_arrival);
    }

    return list;
  }, [filters, path]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <SEO
        title={`${pageTitle} — Nitro Hub`}
        description={`Explore the ${pageTitle} at Nitro Hub. Handpicked natural fabrics, artisanal Indian craftsmanship, and refined tailoring.`}
      />

      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: pageTitle }]} />

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-luxury-border gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-luxury-accent">
            {currentCategory ? currentCategory.name : 'Capsule'}
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-luxury-dark mt-1">
            {pageTitle}
          </h1>
          {currentCategory && (
            <p className="text-xs text-luxury-muted max-w-xl mt-1.5 leading-relaxed">
              {currentCategory.description}
            </p>
          )}
        </div>

        {/* Top Controls: Mobile Filter Button & Sort Select */}
        <div className="flex items-center justify-between md:justify-end space-x-3 w-full md:w-auto">
          {/* Mobile Filter Trigger */}
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="md:hidden inline-flex items-center space-x-2 px-3 py-2 bg-white border border-luxury-border text-xs font-semibold uppercase tracking-wider text-luxury-dark"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter</span>
          </button>

          {/* Sort Selector */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-luxury-muted uppercase tracking-wider text-[11px] hidden sm:inline">
              Sort:
            </span>
            <div className="relative">
              <select
                value={filters.sortBy || 'relevance'}
                onChange={(e) =>
                  handleFilterChange({
                    ...filters,
                    sortBy: e.target.value as FilterType['sortBy'],
                  })
                }
                className="px-3 py-2 bg-white border border-luxury-border text-xs font-medium text-luxury-dark uppercase tracking-wider focus:outline-none focus:border-luxury-dark pr-8 appearance-none rounded-none cursor-pointer"
              >
                <option value="relevance">Relevance</option>
                <option value="newest">Newest First</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="discount">Biggest Discount</option>
              </select>
              <ArrowUpDown className="w-3.5 h-3.5 text-luxury-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Listing Layout: Sidebar Filters + Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden md:block md:col-span-3 sticky top-24 bg-white p-5 border border-luxury-border">
          <ProductFilters
            category={currentCategory}
            filters={filters}
            onChange={handleFilterChange}
            onReset={handleResetFilters}
          />
        </aside>

        {/* Product Grid Area */}
        <div className="col-span-1 md:col-span-9 space-y-4">
          <div className="flex items-center justify-between text-xs text-luxury-muted pb-2">
            <span>
              Showing <strong className="text-luxury-dark">{products.length}</strong> styles
            </span>
          </div>

          <ProductGrid
            products={products}
            onResetFilters={handleResetFilters}
          />
        </div>
      </div>

      {/* Mobile Filter Bottom Drawer */}
      <Drawer
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        title="Refine Collection"
      >
        <ProductFilters
          category={currentCategory}
          filters={filters}
          onChange={(newF) => {
            handleFilterChange(newF);
          }}
          onReset={() => {
            handleResetFilters();
            setIsMobileFilterOpen(false);
          }}
          isMobileDrawer
        />
      </Drawer>
    </div>
  );
};
