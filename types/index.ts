// ══════════════════════════════════════════════════════════════════════════
//  TYPES — Supabase Database Schema
// ══════════════════════════════════════════════════════════════════════════

// ── Profile (User) ─────────────────────────────────────────────────────────
export interface Profile {
  id: string;
  name: string;
  email: string;
  plan: "free" | "pro" | "business";
  avatar_from: string;
  avatar_to: string;
  notif_ventas: boolean;
  notif_stock: boolean;
  notif_reportes: boolean;
  notif_devoluciones: boolean;
  notif_ia: boolean;
  stripe_customer_id?: string;
  plan_expires_at?: string;
  created_at: string;
  updated_at: string;
}

// ── Store ──────────────────────────────────────────────────────────────────
export interface Store {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  tagline: string;
  type: "ropa" | "tech" | "food" | "beauty" | "hogar" | "general";
  primary_color: string;
  secondary_color: string;
  columns: number;
  style: "minimalista" | "moderno" | "organico" | "lujo";
  active: boolean;
  total_products: number;
  total_orders: number;
  total_revenue: number;
  created_at: string;
  updated_at: string;
}

// Legacy interface for backwards compatibility (camelCase)
export interface StoreLegacy {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  type: Store["type"];
  primaryColor: string;
  secondaryColor: string;
  columns: number;
  style: Store["style"];
  active: boolean;
  products: ProductLegacy[];
  createdAt: string;
}

// ── Product ────────────────────────────────────────────────────────────────
export interface Product {
  id: string;
  store_id: string;
  name: string;
  sku: string;
  description: string;
  price: number;
  compare_price?: number;
  stock: number;
  category: string;
  variants: string[];
  gradient_from: string;
  gradient_to: string;
  badge: string;
  active: boolean;
  sales: number;
  created_at: string;
  updated_at: string;
}

// Legacy interface for backwards compatibility
export interface ProductLegacy {
  id: string;
  storeId: string;
  name: string;
  sku: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  variants: string[];
  gradient: [string, string];
  badge?: string;
  active: boolean;
  sales: number;
}

// ── Order ──────────────────────────────────────────────────────────────────
export type OrderStatus =
  | "pendiente"
  | "preparando"
  | "camino"
  | "entregada"
  | "devolucion";

export interface OrderItem {
  productName: string;
  variant: string;
  gradientFrom: string;
  gradientTo: string;
}

export interface Order {
  id: string;
  store_id: string;
  order_number: string;
  status: OrderStatus;
  client_name: string;
  client_email: string;
  client_phone: string;
  client_initials: string;
  client_grad_from: string;
  client_grad_to: string;
  items: OrderItem[];
  total: number;
  payment_method: string;
  address: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

// Legacy interface for backwards compatibility
export interface OrderLegacy {
  id: string;
  storeId: string;
  number: string;
  status: OrderStatus;
  cliente: {
    name: string;
    email: string;
    phone: string;
    initials: string;
    gradient: [string, string];
  };
  items: Array<{
    productName: string;
    variant: string;
    gradient: [string, string];
  }>;
  total: number;
  metodo: string;
  direccion: string;
  fecha: string;
}

// ── Analytics ──────────────────────────────────────────────────────────────
export interface AnalyticsDaily {
  id: string;
  store_id: string;
  date: string;
  visits: number;
  revenue: number;
  orders_count: number;
  units_sold: number;
  funnel_views: number;
  funnel_cart: number;
  funnel_checkout: number;
  src_organic: number;
  src_social: number;
  src_direct: number;
  src_paid: number;
  created_at: string;
}

export interface DailyMetric {
  day: string;
  ventas: number;
  visitas: number;
}

export interface Analytics {
  ventasMes: number;
  visitasMes: number;
  unidadesVendidas: number;
  ticketPromedio: number;
  conversion: number;
  daily: DailyMetric[];
  funnel: { label: string; value: number; pct: number }[];
  sources: { label: string; pct: number; color: string }[];
  topProducts: {
    name: string;
    visitas: number;
    ventas: number;
    ingreso: number;
    conv: number;
  }[];
}

// ── Notifications ──────────────────────────────────────────────────────────
export type NotificationType =
  | "new_order"
  | "low_stock"
  | "no_stock"
  | "refund"
  | "payment"
  | "system"
  | "ai_summary";

export interface Notification {
  id: string;
  owner_id: string;
  store_id?: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  created_at: string;
}

// ── Payments ───────────────────────────────────────────────────────────────
export type PaymentType = "sale" | "withdrawal" | "refund" | "commission";
export type PaymentStatus = "pending" | "completed" | "failed" | "reversed";

export interface Payment {
  id: string;
  owner_id: string;
  store_id?: string;
  type: PaymentType;
  amount: number;
  description: string;
  reference_id?: string;
  status: PaymentStatus;
  payment_method?: string;
  created_at: string;
}

// ── Invoices ───────────────────────────────────────────────────────────────
export type InvoiceStatus = "paid" | "pending" | "failed" | "void";

export interface Invoice {
  id: string;
  owner_id: string;
  invoice_number: string;
  plan: string;
  amount: number;
  status: InvoiceStatus;
  period_start: string;
  period_end: string;
  pdf_url?: string;
  created_at: string;
}

// ── Agent Conversations ────────────────────────────────────────────────────
export type AgentType = "constructor" | "admin" | "ventas";

export interface AgentConversation {
  id: string;
  owner_id: string;
  store_id?: string;
  agent_type: AgentType;
  messages: Message[];
  builder_config?: BuilderConfig;
  published: boolean;
  created_at: string;
  updated_at: string;
}

// ── Product Views ──────────────────────────────────────────────────────────
export interface ProductView {
  id: string;
  product_id: string;
  store_id: string;
  viewed_at: string;
  session_id?: string;
}

// ── Cart Sessions ──────────────────────────────────────────────────────────
export type CartStatus = "open" | "converted" | "abandoned";

export interface CartSession {
  id: string;
  store_id: string;
  session_id: string;
  items: any[];
  status: CartStatus;
  created_at: string;
  updated_at: string;
}

// ── Chat ───────────────────────────────────────────
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// ── Builder config ────────────────────────────────
export interface BuilderProduct {
  n?: string; // short for name
  p?: string | number; // short for price  
  name?: string;
  price?: number;
  d?: string; // short for description
  description?: string;
}

export interface BuilderConfig {
  name: string;
  type: Store["type"];
  primaryColor: string;
  secondaryColor: string;
  columns: number;
  style: Store["style"];
  tagline: string;
  products: BuilderProduct[];
}
