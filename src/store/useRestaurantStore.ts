import { create } from "zustand";

interface RestaurantInfo {
  _id?: string;
  name: string;
  address?: string;
  deliveryRadius?: number;
  isOpen: boolean;
}

interface RestaurantState {
  restaurant: RestaurantInfo | null;
  loading: boolean;
  setRestaurant: (data: RestaurantInfo) => void;
  setLoading: (v: boolean) => void;
}

export const useRestaurantStore = create<RestaurantState>((set) => ({
  restaurant: null,
  loading: true,
  setRestaurant: (data) => set({ restaurant: data, loading: false }),
  setLoading: (v) => set({ loading: v }),
}));
