import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "sonner";
import {
  MapPin,
  Phone,
  Clock,
  MessageCircle,
  Send,
  Navigation,
  Loader2,
  ShieldCheck,
  BadgeCheck,
  ArrowRight,
} from "lucide-react";
import { chatApi } from "@/api/axios";
import { useAuthStore } from "@/store/useAuthStore";
import { useRestaurantStore } from "@/store/useRestaurantStore";
import PageHero from "@/components/PageHero";
import SectionHeading from "@/components/SectionHeading";

// Leaflet's default marker assets break under bundlers — point them at the CDN
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const pretty = (t?: string) => {
  if (!t || !t.includes(":")) return t || "—";
  const [h, m] = t.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return t;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
};

const ContactPage = () => {
  const restaurant = useRestaurantStore((s) => s.restaurant);
  const { isAuthenticated, openAuthModal, user } = useAuthStore();

  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const lat = restaurant?.location?.lat;
  const lng = restaurant?.location?.lng;

  /* ── Map ────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!mapEl.current || lat == null || lng == null || mapRef.current) return;

    const map = L.map(mapEl.current, {
      center: [lat, lng],
      zoom: 15,
      scrollWheelZoom: false,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    L.marker([lat, lng])
      .addTo(map)
      .bindPopup(restaurant?.name || "Our kitchen")
      .openPopup();

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lng, restaurant?.name]);

  /* ── Message the kitchen (real chat API) ────────────────────────── */
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    if (!isAuthenticated()) {
      openAuthModal("login");
      return;
    }

    setSending(true);
    try {
      await chatApi.getOrCreateChat();
      await chatApi.sendMessage({ text: message.trim() });
      setMessage("");
      setSent(true);
      toast.success("Message sent — the kitchen will reply in your chat.");
      setTimeout(() => setSent(false), 5000);
    } catch {
      toast.error("Couldn't send that. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const directionsUrl =
    lat != null && lng != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
      : undefined;

  const contactCards = [
    {
      icon: <Phone className="h-6 w-6" />,
      label: "Call the kitchen",
      value: restaurant?.mobile,
      hint: "Fastest way to change a live order",
      href: restaurant?.mobile ? `tel:${restaurant.mobile}` : undefined,
    },
    {
      icon: <MapPin className="h-6 w-6" />,
      label: "Come to us",
      value: restaurant?.address,
      hint: directionsUrl ? "Open directions in Maps" : undefined,
      href: directionsUrl,
      external: true,
    },
    {
      icon: <Clock className="h-6 w-6" />,
      label: "Open hours",
      value:
        restaurant?.openingTime && restaurant?.closingTime
          ? `${pretty(restaurant.openingTime)} – ${pretty(restaurant.closingTime)}`
          : undefined,
      hint: restaurant?.isOpen ? "Taking orders right now" : "Closed at the moment",
    },
  ].filter((c) => c.value);

  return (
    <div className="min-h-screen bg-background">
      <PageHero
        eyebrow="Contact"
        title={
          <>
            Talk to the people who{" "}
            <span className="text-gradient-primary">cook your food</span>
          </>
        }
        subtitle="No call centre in between. Messages here land in the same inbox the kitchen answers all day."
      >
        <div className="flex flex-wrap gap-3">
          {restaurant?.mobile && (
            <a
              href={`tel:${restaurant.mobile}`}
              className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-b from-primary to-orange-600 px-6 py-3 text-sm font-extrabold text-white shadow-glow-primary transition-transform hover:scale-105"
            >
              <Phone className="h-4 w-4" />
              {restaurant.mobile}
            </a>
          )}
          {directionsUrl && (
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="liquid-glass-dark inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-white transition-transform hover:scale-105"
            >
              <Navigation className="h-4 w-4" />
              Get directions
            </a>
          )}
        </div>
      </PageHero>

      {/* ── Contact cards ─────────────────────────────────────────────── */}
      <section className="container mx-auto -mt-10 px-4">
        <div className="grid gap-4 md:grid-cols-3">
          {contactCards.map((c, i) => {
            const Inner = (
              <>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-orange-600 text-white shadow-glow-primary transition-transform duration-500 group-hover:scale-110">
                  {c.icon}
                </div>
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-primary">
                  {c.label}
                </p>
                <p className="font-display mt-1.5 break-words text-[16px] font-extrabold leading-snug text-foreground">
                  {c.value}
                </p>
                {c.hint && (
                  <p className="mt-1.5 flex items-center gap-1 text-[12px] text-muted-foreground">
                    {c.hint}
                    {c.href && <ArrowRight className="h-3 w-3" />}
                  </p>
                )}
              </>
            );

            return (
              <motion.div
                key={c.label}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.09, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -8 }}
                className="group glass-sheen relative overflow-hidden rounded-[24px] border border-border/70 bg-card p-6 shadow-float transition-shadow hover:shadow-float-lg"
              >
                {c.href ? (
                  <a
                    href={c.href}
                    {...(c.external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className="block"
                  >
                    {Inner}
                  </a>
                ) : (
                  Inner
                )}
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Map + message ─────────────────────────────────────────────── */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          {/* Map */}
          <motion.div
            initial={{ opacity: 0, x: -26 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-[26px] border border-border/70 shadow-float-lg"
          >
            {lat != null && lng != null ? (
              <>
                <div ref={mapEl} className="h-[380px] w-full lg:h-full lg:min-h-[460px]" />

                {/* Floating glass address card */}
                <div className="liquid-glass pointer-events-none absolute bottom-4 left-4 right-4 z-[400] rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-display truncate text-[14px] font-extrabold text-slate-900 dark:text-white">
                        {restaurant?.name || "Our kitchen"}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-slate-700 dark:text-white/70">
                        {restaurant?.address}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-[380px] items-center justify-center bg-muted">
                <p className="text-sm text-muted-foreground">
                  The kitchen hasn't published a map pin yet.
                </p>
              </div>
            )}
          </motion.div>

          {/* Message form */}
          <motion.div
            initial={{ opacity: 0, x: 26 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-[26px] border border-border/70 bg-card p-7 shadow-float-lg sm:p-8"
          >
            <span className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl animate-float-y" />

            <div className="relative">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-orange-600 text-white shadow-glow-primary">
                <MessageCircle className="h-6 w-6" />
              </div>

              <h2 className="font-display text-[24px] font-black leading-tight text-foreground">
                Send us a message
              </h2>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                This goes straight into our live chat. You'll get the reply as a
                notification and in your chat window — no email loop.
              </p>

              <form onSubmit={sendMessage} className="mt-6 space-y-4">
                {isAuthenticated() && (
                  <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/60 p-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-black text-primary">
                      {user?.name?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-bold text-foreground">
                        {user?.name}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                )}

                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  maxLength={1000}
                  placeholder="Tell us what you need — an allergy note, a bulk order, feedback on last night's biryani…"
                  className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-3.5 text-sm leading-relaxed text-foreground outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40"
                />

                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {message.length}/1000
                  </span>

                  <button
                    type="submit"
                    disabled={sending || !message.trim()}
                    className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-b from-primary to-orange-600 px-6 py-3 text-sm font-extrabold text-white shadow-glow-primary transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Sending
                      </>
                    ) : sent ? (
                      <>
                        <ShieldCheck className="h-4 w-4" /> Sent
                      </>
                    ) : (
                      <>
                        {isAuthenticated() ? "Send message" : "Sign in to send"}
                        <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Legal / credentials strip ─────────────────────────────────── */}
      {(restaurant?.fssaiLicense || restaurant?.gstIn) && (
        <section className="container mx-auto px-4 pb-16">
          <SectionHeading
            eyebrow="On the record"
            title="Our registration details"
            subtitle="The same numbers printed on every invoice we issue."
          />

          <div className="mx-auto grid max-w-2xl gap-4 sm:grid-cols-2">
            {[
              {
                icon: <ShieldCheck className="h-5 w-5" />,
                label: "FSSAI licence",
                value: restaurant?.fssaiLicense,
              },
              {
                icon: <BadgeCheck className="h-5 w-5" />,
                label: "GSTIN",
                value: restaurant?.gstIn,
              },
            ]
              .filter((d) => d.value)
              .map((d, i) => (
                <motion.div
                  key={d.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.45 }}
                  className="flex items-center gap-4 rounded-[20px] border border-border/70 bg-card p-5 shadow-float"
                >
                  <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    {d.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                      {d.label}
                    </p>
                    <p className="font-display mt-0.5 break-words text-[15px] font-extrabold text-foreground">
                      {d.value}
                    </p>
                  </div>
                </motion.div>
              ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ContactPage;
