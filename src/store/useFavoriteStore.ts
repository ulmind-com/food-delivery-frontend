import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FavoriteState {
  ids: string[];
  toggle: (id: string) => void;
  isFavorite: (id: string) => boolean;
  clear: () => void;
}

/**
 * Wishlist / "Fav" state.
 * Kept on the device — the backend has no wishlist endpoint, so this persists
 * to localStorage and stays in sync across every card that renders the product.
 */
export const useFavoriteStore = create<FavoriteState>()(
  persist(
    (set, get) => ({
      ids: [],

      toggle: (id) =>
        set((state) => ({
          ids: state.ids.includes(id)
            ? state.ids.filter((x) => x !== id)
            : [...state.ids, id],
        })),

      isFavorite: (id) => get().ids.includes(id),

      clear: () => set({ ids: [] }),
    }),
    { name: "foodie-favorites" }
  )
);
