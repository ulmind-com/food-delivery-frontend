import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, ArrowRight } from "lucide-react";
import { menuApi, restaurantApi, vlogApi } from "@/api/axios";
import { useAuthStore } from "@/store/useAuthStore";
import ProductCard from "@/components/ProductCard";
import SectionHeading from "@/components/SectionHeading";
import { SkeletonCard } from "@/components/Skeletons";
import { resolveImageURL } from "@/lib/image-utils";

import DishMarquee from "@/components/home/DishMarquee";
import AboutStory from "@/components/home/AboutStory";
import FeatureBand from "@/components/home/FeatureBand";
import MenuCarousel from "@/components/home/MenuCarousel";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import GalleryGrid, { GalleryItem } from "@/components/home/GalleryGrid";
import OrderCta from "@/components/home/OrderCta";

const PLACEHOLDER_TEXTS = [
  "Search for Biryani...",
  "Search for Pizza...",
  "Search for Burger...",
  "Search for Dosa...",
  "Search for Ice Cream...",
];

import { useRestaurantStore } from "@/store/useRestaurantStore";

import ReviewModal from "@/components/ReviewModal";

const FALLBACK_VIDEOS = ["/burger.mp4", "/icecream.mp4", "/coocking.mp4"];

const Index = () => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [vegOnly, setVegOnly] = useState(false);
  const [placeholder, setPlaceholder] = useState(PLACEHOLDER_TEXTS[0]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [videoVisible, setVideoVisible] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isAuthenticated, isAdmin } = useAuthStore();
  const restaurant = useRestaurantStore((s) => s.restaurant);

  // Debounce search input — only fire API after user stops typing for 400ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const isAdminUser = isAuthenticated() && isAdmin();

  /* ──────────────── Review Prompt Logic ──────────────── */
  const [pendingReviewOrder, setPendingReviewOrder] = useState<any | null>(null);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % PLACEHOLDER_TEXTS.length;
      setPlaceholder(PLACEHOLDER_TEXTS[i]);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isAuthenticated() && !isAdmin()) {
      Promise.all([
        import("@/api/axios").then(m => m.orderApi.getMyOrders()),
        import("@/api/axios").then(m => m.reviewApi.getMyReviews())
      ]).then(([ordersRes, reviewsRes]) => {
        const orders = ordersRes.data.orders || ordersRes.data || [];
        const reviews = reviewsRes.data || [];

        // Create a set of reviewed order IDs
        const reviewedOrderIds = new Set(reviews.map((r: any) =>
          typeof r.order === "object" ? r.order?._id : r.order
        ));

        // Filter for eligible orders: Delivered AND Not Reviewed
        const eligibleOrders = orders
          .filter((o: any) => {
            const status = (o.status || o.orderStatus);
            return status === "DELIVERED" && !reviewedOrderIds.has(o._id);
          })
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Find the first one that hasn't been dismissed locally
        const orderToReview = eligibleOrders.find((o: any) => {
          return !localStorage.getItem(`review_dismissed_${o._id}`);
        });

        if (orderToReview) {
          // Be gentle, wait a few seconds before popping up
          setTimeout(() => setPendingReviewOrder(orderToReview), 2000);
        }
      }).catch(() => { });
    }
  }, [isAuthenticated, isAdmin]);

  const handleCloseReview = () => {
    if (pendingReviewOrder) {
      localStorage.setItem(`review_dismissed_${pendingReviewOrder._id}`, "true");
      setPendingReviewOrder(null);
    }
  };

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => menuApi.getCategories().then((r) => r.data),
  });

  // Fetch admin-configured hero videos
  const { data: heroVideosData } = useQuery({
    queryKey: ["hero-videos"],
    queryFn: () => restaurantApi.getVideos().then((r) => r.data.videos as string[]),
  });

  // Gallery imagery for the story + moments sections
  const { data: vlogs } = useQuery({
    queryKey: ["vlogs", "public"],
    queryFn: () => vlogApi.getPublicVlogs().then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  });

  // Admin-uploaded gallery images (highest priority for home page gallery)
  const { data: galleryImagesData } = useQuery({
    queryKey: ["gallery-images"],
    queryFn: () =>
      restaurantApi.getGallery().then((r) => r.data.images as string[]),
    staleTime: 1000 * 60 * 5,
  });

  // Admin videos are ALWAYS shown first.
  // Empty slots are filled with randomly-picked local fallbacks (stable, no reshuffling on re-render).
  const videos = useMemo(() => {
    const cloudinary = heroVideosData || [];
    const needed = 3 - cloudinary.length;
    if (needed <= 0) return cloudinary.slice(0, 3); // all 3 from cloudinary
    const shuffled = [...FALLBACK_VIDEOS].sort(() => Math.random() - 0.5);
    return [...cloudinary, ...shuffled.slice(0, needed)]; // admin first, fallback fills the rest
  }, [heroVideosData]);

  /* ──────────────── Menu Fetching Logic ──────────────── */
  const { data: rawMenuItems, isLoading: menuLoading } = useQuery({
    queryKey: ["menu", vegOnly, debouncedSearch],
    queryFn: async () => {
      const res = await menuApi.getMenu({
        type: vegOnly ? "Veg" : undefined,
        search: debouncedSearch || undefined,
      });
      return res.data;
    },
  });

  // Client-side filter uses live `search` for instant results (no flash)
  // API call uses debouncedSearch to avoid spamming the server
  const menuItems = search
    ? rawMenuItems?.filter((p: any) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    )
    : rawMenuItems;

  /** Resolve a bare category id into the populated category object. */
  const withCategory = (item: any) => {
    if (typeof item.category === "string" && categories) {
      const found = categories.find((c: any) => c._id === item.category);
      if (found) return { ...item, category: found };
    }
    return item;
  };

  /* ── Imagery for the story + gallery, admin gallery first then vlogs then dish photos ── */
  const galleryItems: GalleryItem[] = useMemo(() => {
    // Priority 1: Admin-uploaded gallery images
    const fromAdmin = (galleryImagesData || []).map((url: string, i: number) => ({
      id: `gallery-${i}`,
      src: url,
      title: undefined,
    }));

    // Priority 2: Vlog images
    const fromVlogs = (vlogs || [])
      .filter((v: any) => v.mediaType === "IMAGE" || v.thumbnailUrl)
      .map((v: any) => ({
        id: v._id,
        src: resolveImageURL(v.mediaType === "IMAGE" ? v.mediaUrl : v.thumbnailUrl),
        title: v.title,
      }));

    // Priority 3: Menu item photos (fallback)
    const fromMenu = (rawMenuItems || [])
      .filter((p: any) => p.imageURL || p.image)
      .map((p: any) => ({
        id: `menu-${p._id}`,
        src: resolveImageURL(p.imageURL || p.image),
        title: p.name,
      }));

    // De-duplicate by src so a dish photo reused in the gallery doesn't repeat
    const seen = new Set<string>();
    return [...fromAdmin, ...fromVlogs, ...fromMenu].filter((g) => {
      if (!g.src || seen.has(g.src)) return false;
      seen.add(g.src);
      return true;
    });
  }, [galleryImagesData, vlogs, rawMenuItems]);

  const categoryNames = (categories || []).map((c: any) => c.name);
  const isSearching = search.trim().length > 0;

  // Admin users go to /admin — this page is customer-only
  if (isAdminUser) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-5xl">👨‍🍳</p>
          <h2 className="mt-4 text-xl font-bold text-foreground">Admin Mode</h2>
          <p className="mt-1 text-sm text-muted-foreground">Use the Dashboard to manage your restaurant</p>
          <a href="/admin" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-transform hover:scale-105">
            Go to Dashboard <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero — Premium Single Restaurant */}
      <section className="relative overflow-hidden">
        {/* Video Background */}
        <video
          ref={videoRef}
          key={currentVideoIndex}
          src={videos[currentVideoIndex]}
          autoPlay
          muted
          playsInline
          onEnded={() => {
            setVideoVisible(false);
            setTimeout(() => {
              setCurrentVideoIndex((prev) => (prev + 1) % videos.length);
              setVideoVisible(true);
            }, 400);
          }}
          className={`absolute top-0 left-0 w-full h-full object-cover object-center z-0 transition-opacity duration-500 ${videoVisible ? "opacity-100" : "opacity-0"
            }`}
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/35 z-[1]" />

        <div className="relative z-10 container mx-auto px-4 py-28 md:py-44 min-h-[55vh] flex flex-col justify-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-semibold uppercase tracking-widest text-primary"
          >
            Welcome to {restaurant?.name || "our kitchen"}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mt-3 text-4xl font-black leading-tight tracking-tight text-white md:text-6xl"
          >
            Crafted with <span className="text-primary">passion</span>,<br />
            served with love.
          </motion.h1>


          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 flex max-w-xl items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-5 py-3 shadow-2xl backdrop-blur-xl"
          >
            <Search className="h-5 w-5 text-white/60" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={placeholder}
              className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/40"
            />
            <button
              onClick={() => setVegOnly(!vegOnly)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${vegOnly
                ? "bg-swiggy-success text-white"
                : "bg-white/10 text-white/80 hover:bg-white/20"
                }`}
            >
              <div className={`h-2.5 w-2.5 rounded-sm border ${vegOnly ? "border-white bg-white" : "border-swiggy-success bg-swiggy-success"}`} />
              Veg
            </button>
          </motion.div>
        </div>
      </section>

      {isSearching ? (
        /* ── Search results take over the page while the hero search is in use ── */
        <section className="container mx-auto px-4 py-12">
          <SectionHeading
            align="left"
            eyebrow="Search"
            title={`Results for "${search}"`}
            action={
              <button
                onClick={() => setSearch("")}
                className="rounded-full border border-border px-4 py-2 text-[13px] font-bold text-foreground transition-colors hover:bg-accent"
              >
                Clear search
              </button>
            }
          />

          {menuLoading ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : menuItems?.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-5xl">🍽️</p>
              <p className="mt-3 text-sm font-semibold text-muted-foreground">
                Nothing matches “{search}”
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {menuItems?.map((item: any) => (
                <ProductCard key={item._id} item={withCategory(item)} />
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          <DishMarquee items={categoryNames} />
          <AboutStory images={galleryItems.slice(0, 2).map((g) => g.src)} />
          <FeatureBand
            dishCount={(rawMenuItems || []).length}
            categoryCount={(categories || []).length}
          />
          <MenuCarousel categories={categories || []} />
          <WhyChooseUs />
          <GalleryGrid items={galleryItems} />
          <OrderCta />
        </>
      )}

      {/* Review Modal Prompt */}
      {pendingReviewOrder && (
        <ReviewModal
          isOpen={!!pendingReviewOrder}
          onClose={handleCloseReview}
          orderId={pendingReviewOrder._id}
          orderDetails={{
            customId: pendingReviewOrder.customId || `#${pendingReviewOrder._id.slice(-6).toUpperCase()}`,
            items: pendingReviewOrder.items
          }}
        />
      )}
    </div>
  );
};

export default Index;
