import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { ChefHat, Leaf, Users, ShieldCheck } from "lucide-react";
import { useRestaurantStore } from "@/store/useRestaurantStore";

interface FeatureBandProps {
  dishCount: number;
  categoryCount: number;
}

const FEATURES = [
  { icon: ChefHat, title: "Multi Cuisine", body: "A variety of delicious dishes" },
  { icon: Leaf, title: "Fresh Ingredients", body: "Quality you can taste" },
  { icon: Users, title: "Family Friendly", body: "A perfect place for everyone" },
  { icon: ShieldCheck, title: "Hygienic & Safe", body: "Your health is our priority" },
];

/** Counts up to `value` the first time it scrolls into view. */
const Counter = ({ value, suffix = "" }: { value: number; suffix?: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (value <= 0) {
      setShown(0);
      return;
    }

    // Respect reduced motion — and never leave a real figure stuck on zero
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setShown(value);
      return;
    }

    const duration = 1400;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // easeOutCubic — fast then settles, like a counter coming to rest
      setShown(Math.round(value * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return (
    <span ref={ref} className="font-serif text-[44px] font-bold leading-none text-primary sm:text-[56px]">
      {shown}
      <span className="text-[30px] sm:text-[36px]">{suffix}</span>
    </span>
  );
};

/**
 * The maroon band: four promises, then four live numbers pulled from the
 * kitchen's own data — nothing here is a made-up marketing figure.
 */
const FeatureBand = ({ dishCount, categoryCount }: FeatureBandProps) => {
  const restaurant = useRestaurantStore((s) => s.restaurant);

  const stats = [
    { value: dishCount, suffix: "+", label: "Dishes on the menu" },
    { value: categoryCount, suffix: "", label: "Cuisine categories" },
    { value: restaurant?.deliveryRadius ?? 0, suffix: " km", label: "Delivery radius" },
    { value: restaurant?.freeDeliveryRadius ?? 0, suffix: " km", label: "Free delivery zone" },
  ];

  return (
    <section className="bg-band">
      {/* ── Promises ─────────────────────────────────────────────────── */}
      <div className="container mx-auto px-4 py-14 sm:py-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.09, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="group rounded-[20px] border border-primary/25 bg-white/[0.03] px-6 py-8 text-center transition-colors duration-300 hover:border-primary/60 hover:bg-white/[0.06]"
            >
              <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/40 transition-transform duration-300 group-hover:scale-110">
                <f.icon className="h-6 w-6 text-primary" strokeWidth={1.6} />
              </span>
              <h3 className="font-serif text-[20px] font-bold text-band-foreground">{f.title}</h3>
              <p className="mt-1.5 font-body text-[14px] text-band-foreground/65">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Live numbers ─────────────────────────────────────────────── */}
      <div className="container mx-auto px-4 pb-16">
        <div className="grid divide-primary/20 border-y border-primary/20 sm:grid-cols-2 sm:divide-x lg:grid-cols-4">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`flex flex-col items-center gap-2.5 px-4 py-10 ${
                i < stats.length - 1 ? "border-b border-primary/20 sm:border-b-0" : ""
              } ${i === 1 ? "sm:border-b sm:border-primary/20 lg:border-b-0" : ""}`}
            >
              <Counter value={s.value} suffix={s.suffix} />
              <span className="font-body text-[13px] uppercase tracking-[0.16em] text-band-foreground/80">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureBand;
