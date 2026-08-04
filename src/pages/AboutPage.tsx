import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Clock,
  MapPin,
  Phone,
  Bike,
  ShieldCheck,
  ChefHat,
  UtensilsCrossed,
  Layers,
  ArrowRight,
  BadgeCheck,
  Truck,
} from "lucide-react";
import { menuApi, vlogApi } from "@/api/axios";
import { useRestaurantStore } from "@/store/useRestaurantStore";
import PageHero from "@/components/PageHero";
import SectionHeading from "@/components/SectionHeading";
import { resolveImageURL } from "@/lib/image-utils";

/** "22:30" → "10:30 PM" */
const pretty = (t?: string) => {
  if (!t || !t.includes(":")) return t || "—";
  const [h, m] = t.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return t;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
};

const AboutPage = () => {
  const restaurant = useRestaurantStore((s) => s.restaurant);

  const { data: menu } = useQuery({
    queryKey: ["menu", "all"],
    queryFn: () => menuApi.getMenu().then((r) => r.data),
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => menuApi.getCategories().then((r) => r.data),
  });

  const { data: vlogs } = useQuery({
    queryKey: ["vlogs", "public"],
    queryFn: () => vlogApi.getPublicVlogs().then((r) => r.data),
  });

  const gallery = (vlogs || []).filter((v: any) => v.mediaType === "IMAGE").slice(0, 6);
  const heroImage = menu?.[0] ? resolveImageURL(menu[0].imageURL || menu[0].image) : undefined;

  const stats = [
    {
      icon: <UtensilsCrossed className="h-5 w-5" />,
      value: menu?.length ?? "—",
      label: "Dishes on the menu",
    },
    {
      icon: <Layers className="h-5 w-5" />,
      value: categories?.length ?? "—",
      label: "Categories",
    },
    {
      icon: <Bike className="h-5 w-5" />,
      value: restaurant?.deliveryRadius ? `${restaurant.deliveryRadius} km` : "—",
      label: "Delivery radius",
    },
    {
      icon: <Truck className="h-5 w-5" />,
      value: restaurant?.freeDeliveryRadius ? `${restaurant.freeDeliveryRadius} km` : "—",
      label: "Free delivery zone",
    },
  ];

  const values = [
    {
      icon: <ChefHat className="h-6 w-6" />,
      title: "Cooked to order",
      body: "Nothing is pre-plated or held under a lamp. Your ticket goes straight to the pass and the pan starts the moment you check out.",
    },
    {
      icon: <Bike className="h-6 w-6" />,
      title: "Short, tracked routes",
      body: restaurant?.chargePerKm
        ? `Free inside ${restaurant.freeDeliveryRadius ?? 0} km, then a flat ₹${restaurant.chargePerKm} per km up to ${restaurant.deliveryRadius ?? 10} km — no surprise fees at checkout.`
        : "We only deliver as far as the food still travels well, and you can watch every step live.",
    },
    {
      icon: <ShieldCheck className="h-6 w-6" />,
      title: "Licensed and inspected",
      body: restaurant?.fssaiLicense
        ? `FSSAI licence ${restaurant.fssaiLicense} — our kitchen is registered, audited and held to the standard that number represents.`
        : "Our kitchen is registered and audited to the food-safety standard our licence requires.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageHero
        eyebrow="About"
        image={heroImage}
        title={
          <>
            A kitchen that cooks like{" "}
            <span className="text-gradient-primary">someone's home</span>
          </>
        }
        subtitle={`${restaurant?.name || "Our kitchen"} runs on a simple rule: cook it fresh, price it fairly, get it to the door while it's still hot.`}
      >
        <div className="flex flex-wrap gap-3">
          <Link
            to="/menu"
            className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-b from-primary to-orange-600 px-6 py-3 text-sm font-extrabold text-white shadow-glow-primary transition-transform hover:scale-105"
          >
            See the menu
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            to="/contact"
            className="liquid-glass-dark inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-white transition-transform hover:scale-105"
          >
            Get in touch
          </Link>
        </div>
      </PageHero>

      {/* ── Live stats ────────────────────────────────────────────────── */}
      <section className="container mx-auto -mt-10 px-4">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6 }}
              className="glass-sheen relative overflow-hidden rounded-[20px] border border-border/70 bg-card p-5 shadow-float transition-shadow hover:shadow-float-lg"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-orange-600 text-white shadow-glow-primary">
                {s.icon}
              </div>
              <p className="font-display text-[26px] font-black leading-none text-foreground">
                {s.value}
              </p>
              <p className="mt-1.5 text-[12px] font-semibold text-muted-foreground">
                {s.label}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Story ─────────────────────────────────────────────────────── */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="perspective-1400"
          >
            <div className="relative overflow-hidden rounded-[28px] shadow-float-lg">
              {menu?.[1] || menu?.[0] ? (
                <img
                  src={resolveImageURL(
                    (menu[1] || menu[0]).imageURL || (menu[1] || menu[0]).image
                  )}
                  alt=""
                  className="aspect-[4/3] w-full object-cover"
                />
              ) : (
                <div className="aspect-[4/3] w-full bg-muted" />
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

              {/* Floating glass card */}
              <div className="liquid-glass absolute bottom-5 left-5 right-5 rounded-2xl p-4 animate-float-y">
                <div className="flex items-center gap-3">
                  {restaurant?.logo ? (
                    <img
                      src={resolveImageURL(restaurant.logo)}
                      alt=""
                      className="h-11 w-11 rounded-xl object-cover shadow"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white">
                      <UtensilsCrossed className="h-5 w-5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-display truncate text-sm font-extrabold text-slate-900 dark:text-white">
                      {restaurant?.name || "Our kitchen"}
                    </p>
                    <p className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 dark:text-white/70">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          restaurant?.isOpen ? "bg-emerald-500" : "bg-red-500"
                        } animate-glow-pulse`}
                      />
                      {restaurant?.isOpen ? "Open now" : "Currently closed"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <div>
            <SectionHeading
              align="left"
              eyebrow="Our story"
              title={
                <>
                  Real food, made by people who{" "}
                  <span className="text-gradient-primary">eat it too</span>
                </>
              }
            />

            <div className="space-y-4 text-[15px] leading-relaxed text-muted-foreground">
              <p>
                {restaurant?.name || "Our kitchen"} started with one stubborn idea — that
                delivery food shouldn't taste like a compromise. So we kept the menu
                small enough to cook properly and the delivery radius short enough that
                nothing arrives tired.
              </p>
              <p>
                Every dish you see on this site is added, priced and switched on by the
                kitchen team itself. When something sells out, it disappears. When the
                chef drops a price, you see it here in the same minute.
              </p>
              {restaurant?.address && (
                <p className="flex items-start gap-2 rounded-2xl border border-border/70 bg-card p-4 text-[14px] font-medium text-foreground shadow-float">
                  <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  {restaurant.address}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Values ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-14">
        <span className="pointer-events-none absolute -right-24 top-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="container relative mx-auto px-4">
          <SectionHeading
            eyebrow="What we stand on"
            title="Three things we refuse to cut corners on"
          />

          <div className="grid gap-4 md:grid-cols-3">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -8 }}
                className="group glass-sheen relative overflow-hidden rounded-[24px] border border-border/70 bg-card p-7 shadow-float transition-shadow hover:shadow-float-lg"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-orange-600 text-white shadow-glow-primary transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                  {v.icon}
                </div>
                <h3 className="font-display text-[18px] font-extrabold text-foreground">
                  {v.title}
                </h3>
                <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted-foreground">
                  {v.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Hours + credentials ───────────────────────────────────────── */}
      <section className="container mx-auto px-4 py-14">
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Hours */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-[24px] border border-border/70 bg-gradient-to-br from-slate-900 to-slate-950 p-7 text-white shadow-float-lg"
          >
            <span className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/25 blur-2xl animate-float-y" />
            <Clock className="relative h-6 w-6 text-primary" />
            <h3 className="font-display relative mt-4 text-[18px] font-extrabold">
              Kitchen hours
            </h3>
            <p className="relative mt-1 text-[13px] text-white/60">
              Set live from the dashboard
            </p>

            <div className="relative mt-5 flex items-baseline gap-2">
              <span className="font-display text-[30px] font-black">
                {pretty(restaurant?.openingTime)}
              </span>
              <span className="text-white/50">—</span>
              <span className="font-display text-[30px] font-black">
                {pretty(restaurant?.closingTime)}
              </span>
            </div>

            <div
              className={`relative mt-5 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12px] font-bold ${
                restaurant?.isOpen
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "bg-red-500/20 text-red-300"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  restaurant?.isOpen ? "bg-emerald-400" : "bg-red-400"
                } animate-glow-pulse`}
              />
              {restaurant?.isOpen ? "Taking orders now" : "Closed right now"}
            </div>
          </motion.div>

          {/* Credentials */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-[24px] border border-border/70 bg-card p-7 shadow-float lg:col-span-2"
          >
            <BadgeCheck className="h-6 w-6 text-primary" />
            <h3 className="font-display mt-4 text-[18px] font-extrabold text-foreground">
              Registered &amp; reachable
            </h3>
            <p className="mt-1 text-[13px] text-muted-foreground">
              The details on every invoice we issue.
            </p>

            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                {
                  icon: <ShieldCheck className="h-4 w-4" />,
                  label: "FSSAI licence",
                  value: restaurant?.fssaiLicense,
                },
                {
                  icon: <BadgeCheck className="h-4 w-4" />,
                  label: "GSTIN",
                  value: restaurant?.gstIn,
                },
                {
                  icon: <Phone className="h-4 w-4" />,
                  label: "Phone",
                  value: restaurant?.mobile,
                  href: restaurant?.mobile ? `tel:${restaurant.mobile}` : undefined,
                },
                {
                  icon: <MapPin className="h-4 w-4" />,
                  label: "Address",
                  value: restaurant?.address,
                },
              ]
                .filter((d) => d.value)
                .map((d) => (
                  <div
                    key={d.label}
                    className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/60 p-4"
                  >
                    <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {d.icon}
                    </span>
                    <div className="min-w-0">
                      <dt className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                        {d.label}
                      </dt>
                      <dd className="mt-0.5 break-words text-[13.5px] font-bold text-foreground">
                        {d.href ? (
                          <a href={d.href} className="hover:text-primary">
                            {d.value}
                          </a>
                        ) : (
                          d.value
                        )}
                      </dd>
                    </div>
                  </div>
                ))}
            </dl>
          </motion.div>
        </div>
      </section>

      {/* ── Gallery from the kitchen ──────────────────────────────────── */}
      {gallery.length > 0 && (
        <section className="container mx-auto px-4 pb-16">
          <SectionHeading
            eyebrow="From our kitchen"
            title="Straight off the pass"
            subtitle="Photos posted by the team — the same gallery you'll find on our vlogs page."
            action={undefined}
          />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {gallery.map((g: any, i: number) => (
              <motion.div
                key={g._id}
                initial={{ opacity: 0, scale: 0.92 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.45 }}
                whileHover={{ y: -6, scale: 1.04 }}
                className="group relative aspect-square overflow-hidden rounded-2xl shadow-float"
              >
                <img
                  src={resolveImageURL(g.thumbnailUrl || g.mediaUrl)}
                  alt={g.title || ""}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                {g.title && (
                  <span className="pointer-events-none absolute bottom-2 left-2 right-2 truncate text-[11px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {g.title}
                  </span>
                )}
              </motion.div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              to="/vlogs"
              className="inline-flex items-center gap-2 rounded-full border border-border/70 px-6 py-3 text-sm font-bold text-foreground transition-colors hover:bg-accent"
            >
              See the full gallery <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
};

export default AboutPage;
