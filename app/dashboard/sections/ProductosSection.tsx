"use client";
import { useState, useMemo } from "react";
import { SectionHead, EmptyState } from "@/components/ui";
import { Search, LayoutGrid, List, Plus } from "lucide-react";
import { MOCK_STORE, formatCOP } from "@/lib/data";
import type { Product } from "@/types";
import { cn, stockColor } from "@/lib/utils";

const CATEGORIES = ["all","ropa","calzado","accesorios"];

function StockBar({ stock, max=50 }: { stock:number, max?:number }) {
  const pct = Math.min((stock/max)*100,100);
  const color = stock===0?"#f43f8e":stock<=5?"#fbbf24":"#06d6a0";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,0.08)" }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width:`${pct}%`, background:color }}/>
      </div>
      <span className={cn("text-xs font-bold", stockColor(stock))}>{stock} uds</span>
    </div>
  );
}

function TableRow({ p }: { p:Product }) {
  return (
    <div className="grid gap-3 px-4 py-3.5 transition-all duration-200" style={{ gridTemplateColumns:"2fr .8fr 1fr .75fr .9fr .8fr", borderTop:"1px solid rgba(255,255,255,0.04)" }}
      onMouseEnter={e=>(e.currentTarget.style.background="#1e1e2e")} onMouseLeave={e=>(e.currentTarget.style.background="")}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl flex-shrink-0" style={{ background:`linear-gradient(135deg,${p.gradient[0]},${p.gradient[1]})` }}/>
        <div>
          <div className="font-semibold text-sm">{p.name}</div>
          <div className="text-xs mt-0.5" style={{ color:"#3d3b5a" }}>SKU: {p.sku} · {p.variants.join(", ")}</div>
        </div>
      </div>
      <div className="font-bold text-sm self-center" style={{ color:"#c4b5fd" }}>{formatCOP(p.price)}</div>
      <div className="self-center"><StockBar stock={p.stock}/></div>
      <div className="self-center"><div className="text-sm font-bold">{p.sales}</div><div className="text-xs" style={{ color:"#3d3b5a" }}>vendidos</div></div>
      <div className="self-center">
        <span className={cn("badge", p.stock===0?"badge-red":p.stock<=5?"badge-yellow":"badge-green")}>
          {p.stock===0?"Sin stock":p.stock<=5?"Stock bajo":"Activo"}
        </span>
      </div>
      <div className="flex items-center gap-1.5 self-center">
        <button className="btn-sm" onClick={()=>alert(`Editando ${p.name}...`)}>Editar</button>
        {p.stock<=5&&<button title="Reabastecer" className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all" style={{ background:"rgba(251,191,36,0.12)", border:"1px solid rgba(251,191,36,0.25)", color:"#fde68a" }} onClick={()=>alert("Reabasteciendo...")}>↺</button>}
      </div>
    </div>
  );
}

function ProductCard({ p }: { p:Product }) {
  return (
    <div className="card card-hover overflow-hidden">
      <div className="h-28 relative" style={{ background:`linear-gradient(135deg,${p.gradient[0]},${p.gradient[1]})` }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-xl" style={{ background:"rgba(255,255,255,0.25)", backdropFilter:"blur(4px)", border:"1px solid rgba(255,255,255,0.35)" }}/>
        </div>
        {p.stock===0&&<div className="absolute top-2 right-2 badge badge-red text-[10px]">Sin stock</div>}
        {p.stock>0&&p.stock<=5&&<div className="absolute top-2 right-2 badge badge-yellow text-[10px]">Stock bajo</div>}
        {p.badge&&p.stock>5&&<div className="absolute top-2 left-2 badge badge-purple text-[10px]">{p.badge}</div>}
      </div>
      <div className="p-3.5">
        <div className="font-bold text-sm mb-0.5">{p.name}</div>
        <div className="text-xs mb-2" style={{ color:"#3d3b5a" }}>{p.sku}</div>
        <div className="flex items-center justify-between mb-2">
          <span className="font-black text-base" style={{ fontFamily:"var(--font-syne)", color:"#c4b5fd" }}>{formatCOP(p.price)}</span>
        </div>
        <StockBar stock={p.stock}/>
        <div className="flex gap-1.5 mt-3">
          <button className="btn-sm flex-1" onClick={()=>alert(`Editando ${p.name}...`)}>Editar</button>
          <button className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all" style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)" }} onClick={()=>alert("Ver en tienda...")}>↗</button>
        </div>
      </div>
    </div>
  );
}

export default function ProductosSection() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [view, setView] = useState<"table"|"cards">("table");

  const products = MOCK_STORE.products;
  const stockOk  = products.filter(p=>p.stock>5).length;
  const stockLow = products.filter(p=>p.stock>0&&p.stock<=5).length;
  const stockOut = products.filter(p=>p.stock===0).length;

  const filtered = useMemo(()=>products.filter(p=>{
    const q=search.toLowerCase();
    const sOk=statusFilter==="all"||(statusFilter==="active"&&p.stock>5)||(statusFilter==="low"&&p.stock>0&&p.stock<=5)||(statusFilter==="out"&&p.stock===0);
    const cOk=catFilter==="all"||p.category===catFilter;
    const qOk=!q||p.name.toLowerCase().includes(q)||p.sku.toLowerCase().includes(q);
    return sOk&&cOk&&qOk;
  }),[products,search,statusFilter,catFilter]);

  const byCategory = CATEGORIES.slice(1).reduce<Record<string,Product[]>>((acc,c)=>({ ...acc,[c]:filtered.filter(p=>p.category===c) }),{});

  return (
    <div>
      <SectionHead title="Productos" sub="Gestiona el catálogo de tus tiendas"
        action={<button className="btn-primary" onClick={()=>alert("Agente Admin: ¿Qué producto quieres agregar?")}><Plus size={13}/>Agregar producto</button>}/>

      {/* Store selection - will be dynamic when connected to Supabase */}

      {/* Stock summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {[
          { label:"Con stock",  val:stockOk,       color:"#6ee7b7", border:"rgba(6,214,160,0.2)",   bg:"rgba(6,214,160,0.06)"   },
          { label:"Stock bajo", val:stockLow,       color:"#fde68a", border:"rgba(251,191,36,0.2)",  bg:"rgba(251,191,36,0.06)"  },
          { label:"Sin stock",  val:stockOut,       color:"#fca5a5", border:"rgba(244,63,142,0.2)",  bg:"rgba(244,63,142,0.06)"  },
          { label:"Total",      val:products.length,color:"#c4b5fd", border:"rgba(124,92,252,0.2)",  bg:"rgba(124,92,252,0.06)"  },
        ].map(s=>(
          <div key={s.label} className="rounded-xl p-4" style={{ background:s.bg, border:`1px solid ${s.border}` }}>
            <div className="text-3xl font-black" style={{ fontFamily:"var(--font-syne)", color:s.color }}>{s.val}</div>
            <div className="text-xs mt-1.5 mb-2" style={{ color:"#8884aa" }}>{s.label}</div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,0.08)" }}>
              <div className="h-full rounded-full" style={{ width:`${(s.val/products.length)*100}%`, background:s.color }}/>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 mb-5 flex-wrap items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" color="#3d3b5a"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nombre, SKU o categoría..." className="input-field pl-9 rounded-full"/>
        </div>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="select-field">
          <option value="all">Todos los estados</option>
          <option value="active">Con stock</option>
          <option value="low">Stock bajo</option>
          <option value="out">Sin stock</option>
        </select>
        <select value={catFilter} onChange={e=>setCatFilter(e.target.value)} className="select-field">
          <option value="all">Todas las categorías</option>
          {CATEGORIES.slice(1).map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
        </select>
        <div className="flex rounded-xl overflow-hidden" style={{ border:"1px solid rgba(255,255,255,0.08)" }}>
          {(["table","cards"] as const).map(v=>(
            <button key={v} onClick={()=>setView(v)}
              className="w-9 h-9 flex items-center justify-center transition-all duration-200"
              style={{ background:view===v?"linear-gradient(135deg,#7c5cfc,#a855f7)":"#1e1e2e", color:view===v?"#fff":"#8884aa" }}>
              {v==="table"?<LayoutGrid size={14}/>:<List size={14}/>}
            </button>
          ))}
        </div>
      </div>

      {filtered.length===0
        ? <EmptyState icon="📦" title="Sin resultados" sub="Prueba con otro filtro"/>
        : view==="cards"
          ? <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{filtered.map(p=><ProductCard key={p.id} p={p}/>)}</div>
          : (
            <div className="card overflow-hidden">
              <div className="grid gap-3 px-4 py-3" style={{ gridTemplateColumns:"2fr .8fr 1fr .75fr .9fr .8fr", background:"#1e1e2e" }}>
                {["Producto","Precio","Stock","Ventas","Estado","Acción"].map(h=>(
                  <span key={h} className="text-[10px] font-black uppercase tracking-wider" style={{ color:"#8884aa" }}>{h}</span>
                ))}
              </div>
              {CATEGORIES.slice(1).map(cat=>{
                const ps=byCategory[cat]??[];
                if(!ps.length) return null;
                return (
                  <div key={cat}>
                    <div className="flex items-center gap-2 px-4 py-2.5" style={{ background:"rgba(30,30,46,0.5)", borderTop:"1px solid rgba(255,255,255,0.04)" }}>
                      <span className="text-xs font-black uppercase tracking-wider" style={{ color:"#8884aa" }}>{cat.charAt(0).toUpperCase()+cat.slice(1)}</span>
                      <span className="text-xs" style={{ color:"#3d3b5a" }}>{ps.length} productos</span>
                    </div>
                    {ps.map(p=><TableRow key={p.id} p={p}/>)}
                  </div>
                );
              })}
            </div>
          )}
    </div>
  );
}
