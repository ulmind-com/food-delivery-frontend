import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChefHat, Plus, Minus } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { resolveImageURL } from "@/lib/image-utils";
import { ProductDetailDrawer } from "./ProductDetailDrawer";
import SectionHeading from "./SectionHeading";

interface ChefSpecialProps {
  items: any[];
}

/**
 * "Chef's Special" — the newest additions to the kitchen's menu, surfaced as a
 * big hero plate plus a picker rail. Everything is live menu data.
 */
const ChefSpecial = ({ items }: ChefSpecialProps) => {
  const { items: cartItems, addItem, incrementItem, decrementItem } = useCartStore();
  const { isAuthenticated, openAuthModal } = useAuthStore();
  const [activeIdx, setActiveIdx] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Newest first — the last things the kitchen put on the menu
  const specials = useMemo(
    () =>
      [...items]
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        )
        .slice(0, 5),
    [items]
  );

  if (specials.length === 0) return null;

  const active = specials[Math.min(activeIdx, specials.length - 1)];
  const price = active.price || active.variants?.[0]?.price || 0;
  const image = resolveImageURL(active.image || active.imageURL);
  const cartItem = cartItems.find((i) => i._id === active._id);
  const categoryName =
    typeof active.category === "object" ? active.category?.name : active.category;

  const handleAdd = () => {
    if (!isAuthenticated()) {
      openAuthModal("login");
      return;
    }
    addItem({
      _id: active._id,
      name: active.name,
      price: Number(price),
      image,
      type: active.type,
      category: typeof active.category === "object" ? active.category._id : active.category,
    });
  };

  return (
    <section className="relative overflow-hidden py-14">
      {/* Ambience */}
      <span className="pointer-events-none absolute -left-32 top-1/3 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <span className="dot-grid pointer-events-none absolute right-6 top-10 h-28 w-28 opacity-40" />

      <div className="container relative mx-auto px-4">
        <SectionHeading
          eyebrow="From the pass"
          title="Chef's Special"
          subtitle="The newest plates to join our menu — picked and priced by the kitchen itself."
        />

        <div className="perspective-1400">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="group relative grid overflow-hidden rounded-[28px] border border-border/70 bg-card shadow-float-lg md:grid-cols-2"
          >
            {/* ── Image side ─────────────────────────────────────────── */}
            <div className="relative min-h-[280px] overflow-hidden md:min-h-[420px]">
              <AnimatePresence mode="wait">
                <motion.img
                  key={active._id}
                  src={image}
                  alt={active.name}
                  initial={{ opacity: 0, scale: 1.08 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </AnimatePresence>

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent md:bg-gradient-to-r md:from-transparent md:via-black/10 md:to-card/90" />

              {/* Floating chef badge */}
              <div className="liquid-glass-dark absolute left-4 top-4 flex items-center gap-2 rounded-full px-3.5 py-2 animate-float-y">
                <ChefHat className="h-4 w-4 text-amber-300" />
                <span className="text-[11px] font-black uppercase tracking-[0.14em] text-white">
                  Chef's pick
                </span>
              </div>

              {active.hasDiscount && !!active.discountPercentage && (
                <div className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-red-600 to-amber-500 px-3 py-1.5 text-[12px] font-black text-white shadow-lg animate-gradient-pan">
                  {active.discountPercentage}% OFF
                </div>
              )}
            </div>

            {/* ── Copy side ──────────────────────────────────────────── */}
            <div className="relative flex flex-col justify-center gap-4 p-6 sm:p-9">
              {categoryName && (
                <span className="text-[11px] font-black uppercase tracking-[0.16em] text-primary">
                  {categoryName}
                </span>
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={active._id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35 }}
                >
                  <h3 className="font-display text-[28px] font-black leading-tight text-foreground sm:text-[36px]">
                    {active.name}
                  </h3>

                  {active.description && (
                    <p className="mt-3 max-w-md text-[14px] leading-relaxed text-muted-foreground">
                      {active.description}
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="flex flex-wrap items-center gap-3">
                <span className="font-display text-[30px] font-black text-foreground">
                  ₹{price}
                </span>
                {active.hasDiscount && active.originalPrice && (
                  <span className="text-lg font-bold text-muted-foreground line-through">
                    ₹{active.originalPrice}
                  </span>
                )}
                <span
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    active.type === "Veg"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-red-500/10 text-red-600 dark:text-red-400"
                  }`}
                >
                  <span
                    className={`flex h-3 w-3 items-center justify-center rounded-[3px] border ${
                      active.type === "Veg" ? "border-emerald-500" : "border-red-500"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        active.type === "Veg" ? "bg-emerald-500" : "bg-red-500"
                      }`}
                    />
                  </span>
                  {active.type || "Non-Veg"}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                {cartItem ? (
                  <div className="flex items-center gap-1 rounded-2xl bg-gradient-to-b from-primary to-orange-600 p-1 shadow-glow-primary">
                    <button
                      onClick={() => decrementItem(cartItem.itemId)}
                      aria-label="Decrease quantity"
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-white transition-colors hover:bg-white/20"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-[28px] text-center text-[15px] font-black tabular-nums text-white">
                      {cartItem.quantity}
                    </span>
                    <button
                      onClick={() => incrementItem(cartItem.itemId)}
                      aria-label="Increase quantity"
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-white transition-colors hover:bg-white/20"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    onClick={handleAdd}
                    className="group/btn relative overflow-hidden rounded-2xl bg-gradient-to-b from-primary to-orange-600 px-7 py-3.5 text-[14px] font-extrabold text-white shadow-glow-primary transition-transform hover:scale-105"
                  >
                    <span className="relative z-10">Order Now</span>
                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 group-hover/btn:translate-x-full" />
                  </motion.button>
                )}

                <button
                  onClick={() => setDrawerOpen(true)}
                  className="rounded-2xl border border-border px-6 py-3.5 text-[14px] font-bold text-foreground transition-colors hover:bg-accent"
                >
                  View details
                </button>
              </div>

              {/* ── Picker rail ──────────────────────────────────────── */}
              {specials.length > 1 && (
                <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
                  {specials.map((s, i) => (
                    <button
                      key={s._id}
                      onClick={() => setActiveIdx(i)}
                      aria-label={`Show ${s.name}`}
                      className={`relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl transition-all duration-300 ${
                        i === activeIdx
                          ? "ring-2 ring-primary ring-offset-2 ring-offset-card"
                          : "opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={resolveImageURL(s.image || s.imageURL)}
                        alt={s.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                      {i === activeIdx && (
                        <span className="absolute inset-0 bg-primary/15" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <ProductDetailDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        productId={active._id}
        initialData={active}
      />
    </section>
  );
};

export default ChefSpecial;
