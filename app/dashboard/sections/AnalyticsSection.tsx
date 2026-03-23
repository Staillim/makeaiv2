"use client";
import { MOCK_ANALYTICS, formatCOP } from "@/lib/data";
import { SectionHead } from "@/components/ui";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { cn } from "@/lib/utils";

export default function AnalyticsSection() {
  const a = MOCK_ANALYTICS;
  const maxV = Math.max(...a.daily.map(d=>d.ventas));
  const maxVi = Math.max(...a.daily.map(d=>d.visitas));

  return (
    <div>
      <SectionHead title="Analytics" sub="Selecciona una tienda para ver estadísticas"
        action={<select className="select-field"><option>Últimos 7 días</option><option>Este mes</option><option>Último mes</option></select>}/>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { icon:"💰", val:formatCOP(a.ventasMes), label:"Ventas totales",       color:"#c4b5fd", trend:"↑ +18%" },
          { icon:"👁", val:a.visitasMes.toLocaleString("es-CO"), label:"Visitas", color:"#6ee7b7", trend:"↑ +9%" },
          { icon:"📦", val:a.unidadesVendidas.toString(), label:"Uds. vendidas",  color:"#f9a8d4", trend:"↑ +21%" },
          { icon:"🛒", val:formatCOP(a.ticketPromedio), label:"Ticket promedio",  color:"#fde68a", trend:"↑ +5%" },
        ].map(k=>(
          <div key={k.label} className="card p-4">
            <div className="text-lg mb-2">{k.icon}</div>
            <div className="text-2xl font-black tracking-tight mb-1" style={{ fontFamily:"var(--font-syne)", color:k.color }}>{k.val}</div>
            <div className="text-xs" style={{ color:"#8884aa" }}>{k.label}</div>
            <div className="text-xs font-bold mt-1" style={{ color:"#6ee7b7" }}>{k.trend}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {[
          { title:"Ventas 7 días", data:a.daily.map(d=>({...d,val:d.ventas})), color:"#7c5cfc", fmt:(v:number)=>formatCOP(v) },
          { title:"Visitas 7 días", data:a.daily.map(d=>({...d,val:d.visitas})), color:"#06d6a0", fmt:(v:number)=>v.toLocaleString() },
        ].map(chart=>(
          <div key={chart.title} className="card p-5">
            <div className="text-xs font-black uppercase tracking-wider mb-4" style={{ color:"#8884aa" }}>{chart.title}</div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={chart.data} barSize={28}>
                <XAxis dataKey="day" tick={{ fill:"#8884aa", fontSize:11 }} axisLine={false} tickLine={false}/>
                <Tooltip formatter={(v:number)=>[chart.fmt(v),chart.title]} contentStyle={{ background:"#1e1e2e", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, color:"#f1f0ff" }} cursor={false}/>
                <Bar dataKey="val" radius={[6,6,0,0]}>
                  {chart.data.map((d,i)=>(
                    <Cell key={i} fill={chart.color} fillOpacity={i===chart.data.length-2?1:0.5}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>

      {/* Funnel */}
      <div className="card p-5 mb-6">
        <div className="text-xs font-black uppercase tracking-wider mb-4" style={{ color:"#8884aa" }}>Embudo de conversión</div>
        <div className="flex flex-col gap-3">
          {a.funnel.map((f,i)=>{
            const colors=["linear-gradient(90deg,#7c5cfc,#a855f7)","linear-gradient(90deg,#a855f7,#f43f8e)","linear-gradient(90deg,#f43f8e,#fb923c)","linear-gradient(90deg,#06d6a0,#0ea5e9)"];
            return (
              <div key={f.label} className="flex items-center gap-4">
                <span className="text-xs w-40 flex-shrink-0" style={{ color:"#8884aa" }}>{f.label}</span>
                <div className="flex-1 h-5 rounded-lg overflow-hidden" style={{ background:"rgba(255,255,255,0.05)" }}>
                  <div className="h-full rounded-lg transition-all duration-700" style={{ width:`${f.pct}%`, background:colors[i] }}/>
                </div>
                <span className="text-sm font-bold w-20 text-right" style={{ color:"#f1f0ff" }}>{f.value.toLocaleString("es-CO")}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top products table */}
      <div className="card overflow-hidden mb-6">
        <div className="px-5 py-3.5" style={{ borderBottom:"1px solid rgba(255,255,255,0.06)", background:"#1e1e2e" }}>
          <div className="grid gap-3 text-[10px] font-black uppercase tracking-wider" style={{ gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr", color:"#8884aa" }}>
            <span>Producto</span><span>Visitas</span><span>Ventas</span><span>Ingreso</span><span>Conv.</span>
          </div>
        </div>
        {a.topProducts.map(p=>(
          <div key={p.name} className="grid gap-3 px-5 py-3.5 text-sm transition-all" style={{ gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr", borderTop:"1px solid rgba(255,255,255,0.04)" }}
            onMouseEnter={e=>(e.currentTarget.style.background="#1e1e2e")} onMouseLeave={e=>(e.currentTarget.style.background="")}>
            <span className="font-semibold truncate">{p.name}</span>
            <span style={{ color:"#8884aa" }}>{p.visitas.toLocaleString()}</span>
            <span style={{ color:"#8884aa" }}>{p.ventas}</span>
            <span className="font-bold" style={{ color:"#c4b5fd" }}>{formatCOP(p.ingreso)}</span>
            <span className={cn("font-bold", p.conv>=4?"text-emerald-400":p.conv>=3?"text-yellow-300":"text-red-400")}>{p.conv}%</span>
          </div>
        ))}
      </div>

      {/* Traffic sources */}
      <div>
        <div className="text-xs font-black uppercase tracking-wider mb-4" style={{ color:"#8884aa" }}>Fuentes de tráfico</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {a.sources.map(s=>(
            <div key={s.label} className="card p-4">
              <div className="text-2xl font-black mb-1" style={{ fontFamily:"var(--font-syne)", color:"#c4b5fd" }}>{s.pct}%</div>
              <div className="text-xs mb-3" style={{ color:"#8884aa" }}>{s.label}</div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,0.06)" }}>
                <div className="h-full rounded-full" style={{ width:`${s.pct}%`, background:s.color }}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
