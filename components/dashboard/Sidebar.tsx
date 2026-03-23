"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  Home, Store, BarChart3, Package,
  ClipboardList, CreditCard, FileText, Settings, LogOut,
} from "lucide-react";

const NAV = [
  { href: "/dashboard",           label: "Dashboard",     icon: Home,          group: "Principal" },
  { href: "/dashboard/tiendas",   label: "Mis tiendas",   icon: Store,         group: "Principal" },
  { href: "/dashboard/analytics", label: "Analytics",     icon: BarChart3,     group: "Principal" },
  { href: "/dashboard/productos", label: "Productos",     icon: Package,       group: "Principal" },
  { href: "/dashboard/ordenes",   label: "Ordenes",       icon: ClipboardList, group: "Principal" },
  { href: "/dashboard/pagos",     label: "Pagos",         icon: CreditCard,    group: "Finanzas"  },
  { href: "/dashboard/facturas",  label: "Facturas",      icon: FileText,      group: "Finanzas"  },
  { href: "/dashboard/config",    label: "Configuracion", icon: Settings,      group: "Sistema"   },
];

const GROUPS = ["Principal", "Finanzas", "Sistema"];

interface SidebarProps { collapsed: boolean }

export default function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();
  const supabase = createClient();
  const router   = useRouter();
  const [user, setUser] = require("react").useState<any>(null);

  require("react").useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  return (
    <aside
      className={cn(
        "flex flex-col h-screen sticky top-0 transition-all duration-300 flex-shrink-0 border-r",
        collapsed ? "w-0 overflow-hidden" : "w-[230px]"
      )}
      style={{ background: "#0e0e16", borderColor: "rgba(255,255,255,0.06)" }}>

      <div className="px-6 py-5 border-b flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <Link href="/dashboard">
          <span className="text-xl font-black gradient-text cursor-pointer" style={{ fontFamily: "var(--font-syne)" }}>
            Maket AI
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-3 px-5 py-4 border-b flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#7c5cfc,#f43f8e)" }}>
          {user?.user_metadata?.name?.slice(0,2).toUpperCase() ?? user?.email?.slice(0,2).toUpperCase() ?? "??"}
        </div>
        <div className="min-w-0">
          <div className="font-bold text-sm truncate">{user?.user_metadata?.name ?? user?.email?.split("@")[0] ?? "Usuario"}</div>
          <div className="text-xs font-semibold" style={{ color: "#7c5cfc" }}>{user?.user_metadata?.plan === "pro" ? "Plan Pro ✨" : "Plan Gratis"}</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {GROUPS.map(group => {
          const items = NAV.filter(n => n.group === group);
          return (
            <div key={group} className="mb-4">
              <div className="text-[10px] font-black uppercase tracking-widest px-3 mb-1.5" style={{ color: "#3d3b5a" }}>{group}</div>
              {items.map(item => {
                const Icon = item.icon;
                const active = item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);
                return (
                  <Link key={item.href} href={item.href}
                    className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 mb-0.5 relative w-full", !active && "hover:bg-[#1e1e2e]")}
                    style={active ? { background: "linear-gradient(135deg,rgba(124,92,252,0.12),rgba(244,63,142,0.06))", color: "#c4b5fd" } : { color: "#8884aa" }}>
                    {active && <span className="absolute left-0 top-[20%] bottom-[20%] w-0.5 rounded-r" style={{ background: "linear-gradient(to bottom,#7c5cfc,#f43f8e)" }} />}
                    <Icon size={15} className={cn("flex-shrink-0", active ? "opacity-100" : "opacity-60")} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between px-3 py-2.5 rounded-xl mb-3"
          style={{ background: "rgba(124,92,252,0.1)", border: "1px solid rgba(124,92,252,0.2)" }}>
          <div>
            <div className="text-xs font-bold text-purple-300">Maket AI Pro</div>
            <div className="text-xs mt-0.5" style={{ color: "#8884aa" }}>$89.000/mes</div>
          </div>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: "rgba(6,214,160,0.12)", color: "#6ee7b7", border: "1px solid rgba(6,214,160,0.2)" }}>Activo</span>
        </div>
        <button
          onClick={async () => { await supabase.auth.signOut(); router.push("/login"); }}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200"
          style={{ color: "#8884aa", background: "transparent", border: "none", cursor: "pointer" }}
          onMouseEnter={e => { e.currentTarget.style.background = "#1e1e2e"; e.currentTarget.style.color = "#fca5a5"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#8884aa"; }}>
          <LogOut size={13} /> Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
