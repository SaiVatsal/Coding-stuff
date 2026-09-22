import React from 'react';
import { Outlet } from 'react-router-dom';
import { AnnouncementBar } from './AnnouncementBar';
import { Header } from './Header';
import { Footer } from './Footer';
import { MobileNav } from './MobileNav';
import { CartDrawer } from '../cart/CartDrawer';
import { SearchModal } from '../common/SearchModal';

export const CustomerLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-luxury-bg text-luxury-text">
      {/* Top Announcement */}
      <AnnouncementBar />

      {/* Main Luxury Header */}
      <Header />

      {/* Page Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Luxury Footer */}
      <Footer />

      {/* Mobile Drawer & Bottom Tab Bar */}
      <MobileNav />

      {/* Global Slide-in Cart Drawer */}
      <CartDrawer />

      {/* Global Search Modal */}
      <SearchModal />
    </div>
  );
};
