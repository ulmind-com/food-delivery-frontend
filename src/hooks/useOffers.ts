import { useQuery } from "@tanstack/react-query";
import { couponApi, menuApi } from "@/api/axios";
import { useAuthStore } from "@/store/useAuthStore";
import { useRestaurantStore } from "@/store/useRestaurantStore";

export interface Coupon {
  _id: string;
  code: string;
  name: string;
  description: string;
  discountType: "PERCENTAGE" | "FLAT";
  discountAmount: number;
  discountPercent?: number;
  maxDiscountAmount?: number | null;
  minOrderValue?: number;
  validFrom: string;
  validUntil: string;
  usageLimit?: number | null;
  usageCount?: number;
  isActive: boolean;
}

export interface DiscountedItem {
  _id: string;
  name: string;
  discountPercentage?: number;
  hasDiscount?: boolean;
  [key: string]: any;
}

/**
 * Single source of truth for everything promotional on the site.
 *
 * `GET /api/coupons` is behind `protect`, so guests can't see coupon codes.
 * When they aren't available we fall back to live product discounts and then
 * to the restaurant's own free-delivery rule — all of it real backend data,
 * never invented copy.
 */
export function useOffers() {
  const isLoggedIn = useAuthStore((s) => !!s.token);
  const restaurant = useRestaurantStore((s) => s.restaurant);

  const {
    data: coupons,
    isLoading: couponsLoading,
  } = useQuery<Coupon[]>({
    queryKey: ["coupons", "public"],
    queryFn: () => couponApi.getAll().then((r) => r.data),
    enabled: isLoggedIn,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const { data: menu, isLoading: menuLoading } = useQuery<DiscountedItem[]>({
    queryKey: ["menu", "all"],
    queryFn: () => menuApi.getMenu().then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  });

  const activeCoupons = (coupons || []).filter((c) => c.isActive);

  const dealItems = (menu || []).filter(
    (p) => p.hasDiscount && !!p.discountPercentage
  );

  const topDeal = dealItems.reduce<DiscountedItem | null>(
    (best, p) =>
      !best || (p.discountPercentage || 0) > (best.discountPercentage || 0) ? p : best,
    null
  );

  /* ── Pick the single best thing to shout about ───────────────────── */
  const best = activeCoupons[0];

  let headline: string;
  let subline: string;
  let code: string | undefined;
  let to = "/menu";

  if (best) {
    const value =
      best.discountType === "PERCENTAGE"
        ? `${best.discountAmount}% OFF`
        : `₹${best.discountAmount} OFF`;

    headline = `Enjoy ${value} on your order`;
    subline = best.description
      ? best.description
      : best.minOrderValue
        ? `Valid on orders above ₹${best.minOrderValue}. Apply the code at checkout.`
        : "Apply the code at checkout to claim this offer.";
    code = best.code;
    to = "/offers";
  } else if (topDeal) {
    headline = `Up to ${topDeal.discountPercentage}% off today`;
    subline = `Live price drops across the menu, starting with ${topDeal.name}. Limited time only.`;
    to = "/offers";
  } else if (restaurant?.freeDeliveryRadius) {
    headline = `Free delivery within ${restaurant.freeDeliveryRadius} km`;
    subline = `Order from ${restaurant.name || "our kitchen"} and pay zero delivery fees inside the free zone.`;
  } else {
    headline = "Fresh from our kitchen, straight to your door";
    subline = "Browse the full menu and get your favourites delivered hot.";
  }

  return {
    coupons: activeCoupons,
    dealItems,
    topDeal,
    headline,
    subline,
    code,
    to,
    isLoggedIn,
    isLoading: (isLoggedIn && couponsLoading) || menuLoading,
  };
}
