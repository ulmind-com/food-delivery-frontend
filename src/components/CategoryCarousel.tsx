import { motion } from "framer-motion";
import { UtensilsCrossed } from "lucide-react";
import { resolveImageURL } from "@/lib/image-utils";

interface Category {
  _id: string;
  name: string;
  image?: string | null;
  imageURL?: string;
}

interface CategoryCarouselProps {
  categories: Category[];
  selected: string;
  onSelect: (id: string) => void;
}

const CategoryCarousel = ({ categories, selected, onSelect }: CategoryCarouselProps) => {
  const combined: Category[] = [{ _id: "", name: "All", image: null }, ...categories];

  return (
    <div className="perspective-1000 -mx-4 overflow-x-auto px-4 no-scrollbar">
      <div className="flex min-w-max items-start justify-start gap-6 py-2 sm:justify-center sm:gap-10">
        {combined.map((item, i) => {
          const isSelected = selected === item._id;
          const img = item.imageURL || item.image;

          return (
            <motion.button
              key={item._id || "all"}
              onClick={() => onSelect(item._id)}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -8 }}
              whileTap={{ scale: 0.94 }}
              className="group flex flex-shrink-0 flex-col items-center gap-3"
            >
              <div className="preserve-3d relative">
                {/* Halo that lights up for the active category */}
                <div
                  className={`absolute -inset-2 rounded-full bg-gradient-to-tr from-primary/50 via-orange-400/30 to-amber-300/40 blur-lg transition-opacity duration-500 ${
                    isSelected ? "opacity-100 animate-glow-pulse" : "opacity-0 group-hover:opacity-70"
                  }`}
                />

                {/* The plate */}
                <div
                  className={`relative flex h-[74px] w-[74px] items-center justify-center overflow-hidden rounded-full bg-gradient-to-b from-slate-800 to-slate-950 shadow-float transition-all duration-400 group-hover:shadow-float-lg sm:h-[86px] sm:w-[86px] ${
                    isSelected
                      ? "ring-[3px] ring-primary ring-offset-2 ring-offset-background"
                      : "ring-1 ring-black/10 dark:ring-white/10"
                  }`}
                >
                  {img ? (
                    <img
                      src={resolveImageURL(img)}
                      alt={item.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.18]"
                    />
                  ) : (
                    <UtensilsCrossed className="h-7 w-7 text-white/90" />
                  )}

                  {/* Glass dome — specular highlight across the top of the plate */}
                  <span className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/35 via-transparent to-black/25" />
                  <span className="pointer-events-none absolute -left-1/4 -top-1/3 h-1/2 w-3/4 rotate-[-18deg] rounded-full bg-white/25 blur-md transition-opacity duration-500 group-hover:opacity-70 opacity-40" />
                </div>
              </div>

              <span
                className={`font-display max-w-[86px] truncate text-[13px] font-bold transition-colors ${
                  isSelected ? "text-primary" : "text-foreground group-hover:text-primary"
                }`}
              >
                {item.name}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryCarousel;
