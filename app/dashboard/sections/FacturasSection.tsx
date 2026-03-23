"use client";
import { SectionHead } from "@/components/ui";
import { Download } from "lucide-react";

// Datos de prueba eliminados - conectar con Supabase
const facturas: Array<{num: string; date: string; amount: string}> = [];

export default function FacturasSection() {
  return (
    <div>
      <SectionHead title="Facturas" sub="Plan Pro · Facturación mensual"/>
      <div className="card p-5 mb-5 flex items-center justify-between flex-wrap gap-4" style={{ background:"linear-gradient(135deg,rgba(124,92,252,0.1),rgba(244,63,142,0.06))", borderColor:"rgba(124,92,252,0.2)" }}>
        <div>
          <div className="font-black text-base" style={{ fontFamily:"var(--font-syne)" }}>Maket AI Pro ✨</div>
          <div className="text-sm mt-0.5" style={{ color:"#8884aa" }}>Tiendas ilimitadas · IA avanzada · Soporte 24/7</div>
          <div className="text-xs mt-1.5 font-semibold" style={{ color:"#06d6a0" }}>Próxima facturación: 22 Abr 2024</div>
        </div>
        <div className="text-right">
          <div className="font-black text-2xl" style={{ fontFamily:"var(--font-syne)", color:"#c4b5fd" }}>$89.000/mes</div>
          <button className="btn-sm mt-2" onClick={()=>alert("Abriendo gestión de plan...")}>Cambiar plan</button>
        </div>
      </div>

      <div className="card p-4 mb-6 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-6 rounded flex items-center justify-center text-[10px] font-black text-white" style={{ background:"linear-gradient(135deg,#1a1a2e,#16213e)", border:"1px solid rgba(255,255,255,0.1)" }}>VISA</div>
          <div><div className="font-semibold text-sm">Visa •••• 4012</div><div className="text-xs" style={{ color:"#8884aa" }}>Expira 08/26</div></div>
        </div>
        <button className="btn-sm" onClick={()=>alert("Cambiando tarjeta...")}>Cambiar tarjeta</button>
      </div>

      <div className="text-xs font-black uppercase tracking-wider mb-3" style={{ color:"#8884aa" }}>Historial de facturas</div>
      <div className="flex flex-col gap-2">
        {facturas.map(f=>(
          <div key={f.num} className="card flex items-center gap-4 p-4 transition-all duration-200"
            onMouseEnter={e=>(e.currentTarget.style.background="#1e1e2e")} onMouseLeave={e=>(e.currentTarget.style.background="")}>
            <div className="text-xl flex-shrink-0">📄</div>
            <div className="flex-1">
              <div className="font-semibold text-sm">Factura #{f.num}</div>
              <div className="text-xs mt-0.5" style={{ color:"#8884aa" }}>{f.date} · Maket AI Pro · 1 mes</div>
            </div>
            <div className="font-bold text-sm" style={{ color:"#c4b5fd" }}>{f.amount}</div>
            <span className="badge badge-green">Pagada</span>
            <button className="btn-sm flex items-center gap-1" onClick={()=>alert(`Descargando ${f.num}.pdf...`)}><Download size={11}/>PDF</button>
          </div>
        ))}
      </div>
    </div>
  );
}
