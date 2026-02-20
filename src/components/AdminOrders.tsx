import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/api/axios";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Package, Search, X, Eye, ChefHat, Bike, CheckCircle, XCircle, ShoppingBag, Tag, MapPin, QrCode } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import { socket } from "@/api/socket";
import QRCode from "react-qr-code";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const STATUSES = ["PLACED", "ACCEPTED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];

const STATUS_COLORS: Record<string, string> = {
  PLACED: "bg-blue-100 text-blue-700",
  ACCEPTED: "bg-cyan-100 text-cyan-700",
  PREPARING: "bg-orange-100 text-orange-700",
  OUT_FOR_DELIVERY: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  PAID: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
};

const formatDate = (d: string) => {
  try { return format(new Date(d), "dd MMM, hh:mm a"); } catch { return "—"; }
};

const getItemsSummary = (items: any[]) => {
  if (!items?.length) return "No items";
  return items.map((i: any) => `${i.name || i.product?.name || i.menuItem?.name || "Item"} × ${i.quantity}`).join(", ");
};

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ... existing imports ...

const AdminOrders = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders", filterStatus],
    queryFn: () => {
      if (filterStatus === "ALL") return adminApi.getOrders().then((r) => r.data?.orders || r.data || []);
      return adminApi.getOrdersByStatus(filterStatus).then((r) => r.data?.orders || r.data || []);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminApi.updateOrderStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Order status updated");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => adminApi.updateOrderStatus(id, { status: "CANCELLED" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Order cancelled");
    },
    onError: () => toast.error("Failed to cancel order"),
  });

  const paymentStatusMutation = useMutation({
    mutationFn: ({ id, paymentStatus }: { id: string; paymentStatus: string }) => adminApi.updatePaymentStatus(id, { paymentStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Payment status updated");
    },
    onError: () => toast.error("Failed to update payment status"),
  });

  const downloadCSV = () => {
    if (!orders.length) return toast.error("No data to export");
    const headers = ["Order ID", "Customer", "Mobile", "Items", "Total Amount", "Status", "Payment", "Date"];
    const rows = orders.map((o: any) => [
      o.customId || o._id,
      o.customer?.name || o.user?.name || "Guest",
      o.customer?.mobile || o.deliveryAddress?.mobile || "",
      o.items?.map((i: any) => `${i.name || i.product?.name} x${i.quantity}`).join("; "),
      o.finalAmount || o.totalAmount,
      o.status,
      o.paymentStatus || o.paymentMethod,
      new Date(o.createdAt).toLocaleDateString(),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r: any) => r.map((c: any) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `orders_${filterStatus}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const downloadPDF = () => {
    if (!orders.length) return toast.error("No data to export");
    const doc = new jsPDF();
    doc.text(`Order Report - ${filterStatus}`, 14, 10);

    autoTable(doc, {
      startY: 20,
      head: [["Order ID", "Customer", "Items", "Amount", "Status", "Date"]],
      body: orders.map((o: any) => [
        o.customId || o._id.slice(-6).toUpperCase(),
        o.customer?.name || o.user?.name || "Guest",
        o.items?.length || 0,
        `Rs. ${o.finalAmount || o.totalAmount}`,
        o.status,
        new Date(o.createdAt).toLocaleDateString(),
      ]),
    });
    doc.save(`orders_report_${filterStatus}.pdf`);
  };



  const filtered = orders
    .filter((o: any) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        o._id?.toLowerCase().includes(q) ||
        o.customId?.toLowerCase().includes(q) ||
        o.customer?.name?.toLowerCase().includes(q) ||
        o.user?.name?.toLowerCase().includes(q) ||
        o.customer?.email?.toLowerCase().includes(q) ||
        o.user?.email?.toLowerCase().includes(q) ||
        o.customer?.mobile?.includes(q) ||
        o.deliveryAddress?.mobile?.includes(q)
      );
    })
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <TooltipProvider>
      <div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Order Management</h2>
            <p className="text-sm text-muted-foreground">Track and manage all customer orders</p>
          </div>
          <div className="flex gap-2">
            <button onClick={downloadCSV} className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-bold transition-colors hover:bg-accent">
              Export CSV
            </button>
            <button onClick={downloadPDF} className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition-colors hover:brightness-110">
              Export PDF
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, name, email, mobile…"
              className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Stats row */}
        <div className="mb-4 flex flex-wrap gap-2">
          {
            ["PLACED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"].map((s) => {
              const count = orders.filter((o: any) => o.status?.toUpperCase() === s).length;
              return (
                <button
                  key={s}
                  onClick={() => setFilterStatus(filterStatus === s ? "ALL" : s)}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${filterStatus === s ? "bg-primary text-primary-foreground" : STATUS_COLORS[s] || "bg-muted text-muted-foreground"
                    }`}
                >
                  {s.replace(/_/g, " ")} ({count})
                </button>
              );
            })
          }
        </div >

        {/* Table */}
        {
          isLoading ? (
            <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-12 text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-sm font-semibold text-muted-foreground">No orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left font-bold text-muted-foreground">Order</th>
                    <th className="px-4 py-3 text-left font-bold text-muted-foreground">Customer</th>
                    <th className="px-4 py-3 text-left font-bold text-muted-foreground">Items</th>
                    <th className="px-4 py-3 text-left font-bold text-muted-foreground">Amount</th>
                    <th className="px-4 py-3 text-left font-bold text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-center font-bold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order: any) => {
                    const statusKey = (order.status || order.orderStatus || "PLACED").toUpperCase();
                    const statusClass = STATUS_COLORS[statusKey] || "bg-muted text-muted-foreground";
                    const paymentStatusClass = PAYMENT_STATUS_COLORS[order.paymentStatus?.toUpperCase()] || "";
                    const customerMobile = order.customer?.mobile || order.deliveryAddress?.mobile || "";

                    return (
                      <motion.tr key={order._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-border last:border-0 hover:bg-accent/30">
                        <td className="px-4 py-3">
                          <p className="font-bold text-foreground">{order.customId || `#${order._id?.slice(-6).toUpperCase()}`}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{order.customer?.name || order.user?.name || "Guest User"}</p>
                          <p className="text-xs text-muted-foreground">{order.customer?.mobile || customerMobile || order.customer?.email || order.user?.email || ""}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-default text-xs text-muted-foreground">{order.items?.length || 0} items</span>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-xs text-xs">
                              {getItemsSummary(order.items)}
                            </TooltipContent>
                          </Tooltip>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-foreground">₹{order.finalAmount || order.totalAmount || 0}</p>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <span className="text-[10px] text-muted-foreground">{order.paymentMethod || "—"}</span>
                            {order.paymentStatus && (
                              <span className={`rounded-full px-1.5 py-0 text-[9px] font-bold ${paymentStatusClass}`}>
                                {order.paymentStatus}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Select
                            value={statusKey}
                            onValueChange={(v) => statusMutation.mutate({ id: order._id, status: v })}
                          >
                            <SelectTrigger className={`h-8 w-40 rounded-full border-0 text-xs font-bold ${statusClass}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => setSelectedOrder(order)} className="rounded-lg p-1.5 hover:bg-accent">
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            </button>
                            {statusKey !== "DELIVERED" && statusKey !== "CANCELLED" && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <button className="rounded-lg p-1.5 hover:bg-destructive/10">
                                    <X className="h-4 w-4 text-destructive" />
                                  </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Cancel Order?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will cancel order {order.customId || `#${order._id?.slice(-6).toUpperCase()}`}. This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Keep Order</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => cancelMutation.mutate(order._id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Cancel Order
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        }

        {/* Order Detail Dialog — Rich Invoice View */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-lg">
                  {selectedOrder?.customId || `Order #${selectedOrder?._id?.slice(-6).toUpperCase()}`}
                </DialogTitle>
                {selectedOrder && (
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_COLORS[(selectedOrder.status || selectedOrder.orderStatus || "PLACED").toUpperCase()] || ""}`}>
                      {(selectedOrder.status || selectedOrder.orderStatus || "PLACED").replace(/_/g, " ")}
                    </span>
                    {selectedOrder.paymentStatus && (
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${PAYMENT_STATUS_COLORS[selectedOrder.paymentStatus?.toUpperCase()] || ""}`}>
                        {selectedOrder.paymentStatus}
                      </span>
                    )}
                  </div>
                )}
              </div>
              {selectedOrder && (
                <p className="text-xs text-muted-foreground">{formatDate(selectedOrder.createdAt)}</p>
              )}
            </DialogHeader>

            {selectedOrder && (selectedOrder.status === "CANCELLED" || selectedOrder.orderStatus === "CANCELLED") && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-200">
                <p className="font-bold flex items-center gap-2">
                  <XCircle className="h-4 w-4" /> Cancellation Reason
                </p>
                <p className="mt-1 ml-6 text-red-700/90 dark:text-red-300/90">
                  {selectedOrder.cancellationReason || "No reason provided."}
                </p>
              </div>
            )}

            {selectedOrder && (
              <div className="space-y-5 text-sm">
                {/* Customer & Payment Grid */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Customer Info */}
                  <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Customer</p>
                    <p className="font-semibold text-foreground">{selectedOrder.customer?.name || selectedOrder.user?.name || "Guest User"}</p>
                    {(selectedOrder.customer?.email || selectedOrder.user?.email) && <p className="text-muted-foreground">{selectedOrder.customer?.email || selectedOrder.user?.email}</p>}
                    {(selectedOrder.customer?.mobile || selectedOrder.deliveryAddress?.mobile) && (
                      <p className="text-muted-foreground">📞 {selectedOrder.customer?.mobile || selectedOrder.deliveryAddress?.mobile}</p>
                    )}
                  </div>

                  {/* Payment Info */}
                  <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Payment</p>
                    <p className="font-semibold text-foreground">{selectedOrder.paymentMethod || "—"}</p>
                    {selectedOrder.razorpayPaymentId && (
                      <p className="text-xs text-muted-foreground">Txn: {selectedOrder.razorpayPaymentId}</p>
                    )}
                    {selectedOrder.razorpayOrderId && (
                      <p className="text-xs text-muted-foreground">Razorpay: {selectedOrder.razorpayOrderId}</p>
                    )}
                    <p className="text-xl font-extrabold text-green-600">₹{selectedOrder.finalAmount || selectedOrder.totalAmount || 0}</p>

                    {/* Payment Status Control */}
                    <div className="border-t border-border pt-3 space-y-1.5">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Payment Status</p>
                      <Select
                        value={(selectedOrder.paymentStatus || "PENDING").toUpperCase()}
                        onValueChange={(v) => paymentStatusMutation.mutate({ id: selectedOrder._id, paymentStatus: v })}
                      >
                        <SelectTrigger className={`h-8 w-full rounded-full border-0 text-xs font-bold ${PAYMENT_STATUS_COLORS[(selectedOrder.paymentStatus || "PENDING").toUpperCase()] || "bg-muted text-muted-foreground"}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">PENDING</SelectItem>
                          <SelectItem value="PAID">PAID</SelectItem>
                          <SelectItem value="FAILED">FAILED</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-muted/30 p-4 relative">
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Delivery Address</p>
                    {(() => {
                      const addr = selectedOrder.deliveryAddress;
                      // Prioritize coordinates for accuracy
                      const coords = selectedOrder.deliveryCoordinates || addr?.coordinates || (addr?.lat && addr?.lng ? { lat: addr.lat, lng: addr.lng } : null);
                      const lat = coords?.lat || coords?.latitude;
                      const lng = coords?.lng || coords?.longitude;

                      // Fallback to address string
                      const addressString = typeof addr === "object"
                        ? [addr.addressLine1, addr.addressLine2, addr.city, addr.state, addr.postalCode].filter(Boolean).join(", ")
                        : (selectedOrder.address || addr);

                      const mapUrl = (lat && lng)
                        ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
                        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressString)}`;

                      return (
                        <div className="flex gap-2">
                          {/* QR Code Button */}
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[10px] font-bold text-gray-700 shadow-sm transition-colors hover:bg-gray-100 hover:text-black border border-gray-200">
                                <QrCode className="h-3 w-3" />
                                Show QR
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-4">
                              <div className="flex flex-col items-center gap-2">
                                <p className="text-xs font-bold text-center text-muted-foreground mb-2">Scan for Navigation 📍</p>
                                <div className="bg-white p-2 rounded-lg shadow-sm border border-border">
                                  <QRCode
                                    value={mapUrl}
                                    size={128}
                                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                    viewBox={`0 0 256 256`}
                                  />
                                </div>
                                <p className="text-[10px] text-muted-foreground text-center mt-1">Opens Google Maps</p>
                              </div>
                            </PopoverContent>
                          </Popover>

                          {/* Maps Link */}
                          <a
                            href={mapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[10px] font-bold text-blue-600 shadow-sm transition-colors hover:bg-blue-50 hover:text-blue-700 border border-blue-100"
                          >
                            <MapPin className="h-3 w-3" />
                            Open Map
                          </a>
                        </div>
                      );
                    })()}
                  </div>
                  <p className="text-foreground">
                    {typeof selectedOrder.deliveryAddress === "object" && selectedOrder.deliveryAddress
                      ? [
                        selectedOrder.deliveryAddress.label && `(${selectedOrder.deliveryAddress.label})`,
                        selectedOrder.deliveryAddress.addressLine1 || selectedOrder.deliveryAddress.houseNo,
                        selectedOrder.deliveryAddress.addressLine2 || selectedOrder.deliveryAddress.street,
                        selectedOrder.deliveryAddress.landmark,
                        selectedOrder.deliveryAddress.city,
                        selectedOrder.deliveryAddress.state,
                        selectedOrder.deliveryAddress.postalCode || selectedOrder.deliveryAddress.zip,
                      ].filter(Boolean).join(", ")
                      : (selectedOrder.address || selectedOrder.deliveryAddress)}
                  </p>

                  {/* Delivery Instructions */}
                  {selectedOrder.deliveryInstruction && (
                    <div className="mt-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 p-2.5">
                      <p className="text-xs font-bold text-yellow-800 dark:text-yellow-500 uppercase flex items-center gap-1.5">
                        📝 Special Instructions
                      </p>
                      <p className="text-sm mt-1 text-yellow-900 dark:text-yellow-200/90 font-medium">
                        "{selectedOrder.deliveryInstruction}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Items Table */}
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Items Ordered</p>
                  <div className="overflow-hidden rounded-xl border border-border">
                    <table className="w-full min-w-[500px] text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="px-4 py-2.5 text-left font-bold text-muted-foreground">Item</th>
                          <th className="px-4 py-2.5 text-center font-bold text-muted-foreground">Qty</th>
                          <th className="px-4 py-2.5 text-right font-bold text-muted-foreground">Price</th>
                          <th className="px-4 py-2.5 text-right font-bold text-muted-foreground">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedOrder.items || []).map((item: any, idx: number) => (
                          <tr key={idx} className="border-b border-border last:border-0">
                            <td className="px-4 py-2.5 text-foreground">
                              {item.name || item.product?.name || item.menuItem?.name || "Item"}
                              {item.variant && <span className="ml-1 text-xs text-muted-foreground">({item.variant})</span>}
                            </td>
                            <td className="px-4 py-2.5 text-center">{item.quantity}</td>
                            <td className="px-4 py-2.5 text-right">₹{item.price || 0}</td>
                            <td className="px-4 py-2.5 text-right font-semibold">₹{(item.price || 0) * item.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Bill Summary */}
                <div className="rounded-xl bg-muted/50 p-4 space-y-1.5">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{selectedOrder.totalAmount || 0}</span></div>
                  {selectedOrder.discountApplied > 0 && (
                    <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{selectedOrder.discountApplied}</span></div>
                  )}
                  {selectedOrder.deliveryCharge > 0 && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>₹{selectedOrder.deliveryCharge}</span></div>
                  )}
                  {(selectedOrder.taxAmount > 0 || selectedOrder.cgstTotal > 0 || selectedOrder.sgstTotal > 0 || selectedOrder.igstTotal > 0) && (
                    <div className="flex flex-col gap-1 text-muted-foreground border-t border-border/50 pt-2 mt-2">
                      <div className="flex justify-between">
                        <span>Tax</span>
                        <span>₹{selectedOrder.taxAmount || ((selectedOrder.cgstTotal || 0) + (selectedOrder.sgstTotal || 0) + (selectedOrder.igstTotal || 0))}</span>
                      </div>
                      {(selectedOrder.cgstTotal > 0 || selectedOrder.sgstTotal > 0) && (
                        <div className="ml-2 flex flex-col gap-0.5 text-xs text-muted-foreground/80 border-l-2 border-border pl-2">
                          {selectedOrder.cgstTotal > 0 && (
                            <div className="flex justify-between">
                              <span>CGST</span>
                              <span>₹{selectedOrder.cgstTotal}</span>
                            </div>
                          )}
                          {selectedOrder.sgstTotal > 0 && (
                            <div className="flex justify-between">
                              <span>SGST</span>
                              <span>₹{selectedOrder.sgstTotal}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {selectedOrder.igstTotal > 0 && (
                        <div className="ml-2 text-xs text-muted-foreground/80 border-l-2 border-border pl-2 flex justify-between">
                          <span>IGST</span>
                          <span>₹{selectedOrder.igstTotal}</span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                    <span>Total</span><span>₹{selectedOrder.finalAmount || selectedOrder.totalAmount || 0}</span>
                  </div>
                </div>

                {/* Coupon */}
                {selectedOrder.couponCode && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Tag className="h-3.5 w-3.5" /> Coupon applied: <span className="font-bold text-foreground">{selectedOrder.couponCode}</span>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div >
    </TooltipProvider >
  );
};

export default AdminOrders;
