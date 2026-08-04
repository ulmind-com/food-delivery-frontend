import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, UtensilsCrossed } from "lucide-react";
import { resolveImageURL } from "@/lib/image-utils";

interface Category {
  _id: string;
  name: string;
  imageURL?: string;
  image?: string;
}

interface MenuCarouselProps {
  categories: Category[];
}

/**
 * "Explore Our Menu" — a horizontal rail of the admin's real categories.
 * Tapping a card opens the menu page already filtered to that category.
 */
const MenuCarousel = ({ categories }: MenuCarouselProps) => {
  const navigate = useNavigate();
  const railRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);

  const measure = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    const total = el.scrollWidth - el.clientWidth;
    setPages(total > 4 ? Math.ceil(el.scrollWidth / el.clientWidth) : 1);
    setPage(total > 0 ? Math.round((el.scrollLeft / total) * Math.max(1, Math.ceil(el.scrollWidth / el.clientWidth) - 1)) : 0);
  }, []);

  useEffect(() => {
    measure();
    const el = railRef.current;
    if (!el) return;
    el.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      el.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [measure, categories.length]);

  const scrollBy = (dir: -1 | 1) => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(280, el.clientWidth * 0.8), behavior: "smooth" });
  };

  if (categories.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-surface-alt py-16 sm:py-20">
      <span className="pointer-events-none absolute -left-44 top-10 h-[360px] w-[360px] rounded-full border border-primary/20" />

      <div className="container relative mx-auto px-4">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mb-10 flex flex-col items-center text-center"
        >
          <span className="flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.22em] text-primary">
            <span className="h-px w-8 bg-primary" />
            Our Menu
            <span className="h-px w-8 bg-primary" />
          </span>
          <h2 className="mt-4 font-serif text-[34px] font-bold leading-tight text-foreground sm:text-[46px]">
            Explore Our Menu
          </h2>
          <span className="mt-4 h-[3px] w-16 rounded-full bg-primary" />
        </motion.div>

        {/* Rail */}
        <div className="relative">
          <button
            onClick={() => scrollBy(-1)}
            aria-label="Previous categories"
            className="absolute -left-2 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white text-foreground shadow-[0_10px_26px_-10px_rgba(36,24,19,0.4)] transition-all hover:scale-110 hover:bg-primary hover:text-white sm:flex lg:-left-5"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div
            ref={railRef}
            className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-4 pb-2 no-scrollbar"
          >
            {categories.map((cat, i) => {
              const img = resolveImageURL(cat.imageURL || cat.image);
              return (
                <motion.button
                  key={cat._id}
                  onClick={() => navigate(`/menu?category=${cat._id}`)}
                  initial={{ opacity: 0, y: 26 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: Math.min(i, 5) * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -8 }}
                  className="group w-[210px] flex-shrink-0 snap-start overflow-hidden rounded-[22px] bg-white text-left shadow-[0_16px_40px_-20px_rgba(36,24,19,0.45)] transition-shadow duration-300 hover:shadow-[0_28px_60px_-22px_rgba(36,24,19,0.55)] sm:w-[240px]"
                >
                  <div className="relative h-[190px] w-full overflow-hidden bg-muted sm:h-[210px]">
                    {img ? (
                      <img
                        src={img}
                        alt={cat.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-[900ms] group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <UtensilsCrossed className="h-8 w-8 text-primary/50" />
                      </div>
                    )}
                    <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  </div>

                  <div className="px-4 py-4 text-center">
                    <span className="font-serif text-[18px] font-semibold text-foreground transition-colors group-hover:text-primary">
                      {cat.name}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>

          <button
            onClick={() => scrollBy(1)}
            aria-label="Next categories"
            className="absolute -right-2 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white text-foreground shadow-[0_10px_26px_-10px_rgba(36,24,19,0.4)] transition-all hover:scale-110 hover:bg-primary hover:text-white sm:flex lg:-right-5"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Pagination dots */}
        {pages > 1 && (
          <div className="mt-7 flex items-center justify-center gap-2">
            {Array.from({ length: pages }).map((_, i) => (
              <span
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === page ? "w-6 bg-primary" : "w-2 bg-foreground/20"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default MenuCarousel;
