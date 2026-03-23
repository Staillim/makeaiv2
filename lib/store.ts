import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StoreLegacy, Order, BuilderConfig, Message } from "@/types";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  plan: "free" | "pro" | "business";
  initials: string;
  avatar: [string, string];
}

// ── App state ──────────────────────────────────────
interface AppState {
  // Auth
  user: AuthUser | null;
  login: (u: AuthUser) => void;
  logout: () => void;

  // Stores
  stores: StoreLegacy[];
  activeStoreId: string;
  setActiveStore: (id: string) => void;
  addStore: (store: StoreLegacy) => void;
  removeStore: (id: string) => void;
  updateOrder: (orderId: string, status: Order["status"]) => void;

  // Orders
  orders: Order[];
  orderFilter: string;
  setOrderFilter: (f: string) => void;

  // Builder
  builderConfig: BuilderConfig;
  setBuilderConfig: (cfg: Partial<BuilderConfig>) => void;
  resetBuilder: () => void;

  // Admin agent
  adminOpen: boolean;
  setAdminOpen: (o: boolean) => void;
  adminMessages: Message[];
  addAdminMessage: (m: Message) => void;
  clearAdminMessages: () => void;
}

const defaultBuilderConfig: BuilderConfig = {
  name: "",
  type: "ropa",
  primaryColor: "#7c5cfc",
  secondaryColor: "#f43f8e",
  columns: 3,
  style: "moderno",
  tagline: "",
  products: [],
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
  // Auth
  user: null,
  login: (u) => set({ user: u }),
  logout: () => set({ user: null }),

  // Stores
  stores: [],
  activeStoreId: "",
  setActiveStore: (id) => set({ activeStoreId: id }),
  addStore: (store) =>
    set((state) => ({ stores: [...state.stores, store] })),
  removeStore: (id) =>
    set((state) => ({ stores: state.stores.filter((s) => s.id !== id) })),
  updateOrder: (orderId, status) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId ? { ...o, status } : o
      ),
    })),

  // Orders
  orders: [],
  orderFilter: "all",
  setOrderFilter: (f) => set({ orderFilter: f }),

  // Builder
  builderConfig: defaultBuilderConfig,
  setBuilderConfig: (cfg) =>
    set((state) => ({ builderConfig: { ...state.builderConfig, ...cfg } })),
  resetBuilder: () => set({ builderConfig: defaultBuilderConfig }),

  // Admin agent
  adminOpen: false,
  setAdminOpen: (o) => set({ adminOpen: o }),
  adminMessages: [],
  addAdminMessage: (m) =>
    set((state) => ({ adminMessages: [...state.adminMessages, m] })),
  clearAdminMessages: () => set({ adminMessages: [] }),
    }),
    {
      name: "shopmind-storage",
      partialize: (state) => ({ stores: state.stores }),
    }
  )
);
