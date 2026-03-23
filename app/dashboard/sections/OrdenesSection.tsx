"use client";
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { SectionHead, OrderBadge, EmptyState } from "@/components/ui";
import { Search, Download, ChevronDown } from "lucide-react";
import { formatCOP } from "@/lib/data";
import type { Order, OrderStatus } from "@/types";

// KPI_FILTERS ahora calcula valores dinámicamente desde orders
const KPI_FILTERS_BASE = [
  { key:"all",       label:"Total",       color:"#f1f0ff", icon:"📋", bg:"rgba(255,255,255,0.05)" },
  { key:"pendiente", label:"Pendientes",  color:"#fde68a", icon:"⏳", bg:"rgba(251,191,36,0.1)"  },
  { key:"preparando",label:"Preparando",  color:"#c4b5fd", icon:"📦", bg:"rgba(196,181,253,0.1)" },
  { key:"camino",    label:"En camino",   color:"#a78bfa", icon:"🚚", bg:"rgba(167,139,250,0.1)" },
  { key:"entregada", label:"Entregadas",  color:"#6ee7b7", icon:"✅", bg:"rgba(110,231,183,0.1)" },
  { key:"devolucion",label:"Devoluciones",color:"#fca5a5", icon:"↩️",bg:"rgba(252,165,165,0.1)" },
];

const STEPS = ["Pagada","Preparando","Enviada","Entregada"];
const STEP_IDX: Record<OrderStatus,number> = { pendiente:1, preparando:2, camino:3, entregada:4, devolucion:4 };

function OrderCard({ order }: { order: Order }) {
  const { updateOrder } = useAppStore();
  const [open, setOpen] = useState(false);
  const step = STEP_IDX[order.status] ?? 1;

  return (
    <div className="card overflow-hidden">
      <button className="w-full flex items-center justify-between px-5 py-3 text-left" style={{ background:"#1e1e2e" }} onClick={() => setOpen(x=>!x)}>
        <div className="flex items-center gap-3">
          <span className="font-black text-sm" style={{ fontFamily:"var(--font-syne)" }}>{order.order_number}</span>
          <OrderBadge status={order.status} />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs hidden sm:block" style={{ color:"#3d3b5a" }}>{new Date(order.created_at).toLocaleDateString()}</span>
          <ChevronDown size={14} color="#8884aa" style={{ transform:open?"rotate(180deg)":"", transition:"0.2s" }} />
        </div>
      </button>

      {open && (
        <div className="px-5 py-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                style={{ background:`linear-gradient(135deg,${order.client_grad_from},${order.client_grad_to})` }}>
                {order.client_initials}
              </div>
              <div>
                <div className="font-bold text-sm">{order.client_name}</div>
                <div className="text-xs mt-0.5" style={{ color:"#3d3b5a" }}>{order.client_phone}</div>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              {order.items.map((it,i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className="w-5 h-5 rounded flex-shrink-0" style={{ background:`linear-gradient(135deg,${it.gradientFrom},${it.gradientTo})` }} />
                  <span style={{ color:"#8884aa" }}>{it.productName} · {it.variant}</span>
                </div>
              ))}
            </div>
            <div className="text-right">
              <div className="font-black text-xl" style={{ fontFamily:"var(--font-syne)", color:order.total<0?"#fca5a5":"#c4b5fd" }}>
                {order.total<0?"-":""}{formatCOP(Math.abs(order.total))}
              </div>
              <div className="text-xs mt-1" style={{ color:"#8884aa" }}>{order.payment_method}</div>
              <div className="text-xs" style={{ color:"#3d3b5a" }}>📍 {order.address}</div>
            </div>
          </div>

          {/* Timeline */}
          <div className="flex items-end justify-between gap-4 pt-3 flex-wrap" style={{ borderTop:"1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-center gap-0 overflow-x-auto pb-1">
              {STEPS.map((s,i) => {
                const done=i+1<step, active=i+1===step;
                return (
                  <div key={s} className="flex items-center">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background:done?"#06d6a0":active?"#7c5cfc":"rgba(255,255,255,0.1)", boxShadow:active?"0 0 8px rgba(124,92,252,0.8)":done?"0 0 6px rgba(6,214,160,0.5)":"none", animation:active?"pulseDot 1.5s infinite":"none" }} />
                      <span className="text-[9px] whitespace-nowrap" style={{ color:active?"#c4b5fd":done?"#8884aa":"#3d3b5a", fontWeight:active?700:400 }}>{s}</span>
                    </div>
                    {i<STEPS.length-1 && (
                      <div className="h-0.5 w-8 md:w-12 mx-1 mb-3.5 rounded-full flex-shrink-0" style={{ background:done?"linear-gradient(90deg,#06d6a0,#0ea5e9)":"rgba(255,255,255,0.08)" }} />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2 flex-shrink-0 flex-wrap">
              {order.status==="pendiente"||order.status==="preparando"
                ? <button className="btn-sm" onClick={()=>updateOrder(order.id,"camino")}>Marcar enviada 🚚</button>
                : order.status==="camino"
                ? <button className="btn-sm" onClick={()=>updateOrder(order.id,"entregada")}>Marcar entregada ✅</button>
                : order.status==="devolucion"
                ? <button className="btn-sm" onClick={()=>updateOrder(order.id,"entregada")}>Aprobar reembolso</button>
                : <button className="btn-sm">Ver historial</button>}
              <button className="btn-sm">✉ Contactar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrdenesSection() {
  const { orders, orderFilter, setOrderFilter } = useAppStore();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");

  // Calcular KPI dinámicamente desde orders
  const KPI_FILTERS = KPI_FILTERS_BASE.map(k => ({
    ...k,
    val: k.key === "all" 
      ? orders.length 
      : orders.filter(o => o.status === k.key).length
  }));

  let filtered = orders.filter(o => {
    const statusOk = orderFilter==="all" || o.status===orderFilter;
    const q = search.toLowerCase();
    const searchOk = !q || o.order_number.toLowerCase().includes(q) || o.client_name.toLowerCase().includes(q) || o.items.some(i=>i.productName.toLowerCase().includes(q));
    return statusOk && searchOk;
  });
  if (sort==="newest")  filtered=[...filtered].sort((a,b)=>b.order_number.localeCompare(a.order_number));
  if (sort==="oldest")  filtered=[...filtered].sort((a,b)=>a.order_number.localeCompare(b.order_number));
  if (sort==="highest") filtered=[...filtered].sort((a,b)=>Math.abs(b.total)-Math.abs(a.total));
  if (sort==="lowest")  filtered=[...filtered].sort((a,b)=>Math.abs(a.total)-Math.abs(b.total));

  const totalOrders = orders.length;
  const activeStoreName = orders.length > 0 ? "Mi Tienda" : "";

  return (
    <div>
      <SectionHead title="Órdenes" sub="Gestiona los pedidos de tus tiendas"
        action={<button className="btn-primary" onClick={()=>alert("Exportando CSV...")}><Download size={13}/>Exportar CSV</button>} />

      {totalOrders > 0 && (
        <div className="flex gap-3 mb-5">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background:"rgba(124,92,252,0.1)", border:"2px solid rgba(124,92,252,0.35)" }}>
            <div className="w-8 h-8 rounded-xl flex-shrink-0" style={{ background:"linear-gradient(135deg,#667eea,#764ba2)" }} />
            <div><div className="font-bold text-sm">{activeStoreName}</div><div className="text-xs" style={{ color:"#8884aa" }}>{totalOrders} {totalOrders === 1 ? 'orden' : 'órdenes'}</div></div>
            <span className="badge badge-green ml-2">Activa</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-5">
        {KPI_FILTERS.map(k=>(
          <button key={k.key} onClick={()=>setOrderFilter(k.key)}
            className="p-3 rounded-xl text-center transition-all duration-200 relative overflow-hidden"
            style={{ background:orderFilter===k.key?k.bg:"#161622", border:`1px solid ${orderFilter===k.key?k.color+"44":"rgba(255,255,255,0.06)"}` }}>
            {orderFilter===k.key&&<div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background:"linear-gradient(90deg,#7c5cfc,#f43f8e)" }}/>}
            <div className="text-base mb-1">{k.icon}</div>
            <div className="text-xl font-black" style={{ fontFamily:"var(--font-syne)", color:k.color }}>{k.val}</div>
            <div className="text-[10px] mt-0.5 leading-tight" style={{ color:"#8884aa" }}>{k.label}</div>
          </button>
        ))}
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" color="#3d3b5a"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por cliente, #orden o producto..." className="input-field pl-9 rounded-full"/>
        </div>
        <select value={sort} onChange={e=>setSort(e.target.value)} className="select-field">
          <option value="newest">Más recientes</option>
          <option value="oldest">Más antiguas</option>
          <option value="highest">Mayor monto</option>
          <option value="lowest">Menor monto</option>
        </select>
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color:"#8884aa" }}>Mostrando {filtered.length} orden{filtered.length!==1?"es":""}</span>
        <span className="text-xs" style={{ color:"#3d3b5a" }}>Filtro: {KPI_FILTERS.find(k=>k.key===orderFilter)?.label??"Todas"}</span>
      </div>

      {filtered.length===0
        ? <EmptyState icon="📭" title="No hay órdenes" sub="Prueba con otro filtro"/>
        : <div className="flex flex-col gap-3">{filtered.map(o=><OrderCard key={o.id} order={o}/>)}</div>}
    </div>
  );
}
