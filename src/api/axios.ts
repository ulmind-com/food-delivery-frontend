import axios from "axios";
import { toast } from "sonner";

const API_BASE_URL = "https://food-delivery-backend-0aib.onrender.com/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor – attach Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor – global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401) {
      localStorage.removeItem("auth_token");
      toast.error("Session Expired. Please login again.");
      window.location.href = "/";
    } else if (status === 500) {
      toast.error("Something went wrong. Please try again.");
    }
    return Promise.reject(error);
  }
);

export default api;

// ─── Auth ───────────────────────────────────
export const authApi = {
  login: (data: { email: string; password: string }) => api.post("/auth/login", data),
  register: (data: { name: string; email: string; password: string; mobile: string; address?: object }) =>
    api.post("/auth/register", data),
};

// ─── User ───────────────────────────────────
export const userApi = {
  getProfile: () => api.get("/users/profile"),
  updateProfile: (data: { name?: string; mobile?: string; address?: string; profileImage?: string }) => api.put("/users/profile", data),
  getAll: () => api.get("/users"),
  updateUser: (id: string, data: { role?: string; isActive?: boolean }) => api.put(`/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/users/${id}`),
  getAddresses: () => api.get("/users/addresses"),
  addAddress: (data: any) => api.post("/users/addresses", data),
  updateAddress: (id: string, data: any) => api.put(`/users/addresses/${id}`, data),
  deleteAddress: (id: string) => api.delete(`/users/addresses/${id}`),
  reverseGeocode: (lat: number, lng: number) =>
    api.get("/users/addresses/reverse-geocode", { params: { lat, lng } }),
  selectAddress: (data: { addressId?: string; address?: any }) => api.put("/users/addresses/select", data),
  getSelectedAddress: () => api.get("/users/addresses/select"),
};

// ─── Restaurant ─────────────────────────────
export const restaurantApi = {
  get: () => api.get("/restaurant"),
  update: (data: { isOpen?: boolean; name?: string; address?: string; deliveryRadius?: number; mobile?: string; logo?: string; gstIn?: string; fssaiLicense?: string }) =>
    api.put("/restaurant", data),
  setLocation: (data: { lat: number; lng: number; address?: string }) =>
    api.put("/restaurant/location", data),
  getVideos: () => api.get("/restaurant/videos"),
  addVideo: (data: { url: string }) => api.post("/restaurant/videos", data),
  deleteVideo: (index: number) => api.delete(`/restaurant/videos/${index}`),
};

// ─── Menu & Categories ──────────────────────
export const menuApi = {
  getCategories: () => api.get("/categories"),
  getMenu: (params?: { category?: string; type?: string; search?: string }) =>
    api.get("/menu", { params }),
  getCategoryById: (id: string) => api.get(`/categories/${id}`),
  getProductById: (id: string) => api.get(`/menu/${id}`),
  getAdminMenu: () => api.get("/menu/admin"),
  applyDiscount: (id: string, data: { percentage: number; duration: { hours: number; minutes: number } }) =>
    api.post(`/menu/${id}/discount`, data),
  removeDiscount: (id: string) => api.delete(`/menu/${id}/discount`),
};

// ─── Category Admin ─────────────────────────
export const categoryApi = {
  create: (data: { name: string; imageURL: string }) => api.post("/categories", data),
  update: (id: string, data: { name?: string; imageURL?: string }) => api.put(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

// ─── Cart (Server-Side) ─────────────────────
export const cartApi = {
  get: () => api.get("/cart"),
  getBill: () => api.get("/cart/bill"),
  add: (data: { productId: string; quantity: number }) => api.post("/cart", data),
  updateQty: (itemId: string, data: { quantity: number }) => api.put(`/cart/${itemId}`, data),
  removeItem: (itemId: string) => api.delete(`/cart/${itemId}`),
  clear: () => api.delete("/cart"),
  applyCoupon: (data: { code: string }) => api.post("/cart/coupon", data),
  removeCoupon: () => api.delete("/cart/coupon"),
  getRecommendations: () => api.get("/cart/recommendations"),
};

// ─── Orders ─────────────────────────────────
export const orderApi = {
  calcFee: (data: { lat: number; lng: number }) => api.post("/orders/calc-fee", data),
  placeOrder: (data: {
    items: Array<{ product: string; quantity: number; variant?: string; price: number }>;
    totalAmount: number;
    deliveryAddress?: string;
    address?: string;
    deliveryInstruction?: string;
    deliveryCoordinates?: { lat: number; lng: number };
    paymentMethod: "COD" | "ONLINE";
    discountApplied?: number;
    finalAmount?: number;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
  }) => api.post("/orders", data),
  getMyOrders: () => api.get("/orders/my-orders"),
  getOrderById: (id: string) => api.get(`/orders/${id}`),
  cancelOrder: (id: string, reason?: string) => api.post(`/orders/${id}/cancel`, { reason }),
};

// ─── Coupons ────────────────────────────────
export const couponApi = {
  validate: (data: { code: string; orderTotal: number }) => api.post("/coupons/validate", data),
  getAll: () => api.get("/coupons"),
  create: (data: {
    code: string;
    name?: string;
    description?: string;
    discountType: "PERCENTAGE" | "FLAT";
    discountAmount: number;
    discountPercent: number;
    minOrderValue?: number;
    usageLimit?: number;
    validFrom?: string;
    validUntil?: string;
  }) => api.post("/coupons", data),
  update: (id: string, data: {
    code?: string;
    name?: string;
    description?: string;
    isActive?: boolean;
    validFrom?: string;
    validUntil?: string;
  }) => api.put(`/coupons/${id}`, data),
  delete: (id: string) => api.delete(`/coupons/${id}`),
};

// ─── Reviews ────────────────────────────────
// ─── Reviews ────────────────────────────────
export const reviewApi = {
  add: (data: { orderId: string; rating: number; comment: string }) => api.post("/reviews", data),
  getStats: () => api.get("/reviews/stats"),
  getAdminReviews: () => api.get("/reviews/admin"),
  getMyReviews: () => api.get("/reviews/my-reviews"),
};

// ─── Payments ───────────────────────────────
export const paymentApi = {
  createOrder: (data: { amount: number; items?: any[]; deliveryAddress?: any; deliveryFee?: number }) =>
    api.post("/orders/payment/create", data),
};

// ─── Upload ─────────────────────────────────
export const uploadApi = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    return api.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  uploadMultipleImages: async (files: File[]) => {
    const uploadPromises = files.map((file) => uploadApi.uploadImage(file));
    const responses = await Promise.all(uploadPromises);
    return responses.map((res) => res.data.url as string);
  },
  uploadVideo: (file: File, onProgress?: (pct: number) => void) => {
    const formData = new FormData();
    formData.append("video", file);
    return api.post("/upload/video", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (e.total && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
      },
    });
  },
};

// ─── Admin ──────────────────────────────────
export const adminApi = {
  getDashboard: (params?: { startDate?: string; endDate?: string }) => api.get("/admin/dashboard", { params }),
  getOrders: () => api.get("/admin/orders"),
  getOrdersByStatus: (status: string) => api.get(`/admin/orders/${status}`),
  getAnalytics: (params?: { startDate?: string; endDate?: string }) => api.get("/admin/analytics", { params }),
  updateOrderStatus: (id: string, data: { status: string }) => api.put(`/admin/orders/${id}/status`, data),
  cancelOrder: (id: string) => api.put(`/admin/orders/${id}/status`, { status: "CANCELLED" }),
  updatePaymentStatus: (id: string, data: { paymentStatus: string }) => api.put(`/admin/orders/${id}/payment-status`, data),
  addMenuItem: (data: any) => api.post("/menu", data),
  updateMenuItem: (id: string, data: any) => api.put(`/menu/${id}`, data),
  deleteMenuItem: (id: string) => api.delete(`/menu/${id}`),
};

// ─── Chat ────────────────────────────────────
export const chatApi = {
  // User endpoints
  getOrCreateChat: () => api.get("/chat"),
  createNewChat: () => api.post("/chat/create"),
  sendMessage: (data: { text: string; images?: string[] }) => api.post("/chat/message", data),
  markRead: () => api.put("/chat/read"),

  // Admin endpoints
  getAllChats: () => api.get("/chat/admin/all"),
  getChatById: (chatId: string) => api.get(`/chat/admin/${chatId}`),
  adminReply: (chatId: string, data: { text: string; images?: string[] }) => api.post(`/chat/admin/${chatId}/message`, data),
  closeChat: (chatId: string) => api.put(`/chat/admin/${chatId}/close`),
  deleteChat: (chatId: string) => api.delete(`/chat/admin/${chatId}`),
};
