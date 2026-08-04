import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ZoomIn, X, ArrowRight } from "lucide-react";
import { resolveImageURL } from "@/lib/image-utils";

export interface GalleryItem {
  id: string;
  src: string;
  title?: string;
}

interface GalleryGridProps {
  items: GalleryItem[];
}

/**
 * "Our Moments" — a bento grid of the admin's gallery images with a lightbox.
 * Falls back to nothing at all when the gallery is empty, rather than showing
 * placeholder art.
 */
const GalleryGrid = ({ items }: GalleryGridProps) => {
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null);

  if (items.length === 0) return null;

  // Bento rhythm: first tile is the wide hero, the next two stack beside it
  const spanFor = (i: number) => {
    const pattern = ["sm:col-span-2 sm:row-span-2", "", "", "sm:col-span-2", "", ""];
    return pattern[i % pattern.length];
  };

  return (
    <section className="relative overflow-hidden bg-surface-alt pb-20 sm:pb-24">
      <div className="container relative mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mb-10 flex flex-col items-center text-center"
        >
          <span className="flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.22em] text-primary">
            <span className="h-px w-8 bg-primary" />
            Our Moments
            <span className="h-px w-8 bg-primary" />
          </span>
          <h2 className="mt-4 font-serif text-[34px] font-bold leading-tight text-foreground sm:text-[46px]">
            Gallery
          </h2>
          <p className="mt-3 max-w-md font-body text-[15px] leading-relaxed text-muted-foreground">
            A glimpse of the flavours, faces and moments from our kitchen.
          </p>
        </motion.div>

        <div className="grid auto-rows-[180px] grid-cols-2 gap-4 sm:auto-rows-[200px] sm:grid-cols-4">
          {items.slice(0, 6).map((item, i) => (
            <motion.button
              key={item.id}
              onClick={() => setLightbox(item)}
              initial={{ opacity: 0, scale: 0.94 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: Math.min(i, 5) * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className={`group relative overflow-hidden rounded-[20px] bg-muted shadow-[0_16px_40px_-22px_rgba(36,24,19,0.5)] ${spanFor(i)}`}
            >
              <img
                src={item.src}
                alt={item.title || "Gallery image"}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-[1100ms] group-hover:scale-110"
              />
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-surface-alt/90 text-foreground opacity-0 transition-all duration-300 group-hover:opacity-100">
                <ZoomIn className="h-4 w-4" />
              </span>
              {item.title && (
                <span className="pointer-events-none absolute bottom-3 left-4 right-4 truncate text-left font-serif text-[15px] font-semibold text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  {item.title}
                </span>
              )}
            </motion.button>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            to="/vlogs"
            className="group inline-flex items-center gap-2 rounded-full border border-foreground/25 px-7 py-3.5 font-body text-[14px] font-semibold text-foreground transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
          >
            View full gallery
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          >
            <button
              onClick={() => setLightbox(null)}
              aria-label="Close image"
              className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
            <motion.img
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              src={lightbox.src}
              alt={lightbox.title || "Gallery image"}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[85vh] max-w-[92vw] rounded-[20px] object-contain shadow-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default GalleryGrid;
