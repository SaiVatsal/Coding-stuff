import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ShoppingBag, MapPin, Heart, Settings, LogOut, User } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { SEO } from '../../components/common/SEO';

export const AccountLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'My Orders', path: '/account/orders', icon: ShoppingBag },
    { label: 'Saved Addresses', path: '/account/addresses', icon: MapPin },
    { label: 'Wishlist', path: '/account/wishlist', icon: Heart },
    { label: 'Profile Settings', path: '/account/settings', icon: Settings },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <SEO title="My Account — Nitro Hub" />

      <Breadcrumbs items={[{ label: 'My Account' }]} />

      {/* Account Header */}
      <div className="pb-6 border-b border-luxury-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-luxury-dark text-white rounded-full flex items-center justify-center font-serif text-lg font-bold">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl text-luxury-dark font-medium">
              Welcome back, {user?.full_name || 'Customer'}
            </h1>
            <p className="text-xs text-luxury-muted">{user?.email || 'customer@nitrohub.in'}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="inline-flex items-center space-x-1.5 text-xs text-luxury-muted hover:text-luxury-red transition-colors uppercase tracking-wider font-semibold self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Main Grid: Nav Sidebar Left + Dynamic View Right */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Sidebar Navigation */}
        <aside className="md:col-span-3 bg-white border border-luxury-border p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                    isActive
                      ? 'bg-luxury-dark text-white'
                      : 'text-luxury-muted hover:text-luxury-dark hover:bg-luxury-bg-subtle'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </aside>

        {/* View Content */}
        <div className="md:col-span-9">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
