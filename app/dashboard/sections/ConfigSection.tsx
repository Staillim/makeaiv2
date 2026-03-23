"use client";
import { SectionHead } from "@/components/ui";
import { useState } from "react";

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v:boolean)=>void }) {
  return (
    <button onClick={()=>onChange(!checked)}
      className="relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0"
      style={{ background:checked?"linear-gradient(135deg,#7c5cfc,#a855f7)":"rgba(255,255,255,0.08)", border:`1px solid ${checked?"rgba(124,92,252,0.5)":"rgba(255,255,255,0.1)"}` }}>
      <span className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300"
        style={{ left:checked?"calc(100% - 22px)":"2px" }}/>
    </button>
  );
}

export default function ConfigSection() {
  const [notifs, setNotifs] = useState({ ventas:true, stock:true, reportes:false, devoluciones:true, ia:true });
  const [twofa, setTwofa] = useState(false);

  return (
    <div>
      <SectionHead title="Configuración" sub="Cuenta y preferencias"
        action={<button className="btn-primary" onClick={()=>alert("Cambios guardados ✅")}>Guardar cambios</button>}/>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left */}
        <div className="flex flex-col gap-5">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest mb-4 pb-2" style={{ color:"#8884aa", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>Perfil</div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-14 h-14 rounded-full flex items-center justify-center font-black text-lg flex-shrink-0" style={{ background:"linear-gradient(135deg,#7c5cfc,#f43f8e)" }}>JD</div>
              <div className="flex-1"><div className="font-bold">Juan Díaz</div><div className="text-xs mt-0.5" style={{ color:"#8884aa" }}>Plan Pro · Miembro desde Ene 2024</div></div>
              <button className="btn-sm" onClick={()=>alert("Subiendo foto...")}>Cambiar foto</button>
            </div>
            {[
              { label:"Nombre completo", val:"Juan Díaz" },
              { label:"Email", val:"juan@email.com" },
              { label:"Teléfono", val:"+57 300 000 0000" },
            ].map(f=>(
              <div key={f.label} className="flex items-center justify-between py-3 gap-3" style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                <div className="text-sm"><div className="font-semibold">{f.label}</div></div>
                <input defaultValue={f.val} className="input-field text-sm" style={{ width:200, padding:"6px 12px" }}/>
              </div>
            ))}
          </div>

          <div>
            <div className="text-[10px] font-black uppercase tracking-widest mb-4 pb-2" style={{ color:"#8884aa", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>Seguridad</div>
            {[
              { label:"Contraseña",       sub:"Última actualización hace 45 días", action:<button className="btn-sm" onClick={()=>alert("Enlace enviado")}>Cambiar</button> },
              { label:"2FA",              sub:"Autenticación de dos factores",       action:<Toggle checked={twofa} onChange={setTwofa}/> },
              { label:"Sesiones activas", sub:"2 dispositivos conectados",           action:<button className="btn-danger" onClick={()=>alert("Otras sesiones cerradas")}>Cerrar otras</button> },
            ].map(row=>(
              <div key={row.label} className="flex items-center justify-between py-3 gap-3" style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                <div><div className="font-semibold text-sm">{row.label}</div><div className="text-xs mt-0.5" style={{ color:"#8884aa" }}>{row.sub}</div></div>
                {row.action}
              </div>
            ))}
          </div>
        </div>

        {/* Right */}
        <div className="flex flex-col gap-5">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest mb-4 pb-2" style={{ color:"#8884aa", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>Notificaciones</div>
            {[
              { key:"ventas",      label:"Nueva venta",          sub:"Email y push inmediato" },
              { key:"stock",       label:"Stock bajo (<5 uds)",  sub:"Antes de quedarte sin producto" },
              { key:"reportes",    label:"Reportes semanales",   sub:"Lunes 8am por email" },
              { key:"devoluciones",label:"Devoluciones",         sub:"Alerta al instante" },
              { key:"ia",          label:"Resumen IA diario",    sub:"Conversaciones del agente" },
            ].map(n=>(
              <div key={n.key} className="flex items-center justify-between py-3 gap-3" style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                <div><div className="font-semibold text-sm">{n.label}</div><div className="text-xs mt-0.5" style={{ color:"#8884aa" }}>{n.sub}</div></div>
                <Toggle checked={notifs[n.key as keyof typeof notifs]} onChange={v=>setNotifs(x=>({...x,[n.key]:v}))}/>
              </div>
            ))}
          </div>

          <div>
            <div className="text-[10px] font-black uppercase tracking-widest mb-4 pb-2" style={{ color:"#8884aa", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>Plan activo</div>
            <div className="p-4 rounded-xl flex items-center justify-between flex-wrap gap-3" style={{ background:"rgba(124,92,252,0.1)", border:"1px solid rgba(124,92,252,0.25)" }}>
              <div>
                <div className="font-black" style={{ fontFamily:"var(--font-syne)" }}>Maket AI Pro ✨</div>
                <div className="text-xs mt-0.5" style={{ color:"#8884aa" }}>Tiendas ilimitadas · IA avanzada · 24/7</div>
              </div>
              <div className="font-black text-xl" style={{ fontFamily:"var(--font-syne)", color:"#c4b5fd" }}>$89.000/mes</div>
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              <button className="btn-sm" onClick={()=>alert("Gestión de plan...")}>Cambiar plan</button>
              <button className="btn-danger" onClick={()=>alert("Cerrando sesión...")}>Cerrar sesión</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
