import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

interface PageHeroProps {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: string;
  /** Optional background photo — usually a real dish from the menu. */
  image?: string;
  children?: React.ReactNode;
}

/**
 * Shared banner for the Menu / About / Offers / Contact pages.
 * Deep gradient + drifting light orbs + a liquid-glass breadcrumb, so every
 * inner page opens with the same premium beat as the home hero.
 */
const PageHero = ({ eyebrow, title, subtitle, image, children }: PageHeroProps) => (
  <section className="relative overflow-hidden bg-slate-950">
    {image && (
      <img
        src={image}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full scale-105 object-cover opacity-35 blur-[2px]"
      />
    )}

    {/* Gradient wash */}
    <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/85 to-orange-950/60" />

    {/* Drifting orbs */}
    <span className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary/25 blur-3xl animate-float-y" />
    <span
      className="pointer-events-none absolute -bottom-10 -right-16 h-64 w-64 rounded-full bg-amber-400/20 blur-3xl animate-float-y"
      style={{ animationDelay: "2s" }}
    />
    <span className="dot-grid pointer-events-none absolute inset-0 opacity-[0.08]" />

    <div className="container relative z-10 mx-auto px-4 py-16 sm:py-20">
      <motion.nav
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="liquid-glass-dark mb-6 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold text-white/85"
      >
        <Link to="/" className="transition-colors hover:text-white">
          Home
        </Link>
        <ChevronRight className="h-3 w-3 opacity-60" />
        <span className="text-white">{eyebrow || title}</span>
      </motion.nav>

      <motion.h1
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="font-display max-w-3xl text-[34px] font-black leading-[1.08] tracking-tight text-white sm:text-[52px]"
      >
        {title}
      </motion.h1>

      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.5 }}
          className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/70"
        >
          {subtitle}
        </motion.p>
      )}

      {children && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24, duration: 0.5 }}
          className="mt-7"
        >
          {children}
        </motion.div>
      )}
    </div>

    {/* Soft blend into the page background */}
    <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-background to-transparent" />
  </section>
);

export default PageHero;
