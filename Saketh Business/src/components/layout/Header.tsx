import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Heart, ShoppingBag, User, Menu, Shield } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useCartStore } from '../../store/useCartStore';
import { useWishlistStore } from '../../store/useWishlistStore';
import { useAuthStore } from '../../store/useAuthStore';
import { SEED_CATEGORIES } from '../../data/seedCategories';
import { MegaMenu } from './MegaMenu';
import { Category } from '../../types';

export const Header: React.FC = () => {
  const [activeMegaCategory, setActiveMegaCategory] = useState<Category | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  const { openCartDrawer, openMobileMenu, openSearch } = useUIStore();
  const cartItemCount = useCartStore((state) => state.itemCount);
  const wishlistCount = useWishlistStore((state) => state.items.length);
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mega menu on route change
  useEffect(() => {
    setActiveMegaCategory(null);
  }, [location.pathname]);

  const womenCategory = SEED_CATEGORIES.find((c) => c.slug === 'women');
  const menCategory = SEED_CATEGORIES.find((c) => c.slug === 'men');
  const collectionsCategory = SEED_CATEGORIES.find((c) => c.slug === 'collections');

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-200 ${
        isScrolled
          ? 'bg-luxury-bg/95 backdrop-blur-md shadow-soft border-b border-luxury-border py-3.5'
          : 'bg-luxury-bg border-b border-luxury-border/60 py-4 md:py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left: Mobile Menu Trigger & Desktop Nav */}
        <div className="flex items-center space-x-6">
          <button
            onClick={openMobileMenu}
            className="md:hidden p-1.5 text-luxury-text hover:text-luxury-dark transition-colors"
            aria-label="Open mobile menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <nav className="hidden md:flex items-center space-x-8 text-xs font-medium tracking-widest uppercase text-luxury-text">
            <div
              className="relative py-2 cursor-pointer"
              onMouseEnter={() => womenCategory && setActiveMegaCategory(womenCategory)}
            >
              <Link
                to="/women"
                className={`hover:text-luxury-accent transition-colors ${
                  location.pathname === '/women' ? 'text-luxury-accent font-semibold' : ''
                }`}
              >
                Women
              </Link>
            </div>

            <div
              className="relative py-2 cursor-pointer"
              onMouseEnter={() => menCategory && setActiveMegaCategory(menCategory)}
            >
              <Link
                to="/men"
                className={`hover:text-luxury-accent transition-colors ${
                  location.pathname === '/men' ? 'text-luxury-accent font-semibold' : ''
                }`}
              >
                Men
              </Link>
            </div>

            <div
              className="relative py-2 cursor-pointer"
              onMouseEnter={() => collectionsCategory && setActiveMegaCategory(collectionsCategory)}
            >
              <Link
                to="/new-arrivals"
                className="hover:text-luxury-accent transition-colors"
              >
                New Arrivals
              </Link>
            </div>

            <Link
              to="/sale"
              className="hover:text-luxury-accent text-luxury-accent font-semibold transition-colors"
            >
              Sale
            </Link>
          </nav>
        </div>

        {/* Center: Brand Logo */}
        <div className="text-center">
          <Link to="/" className="inline-block group">
            <span className="font-brand font-bold text-xl sm:text-2xl tracking-[0.2em] text-luxury-dark group-hover:text-luxury-charcoal transition-colors">
              NITRO HUB
            </span>
            <span className="block text-[8px] tracking-[0.3em] uppercase text-luxury-muted font-sans font-medium -mt-0.5">
              Accessible Luxury
            </span>
          </Link>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-3 sm:space-x-5 text-luxury-text">
          {/* Admin shortcut badge if admin */}
          {user?.role && (user.role === 'admin' || user.role === 'super_admin') && (
            <Link
              to="/admin"
              className="hidden lg:inline-flex items-center space-x-1 px-2.5 py-1 bg-luxury-dark text-luxury-bg text-[10px] tracking-wider uppercase font-semibold border border-luxury-dark hover:bg-luxury-charcoal transition-colors"
            >
              <Shield className="w-3 h-3 text-luxury-gold" />
              <span>Admin Portal</span>
            </Link>
          )}

          {/* Search Icon */}
          <button
            onClick={openSearch}
            className="p-1.5 hover:text-luxury-accent transition-colors"
            aria-label="Search products"
          >
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* User Account */}
          <Link
            to={isAuthenticated ? '/account' : '/login'}
            className="hidden sm:block p-1.5 hover:text-luxury-accent transition-colors"
            aria-label="My Account"
          >
            <User className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>

          {/* Wishlist */}
          <Link
            to="/account/wishlist"
            className="relative p-1.5 hover:text-luxury-accent transition-colors"
            aria-label="My Wishlist"
          >
            <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-luxury-accent text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Cart Bag */}
          <button
            onClick={openCartDrawer}
            className="relative p-1.5 hover:text-luxury-accent transition-colors"
            aria-label="Shopping Bag"
          >
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-luxury-dark text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mega Menu Container */}
      {activeMegaCategory && (
        <MegaMenu
          category={activeMegaCategory}
          onClose={() => setActiveMegaCategory(null)}
        />
      )}
    </header>
  );
};
