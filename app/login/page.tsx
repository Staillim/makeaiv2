"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const supabase     = createClient();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(searchParams.get("error") ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message === "Invalid login credentials"
        ? "Email o contraseña incorrectos."
        : authError.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  }

  async function signInWithGitHub() {
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  }

  function fillDemo(type: "pro" | "free") {
    if (type === "pro") { setEmail("demo@maket.ai"); setPassword("Demo1234!"); }
    else                { setEmail("free@maket.ai"); setPassword("Free1234!"); }
    setError("");
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#050508" }}>

      {/* Left — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative overflow-y-auto">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-96 h-96 rounded-full -top-20 -left-20 opacity-30"
            style={{ background: "radial-gradient(circle,#7c5cfc,transparent)", filter: "blur(80px)" }} />
          <div className="absolute w-72 h-72 rounded-full bottom-0 right-0 opacity-20"
            style={{ background: "radial-gradient(circle,#f43f8e,transparent)", filter: "blur(80px)" }} />
        </div>

        <div className="relative z-10 w-full max-w-sm">
          <Link href="/" className="inline-block mb-10">
            <span className="text-2xl font-black gradient-text" style={{ fontFamily: "var(--font-syne)" }}>Maket AI</span>
          </Link>

          <h1 className="text-3xl font-black mb-1" style={{ fontFamily: "var(--font-syne)" }}>Bienvenido de nuevo</h1>
          <p className="text-sm mb-8" style={{ color: "#8884aa" }}>
            ¿No tienes cuenta?{" "}
            <Link href="/registro" className="font-semibold hover:text-white transition-colors" style={{ color: "#a78bfa" }}>Regístrate gratis</Link>
          </p>

          {/* Demo shortcuts */}
          <div className="p-4 rounded-2xl mb-6" style={{ background: "rgba(124,92,252,0.06)", border: "1px solid rgba(124,92,252,0.15)" }}>
            <div className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "#8884aa" }}>Cuentas demo — clic para rellenar</div>
            <div className="flex gap-2">
              {(["pro","free"] as const).map(t => (
                <button key={t} onClick={() => fillDemo(t)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                  style={{ background: "#161622", border: "1px solid rgba(255,255,255,0.06)", color: t === "pro" ? "#c4b5fd" : "#8884aa" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(124,92,252,0.4)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}>
                  {t === "pro" ? "✨ Demo Pro" : "Demo Gratis"}
                </button>
              ))}
            </div>
            <p className="text-[10px] mt-2" style={{ color: "#3d3b5a" }}>
              Pro: demo@maket.ai · Gratis: free@maket.ai
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: "#8884aa" }}>Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#3d3b5a" }} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="tu@email.com" required
                  className="input-field pl-10 w-full"
                  style={{ borderColor: error ? "rgba(252,165,165,0.4)" : undefined }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "#8884aa" }}>Contraseña</label>
                <Link href="/login?forgot=1" className="text-xs font-semibold transition-colors hover:text-white" style={{ color: "#a78bfa" }}>
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#3d3b5a" }} />
                <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  className="input-field pl-10 pr-10 w-full"
                  style={{ borderColor: error ? "rgba(252,165,165,0.4)" : undefined }} />
                <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: "#3d3b5a" }}>
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-xs px-3 py-2.5 rounded-xl" style={{ background: "rgba(252,165,165,0.1)", border: "1px solid rgba(252,165,165,0.25)", color: "#fca5a5" }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary py-3 flex items-center justify-center gap-2 mt-1 disabled:opacity-60">
              {loading
                ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Iniciando sesión...</>
                : <>Iniciar sesión <ArrowRight size={15} /></>}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
            <span className="text-xs" style={{ color: "#3d3b5a" }}>o continúa con</span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Google", fn: signInWithGoogle, icon: "G" },
              { label: "GitHub", fn: signInWithGitHub, icon: "gh" },
            ].map(o => (
              <button key={o.label} onClick={o.fn}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{ background: "#161622", border: "1px solid rgba(255,255,255,0.08)", color: "#8884aa" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.color = "#f1f0ff"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#8884aa"; }}>
                <span className="font-black">{o.icon}</span>{o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right — promo */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(145deg,#0e0e16,#161622)", borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-80 h-80 rounded-full top-0 right-0 opacity-40" style={{ background: "radial-gradient(circle,#7c5cfc,transparent)", filter: "blur(80px)" }} />
          <div className="absolute w-60 h-60 rounded-full bottom-20 left-0 opacity-30" style={{ background: "radial-gradient(circle,#f43f8e,transparent)", filter: "blur(70px)" }} />
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-10"
            style={{ background: "rgba(124,92,252,0.15)", border: "1px solid rgba(124,92,252,0.3)", color: "#c4b5fd" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ animation: "pulseDot 2s infinite" }} />
            +2,400 tiendas activas
          </div>
          <h2 className="text-4xl font-black leading-tight mb-4" style={{ fontFamily: "var(--font-syne)" }}>
            Tu tienda. Tu IA.<br /><span className="gradient-text">Tu negocio.</span>
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "#8884aa" }}>Gestiona todo desde un solo lugar con agentes inteligentes que trabajan por ti las 24 horas.</p>
        </div>
        <div className="relative z-10 flex flex-col gap-3">
          {[["🏗️","Crea tu tienda hablando"],["🧑‍💼","Agente Admin en tu dashboard"],["💰","Ventas automáticas 24/7"],["📊","Analytics en tiempo real"]].map(([icon,label]) => (
            <div key={label} className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <span className="text-lg flex-shrink-0">{icon}</span>
              <span className="text-sm font-medium">{label}</span>
              <span className="ml-auto text-emerald-400">✓</span>
            </div>
          ))}
        </div>
        <div className="relative z-10 p-5 rounded-2xl" style={{ background: "rgba(124,92,252,0.08)", border: "1px solid rgba(124,92,252,0.2)" }}>
          <div className="flex gap-0.5 mb-3">{[...Array(5)].map((_,i) => <span key={i} style={{ color:"#fbbf24" }}>★</span>)}</div>
          <p className="text-sm leading-relaxed mb-4" style={{ color: "#c0c0e0" }}>"En 8 minutos tenía mi tienda lista. El agente de ventas cerró 4 pedidos el primer día."</p>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black" style={{ background: "linear-gradient(135deg,#667eea,#764ba2)" }}>MG</div>
            <div><div className="text-xs font-bold">María G.</div><div className="text-[10px]" style={{ color: "#8884aa" }}>Dueña de StyleBox</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
