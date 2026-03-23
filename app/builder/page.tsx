"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { TypingIndicator } from "@/components/ui";
import { Send, ArrowLeft, Eye, Smartphone, Monitor, Rocket, Truck, Lock, RotateCcw, Star, Store, Copy, Camera, Bot, Wrench, Package, Check, Heart, Flame, Clock, Bike, ShoppingBag, Cpu, Utensils, ChevronRight } from "lucide-react";
import type { Message, BuilderConfig, BuilderProduct, StoreLegacy, ProductLegacy } from "@/types";
import { STORE_TEMPLATES } from "@/lib/data";

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
  const previewImages = PRODUCT_IMAGES[type] || PRODUCT_IMAGES.general;
  const exProds = EXAMPLE_PRODUCTS[type] || EXAMPLE_PRODUCTS.general;
  const rawProds = exProds.slice(0, Math.max(config.columns || 3, 3)).map((p, i) => ({
    n: p.name,
    price: p.price,
    p: `$${p.price.toLocaleString("es-CO")}`,
    img: previewImages[i % previewImages.length],
    desc: p.description,
  }));
  const cols = mode === "mobile" ? Math.min(config.columns||3, 2) : Math.min(config.columns||3, 3);
  const pTpl = STORE_TEMPLATES[(type || "general") as keyof typeof STORE_TEMPLATES] ?? STORE_TEMPLATES.general;
  const isFood = type === "food";
  const isFashion = type === "ropa" || type === "beauty";

  // ── Auto-sliding hero carousel ──────────────────────────
  const [slide, setSlide] = useState(0);
  const [fading, setFading] = useState(false);
  useEffect(() => {
    if (rawProds.length < 2) return;
    const timer = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setSlide(s => (s + 1) % rawProds.length);
        setFading(false);
      }, 350);
    }, 4500);
    return () => clearInterval(timer);
  }, [rawProds.length]);
  const current = rawProds[slide] ?? rawProds[0];

  // ── Product detail panel state ──────────────────────────
  const [detailProd, setDetailProd] = useState<typeof rawProds[0] | null>(null);
  const [detailSize, setDetailSize] = useState("M");
  const [detailFoodSize, setDetailFoodSize] = useState("Personal");
  const [detailQty, setDetailQty] = useState(1);
  const [detailExtras, setDetailExtras] = useState<string[]>([]);
  const [detailNotes, setDetailNotes] = useState("");
  useEffect(() => {
    if (detailProd) { setDetailSize("M"); setDetailFoodSize("Personal"); setDetailQty(1); setDetailExtras([]); setDetailNotes(""); }
  }, [detailProd?.n]);

  const inner = (
    <div style={{ fontFamily:"'Inter',sans-serif", color: pTpl.pageColor, background: pTpl.pageBg, minHeight:"100%" }}>
      {/* ── Nav ── */}
      <div style={{ padding:"8px 14px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:`1px solid ${pTpl.headerBorderColor}`, background: pTpl.headerBg, position:"sticky", top:0, zIndex:20, boxShadow:"0 1px 4px rgba(0,0,0,0.08)" }}>
        <span style={{ fontWeight:800, fontSize:12, color: pTpl.headerColor }}>
          <span style={{ color: pc }}>{name[0]}</span>{name.slice(1)}
        </span>
        <div style={{ display:"flex", gap:8, fontSize:9, color: pTpl.headerIsDark ? "rgba(255,255,255,0.5)" : "#999" }}>{pTpl.navItems.slice(0,3).join(" · ")}</div>
        <div style={{ background: pc, color:"#fff", borderRadius: pTpl.btnRadius, padding:"3px 9px", fontSize:9, fontWeight:700 }}>Carrito 0</div>
      </div>

      {/* ── Hero Slider ── */}
      <div style={{ position:"relative", overflow:"hidden", height: mode === "mobile" ? 180 : 220 }}>
        {/* Background image fills entire hero */}
        <img
          src={current.img}
          alt={current.n}
          style={{
            position:"absolute", inset:0, width:"100%", height:"100%",
            objectFit: isFashion || isFood ? "cover" : "contain",
            padding: (isFashion || isFood) ? 0 : 20,
            background: pTpl.cardBg,
            transition: "opacity 0.35s ease",
            opacity: fading ? 0 : 1,
          }}
        />
        {/* Dark gradient overlay */}
        <div style={{ position:"absolute", inset:0, background: pTpl.heroIsDark
          ? "linear-gradient(135deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)"
          : "linear-gradient(135deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.15) 60%, transparent 100%)"
        }} />
        {/* Colored tint from brand */}
        <div style={{ position:"absolute", inset:0, background: `linear-gradient(to top right, ${pc}33 0%, transparent 60%)` }} />

        {/* Content */}
        <div style={{
          position:"absolute", inset:0, padding: mode === "mobile" ? "14px 12px" : "18px 16px",
          display:"flex", flexDirection:"column", justifyContent:"space-between",
          opacity: fading ? 0 : 1, transition: "opacity 0.35s ease",
        }}>
          <div>
            {/* Badge */}
            <div style={{ display:"inline-flex", alignItems:"center", gap:4, background: isFood ? "#e63946" : pc, color:"#fff", padding:"2px 8px", borderRadius:50, fontSize:7, fontWeight:800, marginBottom:6 }}>
              {isFood ? "🔥 Entrega en 20 min" : slide === 0 ? "✨ NUEVO" : "⭐ DESTACADO"}
            </div>
            {/* Product name */}
            <div style={{ opacity: fading ? 0 : 1, transition:"opacity 0.3s", fontSize: mode === "mobile" ? 14 : 17, fontWeight:900, color:"#fff", letterSpacing:-.3, lineHeight:1.15, marginBottom:4, textShadow:"0 2px 12px rgba(0,0,0,0.5)" }}>
              {current.n}
            </div>
            {/* Tagline */}
            <div style={{ fontSize:8, color:"rgba(255,255,255,0.8)", marginBottom:8 }}>{tag}</div>
            {/* Price */}
            <div style={{ fontSize: mode === "mobile" ? 16 : 18, fontWeight:900, color: isFood ? "#f5c842" : "#fff", letterSpacing:-.5, textShadow:"0 2px 8px rgba(0,0,0,0.4)" }}>
              {current.p}
              {isFood && <span style={{ fontSize:7, color:"rgba(255,255,255,0.6)", fontWeight:400, marginLeft:4 }}>· Desde</span>}
            </div>
          </div>

          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <button style={{ background: pc, color:"#fff", border:"none", borderRadius: pTpl.heroBtnRadius, padding: mode === "mobile" ? "5px 12px" : "6px 14px", fontSize:9, fontWeight:700, cursor:"pointer", boxShadow:`0 4px 16px ${pc}66` }}>
              {isFood ? "🛵 Pedir ahora →" : isFashion ? "Ver tallas →" : "Ver detalles →"}
            </button>
            {/* Slide dots */}
            <div style={{ display:"flex", gap:4 }}>
              {rawProds.map((_,i) => (
                <div key={i} style={{ width: i === slide ? 14 : 5, height:5, borderRadius:50, background: i === slide ? "#fff" : "rgba(255,255,255,0.4)", transition:"all 0.3s", cursor:"pointer" }} onClick={() => setSlide(i)} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Food: delivery toggle + categories ── */}
      {isFood && (
        <div style={{ padding:"8px 14px", borderBottom:`1px solid ${pTpl.headerBorderColor}`, background: pTpl.cardBg }}>
          <div style={{ display:"flex", gap:4, marginBottom:6 }}>
            <div style={{ background:"#c0000a", color:"#fff", padding:"3px 10px", borderRadius:50, fontSize:7, fontWeight:800, display:"flex", alignItems:"center", gap:3 }}>🛵 Domicilio</div>
            <div style={{ background:"#222", color:"#888", padding:"3px 10px", borderRadius:50, fontSize:7, fontWeight:700 }}>📍 Recoger</div>
          </div>
          <div style={{ display:"flex", gap:4, overflowX:"auto" }}>
            {["🔥 Todo", "🍕 Pizzas", "🍔 Combos", "🥤 Bebidas"].map((c,i) => (
              <div key={i} style={{ background: i===0 ? pc : "rgba(255,255,255,0.06)", color: i===0 ? "#fff" : pTpl.pageMutedColor, padding:"3px 8px", borderRadius:50, fontSize:7, fontWeight:700, flexShrink:0, border: i===0 ? "none" : `1px solid ${pTpl.headerBorderColor}` }}>{c}</div>
            ))}
          </div>
        </div>
      )}

      {/* ── Products ── */}
      <div style={{ padding:"12px 14px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
          <p style={{ fontSize:10, fontWeight:800, color: pTpl.pageColor }}>{isFood ? "🍽️ Menú del día" : "Productos"}</p>
          <p style={{ fontSize:8, color: pTpl.pageMutedColor }}>{rawProds.length} artículos</p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:`repeat(${cols},1fr)`, gap:6 }}>
          {rawProds.map((p,i) => {
            if (isFood) {
              /* ── Food card ── */
              return (
                <div key={i} style={{ borderRadius: pTpl.cardRadius, overflow:"hidden", background: pTpl.cardBg, border: pTpl.cardBorder || "none", cursor:"pointer", position:"relative" }} onClick={() => setDetailProd(p)}>
                  <div style={{ height:60, overflow:"hidden", position:"relative" }}>
                    <img src={p.img} alt={p.n} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
                    <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)" }} />
                    {/* Prep time */}
                    <div style={{ position:"absolute", bottom:3, right:3, background:"rgba(0,0,0,0.7)", borderRadius:50, padding:"1px 5px", fontSize:6, color:"#fff", fontWeight:700, display:"flex", alignItems:"center", gap:2 }}>
                      🕐 15-20 min
                    </div>
                    {i === 0 && <div style={{ position:"absolute", top:3, left:3, background:"#e63946", color:"#fff", borderRadius:4, padding:"1px 4px", fontSize:6, fontWeight:800 }}>🔥 -20%</div>}
                  </div>
                  <div style={{ padding:"5px 7px" }}>
                    <div style={{ fontSize:8, fontWeight:700, color: pTpl.cardColor, marginBottom:2, lineHeight:1.3 }}>{p.n}</div>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:3 }}>
                      <span style={{ fontSize:10, fontWeight:800, color: pTpl.cardPriceColor }}>{p.p}</span>
                    </div>
                    <div style={{ fontSize:6, color: pc, fontWeight:700, textAlign:"center", paddingTop:2 }}>Toca para personalizar →</div>
                  </div>
                </div>
              );
            }

            if (isFashion) {
              /* ── Fashion / Beauty card (portrait, no Agregar button) ── */
              return (
                <div key={i} style={{ borderRadius: pTpl.cardRadius, overflow:"hidden", background: pTpl.cardBg, border: pTpl.cardBorder || "none", cursor:"pointer", position:"relative" }} onClick={() => setDetailProd(p)}>
                  <div style={{ height:80, overflow:"hidden", position:"relative" }}>
                    <img src={p.img} alt={p.n} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
                    <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 50%)" }} />
                    {i === 0 && <div style={{ position:"absolute", top:3, left:3, zIndex:2, background: pc, color:"#fff", borderRadius:3, padding:"1px 5px", fontSize:6, fontWeight:700 }}>Nuevo</div>}
                    {/* Name + price overlay on image */}
                    <div style={{ position:"absolute", bottom:3, left:5, right:5, zIndex:2 }}>
                      <div style={{ fontSize:7, fontWeight:700, color:"#fff", lineHeight:1.2, marginBottom:1 }}>{p.n}</div>
                      <span style={{ fontSize:9, fontWeight:900, color:"#fff" }}>{p.p}</span>
                    </div>
                    {/* Heart */}
                    <div style={{ position:"absolute", top:3, right:3, width:14, height:14, borderRadius:"50%", background:"rgba(255,255,255,0.9)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:2 }}>
                      <span style={{ fontSize:7, lineHeight:1 }}>♡</span>
                    </div>
                  </div>
                  <div style={{ padding:"4px 6px", display:"flex", alignItems:"center", justifyContent:"space-between", borderTop:`1px solid ${pTpl.headerBorderColor}` }}>
                    <span style={{ fontSize:8, color:"#f5a623" }}>★★★★★</span>
                    <span style={{ fontSize:7, color:"#2a9d5c", fontWeight:600 }}>Envío gratis</span>
                  </div>
                </div>
              );
            }

            /* ── Tech / General card (click opens detail) ── */
            return (
              <div key={i} style={{ borderRadius: pTpl.cardRadius, overflow:"hidden", background: pTpl.cardBg, border: pTpl.cardBorder || "1px solid rgba(0,0,0,0.06)", cursor:"pointer", position:"relative", transition:"all 0.3s" }} onClick={() => setDetailProd(p)}>
                <div style={{ height:64, overflow:"hidden", position:"relative", background: pTpl.cardBg }}>
                  {i === 0 && <div style={{ position:"absolute", top:3, left:3, zIndex:2, background: pc, color:"#fff", borderRadius:3, padding:"1px 5px", fontSize:6, fontWeight:700 }}>Nuevo</div>}
                  <img src={p.img} alt={p.n} style={{ width:"100%", height:"100%", objectFit:"contain", display:"block", padding:6, background: pTpl.cardBg }} />
                  {/* Heart */}
                  <div style={{ position:"absolute", top:3, right:3, width:14, height:14, borderRadius:"50%", background:"rgba(255,255,255,0.9)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 1px 3px rgba(0,0,0,0.1)" }}>
                    <span style={{ fontSize:7, lineHeight:1 }}>♡</span>
                  </div>
                </div>
                <div style={{ padding:"6px 7px" }}>
                  <div style={{ fontSize:8, fontWeight:600, color: pTpl.cardColor, marginBottom:2, lineHeight:1.3 }}>{p.n}</div>
                  <div style={{ fontSize:8, color:"#f5a623", marginBottom:2 }}>★★★★<span style={{ color:"#e0e0e0" }}>★</span></div>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <span style={{ fontSize:10, fontWeight:800, color: pTpl.cardPriceColor }}>{p.p}</span>
                  </div>
                  <div style={{ fontSize:7, color:"#2a9d5c", marginTop:2, fontWeight:600, display:"flex", alignItems:"center", gap:2 }}>
                    <Truck size={7} color="#2a9d5c"/> Envío gratis
                  </div>
                  {/* CTA bar on hover */}
                  <div style={{ marginTop:4, background: pc, color:"#fff", borderRadius: pTpl.btnRadius, padding:"3px 0", fontSize:7, fontWeight:700, textAlign:"center", opacity:0.9 }}>
                    Ver detalles →
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ── Full product detail PAGE (replaces store view when product clicked) ───
  const detailPage = detailProd ? (
    <div style={{ fontFamily:"'Inter',sans-serif", color: pTpl.pageColor, background: pTpl.pageBg, minHeight:"100%", display:"flex", flexDirection:"column" }}>

      {/* ── Sticky Nav ── */}
      <div style={{ padding:"9px 12px", display:"flex", alignItems:"center", gap:6, borderBottom:`1px solid ${pTpl.headerBorderColor}`, background: pTpl.headerBg, position:"sticky", top:0, zIndex:20, boxShadow:"0 1px 4px rgba(0,0,0,0.08)" }}>
        <button onClick={() => setDetailProd(null)}
          style={{ background:"transparent", border:"none", cursor:"pointer", color: pTpl.headerColor, fontSize:18, lineHeight:1, padding:"0 2px", fontWeight:700 }}>←</button>
        <span style={{ fontWeight:700, fontSize:10, flex:1, color: pTpl.headerColor, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{detailProd.n}</span>
        <span style={{ fontSize:13, cursor:"pointer", color: pTpl.headerColor }}>♡</span>
        <span style={{ fontSize:13, cursor:"pointer", color: pTpl.headerColor }}>⋯</span>
      </div>

      {/* ── Image Gallery ── */}
      <div style={{ background: pTpl.cardBg, borderBottom:`1px solid ${pTpl.headerBorderColor}` }}>
        {/* Main image */}
        <div style={{ position:"relative", height: mode==="mobile" ? 200 : 240, overflow:"hidden", background: pTpl.cardBg }}>
          <img src={detailProd.img} alt={detailProd.n}
            style={{ width:"100%", height:"100%", objectFit: isFood||isFashion ? "cover" : "contain", padding: isFood||isFashion ? 0 : 24, background: pTpl.cardBg }} />
          {/* Overlay for food/fashion */}
          {(isFood||isFashion) && <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)" }} />}
          {/* Discount badge */}
          <div style={{ position:"absolute", top:8, left:8, display:"flex", flexDirection:"column", gap:3 }}>
            <span style={{ padding:"2px 8px", borderRadius:50, fontSize:7, fontWeight:900, color:"#fff", background:"#e63946" }}>-25%</span>
            {isFood && <span style={{ padding:"2px 7px", borderRadius:50, fontSize:6, fontWeight:800, color:"#111", background:"#f5c842" }}>🔥 Popular</span>}
            {!isFood && <span style={{ padding:"2px 7px", borderRadius:50, fontSize:6, fontWeight:700, color:"#fff", background: pc }}>NUEVO</span>}
          </div>
          {/* Slide counter */}
          <div style={{ position:"absolute", bottom:8, right:8, background:"rgba(0,0,0,0.55)", borderRadius:50, padding:"2px 8px", fontSize:6, color:"#fff", fontWeight:600 }}>1 / 4</div>
        </div>
        {/* Thumbnail strip */}
        <div style={{ display:"flex", gap:4, padding:"7px 10px 6px", overflowX:"auto" }} className="hide-scrollbar">
          {[0,1,2,3].map(i => (
            <div key={i} style={{ flexShrink:0, width:44, height:44, borderRadius:7, overflow:"hidden",
              border: i===0 ? `2px solid ${pc}` : `1.5px solid ${pTpl.headerBorderColor}`, cursor:"pointer" }}>
              <img src={detailProd.img} alt="" style={{ width:"100%", height:"100%", objectFit: isFood||isFashion ? "cover" : "contain", padding: isFood||isFashion ? 0 : 4, background: pTpl.cardBg }} />
            </div>
          ))}
          <div style={{ flexShrink:0, width:44, height:44, borderRadius:7, border:`1.5px dashed ${pTpl.headerBorderColor}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
            <span style={{ fontSize:16, color: pTpl.pageMutedColor, lineHeight:1 }}>+</span>
          </div>
        </div>
      </div>

      {/* ── Content (scrollable) ── */}
      <div style={{ padding:"12px 12px 100px", flex:1 }}>

        {/* Badges */}
        <div style={{ display:"flex", gap:3, marginBottom:6, flexWrap:"wrap" }}>
          <span style={{ fontSize:6, padding:"2px 7px", borderRadius:50, fontWeight:700, color:"#fff", background: pc }}>NUEVO</span>
          <span style={{ fontSize:6, padding:"2px 7px", borderRadius:50, fontWeight:700, color:"#fff", background:"#e63946" }}>OFERTA</span>
          {isFood && <span style={{ fontSize:6, padding:"2px 7px", borderRadius:50, fontWeight:700, color:"#111", background:"#f5c842" }}>🔥 Más pedido</span>}
        </div>

        {/* Product name */}
        <div style={{ fontSize: mode==="mobile" ? 15 : 17, fontWeight:900, lineHeight:1.2, color: pTpl.cardColor, marginBottom:5 }}>{detailProd.n}</div>

        {/* Rating + social proof */}
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8, fontSize:7, flexWrap:"wrap" }}>
          <div style={{ display:"flex", alignItems:"center", gap:3 }}>
            <span style={{ color:"#f5a623", fontSize:9 }}>★★★★★</span>
            <span style={{ color:"#2a9d5c", fontWeight:700 }}>4.8</span>
            <span style={{ color: pTpl.pageMutedColor }}>(128 reseñas)</span>
          </div>
          <span style={{ color:"#e63946", fontWeight:600, display:"flex", alignItems:"center", gap:2 }}>
            👁 12 personas viendo
          </span>
        </div>

        {/* Price block */}
        <div style={{ background:`${pc}0d`, borderRadius:10, padding:"10px 12px", marginBottom:12, border:`1px solid ${pc}25` }}>
          <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:3 }}>
            <span style={{ fontSize:24, fontWeight:900, color: pTpl.cardPriceColor }}>{detailProd.p}</span>
            <span style={{ fontSize:10, color:"#bbb", textDecoration:"line-through" }}>${(detailProd.price * 1.3).toLocaleString("es-CO")}</span>
            <span style={{ fontSize:7, fontWeight:900, color:"#fff", background:"#e63946", padding:"2px 6px", borderRadius:50 }}>-25%</span>
          </div>
          <div style={{ display:"flex", gap:8, fontSize:7 }}>
            <span style={{ color:"#2a9d5c", fontWeight:700, display:"flex", alignItems:"center", gap:2 }}>🚚 Envío gratis · Llega mañana</span>
            {isFood && <span style={{ color: pTpl.pageMutedColor }}>🕐 Listo en 15-20 min</span>}
          </div>
        </div>

        {/* Seller trust pills */}
        <div style={{ display:"flex", gap:3, marginBottom:12, flexWrap:"wrap" }}>
          <span style={{ fontSize:6, padding:"3px 8px", borderRadius:50, background:`${pc}18`, color: pc, fontWeight:700 }}>⭐ Vendedor premium</span>
          <span style={{ fontSize:6, padding:"3px 8px", borderRadius:50, background:"rgba(0,0,0,0.05)", color: pTpl.pageMutedColor, fontWeight:600 }}>🔒 Compra protegida</span>
          <span style={{ fontSize:6, padding:"3px 8px", borderRadius:50, background:"rgba(42,157,92,0.1)", color:"#2a9d5c", fontWeight:600 }}>↩️ 30 días devolución</span>
        </div>

        <div style={{ borderTop:`1px solid ${pTpl.headerBorderColor}`, marginBottom:12 }} />

        {/* ── FOOD options ── */}
        {isFood && (<>
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:9, fontWeight:800, color: pTpl.cardColor, marginBottom:6 }}>Elige el tamaño</div>
            <div style={{ display:"flex", gap:5 }}>
              {[{l:"Personal",p:""},{l:"Mediano",p:"+35%"},{l:"Grande",p:"+65%"}].map(s => (
                <button key={s.l} onClick={() => setDetailFoodSize(s.l)}
                  style={{ flex:1, padding:"7px 3px", borderRadius:9, fontSize:7, fontWeight:700, cursor:"pointer",
                    border: detailFoodSize===s.l ? `2px solid ${pc}` : `1px solid ${pTpl.headerBorderColor}`,
                    background: detailFoodSize===s.l ? pc : "transparent",
                    color: detailFoodSize===s.l ? "#fff" : pTpl.cardColor }}>
                  {s.l}
                  {s.p && <div style={{ fontSize:5, marginTop:2, opacity:.75 }}>{s.p}</div>}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:9, fontWeight:800, color: pTpl.cardColor, marginBottom:6 }}>Adicciones</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
              {["🧀 Queso extra +$2.000","🥓 Tocineta +$3.000","🥑 Aguacate +$2.500","🍳 Huevo frito +$1.500","🌶️ Sin picante FREE","🍟 Papas extra +$3.000"].map(e => {
                const active = detailExtras.includes(e);
                return (
                  <button key={e} onClick={() => setDetailExtras(prev => active ? prev.filter(x=>x!==e) : [...prev,e])}
                    style={{ padding:"4px 8px", borderRadius:50, fontSize:7, fontWeight:700, cursor:"pointer",
                      background: active ? pc : "transparent",
                      color: active ? "#fff" : pTpl.cardColor,
                      border: active ? `1.5px solid ${pc}` : `1px solid ${pTpl.headerBorderColor}` }}>{e}</button>
                );
              })}
            </div>
          </div>
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:9, fontWeight:800, color: pTpl.cardColor, marginBottom:5 }}>Instrucciones especiales</div>
            <textarea value={detailNotes} onChange={e => setDetailNotes(e.target.value)}
              placeholder="Sin cebolla, extra salsa picante... (opcional)" rows={2}
              style={{ width:"100%", fontSize:7, padding:"7px 10px", borderRadius:9, border:`1px solid ${pTpl.headerBorderColor}`, background:"transparent", color: pTpl.cardColor, resize:"none", outline:"none", boxSizing:"border-box", fontFamily:"inherit" }} />
          </div>
        </>)}

        {/* ── FASHION options ── */}
        {isFashion && (<>
          <div style={{ marginBottom:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
              <span style={{ fontSize:9, fontWeight:800, color: pTpl.cardColor }}>Talla: <span style={{ color: pc }}>{detailSize}</span></span>
              <span style={{ fontSize:7, color: pc, cursor:"pointer", textDecoration:"underline" }}>Guía de tallas →</span>
            </div>
            <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
              {["XS","S","M","L","XL","XXL"].map(s => (
                <button key={s} onClick={() => setDetailSize(s)}
                  style={{ minWidth:36, height:36, borderRadius:8, fontSize:9, fontWeight:800, cursor:"pointer",
                    border: detailSize===s ? `2px solid ${pc}` : `1px solid ${pTpl.headerBorderColor}`,
                    background: detailSize===s ? `${pc}20` : "transparent",
                    color: detailSize===s ? pc : pTpl.cardColor }}>{s}</button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:9, fontWeight:800, color: pTpl.cardColor, marginBottom:6 }}>Color</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {[{n:"Negro",h:"#1a1a1a"},{n:"Blanco",h:"#e8e8e8"},{n:"Rojo",h:"#e63946"},{n:"Azul",h:"#457b9d"},{n:"Verde",h:"#2a9d5c"}].map(c => (
                <div key={c.n} style={{ textAlign:"center", cursor:"pointer" }}>
                  <div style={{ width:26, height:26, borderRadius:"50%", background:c.h, border:"2px solid rgba(0,0,0,0.12)", margin:"0 auto 3px" }} />
                  <div style={{ fontSize:6, color: pTpl.pageMutedColor }}>{c.n}</div>
                </div>
              ))}
            </div>
          </div>
        </>)}

        {/* ── TECH / GENERAL specs table ── */}
        {!isFood && !isFashion && (
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:9, fontWeight:800, color: pTpl.cardColor, marginBottom:8 }}>Características</div>
            <div style={{ borderRadius:9, overflow:"hidden", border:`1px solid ${pTpl.headerBorderColor}` }}>
              {[["Marca","Premium Brand"],["Modelo","Edición 2026"],["Garantía","12 meses"],["Estado","Nuevo · Original"],["Incluye","Caja + accesorios"]].map(([k,v],i) => (
                <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"7px 10px", background: i%2===0 ? "transparent" : `${pTpl.headerBorderColor}55`, fontSize:7 }}>
                  <span style={{ color: pTpl.pageMutedColor }}>{k}</span>
                  <span style={{ fontWeight:700, color: pTpl.cardColor }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Description ── */}
        <div style={{ marginBottom:12, borderTop:`1px solid ${pTpl.headerBorderColor}`, paddingTop:12 }}>
          <div style={{ fontSize:9, fontWeight:800, color: pTpl.cardColor, marginBottom:6 }}>Descripción</div>
          <div style={{ fontSize:7, lineHeight:1.75, color: pTpl.pageMutedColor }}>{detailProd.desc}</div>
        </div>

        {/* ── Trust badges grid ── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
          {[["🚚","Envío gratis","Llega mañana"],["🔒","Compra protegida","100% segura"],["↩️","30 días","Devolución gratis"],["⭐","Garantía","12 meses inc."]].map(([ico,t,sub]) => (
            <div key={t} style={{ display:"flex", gap:6, padding:"8px 9px", borderRadius:10, border:`1px solid ${pTpl.headerBorderColor}`, alignItems:"flex-start" }}>
              <span style={{ fontSize:18, lineHeight:1 }}>{ico}</span>
              <div>
                <div style={{ fontSize:7, fontWeight:800, color: pTpl.cardColor }}>{t}</div>
                <div style={{ fontSize:6, color: pTpl.pageMutedColor, marginTop:2 }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Fixed bottom bar ── */}
      <div style={{ position:"sticky", bottom:0, background: pTpl.cardBg, borderTop:`2px solid ${pTpl.headerBorderColor}`, padding:"9px 10px", display:"flex", gap:6, alignItems:"center", boxShadow:"0 -6px 24px rgba(0,0,0,0.15)", zIndex:30 }}>
        <div style={{ display:"flex", alignItems:"center", border:`1.5px solid ${pTpl.headerBorderColor}`, borderRadius:9, overflow:"hidden", flexShrink:0 }}>
          <button onClick={() => setDetailQty(q => Math.max(1,q-1))}
            style={{ width:30, height:37, background:"transparent", border:"none", cursor:"pointer", fontSize:18, color: pTpl.cardColor }}>−</button>
          <span style={{ width:28, textAlign:"center", fontSize:11, fontWeight:900, color: pTpl.cardColor }}>{detailQty}</span>
          <button onClick={() => setDetailQty(q => q+1)}
            style={{ width:30, height:37, background:"transparent", border:"none", cursor:"pointer", fontSize:18, color: pTpl.cardColor }}>+</button>
        </div>
        <button onClick={() => setDetailProd(null)}
          style={{ flex:1, padding:"10px 0", borderRadius:9, border:`2px solid ${pc}`, background:"transparent", color: pc, fontSize:9, fontWeight:900, cursor:"pointer" }}>
          🛒 Al carrito
        </button>
        <button onClick={() => setDetailProd(null)}
          style={{ flex:1.5, padding:"10px 0", borderRadius:9, border:"none", background: pc, color:"#fff", fontSize:9, fontWeight:900, cursor:"pointer", boxShadow:`0 4px 18px ${pc}55` }}>
          {isFood ? "🛵 Pedir ahora" : "⚡ Comprar ya"}
        </button>
      </div>
    </div>
  ) : null;

  if (mode === "mobile") {
    return (
      <div className="flex-1 flex items-center justify-center p-6" style={{ background:"#050508" }}>
        <div className="relative" style={{ width:260, height:520 }}>
          <div className="absolute inset-0 rounded-[38px] overflow-hidden border-2" style={{ borderColor:"rgba(255,255,255,0.15)", background:"#0e0e16", boxShadow:"0 24px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)" }}>
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 rounded-b-2xl z-10 flex items-center justify-center" style={{ background:"#0e0e16", borderBottom:"1px solid rgba(255,255,255,0.1)" }}>
              <div className="w-12 h-1 rounded-full" style={{ background:"rgba(255,255,255,0.2)" }}/>
            </div>
            <div className="absolute inset-0 overflow-y-auto mt-6 bg-white rounded-b-[38px]">{detailPage ?? inner}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 m-5 overflow-hidden rounded-2xl border relative" style={{ borderColor:"rgba(255,255,255,0.08)", background:"#fff", boxShadow:"0 32px 80px rgba(0,0,0,0.5)" }}>
      {/* Browser bar */}
      <div className="flex items-center gap-2 px-3 py-2.5" style={{ background:"#f0f0f5", borderBottom:"1px solid #e0e0e8" }}>
        <div className="flex gap-1.5">
          {["#ff5f57","#febc2e","#28c840"].map(c=><span key={c} className="w-2.5 h-2.5 rounded-full" style={{ background:c }}/>)}
        </div>
        <div className="flex-1 bg-white rounded-full px-3 py-1 text-xs font-medium" style={{ color:"#666", border:"1px solid #e0e0e8" }}>
          tutienda.com/{config.name?.toLowerCase().replace(/\s+/g,"-") || "mi-tienda"}
        </div>
      </div>
      <div className="overflow-y-auto" style={{ height:"calc(100% - 40px)" }}>{detailPage ?? inner}</div>
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
