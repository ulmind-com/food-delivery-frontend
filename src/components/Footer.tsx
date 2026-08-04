import {
  UtensilsCrossed,
  MapPin,
  Heart,
  Phone,
  Clock,
  ArrowRight,
  ShieldCheck,
  BadgeCheck,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useRestaurantStore } from "@/store/useRestaurantStore";
import { useAuthStore } from "@/store/useAuthStore";
import { resolveImageURL } from "@/lib/image-utils";

const pretty = (t?: string) => {
  if (!t || !t.includes(":")) return t || "";
  const [h, m] = t.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return t;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
};

/** Routes that own the whole viewport (dashboards, checkout) hide the footer. */
const HIDDEN_ON = ["/admin", "/checkout", "/pos"];

const Footer = () => {
  const restaurant = useRestaurantStore((s) => s.restaurant);
  const isAuthenticated = useAuthStore((s) => !!s.token);
  const { pathname } = useLocation();

  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;

  const year = new Date().getFullYear();

  // The homepage closes with its own maroon "Order Now" band, so the footer
  // drops its CTA there and wears the matching dark skin instead.
  const isHome = pathname === "/";

  const browse = [
    { label: "Home", to: "/" },
    { label: "Menu", to: "/menu" },
    { label: "About", to: "/about" },
    { label: "Offers", to: "/offers" },
    { label: "Contact", to: "/contact" },
  ];

  const account = isAuthenticated
    ? [
        { label: "My Orders", to: "/my-orders" },
        { label: "My Addresses", to: "/addresses" },
        { label: "Profile", to: "/profile" },
        { label: "Gallery", to: "/vlogs" },
      ]
    : [{ label: "Gallery", to: "/vlogs" }];

  return (
    <footer
      className={`relative mt-auto overflow-hidden border-t ${
        isHome
          ? "footer-band border-primary/20 bg-band"
          : "border-border/60 bg-card"
      }`}
    >
      {/* Ambience */}
      {isHome ? (
        <span className="pointer-events-none absolute -left-40 -top-32 h-[360px] w-[360px] rounded-full border border-primary/10" />
      ) : (
        <>
          <span className="pointer-events-none absolute -left-24 top-0 h-64 w-64 rounded-full bg-primary/8 blur-3xl" />
          <span className="dot-grid pointer-events-none absolute right-8 top-10 h-24 w-24 opacity-30" />
        </>
      )}

      {/* ── Order CTA — hidden on home, which has its own ───────────── */}
      <div className={`container relative mx-auto px-4 pt-12 ${isHome ? "hidden" : ""}`}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex flex-col items-start gap-5 overflow-hidden rounded-[26px] bg-gradient-to-br from-orange-500 via-primary to-amber-500 p-7 text-white shadow-float-lg animate-gradient-pan sm:flex-row sm:items-center sm:justify-between sm:p-9"
        >
          <span className="pointer-events-none absolute -right-10 -top-14 h-48 w-48 rounded-full bg-white/25 blur-2xl animate-float-y" />
          <span className="dot-grid pointer-events-none absolute inset-0 opacity-[0.12]" />

          <div className="relative">
            <h3 className="font-display text-[24px] font-black leading-tight sm:text-[30px]">
              Hungry already?
            </h3>
            <p className="mt-1.5 max-w-md text-[13.5px] text-white/85">
              The kitchen is prepping right now. Pick your plate and we'll take it
              from there.
            </p>
          </div>

          <Link
            to="/menu"
            className="group relative inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-sm font-extrabold text-orange-600 shadow-lg transition-transform hover:scale-105"
          >
            Order Now
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.div>
      </div>

      {/* ── Columns ────────────────────────────────────────────────── */}
      <div className="container relative mx-auto px-4 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2.5">
              {restaurant?.logo ? (
                <img
                  src={resolveImageURL(restaurant.logo)}
                  alt={restaurant.name || "Restaurant logo"}
                  className="h-11 w-11 flex-shrink-0 rounded-xl object-cover shadow-float"
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-orange-600 shadow-glow-primary">
                  <UtensilsCrossed className="h-5 w-5 text-white" />
                </div>
              )}
              <span className="font-display text-[19px] font-extrabold tracking-tight text-foreground">
                {restaurant?.name ?? "Foodie Delight"}
              </span>
            </Link>

            <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
              Fresh food, cooked to order and delivered fast. Every dish, price and
              offer on this site comes straight from our kitchen.
            </p>

            {restaurant?.isOpen !== undefined && (
              <span
                className={`mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-bold ${
                  restaurant.isOpen
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-red-500/10 text-red-600 dark:text-red-400"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    restaurant.isOpen ? "bg-emerald-500" : "bg-red-500"
                  } animate-glow-pulse`}
                />
                {restaurant.isOpen ? "Open now" : "Currently closed"}
              </span>
            )}
          </div>

          {/* Browse */}
          <FooterColumn title="Browse" links={browse} />

          {/* Account */}
          <FooterColumn title="Your account" links={account} />

          {/* Reach us */}
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-muted-foreground">
              Reach us
            </p>
            <ul className="mt-4 space-y-3.5">
              {restaurant?.address && (
                <li className="flex items-start gap-2.5 text-[13px] leading-relaxed text-muted-foreground">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
                  <span>{restaurant.address}</span>
                </li>
              )}
              {restaurant?.mobile && (
                <li>
                  <a
                    href={`tel:${restaurant.mobile}`}
                    className="flex items-center gap-2.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:text-primary"
                  >
                    <Phone className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                    {restaurant.mobile}
                  </a>
                </li>
              )}
              {restaurant?.openingTime && restaurant?.closingTime && (
                <li className="flex items-center gap-2.5 text-[13px] text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                  {pretty(restaurant.openingTime)} – {pretty(restaurant.closingTime)}
                </li>
              )}
            </ul>

            {(restaurant?.fssaiLicense || restaurant?.gstIn) && (
              <div className="mt-5 space-y-1.5">
                {restaurant?.fssaiLicense && (
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                    <ShieldCheck className="h-3 w-3 text-primary" />
                    FSSAI {restaurant.fssaiLicense}
                  </p>
                )}
                {restaurant?.gstIn && (
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                    <BadgeCheck className="h-3 w-3 text-primary" />
                    GSTIN {restaurant.gstIn}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="my-9 border-t border-border/60" />

        {/* Bottom */}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <p className="text-[12px] text-muted-foreground">
            © {year} {restaurant?.name ?? "Foodie Delight"}. All rights reserved.
          </p>

          <a
            href="https://www.ulmind.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-primary"
          >
            <span>Developed with</span>
            <Heart className="h-3 w-3 fill-primary text-primary transition-transform group-hover:scale-125" />
            <span>by</span>
            <span className="font-bold tracking-wide text-foreground transition-colors group-hover:text-primary">
              ULMiND
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
};

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; to: string }[];
}) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-muted-foreground">
        {title}
      </p>
      <nav className="mt-4 flex flex-col gap-2.5">
        {links.map(({ label, to }) => (
          <Link
            key={to}
            to={to}
            className="group flex w-fit items-center gap-1.5 text-[13.5px] font-semibold text-muted-foreground transition-colors hover:text-primary"
          >
            <span className="h-px w-0 bg-primary transition-all duration-300 group-hover:w-3" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export default Footer;
