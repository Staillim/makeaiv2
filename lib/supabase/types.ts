// ══════════════════════════════════════════════════════════════════════════
//  Supabase Database Types
//  Matches schema.sql — Update after running migrations
// ══════════════════════════════════════════════════════════════════════════

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
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
          stripe_customer_id: string | null;
          plan_expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Omit<Database["public"]["Tables"]["profiles"]["Row"], "id" | "created_at">>;
      };
      stores: {
        Row: {
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
        };
        Insert: Omit<
          Database["public"]["Tables"]["stores"]["Row"],
          "id" | "total_products" | "total_orders" | "total_revenue" | "created_at" | "updated_at"
        >;
        Update: Partial<Omit<Database["public"]["Tables"]["stores"]["Row"], "id" | "owner_id" | "created_at">>;
      };
      products: {
        Row: {
          id: string;
          store_id: string;
          name: string;
          sku: string;
          description: string;
          price: number;
          compare_price: number | null;
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
        };
        Insert: Omit<Database["public"]["Tables"]["products"]["Row"], "id" | "sales" | "created_at" | "updated_at">;
        Update: Partial<Omit<Database["public"]["Tables"]["products"]["Row"], "id" | "store_id" | "created_at">>;
      };
      orders: {
        Row: {
          id: string;
          store_id: string;
          order_number: string;
          status: "pendiente" | "preparando" | "camino" | "entregada" | "devolucion";
          client_name: string;
          client_email: string;
          client_phone: string;
          client_initials: string;
          client_grad_from: string;
          client_grad_to: string;
          items: Json;
          total: number;
          payment_method: string;
          address: string;
          notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["orders"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Database["public"]["Tables"]["orders"]["Row"], "id" | "store_id" | "created_at">>;
      };
      analytics_daily: {
        Row: {
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
        };
        Insert: Omit<Database["public"]["Tables"]["analytics_daily"]["Row"], "id" | "created_at">;
        Update: Partial<Omit<Database["public"]["Tables"]["analytics_daily"]["Row"], "id" | "store_id" | "date" | "created_at">>;
      };
      product_views: {
        Row: {
          id: string;
          product_id: string;
          store_id: string;
          viewed_at: string;
          session_id: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["product_views"]["Row"], "id" | "viewed_at">;
        Update: never;
      };
      cart_sessions: {
        Row: {
          id: string;
          store_id: string;
          session_id: string;
          items: Json;
          status: "open" | "converted" | "abandoned";
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["cart_sessions"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Database["public"]["Tables"]["cart_sessions"]["Row"], "id" | "store_id" | "session_id" | "created_at">>;
      };
      agent_conversations: {
        Row: {
          id: string;
          owner_id: string;
          store_id: string | null;
          agent_type: "constructor" | "admin" | "ventas";
          messages: Json;
          builder_config: Json | null;
          published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["agent_conversations"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Database["public"]["Tables"]["agent_conversations"]["Row"], "id" | "owner_id" | "created_at">>;
      };
      payments: {
        Row: {
          id: string;
          owner_id: string;
          store_id: string | null;
          type: "sale" | "withdrawal" | "refund" | "commission";
          amount: number;
          description: string;
          reference_id: string | null;
          status: "pending" | "completed" | "failed" | "reversed";
          payment_method: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["payments"]["Row"], "id" | "created_at">;
        Update: Partial<Omit<Database["public"]["Tables"]["payments"]["Row"], "id" | "owner_id" | "created_at">>;
      };
      invoices: {
        Row: {
          id: string;
          owner_id: string;
          invoice_number: string;
          plan: string;
          amount: number;
          status: "paid" | "pending" | "failed" | "void";
          period_start: string;
          period_end: string;
          pdf_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["invoices"]["Row"], "id" | "created_at">;
        Update: Partial<Omit<Database["public"]["Tables"]["invoices"]["Row"], "id" | "owner_id" | "created_at">>;
      };
      notifications: {
        Row: {
          id: string;
          owner_id: string;
          store_id: string | null;
          type: "new_order" | "low_stock" | "no_stock" | "refund" | "payment" | "system" | "ai_summary";
          title: string;
          body: string;
          data: Json | null;
          read: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["notifications"]["Row"], "id" | "created_at">;
        Update: Partial<Omit<Database["public"]["Tables"]["notifications"]["Row"], "id" | "owner_id" | "created_at">>;
      };
    };
    Views: {
      v_store_summary: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          slug: string;
          type: string;
          primary_color: string;
          secondary_color: string;
          active: boolean;
          total_products: number;
          total_orders: number;
          total_revenue: number;
          products_out_of_stock: number;
          products_low_stock: number;
          orders_pending: number;
          orders_in_transit: number;
          revenue_this_month: number;
          visits_today: number;
        };
      };
      v_top_products: {
        Row: {
          id: string;
          store_id: string;
          name: string;
          sku: string;
          price: number;
          stock: number;
          category: string;
          sales: number;
          active: boolean;
          gradient_from: string;
          gradient_to: string;
          views_total: number;
          conversion_rate: number;
        };
      };
      v_unread_notifications: {
        Row: {
          owner_id: string;
          unread_count: number;
        };
      };
    };
    Functions: {
      mark_notifications_read: {
        Args: { p_owner_id: string };
        Returns: void;
      };
      update_order_status: {
        Args: { p_order_id: string; p_status: string };
        Returns: void;
      };
      upsert_analytics: {
        Args: {
          p_store_id: string;
          p_date: string;
          p_visits?: number;
          p_revenue?: number;
          p_orders?: number;
          p_units?: number;
        };
        Returns: void;
      };
    };
  };
}
