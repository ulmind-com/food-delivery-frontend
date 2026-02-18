import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useRestaurantStore } from "@/store/useRestaurantStore";
import { useLocationStore } from "@/store/useLocationStore";
import { orderApi, restaurantApi } from "@/api/axios";
import { useRazorpay } from "@/hooks/useRazorpay";
import AddressManager from "@/components/AddressManager";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Banknote, ArrowLeft, Loader2, MapPin, Home, Briefcase, Minus, Plus, ChevronRight, Clock } from "lucide-react";

type PaymentMethod = "ONLINE" | "COD";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, totalPrice, discountAmount, finalPrice, deliveryFee, tax, appliedCoupon, clearCart, incrementItem, decrementItem } = useCartStore();
  const { user } = useAuthStore();
  const { restaurant, setRestaurant, setLoading } = useRestaurantStore();
  const { selectedAddress: storedAddress } = useLocationStore();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("ONLINE");
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedAddressObj, setSelectedAddressObj] = useState<any>(null);
  const [selectedAddressText, setSelectedAddressText] = useState("");
  const [isSelectingAddress, setIsSelectingAddress] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const { payNow, loading: paymentLoading } = useRazorpay();

  const isRestaurantClosed = restaurant && !restaurant.isOpen;

  // Sync restaurant status
  useEffect(() => {
    restaurantApi.get().then((res) => setRestaurant(res.data)).catch(() => setLoading(false));
  }, [setRestaurant, setLoading]);

  // Sync address
  useEffect(() => {
    if (storedAddress && !selectedAddressId) {
      const full = [
        storedAddress.addressLine1,
        storedAddress.addressLine2,
        storedAddress.city,
        storedAddress.state,
        storedAddress.postalCode,
      ].filter(Boolean).join(", ");
      setSelectedAddressId(storedAddress._id);
      setSelectedAddressObj(storedAddress);
      setSelectedAddressText(full);
    }
  }, [storedAddress, selectedAddressId]);

  const isLoading = placingOrder || paymentLoading;
  const deliveryTime = 30; // Mock delivery time

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) { toast.error("Please select a delivery address"); return; }

    // Prepare items
    const orderItems = items.map((i) => ({
      product: i._id,
      quantity: i.quantity,
      variant: i.variant || "Standard",
      price: i.price
    }));

    if (paymentMethod === "COD") {
      setPlacingOrder(true);
      try {
        const res = await orderApi.placeOrder({
          items: orderItems,
          totalAmount: totalPrice,
          discountApplied: discountAmount,
          finalAmount: finalPrice,
          deliveryAddress: selectedAddressId,
          address: selectedAddressText || user?.address || "",
          deliveryCoordinates: selectedAddressObj?.coordinates || undefined,
          paymentMethod: "COD",
        });
        toast.success("Order placed successfully! 🎉");
        clearCart();
        navigate(`/orders/${res.data?.order?._id || res.data?._id}`);
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to place order");
      } finally {
        setPlacingOrder(false);
      }
    } else {
      payNow({
        items: orderItems,
        deliveryAddress: selectedAddressObj || selectedAddressId,
        deliveryFee,
        finalAmount: finalPrice,
        userName: user?.name,
        userEmail: user?.email,
        onSuccess: async (paymentDetails) => {
          setPlacingOrder(true);
          try {
            const res = await orderApi.placeOrder({
              items: orderItems,
              totalAmount: totalPrice,
              discountApplied: discountAmount,
              finalAmount: finalPrice,
              deliveryAddress: selectedAddressId,
              address: selectedAddressText || user?.address || "",
              deliveryCoordinates: selectedAddressObj?.coordinates || undefined,
              paymentMethod: "ONLINE",
              razorpayOrderId: paymentDetails.razorpay_order_id,
              razorpayPaymentId: paymentDetails.razorpay_payment_id,
              razorpaySignature: paymentDetails.razorpay_signature,
            });
            toast.success("Payment successful! Order placed! 🎉");
            clearCart();
            navigate(`/orders/${res.data?.order?._id || res.data?._id}`);
          } catch (err: any) {
            toast.error("Payment received but order creation failed. Contact support.");
          } finally {
            setPlacingOrder(false);
          }
        },
        onFailure: () => toast.error("Payment cancelled or failed"),
      });
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center p-6 text-center">
        <div className="mb-4 rounded-full bg-green-50 p-6">
          <MapPin className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Your cart is empty</h2>
        <p className="mt-2 text-muted-foreground">Add items from the menu to get started.</p>
        <button onClick={() => navigate("/")} className="mt-6 rounded-xl bg-primary px-8 py-3 font-semibold text-primary-foreground">
          Browse Menu
        </button>
      </div>
    );
  }

  const AddressIcon = selectedAddressObj?.type === "WORK" ? Briefcase : selectedAddressObj?.type === "HOME" ? Home : MapPin;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-32 dark:bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center bg-background px-4 py-4 shadow-sm">
        <button onClick={() => navigate(-1)} className="mr-4 rounded-full p-1 hover:bg-accent">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Checkout</h1>
      </header>

      <div className="mx-auto max-w-lg space-y-4 p-4">
        {/* Delivery Address Card */}
        <section className="rounded-2xl bg-card p-4 shadow-sm border border-border/50">
          {!isSelectingAddress && selectedAddressId ? (
            <div className="flex items-start justify-between">
              <div className="flex gap-3">
                <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <AddressIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground flex items-center gap-2">
                    Delivery to {selectedAddressObj?.type === "HOME" ? "Home" : selectedAddressObj?.type === "WORK" ? "Work" : "Address"}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{selectedAddressText}</p>
                </div>
              </div>
              <button
                onClick={() => setIsSelectingAddress(true)}
                className="rounded-lg px-3 py-1 text-xs font-bold text-primary hover:bg-primary/10 border border-primary/20"
              >
                Change
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">Select Delivery Address</h3>
                {isSelectingAddress && selectedAddressId && (
                  <button onClick={() => setIsSelectingAddress(false)} className="text-xs font-medium text-muted-foreground">Cancel</button>
                )}
              </div>
              <AddressManager
                selectedAddressId={selectedAddressId}
                onSelect={(id, text, obj) => {
                  setSelectedAddressId(id);
                  setSelectedAddressText(text);
                  setSelectedAddressObj(obj);
                  setIsSelectingAddress(false);
                }}
              />
            </div>
          )}
        </section>

        {!isSelectingAddress && (
          <>
            {/* Delivery Estimate */}
            <div className="flex items-center gap-3 rounded-xl bg-orange-50 p-4 dark:bg-orange-900/10">
              <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <p className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                Estimated Delivery in <span className="font-bold">{deliveryTime} mins</span>
              </p>
            </div>

            {/* Items List */}
            <section className="rounded-2xl bg-card p-4 shadow-sm border border-border/50">
              <div className="divide-y divide-border">
                {items.map((item) => (
                  <div key={item.itemId || item._id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-sm line-clamp-1">{item.name}</h4>
                          <p className="text-xs text-muted-foreground">{item.variant || "Standard"}</p>
                        </div>
                        <div className="flex items-center h-7 rounded-lg border border-border bg-background">
                          <button
                            onClick={() => decrementItem(item.itemId)}
                            className="flex h-full w-7 items-center justify-center text-primary hover:bg-primary/10 rounded-l-lg transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-foreground">{item.quantity}</span>
                          <button
                            onClick={() => incrementItem(item.itemId)}
                            className="flex h-full w-7 items-center justify-center text-primary hover:bg-primary/10 rounded-r-lg transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="font-bold text-sm">₹{item.price * item.quantity}</span>
                        {item.quantity > 1 && <span className="text-xs text-muted-foreground">₹{item.price} each</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate("/?category=all")}
                className="mt-4 flex w-full items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80"
              >
                <Plus className="h-4 w-4" /> Add more items
              </button>
            </section>

            {/* Bill Summary */}
            <section className="rounded-2xl bg-card p-4 shadow-sm border border-border/50">
              <h3 className="mb-3 font-bold text-sm">Bill Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Item total</span>
                  <span>₹{totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery fee</span>
                  <span>₹{deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>GST</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>Item Discount</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-3 mt-3 border-t border-dashed border-border flex justify-between items-center">
                  <span className="font-bold">To Pay</span>
                  <span className="font-extrabold text-lg">₹{finalPrice.toFixed(0)}</span>
                </div>
              </div>
            </section>

            {/* Savings Banner */}
            {discountAmount > 0 && (
              <div className="rounded-xl bg-green-50 p-3 text-center text-sm font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
                You Saved ₹{discountAmount.toFixed(0)} on this order! 🎉
              </div>
            )}

            {/* Payment & Order Button (Fixed Bottom) */}
            <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
              <div className="mx-auto max-w-lg space-y-3">
                <div className="flex gap-3">
                  <button
                    onClick={() => setPaymentMethod("ONLINE")}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-xl border p-3 transition-all ${paymentMethod === "ONLINE"
                      ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                      : "border-border hover:bg-accent"
                      }`}
                  >
                    <img src="/razorpay.svg" alt="Razorpay" className="h-6 w-auto object-contain" />
                    <span className="text-sm font-bold">Pay Online</span>
                    {paymentMethod === "ONLINE" && <div className="ml-auto h-2 w-2 rounded-full bg-primary" />}
                  </button>

                  <button
                    onClick={() => setPaymentMethod("COD")}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-xl border p-3 transition-all ${paymentMethod === "COD"
                      ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                      : "border-border hover:bg-accent"
                      }`}
                  >
                    <Banknote className={`h-5 w-5 ${paymentMethod === "COD" ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="text-sm font-bold">Cash</span>
                    {paymentMethod === "COD" && <div className="ml-auto h-2 w-2 rounded-full bg-primary" />}
                  </button>
                </div>

                {isRestaurantClosed ? (
                  <div className="rounded-xl bg-destructive/10 p-3 text-center font-bold text-destructive">
                    Restaurant is currently closed
                  </div>
                ) : (
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isLoading}
                    className="w-full flex items-center justify-between rounded-xl bg-primary p-4 text-primary-foreground shadow-lg hover:brightness-110 disabled:opacity-70 transition-all active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <div className="flex w-full justify-center"><Loader2 className="animate-spin" /></div>
                    ) : (
                      <>
                        <div className="text-left">
                          <p className="text-xs text-primary-foreground/80 uppercase font-semibold">Total</p>
                          <p className="font-bold text-lg leading-none">₹{finalPrice.toFixed(0)}</p>
                        </div>
                        <div className="flex items-center gap-2 font-bold">
                          {paymentMethod === "COD" ? "Place Order" : "Pay Now"} <ChevronRight className="h-5 w-5" />
                        </div>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CheckoutPage;
