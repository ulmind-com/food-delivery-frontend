import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Ticket } from "lucide-react";
import { useOffers } from "@/hooks/useOffers";

/**
 * The "Special Offers" tile.
 * Everything shown here is real backend data — an active coupon if the user
 * can see one, otherwise the live free-delivery rule from restaurant settings.
 */
const OfferBanner = ({ className = "" }: { className?: string }) => {
  const { headline, subline, code, to } = useOffers();

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={`perspective-1400 ${className}`}
    >
      <Link
        to={to}
        className="group relative flex h-full min-h-[200px] flex-col justify-center overflow-hidden rounded-[22px] bg-gradient-to-br from-orange-500 via-primary to-amber-500 p-6 shadow-float-lg animate-gradient-pan sm:p-8"
      >
        {/* Liquid-glass orbs drifting behind the copy */}
        <span className="pointer-events-none absolute -right-10 -top-14 h-44 w-44 rounded-full bg-white/25 blur-2xl animate-float-y" />
        <span
          className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-amber-200/30 blur-2xl animate-float-y"
          style={{ animationDelay: "1.4s" }}
        />
        <span className="dot-grid pointer-events-none absolute inset-0 opacity-[0.14]" />

        {/* Sweep on hover */}
        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-[900ms] group-hover:translate-x-full" />

        <div className="relative z-10">
          <span className="liquid-glass-dark inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-white">
            <Ticket className="h-3 w-3" />
            Special Offers
          </span>

          <h3 className="font-display mt-4 text-[24px] font-black leading-[1.15] text-white drop-shadow-sm sm:text-[30px]">
            {headline}
          </h3>

          <p className="mt-2 max-w-sm text-[13px] font-medium leading-relaxed text-white/85">
            {subline}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {code && (
              <span className="liquid-glass-dark rounded-xl border-dashed px-3.5 py-2 text-[13px] font-black uppercase tracking-widest text-white">
                {code}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-[13px] font-extrabold text-orange-600 shadow-lg transition-transform group-hover:translate-x-1">
              Order Now <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default OfferBanner;
