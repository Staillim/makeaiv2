"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Check } from "lucide-react";

const PLANS = [
  { key:"free", label:"Gratis",  price:"$0",       sub:"Para empezar", color:"#8884aa", features:["1 tienda","20 productos","Constructor básico"] },
  { key:"pro",  label:"Pro",     price:"$89.000",  sub:"COP/mes",      color:"#7c5cfc", features:["Tiendas ilimitadas","3 Agentes IA","Analytics avanzado"], popular:true },
];

const PW_CHECKS = [
  { label:"8+ caracteres", fn:(p:string) => p.length >= 8 },
  { label:"Una mayúscula",  fn:(p:string) => /[A-Z]/.test(p) },
  { label:"Un número",      fn:(p:string) => /[0-9]/.test(p) },
];

export default function RegistroPage() {
  const router   = useRouter();
  const supabase = createClient();

  const [step,     setStep]     = useState<1|2>(1);
  const [plan,     setPlan]     = useState<"free"|"pro">("free");
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState<Record<string,string>>({});
  const [agreed,   setAgreed]   = useState(false);
  const [success,  setSuccess]  = useState(false);

  const pwStrength = PW_CHECKS.filter(c => c.fn(password)).length;
  const strengthColors = ["#fca5a5","#fde68a","#fde68a","#6ee7b7"];

  function validate() {
    const e: Record<string,string> = {};
    if (!name.trim())       e.name     = "El nombre es requerido";
    if (!email.includes("@")) e.email  = "Email inválido";
    if (pwStrength < 2)     e.password = "Contraseña muy débil";
    if (password !== confirm) e.confirm = "Las contraseñas no coinciden";
    if (!agreed)            e.agreed   = "Debes aceptar los términos";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) setStep(2);
  }

  async function handleStep2(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, plan },
          emailRedirectTo: `${location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error("Supabase signup error:", error);
        setErrors({ submit: error.message });
        setLoading(false);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      console.error("Network error:", err);
      setErrors({ submit: "Error de conexión. Verifica tu conexión a internet y las variables de entorno." });
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#050508" }}>
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-6">📬</div>
          <h2 className="text-3xl font-black mb-3" style={{ fontFamily: "var(--font-syne)" }}>Revisa tu email</h2>
          <p className="text-sm leading-relaxed mb-8" style={{ color: "#8884aa" }}>
            Te enviamos un enlace de confirmación a <strong style={{ color: "#c4b5fd" }}>{email}</strong>. Haz clic en el enlace para activar tu cuenta.
          </p>
          <Link href="/login" className="btn-primary inline-flex">Ir al login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#050508" }}>
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative overflow-y-auto">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-96 h-96 rounded-full -top-20 -right-20 opacity-25" style={{ background: "radial-gradient(circle,#f43f8e,transparent)", filter: "blur(80px)" }} />
          <div className="absolute w-72 h-72 rounded-full bottom-0 left-0 opacity-20" style={{ background: "radial-gradient(circle,#7c5cfc,transparent)", filter: "blur(80px)" }} />
        </div>

        <div className="relative z-10 w-full max-w-sm">
          <Link href="/" className="inline-block mb-8">
            <span className="text-2xl font-black gradient-text" style={{ fontFamily: "var(--font-syne)" }}>Maket AI</span>
          </Link>

          {/* Steps */}
          <div className="flex items-center gap-2 mb-8">
            {[1,2].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300"
                  style={{ background: step >= s ? "linear-gradient(135deg,#7c5cfc,#f43f8e)" : "#1e1e2e", color: step >= s ? "#fff" : "#8884aa", border: step >= s ? "none" : "1px solid rgba(255,255,255,0.1)" }}>
                  {step > s ? <Check size={12} /> : s}
                </div>
                <span className="text-xs font-semibold" style={{ color: step === s ? "#f1f0ff" : "#8884aa" }}>{s === 1 ? "Tu cuenta" : "Tu plan"}</span>
                {s < 2 && <div className="w-8 h-px mx-1" style={{ background: step > s ? "#7c5cfc" : "rgba(255,255,255,0.1)" }} />}
              </div>
            ))}
          </div>

          {step === 1 ? (
            <>
              <h1 className="text-3xl font-black mb-1" style={{ fontFamily: "var(--font-syne)" }}>Crea tu cuenta</h1>
              <p className="text-sm mb-7" style={{ color: "#8884aa" }}>
                ¿Ya tienes cuenta? <Link href="/login" className="font-semibold hover:text-white" style={{ color: "#a78bfa" }}>Inicia sesión</Link>
              </p>
              <form onSubmit={handleStep1} className="flex flex-col gap-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: "#8884aa" }}>Nombre completo</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#3d3b5a" }} />
                    <input value={name} onChange={e => { setName(e.target.value); setErrors(x=>({...x,name:""})); }} placeholder="Juan Díaz"
                      className="input-field pl-10 w-full" style={{ borderColor: errors.name ? "rgba(252,165,165,0.4)" : undefined }} />
                  </div>
                  {errors.name && <p className="text-[11px] mt-1" style={{ color: "#fca5a5" }}>{errors.name}</p>}
                </div>
                {/* Email */}
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: "#8884aa" }}>Email</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#3d3b5a" }} />
                    <input type="email" value={email} onChange={e => { setEmail(e.target.value); setErrors(x=>({...x,email:""})); }} placeholder="tu@email.com"
                      className="input-field pl-10 w-full" style={{ borderColor: errors.email ? "rgba(252,165,165,0.4)" : undefined }} />
                  </div>
                  {errors.email && <p className="text-[11px] mt-1" style={{ color: "#fca5a5" }}>{errors.email}</p>}
                </div>
                {/* Password */}
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: "#8884aa" }}>Contraseña</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#3d3b5a" }} />
                    <input type={showPw?"text":"password"} value={password} onChange={e => { setPassword(e.target.value); setErrors(x=>({...x,password:""})); }} placeholder="••••••••"
                      className="input-field pl-10 pr-10 w-full" style={{ borderColor: errors.password ? "rgba(252,165,165,0.4)" : undefined }} />
                    <button type="button" onClick={() => setShowPw(s=>!s)} className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: "#3d3b5a" }}>
                      {showPw ? <EyeOff size={14}/> : <Eye size={14}/>}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1.5">
                        {[1,2,3].map(i => <div key={i} className="flex-1 h-1 rounded-full transition-all" style={{ background: pwStrength>=i ? strengthColors[pwStrength] : "rgba(255,255,255,0.08)" }}/>)}
                      </div>
                      <div className="flex gap-3 flex-wrap">
                        {PW_CHECKS.map(c => <span key={c.label} className="flex items-center gap-1 text-[10px]" style={{ color: c.fn(password)?"#6ee7b7":"#8884aa" }}><span>{c.fn(password)?"✓":"○"}</span>{c.label}</span>)}
                      </div>
                    </div>
                  )}
                  {errors.password && <p className="text-[11px] mt-1" style={{ color: "#fca5a5" }}>{errors.password}</p>}
                </div>
                {/* Confirm */}
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: "#8884aa" }}>Confirmar contraseña</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#3d3b5a" }} />
                    <input type={showPw?"text":"password"} value={confirm} onChange={e => { setConfirm(e.target.value); setErrors(x=>({...x,confirm:""})); }} placeholder="••••••••"
                      className="input-field pl-10 w-full" style={{ borderColor: errors.confirm?"rgba(252,165,165,0.4)":confirm&&confirm===password?"rgba(6,214,160,0.4)":undefined }} />
                    {confirm && confirm===password && <Check size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: "#6ee7b7" }}/>}
                  </div>
                  {errors.confirm && <p className="text-[11px] mt-1" style={{ color: "#fca5a5" }}>{errors.confirm}</p>}
                </div>
                {/* Terms */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <div className="relative flex-shrink-0 mt-0.5">
                    <input type="checkbox" checked={agreed} onChange={e => { setAgreed(e.target.checked); setErrors(x=>({...x,agreed:""})); }} className="sr-only"/>
                    <div className="w-[18px] h-[18px] rounded-md border transition-all flex items-center justify-center"
                      style={{ background: agreed?"linear-gradient(135deg,#7c5cfc,#f43f8e)":"#1e1e2e", borderColor: agreed?"transparent":errors.agreed?"rgba(252,165,165,0.5)":"rgba(255,255,255,0.15)" }}>
                      {agreed && <Check size={10} color="white"/>}
                    </div>
                  </div>
                  <span className="text-xs leading-relaxed" style={{ color: "#8884aa" }}>
                    Acepto los <a href="#" className="font-semibold" style={{ color: "#a78bfa" }}>Términos</a> y <a href="#" className="font-semibold" style={{ color: "#a78bfa" }}>Privacidad</a>
                  </span>
                </label>
                {errors.agreed && <p className="text-[11px] -mt-2" style={{ color: "#fca5a5" }}>{errors.agreed}</p>}
                <button type="submit" className="btn-primary py-3 flex items-center justify-center gap-2 mt-1">
                  Continuar <ArrowRight size={15}/>
                </button>
              </form>
            </>
          ) : (
            <form onSubmit={handleStep2}>
              <h1 className="text-3xl font-black mb-1" style={{ fontFamily: "var(--font-syne)" }}>Elige tu plan</h1>
              <p className="text-sm mb-7" style={{ color: "#8884aa" }}>Empieza gratis. Cambia cuando quieras.</p>
              <div className="flex flex-col gap-3 mb-6">
                {PLANS.map(p => (
                  <button key={p.key} type="button" onClick={() => setPlan(p.key as "free"|"pro")}
                    className="text-left p-4 rounded-2xl transition-all duration-200 relative overflow-hidden"
                    style={{ background: plan===p.key?`linear-gradient(135deg,${p.color}18,${p.color}08)`:"#161622", border: `2px solid ${plan===p.key?p.color+"55":"rgba(255,255,255,0.06)"}` }}>
                    {p.popular && <div className="absolute top-3 right-3 text-[9px] font-black px-2 py-0.5 rounded-full" style={{ background: "linear-gradient(135deg,#7c5cfc,#f43f8e)", color: "#fff" }}>POPULAR</div>}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                        style={{ borderColor: plan===p.key?p.color:"rgba(255,255,255,0.2)", background: plan===p.key?p.color:"transparent" }}>
                        {plan===p.key && <div className="w-2 h-2 rounded-full bg-white"/>}
                      </div>
                      <span className="font-black text-base" style={{ fontFamily: "var(--font-syne)" }}>{p.label}</span>
                      <span className="font-black ml-auto" style={{ fontFamily: "var(--font-syne)", color: p.color }}>{p.price}</span>
                    </div>
                    <div className="flex gap-3 flex-wrap pl-8">
                      {p.features.map(f => <span key={f} className="text-[10px] font-semibold flex items-center gap-1" style={{ color: "#8884aa" }}><span style={{ color: p.color }}>✓</span>{f}</span>)}
                    </div>
                  </button>
                ))}
              </div>
              <div className="p-4 rounded-2xl mb-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: "#3d3b5a" }}>Resumen</div>
                <div className="flex justify-between text-sm mb-1"><span style={{ color: "#8884aa" }}>Cuenta</span><span className="font-semibold truncate max-w-[180px]">{email}</span></div>
                <div className="flex justify-between text-sm"><span style={{ color: "#8884aa" }}>Plan</span><span className="font-bold" style={{ color: plan==="pro"?"#c4b5fd":"#8884aa" }}>{plan==="pro"?"Pro — $89.000/mes":"Gratis — $0"}</span></div>
              </div>
              {errors.submit && <div className="text-xs px-3 py-2.5 rounded-xl mb-4" style={{ background: "rgba(252,165,165,0.1)", border: "1px solid rgba(252,165,165,0.25)", color: "#fca5a5" }}>{errors.submit}</div>}
              <button type="submit" disabled={loading} className="btn-primary py-3 flex items-center justify-center gap-2 w-full disabled:opacity-60">
                {loading ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"/>Creando cuenta...</> : <>Crear cuenta y entrar <ArrowRight size={15}/></>}
              </button>
              <button type="button" onClick={() => setStep(1)} className="w-full text-center text-sm mt-3 py-2 transition-colors" style={{ color: "#8884aa", background: "transparent", border: "none", cursor: "pointer" }}
                onMouseEnter={e => (e.currentTarget.style.color="#f1f0ff")} onMouseLeave={e => (e.currentTarget.style.color="#8884aa")}>
                ← Volver
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="hidden lg:flex flex-col justify-center w-[480px] flex-shrink-0 p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(145deg,#0e0e16,#161622)", borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-80 h-80 rounded-full -top-20 left-0 opacity-40" style={{ background: "radial-gradient(circle,#f43f8e,transparent)", filter: "blur(80px)" }}/>
          <div className="absolute w-60 h-60 rounded-full bottom-0 right-0 opacity-30" style={{ background: "radial-gradient(circle,#7c5cfc,transparent)", filter: "blur(70px)" }}/>
        </div>
        <div className="relative z-10">
          <div className="text-5xl mb-6">🚀</div>
          <h2 className="text-4xl font-black leading-tight mb-4" style={{ fontFamily: "var(--font-syne)" }}>
            Empieza a vender<br /><span className="gradient-text">hoy mismo.</span>
          </h2>
          <p className="text-sm leading-relaxed mb-10" style={{ color: "#8884aa" }}>En menos de 10 minutos tendrás tu tienda lista para recibir pedidos.</p>
          <div className="flex flex-col gap-4">
            {[["01","Habla con el Agente Constructor","#7c5cfc"],["02","Ve tu tienda crearse en vivo","#a855f7"],["03","Publica con un solo clic","#f43f8e"],["04","La IA vende por ti 24/7","#06d6a0"]].map(([n,text,color]) => (
              <div key={n} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0" style={{ background: `${color}22`, color, border: `1px solid ${color}33` }}>{n}</div>
                <span className="text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
