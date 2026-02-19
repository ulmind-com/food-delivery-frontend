import { useEffect, useState } from "react";
import { menuApi } from "@/api/axios";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { resolveImageURL } from "@/lib/image-utils";
import { Loader2, Plus, Minus, X, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface ProductDetailDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    productId: string;
    initialData?: any;
}

export function ProductDetailDrawer({
    isOpen,
    onClose,
    productId,
    initialData,
}: ProductDetailDrawerProps) {
    const [product, setProduct] = useState<any>(initialData || null);
    const [loading, setLoading] = useState(false);
    const [localQty, setLocalQty] = useState(1);

    const { items, addItem, incrementItem, decrementItem, toggleCart } = useCartStore();
    const { isAuthenticated, openAuthModal } = useAuthStore();

    const cartItem = items.find((i) => i._id === productId);

    // Sync localQty with cart when drawer opens
    useEffect(() => {
        if (isOpen) {
            setLocalQty(cartItem ? cartItem.quantity : 1);
        }
    }, [isOpen, productId]);

    useEffect(() => {
        if (isOpen && productId) {
            setLoading(true);
            menuApi
                .getProductById(productId)
                .then((res) => {
                    setProduct(res.data);
                })
                .catch((err) => {
                    console.error("Failed to fetch product details", err);
                    toast.error("Failed to load product details");
                })
                .finally(() => setLoading(false));
        }
    }, [isOpen, productId]);

    const handleAddToCart = async () => {
        if (!isAuthenticated()) {
            onClose();
            openAuthModal("login");
            return;
        }
        if (!product) return;

        const imageUrl = resolveImageURL(product.image || product.imageURL);

        if (cartItem) {
            // Already in cart — adjust quantity to match localQty
            const diff = localQty - cartItem.quantity;
            if (diff > 0) {
                for (let i = 0; i < diff; i++) await incrementItem(cartItem.itemId);
            } else if (diff < 0) {
                for (let i = 0; i < Math.abs(diff); i++) await decrementItem(cartItem.itemId);
            }
        } else {
            // Add fresh — addItem adds 1, then increment the rest
            await addItem({
                _id: product._id,
                name: product.name,
                price: product.price,
                image: imageUrl,
                type: product.type,
                category: typeof product.category === 'object' ? product.category._id : product.category,
            });
            // addItem adds 1; increment for remaining qty
            // We need to wait for cart to refresh so itemId is available
            // Use a small delay then increment
            if (localQty > 1) {
                setTimeout(async () => {
                    const updatedCart = useCartStore.getState().items;
                    const newItem = updatedCart.find((i) => i._id === product._id);
                    if (newItem) {
                        for (let i = 1; i < localQty; i++) {
                            await incrementItem(newItem.itemId);
                        }
                    }
                }, 500);
            }
        }

        onClose();
        toggleCart(); // Open cart sidebar
    };

    if (!isOpen) return null;

    const displayPrice = product?.price || product?.variants?.[0]?.price || 0;
    const imageUrl = resolveImageURL(product?.image || product?.imageURL);
    const totalPrice = displayPrice * localQty;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Full-screen panel */}
                    <motion.div
                        key="panel"
                        initial={{ opacity: 0, scale: 0.96, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 20 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="fixed inset-x-0 bottom-0 top-0 z-50 flex flex-col bg-background sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:h-[90vh] sm:w-[480px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute right-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto">
                            {loading && !product ? (
                                <div className="flex h-full items-center justify-center">
                                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                </div>
                            ) : product ? (
                                <>
                                    {/* Hero Image — takes up top half */}
                                    <div className="relative h-[45vh] w-full sm:h-[45%]">
                                        <img
                                            src={imageUrl}
                                            alt={product.name}
                                            className="h-full w-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                                    </div>

                                    {/* Details */}
                                    <div className="px-6 pb-6 pt-3">
                                        {/* Veg / Non-Veg + Category */}
                                        <div className="mb-3 flex items-center gap-2">
                                            {product.type === "Veg" ? (
                                                <div className="flex h-5 w-5 items-center justify-center rounded-sm border-2 border-swiggy-success">
                                                    <div className="h-2.5 w-2.5 rounded-full bg-swiggy-success" />
                                                </div>
                                            ) : (
                                                <div className="flex h-5 w-5 items-center justify-center rounded-sm border-2 border-swiggy-danger">
                                                    <div className="h-0 w-0 border-x-[5px] border-b-[8px] border-x-transparent border-b-swiggy-danger" />
                                                </div>
                                            )}
                                            {product.category && (
                                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                    {typeof product.category === "object" ? product.category.name : product.category}
                                                </span>
                                            )}
                                        </div>

                                        {/* Name */}
                                        <h2 className="text-3xl font-extrabold leading-tight text-foreground">
                                            {product.name}
                                        </h2>

                                        {/* Price */}
                                        <div className="mt-1 flex items-baseline gap-3">
                                            <p className="text-xl font-bold text-primary">
                                                ₹{displayPrice}
                                            </p>
                                            {product.hasDiscount && product.originalPrice && (
                                                <>
                                                    <span className="text-sm text-muted-foreground line-through">₹{product.originalPrice}</span>
                                                    <span className="rounded-md bg-swiggy-orange/10 px-2 py-0.5 text-xs font-bold text-swiggy-orange uppercase border border-swiggy-orange/20">
                                                        {product.discountPercentage}% OFF
                                                    </span>
                                                </>
                                            )}
                                        </div>

                                        <div className="my-5 h-px w-full bg-border" />

                                        {/* Description */}
                                        <p className="text-base leading-relaxed text-muted-foreground">
                                            {product.description || "No description available for this delicious item."}
                                        </p>
                                    </div>
                                </>
                            ) : null}
                        </div>

                        {/* Sticky Footer */}
                        {product && !loading && (
                            <div className="border-t border-border bg-background px-6 py-4 pb-safe">
                                <div className="flex items-center gap-4">
                                    {/* Quantity Selector */}
                                    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-2 py-1 shadow-sm">
                                        <button
                                            onClick={() => setLocalQty((q) => Math.max(1, q - 1))}
                                            className="flex h-10 w-10 items-center justify-center rounded-lg text-swiggy-danger transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-90"
                                        >
                                            <Minus className="h-5 w-5" />
                                        </button>
                                        <span className="w-6 text-center text-xl font-bold text-foreground">
                                            {localQty}
                                        </span>
                                        <button
                                            onClick={() => setLocalQty((q) => q + 1)}
                                            className="flex h-10 w-10 items-center justify-center rounded-lg text-swiggy-success transition-colors hover:bg-green-50 dark:hover:bg-green-900/20 active:scale-90"
                                        >
                                            <Plus className="h-5 w-5" />
                                        </button>
                                    </div>

                                    {/* Add to Cart Button */}
                                    <button
                                        onClick={handleAddToCart}
                                        className="flex flex-1 items-center justify-between rounded-xl bg-primary px-5 py-3.5 text-primary-foreground shadow-lg transition-transform active:scale-95 hover:opacity-90"
                                    >
                                        <div className="flex items-center gap-2">
                                            <ShoppingCart className="h-5 w-5" />
                                            <span className="text-base font-bold">Add to Cart</span>
                                        </div>
                                        <span className="text-base font-bold">₹{totalPrice}</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
