"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { TypingIndicator } from "@/components/ui";
import { ShoppingCart, MessageCircle, X, Send, Search, Truck, Lock, RotateCcw, Star, Bot, Package, ShoppingBag, Cpu, Utensils, Sparkles, Home, CreditCard } from "lucide-react";
import { formatCOP, STORE_TEMPLATES } from "@/lib/data";
import type { StoreTemplate } from "@/lib/data";
import type { ProductLegacy as Product, Message } from "@/types";

function StoreIcon({ type, size = 16, color = "#ccc" }: { type: string; size?: number; color?: string }) {
  const p = { size, color };
  switch (type) {
    case "ropa":   return <ShoppingBag {...p} />;
    case "tech":   return <Cpu {...p} />;
    case "food":   return <Utensils {...p} />;
    case "beauty": return <Sparkles {...p} />;
    case "hogar":  return <Home {...p} />;
    default:       return <Package {...p} />;
  }
}

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="11" height="11" viewBox="0 0 24 24"
          fill={i <= Math.round(value) ? "#f5a623" : "#e0e0e0"}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  );
}

const SALES_SYSTEM = (storeName: string, products: Product[]) => `
Eres el Agente de Ventas de ${storeName}, un asistente de compras inteligente y persuasivo.

PERSONALIDAD: Cercano, empático, honesto, estratégico. Hablas como un amigo que conoce muy bien los productos.
No eres pesado ni repetitivo. Español colombiano natural. Emojis con moderación.

PRODUCTOS DISPONIBLES:
${products.map(p=>`- ${p.name} ($${p.price.toLocaleString("es-CO")}) — ${p.description} — Stock: ${p.stock} uds`).join("\n")}

ESTRATEGIAS:
- Si acaban de agregar algo: felicita + sugiere complemento específico
- Si pregunta por precio: transparente + resalta valor
- Si duda: social proof ("muy popular", "quedan pocas unidades")
- Si el carrito tiene 1 item: menciona envío gratis si agrega más
- Si es regalo: sugiere empaque especial

Responde en JSON:
{"message":"tu mensaje (max 3 líneas)","quickReplies":["op1","op2"]}
quickReplies max 3, puede ser [].`;

function ProductCard({ p, pc, onAdd, storeType, tpl }: { p: Product; pc: string; onAdd: (p: Product) => void; storeType: string; tpl: StoreTemplate }) {
  const [hovered, setHovered] = useState(false);

  // Pseudo-random discount based on price digits
  const seed = p.price % 100;
  const discountPct = seed < 30 ? 0 : seed < 60 ? 15 : seed < 80 ? 25 : 40;
  const originalPrice = discountPct > 0 ? Math.round(p.price / (1 - discountPct / 100)) : null;

  const ratingVal = +(4 + ((p.price + p.name.length) % 10) / 10).toFixed(1);
  const reviewCount = 50 + ((p.price * 3) % 900);
  const hasFreeShipping = p.price >= 50000;

  return (
    <div
      className="overflow-hidden cursor-pointer flex flex-col transition-all duration-200"
      style={{
        background: tpl.cardBg,
        border: tpl.cardBorder,
        borderRadius: tpl.cardRadius,
        boxShadow: hovered ? "0 6px 24px rgba(0,0,0,0.14)" : "0 1px 4px rgba(0,0,0,0.05)",
        transform: hovered ? "translateY(-2px)" : "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onAdd(p)}
    >
      {/* Image area */}
      <div className="relative overflow-hidden" style={{ height: 200, background: tpl.cardBg }}>
        {/* Product image or icon placeholder */}
        {p.image ? (
          <img src={p.image} alt={p.name} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"contain", padding:"12px", background: tpl.cardBg }} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <StoreIcon type={storeType} size={72} color={hovered ? "#c0c0c0" : "#e0e0e0"} />
          </div>
        )}
        {p.badge && (
          <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded text-[11px] font-bold text-white"
            style={{ background: pc }}>
            {p.badge}
          </span>
        )}
        {discountPct > 0 && (
          <span className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded text-[11px] font-bold text-white"
            style={{ background: "#e63946" }}>
            -{discountPct}%
          </span>
        )}
        {p.stock <= 5 && p.stock > 0 && (
          <span className="absolute bottom-10 right-2 z-10 px-2 py-0.5 rounded text-[10px] font-semibold"
            style={{ background: "#fff3cd", color: "#856404", border: "1px solid #ffc107" }}>
            ¡Solo {p.stock}!
          </span>
        )}
        {/* Hover: Add to cart bar */}
        <button
          className="absolute bottom-0 left-0 right-0 py-2.5 text-sm font-bold text-white transition-all duration-200"
          style={{
            background: pc,
            opacity: hovered ? 1 : 0,
            transform: hovered ? "translateY(0)" : "translateY(100%)",
            transition: "opacity 0.2s, transform 0.2s",
          }}
          onClick={e => { e.stopPropagation(); onAdd(p); }}
        >
          + Agregar al carrito
        </button>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        <p className="text-sm font-medium leading-snug mb-1.5 line-clamp-2" style={{ color: tpl.cardColor }}>
          {p.name}
        </p>
        <div className="flex items-center gap-1.5 mb-2">
          <StarRating value={ratingVal} />
          <span className="text-xs" style={{ color: "#999" }}>({reviewCount})</span>
        </div>
        {p.description && (
          <p className="text-xs mb-2 line-clamp-1" style={{ color: "#aaa" }}>{p.description}</p>
        )}
        <div className="mt-auto">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-xl font-black" style={{ color: tpl.cardPriceColor, fontFamily: "var(--font-jakarta)" }}>
              {formatCOP(p.price)}
            </span>
            {originalPrice && (
              <span className="text-xs line-through" style={{ color: "#bbb" }}>{formatCOP(originalPrice)}</span>
            )}
            {discountPct > 0 && (
              <span className="text-xs font-bold" style={{ color: "#e63946" }}>{discountPct}% off</span>
            )}
          </div>
          {hasFreeShipping && (
            <p className="flex items-center gap-1 text-xs font-semibold mt-1" style={{ color: "#2a9d5c" }}><Truck size={12} color="#2a9d5c"/> Envío gratis</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StorePage() {
  const params = useParams();
  const slug = params.slug as string;
  const { stores } = useAppStore();

  // Hooks SIEMPRE deben estar antes de cualquier early return
  const [cart, setCart] = useState<Product[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [salesHistory, setSalesHistory] = useState<{role:string;content:string}[]>([]);
  const [chatStarted, setChatStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, loading]);

  const foundStore = stores.find(s => s.slug === slug);

  if (!foundStore) {
    return (
      <div style={{ background:"#fafafa", minHeight:"100vh", fontFamily:"var(--font-jakarta)" }} className="flex flex-col items-center justify-center gap-6 p-8 text-center">
        <Search size={64} color="#ccc" />
        <h1 className="text-3xl font-black" style={{ fontFamily:"var(--font-jakarta)", color:"#1a1a2e" }}>Tienda no encontrada</h1>
        <p style={{ color:"#777" }}>No existe una tienda con la URL <strong>/store/{slug}</strong></p>
        <div className="flex gap-3">
          <Link href="/builder" className="px-6 py-3 rounded-full text-sm font-bold text-white" style={{ background:"linear-gradient(135deg,#7c5cfc,#a855f7)" }}>Crear tienda</Link>
          <Link href="/dashboard" className="px-6 py-3 rounded-full text-sm font-bold border" style={{ borderColor:"#ddd", color:"#555" }}>Ir al panel</Link>
        </div>
      </div>
    );
  }

  const store = foundStore;
  const pc = store.primaryColor;
  const sc = store.secondaryColor;
  const storeName = store.name || "Mi Tienda";
  const tpl: StoreTemplate = STORE_TEMPLATES[(store.type || "general") as keyof typeof STORE_TEMPLATES] ?? STORE_TEMPLATES.general;

  function addToCart(p: Product) {
    setCart(c=>[...c,p]);
    if (!chatOpen && !chatStarted) {
      setTimeout(()=>{ setChatOpen(true); startSalesChat(p); }, 1000);
    }
  }

  async function startSalesChat(addedProduct?: Product) {
    setChatStarted(true);
    const context = addedProduct
      ? `El cliente acaba de agregar "${addedProduct.name}" al carrito. Salúdalo y sugiere algo que combine.`
      : "El cliente abrió el chat. Salúdalo cálidamente.";
    await callSalesAgent(context, true);
  }

  async function callSalesAgent(userText: string, isSystem = false) {
    setLoading(true);
    const newHistory = isSystem ? [{ role:"user", content:userText }] : [...salesHistory, { role:"user", content:userText }];
    try {
      const res = await fetch("/api/chat", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({ system:SALES_SYSTEM(storeName, store.products), messages:newHistory, maxTokens:350 }),
      });
      const data = await res.json();
      const raw = data.text || "{}";
      let parsed: any = {};
      try { const m=raw.match(/\{[\s\S]*\}/); parsed=JSON.parse(m?.[0]||raw); } catch {}
      const botText = parsed.message || raw;
      const newH = [...newHistory, { role:"assistant", content:raw }];
      setSalesHistory(newH);
      if (!isSystem) setMessages(m=>[...m,{ id:(Date.now()-1).toString(),role:"user",content:userText,timestamp:new Date() }]);
      setMessages(m=>[...m,{ id:Date.now().toString(),role:"assistant",content:botText,timestamp:new Date(),quickReplies:parsed.quickReplies||[] } as any]);
    } catch {
      setMessages(m=>[...m,{ id:Date.now().toString(),role:"assistant",content:"Error de conexión. Intenta de nuevo.",timestamp:new Date() }]);
    }
    setLoading(false);
  }

  async function sendSales(text?: string) {
    const val=(text||input).trim();
    if(!val||loading) return;
    setInput("");
    if (!chatStarted) { setChatStarted(true); }
    setMessages(m=>[...m,{ id:Date.now().toString(),role:"user",content:val,timestamp:new Date() }]);
    const newH=[...salesHistory,{ role:"user",content:val }];
    setSalesHistory(newH);
    setLoading(true);
    try {
      const res=await fetch("/api/chat",{ method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ system:SALES_SYSTEM(storeName,store.products),messages:newH,maxTokens:350 }) });
      const data=await res.json();
      const raw=data.text||"{}";
      let parsed:any={};
      try { const m=raw.match(/\{[\s\S]*\}/); parsed=JSON.parse(m?.[0]||raw); } catch {}
      setSalesHistory([...newH,{ role:"assistant",content:raw }]);
      setMessages(m=>[...m,{ id:Date.now().toString(),role:"assistant",content:parsed.message||raw,timestamp:new Date(),quickReplies:parsed.quickReplies||[] } as any]);
    } catch {}
    setLoading(false);
  }

  return (
    <div style={{ background: tpl.pageBg, minHeight: "100vh", fontFamily: "var(--font-jakarta)", color: tpl.pageColor }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50" style={{ background: tpl.headerBg, borderBottom: `1px solid ${tpl.headerBorderColor}`, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
        <div className="max-w-7xl mx-auto flex items-center gap-4 px-6 py-3">
          {/* Logo */}
          <div className="font-black text-xl flex-shrink-0" style={{ fontFamily: "var(--font-jakarta)", color: tpl.headerColor }}>
            <span style={{ color: pc }}>{storeName[0]}</span>{storeName.slice(1)}
          </div>

          {/* Search bar */}
          <div className="hidden md:flex flex-1 items-center rounded-lg overflow-hidden max-w-xl"
            style={{ border: `1.5px solid ${tpl.headerBorderColor}`, background: tpl.headerIsDark ? "rgba(255,255,255,0.07)" : "#f9f9f9" }}>
            <input
              placeholder={`Buscar en ${storeName}...`}
              className="flex-1 px-4 py-2 text-sm bg-transparent outline-none"
              style={{ color: tpl.headerColor }} />
            <button className="flex items-center justify-center px-4 py-2.5"
              style={{ background: pc }}>
              <Search size={15} color="white" />
            </button>
          </div>

          {/* Cart */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: pc }}>
              <ShoppingCart size={15} />
              <span className="hidden sm:inline">Carrito</span>
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-black"
                style={{ background: "rgba(255,255,255,0.25)" }}>
                {cart.length}
              </span>
            </button>
          </div>
        </div>

        {/* Category nav */}
        <div className="border-t" style={{ borderColor: tpl.headerBorderColor, background: tpl.headerBg }}>
          <div className="max-w-7xl mx-auto flex items-center gap-6 px-6 py-2 overflow-x-auto no-scrollbar">
            {tpl.navItems.map((item, idx) => (
              <a key={item} href={idx === 1 ? "#productos" : "#"}
                className="text-xs font-semibold whitespace-nowrap transition-colors hover:opacity-80"
                style={{ color: idx === 0 ? pc : tpl.headerIsDark ? "rgba(255,255,255,0.55)" : "#555" }}>
                {item}
              </a>
            ))}
          </div>
        </div>
      </header>

      {/* ── Hero banner ────────────────────────────────────── */}
      <section style={{ background: tpl.heroBg }}>
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center gap-8">
          {/* Text */}
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4"
              style={{ background: tpl.heroIsDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)", color: tpl.heroColor }}>
              <StoreIcon type={store.type} size={12} color={tpl.heroColor}/> {tpl.navItems[0]} · Colección {new Date().getFullYear()}
            </div>
            <h1 className="text-3xl md:text-5xl font-black leading-tight tracking-tight mb-3"
              style={{ fontFamily: "var(--font-jakarta)", color: tpl.heroColor }}>
              {store.tagline || storeName}
            </h1>
            <p className="text-sm mb-6 max-w-md" style={{ color: tpl.heroSubColor }}>
              {store.products.length} productos disponibles · Envío a todo el país · Devoluciones gratis 30 días
            </p>
            <div className="flex gap-3 flex-wrap">
              <a href="#productos"
                className="px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ background: pc, borderRadius: tpl.heroBtnRadius }}>
                Ver colección →
              </a>
              <a href="#productos"
                className="px-6 py-3 text-sm font-bold transition-all hover:opacity-80"
                style={{
                  border: tpl.heroIsDark ? "1.5px solid rgba(255,255,255,0.35)" : "1.5px solid rgba(0,0,0,0.2)",
                  color: tpl.heroColor,
                  borderRadius: tpl.heroBtnRadius,
                  background: tpl.heroIsDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                }}>
                Ver ofertas
              </a>
            </div>
          </div>
          {/* Trust boxes */}
          <div className="flex-shrink-0 grid grid-cols-2 gap-2.5">
            {[
              { icon: <Truck size={20} color={tpl.heroIsDark ? "#fff" : tpl.heroColor}/>, ti: tpl.trustItems[0] },
              { icon: <Lock size={20} color={tpl.heroIsDark ? "#fff" : tpl.heroColor}/>, ti: tpl.trustItems[1] },
              { icon: <RotateCcw size={20} color={tpl.heroIsDark ? "#fff" : tpl.heroColor}/>, ti: tpl.trustItems[2] },
              { icon: <Star size={20} color="#f5c842"/>, ti: tpl.trustItems[3] },
            ].map((b, idx) => (
              <div key={idx} className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                style={{
                  background: tpl.heroIsDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.65)",
                  border: tpl.heroIsDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(0,0,0,0.07)",
                  backdropFilter: "blur(4px)",
                }}>
                {b.icon}
                <div>
                  <p className="text-xs font-bold" style={{ color: tpl.heroColor }}>{b.ti.label}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: tpl.heroSubColor }}>{b.ti.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Products ───────────────────────────────────────── */}
      <section id="productos" className="py-10 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h2 className="text-2xl font-black" style={{ fontFamily: "var(--font-jakarta)", color: tpl.pageColor }}>
                Productos destacados
              </h2>
              <p className="text-sm mt-0.5" style={{ color: tpl.pageMutedColor }}>
                {store.products.length} artículos disponibles
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select className="text-xs px-3 py-2 rounded-lg outline-none"
                style={{ border: `1px solid ${tpl.headerBorderColor}`, background: tpl.cardBg, color: tpl.cardColor }}>
                <option>Más relevantes</option>
                <option>Menor precio</option>
                <option>Mayor precio</option>
                <option>Más nuevos</option>
              </select>
            </div>
          </div>

          {/* Grid */}
          {store.products.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-20 text-center">
              <Package size={48} color="#ccc" />
              <p className="font-semibold" style={{ color: "#aaa" }}>No hay productos aún</p>
            </div>
          ) : (
            <div className={`grid gap-4 grid-cols-2 ${store.columns >= 4 ? "lg:grid-cols-4" : store.columns === 3 ? "md:grid-cols-3 lg:grid-cols-3" : "md:grid-cols-2"}`}>
              {store.products.map(p => (
                <ProductCard key={p.id} p={p} pc={pc} onAdd={addToCart} storeType={store.type} tpl={tpl} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="mt-10 py-10 px-6" style={{ background: tpl.footerBg }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start justify-between gap-8">
          <div>
            <div className="font-black text-lg mb-2" style={{ fontFamily: "var(--font-jakarta)", color: tpl.footerColor }}>
              <span style={{ color: pc }}>{storeName[0]}</span>{storeName.slice(1)}
            </div>
            <p className="text-xs max-w-xs" style={{ color: tpl.footerSubColor }}>
              Tienda oficial · Productos de calidad · Envío a todo Colombia
            </p>
          </div>
          <div className="flex flex-wrap gap-8 text-xs">
            <div>
              <p className="font-bold mb-2" style={{ color: tpl.footerColor }}>{tpl.navItems[0]}</p>
              {tpl.navItems.slice(1, 4).map(l => (
                <a key={l} href="#productos" className="block mb-1.5 hover:underline" style={{ color: tpl.footerSubColor }}>{l}</a>
              ))}
            </div>
            <div>
              <p className="font-bold mb-2" style={{ color: tpl.footerColor }}>Ayuda</p>
              {["Envíos", "Devoluciones", "Contacto"].map(l => (
                <a key={l} href="#" className="block mb-1.5 hover:underline" style={{ color: tpl.footerSubColor }}>{l}</a>
              ))}
            </div>
            <div>
              <p className="font-bold mb-2" style={{ color: tpl.footerColor }}>Pago seguro</p>
              <div className="flex gap-2 flex-wrap">
                {["Visa", "Mastercard", "PSE", "Efecty"].map(m => (
                  <span key={m} className="px-2 py-1 rounded text-[10px] font-semibold"
                    style={{ background: "rgba(255,255,255,0.08)", color: tpl.footerColor, border: `1px solid ${tpl.footerSubColor}` }}>{m}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-6 flex items-center justify-between flex-wrap gap-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-[11px]" style={{ color: tpl.footerSubColor }}>© {new Date().getFullYear()} {storeName} · Powered by Maket AI</p>
          <p className="text-[11px]" style={{ color: tpl.footerSubColor }}>Todos los derechos reservados</p>
        </div>
      </footer>

      {/* ── Sales agent chat ───────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-50">
        {chatOpen && (
          <div className="absolute bottom-16 right-0 w-80 rounded-2xl overflow-hidden flex flex-col animate-slide-up"
            style={{ background: "#fff", border: "1px solid #e4e4e4", boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }}>
            {/* Chat head */}
            <div className="flex items-center gap-3 p-4" style={{ background: pc }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.2)" }}><Bot size={18} color="white"/></div>
              <div>
                <div className="font-bold text-sm text-white" style={{ fontFamily: "var(--font-syne)" }}>
                  Asistente de compras
                </div>
                <div className="flex items-center gap-1.5 text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.8)" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-dot" />En línea
                </div>
              </div>
              <button onClick={() => setChatOpen(false)}
                className="ml-auto w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.2)" }}>
                <X size={13} color="white" />
              </button>
            </div>
            {/* Messages */}
            <div className="flex flex-col gap-2 p-3 max-h-56 overflow-y-auto" style={{ background: "#fafafa" }}>
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed"
                    style={msg.role === "assistant"
                      ? { background: "#fff", border: "1px solid #eee", borderBottomLeftRadius: 3, color: "#333" }
                      : { background: pc, color: "#fff", borderBottomRightRadius: 3 }}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {messages.length > 0 && messages[messages.length - 1].role === "assistant" && (messages[messages.length - 1] as any).quickReplies?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {((messages[messages.length - 1] as any).quickReplies || []).map((qr: string) => (
                    <button key={qr} onClick={() => sendSales(qr)}
                      className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
                      style={{ background: "#fff", border: "1px solid #e0e0e0", color: "#555" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = pc; e.currentTarget.style.color = pc; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "#e0e0e0"; e.currentTarget.style.color = "#555"; }}>
                      {qr}
                    </button>
                  ))}
                </div>
              )}
              {loading && (
                <div className="flex">
                  <div className="px-3 py-2 rounded-xl" style={{ background: "#fff", border: "1px solid #eee", borderBottomLeftRadius: 3 }}>
                    <TypingIndicator />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            {/* Input */}
            <div className="flex gap-2 p-2.5" style={{ borderTop: "1px solid #f0f0f0" }}>
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendSales()}
                placeholder="Pregúntame algo..."
                className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: "#f5f5f5", border: "1px solid #e0e0e0" }} />
              <button onClick={() => sendSales()} disabled={!input.trim() || loading}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white disabled:opacity-40"
                style={{ background: pc }}>
                <Send size={13} />
              </button>
            </div>
          </div>
        )}
        <button
          onClick={() => { setChatOpen(o => !o); if (!chatStarted) startSalesChat(); }}
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-white transition-all duration-300 hover:scale-110 relative"
          style={{ background: pc, boxShadow: `0 8px 24px ${pc}55` }}>
          <MessageCircle size={22} />
          <div className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ background: pc, opacity: 0.35, animation: "fabPulse 2.5s ease-in-out infinite" }} />
        </button>
      </div>
    </div>
  );
}
