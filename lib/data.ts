import type { StoreLegacy, Product, Order, Analytics } from "@/types";

// Datos de ejemplo vacíos - serán reemplazados por datos reales de Supabase
export const MOCK_STORE: StoreLegacy = {
  id: "ejemplo",
  name: "Mi Tienda",
  slug: "mi-tienda",
  tagline: "Tu eslogan aquí",
  type: "general",
  primaryColor: "#7c5cfc",
  secondaryColor: "#f43f8e",
  columns: 3,
  style: "moderno",
  active: false,
  createdAt: new Date().toISOString().split('T')[0],
  products: [],
};

export const MOCK_PRODUCTS: Product[] = [];

export const MOCK_ORDERS: Order[] = [];

export const MOCK_ANALYTICS: Analytics = {
  ventasMes: 0,
  visitasMes: 0,
  unidadesVendidas: 0,
  ticketPromedio: 0,
  conversion: 0,
  daily: [],
  funnel: [],
  sources: [],
  topProducts: [],
};

export function formatCOP(n: number) {
  return "$" + Math.abs(n).toLocaleString("es-CO");
}
