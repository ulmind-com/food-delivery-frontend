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
import { motion } from "framer-motion";
import { CreditCard, Banknote, ArrowLeft, Loader2, ShieldCheck, MapPin } from "lucide-react";

type PaymentMethod = "ONLINE" | "COD";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, totalPrice, discountAmount, finalPrice, deliveryFee, tax, appliedCoupon, clearCart } = useCartStore();
  const { user } = useAuthStore();

  const { restaurant, setRestaurant, setLoading } = useRestaurantStore();
  const isRestaurantClosed = restaurant && !restaurant.isOpen;

  // Refresh restaurant status on mount
  useEffect(() => {
    restaurantApi
      .get()
      .then((res) => setRestaurant(res.data))
      .catch(() => setLoading(false));
  }, [setRestaurant, setLoading]);

  const { selectedAddress: storedAddress } = useLocationStore();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("ONLINE");
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedAddressObj, setSelectedAddressObj] = useState<any>(null);
  const [selectedAddressText, setSelectedAddressText] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const { payNow, loading: paymentLoading } = useRazorpay();

  // Pre-select the address the user chose on the Addresses page
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
  }, [storedAddress]);

  const isLoading = placingOrder || paymentLoading;

  if (items.length === 0) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-20 text-center">
        <MapPin className="mx-auto h-12 w-12 text-muted-foreground/30" />
        <h2 className="mt-4 text-lg font-bold text-foreground">Your cart is empty</h2>
        <p className="mt-1 text-sm text-muted-foreground">Add items to your cart before checkout.</p>
        <button onClick={() => navigate("/")} className="mt-6 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground">
          Browse Menu
        </button>
      </div>
    );
  }

  const orderItems = items.map((i) => ({ product: i._id, quantity: i.quantity, variant: i.variant || "Standard", price: i.price }));

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) { toast.error("Please select a delivery address"); return; }

    if (paymentMethod === "COD") {
      // ─── COD: Create order directly ───
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
        const orderId = res.data?.order?._id || res.data?._id;
        toast.success("Order placed successfully! 🎉");
        clearCart();
        navigate(orderId ? `/orders/${orderId}` : "/my-orders");
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to place order");
      } finally {
        setPlacingOrder(false);
      }
    } else {
      // ─── ONLINE: Verify-then-Create flow ───
      // Step 1 & 2: Create Razorpay order + open modal (NO DB order yet)
      payNow({
        items: orderItems,
        deliveryAddress: selectedAddressObj || selectedAddressId,
        deliveryFee,
        finalAmount: finalPrice,
        userName: user?.name,
        userEmail: user?.email,
        onSuccess: async (paymentDetails) => {
          // Step 3: Payment confirmed → NOW create DB order
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
            const orderId = res.data?.order?._id || res.data?._id;
            toast.success("Payment successful! Order placed! 🎉");
            clearCart();
            navigate(orderId ? `/orders/${orderId}` : "/my-orders");
          } catch (err: any) {
            // Critical edge case: payment succeeded but order creation failed
            toast.error("Payment received but order creation failed. Please contact support.", { duration: 10000 });
          } finally {
            setPlacingOrder(false);
          }
        },
        onFailure: () => toast.error("Payment cancelled or failed"),
      });
    }
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="mb-8 text-2xl font-extrabold text-foreground">Checkout</h1>

      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        {/* Left */}
        <div className="space-y-6">
          {/* Address */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <AddressManager
              selectedAddressId={selectedAddressId}
              onSelect={(id, text, addressObj) => {
                setSelectedAddressId(id);
                setSelectedAddressText(text);
                setSelectedAddressObj(addressObj || null);
              }}
            />
          </div>

          {/* Payment Method */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-4 text-base font-bold text-foreground">Payment Method</h3>
            <div className="grid grid-cols-2 gap-3">
              {([
                { method: "ONLINE" as const, icon: CreditCard, label: "Pay Online", desc: "Razorpay" },
                { method: "COD" as const, icon: Banknote, label: "Cash on Delivery", desc: "Pay at door" },
              ]).map(({ method, icon: Icon, label, desc }) => (
                <motion.button
                  key={method}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setPaymentMethod(method)}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-5 transition-all ${paymentMethod === method
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border bg-card hover:border-muted-foreground/30"
                    }`}
                >
                  <Icon className={`h-8 w-8 ${paymentMethod === method ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="text-sm font-bold text-foreground">{label}</span>
                  <span className="text-[10px] text-muted-foreground">{desc}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Right — Bill Summary */}
        <div className="h-fit space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-4 text-base font-bold text-foreground">Order Summary</h3>
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {items.map((item) => (
                <div key={item.itemId || item._id} className="flex justify-between text-sm">
                  <span className="text-foreground">{item.name} × {item.quantity}</span>
                  <span className="font-semibold text-foreground">₹{(item.price * item.quantity).toFixed(0)}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Item Total</span><span>₹{totalPrice.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Delivery Fee</span><span>₹{deliveryFee.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>₹{tax.toFixed(2)}</span></div>
              {discountAmount > 0 && appliedCoupon && (
                <div className="flex justify-between font-medium text-emerald-600 dark:text-emerald-400">
                  <span>Discount ({appliedCoupon.code})</span><span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-2 text-base font-extrabold text-foreground">
                <span>Total</span><span>₹{finalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {isRestaurantClosed && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-2.5 text-center text-sm font-semibold text-destructive">
              Restaurant is currently offline
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handlePlaceOrder}
            disabled={isLoading || !!isRestaurantClosed}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-base font-extrabold text-primary-foreground shadow-lg transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <ShieldCheck className="h-5 w-5" />
                {paymentMethod === "COD" ? `Place Order — ₹${finalPrice.toFixed(0)}` : `Pay & Order — ₹${finalPrice.toFixed(0)}`}
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
