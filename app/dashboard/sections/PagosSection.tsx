"use client";
import { SectionHead } from "@/components/ui";
import { formatCOP } from "@/lib/data";

// Datos de prueba eliminados - conectar con Supabase
type Transaction = {
  icon: string; color: string; bg: string; name: string;
  date: string; amount: string; amtColor: string;
};
const transactions: Transaction[] = [];

export default function PagosSection() {
  return (
    <div>
      <SectionHead title="Pagos" sub="Conecta tu cuenta bancaria · Configurar"/>
      <div className="card p-6 mb-5" style={{ background:"linear-gradient(135deg,rgba(124,92,252,0.12),rgba(244,63,142,0.08))", borderColor:"rgba(124,92,252,0.25)" }}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="text-sm mb-1" style={{ color:"#8884aa" }}>Balance disponible</div>
            <div className="text-5xl font-black tracking-tight" style={{ fontFamily:"var(--font-syne)", color:"#c4b5fd" }}>$0</div>
            <div className="text-sm mt-1" style={{ color:"#8884aa" }}>Disponible para retiro inmediato</div>
          </div>
          <div className="text-right">
            <div className="text-sm mb-1" style={{ color:"#8884aa" }}>En liquidación</div>
            <div className="text-2xl font-black" style={{ fontFamily:"var(--font-syne)", color:"#fde68a" }}>$0</div>
            <div className="text-xs mt-0.5" style={{ color:"#3d3b5a" }}>Disponible en 2-3 días hábiles</div>
          </div>
        </div>
        <div className="flex gap-3 mt-5 flex-wrap">
          <button className="btn-primary" onClick={()=>alert("Retiro de $0 solicitado ✓")}>Retirar todo</button>
          <button className="btn-ghost" onClick={()=>alert("Introduce el monto...")}>Retiro parcial</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { val:"$0", label:"Total este mes",       color:"#6ee7b7" },
          { val:"$0",  label:"Retirado este mes",    color:"#c4b5fd" },
          { val:"3.5%",        label:"Comisión plataforma",  color:"#fde68a" },
        ].map(s=>(
          <div key={s.label} className="card p-4">
            <div className="font-black text-xl" style={{ fontFamily:"var(--font-syne)", color:s.color }}>{s.val}</div>
            <div className="text-xs mt-1" style={{ color:"#8884aa" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="text-xs font-black uppercase tracking-wider mb-3" style={{ color:"#8884aa" }}>Transacciones recientes</div>
      <div className="flex flex-col gap-2">
        {transactions.map((t,i)=>(
          <div key={i} className="flex items-center gap-3 p-4 card transition-all duration-200"
            onMouseEnter={e=>(e.currentTarget.style.background="#1e1e2e")} onMouseLeave={e=>(e.currentTarget.style.background="")}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
              style={{ background:t.bg, color:t.color, border:`1px solid ${t.color}30` }}>{t.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{t.name}</div>
              <div className="text-xs mt-0.5" style={{ color:"#3d3b5a" }}>{t.date}</div>
            </div>
            <div className="font-black text-sm flex-shrink-0" style={{ fontFamily:"var(--font-syne)", color:t.amtColor }}>{t.amount}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
