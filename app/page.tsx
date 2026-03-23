"use client";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";

// ── Animation helpers ──────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
});

function InView({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

// ── Typewriter ─────────────────────────────────────
const WORDS = ["hablando.", "conversando.", "sin código.", "en minutos."];
function Typewriter() {
  const [idx, setIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const word = WORDS[idx];
    if (!deleting && displayed.length < word.length) {
      const t = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), 80);
      return () => clearTimeout(t);
    }
    if (!deleting && displayed.length === word.length) {
      const t = setTimeout(() => setDeleting(true), 2200);
      return () => clearTimeout(t);
    }
    if (deleting && displayed.length > 0) {
      const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 45);
      return () => clearTimeout(t);
    }
    if (deleting && displayed.length === 0) {
      setDeleting(false);
      setIdx(i => (i + 1) % WORDS.length);
    }
  }, [displayed, deleting, idx]);
  return (
    <span className="gradient-text">
      {displayed}
      <span className="animate-pulse" style={{ color: "#7c5cfc" }}>|</span>
    </span>
  );
}

// ── Floating mockup chat bubble ────────────────────
const CHAT_MSGS = [
  { role: "bot",  text: "¡Hola! ¿Qué tipo de productos vas a vender?" },
  { role: "user", text: "👗 Ropa y moda" },
  { role: "bot",  text: "¡Perfecto! ¿Cómo se llamará tu tienda?" },
  { role: "user", text: "StyleBox" },
  { role: "bot",  text: "Generando tu tienda... 🎨✨" },
];

function ChatMockup() {
  const [visible, setVisible] = useState(1);
  useEffect(() => {
    const t = setInterval(() => setVisible(v => v < CHAT_MSGS.length ? v + 1 : 1), 1400);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#0e0e16", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}>
      {/* Browser bar */}
      <div className="flex items-center gap-2 px-4 py-3" style={{ background: "#161622", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex gap-1.5">
          {["#ff5f57","#febc2e","#28c840"].map(c => <div key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />)}
        </div>
        <div className="flex-1 mx-3 px-3 py-1 rounded-full text-xs text-center" style={{ background: "#0e0e16", color: "#8884aa" }}>
          maket.ai/builder
        </div>
      </div>
      {/* Chat messages */}
      <div className="p-4 flex flex-col gap-3 min-h-[260px]">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center text-sm" style={{ background: "linear-gradient(135deg,#7c5cfc,#f43f8e)" }}>🏗️</div>
          <span className="text-xs font-bold" style={{ color: "#c4b5fd" }}>Agente Constructor</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 6px #06d6a0" }} />
        </div>
        {CHAT_MSGS.slice(0, visible).map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm"
              style={m.role === "bot"
                ? { background: "#1e1e2e", color: "#e0e0ff", borderBottomLeftRadius: 4, border: "1px solid rgba(255,255,255,0.06)" }
                : { background: "linear-gradient(135deg,#7c5cfc,#f43f8e)", color: "#fff", borderBottomRightRadius: 4 }}>
              {m.text}
            </div>
          </motion.div>
        ))}
        {visible === CHAT_MSGS.length && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 p-3 rounded-xl" style={{ background: "rgba(124,92,252,0.1)", border: "1px solid rgba(124,92,252,0.25)" }}>
            <div className="text-xs font-semibold text-purple-300 mb-1">✨ Tienda generada en tiempo real</div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
              <motion.div className="h-full rounded-full" style={{ background: "linear-gradient(90deg,#7c5cfc,#f43f8e)" }}
                initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 1.5 }} />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ── Sections data ──────────────────────────────────
const HOW_STEPS = [
  { n: "01", icon: "💬", title: "Habla con el Agente Constructor", desc: "Cuéntale qué vendes, el nombre de tu tienda, colores y estilo. La IA hace las preguntas correctas.", color: "#7c5cfc" },
  { n: "02", icon: "👁️", title: "Ve tu tienda crearse en vivo", desc: "Mientras respondes, el diseño se actualiza en tiempo real. Vista escritorio y móvil simultánea.", color: "#a855f7" },
  { n: "03", icon: "🚀", title: "Publica con un clic", desc: "Cuando estés listo, publicas. Tu tienda queda en línea al instante en tu dominio personalizado.", color: "#f43f8e" },
  { n: "04", icon: "🤖", title: "La IA vende por ti", desc: "El Agente de Ventas atiende a tus clientes 24/7, resuelve dudas y cierra ventas automáticamente.", color: "#06d6a0" },
];

const FEATURES = [
  { icon: "🏗️", title: "Constructor conversacional", desc: "Crea tu tienda completa hablando. Sin formularios, sin plantillas. Solo describe y la IA construye.", tag: "Único" },
  { icon: "📊", title: "Dashboard completo", desc: "Analytics en tiempo real, gestión de órdenes, productos con stock semafórico y pagos integrados.", tag: "" },
  { icon: "🧑‍💼", title: "Agente Administrativo", desc: "Un asistente IA dentro de tu dashboard que conoce todo tu negocio y te ayuda a tomar decisiones.", tag: "Pro" },
  { icon: "💰", title: "Agente de Ventas 24/7", desc: "Atiende clientes, responde preguntas, recomienda productos y cierra ventas mientras tú duermes.", tag: "Pro" },
  { icon: "📱", title: "100% Responsive", desc: "Tu tienda y tu dashboard se ven perfectos en cualquier dispositivo. Optimizado para móvil primero.", tag: "" },
  { icon: "⚡", title: "Listo en minutos", desc: "Desde cero a tienda publicada en menos de 10 minutos. Sin código, sin diseñadores, sin complicaciones.", tag: "" },
];

const STATS = [
  { val: "3", label: "Agentes IA", sub: "trabajando por ti" },
  { val: "< 10'", label: "Para publicar", sub: "tu primera tienda" },
  { val: "24/7", label: "Ventas automáticas", sub: "sin intervención" },
  { val: "0", label: "Líneas de código", sub: "necesarias" },
];

const TESTIMONIALS: Array<{name: string; role: string; avatar: string; color: string[]; text: string; stars: number}> = [];

const PRICING = [
  {
    name: "Gratis", price: "$0", sub: "Para empezar",
    features: ["1 tienda", "Hasta 20 productos", "Agente Constructor básico", "Analytics básico", "Dominio maket.ai"],
    cta: "Empezar gratis", href: "/registro", highlight: false,
  },
  {
    name: "Pro", price: "$89.000", sub: "COP / mes",
    features: ["Tiendas ilimitadas", "Productos ilimitados", "3 Agentes IA completos", "Analytics avanzado", "Dominio personalizado", "Soporte prioritario 24/7", "Sin comisión adicional"],
    cta: "Empezar Pro", href: "/registro", highlight: true,
  },
  {
    name: "Business", price: "$249.000", sub: "COP / mes",
    features: ["Todo lo de Pro", "Múltiples usuarios", "API access", "Integraciones avanzadas", "Reportes personalizados", "Gerente de cuenta dedicado"],
    cta: "Contactar ventas", href: "/registro", highlight: false,
  },
];

const FAQS = [
  { q: "¿Necesito saber programar?", a: "Para nada. Maket AI está diseñado para que cualquier persona pueda crear y gestionar su tienda completamente sin código." },
  { q: "¿Cómo funciona el Agente de Ventas?", a: "Es un chatbot con IA que aparece en tu tienda pública. Conoce todos tus productos y atiende a los clientes en tiempo real, resuelve dudas y los guía hasta completar la compra." },
  { q: "¿Puedo tener múltiples tiendas?", a: "En el plan Pro y Business puedes crear tiendas ilimitadas, cada una con su propio dominio, diseño y productos independientes." },
  { q: "¿Qué pasa con los pagos de mis clientes?", a: "Los pagos llegan directamente a tu cuenta. Maket AI cobra una comisión del 3.5% en el plan Gratis; en Pro y Business la comisión es 0%." },
  { q: "¿Puedo migrar mi tienda actual?", a: "Sí. El Agente Administrativo puede ayudarte a importar tu catálogo de productos desde CSV o desde otras plataformas." },
];

// ── Main component ─────────────────────────────────
export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div style={{ background: "#050508", color: "#f1f0ff" }}>

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
        style={{ background: "rgba(5,5,8,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span className="text-xl font-black gradient-text" style={{ fontFamily: "var(--font-syne)" }}>Maket AI</span>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium" style={{ color: "#8884aa" }}>
          {[["#features","Funciones"],["#how","Cómo funciona"],["#pricing","Precios"],["#faq","FAQ"]].map(([href,label]) => (
            <a key={href} href={href} className="hover:text-white transition-colors">{label}</a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-ghost text-sm px-4 py-2">Entrar</Link>
          <Link href="/registro" className="btn-primary text-sm px-5 py-2">Empezar gratis</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="min-h-screen flex items-center justify-center pt-24 pb-16 px-6 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-[700px] h-[700px] rounded-full -top-32 left-1/2 -translate-x-1/2"
            style={{ background: "radial-gradient(circle, rgba(124,92,252,0.15), transparent 70%)", filter: "blur(60px)" }} />
          <div className="absolute w-[500px] h-[500px] rounded-full bottom-0 right-0"
            style={{ background: "radial-gradient(circle, rgba(244,63,142,0.1), transparent 70%)", filter: "blur(80px)" }} />
          <div className="absolute w-[400px] h-[400px] rounded-full top-1/2 -left-32"
            style={{ background: "radial-gradient(circle, rgba(6,214,160,0.07), transparent 70%)", filter: "blur(60px)" }} />
          {/* Grid lines */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)", backgroundSize: "80px 80px" }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <motion.div {...fadeUp(0)} className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-sm"
              style={{ background: "rgba(124,92,252,0.1)", border: "1px solid rgba(124,92,252,0.3)" }}>
              <span className="w-2 h-2 rounded-full bg-emerald-400" style={{ animation: "pulseDot 2s infinite", boxShadow: "0 0 6px #06d6a0" }} />
              <span className="font-semibold text-purple-300">Nuevo</span>
              <span style={{ color: "#8884aa" }}>· 3 agentes IA disponibles</span>
            </motion.div>

            <motion.h1 {...fadeUp(0.08)} className="text-5xl md:text-7xl font-black leading-[0.95] tracking-tight mb-6"
              style={{ fontFamily: "var(--font-syne)" }}>
              Crea tu tienda<br />
              <Typewriter />
            </motion.h1>

            <motion.p {...fadeUp(0.16)} className="text-lg md:text-xl leading-relaxed mb-10 max-w-lg" style={{ color: "#8884aa" }}>
              Sin código. Sin diseñadores. Habla con nuestra IA y tu tienda profesional estará publicada y vendiendo en minutos.
            </motion.p>

            <motion.div {...fadeUp(0.22)} className="flex gap-3 flex-wrap mb-12">
              <Link href="/dashboard" className="btn-primary text-base px-8 py-3.5">
                Empezar gratis — es gratis →
              </Link>
              <Link href="/builder" className="btn-ghost text-base px-8 py-3.5">
                Crear tu tienda
              </Link>
            </motion.div>

            {/* Social proof */}
            <motion.div {...fadeUp(0.28)} className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {[["#667eea","#764ba2"],["#f093fb","#f5576c"],["#43e97b","#38f9d7"],["#f7971e","#ffd200"]].map((g,i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold"
                    style={{ background: `linear-gradient(135deg,${g[0]},${g[1]})`, borderColor: "#050508" }}>
                    {["ML","CR","AG","PM"][i]}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex gap-0.5 mb-0.5">
                  {[...Array(5)].map((_,i) => <span key={i} style={{ color: "#fbbf24" }}>★</span>)}
                </div>
                <div className="text-xs" style={{ color: "#8884aa" }}>+2,400 tiendas creadas este mes</div>
              </div>
            </motion.div>
          </div>

          {/* Right — animated chat */}
          <motion.div {...fadeUp(0.18)} className="relative">
            <ChatMockup />
            {/* Floating badges */}
            <motion.div
              animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-4 -right-4 px-3 py-2 rounded-xl text-xs font-bold"
              style={{ background: "linear-gradient(135deg,#06d6a0,#0ea5e9)", color: "#fff", boxShadow: "0 8px 24px rgba(6,214,160,0.4)" }}>
              ✓ Tienda publicada
            </motion.div>
            <motion.div
              animate={{ y: [0, 6, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute -bottom-4 -left-4 px-3 py-2 rounded-xl text-xs font-bold"
              style={{ background: "linear-gradient(135deg,#7c5cfc,#f43f8e)", color: "#fff", boxShadow: "0 8px 24px rgba(124,92,252,0.4)" }}>
              🤖 Agente en línea
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section className="py-16 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <InView key={s.label} delay={i * 0.08} className="text-center">
              <div className="text-4xl md:text-5xl font-black mb-1 gradient-text-purple-pink" style={{ fontFamily: "var(--font-syne)" }}>{s.val}</div>
              <div className="font-bold text-sm mb-0.5">{s.label}</div>
              <div className="text-xs" style={{ color: "#8884aa" }}>{s.sub}</div>
            </InView>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <InView className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-5"
              style={{ background: "rgba(124,92,252,0.1)", border: "1px solid rgba(124,92,252,0.25)", color: "#c4b5fd" }}>
              Proceso
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-4" style={{ fontFamily: "var(--font-syne)" }}>Así de fácil es</h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: "#8884aa" }}>De cero a tienda publicada y vendiendo en menos de 10 minutos.</p>
          </InView>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_STEPS.map((s, i) => (
              <InView key={s.n} delay={i * 0.1}>
                <div className="card p-6 h-full relative overflow-hidden group card-hover">
                  <div className="absolute -top-4 -right-4 text-7xl font-black opacity-5 select-none" style={{ fontFamily: "var(--font-syne)" }}>{s.n}</div>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-5 transition-transform duration-300 group-hover:scale-110"
                    style={{ background: `${s.color}22`, boxShadow: `0 4px 20px ${s.color}33` }}>
                    {s.icon}
                  </div>
                  <div className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: s.color }}>{s.n}</div>
                  <h3 className="font-black text-base mb-2" style={{ fontFamily: "var(--font-syne)" }}>{s.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#8884aa" }}>{s.desc}</p>
                </div>
              </InView>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-6" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="max-w-6xl mx-auto">
          <InView className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-5"
              style={{ background: "rgba(244,63,142,0.1)", border: "1px solid rgba(244,63,142,0.25)", color: "#f9a8d4" }}>
              Funcionalidades
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-4" style={{ fontFamily: "var(--font-syne)" }}>Todo lo que necesitas</h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: "#8884aa" }}>Nada que sobre. Todo lo esencial para crear, gestionar y hacer crecer tu negocio online.</p>
          </InView>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <InView key={f.title} delay={i * 0.08}>
                <div className="card card-hover p-6 h-full group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-transform duration-300 group-hover:scale-110"
                      style={{ background: "rgba(124,92,252,0.1)", border: "1px solid rgba(124,92,252,0.15)" }}>
                      {f.icon}
                    </div>
                    {f.tag && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                        style={{ background: f.tag === "Pro" ? "rgba(124,92,252,0.2)" : "rgba(6,214,160,0.15)", color: f.tag === "Pro" ? "#c4b5fd" : "#6ee7b7", border: `1px solid ${f.tag === "Pro" ? "rgba(124,92,252,0.3)" : "rgba(6,214,160,0.25)"}` }}>
                        {f.tag}
                      </span>
                    )}
                  </div>
                  <h3 className="font-black text-base mb-2" style={{ fontFamily: "var(--font-syne)" }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#8884aa" }}>{f.desc}</p>
                </div>
              </InView>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      {TESTIMONIALS.length > 0 && (
        <section className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <InView className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-5"
                style={{ background: "rgba(6,214,160,0.1)", border: "1px solid rgba(6,214,160,0.25)", color: "#6ee7b7" }}>
                Testimonios
              </div>
              <h2 className="text-4xl md:text-5xl font-black mb-4" style={{ fontFamily: "var(--font-syne)" }}>Ellos ya venden con IA</h2>
            </InView>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t, i) => (
              <InView key={t.name} delay={i * 0.1}>
                <div className="card p-6 h-full flex flex-col card-hover">
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(t.stars)].map((_,j) => <span key={j} style={{ color: "#fbbf24" }}>★</span>)}
                  </div>
                  <p className="text-sm leading-relaxed flex-1 mb-5" style={{ color: "#c0c0e0" }}>"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0"
                      style={{ background: `linear-gradient(135deg,${t.color[0]},${t.color[1]})` }}>
                      {t.avatar}
                    </div>
                    <div>
                      <div className="font-bold text-sm">{t.name}</div>
                      <div className="text-xs" style={{ color: "#8884aa" }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              </InView>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ── PRICING ── */}
      <section id="pricing" className="py-24 px-6" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="max-w-5xl mx-auto">
          <InView className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-5"
              style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)", color: "#fde68a" }}>
              Precios
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-4" style={{ fontFamily: "var(--font-syne)" }}>Simple y transparente</h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: "#8884aa" }}>Sin costos ocultos. Empieza gratis y escala cuando lo necesites.</p>
          </InView>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRICING.map((p, i) => (
              <InView key={p.name} delay={i * 0.1}>
                <div className={`card p-7 flex flex-col h-full relative overflow-hidden ${p.highlight ? "ring-2" : ""}`}
                  style={p.highlight ? { ringColor: "#7c5cfc", borderColor: "rgba(124,92,252,0.5)", background: "linear-gradient(145deg,rgba(124,92,252,0.08),rgba(244,63,142,0.05))" } : {}}>
                  {p.highlight && (
                    <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg,#7c5cfc,#f43f8e)" }} />
                  )}
                  {p.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-black"
                      style={{ background: "linear-gradient(135deg,#7c5cfc,#f43f8e)", color: "#fff" }}>
                      MÁS POPULAR
                    </div>
                  )}
                  <div className="mb-6">
                    <div className="font-black text-lg mb-1" style={{ fontFamily: "var(--font-syne)" }}>{p.name}</div>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-4xl font-black" style={{ fontFamily: "var(--font-syne)", color: p.highlight ? "#c4b5fd" : "#f1f0ff" }}>{p.price}</span>
                      <span className="text-sm" style={{ color: "#8884aa" }}>{p.sub}</span>
                    </div>
                  </div>
                  <ul className="flex flex-col gap-2.5 mb-8 flex-1">
                    {p.features.map(f => (
                      <li key={f} className="flex items-center gap-2.5 text-sm">
                        <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[10px]"
                          style={{ background: p.highlight ? "rgba(124,92,252,0.2)" : "rgba(255,255,255,0.06)", color: p.highlight ? "#c4b5fd" : "#8884aa" }}>✓</span>
                        <span style={{ color: "#c0c0e0" }}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={p.href}
                    className={p.highlight ? "btn-primary text-center py-3" : "btn-ghost text-center py-3"}>
                    {p.cta}
                  </Link>
                </div>
              </InView>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <InView className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4" style={{ fontFamily: "var(--font-syne)" }}>Preguntas frecuentes</h2>
          </InView>
          <div className="flex flex-col gap-3">
            {FAQS.map((f, i) => (
              <InView key={i} delay={i * 0.05}>
                <div className="card overflow-hidden cursor-pointer" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <div className="flex items-center justify-between px-6 py-5">
                    <span className="font-bold text-sm pr-4">{f.q}</span>
                    <span className="text-xl flex-shrink-0 transition-transform duration-300" style={{ color: "#7c5cfc", transform: openFaq === i ? "rotate(45deg)" : "" }}>+</span>
                  </div>
                  {openFaq === i && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="px-6 pb-5">
                      <p className="text-sm leading-relaxed" style={{ color: "#8884aa" }}>{f.a}</p>
                    </motion.div>
                  )}
                </div>
              </InView>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-32 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-[600px] h-[400px] rounded-full top-0 left-1/2 -translate-x-1/2"
            style={{ background: "radial-gradient(ellipse, rgba(124,92,252,0.2), transparent 70%)", filter: "blur(60px)" }} />
        </div>
        <InView className="relative z-10 max-w-2xl mx-auto">
          <div className="text-5xl md:text-6xl mb-6">🚀</div>
          <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight" style={{ fontFamily: "var(--font-syne)" }}>
            Tu tienda te<br /><span className="gradient-text">está esperando</span>
          </h2>
          <p className="text-lg mb-10" style={{ color: "#8884aa" }}>
            Únete a los emprendedores que ya crearon su tienda con IA. Gratis para siempre en el plan básico.
          </p>
          <Link href="/registro" className="btn-primary text-lg px-10 py-4 inline-flex">
            Crear mi tienda gratis →
          </Link>
          <p className="mt-4 text-sm" style={{ color: "#3d3b5a" }}>Sin tarjeta de crédito · Sin compromiso</p>
        </InView>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-12 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="text-xl font-black gradient-text mb-3" style={{ fontFamily: "var(--font-syne)" }}>Maket AI</div>
              <p className="text-sm leading-relaxed" style={{ color: "#8884aa" }}>La plataforma de e-commerce con IA. Crea, administra y vende con agentes inteligentes.</p>
            </div>
            {[
              { title: "Producto", links: ["Funciones","Precios","Demo","Changelog"] },
              { title: "Empresa",  links: ["Sobre nosotros","Blog","Carreras","Contacto"] },
              { title: "Legal",    links: ["Privacidad","Términos","Cookies","GDPR"] },
            ].map(col => (
              <div key={col.title}>
                <div className="font-black text-xs uppercase tracking-widest mb-4" style={{ color: "#3d3b5a" }}>{col.title}</div>
                <ul className="flex flex-col gap-2.5">
                  {col.links.map(l => (
                    <li key={l}><a href="#" className="text-sm transition-colors hover:text-white" style={{ color: "#8884aa" }}>{l}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-8 flex-wrap gap-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-xs" style={{ color: "#3d3b5a" }}>© 2024 Maket AI. Todos los derechos reservados.</p>
            <div className="flex gap-4">
              {["Twitter","Instagram","LinkedIn","YouTube"].map(s => (
                <a key={s} href="#" className="text-xs transition-colors hover:text-white" style={{ color: "#8884aa" }}>{s}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
