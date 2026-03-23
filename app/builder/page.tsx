"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { TypingIndicator } from "@/components/ui";
import { Send, ArrowLeft, Eye, Smartphone, Monitor, Rocket } from "lucide-react";
import type { Message, BuilderConfig, BuilderProduct, StoreLegacy, ProductLegacy } from "@/types";

const BUILDER_SYSTEM = `Eres el Agente Constructor de Maket AI, experto en crear tiendas online.
Tu trabajo: hacer preguntas naturales y recopilar información para construir la tienda perfecta.

PERSONALIDAD: Entusiasta, creativo, empático. Haces comentarios específicos sobre lo que dice el usuario.
Nunca suenes genérico. Adapta tu tono al tipo de tienda.

FLUJO en orden (un paso a la vez):
1. Saludo + ¿qué tipo de productos vendes?
2. Nombre de la tienda
3. Colores (ofrece opciones concretas con hex)
4. Estilo (minimalista, moderno, orgánico, lujo)
5. Productos por fila (2, 3 o 4)
6. Slogan o frase de bienvenida
7. 2-3 productos de ejemplo con precio aproximado
8. Confirmación + oferta de publicar

IMPORTANTE: Responde SIEMPRE en JSON exacto:
{
  "message": "Tu mensaje (usa \\n para saltos)",
  "quickReplies": ["opción1", "opción2"],
  "configUpdate": {
    "name": "nombre",
    "type": "ropa|tech|food|beauty|hogar|general",
    "primaryColor": "#hexcolor",
    "columns": 3,
    "style": "moderno",
    "tagline": "slogan",
    "products": [{"n":"nombre","p":"precio"}]
  },
  "progress": 0-100,
  "readyToPublish": false
}
Solo incluye en configUpdate los campos recién definidos. quickReplies puede ser [].`;

const PALETTES: Record<string, [string,string][]> = {
  ropa:   [["#667eea","#764ba2"],["#f093fb","#f5576c"],["#4facfe","#00f2fe"],["#43e97b","#38f9d7"]],
  tech:   [["#1e3c72","#2a5298"],["#434343","#000"],["#6a11cb","#2575fc"],["#4facfe","#00f2fe"]],
  food:   [["#f7971e","#ffd200"],["#f093fb","#f5576c"],["#43e97b","#38f9d7"],["#4facfe","#00f2fe"]],
  beauty: [["#f093fb","#f5576c"],["#667eea","#764ba2"],["#43e97b","#38f9d7"],["#f7971e","#ffd200"]],
  hogar:  [["#43e97b","#38f9d7"],["#f7971e","#ffd200"],["#667eea","#764ba2"],["#4facfe","#00f2fe"]],
  general:[["#667eea","#764ba2"],["#f093fb","#f5576c"],["#43e97b","#38f9d7"],["#4facfe","#00f2fe"]],
};

function LivePreview({ config, mode }: { config: BuilderConfig; mode: "desktop"|"mobile" }) {
  const pc = config.primaryColor || "#7c5cfc";
  const sc = config.secondaryColor || "#f43f8e";
  const name = config.name || "Mi Tienda";
  const tag  = config.tagline || "Bienvenido a nuestra colección";
  const type = config.type || "general";
  const pal  = PALETTES[type] || PALETTES.general;
  const rawProds = config.products?.length
    ? config.products.map((p,i) => ({ n: p.n||"Producto", p: p.p||"$50.000", g: pal[i%pal.length] }))
    : pal.slice(0, config.columns||3).map((g,i) => ({ n:`Producto ${i+1}`, p:"$50.000", g }));
  const cols = Math.min(config.columns||3, 3);

  const inner = (
    <div style={{ fontFamily:"sans-serif", color:"#1a1a2e", background:"#fafafa", minHeight:"100%" }}>
      {/* Nav */}
      <div style={{ padding:"8px 14px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid #eee", background:"rgba(250,250,250,0.95)", position:"sticky", top:0 }}>
        <span style={{ fontWeight:800, fontSize:13, background:`linear-gradient(135deg,${pc},${sc})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>{name}</span>
        <div style={{ display:"flex", gap:8, fontSize:10, color:"#bbb" }}>Inicio · Productos</div>
        <div style={{ background:`linear-gradient(135deg,${pc},${sc})`, color:"#fff", borderRadius:100, padding:"3px 10px", fontSize:10, fontWeight:700 }}>Carrito 0</div>
      </div>
      {/* Hero */}
      <div style={{ background:`linear-gradient(135deg,${pc}20,${sc}15)`, padding:"24px 14px", textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", width:160, height:160, borderRadius:"50%", background:`radial-gradient(circle,${pc}28,transparent)`, top:-60, left:-40, filter:"blur(35px)", pointerEvents:"none" }}/>
        <h1 style={{ fontWeight:800, fontSize:18, color:"#1a1a2e", letterSpacing:-.5, position:"relative" }}>{name}</h1>
        <p style={{ fontSize:11, color:"#777", marginTop:4, position:"relative" }}>{tag}</p>
        <button style={{ marginTop:12, background:`linear-gradient(135deg,${pc},${sc})`, color:"#fff", border:"none", borderRadius:100, padding:"7px 18px", fontSize:11, fontWeight:700, cursor:"pointer", boxShadow:`0 4px 16px ${pc}44`, position:"relative" }}>Ver colección →</button>
      </div>
      {/* Products */}
      <div style={{ padding:"12px 14px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
          <p style={{ fontSize:10, fontWeight:800, color:"#444", textTransform:"uppercase", letterSpacing:.6 }}>Destacados</p>
          <p style={{ fontSize:9, color:"#bbb" }}>{rawProds.length} artículos</p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:`repeat(${cols},1fr)`, gap:8 }}>
          {rawProds.slice(0,cols*2).map((p,i)=>(
            <div key={i} style={{ borderRadius:12, overflow:"hidden", background:"#fff", border:"1px solid #eeeef5", boxShadow:"0 2px 8px rgba(0,0,0,.05)" }}>
              <div style={{ height:70, background:`linear-gradient(135deg,${p.g[0]},${p.g[1]})`, display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
                <div style={{ width:36, height:36, borderRadius:10, background:"rgba(255,255,255,.3)", backdropFilter:"blur(4px)", border:"1px solid rgba(255,255,255,.4)" }}/>
              </div>
              <div style={{ padding:"7px 8px" }}>
                <div style={{ fontSize:10, fontWeight:700, color:"#1a1a2e" }}>{p.n}</div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:4 }}>
                  <span style={{ fontSize:10, fontWeight:800, color:pc }}>{p.p}</span>
                  <button style={{ background:`linear-gradient(135deg,${pc},${sc})`, color:"#fff", border:"none", borderRadius:100, padding:"3px 8px", fontSize:9, fontWeight:700, cursor:"pointer" }}>+</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (mode === "mobile") {
    return (
      <div className="flex-1 flex items-center justify-center p-6" style={{ background:"#050508" }}>
        <div className="relative" style={{ width:260, height:520 }}>
          <div className="absolute inset-0 rounded-[38px] overflow-hidden border-2" style={{ borderColor:"rgba(255,255,255,0.15)", background:"#0e0e16", boxShadow:"0 24px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)" }}>
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 rounded-b-2xl z-10 flex items-center justify-center" style={{ background:"#0e0e16", borderBottom:"1px solid rgba(255,255,255,0.1)" }}>
              <div className="w-12 h-1 rounded-full" style={{ background:"rgba(255,255,255,0.2)" }}/>
            </div>
            <div className="absolute inset-0 overflow-y-auto mt-6 bg-white rounded-b-[38px]">{inner}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 m-5 overflow-hidden rounded-2xl border" style={{ borderColor:"rgba(255,255,255,0.08)", background:"#fff", boxShadow:"0 32px 80px rgba(0,0,0,0.5)" }}>
      {/* Browser bar */}
      <div className="flex items-center gap-2 px-3 py-2.5" style={{ background:"#f0f0f5", borderBottom:"1px solid #e0e0e8" }}>
        <div className="flex gap-1.5">
          {["#ff5f57","#febc2e","#28c840"].map(c=><span key={c} className="w-2.5 h-2.5 rounded-full" style={{ background:c }}/>)}
        </div>
        <div className="flex-1 bg-white rounded-full px-3 py-1 text-xs font-medium" style={{ color:"#666", border:"1px solid #e0e0e8" }}>
          tutienda.com/{config.name?.toLowerCase().replace(/\s+/g,"-") || "mi-tienda"}
        </div>
      </div>
      <div className="overflow-y-auto" style={{ height:"calc(100% - 40px)" }}>{inner}</div>
    </div>
  );
}

export default function BuilderPage() {
  const router = useRouter();
  const { builderConfig, setBuilderConfig, addStore, stores, resetBuilder } = useAppStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(5);
  const [previewMode, setPreviewMode] = useState<"desktop"|"mobile">("desktop");
  const [readyToPublish, setReadyToPublish] = useState(false);
  const [history, setHistory] = useState<{role:string;content:string}[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const [published, setPublished] = useState(false);
  const [publishedSlug, setPublishedSlug] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, loading]);

  useEffect(() => {
    if (!started.current) { started.current = true; sendFirstMessage(); }
  }, []);

  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "tienda";
  }

  function parsePrice(p: string): number {
    return parseInt(p.replace(/[^0-9]/g, "")) || 0;
  }

  function publishStore() {
    const { name, type, primaryColor, secondaryColor, columns, style, tagline, products } = builderConfig;
    if (!name) return;

    const existingSlugs = stores.map(s => s.slug);
    let slug = generateSlug(name);
    let counter = 1;
    const baseSlug = slug;
    while (existingSlugs.includes(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const storeId = `store-${Date.now()}`;
    const pal = PALETTES[type || "general"] || PALETTES.general;

    const fullProducts = (products || []).map((p: any, i: number) => ({
      id: `prod-${Date.now()}-${i}`,
      storeId,
      name: p.n || p.name || `Producto ${i + 1}`,
      sku: `SKU-${i + 1}`,
      description: p.d || p.description || "",
      price: typeof p.p === "number" ? p.p : parsePrice(String(p.p || "0")),
      stock: 50,
      category: type || "General",
      variants: [],
      gradient: pal[i % pal.length] as [string, string],
      badge: i === 0 ? "Nuevo" : "",
      active: true,
      sales: 0,
    }));

    addStore({
      id: storeId,
      name,
      slug,
      tagline: tagline || "Bienvenido a nuestra tienda",
      type: type || "general",
      primaryColor: primaryColor || "#7c5cfc",
      secondaryColor: secondaryColor || "#f43f8e",
      columns: columns || 3,
      style: style || "moderno",
      active: true,
      products: fullProducts,
      createdAt: new Date().toISOString().split("T")[0],
    } as any);

    setPublished(true);
    setPublishedSlug(slug);
  }

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/store/${publishedSlug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function createAnother() {
    resetBuilder();
    setPublished(false);
    setPublishedSlug("");
    setCopied(false);
    setMessages([]);
    setHistory([]);
    setProgress(5);
    setReadyToPublish(false);
    started.current = false;
    setTimeout(() => sendFirstMessage(), 100);
  }

  async function callAPI(userText: string) {
    const newHistory = [...history, { role:"user", content:userText }];
    setHistory(newHistory);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({ system:BUILDER_SYSTEM, messages:newHistory, maxTokens:700 }),
      });
      const data = await res.json();
      const raw = data.text || "{}";
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      let parsed: any = {};
      try { parsed = JSON.parse(jsonMatch?.[0] || raw); } catch {}

      const botMsg = parsed.message || raw;
      const newH = [...newHistory, { role:"assistant", content:raw }];
      setHistory(newH);

      if (parsed.configUpdate && Object.keys(parsed.configUpdate).length > 0) {
        setBuilderConfig(parsed.configUpdate);
      }
      if (parsed.progress) setProgress(parsed.progress);
      if (parsed.readyToPublish) setReadyToPublish(true);

      setMessages(m => [...m, {
        id: Date.now().toString(), role:"assistant", content:botMsg,
        timestamp:new Date(), quickReplies:parsed.quickReplies||[]
      } as any]);
    } catch {
      setMessages(m => [...m, { id:Date.now().toString(), role:"assistant", content:"Ups, tuve un problema. ¿Puedes repetir eso?", timestamp:new Date() } as any]);
    }
    setLoading(false);
  }

  async function sendFirstMessage() {
    setLoading(true);
    await callAPI("Hola, quiero crear mi tienda");
  }

  async function send(text?: string) {
    const val = (text || input).trim();
    if (!val || loading) return;
    setInput("");
    setMessages(m => [...m, { id:Date.now().toString(), role:"user", content:val, timestamp:new Date() }]);
    await callAPI(val);
  }

  function renderContent(text: string) {
    return text.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>").replace(/\n/g,"<br>");
  }

  if (published) {
    const storeUrl = typeof window !== "undefined" ? `${window.location.origin}/store/${publishedSlug}` : `/store/${publishedSlug}`;
    return (
      <div className="flex items-center justify-center min-h-screen p-6" style={{ background: "#050508" }}>
        <div className="max-w-lg w-full text-center space-y-8">
          {/* Animated icon */}
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 rounded-3xl animate-pulse" style={{ background: "linear-gradient(135deg,#06d6a0,#38f9d7)", opacity: 0.3, filter: "blur(20px)" }} />
            <div className="relative w-24 h-24 rounded-3xl flex items-center justify-center text-4xl" style={{ background: "linear-gradient(135deg,#06d6a0,#38f9d7)", boxShadow: "0 20px 60px rgba(6,214,160,0.4)" }}>
              🚀
            </div>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-4xl font-black mb-3" style={{ fontFamily: "var(--font-syne)", background: "linear-gradient(135deg,#c4b5fd,#f9a8d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              ¡Tu tienda está en vivo!
            </h1>
            <p className="text-lg" style={{ color: "#8884aa" }}>
              <strong style={{ color: "#c4b5fd" }}>{builderConfig.name}</strong> ya está lista para recibir clientes
            </p>
          </div>

          {/* Link card */}
          <div className="p-5 rounded-2xl flex items-center gap-4 text-left" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: `linear-gradient(135deg,${builderConfig.primaryColor || "#7c5cfc"},${builderConfig.secondaryColor || "#f43f8e"})`, boxShadow: `0 8px 24px ${builderConfig.primaryColor || "#7c5cfc"}44` }}>
              🏪
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{builderConfig.name}</p>
              <p className="text-xs mt-1 font-mono truncate" style={{ color: "#c4b5fd" }}>{storeUrl}</p>
            </div>
            <button onClick={copyLink} className="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all flex-shrink-0"
              style={{ background: copied ? "rgba(6,214,160,0.2)" : "rgba(255,255,255,0.06)", border: `1px solid ${copied ? "rgba(6,214,160,0.4)" : "rgba(255,255,255,0.1)"}`, color: copied ? "#06d6a0" : "#8884aa" }}>
              {copied ? "✓ Copiado" : "📋 Copiar"}
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={`/store/${publishedSlug}`} className="flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white transition-all hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg,#7c5cfc,#a855f7)", boxShadow: "0 8px 24px rgba(124,92,252,0.4)" }}>
              <Eye size={16} /> Ver mi tienda
            </Link>
            <Link href="/dashboard" className="flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all hover:-translate-y-0.5"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#c4b5fd" }}>
              Ir al panel
            </Link>
            <button onClick={createAnother} className="flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all hover:-translate-y-0.5"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#8884aa" }}>
              + Crear otra
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background:"#050508" }}>
      {/* Chat panel */}
      <div className="flex flex-col border-r" style={{ width:400, minWidth:320, borderColor:"rgba(255,255,255,0.06)", background:"rgba(14,14,22,0.8)", backdropFilter:"blur(20px)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0" style={{ borderColor:"rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="w-8 h-8 rounded-lg flex items-center justify-center transition-all btn-sm"><ArrowLeft size={14}/></Link>
            <span className="font-black text-sm gradient-text" style={{ fontFamily:"var(--font-syne)" }}>Maket AI</span>
            <span className="text-xs" style={{ color:"#8884aa" }}>/ Constructor</span>
          </div>
          {readyToPublish && (
            <button className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5" onClick={publishStore}>
              <Rocket size={12}/>Publicar
            </button>
          )}
        </div>

        {/* Progress */}
        <div className="px-4 py-3 border-b flex-shrink-0" style={{ borderColor:"rgba(255,255,255,0.04)", background:"#161622" }}>
          <div className="flex justify-between text-xs mb-1.5" style={{ color:"#8884aa" }}>
            <span className="font-semibold">Construyendo tu tienda</span>
            <span className="font-bold" style={{ color:"#c4b5fd" }}>{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,0.06)" }}>
            <div className="h-full rounded-full transition-all duration-700" style={{ width:`${progress}%`, background:"linear-gradient(90deg,#7c5cfc,#a855f7,#f43f8e)", backgroundSize:"200% auto", animation:"gradientShift 3s linear infinite" }}/>
          </div>
        </div>

        {/* Agent header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0" style={{ borderColor:"rgba(255,255,255,0.06)", background:"rgba(124,92,252,0.06)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 relative" style={{ background:"linear-gradient(135deg,#7c5cfc,#f43f8e)", boxShadow:"0 4px 16px rgba(124,92,252,0.4)" }}>
            🏗️
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2" style={{ background:"#06d6a0", borderColor:"#0e0e16", boxShadow:"0 0 6px #06d6a0" }}/>
          </div>
          <div>
            <div className="font-bold text-sm" style={{ fontFamily:"var(--font-syne)" }}>Agente Constructor</div>
            <div className="text-xs font-semibold mt-0.5" style={{ color:"#06d6a0" }}>● En línea · Creando tu tienda</div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
          {messages.map(msg => (
            <div key={msg.id} className={`flex flex-col animate-slide-up ${msg.role==="user"?"items-end":"items-start"}`}>
              {msg.role==="assistant" && (
                <div className="text-[10px] font-black mb-1.5 tracking-wider" style={{ color:"#3d3b5a" }}>🏗️ AGENTE CONSTRUCTOR</div>
              )}
              <div className="max-w-[90%] px-4 py-3 rounded-2xl text-sm leading-relaxed"
                style={msg.role==="assistant"
                  ? { background:"linear-gradient(145deg,#1e1e2e,#161622)", border:"1px solid rgba(255,255,255,0.06)", borderBottomLeftRadius:4 }
                  : { background:"linear-gradient(135deg,#7c5cfc,#a855f7,#ec4899)", color:"#fff", borderBottomRightRadius:4 }}
                dangerouslySetInnerHTML={{ __html:renderContent(msg.content) }}/>
              {msg.role==="assistant" && (msg as any).quickReplies?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(msg as any).quickReplies.map((qr: string) => (
                    <button key={qr} onClick={()=>send(qr)} disabled={loading}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 disabled:opacity-40"
                      style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"#8884aa" }}
                      onMouseEnter={e=>{ e.currentTarget.style.borderColor="rgba(124,92,252,0.4)"; e.currentTarget.style.color="#c4b5fd"; }}
                      onMouseLeave={e=>{ e.currentTarget.style.borderColor="rgba(255,255,255,0.1)"; e.currentTarget.style.color="#8884aa"; }}>
                      {qr}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex flex-col items-start">
              <div className="text-[10px] font-black mb-1.5 tracking-wider" style={{ color:"#3d3b5a" }}>🏗️ AGENTE CONSTRUCTOR</div>
              <div className="px-4 py-3 rounded-2xl" style={{ background:"linear-gradient(145deg,#1e1e2e,#161622)", border:"1px solid rgba(255,255,255,0.06)", borderBottomLeftRadius:4 }}>
                <TypingIndicator/>
              </div>
            </div>
          )}
          <div ref={messagesEndRef}/>
        </div>

        {/* Input */}
        <div className="px-4 py-3 flex gap-2 items-center flex-shrink-0 border-t" style={{ borderColor:"rgba(255,255,255,0.06)", background:"#0e0e16" }}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&(e.preventDefault(),send())}
            placeholder="Escribe tu respuesta..." className="input-field flex-1 rounded-full py-2.5" disabled={loading}/>
          <button onClick={()=>send()} disabled={loading||!input.trim()}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0 transition-all duration-200 disabled:opacity-40"
            style={{ background:"linear-gradient(135deg,#7c5cfc,#a855f7)", boxShadow:"0 4px 16px rgba(124,92,252,0.4)" }}
            onMouseEnter={e=>!loading&&(e.currentTarget.style.transform="scale(1.1) rotate(5deg)")}
            onMouseLeave={e=>(e.currentTarget.style.transform="")}>
            <Send size={15}/>
          </button>
        </div>
      </div>

      {/* Preview panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Preview header */}
        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0 border-b" style={{ borderColor:"rgba(255,255,255,0.06)", background:"rgba(14,14,22,0.9)" }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse-dot" style={{ background:"#f43f8e", boxShadow:"0 0 6px #f43f8e" }}/>
            <span className="text-sm font-bold" style={{ color:"#8884aa" }}>Vista previa en vivo</span>
          </div>
          <div className="flex rounded-xl overflow-hidden border" style={{ borderColor:"rgba(255,255,255,0.08)" }}>
            {([["desktop",Monitor],["mobile",Smartphone]] as const).map(([mode,Icon])=>(
              <button key={mode} onClick={()=>setPreviewMode(mode)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-all duration-200"
                style={{ background:previewMode===mode?"linear-gradient(135deg,#7c5cfc,#a855f7)":"#1e1e2e", color:previewMode===mode?"#fff":"#8884aa" }}>
                <Icon size={13}/>{mode==="desktop"?"Escritorio":"Móvil"}
              </button>
            ))}
          </div>
        </div>
        <LivePreview config={builderConfig} mode={previewMode}/>
      </div>
    </div>
  );
}
