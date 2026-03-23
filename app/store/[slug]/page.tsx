"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { TypingIndicator } from "@/components/ui";
import { ShoppingCart, MessageCircle, X, Send } from "lucide-react";
import { formatCOP } from "@/lib/data";
import type { ProductLegacy as Product, Message } from "@/types";

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

function ProductCard({ p, pc, sc, onAdd }: { p:Product; pc:string; sc:string; onAdd:(p:Product)=>void }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 hover:-translate-y-2"
      style={{ border:"1px solid #eeeef5", boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}
      onClick={()=>onAdd(p)}>
      {/* Image */}
      <div className="h-48 relative overflow-hidden" style={{ background:`linear-gradient(135deg,${p.gradient[0]},${p.gradient[1]})` }}>
        {/* Shimmer */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{ background:"linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.6) 50%,transparent 60%)", animation:"shimmer 0.6s ease" }}/>
        {/* Product shape */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 rounded-2xl transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl"
            style={{ background:`linear-gradient(145deg,${p.gradient[0]}cc,${p.gradient[1]}cc)`, boxShadow:`0 8px 32px ${p.gradient[0]}66` }}>
            <div className="w-full h-full rounded-2xl" style={{ background:"rgba(255,255,255,0.2)", backdropFilter:"blur(4px)" }}/>
          </div>
        </div>
        {p.badge && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold text-white" style={{ background:`linear-gradient(135deg,${pc},${sc})` }}>{p.badge}</div>
        )}
        {p.stock <= 5 && p.stock > 0 && (
          <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background:"rgba(251,191,36,0.9)", color:"#1a1a2e" }}>¡Últimas {p.stock}!</div>
        )}
      </div>
      {/* Info */}
      <div className="p-4">
        <div className="font-bold text-sm mb-1" style={{ color:"#1a1a2e" }}>{p.name}</div>
        <div className="text-xs mb-3" style={{ color:"#9090aa" }}>{p.description}</div>
        <div className="flex items-center justify-between">
          <span className="text-xl font-black" style={{ fontFamily:"var(--font-syne)", color:pc }}>{formatCOP(p.price)}</span>
          <button className="px-4 py-2 rounded-full text-xs font-bold text-white transition-all duration-200 hover:scale-105"
            style={{ background:`linear-gradient(135deg,${pc},${sc})`, boxShadow:`0 4px 12px ${pc}44` }}
            onClick={e=>{e.stopPropagation();onAdd(p);}}>
            + Agregar
          </button>
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
        <div className="text-6xl">🔍</div>
        <h1 className="text-3xl font-black" style={{ fontFamily:"var(--font-syne)", color:"#1a1a2e" }}>Tienda no encontrada</h1>
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
      setMessages(m=>[...m,{ id:Date.now().toString(),role:"assistant",content:"Error de conexión 😕",timestamp:new Date() }]);
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
    <div style={{ background:"#fafafa", minHeight:"100vh", fontFamily:"var(--font-jakarta)", color:"#1a1a2e" }}>
      {/* Topbar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3"
        style={{ background:"rgba(250,250,250,0.92)", borderBottom:"1px solid #eeeef5", backdropFilter:"blur(20px)" }}>
        <div className="font-black text-xl" style={{ fontFamily:"var(--font-syne)", background:`linear-gradient(135deg,${pc},${sc})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
          {storeName}
        </div>
        <nav className="hidden md:flex gap-6 text-sm font-medium" style={{ color:"#777" }}>
          <a href="#" className="hover:text-gray-900 transition-colors">Inicio</a>
          <a href="#productos" className="hover:text-gray-900 transition-colors">Colección</a>
          <a href="#" className="hover:text-gray-900 transition-colors">Nosotros</a>
        </nav>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5"
            style={{ background:`linear-gradient(135deg,${pc},${sc})`, boxShadow:`0 4px 16px ${pc}44` }}>
            <ShoppingCart size={15}/> <span className="hidden sm:inline">Carrito</span> ({cart.length})
          </button>
          <Link href="/dashboard" className="px-3 py-2 rounded-full text-xs font-semibold border transition-all" style={{ color:"#777", borderColor:"#ddd" }}>← Panel</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="min-h-[420px] flex flex-col items-center justify-center text-center px-6 py-16 relative overflow-hidden"
        style={{ background:`linear-gradient(135deg,${pc}15,${sc}10)` }}>
        <div className="absolute w-96 h-96 rounded-full pointer-events-none" style={{ background:`radial-gradient(circle,${pc}30,transparent)`, filter:"blur(60px)", top:"-100px", left:"-80px" }}/>
        <div className="absolute w-64 h-64 rounded-full pointer-events-none" style={{ background:`radial-gradient(circle,${sc}25,transparent)`, filter:"blur(50px)", bottom:"-50px", right:"-60px" }}/>
        <h1 className="text-5xl md:text-6xl font-black leading-tight tracking-tight mb-4 relative" style={{ fontFamily:"var(--font-syne)" }}>
          {store.tagline || "Descubre nuestra colección"}
        </h1>
        <p className="text-lg mb-8 max-w-md opacity-70 relative">Descubre piezas únicas, diseñadas para destacar.</p>
        <a href="#productos"
          className="px-8 py-4 rounded-full text-base font-bold text-white transition-all duration-200 hover:-translate-y-1 relative"
          style={{ background:`linear-gradient(135deg,${pc},${sc})`, boxShadow:`0 8px 32px ${pc}44` }}>
          Explorar colección →
        </a>
      </section>

      {/* Products */}
      <section id="productos" className="px-6 py-14">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-baseline gap-3 mb-8">
            <h2 className="text-3xl font-black" style={{ fontFamily:"var(--font-syne)" }}>Productos destacados</h2>
            <span className="text-sm" style={{ color:"#aaa" }}>{store.products.length} artículos</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {store.products.map(p=><ProductCard key={p.id} p={p} pc={pc} sc={sc} onAdd={addToCart}/>)}
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <div className="py-8 px-6 flex justify-center gap-8 flex-wrap" style={{ borderTop:"1px solid #eeeef5", background:"#f5f5fc" }}>
        {[["🔒","Pago seguro","SSL certificado"],["🚚","Envío rápido","2-5 días hábiles"],["↩️","Devoluciones","30 días sin preguntas"],["⭐","4.9/5 estrellas","+2,400 reseñas"]].map(([icon,title,sub])=>(
          <div key={title} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background:`${pc}15` }}>{icon}</div>
            <div><div className="font-bold text-sm">{title}</div><div className="text-xs mt-0.5" style={{ color:"#999" }}>{sub}</div></div>
          </div>
        ))}
      </div>

      {/* Sales agent */}
      <div className="fixed bottom-6 right-6 z-50">
        {chatOpen && (
          <div className="absolute bottom-16 right-0 w-80 rounded-2xl overflow-hidden flex flex-col animate-slide-up"
            style={{ background:"#fff", border:"1px solid #eeeef5", boxShadow:"0 24px 60px rgba(0,0,0,0.18)" }}>
            {/* Chat head */}
            <div className="flex items-center gap-3 p-4" style={{ background:`linear-gradient(135deg,${pc},${sc})` }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background:"rgba(255,255,255,0.2)" }}>🤖</div>
              <div>
                <div className="font-bold text-sm text-white" style={{ fontFamily:"var(--font-syne)" }}>Asistente de compras</div>
                <div className="flex items-center gap-1.5 text-xs mt-0.5" style={{ color:"rgba(255,255,255,0.8)" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-dot"/>En línea
                </div>
              </div>
              <button onClick={()=>setChatOpen(false)} className="ml-auto w-7 h-7 rounded-full flex items-center justify-center" style={{ background:"rgba(255,255,255,0.2)" }}>
                <X size={13} color="white"/>
              </button>
            </div>
            {/* Messages */}
            <div className="flex flex-col gap-2 p-3 max-h-56 overflow-y-auto" style={{ background:"#fafafa" }}>
              {messages.map(msg=>(
                <div key={msg.id} className={`flex ${msg.role==="user"?"justify-end":"justify-start"}`}>
                  <div className="max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed"
                    style={msg.role==="assistant"
                      ? { background:"#fff", border:"1px solid #eee", borderBottomLeftRadius:3, color:"#333" }
                      : { background:`linear-gradient(135deg,${pc},${sc})`, color:"#fff", borderBottomRightRadius:3 }}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {messages.length>0 && messages[messages.length-1].role==="assistant" && (messages[messages.length-1] as any).quickReplies?.length>0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {((messages[messages.length-1] as any).quickReplies||[]).map((qr:string)=>(
                    <button key={qr} onClick={()=>sendSales(qr)} className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all" style={{ background:"#fff", border:"1px solid #e8e8f0", color:"#555" }}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=`${pc}66`;e.currentTarget.style.color=pc;}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor="#e8e8f0";e.currentTarget.style.color="#555";}}>
                      {qr}
                    </button>
                  ))}
                </div>
              )}
              {loading&&<div className="flex"><div className="px-3 py-2 rounded-xl" style={{ background:"#fff",border:"1px solid #eee",borderBottomLeftRadius:3 }}><TypingIndicator/></div></div>}
              <div ref={messagesEndRef}/>
            </div>
            {/* Input */}
            <div className="flex gap-2 p-2.5" style={{ borderTop:"1px solid #f0f0f8" }}>
              <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendSales()} placeholder="Pregúntame algo..."
                className="flex-1 rounded-full px-3 py-2 text-sm outline-none" style={{ background:"#f4f4fb", border:"1px solid #eeeef8" }}/>
              <button onClick={()=>sendSales()} disabled={!input.trim()||loading} className="w-8 h-8 rounded-full flex items-center justify-center text-white disabled:opacity-40"
                style={{ background:`linear-gradient(135deg,${pc},${sc})` }}><Send size={13}/></button>
            </div>
          </div>
        )}
        <button onClick={()=>{ setChatOpen(o=>!o); if(!chatStarted)startSalesChat(); }}
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-white transition-all duration-300 hover:scale-110 relative"
          style={{ background:`linear-gradient(135deg,${pc},${sc})`, boxShadow:`0 8px 24px ${pc}55, 0 0 0 1px rgba(255,255,255,0.1)` }}>
          <MessageCircle size={22}/>
          <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ background:`linear-gradient(135deg,${pc},${sc})`, opacity:.4, animation:"fabPulse 2.5s ease-in-out infinite" }}/>
        </button>
      </div>
    </div>
  );
}
