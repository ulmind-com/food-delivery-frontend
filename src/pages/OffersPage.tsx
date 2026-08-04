import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Ticket,
  Copy,
  Check,
  Percent,
  BadgeIndianRupee,
  Flame,
  Truck,
  Lock,
  CalendarClock,
  ArrowRight,
} from "lucide-react";
import { useOffers, type Coupon } from "@/hooks/useOffers";
import { useAuthStore } from "@/store/useAuthStore";
import { useRestaurantStore } from "@/store/useRestaurantStore";
import { useQuery } from "@tanstack/react-query";
import { menuApi } from "@/api/axios";
import PageHero from "@/components/PageHero";
import SectionHeading from "@/components/SectionHeading";
import ProductCard from "@/components/ProductCard";
import { SkeletonCard } from "@/components/Skeletons";
import { resolveImageURL } from "@/lib/image-utils";

const formatDate = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const OffersPage = () => {
  const { coupons, dealItems, isLoggedIn, isLoading } = useOffers();
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const restaurant = useRestaurantStore((s) => s.restaurant);
  const [copied, setCopied] = useState<string | null>(null);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => menuApi.getCategories().then((r) => r.data),
  });

  const withCategory = (item: any) => {
    if (typeof item.category === "string" && categories) {
      const found = categories.find((c: any) => c._id === item.category);
      if (found) return { ...item, category: found };
    }
    return item;
  };

  const copy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    toast.success(`Code ${code} copied`);
    setTimeout(() => setCopied((c) => (c === code ? null : c)), 2000);
  };

  const heroImage = dealItems[0]
    ? resolveImageURL(dealItems[0].imageURL || dealItems[0].image)
    : undefined;

  return (
    <div className="min-h-screen bg-background">
      <PageHero
        eyebrow="Offers"
        image={heroImage}
        title={
          <>
            Every live deal, in{" "}
            <span className="text-gradient-primary">one place</span>
          </>
        }
        subtitle="Coupon codes and price drops published straight from the kitchen dashboard. When an offer expires there, it disappears here."
      >
        <div className="flex flex-wrap gap-3">
          <span className="liquid-glass-dark inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold text-white">
            <Ticket className="h-4 w-4 text-amber-300" />
            {coupons.length} coupon{coupons.length === 1 ? "" : "s"}
          </span>
          <span className="liquid-glass-dark inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold text-white">
            <Flame className="h-4 w-4 text-orange-400" />
            {dealItems.length} price drop{dealItems.length === 1 ? "" : "s"}
          </span>
        </div>
      </PageHero>

      {/* ── Coupons ───────────────────────────────────────────────────── */}
      <section className="container mx-auto px-4 py-14">
        <SectionHeading
          eyebrow="Coupon codes"
          title="Save at checkout"
          subtitle="Copy a code and paste it into the coupon box in your cart — the discount is validated live against your order."
        />

        {!isLoggedIn ? (
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-lg overflow-hidden rounded-[24px] border border-border/70 bg-card p-8 text-center shadow-float"
          >
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-orange-600 text-white shadow-glow-primary">
              <Lock className="h-6 w-6" />
            </div>
            <h3 className="font-display text-[20px] font-extrabold text-foreground">
              Sign in to unlock coupon codes
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-[13.5px] leading-relaxed text-muted-foreground">
              Coupons are tied to your account, so we only show the ones you can
              actually redeem. Price drops below are open to everyone.
            </p>
            <button
              onClick={() => openAuthModal("login")}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-b from-primary to-orange-600 px-6 py-3 text-sm font-extrabold text-white shadow-glow-primary transition-transform hover:scale-105"
            >
              Sign in <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        ) : isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="shimmer h-[190px] rounded-[24px] border border-border/70"
              />
            ))}
          </div>
        ) : coupons.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-border bg-card/50 py-16 text-center">
            <p className="text-4xl">🎟️</p>
            <h3 className="font-display mt-3 text-lg font-extrabold text-foreground">
              No coupons running right now
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Check the price drops below — those are live.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {coupons.map((c: Coupon, i: number) => (
              <CouponCard
                key={c._id}
                coupon={c}
                index={i}
                copied={copied === c.code}
                onCopy={() => copy(c.code)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Free delivery strip ───────────────────────────────────────── */}
      {!!restaurant?.freeDeliveryRadius && (
        <section className="container mx-auto px-4 pb-6">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative flex flex-col items-start gap-5 overflow-hidden rounded-[24px] bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 p-7 text-white shadow-float-lg animate-gradient-pan sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/20 blur-2xl animate-float-y" />
            <span className="dot-grid pointer-events-none absolute inset-0 opacity-[0.12]" />

            <div className="relative flex items-center gap-4">
              <span className="liquid-glass-dark flex h-14 w-14 items-center justify-center rounded-2xl">
                <Truck className="h-6 w-6" />
              </span>
              <div>
                <h3 className="font-display text-[22px] font-black leading-tight">
                  Free delivery within {restaurant.freeDeliveryRadius} km
                </h3>
                <p className="mt-1 text-[13px] text-white/85">
                  {restaurant.chargePerKm
                    ? `Beyond that it's ₹${restaurant.chargePerKm} per km, up to ${restaurant.deliveryRadius || 10} km.`
                    : "Automatically applied at checkout — no code needed."}
                </p>
              </div>
            </div>

            <Link
              to="/menu"
              className="relative inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-extrabold text-emerald-700 shadow-lg transition-transform hover:scale-105"
            >
              Start ordering <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </section>
      )}

      {/* ── Price drops ───────────────────────────────────────────────── */}
      <section className="container mx-auto px-4 py-14">
        <SectionHeading
          align="left"
          eyebrow="Live price drops"
          title="Discounted right now"
          subtitle="Timed discounts set by the kitchen. No code needed — the lower price is already on the card."
          action={
            <Link
              to="/menu"
              className="inline-flex items-center gap-1.5 rounded-full border border-border/70 px-4 py-2 text-[13px] font-bold transition-colors hover:bg-accent"
            >
              Full menu <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        />

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : dealItems.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-border bg-card/50 py-16 text-center">
            <p className="text-4xl">🔥</p>
            <h3 className="font-display mt-3 text-lg font-extrabold text-foreground">
              No discounts on the menu today
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Everything's at its regular price — still worth a look.
            </p>
            <Link
              to="/menu"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-primary to-orange-600 px-6 py-2.5 text-sm font-extrabold text-white shadow-glow-primary transition-transform hover:scale-105"
            >
              Browse the menu <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {dealItems.map((item: any) => (
              <ProductCard key={item._id} item={withCategory(item)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

/* ── Coupon ticket ─────────────────────────────────────────────────── */
function CouponCard({
  coupon,
  index,
  copied,
  onCopy,
}: {
  coupon: Coupon;
  index: number;
  copied: boolean;
  onCopy: () => void;
}) {
  const isPercent = coupon.discountType === "PERCENTAGE";
  const value = isPercent ? `${coupon.discountAmount}%` : `₹${coupon.discountAmount}`;

  const remaining =
    coupon.usageLimit != null
      ? Math.max(0, coupon.usageLimit - (coupon.usageCount || 0))
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -8 }}
      className="group perspective-1400 relative"
    >
      <div className="glass-sheen relative flex overflow-hidden rounded-[22px] border border-border/70 bg-card shadow-float transition-shadow duration-300 group-hover:shadow-float-lg">
        {/* Ticket notches */}
        <span className="absolute -left-3 top-1/2 z-10 h-6 w-6 -translate-y-1/2 rounded-full bg-background" />
        <span className="absolute -right-3 top-1/2 z-10 h-6 w-6 -translate-y-1/2 rounded-full bg-background" />

        {/* Value stub */}
        <div className="relative flex w-[104px] flex-shrink-0 flex-col items-center justify-center gap-1 bg-gradient-to-br from-primary via-orange-500 to-amber-500 p-4 text-white animate-gradient-pan">
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/25 to-transparent" />
          {isPercent ? (
            <Percent className="relative h-4 w-4" />
          ) : (
            <BadgeIndianRupee className="relative h-4 w-4" />
          )}
          <span className="font-display relative text-[26px] font-black leading-none">
            {value}
          </span>
          <span className="relative text-[10px] font-black uppercase tracking-[0.18em]">
            Off
          </span>
        </div>

        {/* Perforation */}
        <span className="my-4 border-l-2 border-dashed border-border" />

        {/* Details */}
        <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 p-4">
          <div className="min-w-0">
            <h3 className="font-display truncate text-[15px] font-extrabold text-foreground">
              {coupon.name || coupon.code}
            </h3>
            {coupon.description && (
              <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
                {coupon.description}
              </p>
            )}

            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {!!coupon.minOrderValue && (
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-secondary-foreground">
                  Min ₹{coupon.minOrderValue}
                </span>
              )}
              {isPercent && coupon.maxDiscountAmount ? (
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-secondary-foreground">
                  Up to ₹{coupon.maxDiscountAmount}
                </span>
              ) : null}
              {remaining !== null && remaining <= 10 && (
                <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-600 dark:text-red-400">
                  {remaining} left
                </span>
              )}
            </div>

            <p className="mt-2 flex items-center gap-1 text-[10.5px] font-semibold text-muted-foreground">
              <CalendarClock className="h-3 w-3" />
              Valid till {formatDate(coupon.validUntil)}
            </p>
          </div>

          <button
            onClick={onCopy}
            className={`flex items-center justify-between gap-2 rounded-xl border-2 border-dashed px-3 py-2 text-[13px] font-black uppercase tracking-widest transition-colors ${
              copied
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "border-border text-foreground hover:border-primary hover:text-primary"
            }`}
          >
            <span className="truncate">{coupon.code}</span>
            {copied ? (
              <Check className="h-3.5 w-3.5 flex-shrink-0" />
            ) : (
              <Copy className="h-3.5 w-3.5 flex-shrink-0 opacity-60" />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default OffersPage;
