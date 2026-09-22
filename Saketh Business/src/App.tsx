import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { CustomerLayout } from './components/layout/CustomerLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { AccountLayout } from './pages/Account/AccountLayout';

// Customer Pages
import { Home } from './pages/Home';
import { CategoryListing } from './pages/CategoryListing';
import { ProductDetail } from './pages/ProductDetail';
import { SearchResults } from './pages/SearchResults';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';

// Customer Account Pages
import { OrdersList } from './pages/Account/OrdersList';
import { CustomerOrderDetail } from './pages/Account/CustomerOrderDetail';
import { AddressesPage } from './pages/Account/AddressesPage';
import { WishlistPage } from './pages/Account/WishlistPage';
import { SettingsPage } from './pages/Account/SettingsPage';

// Auth Pages
import { LoginPage } from './pages/Auth/LoginPage';
import { SignupPage } from './pages/Auth/SignupPage';
import { ForgotPasswordPage } from './pages/Auth/ForgotPasswordPage';

// Static Policy Pages
import { AboutPage } from './pages/Static/AboutPage';
import { ContactPage } from './pages/Static/ContactPage';
import { FaqPage } from './pages/Static/FaqPage';
import { ShippingPolicy } from './pages/Static/ShippingPolicy';
import { ReturnsPolicy } from './pages/Static/ReturnsPolicy';
import { PrivacyPolicy } from './pages/Static/PrivacyPolicy';
import { TermsPage } from './pages/Static/TermsPage';
import { CancellationPolicy } from './pages/Static/CancellationPolicy';

// Admin Operations Pages
import { Dashboard } from './pages/Admin/Dashboard';
import { ProductsList } from './pages/Admin/ProductsList';
import { ProductEditor } from './pages/Admin/ProductEditor';
import { InventoryPage } from './pages/Admin/InventoryPage';
import { AdminOrdersList } from './pages/Admin/AdminOrdersList';
import { CustomersList } from './pages/Admin/CustomersList';
import { CouponsList } from './pages/Admin/CouponsList';
import { ReturnsQueue } from './pages/Admin/ReturnsQueue';
import { ReviewsModeration } from './pages/Admin/ReviewsModeration';
import { ProfitAnalytics } from './pages/Admin/ProfitAnalytics';
import { StoreSettingsPage } from './pages/Admin/StoreSettingsPage';
import { AuditLogsPage } from './pages/Admin/AuditLogsPage';

// 404 Fallback
import { EmptyState } from './components/common/EmptyState';
import { Button } from './components/common/Button';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 py-24 text-center">
    <EmptyState
      title="404 — Page Not Found"
      description="The silhouette or editorial curation you are looking for does not exist or has been archived."
      actionText="Return to Catalog"
      actionHref="/women"
    />
  </div>
);

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Customer Storefront Suite */}
        <Route path="/" element={<CustomerLayout />}>
          <Route index element={<Home />} />
          <Route path="women" element={<CategoryListing />} />
          <Route path="men" element={<CategoryListing />} />
          <Route path="collections" element={<CategoryListing />} />
          <Route path="category/:slug" element={<CategoryListing />} />
          <Route path="product/:slug" element={<ProductDetail />} />
          <Route path="search" element={<SearchResults />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="order-confirmation/:orderId" element={<OrderConfirmationPage />} />

          {/* Auth */}
          <Route path="login" element={<LoginPage />} />
          <Route path="signup" element={<SignupPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />

          {/* Static Policies */}
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="faq" element={<FaqPage />} />
          <Route path="shipping-policy" element={<ShippingPolicy />} />
          <Route path="returns-policy" element={<ReturnsPolicy />} />
          <Route path="privacy-policy" element={<PrivacyPolicy />} />
          <Route path="terms" element={<TermsPage />} />
          <Route path="cancellation-policy" element={<CancellationPolicy />} />

          {/* Customer Account */}
          <Route path="account" element={<AccountLayout />}>
            <Route index element={<Navigate to="orders" replace />} />
            <Route path="orders" element={<OrdersList />} />
            <Route path="orders/:orderId" element={<CustomerOrderDetail />} />
            <Route path="addresses" element={<AddressesPage />} />
            <Route path="wishlist" element={<WishlistPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Admin Operational Suite */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<ProductsList />} />
          <Route path="products/new" element={<ProductEditor />} />
          <Route path="products/:id/edit" element={<ProductEditor />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="orders" element={<AdminOrdersList />} />
          <Route path="customers" element={<CustomersList />} />
          <Route path="coupons" element={<CouponsList />} />
          <Route path="returns" element={<ReturnsQueue />} />
          <Route path="reviews" element={<ReviewsModeration />} />
          <Route path="analytics" element={<ProfitAnalytics />} />
          <Route path="settings" element={<StoreSettingsPage />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
