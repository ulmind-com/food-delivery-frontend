import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { menuApi } from "@/api/axios";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { SkeletonCategory } from "@/components/Skeletons";
import AddCategoryModal from "@/components/AddCategoryModal";

const CategoryManager = () => {
  const [modalOpen, setModalOpen] = useState(false);

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => menuApi.getCategories().then((r) => r.data),
  });

  return (
    <section className="container mx-auto px-4 py-8">
      <h2 className="mb-5 text-lg font-bold text-foreground">Manage Categories</h2>

      <div className="flex flex-wrap gap-5">
        {/* Add card */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setModalOpen(true)}
          className="flex h-28 w-28 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 text-primary transition-colors hover:border-primary hover:bg-primary/10"
        >
          <Plus className="h-7 w-7" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Add</span>
        </motion.button>

        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonCategory key={i} />)
          : categories?.map((cat: any) => (
              <div key={cat._id} className="flex w-28 flex-col items-center gap-2">
                <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-border">
                  {cat.image || cat.imageURL ? (
                    <img
                      src={cat.image || cat.imageURL}
                      alt={cat.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-accent text-2xl">
                      🍽️
                    </div>
                  )}
                </div>
                <span className="max-w-full truncate text-xs font-semibold text-foreground">
                  {cat.name}
                </span>
              </div>
            ))}
      </div>

      <AddCategoryModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </section>
  );
};

export default CategoryManager;
