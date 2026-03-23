"use client";
import { useState, useEffect } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import AdminAgent from "@/components/agents/AdminAgent";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { Bell, Menu } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { StoreLegacy, ProductLegacy } from "@/types";

const ROUTE_LABELS: Record<string, string> = {
  "/dashboard":            "Dashboard",
  "/dashboard/tiendas":    "Mis tiendas",
  "/dashboard/analytics":  "Analytics",
  "/dashboard/productos":  "Productos",
  "/dashboard/ordenes":    "Órdenes",
  "/dashboard/pagos":      "Pagos",
  "/dashboard/facturas":   "Facturas",
  "/dashboard/config":     "Configuración",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { setAdminOpen, user, setStores } = useAppStore();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [initials, setInitials] = useState("U");
  const title = ROUTE_LABELS[pathname] ?? "Dashboard";

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      const u = data.user;
      if (!u) return;

      // Set initials
      const name: string =
        u.user_metadata?.name ||
        u.user_metadata?.full_name ||
        u.email?.split("@")[0] ||
        "";
      const parts = name.trim().split(/\s+/);
      const derived =
        parts.length >= 2
          ? (parts[0][0] + parts[1][0]).toUpperCase()
          : name.slice(0, 2).toUpperCase();
      setInitials(derived || "U");

      // Load stores from Supabase
      const { data: storeRows } = await supabase
        .from("stores")
        .select("*, products(*)")
        .eq("owner_id", u.id)
        .order("created_at", { ascending: false });

      if (storeRows && storeRows.length > 0) {
        const mapped: StoreLegacy[] = storeRows.map((s: any) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          tagline: s.tagline,
          type: s.type,
          primaryColor: s.primary_color,
          secondaryColor: s.secondary_color,
          columns: s.columns,
          style: s.style,
          active: s.active,
          createdAt: s.created_at,
          products: (s.products || []).map((p: any): ProductLegacy => ({
            id: p.id,
            storeId: p.store_id,
            name: p.name,
            sku: p.sku,
            description: p.description,
            price: p.price,
            stock: p.stock,
            category: p.category,
            variants: p.variants || [],
            gradient: [p.gradient_from, p.gradient_to],
            badge: p.badge || "",
            active: p.active,
            sales: p.sales,
          })),
        }));
        setStores(mapped);
      }
    });
  }, []);

  return (
    <AuthGuard>
    <div className="flex h-screen overflow-hidden" style={{ background: "#050508" }}>

      <Sidebar collapsed={sidebarCollapsed} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Topbar */}
        <header
          className="flex items-center justify-between px-6 py-3 flex-shrink-0 sticky top-0 z-30"
          style={{
            background: "rgba(14,14,22,0.92)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            backdropFilter: "blur(20px)",
          }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarCollapsed(c => !c)}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
              style={{ background: "#1e1e2e", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Menu size={15} color="#8884aa" />
            </button>
            <span className="text-sm font-bold" style={{ color: "#8884aa", fontFamily: "var(--font-syne)" }}>
              {title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="w-9 h-9 rounded-xl flex items-center justify-center relative"
              style={{ background: "#1e1e2e", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Bell size={15} color="#8884aa" />
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                style={{ background: "#f43f8e", boxShadow: "0 0 6px #f43f8e", animation: "pulseDot 2s infinite" }} />
            </button>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black cursor-pointer"
              style={{ background: "linear-gradient(135deg,#7c5cfc,#f43f8e)", boxShadow: "0 0 0 2px rgba(255,255,255,0.1)" }}>
              {initials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-[1400px] mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* Admin agent FAB */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-1.5">
        <div className="relative">
          <button
            onClick={() => setAdminOpen(true)}
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl text-white relative z-10 transition-all duration-300"
            style={{
              background: "linear-gradient(135deg,#7c5cfc,#f43f8e)",
              boxShadow: "0 8px 24px rgba(124,92,252,0.5), 0 0 0 1px rgba(255,255,255,0.1)",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.1) rotate(-5deg)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; }}>
            🧑‍💼
          </button>
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ background: "linear-gradient(135deg,#7c5cfc,#f43f8e)", opacity: 0.4, animation: "fabPulse 2.5s ease-in-out infinite" }} />
        </div>
        <span className="text-[10px] font-bold" style={{ color: "#8884aa" }}>Agente Admin</span>
      </div>

      <AdminAgent />
    </div>
    </AuthGuard>
  );
}
