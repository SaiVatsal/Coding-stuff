// ============================================================
// NITRO HUB: Central Data Access & Zero-Trust Business Engine
// ============================================================

import {
  Product,
  ProductVariant,
  Category,
  Order,
  OrderStatus,
  OrderItem,
  Payment,
  PaymentStatus,
  Review,
  ReturnRequest,
  Coupon,
  CouponValidationResult,
  InventoryTransaction,
  AdminKPI,
  AuditLogItem,
  StoreSettings,
  Address,
  UserProfile,
  UserRole,
} from '../../types';

import { SEED_PRODUCTS } from '../../data/seedProducts';
import { SEED_CATEGORIES } from '../../data/seedCategories';
import { SEED_COUPONS } from '../../data/seedCoupons';
import { calculateOrderGST, SELLER_STATE, SELLER_GSTIN } from '../gst/calculator';

// Local persistent store keys
const STORAGE_KEYS = {
  PRODUCTS: 'nitro_hub_products_v1',
  ORDERS: 'nitro_hub_orders_v1',
  REVIEWS: 'nitro_hub_reviews_v1',
  COUPONS: 'nitro_hub_coupons_v1',
  RETURNS: 'nitro_hub_returns_v1',
  AUDIT_LOGS: 'nitro_hub_audit_logs_v1',
  STORE_SETTINGS: 'nitro_hub_settings_v1',
  INVENTORY_TXS: 'nitro_hub_inv_txs_v1',
  USERS: 'nitro_hub_users_v1',
  CURRENT_USER: 'nitro_hub_current_user_v1',
};

// Default store settings
export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  store_name: 'Nitro Hub',
  legal_name: 'Nitro Hub Apparel Pvt. Ltd.',
  gstin: SELLER_GSTIN,
  hsn_default: '61091000',
  state: SELLER_STATE,
  support_email: 'support@nitrohub.in',
  support_phone: '+91 80 4912 3456',
  address: '104, Indiranagar 100ft Road, Bengaluru, Karnataka - 560038',
  free_shipping_threshold: 999,
  default_shipping_fee: 99,
  cod_fee: 49,
  is_cod_enabled: true,
  return_window_days: 7,
  low_stock_threshold: 3,
  currency_symbol: '₹',
  instagram_handle: '@nitrohub.in',
  brand_tagline: 'Premium Fashion. Better Prices.',
};

// Seed sample orders for realistic admin & tracking demonstration
const SEED_ORDERS: Order[] = [
  {
    id: 'ord-1001',
    order_number: 'NH-2025-08491',
    user_id: 'usr-customer-1',
    guest_email: 'priya.sharma@example.com',
    guest_phone: '9876543210',
    status: 'delivered',
    subtotal: 2998,
    discount_amount: 500,
    coupon_code: 'NITRO500',
    shipping_fee: 0,
    tax_amount: 149.88,
    total_amount: 2647.88,
    currency: 'INR',
    shipping_address: {
      id: 'addr-1',
      recipient_name: 'Priya Sharma',
      phone: '9876543210',
      address_line1: 'A-402, Palm Meadows, Whitefield',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560066',
      is_default: true,
    },
    billing_address: {
      id: 'addr-1',
      recipient_name: 'Priya Sharma',
      phone: '9876543210',
      address_line1: 'A-402, Palm Meadows, Whitefield',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560066',
    },
    items: [
      {
        id: 'oi-1001-1',
        order_id: 'ord-1001',
        product_id: 'prod-w-01',
        variant_id: 'var-w01-s-terracotta',
        product_name: 'Floral Print Chiffon Midi Dress',
        variant_name: 'S / Terracotta Rust',
        sku: 'NH-W-DRS-001-S-TER',
        unit_price: 1499,
        purchase_cost: 480,
        quantity: 1,
        total_price: 1499,
        hsn_code: '62044220',
      },
      {
        id: 'oi-1001-2',
        order_id: 'ord-1001',
        product_id: 'prod-m-03',
        variant_id: 'var-m03-m-sand',
        product_name: 'Breathable Pure Linen Resort Shirt',
        variant_name: 'M / Desert Sand',
        sku: 'NH-M-SHT-003-M-SND',
        unit_price: 1499,
        purchase_cost: 490,
        quantity: 1,
        total_price: 1499,
        hsn_code: '62059090',
      },
    ],
    payment: {
      id: 'pay-1001',
      order_id: 'ord-1001',
      razorpay_order_id: 'order_Nx8Y9z1024',
      razorpay_payment_id: 'pay_Nx8Z112025',
      amount: 2647.88,
      currency: 'INR',
      status: 'paid',
      payment_method: 'UPI / Google Pay',
      created_at: '2025-02-18T14:30:00Z',
    },
    shipment: {
      id: 'shp-1001',
      order_id: 'ord-1001',
      courier_name: 'BlueDart Air',
      tracking_number: 'BD894210495IN',
      tracking_url: 'https://www.bluedart.com',
      estimated_delivery: '2025-02-21T18:00:00Z',
      shipped_at: '2025-02-19T09:00:00Z',
      delivered_at: '2025-02-21T16:45:00Z',
      notes: 'Delivered at reception',
    },
    gst_breakdown: {
      taxable_amount: 2498,
      cgst_rate: 6,
      cgst_amount: 74.94,
      sgst_rate: 6,
      sgst_amount: 74.94,
      igst_rate: 0,
      igst_amount: 0,
      total_tax: 149.88,
      is_interstate: false,
    },
    created_at: '2025-02-18T14:28:00Z',
  },
  {
    id: 'ord-1002',
    order_number: 'NH-2025-08492',
    user_id: 'usr-customer-2',
    guest_email: 'arjun.verma@example.com',
    guest_phone: '9811223344',
    status: 'shipped',
    subtotal: 1299,
    discount_amount: 129.9,
    coupon_code: 'WELCOME10',
    shipping_fee: 0,
    tax_amount: 140.29,
    total_amount: 1309.39,
    currency: 'INR',
    shipping_address: {
      id: 'addr-2',
      recipient_name: 'Arjun Verma',
      phone: '9811223344',
      address_line1: 'Flat 12B, Regency Towers, Malabar Hill',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400006',
      is_default: true,
    },
    billing_address: {
      id: 'addr-2',
      recipient_name: 'Arjun Verma',
      phone: '9811223344',
      address_line1: 'Flat 12B, Regency Towers, Malabar Hill',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400006',
    },
    items: [
      {
        id: 'oi-1002-1',
        order_id: 'ord-1002',
        product_id: 'prod-m-01',
        variant_id: 'var-m01-m-ivory',
        product_name: 'Premium Supima Cotton Oxford Shirt',
        variant_name: 'M / Ivory White',
        sku: 'NH-M-SHT-001-M-IVO',
        unit_price: 1299,
        purchase_cost: 420,
        quantity: 1,
        total_price: 1299,
        hsn_code: '62052000',
      },
    ],
    payment: {
      id: 'pay-1002',
      order_id: 'ord-1002',
      razorpay_order_id: 'order_Nx8Y9z1025',
      razorpay_payment_id: 'pay_Nx8Z112026',
      amount: 1309.39,
      currency: 'INR',
      status: 'paid',
      payment_method: 'HDFC NetBanking',
      created_at: '2025-02-23T11:20:00Z',
    },
    shipment: {
      id: 'shp-1002',
      order_id: 'ord-1002',
      courier_name: 'Delhivery Surface',
      tracking_number: 'DLV9921004812',
      tracking_url: 'https://www.delhivery.com',
      estimated_delivery: '2025-02-27T18:00:00Z',
      shipped_at: '2025-02-24T10:00:00Z',
      notes: 'Out for long-distance transit',
    },
    gst_breakdown: {
      taxable_amount: 1169.1,
      cgst_rate: 0,
      cgst_amount: 0,
      sgst_rate: 0,
      sgst_amount: 0,
      igst_rate: 12,
      igst_amount: 140.29,
      total_tax: 140.29,
      is_interstate: true,
    },
    created_at: '2025-02-23T11:15:00Z',
  },
];

// Helper to load/save in localStorage
function getStored<T>(key: string, defaultVal: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
}

function setStored<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error('Failed to persist in localStorage', e);
  }
}

// Memory database instance
class NitroDataService {
  private products: Product[];
  private orders: Order[];
  private coupons: Coupon[];
  private reviews: Review[];
  private returns: ReturnRequest[];
  private auditLogs: AuditLogItem[];
  private settings: StoreSettings;
  private inventoryTxs: InventoryTransaction[];

  constructor() {
    this.products = getStored(STORAGE_KEYS.PRODUCTS, SEED_PRODUCTS);
    this.orders = getStored(STORAGE_KEYS.ORDERS, SEED_ORDERS);
    this.coupons = getStored(STORAGE_KEYS.COUPONS, SEED_COUPONS);
    this.reviews = getStored(STORAGE_KEYS.REVIEWS, [
      {
        id: 'rev-1',
        product_id: 'prod-w-01',
        user_id: 'usr-customer-1',
        user_name: 'Priya Sharma',
        rating: 5,
        title: 'Breathtaking fabric and drape',
        comment: 'The quality of the chiffon and the soft cotton lining is unmatched. Looks straight out of a luxury boutique. Fits true to size.',
        is_verified_purchase: true,
        is_approved: true,
        created_at: '2025-02-22T10:00:00Z',
      },
      {
        id: 'rev-2',
        product_id: 'prod-m-01',
        user_id: 'usr-customer-2',
        user_name: 'Arjun Verma',
        rating: 5,
        title: 'Exceptional Oxford Cotton',
        comment: 'Substantial weight, crisp collar, and the buttons feel very premium. Better than high-street brands charging double.',
        is_verified_purchase: true,
        is_approved: true,
        created_at: '2025-02-24T15:30:00Z',
      },
    ]);
    this.returns = getStored(STORAGE_KEYS.RETURNS, []);
    this.auditLogs = getStored(STORAGE_KEYS.AUDIT_LOGS, [
      {
        id: 'aud-1',
        user_email: 'admin@nitrohub.in',
        user_role: 'super_admin',
        action: 'STORE_SETTINGS_INITIALIZED',
        entity_type: 'store_settings',
        created_at: '2025-01-01T00:00:00Z',
      },
    ]);
    this.settings = getStored(STORAGE_KEYS.STORE_SETTINGS, DEFAULT_STORE_SETTINGS);
    this.inventoryTxs = getStored(STORAGE_KEYS.INVENTORY_TXS, []);
  }

  private persistAll() {
    setStored(STORAGE_KEYS.PRODUCTS, this.products);
    setStored(STORAGE_KEYS.ORDERS, this.orders);
    setStored(STORAGE_KEYS.COUPONS, this.coupons);
    setStored(STORAGE_KEYS.REVIEWS, this.reviews);
    setStored(STORAGE_KEYS.RETURNS, this.returns);
    setStored(STORAGE_KEYS.AUDIT_LOGS, this.auditLogs);
    setStored(STORAGE_KEYS.STORE_SETTINGS, this.settings);
    setStored(STORAGE_KEYS.INVENTORY_TXS, this.inventoryTxs);
  }

  // Log admin audit trail
  public logAudit(action: string, entityType: string, entityId?: string, previousState?: any, newState?: any, userRole: UserRole = 'admin') {
    const entry: AuditLogItem = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_email: 'admin@nitrohub.in',
      user_role: userRole,
      action,
      entity_type: entityType,
      entity_id: entityId,
      previous_state: previousState,
      new_state: newState,
      created_at: new Date().toISOString(),
    };
    this.auditLogs.unshift(entry);
    setStored(STORAGE_KEYS.AUDIT_LOGS, this.auditLogs);
  }

  // --- CATALOG & PRODUCTS (Customer safe: wholesale costs stripped) ---
  public getProducts(filters?: {
    gender?: string;
    category?: string;
    subcategory?: string;
    search?: string;
    sortBy?: string;
    inStockOnly?: boolean;
    minPrice?: number;
    maxPrice?: number;
    sizes?: string[];
    colors?: string[];
  }): Product[] {
    let result = [...this.products].filter((p) => p.is_active);

    if (filters?.gender && filters.gender !== 'all') {
      result = result.filter((p) => p.gender === filters.gender || p.gender === 'unisex');
    }

    if (filters?.category) {
      const cat = filters.category;
      result = result.filter((p) => p.category_id === cat || p.slug.includes(cat));
    }

    if (filters?.subcategory) {
      result = result.filter((p) => p.subcategory_id === filters.subcategory || p.subcategory?.slug === filters.subcategory);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)
      );
    }

    if (filters?.minPrice !== undefined) {
      result = result.filter((p) => p.selling_price >= (filters.minPrice || 0));
    }

    if (filters?.maxPrice !== undefined) {
      result = result.filter((p) => p.selling_price <= (filters.maxPrice || Infinity));
    }

    if (filters?.inStockOnly) {
      result = result.filter((p) => p.variants.some((v) => v.available_stock > 0));
    }

    if (filters?.sizes && filters.sizes.length > 0) {
      result = result.filter((p) =>
        p.variants.some((v) => filters.sizes!.includes(v.size.code) && v.available_stock > 0)
      );
    }

    if (filters?.colors && filters.colors.length > 0) {
      result = result.filter((p) =>
        p.variants.some((v) => filters.colors!.includes(v.color.name) && v.available_stock > 0)
      );
    }

    // Sorting
    if (filters?.sortBy) {
      switch (filters.sortBy) {
        case 'newest':
          result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          break;
        case 'price_low':
          result.sort((a, b) => a.selling_price - b.selling_price);
          break;
        case 'price_high':
          result.sort((a, b) => b.selling_price - a.selling_price);
          break;
        case 'rating':
          result.sort((a, b) => b.rating_avg - a.rating_avg);
          break;
        case 'discount':
          result.sort((a, b) => b.discount_percent - a.discount_percent);
          break;
        default:
          break;
      }
    }

    // Strip sensitive wholesale purchase cost for customer safety
    return result.map(({ purchase_cost, ...safeProduct }) => safeProduct as Product);
  }

  public getProductBySlug(slug: string): Product | null {
    const product = this.products.find((p) => p.slug === slug && p.is_active);
    if (!product) return null;
    const { purchase_cost, ...safeProduct } = product;
    return safeProduct as Product;
  }

  public getProductById(id: string): Product | null {
    const product = this.products.find((p) => p.id === id);
    if (!product) return null;
    return product;
  }

  // --- ADMIN PRODUCT MANAGEMENT (Includes Wholesale Margin Analytics) ---
  public getAdminProducts(): Product[] {
    return [...this.products];
  }

  public saveProduct(product: Product): Product {
    const existingIndex = this.products.findIndex((p) => p.id === product.id);
    const prev = existingIndex >= 0 ? this.products[existingIndex] : null;

    // Recalculate derived discount
    const mrp = Number(product.mrp);
    const sellingPrice = Number(product.selling_price);
    const discount = mrp > 0 ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;

    const updated: Product = {
      ...product,
      mrp,
      selling_price: sellingPrice,
      discount_percent: discount,
      updated_at: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      this.products[existingIndex] = updated;
      this.logAudit('PRODUCT_UPDATED', 'products', product.id, prev, updated);
    } else {
      this.products.unshift(updated);
      this.logAudit('PRODUCT_CREATED', 'products', product.id, null, updated);
    }

    this.persistAll();
    return updated;
  }

  public toggleProductStatus(id: string): Product | null {
    const product = this.products.find((p) => p.id === id);
    if (!product) return null;
    const prev = { is_active: product.is_active };
    product.is_active = !product.is_active;
    product.updated_at = new Date().toISOString();
    this.logAudit('PRODUCT_STATUS_TOGGLED', 'products', id, prev, { is_active: product.is_active });
    this.persistAll();
    return product;
  }

  // --- ZERO-TRUST SERVER-SIDE CART & PRICING RECALCULATOR ---
  public validateAndCalculateOrder(
    items: Array<{ product_id: string; variant_id: string; quantity: number }>,
    couponCode?: string,
    buyerState: string = 'Karnataka'
  ): {
    isValid: boolean;
    error?: string;
    subtotal: number;
    discountAmount: number;
    shippingFee: number;
    taxAmount: number;
    totalAmount: number;
    orderItems: OrderItem[];
    couponResult?: CouponValidationResult;
    gstBreakdown: any;
  } {
    let subtotal = 0;
    const validatedOrderItems: OrderItem[] = [];

    for (const item of items) {
      const product = this.products.find((p) => p.id === item.product_id && p.is_active);
      if (!product) {
        return {
          isValid: false,
          error: `Product ${item.product_id} is unavailable or removed.`,
          subtotal: 0,
          discountAmount: 0,
          shippingFee: 0,
          taxAmount: 0,
          totalAmount: 0,
          orderItems: [],
          gstBreakdown: null,
        };
      }

      const variant = product.variants.find((v) => v.id === item.variant_id);
      if (!variant) {
        return {
          isValid: false,
          error: `Selected variant for ${product.name} is invalid.`,
          subtotal: 0,
          discountAmount: 0,
          shippingFee: 0,
          taxAmount: 0,
          totalAmount: 0,
          orderItems: [],
          gstBreakdown: null,
        };
      }

      if (variant.available_stock < item.quantity) {
        return {
          isValid: false,
          error: `Insufficient stock for ${product.name} (${variant.size.code}). Only ${variant.available_stock} remaining.`,
          subtotal: 0,
          discountAmount: 0,
          shippingFee: 0,
          taxAmount: 0,
          totalAmount: 0,
          orderItems: [],
          gstBreakdown: null,
        };
      }

      const unitPrice = variant.price_override || product.selling_price;
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      validatedOrderItems.push({
        id: `oi-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        order_id: '',
        product_id: product.id,
        variant_id: variant.id,
        product_name: product.name,
        variant_name: `${variant.size.code} / ${variant.color.name}`,
        sku: variant.sku,
        unit_price: unitPrice,
        purchase_cost: product.purchase_cost || 0,
        quantity: item.quantity,
        total_price: lineTotal,
        hsn_code: product.hsn_code,
        product: product,
      });
    }

    // Coupon validation
    let discountAmount = 0;
    let couponResult: CouponValidationResult | undefined;
    if (couponCode) {
      couponResult = this.validateCoupon(couponCode, subtotal);
      if (couponResult.is_valid) {
        discountAmount = couponResult.discount_amount;
      }
    }

    // Shipping calculation
    const shippingFee =
      subtotal >= this.settings.free_shipping_threshold ? 0 : this.settings.default_shipping_fee;

    // GST Calculation
    const gstBreakdown = calculateOrderGST(
      validatedOrderItems.map((i) => ({ unit_price: i.unit_price, quantity: i.quantity })),
      buyerState,
      discountAmount
    );

    const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee);

    return {
      isValid: true,
      subtotal,
      discountAmount,
      shippingFee,
      taxAmount: gstBreakdown.total_tax,
      totalAmount,
      orderItems: validatedOrderItems,
      couponResult,
      gstBreakdown,
    };
  }

  // --- COUPON VALIDATION ENGINE ---
  public validateCoupon(code: string, subtotal: number): CouponValidationResult {
    const cleanCode = code.trim().toUpperCase();
    const coupon = this.coupons.find((c) => c.code.toUpperCase() === cleanCode);

    if (!coupon || !coupon.is_active) {
      return { is_valid: false, discount_amount: 0, message: 'Invalid or expired coupon code.' };
    }

    const now = new Date();
    if (new Date(coupon.expiry_date) < now) {
      return { is_valid: false, discount_amount: 0, message: 'This coupon has expired.' };
    }

    if (subtotal < coupon.min_order_value) {
      return {
        is_valid: false,
        discount_amount: 0,
        message: `Minimum order value of ₹${coupon.min_order_value} required for code ${coupon.code}.`,
      };
    }

    let calculatedDiscount = 0;
    if (coupon.discount_type === 'percentage') {
      calculatedDiscount = (subtotal * coupon.discount_value) / 100;
      if (coupon.max_discount_cap && calculatedDiscount > coupon.max_discount_cap) {
        calculatedDiscount = coupon.max_discount_cap;
      }
    } else {
      calculatedDiscount = coupon.discount_value;
    }

    calculatedDiscount = Math.min(calculatedDiscount, subtotal);

    return {
      is_valid: true,
      discount_amount: Math.round(calculatedDiscount * 100) / 100,
      message: `Coupon ${coupon.code} applied! Saved ₹${calculatedDiscount.toFixed(2)}`,
      coupon,
    };
  }

  // --- ORDERS & ATOMIC INVENTORY RESERVATION ---
  public createOrder(params: {
    userId?: string;
    guestEmail?: string;
    guestPhone?: string;
    shippingAddress: Address;
    billingAddress: Address;
    items: Array<{ product_id: string; variant_id: string; quantity: number }>;
    couponCode?: string;
    paymentMethod?: string;
    notes?: string;
  }): { success: boolean; order?: Order; error?: string } {
    const calc = this.validateAndCalculateOrder(
      params.items,
      params.couponCode,
      params.shippingAddress.state
    );

    if (!calc.isValid) {
      return { success: false, error: calc.error };
    }

    const orderId = `ord-${Date.now()}`;
    const orderNumber = `NH-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const orderItems: OrderItem[] = calc.orderItems.map((item) => ({
      ...item,
      order_id: orderId,
    }));

    // Atomically decrement stock and create inventory ledger entry
    for (const item of orderItems) {
      const product = this.products.find((p) => p.id === item.product_id);
      if (product) {
        const variant = product.variants.find((v) => v.id === item.variant_id);
        if (variant) {
          variant.stock -= item.quantity;
          variant.available_stock = Math.max(0, variant.stock - variant.reserved_stock);

          this.inventoryTxs.unshift({
            id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            variant_id: variant.id,
            product_name: product.name,
            sku: variant.sku,
            transaction_type: 'order_commit',
            quantity_change: -item.quantity,
            reference_id: orderId,
            notes: `Order ${orderNumber} placed`,
            created_at: new Date().toISOString(),
          });
        }
      }
    }

    const newOrder: Order = {
      id: orderId,
      order_number: orderNumber,
      user_id: params.userId,
      guest_email: params.guestEmail || params.shippingAddress.recipient_name,
      guest_phone: params.guestPhone || params.shippingAddress.phone,
      status: 'confirmed',
      subtotal: calc.subtotal,
      discount_amount: calc.discountAmount,
      coupon_code: params.couponCode,
      shipping_fee: calc.shippingFee,
      tax_amount: calc.taxAmount,
      total_amount: calc.totalAmount,
      currency: 'INR',
      shipping_address: params.shippingAddress,
      billing_address: params.billingAddress,
      items: orderItems,
      payment: {
        id: `pay-${Date.now()}`,
        order_id: orderId,
        razorpay_order_id: `order_rzp_${Date.now()}`,
        razorpay_payment_id: `pay_rzp_${Date.now()}`,
        razorpay_signature: `sig_${Math.random().toString(36).substring(2, 12)}`,
        amount: calc.totalAmount,
        currency: 'INR',
        status: 'paid',
        payment_method: params.paymentMethod || 'Razorpay UPI / Cards',
        created_at: new Date().toISOString(),
      },
      shipment: {
        id: `shp-${Date.now()}`,
        order_id: orderId,
        courier_name: 'BlueDart Express',
        tracking_number: `BD${Math.floor(100000000 + Math.random() * 900000000)}IN`,
        tracking_url: 'https://www.bluedart.com',
        estimated_delivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'Manifest created',
      },
      gst_breakdown: calc.gstBreakdown,
      notes: params.notes,
      created_at: new Date().toISOString(),
    };

    this.orders.unshift(newOrder);
    this.logAudit('ORDER_CREATED', 'orders', orderId, null, {
      order_number: orderNumber,
      total: calc.totalAmount,
    });

    this.persistAll();
    return { success: true, order: newOrder };
  }

  public getOrders(userId?: string): Order[] {
    if (userId) {
      return this.orders.filter((o) => o.user_id === userId);
    }
    return [...this.orders];
  }

  public getOrderById(id: string): Order | null {
    return this.orders.find((o) => o.id === id || o.order_number === id) || null;
  }

  public updateOrderStatus(orderId: string, newStatus: OrderStatus, trackingInfo?: { courierName?: string; trackingNumber?: string }): Order | null {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) return null;

    const prevStatus = order.status;
    order.status = newStatus;
    order.updated_at = new Date().toISOString();

    if (trackingInfo && order.shipment) {
      if (trackingInfo.courierName) order.shipment.courier_name = trackingInfo.courierName;
      if (trackingInfo.trackingNumber) order.shipment.tracking_number = trackingInfo.trackingNumber;
      if (newStatus === 'shipped' && !order.shipment.shipped_at) {
        order.shipment.shipped_at = new Date().toISOString();
      }
      if (newStatus === 'delivered' && !order.shipment.delivered_at) {
        order.shipment.delivered_at = new Date().toISOString();
      }
    }

    this.logAudit('ORDER_STATUS_UPDATED', 'orders', orderId, { status: prevStatus }, { status: newStatus });
    this.persistAll();
    return order;
  }

  // --- INVENTORY ADJUSTMENT (Admin) ---
  public adjustInventory(variantId: string, newStock: number, notes: string): boolean {
    let found = false;
    for (const product of this.products) {
      const variant = product.variants.find((v) => v.id === variantId);
      if (variant) {
        const prevStock = variant.stock;
        const diff = newStock - prevStock;
        variant.stock = newStock;
        variant.available_stock = Math.max(0, newStock - variant.reserved_stock);

        this.inventoryTxs.unshift({
          id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          variant_id: variant.id,
          product_name: product.name,
          sku: variant.sku,
          transaction_type: 'adjustment',
          quantity_change: diff,
          notes: notes || 'Admin manual adjustment',
          created_at: new Date().toISOString(),
        });

        this.logAudit('INVENTORY_ADJUSTED', 'inventory', variantId, { stock: prevStock }, { stock: newStock });
        found = true;
        break;
      }
    }

    if (found) {
      this.persistAll();
    }
    return found;
  }

  public getInventoryTransactions(): InventoryTransaction[] {
    return [...this.inventoryTxs];
  }

  // --- REVIEWS ---
  public getReviewsForProduct(productId: string): Review[] {
    return this.reviews.filter((r) => r.product_id === productId && r.is_approved);
  }

  public addReview(review: Omit<Review, 'id' | 'is_approved' | 'created_at'>): Review {
    const newReview: Review = {
      ...review,
      id: `rev-${Date.now()}`,
      is_approved: true, // auto approve in demo
      created_at: new Date().toISOString(),
    };
    this.reviews.unshift(newReview);

    // Recalculate product rating
    const productReviews = this.reviews.filter((r) => r.product_id === review.product_id && r.is_approved);
    const avg = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
    const product = this.products.find((p) => p.id === review.product_id);
    if (product) {
      product.rating_avg = Math.round(avg * 10) / 10;
      product.review_count = productReviews.length;
    }

    this.persistAll();
    return newReview;
  }

  public getAdminReviews(): Review[] {
    return [...this.reviews];
  }

  public toggleReviewApproval(reviewId: string): Review | null {
    const review = this.reviews.find((r) => r.id === reviewId);
    if (!review) return null;
    review.is_approved = !review.is_approved;
    this.persistAll();
    return review;
  }

  // --- RETURNS & REFUNDS ---
  public submitReturnRequest(orderId: string, orderItemId: string, reason: string, description: string, userEmail: string): ReturnRequest | null {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) return null;
    const item = order.items.find((i) => i.id === orderItemId);
    if (!item) return null;

    const returnReq: ReturnRequest = {
      id: `ret-${Date.now()}`,
      order_id: orderId,
      order_number: order.order_number,
      order_item_id: orderItemId,
      product_name: item.product_name,
      user_id: order.user_id || 'guest',
      user_email: userEmail,
      reason,
      description,
      status: 'requested',
      refund_amount: item.total_price,
      created_at: new Date().toISOString(),
    };

    this.returns.unshift(returnReq);
    this.logAudit('RETURN_REQUESTED', 'returns', returnReq.id, null, returnReq);
    this.persistAll();
    return returnReq;
  }

  public getReturns(): ReturnRequest[] {
    return [...this.returns];
  }

  public updateReturnStatus(returnId: string, status: ReturnRequest['status'], adminNotes?: string): ReturnRequest | null {
    const ret = this.returns.find((r) => r.id === returnId);
    if (!ret) return null;

    const prev = { status: ret.status };
    ret.status = status;
    if (adminNotes) ret.admin_notes = adminNotes;

    if (status === 'refunded') {
      const order = this.orders.find((o) => o.id === ret.order_id);
      if (order) {
        order.status = 'refunded';
        if (order.payment) order.payment.status = 'refunded';
      }
    }

    this.logAudit('RETURN_STATUS_UPDATED', 'returns', returnId, prev, { status });
    this.persistAll();
    return ret;
  }

  // --- COUPON CRUD (Admin) ---
  public getCoupons(): Coupon[] {
    return [...this.coupons];
  }

  public saveCoupon(coupon: Coupon): Coupon {
    const index = this.coupons.findIndex((c) => c.id === coupon.id);
    if (index >= 0) {
      this.coupons[index] = coupon;
      this.logAudit('COUPON_UPDATED', 'coupons', coupon.id, null, coupon);
    } else {
      this.coupons.unshift(coupon);
      this.logAudit('COUPON_CREATED', 'coupons', coupon.id, null, coupon);
    }
    this.persistAll();
    return coupon;
  }

  public deleteCoupon(id: string): boolean {
    const initialLen = this.coupons.length;
    this.coupons = this.coupons.filter((c) => c.id !== id);
    if (this.coupons.length < initialLen) {
      this.logAudit('COUPON_DELETED', 'coupons', id);
      this.persistAll();
      return true;
    }
    return false;
  }

  // --- ADMIN ANALYTICS & PROFIT METRICS ---
  public getAdminKPIs(): AdminKPI {
    const totalSales = this.orders
      .filter((o) => o.status !== 'cancelled' && o.status !== 'refunded')
      .reduce((sum, o) => sum + o.total_amount, 0);

    const pendingOrders = this.orders.filter(
      (o) => o.status === 'pending' || o.status === 'confirmed' || o.status === 'processing'
    ).length;

    let totalCOGS = 0;
    this.orders.forEach((o) => {
      if (o.status !== 'cancelled' && o.status !== 'refunded') {
        o.items.forEach((item) => {
          totalCOGS += (item.purchase_cost || 0) * item.quantity;
        });
      }
    });

    const grossProfit = Math.max(0, totalSales - totalCOGS);
    const marginPercent = totalSales > 0 ? Math.round((grossProfit / totalSales) * 1000) / 10 : 0;

    let lowStockCount = 0;
    this.products.forEach((p) => {
      p.variants.forEach((v) => {
        if (v.available_stock <= 3) lowStockCount++;
      });
    });

    const openReturns = this.returns.filter((r) => r.status === 'requested' || r.status === 'item_received').length;

    return {
      today_sales: Math.round(totalSales * 0.35),
      monthly_sales: totalSales,
      total_orders: this.orders.length,
      pending_orders: pendingOrders,
      total_customers: 240,
      total_products: this.products.length,
      low_stock_count: lowStockCount,
      open_returns_count: openReturns,
      estimated_gross_profit: grossProfit,
      gross_margin_percent: marginPercent,
    };
  }

  public getAuditLogs(): AuditLogItem[] {
    return [...this.auditLogs];
  }

  public getStoreSettings(): StoreSettings {
    return { ...this.settings };
  }

  public updateStoreSettings(newSettings: Partial<StoreSettings>): StoreSettings {
    const prev = { ...this.settings };
    this.settings = { ...this.settings, ...newSettings };
    this.logAudit('SETTINGS_UPDATED', 'store_settings', 'global', prev, this.settings);
    this.persistAll();
    return this.settings;
  }
}

// Export singleton instance
export const nitroDataService = new NitroDataService();
