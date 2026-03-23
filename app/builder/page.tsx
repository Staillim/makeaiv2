"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { TypingIndicator } from "@/components/ui";
import { Send, ArrowLeft, Eye, Smartphone, Monitor, Rocket, Truck, Lock, RotateCcw, Star, Store, Copy, Camera, Bot, Wrench, Package, Check } from "lucide-react";
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
7. Confirmación + oferta de publicar

NOTA IMPORTANTE: NO preguntes por productos específicos ni precios. Los productos los agregará el usuario después con fotos reales desde su panel. Solo diseña la tienda.

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
    "tagline": "slogan"
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

const PRODUCT_IMAGES: Record<string, string[]> = {
  ropa:    [
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=300&h=250&fit=crop&auto=format&q=80",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=250&fit=crop&auto=format&q=80",
    "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=300&h=250&fit=crop&auto=format&q=80",
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&h=250&fit=crop&auto=format&q=80",
  ],
  tech:    [
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=250&fit=crop&auto=format&q=80",
    "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=300&h=250&fit=crop&auto=format&q=80",
    "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=300&h=250&fit=crop&auto=format&q=80",
    "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=300&h=250&fit=crop&auto=format&q=80",
  ],
  food:    [
    "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=300&h=250&fit=crop&auto=format&q=80",
    "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=300&h=250&fit=crop&auto=format&q=80",
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&h=250&fit=crop&auto=format&q=80",
    "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=300&h=250&fit=crop&auto=format&q=80",
  ],
  beauty:  [
    "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=300&h=250&fit=crop&auto=format&q=80",
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=250&fit=crop&auto=format&q=80",
    "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=300&h=250&fit=crop&auto=format&q=80",
    "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=300&h=250&fit=crop&auto=format&q=80",
  ],
  hogar:   [
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&h=250&fit=crop&auto=format&q=80",
    "https://images.unsplash.com/photo-1618220179428-22790b461013?w=300&h=250&fit=crop&auto=format&q=80",
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=250&fit=crop&auto=format&q=80",
    "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=300&h=250&fit=crop&auto=format&q=80",
  ],
  general: [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=250&fit=crop&auto=format&q=80",
    "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=300&h=250&fit=crop&auto=format&q=80",
    "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=300&h=250&fit=crop&auto=format&q=80",
    "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=250&fit=crop&auto=format&q=80",
  ],
};

// Placeholder products auto-generated by store type (shown at publish, user adds real ones with photos after)
const EXAMPLE_PRODUCTS: Record<string, Array<{ name: string; price: number; description: string }>> = {
  ropa:    [
    { name: "Camiseta Básica",    price: 45000,  description: "100% algodón, varios colores" },
    { name: "Jeans Slim Fit",     price: 89000,  description: "Corte moderno, talla S-XL" },
    { name: "Chaqueta Casual",    price: 120000, description: "Ideal para cualquier ocasión" },
    { name: "Vestido Floral",     price: 75000,  description: "Colección primavera-verano" },
  ],
  tech:    [
    { name: "Audífonos Bluetooth",     price: 95000,  description: "Batería 24h, cancelación de ruido" },
    { name: "Funda para Celular",      price: 28000,  description: "Compatible con todos los modelos" },
    { name: "Cargador Inalámbrico",    price: 65000,  description: "15W de carga rápida" },
    { name: "Cable USB-C Trenzado",    price: 22000,  description: "Resistente, 1.5m de largo" },
  ],
  food:    [
    { name: "Combo Especial",      price: 35000, description: "Para 2 personas, incluye bebida" },
    { name: "Bebida Natural 500ml",price: 8000,  description: "Sin conservantes ni azúcar añadida" },
    { name: "Snack Saludable",     price: 12000, description: "Ideal para llevar" },
    { name: "Kit de Degustación", price: 55000, description: "4 productos seleccionados" },
  ],
  beauty:  [
    { name: "Sérum Facial",       price: 85000,  description: "Con vitamina C, anti-manchas" },
    { name: "Hidratante SPF 50",  price: 68000,  description: "Protección solar diaria" },
    { name: "Kit de Maquillaje", price: 120000, description: "Set completo para toda ocasión" },
    { name: "Perfume Floral",     price: 95000,  description: "30ml, larga duración" },
  ],
  hogar:   [
    { name: "Cojín Decorativo",   price: 42000, description: "45x45cm, varios estilos" },
    { name: "Vela Aromática",     price: 28000, description: "Quema limpia, 40h de duración" },
    { name: "Cuadro Moderno",     price: 75000, description: "30x40cm, listo para colgar" },
    { name: "Planta Artificial",  price: 38000, description: "Sin mantenimiento, muy realista" },
  ],
  general: [
    { name: "Producto Destacado",  price: 50000, description: "El favorito de nuestros clientes" },
    { name: "Artículo Popular",    price: 75000, description: "Alta demanda, pocas unidades" },
    { name: "Oferta Especial",     price: 35000, description: "Precio limitado por tiempo" },
    { name: "Novedad del Mes",     price: 90000, description: "Recién llegado a nuestra tienda" },
  ],
};

function LivePreview({ config, mode }: { config: BuilderConfig; mode: "desktop"|"mobile" }) {
  const pc = config.primaryColor || "#7c5cfc";
  const name = config.name || "Mi Tienda";
  const tag  = config.tagline || "Bienvenido a nuestra colección";
  const type = config.type || "general";
  const pal  = PALETTES[type] || PALETTES.general;
  const previewImages = PRODUCT_IMAGES[type] || PRODUCT_IMAGES.general;
  const exProds = EXAMPLE_PRODUCTS[type] || EXAMPLE_PRODUCTS.general;
  const rawProds = exProds.slice(0, config.columns || 3).map((p, i) => ({
    n: p.name,
    p: `$${p.price.toLocaleString("es-CO")}`,
    img: previewImages[i % previewImages.length],
  }));
  const cols = Math.min(config.columns||3, 3);

  const inner = (
    <div style={{ fontFamily:"sans-serif", color:"#1a1a2e", background:"#f3f4f6", minHeight:"100%" }}>
      {/* Nav */}
      <div style={{ padding:"8px 14px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid #e4e4e4", background:"#fff", position:"sticky", top:0, boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}>
        <span style={{ fontWeight:800, fontSize:12, color:"#1a1a2e" }}>
          <span style={{ color: pc }}>{name[0]}</span>{name.slice(1)}
        </span>
        <div style={{ display:"flex", gap:8, fontSize:9, color:"#aaa" }}>Inicio · Colección · Ofertas</div>
        <div style={{ background: pc, color:"#fff", borderRadius:6, padding:"3px 9px", fontSize:9, fontWeight:700 }}>Carrito 0</div>
      </div>
      {/* Hero banner */}
      <div style={{ background:"#fff", padding:"18px 14px", borderBottom:"1px solid #e4e4e4", display:"flex", justifyContent:"space-between", alignItems:"center", gap:8 }}>
        <div>
          <div style={{ fontSize:8, fontWeight:700, color: pc, marginBottom:4, textTransform:"uppercase", letterSpacing:.5 }}>{type} · Colección nueva</div>
          <h1 style={{ fontWeight:800, fontSize:14, color:"#111", letterSpacing:-.3, lineHeight:1.3, marginBottom:4 }}>{tag || name}</h1>
          <p style={{ fontSize:9, color:"#999", marginBottom:8 }}>{rawProds.length} productos · Envío gratis</p>
          <button style={{ background: pc, color:"#fff", border:"none", borderRadius:6, padding:"5px 12px", fontSize:9, fontWeight:700, cursor:"pointer" }}>Ver colección →</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4, flexShrink:0 }}>
          {[
            { ic:<Truck size={9} color="#555"/>, lb:"Envío gratis" },
            { ic:<Lock size={9} color="#555"/>, lb:"Pago seguro" },
            { ic:<RotateCcw size={9} color="#555"/>, lb:"Devoluciones" },
            { ic:<Star size={9} color="#f5a623"/>, lb:"4.9 estrellas" },
          ].map((b,i)=>(
            <div key={i} style={{ background:"#f9f9f9", border:"1px solid #eee", borderRadius:6, padding:"4px 6px", fontSize:8, display:"flex", alignItems:"center", gap:3 }}>
              {b.ic}<span style={{ color:"#555", fontWeight:600 }}>{b.lb}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Products */}
      <div style={{ padding:"12px 14px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
          <p style={{ fontSize:10, fontWeight:800, color:"#111" }}>Productos destacados</p>
          <p style={{ fontSize:8, color:"#bbb" }}>{rawProds.length} artículos</p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:`repeat(${cols},1fr)`, gap:6 }}>
          {rawProds.slice(0,cols*2).map((p,i)=>(
            <div key={i} style={{ borderRadius:10, overflow:"hidden", background:"#fff", border:"1px solid #e8e8e8", boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
              {/* Image area */}
              <div style={{ height:64, overflow:"hidden", position:"relative", background:"#f8f8f8" }}>
                {i === 0 && <div style={{ position:"absolute", top:3, left:3, zIndex:2, background: pc, color:"#fff", borderRadius:3, padding:"1px 5px", fontSize:7, fontWeight:700 }}>Nuevo</div>}
                <img src={p.img} alt={p.n} style={{ width:"100%", height:"100%", objectFit:"contain", display:"block", padding:4 }} />
              </div>
              <div style={{ padding:"6px 7px" }}>
                <div style={{ fontSize:9, fontWeight:600, color:"#1a1a2e", marginBottom:3, lineHeight:1.3 }}>{p.n}</div>
                {/* Stars */}
                <div style={{ fontSize:9, color:"#f5a623", marginBottom:3 }}>★★★★<span style={{ color:"#e0e0e0" }}>★</span> <span style={{ color:"#bbb", fontSize:8 }}>(128)</span></div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <span style={{ fontSize:10, fontWeight:800, color:"#1a1a2e" }}>{p.p}</span>
                  <button style={{ background: pc, color:"#fff", border:"none", borderRadius:4, padding:"2px 7px", fontSize:8, fontWeight:700, cursor:"pointer" }}>+ Agregar</button>
                </div>
                <div style={{ fontSize:7, color:"#2a9d5c", marginTop:2, fontWeight:600, display:"flex", alignItems:"center", gap:2 }}><Truck size={7} color="#2a9d5c"/> Envío gratis</div>
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

  async function publishStore() {
    const { name, type, primaryColor, secondaryColor, columns, style, tagline } = builderConfig;
    if (!name) return;

    const existingSlugs = stores.map(s => s.slug);
    let slug = generateSlug(name);
    let counter = 1;
    const baseSlug = slug;
    while (existingSlugs.includes(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const pal = PALETTES[type || "general"] || PALETTES.general;

    // Auto-generate placeholder products from store type (user will add real ones with photos after)
    const exampleList = EXAMPLE_PRODUCTS[type || "general"] || EXAMPLE_PRODUCTS.general;
    const images = PRODUCT_IMAGES[type || "general"] || PRODUCT_IMAGES.general;
    const fullProducts = exampleList.map((p, i) => ({
      name: p.name,
      sku: `SKU-${i + 1}`,
      description: p.description,
      price: p.price,
      stock: 10,
      category: type || "general",
      gradient: pal[i % pal.length] as [string, string],
      badge: i === 0 ? "Nuevo" : "",
      image: images[i % images.length],
    }));

    // Try to save in Supabase first
    let finalStoreId = `store-${Date.now()}`;
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: dbStore, error: storeErr } = await supabase
          .from("stores")
          .insert({
            owner_id: user.id,
            name,
            slug,
            tagline: tagline || "Bienvenido a nuestra tienda",
            type: type || "general",
            primary_color: primaryColor || "#7c5cfc",
            secondary_color: secondaryColor || "#f43f8e",
            columns: columns || 3,
            style: style || "moderno",
            active: true,
            total_products: fullProducts.length,
          })
          .select()
          .single();

        if (!storeErr && dbStore) {
          finalStoreId = dbStore.id;
          if (fullProducts.length > 0) {
            await supabase.from("products").insert(
              fullProducts.map((p) => ({
                store_id: finalStoreId,
                name: p.name,
                sku: p.sku,
                description: p.description,
                price: p.price,
                stock: p.stock,
                category: p.category,
                variants: [],
                gradient_from: p.gradient[0],
                gradient_to: p.gradient[1],
                badge: p.badge || "",
                active: true,
                sales: 0,
              }))
            );
          }
        }
      }
    } catch (_) {
      // Supabase not available, save locally only
    }

    addStore({
      id: finalStoreId,
      name,
      slug,
      tagline: tagline || "Bienvenido a nuestra tienda",
      type: type || "general",
      primaryColor: primaryColor || "#7c5cfc",
      secondaryColor: secondaryColor || "#f43f8e",
      columns: columns || 3,
      style: style || "moderno",
      active: true,
      products: fullProducts.map((p, i) => ({
        id: `prod-${Date.now()}-${i}`,
        storeId: finalStoreId,
        name: p.name,
        sku: p.sku,
        description: p.description,
        price: p.price,
        stock: p.stock,
        category: p.category,
        variants: [],
        gradient: p.gradient,
        badge: p.badge,
        image: p.image,
        active: true,
        sales: 0,
      })),
      createdAt: new Date().toISOString().split("T")[0],
    } as any);

    setPublished(true);
    setPublishedSlug(slug);
    // Redirect to products panel so user can add real products with photos
    setTimeout(() => router.push("/dashboard/productos"), 2800);
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
            <div className="relative w-24 h-24 rounded-3xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#06d6a0,#38f9d7)", boxShadow: "0 20px 60px rgba(6,214,160,0.4)" }}>
              <Rocket size={44} color="#0a3d2a"/>
            </div>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-4xl font-black mb-3" style={{ fontFamily: "var(--font-syne)", background: "linear-gradient(135deg,#c4b5fd,#f9a8d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              ¡Tu tienda está lista!
            </h1>
            <p className="text-lg mb-2" style={{ color: "#8884aa" }}>
              <strong style={{ color: "#c4b5fd" }}>{builderConfig.name}</strong> fue creada con productos de ejemplo.
            </p>
            <p className="text-sm" style={{ color: "#5c5a7a" }}>
              Ahora agrega tus productos reales con fotos para empezar a vender. Redirigiendo en un momento...
            </p>
          </div>

          {/* Link card */}
          <div className="p-5 rounded-2xl flex items-center gap-4 text-left" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg,${builderConfig.primaryColor || "#7c5cfc"},${builderConfig.secondaryColor || "#f43f8e"})`, boxShadow: `0 8px 24px ${builderConfig.primaryColor || "#7c5cfc"}44` }}>
              <Store size={28} color="white"/>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{builderConfig.name}</p>
              <p className="text-xs mt-1 font-mono truncate" style={{ color: "#c4b5fd" }}>{storeUrl}</p>
            </div>
            <button onClick={copyLink} className="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all flex-shrink-0"
              style={{ background: copied ? "rgba(6,214,160,0.2)" : "rgba(255,255,255,0.06)", border: `1px solid ${copied ? "rgba(6,214,160,0.4)" : "rgba(255,255,255,0.1)"}`, color: copied ? "#06d6a0" : "#8884aa" }}>
              {copied ? <><Check size={12}/> Copiado</> : <><Copy size={12}/> Copiar</>}
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/dashboard/productos" className="flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white transition-all hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg,#06d6a0,#38f9d7)", boxShadow: "0 8px 24px rgba(6,214,160,0.4)", color: "#0a2e1e" }}>
              <Camera size={16}/> Agregar productos
            </Link>
            <a href={`/store/${publishedSlug}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all hover:-translate-y-0.5"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#c4b5fd" }}>
              <Eye size={16} /> Ver tienda
            </a>
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
            <Wrench size={20} color="white"/>
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
                <div className="flex items-center gap-1 text-[10px] font-black mb-1.5 tracking-wider" style={{ color:"#3d3b5a" }}><Wrench size={9}/> AGENTE CONSTRUCTOR</div>
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
            <div className="flex items-center gap-1 text-[10px] font-black mb-1.5 tracking-wider" style={{ color:"#3d3b5a" }}><Wrench size={9}/> AGENTE CONSTRUCTOR</div>
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
