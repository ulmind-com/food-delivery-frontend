import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { menuApi, adminApi } from "@/api/axios";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { resolveImageURL } from "@/lib/image-utils";
import EditProductModal from "@/components/EditProductModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const AdminMenuTable = () => {
  const queryClient = useQueryClient();
  const [editItem, setEditItem] = useState<any | null>(null);
  const [deleteItem, setDeleteItem] = useState<any | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { data: menuItems, isLoading } = useQuery({
    queryKey: ["admin-menu"],
    queryFn: () => menuApi.getAdminMenu().then((r) => r.data),
  });

  const handleToggle = async (item: any) => {
    setTogglingId(item._id);
    try {
      await adminApi.updateMenuItem(item._id, { isAvailable: !item.isAvailable });
      queryClient.invalidateQueries({ queryKey: ["admin-menu"] });
      toast.success(`${item.name} ${!item.isAvailable ? "enabled" : "disabled"}`);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await adminApi.deleteMenuItem(deleteItem._id);
      toast.success("Product deleted successfully 🗑️");
      queryClient.invalidateQueries({ queryKey: ["admin-menu"] });
    } catch {
      toast.error("Failed to delete product");
    }
    setDeleteItem(null);
  };

  const getCategoryName = (cat: any) => {
    if (!cat) return "—";
    return typeof cat === "object" ? cat.name : cat;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="shimmer h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {/* Header */}
        <div className="hidden grid-cols-[60px_1fr_120px_80px_100px_100px] items-center gap-4 border-b border-border bg-muted/50 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground md:grid">
          <span>Image</span>
          <span>Name</span>
          <span>Category</span>
          <span>Price</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>

        {/* Rows */}
        <AnimatePresence>
          {menuItems?.map((item: any) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 items-center gap-4 border-b border-border px-6 py-4 last:border-b-0 md:grid-cols-[60px_1fr_120px_80px_100px_100px]"
            >
              {/* Image */}
              <div className="h-10 w-10 overflow-hidden rounded-lg">
                <img
                  src={resolveImageURL(item.image || item.imageURL)}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Name + type */}
              <div className="flex items-center gap-2">
                <div className={`h-2.5 w-2.5 flex-shrink-0 rounded-sm ${item.type === "Veg" ? "bg-swiggy-success" : "bg-swiggy-danger"}`} />
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.name}</p>
                  {item.description && (
                    <p className="line-clamp-1 text-xs text-muted-foreground">{item.description}</p>
                  )}
                </div>
              </div>

              {/* Category */}
              <span className="text-xs font-medium text-muted-foreground">
                {getCategoryName(item.category)}
              </span>

              {/* Price */}
              <span className="text-sm font-bold text-foreground">
                ₹{item.price || item.variants?.[0]?.price || 0}
              </span>

              {/* Status toggle */}
              <div className="flex items-center gap-2">
                {togglingId === item._id ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <Switch
                    checked={item.isAvailable !== false}
                    onCheckedChange={() => handleToggle(item)}
                    className="data-[state=checked]:bg-swiggy-success"
                  />
                )}
                <span className="text-xs text-muted-foreground">
                  {item.isAvailable !== false ? "Active" : "Off"}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setEditItem(item)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-primary transition-colors hover:bg-primary/10"
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDeleteItem(item)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-destructive transition-colors hover:bg-destructive/10"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {(!menuItems || menuItems.length === 0) && (
          <div className="py-12 text-center">
            <p className="text-3xl">🍽️</p>
            <p className="mt-2 text-sm text-muted-foreground">No menu items yet. Add your first product!</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <EditProductModal open={!!editItem} onClose={() => setEditItem(null)} item={editItem} />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteItem?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove the item from your menu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminMenuTable;
