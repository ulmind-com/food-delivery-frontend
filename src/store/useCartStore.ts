import { create } from "zustand";
import { cartApi } from "@/api/axios";
import { toast } from "sonner";

export interface CartItem {
  _id: string;
  itemId: string; // server-side item reference for PUT/DELETE
  name: string;
  price: number;
  image: string;
  quantity: number;
  variant?: string;
  type?: "Veg" | "Non-Veg";
}

interface AppliedCoupon {
  code: string;
  discountAmount: number;
  minOrderValue?: number;
}

interface ServerCart {
  items: CartItem[];
  totalPrice: number;
  discountAmount: number;
  finalPrice: number;
  deliveryFee: number;
  tax: number;
  appliedCoupon: AppliedCoupon | null;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  isLoading: boolean;
  totalPrice: number;
  discountAmount: number;
  finalPrice: number;
  deliveryFee: number;
  tax: number;
  appliedCoupon: AppliedCoupon | null;

  fetchCart: () => Promise<void>;
  addItem: (product: { _id: string; name: string; price: number; image: string; variant?: string; type?: "Veg" | "Non-Veg" }) => Promise<void>;
  incrementItem: (itemId: string) => Promise<void>;
  decrementItem: (itemId: string) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
  toggleCart: () => void;
  getItemCount: () => number;
}

const emptyCart: Omit<CartState, "isOpen" | "isLoading" | "fetchCart" | "addItem" | "incrementItem" | "decrementItem" | "removeItem" | "clearCart" | "applyCoupon" | "removeCoupon" | "toggleCart" | "getItemCount"> = {
  items: [],
  totalPrice: 0,
  discountAmount: 0,
  finalPrice: 0,
  deliveryFee: 0,
  tax: 0,
  appliedCoupon: null,
};

/** Compute total from local items (used for optimistic price updates) */
const calcTotal = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + i.price * i.quantity, 0);

export const useCartStore = create<CartState>()((set, get) => ({
  ...emptyCart,
  isOpen: false,
  isLoading: false,

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const res = await cartApi.get();
      const data = res.data;
      const formattedItems: CartItem[] = (data.items || []).map((item: any) => {
        const product = item.product || {};
        let currentPrice = item.price; // Default to stored price

        // Recalculate based on product data if available (fixes stale/incorrect backend cart prices)
        if (product && product._id) {
          let base = product.price;
          // If variant exists, try to find its price
          if (item.variant && Array.isArray(product.variants)) {
            const v = product.variants.find((v: any) => v.name === item.variant);
            if (v) base = v.price;
          }

          // Apply discount if applicable
          if (base && product.discountPercentage > 0) {
            const isExpired = product.discountExpiresAt && new Date(product.discountExpiresAt) < new Date();
            if (!isExpired) {
              currentPrice = Math.round(base * (1 - product.discountPercentage / 100));
            } else {
              currentPrice = base;
            }
          } else if (base) {
            currentPrice = base; // No discount, ensure we match current product price
          }
        }

        return {
          _id: product._id || item._id,
          itemId: item._id, // This is the cart-item ID for PUT/DELETE
          name: item.name || product.name || "Unknown",
          price: currentPrice,
          image: item.imageURL || product.imageURL || "/placeholder.svg",
          quantity: item.quantity,
          variant: item.variant,
          type: item.type || product.type,
        };
      });
      // Fetch bill details from dedicated bill API
      let bill = { itemsTotal: 0, shipping: 0, discount: 0, finalTotal: 0, appliedCoupon: null as any };
      try {
        const billRes = await cartApi.getBill();
        bill = billRes.data;
      } catch {
        // Fallback to cart data if bill endpoint fails
      }

      // Re-calculate totals locally if bill API is also returning stale data (optional but safer)
      const localTotal = calcTotal(formattedItems);
      // We prefer local calculation for itemsTotal to ensure consistency with the displayed prices

      set({
        items: formattedItems,
        totalPrice: localTotal, // Use local total to match the recalculated prices
        discountAmount: bill.discount || 0,
        finalPrice: localTotal + (bill.shipping || 0) - (bill.discount || 0), // Adjust final accordingly
        deliveryFee: bill.shipping || 0,
        tax: 0,
        appliedCoupon: bill.appliedCoupon || data.appliedCoupon || null,
      });
    } catch {
      // Silent fail — user might not be logged in
    } finally {
      set({ isLoading: false });
    }
  },

  addItem: async (product) => {
    // Optimistic: add locally with instant price update
    const prev = get().items;
    const existing = prev.find((i) => i._id === product._id && i.variant === product.variant);
    let nextItems: CartItem[];
    if (existing) {
      nextItems = prev.map((i) =>
        i._id === product._id && i.variant === product.variant
          ? { ...i, quantity: i.quantity + 1, price: product.price } // Update price in case it changed
          : i
      );
    } else {
      nextItems = [...prev, { ...product, itemId: "", quantity: 1 }];
    }
    const optimisticTotal = calcTotal(nextItems);
    set({ items: nextItems, totalPrice: optimisticTotal, finalPrice: optimisticTotal });

    try {
      await cartApi.add({ productId: product._id, quantity: 1 });
      await get().fetchCart();
    } catch (err: any) {
      set({ items: prev, totalPrice: calcTotal(prev), finalPrice: calcTotal(prev) }); // Revert
      toast.error(err.response?.data?.message || "Failed to add item");
    }
  },

  incrementItem: async (itemId) => {
    const prev = get().items;
    const item = prev.find((i) => i.itemId === itemId);
    if (!item) return;

    // Optimistic with instant price
    const nextItems = prev.map((i) => (i.itemId === itemId ? { ...i, quantity: i.quantity + 1 } : i));
    const optimisticTotal = calcTotal(nextItems);
    set({ items: nextItems, totalPrice: optimisticTotal, finalPrice: optimisticTotal });

    try {
      await cartApi.updateQty(itemId, { quantity: item.quantity + 1 });
      await get().fetchCart();
    } catch (err: any) {
      set({ items: prev, totalPrice: calcTotal(prev), finalPrice: calcTotal(prev) });
      toast.error(err.response?.data?.message || "Update failed");
    }
  },

  decrementItem: async (itemId) => {
    const prev = get().items;
    const item = prev.find((i) => i.itemId === itemId);
    if (!item) return;

    if (item.quantity <= 1) {
      return get().removeItem(itemId);
    }

    // Optimistic with instant price
    const nextItems = prev.map((i) => (i.itemId === itemId ? { ...i, quantity: i.quantity - 1 } : i));
    const optimisticTotal = calcTotal(nextItems);
    set({ items: nextItems, totalPrice: optimisticTotal, finalPrice: optimisticTotal });

    try {
      await cartApi.updateQty(itemId, { quantity: item.quantity - 1 });
      await get().fetchCart();
    } catch (err: any) {
      set({ items: prev, totalPrice: calcTotal(prev), finalPrice: calcTotal(prev) });
      toast.error(err.response?.data?.message || "Update failed");
    }
  },

  removeItem: async (itemId) => {
    const prev = get().items;
    set({ items: prev.filter((i) => i.itemId !== itemId) });

    try {
      await cartApi.removeItem(itemId);
      await get().fetchCart();
    } catch (err: any) {
      set({ items: prev });
      toast.error(err.response?.data?.message || "Remove failed");
    }
  },

  clearCart: async () => {
    const prev = { items: get().items, ...emptyCart };
    set({ ...emptyCart });

    try {
      await cartApi.clear();
    } catch (err: any) {
      set(prev);
      toast.error("Failed to clear cart");
    }
  },

  applyCoupon: async (code) => {
    try {
      await cartApi.applyCoupon({ code });
      await get().fetchCart();
      const coupon = get().appliedCoupon;
      toast.success(`Saved ₹${coupon?.discountAmount?.toFixed(0) || ""}! 🎉`);
    } catch (err: any) {
      const message: string = err.response?.data?.message || "";
      const minMatch = message.match(/(\d+)/);
      if (minMatch) {
        const deficit = parseInt(minMatch[1]) - get().totalPrice;
        if (deficit > 0) {
          toast.warning(`Add ₹${deficit.toFixed(0)} more to use this coupon!`, { duration: 4000 });
          throw err; // Re-throw so UI can trigger shake
        }
      }
      toast.error(message || "Could not apply coupon");
      throw err;
    }
  },

  removeCoupon: async () => {
    try {
      await cartApi.removeCoupon();
      await get().fetchCart();
      toast.success("Coupon removed");
    } catch {
      toast.error("Failed to remove coupon");
    }
  },



  toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
  getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}));
