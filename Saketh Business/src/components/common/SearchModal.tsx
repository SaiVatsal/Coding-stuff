import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, X, ArrowRight, TrendingUp } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { nitroDataService } from '../../lib/supabase/service';
import { Product } from '../../types';

export const SearchModal: React.FC = () => {
  const { isSearchOpen, closeSearch } = useUIStore();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (isSearchOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      setQuery('');
    }
  }, [isSearchOpen]);

  // Debounced/instant query filtering
  const matchingProducts = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    return nitroDataService.getProducts({ search: query }).slice(0, 6);
  }, [query]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      closeSearch();
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleQuickTagClick = (tag: string) => {
    setQuery(tag);
  };

  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={closeSearch}
      />

      {/* Modal Container */}
      <div className="relative min-h-screen flex items-start justify-center pt-16 sm:pt-24 px-4 pb-12">
        <div className="relative w-full max-w-3xl bg-white shadow-lift border border-luxury-border animate-slide-down overflow-hidden">
          {/* Search Input Bar */}
          <div className="p-6 border-b border-luxury-border flex items-center justify-between">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center mr-4">
              <Search className="w-5 h-5 text-luxury-muted mr-3" />
              <input
                type="text"
                autoFocus
                placeholder="Search products, fabrics, styles, or collections..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full text-base font-sans text-luxury-dark placeholder-luxury-faint focus:outline-none bg-transparent"
              />
            </form>
            <button
              onClick={closeSearch}
              className="p-1 text-luxury-muted hover:text-luxury-dark"
              aria-label="Close search"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 max-h-[65vh] overflow-y-auto">
            {/* Quick Trending Tags */}
            {query.length < 2 && (
              <div>
                <div className="flex items-center space-x-2 text-[11px] font-semibold tracking-widest uppercase text-luxury-muted mb-3">
                  <TrendingUp className="w-3.5 h-3.5 text-luxury-accent" />
                  <span>Trending Searches</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Linen Shirt', 'Midi Dress', 'Mulmul Kurti', 'Co-ord Set', 'Oversized Tee', 'Pleated Trousers'].map(
                    (tag) => (
                      <button
                        key={tag}
                        onClick={() => handleQuickTagClick(tag)}
                        className="px-3 py-1.5 bg-luxury-bg-subtle text-xs text-luxury-text hover:bg-luxury-bg-hover hover:text-luxury-dark border border-luxury-border transition-colors uppercase tracking-wider font-medium"
                      >
                        {tag}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Instant Search Results */}
            {query.length >= 2 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-luxury-muted">
                    Showing top results for <strong className="text-luxury-dark">"{query}"</strong>
                  </span>
                  {matchingProducts.length > 0 && (
                    <button
                      onClick={handleSearchSubmit}
                      className="text-xs font-semibold text-luxury-accent hover:underline inline-flex items-center"
                    >
                      <span>View all results</span>
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </button>
                  )}
                </div>

                {matchingProducts.length === 0 ? (
                  <div className="py-8 text-center text-luxury-muted">
                    <p className="text-sm">No products found matching "{query}".</p>
                    <p className="text-xs mt-1 text-luxury-faint">Try searching for "shirt", "linen", "dress", or "kurti".</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {matchingProducts.map((product) => (
                      <Link
                        key={product.id}
                        to={`/product/${product.slug}`}
                        onClick={closeSearch}
                        className="flex items-center space-x-3 p-2.5 hover:bg-luxury-bg-subtle border border-luxury-border/60 transition-colors group"
                      >
                        <div className="w-14 h-18 bg-luxury-bg-subtle flex-shrink-0 overflow-hidden">
                          <img
                            src={product.images[0]?.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] text-luxury-accent uppercase tracking-wider font-semibold">
                            {product.brand}
                          </span>
                          <h4 className="text-xs font-medium text-luxury-dark truncate group-hover:text-luxury-accent transition-colors">
                            {product.name}
                          </h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs font-semibold text-luxury-dark">
                              ₹{product.selling_price.toLocaleString('en-IN')}
                            </span>
                            {product.mrp > product.selling_price && (
                              <span className="text-[11px] text-luxury-muted line-through">
                                ₹{product.mrp.toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
