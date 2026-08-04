import { useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useFavoriteStore } from "@/store/useFavoriteStore";
import { Plus, Minus, Heart, ShoppingCart, Flame, Leaf } from "lucide-react";
import { resolveImageURL } from "@/lib/image-utils";
import { ProductDetailDrawer } from "./ProductDetailDrawer";

interface ProductCardProps {
  item: {
    _id: string;
    name: string;
    description?: string;
    price: number;
    image?: string;
    imageURL?: string;
    type?: "Veg" | "Non-Veg";
    category?: string | { _id: string; name: string };
    variants?: { name: string; price: number }[];
    hasDiscount?: boolean;
    originalPrice?: number;
    discountPercentage?: number;
    discountExpiresAt?: string;
    isAvailable?: boolean;
  };
  /** Compact variant for horizontal rails (Chef's Special, Deals). */
  layout?: "grid" | "rail";
}

const ProductCard = ({ item, layout = "grid" }: ProductCardProps) => {
  const { items, addItem, incrementItem, decrementItem } = useCartStore();
  const { isAuthenticated, openAuthModal } = useAuthStore();
  const favIds = useFavoriteStore((s) => s.ids);
  const toggleFav = useFavoriteStore((s) => s.toggle);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const cartItem = items.find((i) => i._id === item._id);
  const isFav = favIds.includes(item._id);
  const isVeg = item.type === "Veg";
  const soldOut = item.isAvailable === false;

  const displayPrice = item.price || item.variants?.[0]?.price || 0;
  const imageUrl = resolveImageURL(item.image || item.imageURL);
  const categoryName =
    typeof item.category === "object" ? item.category?.name : item.category;

  /* ── 3D tilt: track the pointer and map it to rotation ─────────────── */
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const springCfg = { stiffness: 220, damping: 22, mass: 0.5 };
  const rotateX = useSpring(
    useTransform(mouseY, [0, 1], [8, -8]),
    springCfg
  );
  const rotateY = useSpring(
    useTransform(mouseX, [0, 1], [-10, 10]),
    springCfg
  );

  // Follow the pointer with the specular highlight
  const glare = useTransform(
    [mouseX, mouseY],
    ([x, y]: number[]) =>
      `radial-gradient(340px circle at ${x * 100}% ${y * 100}%, hsl(0 0% 100% / 0.35), transparent 65%)`
  );

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };

  const handlePointerLeave = () => {
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  /* ── Cart actions ──────────────────────────────────────────────────── */
  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (soldOut) return;
    if (!isAuthenticated()) {
      openAuthModal("login");
      return;
    }
    addItem({
      _id: item._id,
      name: item.name,
      price: Number(displayPrice),
      image: imageUrl,
      type: item.type,
      category: typeof item.category === "object" ? item.category._id : item.category,
    });
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    incrementItem(cartItem!.itemId);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    decrementItem(cartItem!.itemId);
  };

  const handleFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFav(item._id);
  };

  const savings =
    item.hasDiscount && item.originalPrice
      ? Math.round(item.originalPrice - displayPrice)
      : 0;

  return (
    <>
      <div
        className={`perspective-1400 ${layout === "rail" ? "w-[240px] flex-shrink-0" : "w-full"}`}
      >
        <motion.div
          ref={cardRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          onClick={() => setIsDrawerOpen(true)}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          whileHover={{ scale: 1.025 }}
          className="group preserve-3d relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[22px] border border-border/70 bg-card p-2.5 shadow-float transition-shadow duration-300 hover:shadow-float-lg"
        >
          {/* Pointer-tracking glare — the liquid-glass reflection */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-30 rounded-[22px] opacity-0 mix-blend-overlay transition-opacity duration-300 group-hover:opacity-100"
            style={{ background: glare }}
          />

          {/* ── Media ─────────────────────────────────────────────────── */}
          <div
            className="relative translate-z-16 overflow-hidden rounded-[16px]"
            style={{ transform: "translateZ(28px)" }}
          >
            <div className={`relative ${layout === "rail" ? "aspect-[4/3]" : "aspect-[5/4]"} w-full overflow-hidden rounded-[16px] bg-muted`}>
              <img
                src={imageUrl}
                alt={item.name}
                loading="lazy"
                className={`h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.12] ${soldOut ? "grayscale" : ""}`}
              />
              {/* Depth gradient so the card reads as a physical plate */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/0 to-black/10" />

              {/* Sold out veil */}
              {soldOut && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                  <span className="liquid-glass-dark rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                    Sold out
                  </span>
                </div>
              )}
            </div>

            {/* Discount badge */}
            {item.hasDiscount && !!item.discountPercentage && (
              <motion.div
                initial={{ scale: 0, rotate: -12 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 16, delay: 0.15 }}
                className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-400 px-2.5 py-1 shadow-lg animate-gradient-pan"
                style={{ transform: "translateZ(45px)" }}
              >
                <Flame className="h-3 w-3 text-white" fill="currentColor" />
                <span className="text-[11px] font-black leading-none text-white">
                  {item.discountPercentage}% OFF
                </span>
              </motion.div>
            )}

            {/* Favourite */}
            <motion.button
              onClick={handleFav}
              whileTap={{ scale: 0.82 }}
              aria-label={isFav ? "Remove from favourites" : "Add to favourites"}
              className="liquid-glass absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full"
              style={{ transform: "translateZ(45px)" }}
            >
              <Heart
                className={`h-4 w-4 transition-all duration-300 ${
                  isFav
                    ? "scale-110 fill-red-500 text-red-500"
                    : "text-slate-700 dark:text-white/80"
                }`}
              />
            </motion.button>

            {/* Veg / Non-Veg marker floating on the plate */}
            <div
              className="liquid-glass-dark absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full px-2 py-1"
              style={{ transform: "translateZ(38px)" }}
            >
              <span
                className={`flex h-3 w-3 items-center justify-center rounded-[3px] border ${
                  isVeg ? "border-emerald-400" : "border-red-400"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isVeg ? "bg-emerald-400" : "bg-red-400"
                  }`}
                />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wide text-white">
                {isVeg ? "Veg" : "Non-Veg"}
              </span>
            </div>
          </div>

          {/* ── Body ──────────────────────────────────────────────────── */}
          <div
            className="flex flex-1 flex-col px-1.5 pb-1 pt-3"
            style={{ transform: "translateZ(20px)" }}
          >
            {categoryName && (
              <span className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
                {categoryName}
              </span>
            )}

            <h3 className="font-display line-clamp-1 text-[15px] font-extrabold leading-tight text-foreground">
              {item.name}
            </h3>

            {item.description && (
              <p className="mt-1 line-clamp-1 text-[11px] leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            )}

            {/* Price */}
            <div className="mt-2 flex flex-wrap items-baseline gap-1.5">
              <span
                className={`font-display text-[17px] font-black ${
                  item.hasDiscount ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
                }`}
              >
                ₹{displayPrice}
              </span>
              {item.hasDiscount && item.originalPrice && (
                <span className="text-xs font-semibold text-muted-foreground line-through">
                  ₹{item.originalPrice}
                </span>
              )}
              {savings > 0 && (
                <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  Save ₹{savings}
                </span>
              )}
            </div>

            {/* Footer actions */}
            <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/70 pt-2.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
                  {isVeg ? (
                    <Leaf className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Flame className="h-3.5 w-3.5 text-orange-500" />
                  )}
                  {isVeg ? "Veg" : "Spicy"}
                </span>

                <button
                  onClick={handleFav}
                  className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground transition-colors hover:text-red-500"
                >
                  <Heart
                    className={`h-3.5 w-3.5 transition-all ${
                      isFav ? "fill-red-500 text-red-500" : ""
                    }`}
                  />
                  Fav
                </button>
              </div>

              {/* Cart control — morphs into a stepper once in the cart */}
              <div onClick={(e) => e.stopPropagation()} style={{ transform: "translateZ(30px)" }}>
                <AnimatePresence mode="popLayout" initial={false}>
                  {cartItem ? (
                    <motion.div
                      key="stepper"
                      layout
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      transition={{ type: "spring", stiffness: 400, damping: 26 }}
                      className="flex items-center gap-0.5 rounded-full bg-gradient-to-b from-primary to-orange-600 p-0.5 shadow-glow-primary"
                    >
                      <button
                        onClick={handleDecrement}
                        aria-label="Decrease quantity"
                        className="flex h-7 w-7 items-center justify-center rounded-full text-white transition-colors hover:bg-white/20"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <motion.span
                        key={cartItem.quantity}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="min-w-[18px] text-center text-[13px] font-black tabular-nums text-white"
                      >
                        {cartItem.quantity}
                      </motion.span>
                      <button
                        onClick={handleIncrement}
                        aria-label="Increase quantity"
                        className="flex h-7 w-7 items-center justify-center rounded-full text-white transition-colors hover:bg-white/20"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.button
                      key="add"
                      layout
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      whileTap={{ scale: 0.88 }}
                      onClick={handleAdd}
                      disabled={soldOut}
                      aria-label={`Add ${item.name} to cart`}
                      className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-b from-primary to-orange-600 text-white shadow-glow-primary transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <ProductDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        productId={item._id}
        initialData={item}
      />
    </>
  );
};

export default ProductCard;
