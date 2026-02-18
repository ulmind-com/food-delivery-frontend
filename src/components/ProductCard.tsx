import { useState } from "react";
import { motion } from "framer-motion";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Plus, Minus } from "lucide-react";
import { resolveImageURL } from "@/lib/image-utils";
import { ProductDetailDrawer } from "./ProductDetailDrawer";

interface ProductCardProps {
  item: {
    _id: string;
    name: string;
    description?: string;
    price: number;
    image?: string;
    imageURL?: string;
    type?: "Veg" | "Non-Veg";
    category?: string | { _id: string; name: string };
    variants?: { name: string; price: number }[];
  };
}

const VegIcon = () => (
  <div className="flex h-4 w-4 items-center justify-center rounded-sm border-2 border-swiggy-success">
    <div className="h-2 w-2 rounded-full bg-swiggy-success" />
  </div>
);

const NonVegIcon = () => (
  <div className="flex h-4 w-4 items-center justify-center rounded-sm border-2 border-swiggy-danger">
    <div className="h-0 w-0 border-x-[4px] border-b-[7px] border-x-transparent border-b-swiggy-danger" />
  </div>
);

const ProductCard = ({ item }: ProductCardProps) => {
  const { items, addItem, incrementItem, decrementItem } = useCartStore();
  const { isAuthenticated, openAuthModal } = useAuthStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false); // State for drawer

  const cartItem = items.find((i) => i._id === item._id);

  const displayPrice = item.price || item.variants?.[0]?.price || 0;
  const imageUrl = resolveImageURL(item.image || item.imageURL);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent drawer opening
    if (!isAuthenticated()) {
      openAuthModal("login");
      return;
    }
    addItem({
      _id: item._id,
      name: item.name,
      price: displayPrice,
      image: imageUrl,
      type: item.type,
    });
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    incrementItem(cartItem!.itemId);
  }

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    decrementItem(cartItem!.itemId);
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3 }}
        onClick={() => setIsDrawerOpen(true)} // Open drawer on click
        className="group flex gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:cursor-pointer hover:shadow-lg"
      >
        {/* Text */}
        <div className="flex flex-1 flex-col justify-between">
          <div>
            <div className="mb-1 flex items-center gap-1.5">
              {item.type === "Veg" ? <VegIcon /> : <NonVegIcon />}
              {item.category && (
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {typeof item.category === "object" ? item.category.name : item.category}
                </span>
              )}
            </div>
            <h3 className="text-base font-bold leading-tight text-foreground">
              {item.name}
            </h3>
            <p className="mt-0.5 text-sm font-semibold text-foreground">₹{displayPrice}</p>
            {item.description && (
              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            )}
          </div>
        </div>

        {/* Image + Cart */}
        <div className="relative flex-shrink-0">
          <div className="h-28 w-28 overflow-hidden rounded-xl">
            <img
              src={imageUrl}
              alt={item.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
              loading="lazy"
            />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/20 to-transparent" />
          </div>

          {/* Add / Counter */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
            {cartItem ? (
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 rounded-lg border border-border bg-card px-1 py-0.5 shadow-md"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={handleDecrement}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-swiggy-success transition-colors hover:bg-accent"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="min-w-[20px] text-center text-sm font-bold text-swiggy-success">
                  {cartItem.quantity}
                </span>
                <button
                  onClick={handleIncrement}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-swiggy-success transition-colors hover:bg-accent"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            ) : (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleAdd}
                className="rounded-lg border border-border bg-card px-6 py-1.5 text-sm font-extrabold uppercase text-swiggy-success shadow-md transition-all hover:bg-accent"
              >
                Add
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      <ProductDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        productId={item._id}
        initialData={item}
      />
    </>
  );
};

export default ProductCard;
