import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Heart, ShoppingBag, User, X, ChevronRight } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useCartStore } from '../../store/useCartStore';
import { useWishlistStore } from '../../store/useWishlistStore';
import { useAuthStore } from '../../store/useAuthStore';
import { SEED_CATEGORIES } from '../../data/seedCategories';

export const MobileNav: React.FC = () => {
  const location = useLocation();
  const {
    isMobileMenuOpen,
    closeMobileMenu,
    openSearch,
    openCartDrawer,
  } = useUIStore();

  const cartCount = useCartStore((state) => state.itemCount);
  const wishlistCount = useWishlistStore((state) => state.items.length);
  const { isAuthenticated } = useAuthStore();

  return (
    <>
      {/* 1. Mobile Category Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden md:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={closeMobileMenu}
          />
          <div className="fixed inset-y-0 left-0 max-w-[300px] w-full bg-luxury-bg shadow-drawer flex flex-col z-10 animate-slide-down">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-luxury-border bg-white">
              <span className="font-brand font-bold text-lg tracking-widest text-luxury-dark">
                NITRO HUB
              </span>
              <button
                onClick={closeMobileMenu}
                className="p-1 text-luxury-muted hover:text-luxury-dark"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category Links */}
            <div className="flex-1 overflow-y-auto py-4 px-6 space-y-6">
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-widest text-luxury-muted mb-3">
                  Shop By Category
                </h4>
                <div className="space-y-3">
                  {SEED_CATEGORIES.map((category) => (
                    <div key={category.id} className="border-b border-luxury-border/60 pb-2">
                      <Link
                        to={`/${category.slug}`}
                        onClick={closeMobileMenu}
                        className="flex items-center justify-between text-sm font-medium text-luxury-dark uppercase tracking-wider py-1"
                      >
                        <span>{category.name}</span>
                        <ChevronRight className="w-4 h-4 text-luxury-faint" />
                      </Link>
                      <div className="pl-3 mt-1 space-y-1.5">
                        {category.subcategories?.map((sub) => (
                          <Link
                            key={sub.id}
                            to={`/${category.slug}?sub=${sub.slug}`}
                            onClick={closeMobileMenu}
                            className="block text-xs text-luxury-muted hover:text-luxury-accent py-0.5"
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-widest text-luxury-muted mb-3">
                  Featured Edits
                </h4>
                <ul className="space-y-2 text-xs">
                  <li>
                    <Link
                      to="/new-arrivals"
                      onClick={closeMobileMenu}
                      className="block text-luxury-dark font-medium py-1"
                    >
                      New Arrivals
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/sale"
                      onClick={closeMobileMenu}
                      className="block text-luxury-accent font-semibold py-1"
                    >
                      Seasonal Sale (Up to 50% Off)
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/about"
                      onClick={closeMobileMenu}
                      className="block text-luxury-muted py-1"
                    >
                      About Nitro Hub
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/contact"
                      onClick={closeMobileMenu}
                      className="block text-luxury-muted py-1"
                    >
                      Customer Support
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Drawer Footer / Account */}
            <div className="p-4 border-t border-luxury-border bg-white">
              <Link
                to={isAuthenticated ? '/account' : '/login'}
                onClick={closeMobileMenu}
                className="flex items-center justify-center space-x-2 w-full py-2.5 bg-luxury-dark text-luxury-bg text-xs font-medium tracking-wider uppercase"
              >
                <User className="w-4 h-4" />
                <span>{isAuthenticated ? 'My Account' : 'Sign In / Register'}</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 2. Fixed Bottom Tab Bar (Mobile commerce optimized) */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-luxury-border md:hidden px-2 py-1.5 flex items-center justify-around shadow-soft safe-bottom">
        <Link
          to="/"
          className={`flex flex-col items-center justify-center py-1 px-3 text-[10px] uppercase tracking-wider ${
            location.pathname === '/' ? 'text-luxury-dark font-semibold' : 'text-luxury-muted'
          }`}
        >
          <Home className="w-4 h-4 mb-0.5" />
          <span>Home</span>
        </Link>

        <button
          onClick={openSearch}
          className="flex flex-col items-center justify-center py-1 px-3 text-[10px] uppercase tracking-wider text-luxury-muted hover:text-luxury-dark"
        >
          <Search className="w-4 h-4 mb-0.5" />
          <span>Search</span>
        </button>

        <Link
          to="/account/wishlist"
          className={`relative flex flex-col items-center justify-center py-1 px-3 text-[10px] uppercase tracking-wider ${
            location.pathname === '/account/wishlist' ? 'text-luxury-dark font-semibold' : 'text-luxury-muted'
          }`}
        >
          <Heart className="w-4 h-4 mb-0.5" />
          <span>Wishlist</span>
          {wishlistCount > 0 && (
            <span className="absolute top-0 right-2 w-3.5 h-3.5 bg-luxury-accent text-white text-[8px] font-bold rounded-full flex items-center justify-center">
              {wishlistCount}
            </span>
          )}
        </Link>

        <button
          onClick={openCartDrawer}
          className="relative flex flex-col items-center justify-center py-1 px-3 text-[10px] uppercase tracking-wider text-luxury-muted hover:text-luxury-dark"
        >
          <ShoppingBag className="w-4 h-4 mb-0.5" />
          <span>Bag</span>
          {cartCount > 0 && (
            <span className="absolute top-0 right-2 w-3.5 h-3.5 bg-luxury-dark text-white text-[8px] font-bold rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>

        <Link
          to={isAuthenticated ? '/account' : '/login'}
          className={`flex flex-col items-center justify-center py-1 px-3 text-[10px] uppercase tracking-wider ${
            location.pathname.startsWith('/account') || location.pathname === '/login'
              ? 'text-luxury-dark font-semibold'
              : 'text-luxury-muted'
          }`}
        >
          <User className="w-4 h-4 mb-0.5" />
          <span>{isAuthenticated ? 'Account' : 'Login'}</span>
        </Link>
      </nav>
    </>
  );
};
