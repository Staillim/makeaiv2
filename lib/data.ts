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

// ─── Visual templates per market type ─────────────────────────────────────────
export const STORE_TEMPLATES = {
  ropa: {
    pageBg: "#f7f7f5",         pageColor: "#111111",       pageMutedColor: "#888888",
    headerBg: "#111111",       headerColor: "#ffffff",     headerBorderColor: "#2a2a2a",  headerIsDark: true,
    heroBg: "linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%)",
    heroColor: "#ffffff",      heroSubColor: "rgba(255,255,255,0.65)",  heroIsDark: true,
    heroBtnRadius: "0px",
    cardBg: "#ffffff",         cardColor: "#111111",       cardBorder: "none",
    cardRadius: "2px",         cardPriceColor: "#111111",  btnRadius: "0px",
    navItems: ["Mujer", "Hombre", "Niños", "Sale", "Lookbook"],
    trustItems: [
      { label: "Tallas S a 3XL",   sub: "Para todos los cuerpos" },
      { label: "Cambios gratis",    sub: "30 días sin preguntas" },
      { label: "Envío express",     sub: "Llega en 24-48h" },
      { label: "4.9 / 5",          sub: "+5.000 reseñas verificadas" },
    ],
    footerBg: "#111111",       footerColor: "#ffffff",     footerSubColor: "rgba(255,255,255,0.5)",
  },
  tech: {
    pageBg: "#0f0f13",         pageColor: "#e0e0ec",       pageMutedColor: "rgba(224,224,236,0.45)",
    headerBg: "#16161e",       headerColor: "#e0e0ec",     headerBorderColor: "rgba(255,255,255,0.06)",  headerIsDark: true,
    heroBg: "linear-gradient(135deg, #0f0f13 0%, #1e1e2e 100%)",
    heroColor: "#ffffff",      heroSubColor: "rgba(255,255,255,0.5)",   heroIsDark: true,
    heroBtnRadius: "8px",
    cardBg: "#1a1a22",         cardColor: "#e0e0ec",       cardBorder: "1px solid rgba(255,255,255,0.07)",
    cardRadius: "12px",        cardPriceColor: "#ffffff",  btnRadius: "8px",
    navItems: ["Celulares", "Audio", "Computadores", "Gaming", "Accesorios"],
    trustItems: [
      { label: "Garantía 1 año",   sub: "Certificado oficial" },
      { label: "Pago en cuotas",   sub: "Hasta 12 meses sin interés" },
      { label: "Soporte 24/7",     sub: "Técnicos especializados" },
      { label: "Envío asegurado",  sub: "Tracking en tiempo real" },
    ],
    footerBg: "#0a0a10",       footerColor: "#e0e0ec",     footerSubColor: "rgba(224,224,236,0.5)",
  },
  food: {
    pageBg: "#faf7f3",         pageColor: "#2d1b06",       pageMutedColor: "#b5845a",
    headerBg: "#ffffff",       headerColor: "#2d1b06",     headerBorderColor: "#f5e6c8",  headerIsDark: false,
    heroBg: "linear-gradient(135deg, #f4a335 0%, #e06b10 100%)",
    heroColor: "#ffffff",      heroSubColor: "rgba(255,255,255,0.9)",   heroIsDark: true,
    heroBtnRadius: "50px",
    cardBg: "#ffffff",         cardColor: "#2d1b06",       cardBorder: "1px solid #f5e6c8",
    cardRadius: "16px",        cardPriceColor: "#c0570a",  btnRadius: "50px",
    navItems: ["Menú del día", "Combos", "Bebidas", "Postres", "Especiales"],
    trustItems: [
      { label: "Entrega en 30 min",    sub: "Caliente y fresco" },
      { label: "Ingredientes frescos", sub: "Del mercado al plato" },
      { label: "Orden desde $20.000",  sub: "Sin cobro adicional" },
      { label: "4.9 / 5 sabor",        sub: "+3.000 pedidos semanales" },
    ],
    footerBg: "#2d1b06",       footerColor: "#faf7f3",     footerSubColor: "rgba(255,255,255,0.5)",
  },
  beauty: {
    pageBg: "#fefcfb",         pageColor: "#2d1f1f",       pageMutedColor: "#c4899c",
    headerBg: "#ffffff",       headerColor: "#2d1f1f",     headerBorderColor: "#f7e8ee",  headerIsDark: false,
    heroBg: "linear-gradient(135deg, #fce4f0 0%, #f8d7e3 100%)",
    heroColor: "#5c1e3a",      heroSubColor: "#9b6a80",    heroIsDark: false,
    heroBtnRadius: "50px",
    cardBg: "#ffffff",         cardColor: "#2d1f1f",       cardBorder: "1px solid #f7e8ee",
    cardRadius: "20px",        cardPriceColor: "#c0204e",  btnRadius: "50px",
    navItems: ["Skincare", "Maquillaje", "Perfumes", "Kits", "Novedades"],
    trustItems: [
      { label: "100% genuino",              sub: "Marcas certificadas" },
      { label: "Dermat. probado",           sub: "Seguro para tu piel" },
      { label: "Envío en 24h",              sub: "Empaque premium" },
      { label: "Club de lealtad",           sub: "Acumula y canjea puntos" },
    ],
    footerBg: "#2d1f1f",       footerColor: "#fefcfb",     footerSubColor: "rgba(255,255,255,0.5)",
  },
  hogar: {
    pageBg: "#f8f5f0",         pageColor: "#2d2416",       pageMutedColor: "#a09070",
    headerBg: "#ffffff",       headerColor: "#2d2416",     headerBorderColor: "#ede7d9",  headerIsDark: false,
    heroBg: "linear-gradient(135deg, #8d7350 0%, #6b563a 100%)",
    heroColor: "#ffffff",      heroSubColor: "rgba(255,255,255,0.8)",   heroIsDark: true,
    heroBtnRadius: "8px",
    cardBg: "#ffffff",         cardColor: "#2d2416",       cardBorder: "1px solid #ede7d9",
    cardRadius: "10px",        cardPriceColor: "#6b563a",  btnRadius: "8px",
    navItems: ["Sala", "Dormitorio", "Cocina", "Jardín", "Iluminación"],
    trustItems: [
      { label: "Instalación incluida", sub: "En todas las ciudades" },
      { label: "Garantía 2 años",      sub: "Cobertura total" },
      { label: "Envío a domicilio",    sub: "Cuidamos tu pedido" },
      { label: "Asesoría gratis",      sub: "Diseñadores expertos" },
    ],
    footerBg: "#2d2416",       footerColor: "#f8f5f0",     footerSubColor: "rgba(255,255,255,0.5)",
  },
  general: {
    pageBg: "#f3f4f6",         pageColor: "#1a1a2e",       pageMutedColor: "#999999",
    headerBg: "#ffffff",       headerColor: "#1a1a2e",     headerBorderColor: "#e4e4e4",  headerIsDark: false,
    heroBg: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
    heroColor: "#ffffff",      heroSubColor: "rgba(255,255,255,0.8)",   heroIsDark: true,
    heroBtnRadius: "8px",
    cardBg: "#ffffff",         cardColor: "#1a1a2e",       cardBorder: "1px solid #e8e8e8",
    cardRadius: "12px",        cardPriceColor: "#1a1a2e",  btnRadius: "8px",
    navItems: ["Inicio", "Colección", "Ofertas", "Novedades", "Nosotros"],
    trustItems: [
      { label: "Envío gratis",  sub: "Desde $50.000" },
      { label: "Pago seguro",   sub: "SSL 256-bit" },
      { label: "Devoluciones",  sub: "30 días libres" },
      { label: "4.9 / 5",      sub: "+2.400 reseñas" },
    ],
    footerBg: "#1a1a2e",       footerColor: "#f3f4f6",     footerSubColor: "rgba(255,255,255,0.5)",
  },
} as const;

export type StoreTemplateKey = keyof typeof STORE_TEMPLATES;
export type StoreTemplate = (typeof STORE_TEMPLATES)[StoreTemplateKey];
