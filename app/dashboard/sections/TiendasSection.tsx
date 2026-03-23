"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { SectionHead } from "@/components/ui";
import { MOCK_ANALYTICS, formatCOP } from "@/lib/data";

export default function TiendasSection() {
  const router = useRouter();
  const { stores } = useAppStore();
  const a = MOCK_ANALYTICS;
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const activeStores = stores.filter(s => s.active);
  const pausedStores = stores.filter(s => !s.active);

  function copyStoreLink(slug: string, storeId: string) {
    const url = typeof window !== "undefined" ? `${window.location.origin}/store/${slug}` : `/store/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(storeId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div>
      <SectionHead 
        title="Mis tiendas" 
        sub={`${activeStores.length} ${activeStores.length === 1 ? 'tienda activa' : 'tiendas activas'} · ${pausedStores.length} ${pausedStores.length === 1 ? 'pausada' : 'pausadas'}`}
        action={<Link href="/builder" className="btn-primary">+ Nueva tienda</Link>}
      />
      
      {stores.length === 0 ? (
        <Link href="/builder" className="card flex flex-col items-center justify-center gap-3 p-10 max-w-sm cursor-pointer transition-all duration-300 group"
          style={{ border:"2px dashed rgba(255,255,255,0.1)" }}
          onMouseEnter={e=>(e.currentTarget.style.borderColor="rgba(124,92,252,0.4)")} onMouseLeave={e=>(e.currentTarget.style.borderColor="rgba(255,255,255,0.1)")}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl text-purple-300 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6" style={{ background:"rgba(124,92,252,0.12)", border:"1px solid rgba(124,92,252,0.2)" }}>+</div>
          <p className="font-bold text-sm" style={{ color:"#8884aa" }}>Crear tu primera tienda</p>
          <p className="text-xs text-center" style={{ color:"#3d3b5a" }}>Con el Agente Constructor IA</p>
        </Link>
      ) : (
        <>
          {stores.map(store => (
            <div key={store.id} className="card overflow-hidden mb-6">
              <div className="h-44 relative" style={{ background:`linear-gradient(135deg,${store.primaryColor},${store.secondaryColor})` }}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-[70%] h-[78%] rounded-xl overflow-hidden" style={{ background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.15)", backdropFilter:"blur(4px)" }}>
                    <div className="h-4 flex items-center gap-1 px-3" style={{ background:"rgba(0,0,0,0.15)" }}>
                      {["#ff5f57","#febc2e","#28c840"].map(c=><span key={c} className="w-2 h-2 rounded-full" style={{ background:c }}/>)}
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 p-2">
                      {[...Array(6)].map((_,i)=><div key={i} className="h-8 rounded-lg" style={{ background:"rgba(255,255,255,0.15)" }}/>)}
                    </div>
                  </div>
                </div>
                {store.active && (
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background:"rgba(6,214,160,0.25)", border:"1px solid rgba(6,214,160,0.4)", backdropFilter:"blur(8px)" }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot"/>En vivo
                  </div>
                )}
                <div className="absolute bottom-3 left-4 px-2.5 py-1 rounded-lg text-xs font-bold text-white" style={{ background:"rgba(0,0,0,0.4)", backdropFilter:"blur(8px)" }}>tutienda.com/{store.slug}</div>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="font-black text-xl" style={{ fontFamily:"var(--font-syne)" }}>{store.name}</div>
                    <div className="text-sm mt-1" style={{ color:"#8884aa" }}>Creada {new Date(store.createdAt).toLocaleDateString('es-CO')} · {store.type}</div>
                  </div>
                  <span className={`badge ${store.active ? 'badge-green' : 'badge-gray'}`}>{store.active ? 'Activa' : 'Pausada'}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 p-4 rounded-xl" style={{ background:"#1e1e2e" }}>
                  {[
                    { val: store.products.length.toString(), label:"Productos", color:"#c4b5fd" },
                    { val: "0", label:"Visitas hoy", color:"#6ee7b7" },
                    { val: "0", label:"Órdenes", color:"#fde68a" },
                    { val: "0%", label:"Conversión", color:"#f9a8d4" },
                  ].map(s=>(
                    <div key={s.label} className="text-center">
                      <div className="font-black text-lg" style={{ fontFamily:"var(--font-syne)", color:s.color }}>{s.val}</div>
                      <div className="text-xs mt-0.5" style={{ color:"#8884aa" }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Link href={`/store/${store.slug}`} className="btn-sm">Ver tienda →</Link>
                  <button onClick={()=>copyStoreLink(store.slug, store.id)} className="btn-sm">{copiedId === store.id ? "✓ Copiado" : "📋 Compartir enlace"}</button>
                  <button onClick={()=>router.push("/dashboard/analytics")} className="btn-sm">Analytics</button>
                  <button onClick={()=>router.push("/dashboard/productos")} className="btn-sm">Productos</button>
                  <button onClick={()=>router.push("/dashboard/ordenes")} className="btn-sm">Órdenes</button>
                  <Link href="/builder" className="btn-sm">Editar diseño</Link>
                </div>
              </div>
            </div>
          ))}
          
          <Link href="/builder" className="card flex flex-col items-center justify-center gap-3 p-10 max-w-sm cursor-pointer transition-all duration-300 group"
            style={{ border:"2px dashed rgba(255,255,255,0.1)" }}
            onMouseEnter={e=>(e.currentTarget.style.borderColor="rgba(124,92,252,0.4)")} onMouseLeave={e=>(e.currentTarget.style.borderColor="rgba(255,255,255,0.1)")}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl text-purple-300 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6" style={{ background:"rgba(124,92,252,0.12)", border:"1px solid rgba(124,92,252,0.2)" }}>+</div>
            <p className="font-bold text-sm" style={{ color:"#8884aa" }}>Crear nueva tienda</p>
            <p className="text-xs text-center" style={{ color:"#3d3b5a" }}>Con el Agente Constructor IA</p>
          </Link>
        </>
      )}
    </div>
  );
}
