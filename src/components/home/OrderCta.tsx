import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Phone, Clock, MapPin } from "lucide-react";
import { useRestaurantStore } from "@/store/useRestaurantStore";

/**
 * Closing band — the big "Order Now" that drops the customer onto the menu page,
 * plus the restaurant's real contact details.
 */
const OrderCta = () => {
  const restaurant = useRestaurantStore((s) => s.restaurant);

  const details = [
    restaurant?.mobile && { icon: Phone, label: restaurant.mobile, href: `tel:${restaurant.mobile.replace(/\s/g, "")}` },
    restaurant?.openingTime &&
      restaurant?.closingTime && {
        icon: Clock,
        label: `${restaurant.openingTime} – ${restaurant.closingTime}`,
        href: undefined,
      },
    restaurant?.address && { icon: MapPin, label: restaurant.address, href: undefined },
  ].filter(Boolean) as { icon: typeof Phone; label: string; href?: string }[];

  return (
    <section className="relative overflow-hidden bg-band py-16 sm:py-20">
      <span className="pointer-events-none absolute -right-32 -top-24 h-[340px] w-[340px] rounded-full border border-primary/20" />
      <span className="pointer-events-none absolute -bottom-32 -left-24 h-[300px] w-[300px] rounded-full border border-primary/15" />

      <div className="container relative mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-70px" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center text-center"
        >
          <span className="flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.22em] text-primary">
            <span className="h-px w-8 bg-primary/70" />
            Hungry already?
            <span className="h-px w-8 bg-primary/70" />
          </span>

          <h2 className="mt-5 max-w-2xl font-serif text-[34px] font-bold leading-[1.12] text-band-foreground sm:text-[48px]">
            Your table is set.
            <br />
            <span className="italic text-primary">Let's get you fed.</span>
          </h2>

          <Link
            to="/menu"
            className="group mt-9 inline-flex items-center gap-2.5 rounded-full bg-primary px-9 py-4 font-body text-[15px] font-semibold text-foreground shadow-[0_18px_40px_-14px_rgba(217,168,58,0.85)] transition-all hover:scale-[1.04] hover:bg-surface-alt"
          >
            Order Now
            <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1" style={{ height: 18, width: 18 }} />
          </Link>

          {details.length > 0 && (
            <div className="mt-11 flex flex-col items-center gap-4 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-8">
              {details.map(({ icon: Icon, label, href }) => {
                const content = (
                  <>
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/35">
                      <Icon className="h-4 w-4 text-primary" />
                    </span>
                    <span className="max-w-[280px] font-body text-[14px] leading-snug text-band-foreground/85">
                      {label}
                    </span>
                  </>
                );

                return href ? (
                  <a
                    key={label}
                    href={href}
                    className="flex items-center gap-3 transition-opacity hover:opacity-80"
                  >
                    {content}
                  </a>
                ) : (
                  <div key={label} className="flex items-center gap-3">
                    {content}
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default OrderCta;
