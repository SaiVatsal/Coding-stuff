import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingBag,
  Users,
  Tag,
  RotateCcw,
  Star,
  TrendingUp,
  Settings,
  ShieldAlert,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Store,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export const AdminLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Products & Sourcing', path: '/admin/products', icon: Package },
    { label: 'Inventory Ledger', path: '/admin/inventory', icon: Boxes },
    { label: 'Orders & Shipments', path: '/admin/orders', icon: ShoppingBag },
    { label: 'Customers', path: '/admin/customers', icon: Users },
    { label: 'Coupons & Promos', path: '/admin/coupons', icon: Tag },
    { label: 'Returns & Refunds', path: '/admin/returns', icon: RotateCcw },
    { label: 'Reviews Moderation', path: '/admin/reviews', icon: Star },
    { label: 'Profit Analytics', path: '/admin/analytics', icon: TrendingUp },
    { label: 'Store Settings', path: '/admin/settings', icon: Settings },
    { label: 'Audit Trail', path: '/admin/audit-logs', icon: ShieldAlert },
  ];

  return (
    <div className="min-h-screen bg-[#F4F2EC] flex flex-col md:flex-row text-luxury-text font-sans antialiased">
      {/* Mobile Sidebar Trigger Header */}
      <div className="md:hidden bg-luxury-dark text-white p-4 flex items-center justify-between z-30">
        <div className="flex items-center space-x-2">
          <Store className="w-5 h-5 text-luxury-gold" />
          <span className="font-brand font-bold text-sm tracking-widest">NITRO ADMIN</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-1 text-white hover:text-luxury-gold"
          aria-label="Toggle admin sidebar"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-luxury-dark text-luxury-bg-subtle flex flex-col justify-between border-r border-luxury-charcoal transition-transform duration-200 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-luxury-charcoal flex items-center justify-between">
            <Link to="/admin/dashboard" className="block">
              <span className="font-brand font-bold text-lg tracking-[0.15em] text-white">
                NITRO HUB
              </span>
              <span className="block text-[9px] tracking-[0.2em] uppercase text-luxury-gold font-medium">
                Operations & Analytics
              </span>
            </Link>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1 text-xs">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.path ||
                (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path));

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-none font-medium tracking-wider uppercase transition-colors ${
                    isActive
                      ? 'bg-luxury-charcoal text-white border-l-2 border-luxury-gold font-semibold'
                      : 'text-luxury-faint hover:text-white hover:bg-luxury-charcoal/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-luxury-gold' : 'text-luxury-faint'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer & User Action */}
        <div className="p-4 border-t border-luxury-charcoal space-y-3">
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2 text-xs text-luxury-faint hover:text-white hover:bg-luxury-charcoal/50 transition-colors uppercase tracking-wider font-medium"
          >
            <span className="flex items-center space-x-2">
              <Store className="w-3.5 h-3.5" />
              <span>Live Storefront</span>
            </span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <div className="pt-2 border-t border-luxury-charcoal flex items-center justify-between text-xs">
            <div className="truncate pr-2">
              <div className="font-semibold text-white truncate">{user?.full_name || 'Admin'}</div>
              <div className="text-[10px] text-luxury-gold uppercase tracking-wider">
                {user?.role || 'super_admin'}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-luxury-faint hover:text-luxury-red transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Admin Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Admin Topbar */}
        <header className="hidden md:flex items-center justify-between bg-white border-b border-luxury-border px-8 py-3.5">
          <div className="flex items-center space-x-2 text-xs uppercase tracking-wider text-luxury-muted">
            <span>Admin Control Hub</span>
            <span>/</span>
            <span className="text-luxury-dark font-semibold">
              {navLinks.find((l) => location.pathname.startsWith(l.path))?.label || 'Overview'}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className="inline-flex items-center space-x-1.5 text-xs text-luxury-text hover:text-luxury-accent font-medium uppercase tracking-wider"
            >
              <span>View Customer Store</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
