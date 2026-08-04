import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, UtensilsCrossed } from "lucide-react";
import { useRestaurantStore } from "@/store/useRestaurantStore";
import { resolveImageURL } from "@/lib/image-utils";

interface AboutStoryProps {
  /** Real photography — gallery images first, menu shots as backup. */
  images: string[];
}

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <span className="flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.22em] text-primary">
    <span className="h-px w-8 bg-primary" />
    {children}
  </span>
);

/**
 * "Good Food, Good Mood." — the story block.
 * Arch-topped photography on the left, copy on the right, all of it driven by
 * the restaurant record and the admin's gallery.
 */
const AboutStory = ({ images }: AboutStoryProps) => {
  const restaurant = useRestaurantStore((s) => s.restaurant);
  const name = restaurant?.name || "our kitchen";

  const [hero, second] = images;

  return (
    <section className="relative overflow-hidden bg-surface-alt py-16 sm:py-24">
      {/* Faint gold rings, like the reference */}
      <span className="pointer-events-none absolute -right-40 -top-40 h-[420px] w-[420px] rounded-full border border-primary/25" />
      <span className="pointer-events-none absolute -bottom-56 -left-32 h-[380px] w-[380px] rounded-full border border-primary/20" />

      <div className="container relative mx-auto px-4">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* ── Photography ───────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="grid grid-cols-5 gap-4">
              {/* Arch — rounded at the top like a doorway */}
              <div className="col-span-3 overflow-hidden rounded-t-[999px] rounded-b-[28px] bg-muted shadow-[0_24px_60px_-24px_rgba(36,24,19,0.45)]">
                {hero ? (
                  <img
                    src={hero}
                    alt={`Inside ${name}`}
                    loading="lazy"
                    className="h-[300px] w-full object-cover transition-transform duration-[1200ms] hover:scale-105 sm:h-[440px]"
                  />
                ) : (
                  <div className="flex h-[300px] w-full items-center justify-center sm:h-[440px]">
                    <UtensilsCrossed className="h-10 w-10 text-primary/50" />
                  </div>
                )}
              </div>

              <div className="col-span-2 flex flex-col justify-center">
                {second && (
                  <div className="overflow-hidden rounded-[24px] bg-muted shadow-[0_18px_44px_-20px_rgba(36,24,19,0.4)]">
                    <img
                      src={second}
                      alt={name}
                      loading="lazy"
                      className="h-[190px] w-full object-cover transition-transform duration-[1200ms] hover:scale-105 sm:h-[260px]"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Circular seal overlapping the arch */}
            <div className="absolute -bottom-4 left-2 flex h-[130px] w-[130px] flex-col items-center justify-center gap-1.5 rounded-full bg-band px-4 text-center shadow-[0_18px_40px_-12px_rgba(36,24,19,0.6)] sm:-bottom-6 sm:left-6 sm:h-[150px] sm:w-[150px]">
              <UtensilsCrossed className="h-5 w-5 text-primary" />
              <span className="font-serif text-[12px] font-medium italic leading-tight text-primary sm:text-[13px]">
                Homestyle recipes,
                <br />
                restaurant hospitality
              </span>
            </div>
          </motion.div>

          {/* ── Copy ──────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="lg:pl-4"
          >
            <Eyebrow>A warm welcome</Eyebrow>

            <h2 className="mt-5 font-serif text-[38px] font-bold leading-[1.06] tracking-tight text-foreground sm:text-[54px]">
              Good Food,
              <br />
              <span className="italic text-primary">Good Mood.</span>
            </h2>

            <UtensilsCrossed className="mt-5 h-6 w-6 text-primary" />

            <p className="mt-6 max-w-lg font-body text-[15px] leading-[1.85] text-muted-foreground">
              At {name}, every plate leaves the pass the moment it's ready — never
              early, never sitting under a lamp. Our kitchen cooks to order so the
              flavour reaches you exactly as it left the pan.
            </p>

            <p className="mt-4 max-w-lg font-body text-[15px] leading-[1.85] text-muted-foreground">
              Whether it's a weeknight dinner, a family get-together or a late
              craving, we're here to make it worth the wait.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/menu"
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 font-body text-[14px] font-semibold text-foreground shadow-[0_14px_30px_-12px_rgba(217,168,58,0.9)] transition-all hover:scale-[1.03] hover:bg-primary hover:text-white"
              >
                Explore Menu
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-foreground/25 px-7 py-3.5 font-body text-[14px] font-semibold text-foreground transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
              >
                Visit Us
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutStory;
