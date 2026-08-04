import { useEffect, useRef, useState } from "react";
import {
  User,
  MapPin,
  ChevronDown,
  LayoutDashboard,
  UtensilsCrossed,
  Package,
  Navigation,
  ShoppingBag,
  Film,
  Search,
  Menu as MenuIcon,
  X,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";
import { useLocationStore } from "@/store/useLocationStore";
import { useCartStore } from "@/store/useCartStore";
import { Link, NavLink as RouterNavLink, useNavigate, useLocation } from "react-router-dom";
import { useRestaurantStore } from "@/store/useRestaurantStore";
import { ThemeToggle } from "./ThemeToggle";
import { resolveImageURL } from "@/lib/image-utils";

const PRIMARY_LINKS = [
  { label: "Home", to: "/" },
  { label: "Menu", to: "/menu" },
  { label: "About", to: "/about" },
  { label: "Offers", to: "/offers" },
  { label: "Contact", to: "/contact" },
];

const Navbar = () => {
  const { user, openAuthModal, isAuthenticated, isAdmin } = useAuthStore();
  const { selectedAddress } = useLocationStore();
  const { items, toggleCart } = useCartStore();
  const restaurant = useRestaurantStore((s) => s.restaurant);
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const isCustomer = isAuthenticated() && !isAdmin();
  const isAdminUser = isAuthenticated() && isAdmin();
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile sheet whenever the route changes
  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchTerm.trim();
    navigate(q ? `/menu?q=${encodeURIComponent(q)}` : "/menu");
    setSearchOpen(false);
    setSearchTerm("");
  };

  /* ── Location display text ─────────────────────────────────────────── */
  const locationLabel = selectedAddress
    ? selectedAddress.type === "HOME"
      ? "Home"
      : selectedAddress.type === "WORK"
        ? "Work"
        : selectedAddress.addressLine1?.split(",")[0]?.trim() || "My Location"
    : "Add Address";

  const locationSub = selectedAddress
    ? [selectedAddress.city, selectedAddress.state].filter(Boolean).join(", ")
    : "Set delivery location";

  const Logo = (
    <Link to="/" className="flex min-w-0 items-center gap-2.5">
      {restaurant?.logo ? (
        <img
          src={resolveImageURL(restaurant.logo)}
          alt={restaurant.name || "Restaurant logo"}
          className="h-10 w-10 flex-shrink-0 rounded-xl object-cover shadow-float ring-1 ring-black/5"
        />
      ) : (
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-orange-600 shadow-glow-primary">
          <UtensilsCrossed className="h-5 w-5 text-white" />
        </div>
      )}
      <span className="font-display hidden truncate text-[17px] font-extrabold leading-none tracking-tight text-foreground sm:block sm:max-w-[190px] lg:max-w-none">
        {restaurant?.name || "Foodie"}
      </span>
    </Link>
  );

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? // Near-opaque once scrolled — the homepage's maroon bands showed
              // through a translucent bar and turned it pink.
              "border-b border-border/60 bg-background/95 shadow-float backdrop-blur-2xl backdrop-saturate-150"
            : "border-b border-transparent bg-background/60 backdrop-blur-xl"
        }`}
      >
        <div className="mx-auto flex h-[68px] max-w-screen-2xl items-center gap-3 px-4 sm:px-6">
          {/* ── LEFT: logo ─────────────────────────────────────────────── */}
          {Logo}

          {/* ── CENTER: primary nav ────────────────────────────────────── */}
          <nav className="mx-auto hidden items-center gap-1 lg:flex">
            {PRIMARY_LINKS.map((link) => (
              <RouterNavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
                className={({ isActive }) =>
                  `relative rounded-full px-4 py-2 text-[14px] font-bold transition-colors ${
                    isActive ? "text-primary" : "text-foreground/75 hover:text-foreground"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {link.label}
                    {isActive && (
                      <motion.span
                        layoutId="nav-underline"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                        className="absolute inset-x-3 -bottom-0.5 h-[3px] rounded-full bg-gradient-to-r from-primary to-orange-500"
                      />
                    )}
                  </>
                )}
              </RouterNavLink>
            ))}

            {isAdminUser && (
              <RouterNavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-full px-4 py-2 text-[14px] font-bold transition-colors ${
                    isActive ? "text-primary" : "text-foreground/75 hover:text-foreground"
                  }`
                }
              >
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </RouterNavLink>
            )}
          </nav>

          <div className="flex-1 lg:hidden" />

          {/* ── RIGHT: actions ─────────────────────────────────────────── */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Delivery location — customers only, desktop */}
            {isCustomer && (
              <button
                onClick={() => navigate("/addresses")}
                className="group mr-1 hidden min-w-0 max-w-[200px] items-center gap-2 rounded-full border border-border/70 py-1.5 pl-1.5 pr-3 text-left transition-colors hover:bg-accent xl:flex"
              >
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
                  {selectedAddress ? (
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <Navigation className="h-3.5 w-3.5 text-primary" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-0.5">
                    <span className="max-w-[110px] truncate text-[12px] font-bold leading-tight text-foreground">
                      {locationLabel}
                    </span>
                    <ChevronDown className="h-3 w-3 flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-y-0.5" />
                  </span>
                  <span className="block max-w-[110px] truncate text-[10px] leading-tight text-muted-foreground">
                    {locationSub}
                  </span>
                </span>
              </button>
            )}

            {/* Search */}
            <button
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Search the menu"
              className="flex h-10 w-10 items-center justify-center rounded-full text-foreground/80 transition-all hover:bg-accent hover:text-foreground"
            >
              {searchOpen ? <X className="h-[18px] w-[18px]" /> : <Search className="h-[18px] w-[18px]" />}
            </button>

            {/* Cart */}
            {!isAdminUser && (
              <button
                onClick={toggleCart}
                aria-label={`Cart, ${totalItems} items`}
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-foreground/80 transition-all hover:bg-accent hover:text-foreground"
              >
                <ShoppingBag className="h-[18px] w-[18px]" />
                <AnimatePresence>
                  {totalItems > 0 && (
                    <motion.span
                      key={totalItems}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 20 }}
                      className="absolute right-1 top-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-gradient-to-b from-primary to-orange-600 px-1 text-[10px] font-black text-white shadow-glow-primary"
                    >
                      {totalItems > 9 ? "9+" : totalItems}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            )}

            <ThemeToggle />

            {/* Account */}
            {isAuthenticated() ? (
              <Link
                to="/profile"
                className="ml-0.5 flex items-center gap-2 rounded-full border border-border/70 py-1 pl-1 pr-3 text-sm font-semibold transition-colors hover:bg-accent"
              >
                <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary/15 to-orange-500/15 text-xs font-black text-primary">
                  {user?.profileImage ? (
                    <img src={resolveImageURL(user.profileImage)} alt="" className="h-full w-full object-cover" />
                  ) : (
                    user?.name?.charAt(0)?.toUpperCase() || <User className="h-3.5 w-3.5" />
                  )}
                </span>
                <span className="hidden max-w-[80px] truncate md:inline">
                  {user?.name?.split(" ")[0] || "Account"}
                </span>
              </Link>
            ) : (
              <button
                onClick={() => openAuthModal("login")}
                className="ml-0.5 flex items-center gap-1.5 rounded-full border border-border/70 px-3 py-2 text-sm font-bold transition-colors hover:bg-accent"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}

            {/* Order Now CTA */}
            <Link
              to="/menu"
              className="group relative ml-1 hidden overflow-hidden rounded-full bg-gradient-to-b from-primary to-orange-600 px-5 py-2.5 text-sm font-extrabold text-white shadow-glow-primary transition-transform hover:scale-105 active:scale-95 md:inline-flex md:items-center md:gap-1.5"
            >
              <span className="relative z-10">Order Now</span>
              <ArrowRight className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </Link>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent lg:hidden"
            >
              <MenuIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ── Expanding search bar ─────────────────────────────────────── */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-border/60"
            >
              <form onSubmit={submitSearch} className="mx-auto max-w-screen-2xl px-4 py-3 sm:px-6">
                <div className="liquid-glass flex items-center gap-3 rounded-2xl px-4 py-3">
                  <Search className="h-4.5 w-4.5 flex-shrink-0 text-muted-foreground" style={{ height: 18, width: 18 }} />
                  <input
                    ref={searchRef}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search for biryani, pizza, rolls…"
                    className="flex-1 bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-gradient-to-b from-primary to-orange-600 px-4 py-1.5 text-xs font-extrabold text-white shadow-glow-primary transition-transform hover:scale-105"
                  >
                    Search
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Mobile slide-out ──────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed right-0 top-0 z-[61] flex h-full w-[80%] max-w-[320px] flex-col border-l border-border/60 bg-background/95 backdrop-blur-2xl lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
                <span className="font-display text-base font-extrabold">Menu</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-accent"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex flex-col gap-1 p-4">
                {PRIMARY_LINKS.map((link, i) => (
                  <motion.div
                    key={link.to}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.05 }}
                  >
                    <RouterNavLink
                      to={link.to}
                      end={link.to === "/"}
                      className={({ isActive }) =>
                        `flex items-center justify-between rounded-2xl px-4 py-3 text-[15px] font-bold transition-colors ${
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-accent"
                        }`
                      }
                    >
                      {link.label}
                      <ArrowRight className="h-4 w-4 opacity-50" />
                    </RouterNavLink>
                  </motion.div>
                ))}

                <div className="my-2 border-t border-border/60" />

                {isAuthenticated() && !isAdminUser && (
                  <>
                    <MobileLink to="/my-orders" icon={<Package className="h-4 w-4" />} label="My Orders" />
                    <MobileLink to="/addresses" icon={<MapPin className="h-4 w-4" />} label="Addresses" />
                  </>
                )}
                {isAdminUser && (
                  <MobileLink to="/admin" icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" />
                )}
                <MobileLink to="/vlogs" icon={<Film className="h-4 w-4" />} label="Gallery" />
              </nav>

              <div className="mt-auto p-4">
                <Link
                  to="/menu"
                  className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-primary to-orange-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-glow-primary"
                >
                  Order Now <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

function MobileLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-semibold text-foreground transition-colors hover:bg-accent"
    >
      {icon}
      {label}
    </Link>
  );
}

export default Navbar;
