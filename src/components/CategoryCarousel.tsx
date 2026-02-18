import { motion } from "framer-motion";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Category {
  _id: string;
  name: string;
  image?: string;
  imageURL?: string;
}

interface CategoryCarouselProps {
  categories: Category[];
  selected: string;
  onSelect: (id: string) => void;
}

const CategoryCarousel = ({ categories, selected, onSelect }: CategoryCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => scroll("left")}
        className="absolute -left-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card shadow-md transition-colors hover:bg-accent"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div
        ref={scrollRef}
        className="scrollbar-hide flex gap-6 overflow-x-auto px-6 py-2"
        style={{ scrollbarWidth: "none" }}
      >
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect("")}
          className={`flex flex-shrink-0 flex-col items-center gap-2 transition-all ${selected === "" ? "scale-105" : "opacity-60 hover:opacity-100"
            }`}
        >
          <div className={`flex h-20 w-20 items-center justify-center rounded-full border-2 transition-colors ${selected === "" ? "border-primary bg-secondary" : "border-border bg-card"
            }`}>
            <span className="text-2xl">🍽️</span>
          </div>
          <span className="text-xs font-semibold text-foreground">All</span>
        </motion.button>

        {categories.map((cat) => (
          <motion.button
            key={cat._id}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(cat._id)}
            className={`flex flex-shrink-0 flex-col items-center gap-2 transition-all ${selected === cat._id ? "scale-105" : "hover:scale-105"
              }`}
          >
            <div className={`h-20 w-20 overflow-hidden rounded-full border-2 transition-colors ${selected === cat._id ? "border-primary" : "border-border opacity-80 hover:opacity-100"
              }`}>
              <img src={cat.image || cat.imageURL} alt={cat.name} className="h-full w-full object-cover" />
            </div>
            <span className="max-w-[80px] truncate text-xs font-semibold text-foreground">
              {cat.name}
            </span>
          </motion.button>
        ))}
      </div>

      <button
        onClick={() => scroll("right")}
        className="absolute -right-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card shadow-md transition-colors hover:bg-accent"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
};

export default CategoryCarousel;
