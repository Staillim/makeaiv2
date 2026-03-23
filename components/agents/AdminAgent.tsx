"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { usePathname } from "next/navigation";
import { TypingIndicator } from "@/components/ui";
import { X, Trash2, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "@/types";

const SECTION_CHIPS: Record<string, string[]> = {
  home:      ["📊 Resumen de hoy", "⚠️ Stock bajo", "🚚 Pendientes envío", "💰 Mis ventas"],
  tiendas:   ["🛍 Estado tiendas", "✏️ Editar tienda", "📊 Comparar tiendas"],
  analytics: ["📈 Mejor producto", "📉 Qué mejorar", "🎯 Aumentar conversión"],
  productos: ["📦 Agregar producto", "✏️ Editar precio", "⚠️ Stock bajo", "🔄 Actualizar stock"],
  ordenes:   ["🚚 Pendientes envío", "✅ Marcar entregadas", "↩️ Devoluciones"],
  pagos:     ["💰 Balance disponible", "📅 Programar retiro", "📊 Resumen financiero"],
  facturas:  ["📄 Última factura", "💳 Cambiar plan"],
  config:    ["🔔 Notificaciones", "🔒 Seguridad", "💳 Cambiar plan"],
};

function buildSystemPrompt(section: string, stores: any[], orders: any[]): string {
  const store = stores.length > 0 ? stores[0] : { name: "Mi Tienda", type: "general", products: [] };
  const stockBajo = store.products?.filter((p: any) => p.stock > 0 && p.stock <= 5).map((p: any) => p.name) || [];
  const sinStock = store.products?.filter((p: any) => p.stock === 0).map((p: any) => p.name) || [];
  const pendientes = orders.filter((o: any) => o.status === "pendiente").length;
  const totalOrdenes = orders.length;

  return `Eres el Agente Administrativo de Maket AI, una IA experta en gestión de tiendas online.
Tienes acceso completo al dashboard del usuario.

NEGOCIO ACTUAL:
- Tienda: ${store.name} (${store.type || "general"})
- Órdenes: ${totalOrdenes} activas, ${pendientes} pendientes de envío
- Stock bajo urgente: ${stockBajo.join(", ") || "ninguno"}
- Sin stock: ${sinStock.join(", ") || "ninguno"}
- Sección activa: ${section}

PERSONALIDAD: Proactivo, preciso, accionable. Hablas en español colombiano natural.
Das respuestas concisas (3-5 líneas max) salvo reportes detallados.
Usas emojis con moderación. No repites saludos.

CAPACIDADES: Responder sobre ventas/stock/órdenes, guiar para agregar/editar productos,
sugerir estrategias, crear resúmenes ejecutivos, alertar problemas.`;
}

export default function AdminAgent() {
  const { adminOpen, setAdminOpen, adminMessages, addAdminMessage, clearAdminMessages, stores, orders } = useAppStore();
  const pathname = usePathname();
  const currentSection = pathname.split("/")[2] || "home";
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const greeted = useRef(false);

  // Animate open/close
  useEffect(() => {
    if (adminOpen) {
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      if (!greeted.current) { greeted.current = true; sendGreeting(); }
      setTimeout(() => inputRef.current?.focus(), 350);
    } else {
      setVisible(false);
    }
  }, [adminOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [adminMessages, loading]);

  const sectionLabel = {
    home:"Dashboard", tiendas:"Mis tiendas", analytics:"Analytics",
    productos:"Productos", ordenes:"Órdenes", pagos:"Pagos", facturas:"Facturas", config:"Configuración"
  }[currentSection] ?? "Dashboard";

  const chips = SECTION_CHIPS[currentSection] ?? SECTION_CHIPS.home;

  async function callAgent(userText: string) {
    setLoading(true);
    const history = adminMessages.map(m => ({ role: m.role, content: m.content }));
    history.push({ role: "user", content: userText });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: buildSystemPrompt(sectionLabel, stores, orders),
          messages: history,
          maxTokens: 600,
        }),
      });
      const data = await res.json();
      const text = data.text ?? "Lo siento, tuve un problema. Intenta de nuevo.";
      addAdminMessage({ id: Date.now().toString(), role: "assistant", content: text, timestamp: new Date() });
    } catch {
      addAdminMessage({ id: Date.now().toString(), role: "assistant", content: "Error de conexión 😕 Intenta de nuevo.", timestamp: new Date() });
    }
    setLoading(false);
  }

  function sendGreeting() {
    const pendingOrders = orders.filter(o => o.status === "pendiente").length;
    const store = stores.length > 0 ? stores[0] : null;
    const lowStockProducts = store?.products?.filter(p => p.stock > 0 && p.stock <= 5) || [];
    const outOfStockProducts = store?.products?.filter(p => p.stock === 0) || [];
    
    let greeting = "¡Hola! 👋 Soy tu Agente Administrativo.\n\n";
    
    if (!store) {
      greeting += "Veo que aún no has creado ninguna tienda. ¿Quieres que te guíe para crear tu primera tienda?";
    } else if (pendingOrders > 0 || lowStockProducts.length > 0 || outOfStockProducts.length > 0) {
      const alerts = [];
      if (pendingOrders > 0) alerts.push(`**${pendingOrders} ${pendingOrders === 1 ? 'orden pendiente' : 'órdenes pendientes'}** de envío`);
      if (outOfStockProducts.length > 0) alerts.push(`**${outOfStockProducts[0].name}** sin stock`);
      else if (lowStockProducts.length > 0) alerts.push(`**${lowStockProducts[0].name}** con solo ${lowStockProducts[0].stock} unidades`);
      
      greeting += `Veo que tienes ${alerts.join(" y ")}. ¿En qué te puedo ayudar?`;
    } else {
      greeting += `Todo está en orden con **${store.name}** 🎉\n\n¿En qué puedo asistirte hoy?`;
    }
    
    addAdminMessage({ id: "greeting", role: "assistant", content: greeting, timestamp: new Date() });
  }

  async function send() {
    const val = input.trim();
    if (!val || loading) return;
    setInput("");
    addAdminMessage({ id: Date.now().toString(), role: "user", content: val, timestamp: new Date() });
    await callAgent(val);
  }

  async function sendChip(chip: string) {
    const clean = chip.replace(/^[\u{1F300}-\u{1F9FF}\s]+/u, "").trim() || chip;
    addAdminMessage({ id: Date.now().toString(), role: "user", content: chip, timestamp: new Date() });
    await callAgent(clean);
  }

  function renderContent(text: string) {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br>");
  }

  if (!adminOpen && !visible) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className={cn("fixed inset-0 z-[390] transition-opacity duration-300 backdrop-blur-sm", visible ? "opacity-100" : "opacity-0")}
        style={{ background: "rgba(0,0,0,0.5)" }}
        onClick={() => setAdminOpen(false)} />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed top-0 right-0 h-screen z-[400] flex flex-col transition-transform duration-300"
        style={{
          width: "min(420px, 100vw)",
          background: "#0e0e16",
          borderLeft: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "-24px 0 60px rgba(0,0,0,0.7)",
          transform: visible ? "translateX(0)" : "translateX(100%)",
        }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(124,92,252,0.08)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 relative"
              style={{ background: "linear-gradient(135deg,#7c5cfc,#f43f8e)", boxShadow: "0 4px 16px rgba(124,92,252,0.4)" }}>
              🧑‍💼
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                style={{ background: "#06d6a0", borderColor: "#0e0e16", boxShadow: "0 0 6px #06d6a0" }} />
            </div>
            <div>
              <div className="font-bold text-sm" style={{ fontFamily: "var(--font-syne)" }}>Agente Administrativo</div>
              <div className="flex items-center gap-1.5 text-xs font-semibold mt-0.5" style={{ color: "#06d6a0" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
                En línea · Listo para ayudar
              </div>
            </div>
          </div>
          <div className="flex gap-1.5">
            <button onClick={() => { clearAdminMessages(); greeted.current = false; setTimeout(sendGreeting, 100); }}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 btn-sm">
              <Trash2 size={13} />
            </button>
            <button onClick={() => setAdminOpen(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 btn-sm">
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Context bar */}
        <div className="flex items-center gap-2 px-5 py-2 text-xs flex-shrink-0"
          style={{ background: "#161622", borderBottom: "1px solid rgba(255,255,255,0.04)", color: "#3d3b5a" }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Contexto: <span className="font-bold" style={{ color: "#a78bfa" }}>{sectionLabel}</span>
        </div>

        {/* Chips */}
        <div className="flex gap-2 px-4 py-2.5 overflow-x-auto flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", scrollbarWidth: "none" }}>
          {chips.map(chip => (
            <button key={chip} onClick={() => sendChip(chip)} disabled={loading}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 disabled:opacity-40"
              style={{ background: "#1e1e2e", border: "1px solid rgba(255,255,255,0.06)", color: "#8884aa" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(124,92,252,0.35)"; e.currentTarget.style.color = "#c4b5fd"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#8884aa"; }}>
              {chip}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
          {adminMessages.map((msg: Message) => (
            <div key={msg.id} className={cn("flex flex-col animate-slide-up", msg.role === "user" ? "items-end" : "items-start")}>
              {msg.role === "assistant" && (
                <div className="text-[10px] font-black mb-1.5 tracking-wider" style={{ color: "#3d3b5a" }}>🧑‍💼 AGENTE ADMIN</div>
              )}
              <div
                className="max-w-[88%] px-4 py-3 rounded-2xl text-sm leading-relaxed"
                style={msg.role === "assistant"
                  ? { background: "linear-gradient(145deg,#1e1e2e,#161622)", border: "1px solid rgba(255,255,255,0.06)", borderBottomLeftRadius: "4px" }
                  : { background: "linear-gradient(135deg,#7c5cfc,#a855f7,#ec4899)", color: "#fff", borderBottomRightRadius: "4px" }}
                dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }} />
            </div>
          ))}

          {loading && (
            <div className="flex flex-col items-start animate-slide-up">
              <div className="text-[10px] font-black mb-1.5 tracking-wider" style={{ color: "#3d3b5a" }}>🧑‍💼 AGENTE ADMIN</div>
              <div className="px-4 py-3 rounded-2xl" style={{ background: "linear-gradient(145deg,#1e1e2e,#161622)", border: "1px solid rgba(255,255,255,0.06)", borderBottomLeftRadius: "4px" }}>
                <TypingIndicator />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 flex gap-2 items-center flex-shrink-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "#0e0e16" }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
            placeholder="Pregunta o pide algo al agente..."
            className="input-field flex-1 rounded-full py-2.5"
            disabled={loading} />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0 transition-all duration-200 disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#7c5cfc,#a855f7)", boxShadow: "0 4px 16px rgba(124,92,252,0.4)" }}
            onMouseEnter={e => !loading && (e.currentTarget.style.transform = "scale(1.1) rotate(5deg)")}
            onMouseLeave={e => (e.currentTarget.style.transform = "")}>
            <Send size={15} />
          </button>
        </div>
      </div>
    </>
  );
}
