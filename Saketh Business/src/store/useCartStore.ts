import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product, ProductVariant, CouponValidationResult } from '../types';
import { nitroDataService } from '../lib/supabase/service';

interface CartStore {
  items: CartItem[];
  couponCode: string;
  appliedCoupon: CouponValidationResult | null;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
  itemCount: number;

  addItem: (product: Product, variant: ProductVariant, quantity?: number) => boolean;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  clearCart: () => void;
  recalculate: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: '',
      appliedCoupon: null,
      subtotal: 0,
      discountAmount: 0,
      shippingFee: 0,
      totalAmount: 0,
      itemCount: 0,

      addItem: (product, variant, quantity = 1) => {
        const { items } = get();
        const existingIndex = items.findIndex((i) => i.variant_id === variant.id);
        const unitPrice = variant.price_override || product.selling_price;

        if (variant.available_stock <= 0) {
          return false;
        }

        let updatedItems = [...items];

        if (existingIndex >= 0) {
          const currentQty = updatedItems[existingIndex].quantity;
          const newQty = Math.min(currentQty + quantity, variant.available_stock);
          updatedItems[existingIndex] = {
            ...updatedItems[existingIndex],
            quantity: newQty,
            total_price: newQty * unitPrice,
          };
        } else {
          const initialQty = Math.min(quantity, variant.available_stock);
          updatedItems.push({
            id: `ci-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            product_id: product.id,
            variant_id: variant.id,
            product,
            variant,
            quantity: initialQty,
            unit_price: unitPrice,
            total_price: initialQty * unitPrice,
          });
        }

        set({ items: updatedItems });
        get().recalculate();
        return true;
      },

      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== itemId),
        }));
        get().recalculate();
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }

        set((state) => ({
          items: state.items.map((i) => {
            if (i.id === itemId) {
              const maxStock = i.variant.available_stock || 10;
              const cappedQty = Math.min(quantity, maxStock);
              return {
                ...i,
                quantity: cappedQty,
                total_price: cappedQty * i.unit_price,
              };
            }
            return i;
          }),
        }));
        get().recalculate();
      },

      applyCoupon: (code) => {
        const { subtotal } = get();
        const result = nitroDataService.validateCoupon(code, subtotal);
        if (result.is_valid) {
          set({
            couponCode: code.toUpperCase(),
            appliedCoupon: result,
          });
          get().recalculate();
          return { success: true, message: result.message };
        } else {
          return { success: false, message: result.message };
        }
      },

      removeCoupon: () => {
        set({
          couponCode: '',
          appliedCoupon: null,
        });
        get().recalculate();
      },

      clearCart: () => {
        set({
          items: [],
          couponCode: '',
          appliedCoupon: null,
          subtotal: 0,
          discountAmount: 0,
          shippingFee: 0,
          totalAmount: 0,
          itemCount: 0,
        });
      },

      recalculate: () => {
        const { items, couponCode } = get();
        const subtotal = items.reduce((sum, i) => sum + i.total_price, 0);
        const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

        let discountAmount = 0;
        let appliedCoupon = null;

        if (couponCode && subtotal > 0) {
          const couponRes = nitroDataService.validateCoupon(couponCode, subtotal);
          if (couponRes.is_valid) {
            discountAmount = couponRes.discount_amount;
            appliedCoupon = couponRes;
          }
        }

        const settings = nitroDataService.getStoreSettings();
        const shippingFee =
          subtotal === 0 || subtotal >= settings.free_shipping_threshold ? 0 : settings.default_shipping_fee;

        const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee);

        set({
          subtotal,
          discountAmount,
          appliedCoupon,
          shippingFee,
          totalAmount,
          itemCount,
        });
      },
    }),
    {
      name: 'nitro_hub_cart_v1',
    }
  )
);
