// ============================================================
// NITRO HUB: TypeScript Domain Models & Definitions
// ============================================================

export type UserRole = 'customer' | 'staff' | 'admin' | 'super_admin';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned'
  | 'refunded';

export type PaymentStatus =
  | 'pending'
  | 'authorized'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'partially_refunded';

export type DiscountType = 'percentage' | 'fixed';

export type InventoryTxType =
  | 'opening_stock'
  | 'restock'
  | 'order_reservation'
  | 'order_commit'
  | 'order_release'
  | 'return_restock'
  | 'adjustment';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
}

export interface Address {
  id: string;
  user_id?: string;
  recipient_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  is_default?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  gender: 'women' | 'men' | 'unisex' | 'kids';
  display_order: number;
  is_active: boolean;
  subcategories?: Subcategory[];
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
}

export interface Size {
  id: string;
  name: string;
  code: string;
  display_order: number;
}

export interface Color {
  id: string;
  name: string;
  hex_code: string;
}

export interface ProductImage {
  id: string;
  product_id?: string;
  image_url: string;
  alt_text?: string;
  display_order: number;
  is_primary: boolean;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size_id: string;
  size: Size;
  color_id: string;
  color: Color;
  sku: string;
  price_override?: number;
  stock: number;
  reserved_stock: number;
  available_stock: number;
  is_active: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  category_id: string;
  category?: Category;
  subcategory_id?: string;
  subcategory?: Subcategory;
  gender: 'women' | 'men' | 'unisex' | 'kids';
  brand: string;
  short_description?: string;
  description: string;
  mrp: number;
  selling_price: number;
  discount_percent: number; // derived: ((mrp - selling_price) / mrp) * 100
  purchase_cost?: number; // ADMIN ONLY
  material?: string;
  fabric_composition?: string;
  care_instructions?: string;
  weight_grams: number;
  hsn_code: string;
  is_returnable: boolean;
  return_window_days: number;
  rating_avg: number;
  review_count: number;
  is_active: boolean;
  is_featured: boolean;
  is_new_arrival: boolean;
  is_bestseller: boolean;
  images: ProductImage[];
  variants: ProductVariant[];
  created_at: string;
  updated_at?: string;
}

export interface SizeChartMeasurement {
  size: string;
  chest_in: number;
  chest_cm: number;
  waist_in: number;
  waist_cm: number;
  hip_in: number;
  hip_cm: number;
  length_in: number;
  length_cm: number;
}

export interface SizeChart {
  id: string;
  name: string;
  category_id?: string;
  measurements: SizeChartMeasurement[];
}

export interface CartItem {
  id: string;
  product_id: string;
  variant_id: string;
  product: Product;
  variant: ProductVariant;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  item_count: number;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order_value: number;
  max_discount_cap?: number;
  start_date: string;
  expiry_date: string;
  usage_limit?: number;
  per_user_limit: number;
  applicable_categories?: string[];
  applicable_products?: string[];
  is_active: boolean;
}

export interface CouponValidationResult {
  is_valid: boolean;
  discount_amount: number;
  message: string;
  coupon?: Coupon;
}

export interface GSTBreakdown {
  taxable_amount: number;
  cgst_rate: number;
  cgst_amount: number;
  sgst_rate: number;
  sgst_amount: number;
  igst_rate: number;
  igst_amount: number;
  total_tax: number;
  is_interstate: boolean;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string;
  product_name: string;
  variant_name: string;
  sku: string;
  unit_price: number;
  purchase_cost?: number; // Admin only
  quantity: number;
  total_price: number;
  hsn_code: string;
  product?: Product;
}

export interface Payment {
  id: string;
  order_id: string;
  razorpay_order_id: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method?: string;
  gateway_fee?: number;
  created_at: string;
}

export interface Shipment {
  id: string;
  order_id: string;
  courier_name: string;
  tracking_number: string;
  tracking_url?: string;
  estimated_delivery?: string;
  shipped_at?: string;
  delivered_at?: string;
  notes?: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id?: string;
  guest_email?: string;
  guest_phone?: string;
  status: OrderStatus;
  subtotal: number;
  discount_amount: number;
  coupon_code?: string;
  shipping_fee: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  shipping_address: Address;
  billing_address: Address;
  items: OrderItem[];
  payment?: Payment;
  shipment?: Shipment;
  gst_breakdown?: GSTBreakdown;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  title?: string;
  comment: string;
  image_urls?: string[];
  is_verified_purchase: boolean;
  is_approved: boolean;
  created_at: string;
}

export interface ReturnRequest {
  id: string;
  order_id: string;
  order_number: string;
  order_item_id: string;
  product_name: string;
  user_id: string;
  user_email: string;
  reason: string;
  description?: string;
  photo_urls?: string[];
  status: 'requested' | 'approved' | 'rejected' | 'item_received' | 'refunded' | 'cancelled';
  admin_notes?: string;
  refund_amount: number;
  created_at: string;
}

export interface InventoryTransaction {
  id: string;
  variant_id: string;
  product_name: string;
  sku: string;
  transaction_type: InventoryTxType;
  quantity_change: number;
  reference_id?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
}

export interface AdminKPI {
  today_sales: number;
  monthly_sales: number;
  total_orders: number;
  pending_orders: number;
  total_customers: number;
  total_products: number;
  low_stock_count: number;
  open_returns_count: number;
  estimated_gross_profit: number;
  gross_margin_percent: number;
}

export interface AuditLogItem {
  id: string;
  user_id?: string;
  user_email?: string;
  user_role?: UserRole;
  action: string;
  entity_type: string;
  entity_id?: string;
  previous_values?: Record<string, any>;
  new_values?: Record<string, any>;
  previous_state?: Record<string, any>;
  new_state?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export type AuditLog = AuditLogItem;

export interface StoreSettings {
  store_name: string;
  legal_name: string;
  gstin: string;
  hsn_default: string;
  state: string;
  support_email: string;
  support_phone: string;
  address: string;
  free_shipping_threshold: number;
  default_shipping_fee: number;
  cod_fee: number;
  is_cod_enabled: boolean;
  return_window_days: number;
  low_stock_threshold: number;
  currency_symbol: string;
  instagram_handle?: string;
  brand_tagline: string;
}

export interface ProductFilters {
  gender?: 'women' | 'men' | 'unisex' | 'kids';
  category?: string;
  subcategory?: string;
  sizes?: string[];
  colors?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  minDiscount?: number;
  rating?: number;
  sortBy?: 'relevance' | 'newest' | 'price_low' | 'price_high' | 'rating' | 'discount';
  searchQuery?: string;
}
