"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { StatCard, SectionHead } from "@/components/ui";
import { MOCK_ANALYTICS, MOCK_ORDERS, MOCK_STORE, formatCOP } from "@/lib/data";
import { createClient } from "@/lib/supabase/client";

// Datos de prueba eliminados - conectar con Supabase notifications
type Activity = {
  dot: string; title: string; desc: string;
  time: string; amount: string; amountColor: string;
};
const activity: Activity[] = [];

export default function HomeSection() {
  const router = useRouter();
  const { stores, orders } = useAppStore();
  const [userName, setUserName] = useState<string>("");
  const a = MOCK_ANALYTICS;
  const activeStores = stores.filter(s => s.active);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (!u) return;
      const name =
        u.user_metadata?.name ||
        u.user_metadata?.full_name ||
        u.email?.split("@")[0] ||
        "Usuario";
      setUserName(name);
    });
  }, []);
  const activeOrders = orders.filter(o => o.status !== "entregada" && o.status !== "devolucion");
  const pendingOrders = orders.filter(o => o.status === "pendiente");

  return (
    <div>
      <SectionHead
        title={`Bienvenido de nuevo, ${userName || "..."}`}
        sub="Resumen de tus negocios · Domingo 22 Mar 2024"
        action={
          <Link href="/builder" className="btn-primary">+ Nueva tienda</Link>
        } />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="💰" value={formatCOP(a.ventasMes)} label="Ventas este mes" trend={a.ventasMes > 0 ? "↑ +18% vs anterior" : "Sin ventas aún"} glowColor="#7c5cfc" onClick={() => router.push("/dashboard/pagos")} />
        <StatCard icon="👁" value={a.visitasMes.toLocaleString("es-CO")} label="Visitas hoy" trend={a.visitasMes > 0 ? "↑ +234 desde ayer" : "Sin visitas aún"} glowColor="#06d6a0" onClick={() => router.push("/dashboard/analytics")} />
        <StatCard icon="📦" value={activeOrders.length.toString()} label="Órdenes activas" trend={pendingOrders.length > 0 ? `${pendingOrders.length} pendientes envío` : "Sin órdenes pendientes"} glowColor="#f43f8e" onClick={() => router.push("/dashboard/ordenes")} />
        <StatCard icon="📈" value={(a.conversion || 0).toFixed(1) + "%"} label="Tasa conversión" trend={a.conversion > 0 ? "↑ +0.4% esta semana" : "Sin conversiones aún"} glowColor="#fbbf24" onClick={() => router.push("/dashboard/analytics")} />
      </div>

      {/* My stores */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-black text-lg" style={{ fontFamily: "var(--font-syne)" }}>Mis tiendas</h2>
        <button onClick={() => router.push("/dashboard/tiendas")} className="text-xs font-semibold" style={{ color: "#7c5cfc" }}>Ver todas →</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Stores from Zustand */}
        {activeStores.slice(0, 2).map(store => (
          <div key={store.id} className="card card-hover overflow-hidden">
            <div className="h-36 relative overflow-hidden" style={{ background: `linear-gradient(135deg,${store.primaryColor},${store.secondaryColor})` }}>
              {/* Mini mockup */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[80%] h-[75%] rounded-lg overflow-hidden" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>
                  <div className="h-3 flex items-center gap-1 px-2" style={{ background: "rgba(0,0,0,0.15)" }}>
                    {["#ff5f57","#febc2e","#28c840"].map(c => <span key={c} className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />)}
                  </div>
                  <div className="grid grid-cols-3 gap-1 p-1">
                    {[...Array(6)].map((_,i) => <div key={i} className="h-6 rounded" style={{ background: "rgba(255,255,255,0.15)" }} />)}
                  </div>
                </div>
              </div>
              <div className="absolute bottom-2 left-3 px-2 py-0.5 rounded text-[10px] font-bold text-white" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" }}>
                tutienda.com/{store.slug}
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="font-black text-sm" style={{ fontFamily: "var(--font-syne)" }}>{store.name}</span>
                <span className="badge badge-green">Activa</span>
              </div>
              <p className="text-xs mb-3" style={{ color: "#8884aa" }}>{store.products.length} productos · 0 visitas hoy · $0 esta semana</p>
              <div className="flex gap-2 flex-wrap">
                <Link href={`/store/${store.slug}`} className="btn-sm">Ver tienda →</Link>
                <button onClick={() => router.push("/dashboard/productos")} className="btn-sm">Productos</button>
                <button onClick={() => router.push("/dashboard/ordenes")} className="btn-sm">Órdenes</button>
                <button onClick={() => router.push("/dashboard/analytics")} className="btn-sm">Analytics</button>
              </div>
            </div>
          </div>
        ))}
        
        {/* New store */}
        {activeStores.length < 2 && (
          <Link href="/builder"
            className="card flex flex-col items-center justify-center gap-3 p-8 cursor-pointer transition-all duration-300 min-h-[240px] group"
            style={{ border: "2px dashed rgba(255,255,255,0.1)" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(124,92,252,0.4)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl text-purple-300 font-light transition-all duration-300 group-hover:scale-110 group-hover:rotate-6"
              style={{ background: "rgba(124,92,252,0.12)", border: "1px solid rgba(124,92,252,0.2)" }}>+</div>
            <p className="font-bold text-sm" style={{ color: "#8884aa" }}>Crear nueva tienda</p>
            <p className="text-xs text-center" style={{ color: "#3d3b5a" }}>Con el Agente Constructor IA</p>
          </Link>
        )}
      </div>

      {/* Activity */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-black text-lg" style={{ fontFamily: "var(--font-syne)" }}>Actividad reciente</h2>
        <button onClick={() => router.push("/dashboard/ordenes")} className="text-xs font-semibold" style={{ color: "#7c5cfc" }}>Ver todas →</button>
      </div>
      <div className="flex flex-col gap-2">
        {activity.map((a, i) => (
          <div key={i} className="flex items-center gap-3 p-4 rounded-xl transition-all duration-200"
            style={{ background: "#161622", border: "1px solid rgba(255,255,255,0.06)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#1e1e2e"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#161622"; }}>
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${a.dot}`}
              style={{ boxShadow: `0 0 8px currentColor` }} />
            <div className="flex-1 min-w-0">
              <span className="font-bold text-sm">{a.title}</span>
              <span className="text-sm ml-1" style={{ color: "#8884aa" }}>· {a.desc}</span>
              <div className="text-xs mt-0.5" style={{ color: "#3d3b5a" }}>{a.time}</div>
            </div>
            <span className="text-sm font-black flex-shrink-0" style={{ fontFamily: "var(--font-syne)", color: a.amountColor }}>{a.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
