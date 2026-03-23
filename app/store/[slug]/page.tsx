"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { TypingIndicator } from "@/components/ui";
import {
  ShoppingCart, MessageCircle, X, Send, Search, Truck, Lock, RotateCcw, Star,
  Bot, Package, ShoppingBag, Cpu, Utensils, Sparkles, Home, Heart, Flame,
  Clock, Tag, ChevronRight, Plus, Minus, Zap, Eye, Filter, ChevronDown,
  MapPin, CheckCircle, Bike,
} from "lucide-react";
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

function StarRating({ value, count }: { value: number; count?: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[1,2,3,4,5].map(i => (
          <svg key={i} width="11" height="11" viewBox="0 0 24 24"
            fill={i <= Math.round(value) ? "#f5a623" : "#e0e0e0"}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        ))}
      </div>
      {count !== undefined && <span className="text-xs" style={{ color: "#999" }}>({count})</span>}
    </div>
  );
}

function useCountdown(target: Date) {
  const [time, setTime] = useState({ h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, target.getTime() - Date.now());
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTime({ h, m, s });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(time.h)}:${pad(time.m)}:${pad(time.s)}`;
}

function productMeta(p: Product) {
  const seed = (p.price + p.name.length * 37) % 100;
  const discountPct = seed < 25 ? 0 : seed < 50 ? 15 : seed < 75 ? 25 : 40;
  const originalPrice = discountPct > 0 ? Math.round(p.price / (1 - discountPct / 100)) : null;
  const ratingVal = +(4 + (seed % 10) / 10).toFixed(1);
  const reviewCount = 50 + ((p.price * 3) % 900);
  const viewers = 3 + (seed % 18);
  const hasFreeShipping = p.price >= 50000;
  const isNew    = p.badge === "Nuevo" || seed > 85;
  const isBestSeller = seed > 60 && seed <= 85;
  const isFlash  = discountPct >= 25;
  return { discountPct, originalPrice, ratingVal, reviewCount, viewers, hasFreeShipping, isNew, isBestSeller, isFlash };
}

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const COLORS = [
  { name: "Negro",   hex: "#1a1a1a" },
  { name: "Blanco",  hex: "#ffffff" },
  { name: "Rojo",    hex: "#e63946" },
  { name: "Azul",    hex: "#457b9d" },
  { name: "Verde",   hex: "#2a9d5c" },
];

// ── Food-specific constants ──────────────────────────────────────────────────
const FOOD_CATEGORIES = [
  { emoji: "🍔", label: "Hamburguesas" },
  { emoji: "🍕", label: "Pizzas" },
  { emoji: "🌭", label: "Perros" },
  { emoji: "🍟", label: "Papas" },
  { emoji: "🥤", label: "Bebidas" },
  { emoji: "🍦", label: "Postres" },
];

const FOOD_EXTRAS = [
  { name: "Queso extra",   price: 2000 },
  { name: "Tocineta",      price: 3000 },
  { name: "Aguacate",      price: 2500 },
  { name: "Huevo frito",   price: 1500 },
  { name: "Doble carne",   price: 5000 },
  { name: "Salsa especial",price: 1000 },
];

const FOOD_SIZES = [
  { label: "Personal", mult: 1 },
  { label: "Mediano",  mult: 1.35 },
  { label: "Grande",   mult: 1.65 },
];

interface CartItem {
  product: Product;
  qty: number;
  size?: string;
  color?: string;
  foodSize?: string;
  foodExtras?: { name: string; price: number }[];
  notes?: string;
}

const SALES_SYSTEM = (storeName: string, products: Product[]) => `
Eres el Agente de Ventas de ${storeName}, un asistente de compras inteligente y persuasivo.
PERSONALIDAD: Cercano, empático, honesto, estratégico. Hablas como un amigo.
No eres pesado ni repetitivo. Español colombiano natural. Emojis con moderación.
PRODUCTOS DISPONIBLES:
${products.map(p=>`- ${p.name} ($${p.price.toLocaleString("es-CO")}) — ${p.description} — Stock: ${p.stock} uds`).join("\n")}
ESTRATEGIAS:
- Si acaban de agregar algo: felicita + sugiere complemento
- Si pregunta precio: transparente + resalta valor
- Si duda: "muy popular", "quedan pocas unidades"
- Si carrito 1 item: menciona envío gratis si agrega más
- Si es regalo: sugiere empaque especial
Responde en JSON: {"message":"tu mensaje (max 3 líneas)","quickReplies":["op1","op2"]}`;

// ─── PRODUCT MODAL ────────────────────────────────────────────────────────────

function ProductModal({ p, pc, tpl, onClose, onAddToCart }: {
  p: Product; pc: string; tpl: StoreTemplate;
  onClose: () => void; onAddToCart: (item: CartItem) => void;
}) {
  const meta = productMeta(p);
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState<string>("M");
  const [color, setColor] = useState<string>("Negro");

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
      onClick={onClose}>
      <div className="w-full sm:max-w-2xl max-h-[95vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl"
        style={{ background: tpl.cardBg, color: tpl.cardColor }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between p-4 pb-0">
          <p className="text-xs font-semibold" style={{ color: pc }}>Detalle del producto</p>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.08)" }}>
            <X size={16} />
          </button>
        </div>

        <div className="p-4 flex flex-col sm:flex-row gap-5">
          <div className="flex-shrink-0 sm:w-64">
            <div className="rounded-xl overflow-hidden flex items-center justify-center"
              style={{ height: 260, background: tpl.cardBg, border: tpl.cardBorder || "1px solid rgba(0,0,0,0.08)" }}>
              {p.image ? (
                <img src={p.image} alt={p.name} className="w-full h-full object-contain p-3" />
              ) : (
                <StoreIcon type="ropa" size={80} color="#ddd" />
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-3">
            <div className="flex gap-1.5 flex-wrap">
              {meta.isNew && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: pc }}>NUEVO</span>}
              {meta.isFlash && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white flex items-center gap-1" style={{ background: "#e63946" }}><Flame size={9}/>OFERTA</span>}
            </div>

            <h2 className="text-xl font-black leading-tight" style={{ fontFamily: "var(--font-jakarta)" }}>{p.name}</h2>
            <StarRating value={meta.ratingVal} count={meta.reviewCount} />

            <div className="flex items-center gap-1.5 text-xs" style={{ color: "#e63946" }}>
              <Eye size={13} /><span><strong>{meta.viewers}</strong> personas lo están viendo ahora</span>
            </div>

            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-3xl font-black" style={{ color: tpl.cardPriceColor }}>{formatCOP(p.price)}</span>
              {meta.originalPrice && <>
                <span className="text-sm line-through" style={{ color: "#bbb" }}>{formatCOP(meta.originalPrice)}</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-black text-white" style={{ background: "#e63946" }}>-{meta.discountPct}%</span>
              </>}
            </div>

            {meta.hasFreeShipping && (
              <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#2a9d5c" }}>
                <Truck size={12} /> Envío gratis · Llega en 2-3 días
              </div>
            )}

            <div>
              <p className="text-xs font-bold mb-2">Talla: <span style={{ color: pc }}>{size}</span></p>
              <div className="flex gap-2 flex-wrap">
                {SIZES.map(s => (
                  <button key={s} onClick={() => setSize(s)}
                    className="w-10 h-10 rounded-lg text-xs font-bold transition-all"
                    style={{
                      border: size === s ? `2px solid ${pc}` : "1.5px solid rgba(0,0,0,0.15)",
                      background: size === s ? `${pc}15` : "transparent",
                      color: size === s ? pc : tpl.cardColor,
                    }}>{s}</button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold mb-2">Color: <span style={{ color: pc }}>{color}</span></p>
              <div className="flex gap-2">
                {COLORS.map(c => (
                  <button key={c.name} onClick={() => setColor(c.name)} title={c.name}
                    className="w-7 h-7 rounded-full transition-all"
                    style={{
                      background: c.hex,
                      border: color === c.name ? `2.5px solid ${pc}` : "2px solid rgba(0,0,0,0.15)",
                      outline: color === c.name ? `2px solid ${pc}40` : "none",
                      outlineOffset: 2,
                    }} />
                ))}
              </div>
            </div>

            {p.stock <= 5 && p.stock > 0 && (
              <p className="text-xs font-bold" style={{ color: "#e63946" }}>¡Solo quedan {p.stock} unidades!</p>
            )}

            <div className="flex items-center gap-3 flex-wrap mt-1">
              <div className="flex items-center rounded-xl overflow-hidden" style={{ border: "1.5px solid rgba(0,0,0,0.12)" }}>
                <button onClick={() => setQty(q => Math.max(1, q-1))}
                  className="w-9 h-9 flex items-center justify-center hover:opacity-70">
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center text-sm font-bold">{qty}</span>
                <button onClick={() => setQty(q => Math.min(p.stock, q+1))}
                  className="w-9 h-9 flex items-center justify-center hover:opacity-70">
                  <Plus size={14} />
                </button>
              </div>
              <button
                onClick={() => { onAddToCart({ product: p, qty, size, color }); onClose(); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
                style={{ background: pc, minWidth: 160 }}>
                <ShoppingCart size={16} /> Agregar al carrito
              </button>
            </div>
            <button
              onClick={() => { onAddToCart({ product: p, qty, size, color }); onClose(); }}
              className="w-full py-2.5 px-5 rounded-xl font-bold text-sm transition-opacity hover:opacity-90"
              style={{ background: "#111", color: "#fff" }}>
              Comprar ahora →
            </button>
            <p className="text-xs" style={{ color: "#aaa" }}>{p.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── FOOD PRODUCT MODAL ──────────────────────────────────────────────────────

function FoodProductModal({ p, pc, tpl, onClose, onAddToCart }: {
  p: Product; pc: string; tpl: StoreTemplate;
  onClose: () => void; onAddToCart: (item: CartItem) => void;
}) {
  const meta = productMeta(p);
  const [qty, setQty] = useState(1);
  const [foodSize, setFoodSize] = useState("Personal");
  const [selectedExtras, setSelectedExtras] = useState<typeof FOOD_EXTRAS>([]);
  const [notes, setNotes] = useState("");

  const sizeMult = FOOD_SIZES.find(s => s.label === foodSize)?.mult ?? 1;
  const extrasTotal = selectedExtras.reduce((s, e) => s + e.price, 0);
  const lineTotal = (Math.round(p.price * sizeMult) + extrasTotal) * qty;

  function toggleExtra(extra: typeof FOOD_EXTRAS[0]) {
    setSelectedExtras(prev =>
      prev.find(e => e.name === extra.name)
        ? prev.filter(e => e.name !== extra.name)
        : [...prev, extra]
    );
  }

  const soldToday = 30 + ((p.price * 7 + p.name.length * 13) % 70);

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={onClose}>
      <div className="w-full sm:max-w-lg max-h-[95vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl"
        style={{ background: tpl.cardBg, color: tpl.cardColor }}
        onClick={e => e.stopPropagation()}>

        {/* Image */}
        <div className="relative" style={{ height: 220 }}>
          {p.image
            ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center" style={{ background: "#222" }}><Utensils size={64} color="#444" /></div>
          }
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)" }} />
          <button onClick={onClose} className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.5)" }}>
            <X size={16} color="white" />
          </button>
          <div className="absolute top-3 left-3 flex gap-2">
            {meta.isFlash && (
              <span className="px-2 py-1 rounded-full text-xs font-black text-white flex items-center gap-1"
                style={{ background: "#e63946" }}><Flame size={11} />-{meta.discountPct}%</span>
            )}
            <span className="px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1"
              style={{ background: "#f5c842", color: "#111" }}>🔥 {soldToday} vendidos hoy</span>
          </div>
          <div className="absolute bottom-3 left-4 right-4">
            <h2 className="text-xl font-black text-white leading-tight">{p.name}</h2>
            <div className="flex items-center gap-3 mt-1">
              <StarRating value={meta.ratingVal} count={meta.reviewCount} />
              <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
                <Clock size={12} /> Listo en 15-20 min
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 flex flex-col gap-4">
          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black" style={{ color: pc }}>
              ${Math.round(p.price * sizeMult + extrasTotal).toLocaleString("es-CO")}
            </span>
            {meta.originalPrice && (
              <span className="text-sm line-through" style={{ color: "#666" }}>
                ${Math.round(meta.originalPrice * sizeMult).toLocaleString("es-CO")}
              </span>
            )}
            <span className="text-xs ml-auto" style={{ color: "#888" }}>× {qty} = <strong style={{ color: tpl.cardColor }}>${lineTotal.toLocaleString("es-CO")}</strong></span>
          </div>

          {/* Size selector */}
          <div>
            <p className="text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: "#888" }}>Tamaño</p>
            <div className="flex gap-2">
              {FOOD_SIZES.map(s => (
                <button key={s.label} onClick={() => setFoodSize(s.label)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: foodSize === s.label ? pc : "transparent",
                    color: foodSize === s.label ? "#fff" : tpl.cardColor,
                    border: foodSize === s.label ? `2px solid ${pc}` : "2px solid rgba(255,255,255,0.15)",
                  }}>
                  {s.label}
                  {s.mult > 1 && <span className="block text-[10px] mt-0.5 opacity-70">+{Math.round((s.mult - 1) * p.price).toLocaleString("es-CO")}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Combos / Extras */}
          <div>
            <p className="text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: "#888" }}>Agranda tu combo (extras)</p>
            <div className="grid grid-cols-2 gap-2">
              {FOOD_EXTRAS.map(extra => {
                const active = selectedExtras.some(e => e.name === extra.name);
                return (
                  <button key={extra.name} onClick={() => toggleExtra(extra)}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                    style={{
                      background: active ? `${pc}22` : "rgba(255,255,255,0.05)",
                      border: active ? `1.5px solid ${pc}` : "1.5px solid rgba(255,255,255,0.1)",
                      color: active ? pc : tpl.cardColor,
                    }}>
                    <span>{extra.name}</span>
                    <span className="font-black">+${extra.price.toLocaleString("es-CO")}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <p className="text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: "#888" }}>Instrucciones especiales</p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Sin cebolla, extra salsa... (opcional)"
              rows={2}
              className="w-full rounded-xl px-3 py-2 text-sm resize-none outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: tpl.cardColor }}
            />
          </div>

          {/* Qty + CTA */}
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-xl overflow-hidden" style={{ border: "2px solid rgba(255,255,255,0.15)" }}>
              <button onClick={() => setQty(q => Math.max(1, q - 1))}
                className="w-11 h-11 flex items-center justify-center text-xl font-bold hover:opacity-70">
                <Minus size={16} color={tpl.cardColor} />
              </button>
              <span className="w-10 text-center font-black text-lg" style={{ color: tpl.cardColor }}>{qty}</span>
              <button onClick={() => setQty(q => q + 1)}
                className="w-11 h-11 flex items-center justify-center hover:opacity-70">
                <Plus size={16} color={tpl.cardColor} />
              </button>
            </div>
            <button
              onClick={() => {
                onAddToCart({ product: p, qty, foodSize, foodExtras: selectedExtras, notes });
                onClose();
              }}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-black text-base text-white transition-opacity hover:opacity-90"
              style={{ background: pc }}>
              <ShoppingCart size={18} /> Agregar · ${lineTotal.toLocaleString("es-CO")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CART DRAWER ───────────────────────────────────────────────────────────────

function CartDrawer({ items, pc, tpl, onClose, onUpdateQty, onRemove }: {
  items: CartItem[]; pc: string; tpl: StoreTemplate;
  onClose: () => void;
  onUpdateQty: (idx: number, qty: number) => void;
  onRemove: (idx: number) => void;
}) {
  const subtotal = items.reduce((s, i) => s + i.product.price * i.qty, 0);
  const shipping = subtotal >= 50000 ? 0 : 8000;
  const couponDiscount = Math.round(subtotal * 0.10);
  const total = subtotal - couponDiscount + shipping;

  return (
    <div className="fixed inset-0 z-[90] flex justify-end"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)" }}
      onClick={onClose}>
      <div className="w-full max-w-sm h-full flex flex-col"
        style={{ background: tpl.cardBg, color: tpl.cardColor, boxShadow: "-8px 0 40px rgba(0,0,0,0.2)" }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${tpl.headerBorderColor}` }}>
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} />
            <span className="font-black text-base">Tu carrito</span>
            <span className="text-xs px-1.5 py-0.5 rounded-full text-white font-bold" style={{ background: pc }}>
              {items.reduce((s,i)=>s+i.qty,0)}
            </span>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.08)" }}>
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <ShoppingCart size={40} color="#ccc" />
              <p className="text-sm font-semibold" style={{ color: "#bbb" }}>Tu carrito está vacío</p>
              <button onClick={onClose} className="text-xs font-bold px-4 py-2 rounded-lg text-white" style={{ background: pc }}>Ver productos</button>
            </div>
          ) : (
            items.map((item, idx) => {
              const meta = productMeta(item.product);
              return (
                <div key={idx} className="flex gap-3 pb-3" style={{ borderBottom: `1px solid ${tpl.headerBorderColor}` }}>
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center"
                    style={{ background: tpl.cardBg, border: tpl.cardBorder || "1px solid rgba(0,0,0,0.08)" }}>
                    {item.product.image
                      ? <img src={item.product.image} alt={item.product.name} className="w-full h-full object-contain p-1" />
                      : <Package size={20} color="#ccc" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold leading-snug line-clamp-2">{item.product.name}</p>
                    {(item.size || item.color) && (
                      <p className="text-[10px] mt-0.5" style={{ color: "#999" }}>{[item.size, item.color].filter(Boolean).join(" · ")}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center rounded-lg overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.15)" }}>
                        <button onClick={() => onUpdateQty(idx, item.qty - 1)} className="w-7 h-7 flex items-center justify-center hover:opacity-60"><Minus size={11} /></button>
                        <span className="w-6 text-center text-xs font-bold">{item.qty}</span>
                        <button onClick={() => onUpdateQty(idx, item.qty + 1)} className="w-7 h-7 flex items-center justify-center hover:opacity-60"><Plus size={11} /></button>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black" style={{ color: tpl.cardPriceColor }}>{formatCOP(item.product.price * item.qty)}</p>
                        {meta.discountPct > 0 && <p className="text-[10px] line-through" style={{ color: "#bbb" }}>{formatCOP(Math.round(item.product.price / (1 - meta.discountPct / 100)) * item.qty)}</p>}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => onRemove(idx)} className="self-start mt-0.5 hover:opacity-60"><X size={13} color="#aaa" /></button>
                </div>
              );
            })
          )}
        </div>

        {items.length > 0 && (
          <div className="px-4 py-4" style={{ borderTop: `1px solid ${tpl.headerBorderColor}` }}>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-3"
              style={{ background: `${pc}12`, border: `1px dashed ${pc}55` }}>
              <Tag size={13} color={pc} />
              <span className="text-xs font-bold" style={{ color: pc }}>Código <strong>STYLE10</strong> → 10% OFF aplicado</span>
            </div>
            <div className="space-y-1.5 text-xs mb-3">
              <div className="flex justify-between"><span style={{ color: "#999" }}>Subtotal</span><span className="font-semibold">{formatCOP(subtotal)}</span></div>
              <div className="flex justify-between"><span style={{ color: "#2a9d5c" }}>Descuento STYLE10</span><span className="font-semibold" style={{ color: "#2a9d5c" }}>-{formatCOP(couponDiscount)}</span></div>
              <div className="flex justify-between">
                <span style={{ color: "#999" }}>Envío</span>
                <span className="font-semibold" style={{ color: shipping === 0 ? "#2a9d5c" : tpl.cardColor }}>{shipping === 0 ? "GRATIS" : formatCOP(shipping)}</span>
              </div>
              {shipping > 0 && <p className="text-[10px]" style={{ color: "#aaa" }}>Agrega {formatCOP(50000 - subtotal)} más para envío gratis</p>}
              <div className="flex justify-between pt-2 font-black text-sm" style={{ borderTop: `1px solid ${tpl.headerBorderColor}` }}>
                <span>Total</span><span style={{ color: tpl.cardPriceColor }}>{formatCOP(total)}</span>
              </div>
            </div>
            <button className="w-full py-3 rounded-xl font-black text-sm text-white transition-opacity hover:opacity-90" style={{ background: pc }}>Finalizar compra →</button>
            <button onClick={onClose} className="w-full py-2 text-xs mt-2 hover:underline" style={{ color: "#aaa" }}>Seguir comprando</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── FOOD CART DRAWER ─────────────────────────────────────────────────────────

function FoodCartDrawer({ items, pc, tpl, deliveryMode, setDeliveryMode, subtotal, deliveryCost, freeThreshold, onClose, onUpdateQty, onRemove, onOrder }: {
  items: CartItem[]; pc: string; tpl: StoreTemplate;
  deliveryMode: "domicilio" | "recoger";
  setDeliveryMode: (m: "domicilio" | "recoger") => void;
  subtotal: number; deliveryCost: number; freeThreshold: number;
  onClose: () => void;
  onUpdateQty: (idx: number, qty: number) => void;
  onRemove: (idx: number) => void;
  onOrder: () => void;
}) {
  const total = subtotal + deliveryCost;
  const freeProgress = Math.min(100, (subtotal / freeThreshold) * 100);
  const missingForFree = Math.max(0, freeThreshold - subtotal);
  const PAYMENT_METHODS = ["Nequi", "Daviplata", "Efecty", "Contraentrega", "Tarjeta"];
  const [selectedPayment, setSelectedPayment] = useState("Nequi");

  return (
    <div className="fixed inset-0 z-[90] flex justify-end"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
      onClick={onClose}>
      <div className="w-full max-w-sm h-full flex flex-col"
        style={{ background: tpl.cardBg, color: tpl.cardColor, boxShadow: "-8px 0 40px rgba(0,0,0,0.35)" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${tpl.headerBorderColor}` }}>
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} />
            <span className="font-black text-base">Tu pedido</span>
            {items.length > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full text-white font-bold" style={{ background: "#c0000a" }}>
                {items.reduce((s,i)=>s+i.qty,0)}
              </span>
            )}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.1)" }}>
            <X size={16} />
          </button>
        </div>

        {/* Delivery mode */}
        <div className="px-4 py-3 flex gap-2" style={{ borderBottom: `1px solid ${tpl.headerBorderColor}`, background: "rgba(255,255,255,0.03)" }}>
          <button
            onClick={() => setDeliveryMode("domicilio")}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all"
            style={{
              background: deliveryMode === "domicilio" ? "#c0000a" : "transparent",
              color: deliveryMode === "domicilio" ? "#fff" : "#888",
              border: deliveryMode === "domicilio" ? "none" : "1px solid #333",
            }}>
            <Bike size={13} /> Domicilio
          </button>
          <button
            onClick={() => setDeliveryMode("recoger")}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all"
            style={{
              background: deliveryMode === "recoger" ? "#c0000a" : "transparent",
              color: deliveryMode === "recoger" ? "#fff" : "#888",
              border: deliveryMode === "recoger" ? "none" : "1px solid #333",
            }}>
            <MapPin size={13} /> Recoger
          </button>
        </div>

        {/* Free delivery progress */}
        {deliveryMode === "domicilio" && subtotal < freeThreshold && (
          <div className="px-4 py-2.5" style={{ borderBottom: `1px solid ${tpl.headerBorderColor}`, background: "rgba(245,200,66,0.06)" }}>
            <div className="flex justify-between text-[10px] mb-1" style={{ color: "#888" }}>
              <span>🛵 Agrega <strong style={{ color: "#f5c842" }}>${missingForFree.toLocaleString("es-CO")}</strong> para envío gratis</span>
              <span>${subtotal.toLocaleString("es-CO")} / ${freeThreshold.toLocaleString("es-CO")}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#2a2a2a" }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${freeProgress}%`, background: "#f5c842" }} />
            </div>
          </div>
        )}
        {deliveryMode === "domicilio" && subtotal >= freeThreshold && (
          <div className="px-4 py-2.5 text-xs font-bold flex items-center gap-1.5"
            style={{ borderBottom: `1px solid ${tpl.headerBorderColor}`, color: "#2a9d5c", background: "rgba(42,157,92,0.08)" }}>
            <CheckCircle size={14} /> ¡Envío gratis desbloqueado! 🎉
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <Utensils size={40} color="#444" />
              <p className="text-sm font-semibold" style={{ color: "#666" }}>Tu pedido está vacío</p>
              <button onClick={onClose} className="text-xs font-bold px-4 py-2 rounded-lg text-white" style={{ background: "#c0000a" }}>Ver menú</button>
            </div>
          ) : (
            <>
              {items.map((item, idx) => {
                const extrasTotal = item.foodExtras?.reduce((s, e) => s + e.price, 0) ?? 0;
                const sizeMult = FOOD_SIZES.find(s => s.label === item.foodSize)?.mult ?? 1;
                const linePrice = (Math.round(item.product.price * sizeMult) + extrasTotal) * item.qty;
                return (
                  <div key={idx} className="flex gap-3 pb-3" style={{ borderBottom: `1px solid ${tpl.headerBorderColor}` }}>
                    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                      {item.product.image
                        ? <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center" style={{ background: "#222" }}><Utensils size={20} color="#555" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold leading-snug line-clamp-1">{item.product.name}</p>
                      {item.foodSize && <p className="text-[10px] mt-0.5" style={{ color: "#888" }}>{item.foodSize}</p>}
                      {item.foodExtras && item.foodExtras.length > 0 && (
                        <p className="text-[10px]" style={{ color: "#888" }}>+ {item.foodExtras.map(e => e.name).join(", ")}</p>
                      )}
                      {item.notes && <p className="text-[10px] italic" style={{ color: "#666" }}>📝 {item.notes}</p>}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center rounded-lg overflow-hidden" style={{ border: "1px solid #333" }}>
                          <button onClick={() => onUpdateQty(idx, item.qty - 1)} className="w-7 h-7 flex items-center justify-center hover:opacity-60"><Minus size={10} /></button>
                          <span className="w-6 text-center text-xs font-bold">{item.qty}</span>
                          <button onClick={() => onUpdateQty(idx, item.qty + 1)} className="w-7 h-7 flex items-center justify-center hover:opacity-60"><Plus size={10} /></button>
                        </div>
                        <p className="text-sm font-black" style={{ color: "#f5c842" }}>${linePrice.toLocaleString("es-CO")}</p>
                      </div>
                    </div>
                    <button onClick={() => onRemove(idx)} className="self-start mt-0.5 hover:opacity-60"><X size={13} color="#555" /></button>
                  </div>
                );
              })}
              {/* Upsell */}
              <div className="rounded-xl px-3 py-2.5 flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity"
                style={{ background: "rgba(245,200,66,0.1)", border: "1px dashed #f5c842" }}>
                <span className="text-2xl">🍟</span>
                <div className="flex-1">
                  <p className="text-xs font-bold" style={{ color: "#f5c842" }}>¿Agrandas el combo?</p>
                  <p className="text-[10px]" style={{ color: "#888" }}>Papas grandes por solo $3.000 más</p>
                </div>
                <span className="text-xs font-black" style={{ color: "#f5c842" }}>+ Agregar</span>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-4 py-4" style={{ borderTop: `1px solid ${tpl.headerBorderColor}` }}>
            {/* Payment methods */}
            <div className="mb-3">
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#666" }}>Método de pago</p>
              <div className="flex gap-1.5 flex-wrap">
                {PAYMENT_METHODS.map(m => (
                  <button key={m} onClick={() => setSelectedPayment(m)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
                    style={{
                      background: selectedPayment === m ? "#c0000a" : "rgba(255,255,255,0.07)",
                      color: selectedPayment === m ? "#fff" : "#888",
                      border: selectedPayment === m ? "none" : "1px solid #333",
                    }}>{m}</button>
                ))}
              </div>
            </div>
            {/* Summary */}
            <div className="space-y-1.5 text-xs mb-3">
              <div className="flex justify-between"><span style={{ color: "#888" }}>Subtotal</span><span className="font-semibold">${subtotal.toLocaleString("es-CO")}</span></div>
              <div className="flex justify-between">
                <span style={{ color: "#888" }}>Domicilio</span>
                <span className="font-semibold" style={{ color: deliveryCost === 0 ? "#2a9d5c" : tpl.cardColor }}>
                  {deliveryMode === "recoger" ? "Gratis (recoges)" : deliveryCost === 0 ? "GRATIS 🎉" : `$${deliveryCost.toLocaleString("es-CO")}`}
                </span>
              </div>
              <div className="flex justify-between pt-2 font-black text-sm" style={{ borderTop: `1px solid ${tpl.headerBorderColor}` }}>
                <span>Total</span><span style={{ color: "#f5c842" }}>${total.toLocaleString("es-CO")}</span>
              </div>
            </div>
            <button
              onClick={onOrder}
              className="w-full py-3.5 rounded-xl font-black text-sm text-white transition-all hover:opacity-90 active:scale-95 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #c0000a, #8b0000)" }}>
              🛵 Pedir ahora · ${total.toLocaleString("es-CO")}
            </button>
            <button onClick={onClose} className="w-full py-2 text-xs mt-2 hover:underline" style={{ color: "#666" }}>Seguir viendo el menú</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── FOOD PRODUCT CARD ────────────────────────────────────────────────────────

function FoodProductCard({ p, pc, onOpen, tpl }: {
  p: Product; pc: string;
  onOpen: (p: Product) => void; tpl: StoreTemplate;
}) {
  const [hovered, setHovered] = useState(false);
  const meta = productMeta(p);
  const soldToday = 30 + ((p.price * 7 + p.name.length * 13) % 70);
  const prepMin = 10 + (((p.price + p.name.length) * 3) % 15);

  return (
    <div
      className="overflow-hidden cursor-pointer flex flex-col transition-all duration-200 min-w-0"
      style={{
        background: tpl.cardBg,
        border: tpl.cardBorder,
        borderRadius: tpl.cardRadius,
        boxShadow: hovered ? "0 8px 28px rgba(0,0,0,0.35)" : "0 2px 8px rgba(0,0,0,0.2)",
        transform: hovered ? "translateY(-4px) scale(1.01)" : "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onOpen(p)}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ height: 150 }}>
        {p.image
          ? <img src={p.image} alt={p.name} className="w-full h-full object-cover transition-transform duration-300"
              style={{ transform: hovered ? "scale(1.08)" : "scale(1)" }} />
          : <div className="w-full h-full flex items-center justify-center" style={{ background: "#1a1a1a" }}>
              <Utensils size={60} color="#333" />
            </div>
        }
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 55%)" }} />

        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {meta.isFlash && (
            <span className="px-1.5 py-0.5 rounded-lg text-[10px] font-black text-white flex items-center gap-0.5"
              style={{ background: "#e63946" }}><Flame size={8} />-{meta.discountPct}%</span>
          )}
          {meta.isBestSeller && (
            <span className="px-1.5 py-0.5 rounded-lg text-[10px] font-black"
              style={{ background: "#f5c842", color: "#111" }}>🔥 +{soldToday} hoy</span>
          )}
        </div>

        {/* Prep time badge */}
        <div className="absolute bottom-2 right-2">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
            style={{ background: "rgba(0,0,0,0.65)" }}>
            <Clock size={9} /> {prepMin}-{prepMin + 5} min
          </span>
        </div>

        {p.stock <= 5 && p.stock > 0 && (
          <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold"
            style={{ background: "#f5c842", color: "#111" }}>¡Solo {p.stock}!</span>
        )}

        <div className="absolute bottom-2 left-0 right-0 flex justify-center transition-all duration-200"
          style={{ opacity: hovered ? 1 : 0, transform: hovered ? "translateY(0)" : "translateY(8px)" }}>
          <span className="px-4 py-1.5 rounded-full text-xs font-black text-white"
            style={{ background: pc }}>Ver y personalizar →</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        <p className="text-xs font-bold leading-snug mb-1 line-clamp-2" style={{ color: tpl.cardColor }}>{p.name}</p>

        <div className="flex items-baseline gap-1.5 mt-auto">
          <span className="text-base font-black" style={{ color: tpl.cardPriceColor }}>${p.price.toLocaleString("es-CO")}</span>
          {meta.originalPrice && (
            <span className="text-[10px] line-through" style={{ color: "#555" }}>${meta.originalPrice.toLocaleString("es-CO")}</span>
          )}
        </div>

        <button
          onClick={e => { e.stopPropagation(); onOpen(p); }}
          className="mt-1.5 w-full py-2 rounded-xl text-xs font-black text-white transition-opacity hover:opacity-90"
          style={{ background: pc }}>
          + Agregar
        </button>
      </div>
    </div>
  );
}

// ─── PRODUCT CARD ──────────────────────────────────────────────────────────────

function ProductCard({ p, pc, onOpen, tpl }: {
  p: Product; pc: string;
  onOpen: (p: Product) => void; tpl: StoreTemplate;
}) {
  const [hovered, setHovered] = useState(false);
  const [liked, setLiked] = useState(false);
  const meta = productMeta(p);

  return (
    <div
      className="overflow-hidden cursor-pointer flex flex-col transition-all duration-200 min-w-0"
      style={{
        background: tpl.cardBg,
        border: tpl.cardBorder,
        borderRadius: tpl.cardRadius,
        boxShadow: hovered ? "0 8px 28px rgba(0,0,0,0.13)" : "0 1px 4px rgba(0,0,0,0.06)",
        transform: hovered ? "translateY(-3px)" : "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onOpen(p)}
    >
      <div className="relative overflow-hidden" style={{ height: 160, background: tpl.cardBg }}>
        {p.image ? (
          <img src={p.image} alt={p.name} className="w-full h-full"
            style={{ objectFit: "contain", padding: 12, background: tpl.cardBg }} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Package size={72} color="#e0e0e0" />
          </div>
        )}

        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {meta.isFlash && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-black text-white flex items-center gap-0.5"
              style={{ background: "#e63946" }}><Flame size={9}/>-{meta.discountPct}%</span>
          )}
          {!meta.isFlash && meta.isNew && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
              style={{ background: pc }}>NUEVO</span>
          )}
          {meta.isBestSeller && !meta.isFlash && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
              style={{ background: "#f59e0b" }}>TOP</span>
          )}
        </div>

        <button
          className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all"
          style={{ background: "rgba(255,255,255,0.9)", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}
          onClick={e => { e.stopPropagation(); setLiked(l => !l); }}>
          <Heart size={13} fill={liked ? "#e63946" : "none"} color={liked ? "#e63946" : "#aaa"} />
        </button>

        {p.stock <= 5 && p.stock > 0 && (
          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold"
            style={{ background: "#fff3cd", color: "#856404", border: "1px solid #ffc107" }}>
            ¡Solo {p.stock}!
          </span>
        )}

        <div className="absolute bottom-0 left-0 right-0 py-2.5 text-sm font-bold text-white text-center transition-all duration-200"
          style={{
            background: pc, opacity: hovered ? 1 : 0,
            transform: hovered ? "translateY(0)" : "translateY(100%)",
          }}>
          Ver tallas y colores →
        </div>
      </div>

      <div className="p-2.5 flex flex-col flex-1">
        <p className="text-xs font-semibold leading-snug mb-1 line-clamp-2" style={{ color: tpl.cardColor }}>{p.name}</p>
        <StarRating value={meta.ratingVal} count={meta.reviewCount} />

        <div className="mt-auto pt-1">
          <div className="flex items-baseline gap-1 flex-wrap">
            <span className="text-base font-black" style={{ color: tpl.cardPriceColor }}>{formatCOP(p.price)}</span>
            {meta.originalPrice && (
              <span className="text-[10px] line-through" style={{ color: "#bbb" }}>{formatCOP(meta.originalPrice)}</span>
            )}
          </div>
          {meta.hasFreeShipping && (
            <p className="flex items-center gap-1 text-[10px] font-semibold mt-0.5" style={{ color: "#2a9d5c" }}>
              <Truck size={9} color="#2a9d5c"/> Envío gratis
            </p>
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

  const flashEnd = useRef(new Date(Date.now() + 3 * 3600000));
  const countdown = useCountdown(flashEnd.current);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [salesHistory, setSalesHistory] = useState<{role:string;content:string}[]>([]);
  const [chatStarted, setChatStarted] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sortBy, setSortBy] = useState("relevantes");
  const [searchQuery, setSearchQuery] = useState("");

  // Food-specific state
  const [deliveryMode, setDeliveryMode] = useState<"domicilio" | "recoger">("domicilio");
  const [activeCategory, setActiveCategory] = useState("all");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderStep, setOrderStep] = useState(0);
  const liveOrders = useRef(Math.floor(8 + Math.random() * 14)).current;

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
  const storeName = store.name || "Mi Tienda";
  const tpl: StoreTemplate = STORE_TEMPLATES[(store.type || "general") as keyof typeof STORE_TEMPLATES] ?? STORE_TEMPLATES.general;
  const isFood = store.type === "food";

  const allProducts = store.products;
  const flashProducts = allProducts.filter(p => productMeta(p).isFlash);
  const newProducts   = allProducts.filter(p => productMeta(p).isNew).slice(0, 6);
  const bestSellers   = allProducts.filter(p => productMeta(p).isBestSeller).slice(0, 6);
  const cartSubtotal = cartItems.reduce((s, i) => {
    const extras = i.foodExtras?.reduce((e, x) => e + x.price, 0) ?? 0;
    const sizeMult = isFood ? (FOOD_SIZES.find(s => s.label === i.foodSize)?.mult ?? 1) : 1;
    return s + (Math.round(i.product.price * sizeMult) + extras) * i.qty;
  }, 0);
  const freeDeliveryThreshold = isFood ? 25000 : 50000;
  const deliveryCost = isFood ? (deliveryMode === "recoger" ? 0 : (cartSubtotal >= freeDeliveryThreshold ? 0 : 6000)) : 8000;

  const filteredProducts = allProducts
    .filter(p => {
      const matchSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = !isFood || activeCategory === "all" ||
        p.category.toLowerCase().includes(activeCategory.toLowerCase()) ||
        p.name.toLowerCase().includes(activeCategory.toLowerCase());
      return matchSearch && matchCategory;
    })
    .sort((a, b) => {
      if (sortBy === "menor") return a.price - b.price;
      if (sortBy === "mayor") return b.price - a.price;
      if (sortBy === "descuento") return productMeta(b).discountPct - productMeta(a).discountPct;
      return 0;
    });

  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);

  function addToCart(item: CartItem) {
    setCartItems(prev => {
      const idx = prev.findIndex(i => i.product.id === item.product.id && i.size === item.size && i.color === item.color);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + item.qty };
        return next;
      }
      return [...prev, item];
    });
    setCartOpen(true);
    if (!chatStarted) setTimeout(() => startSalesChat(item.product), 2000);
  }

  function updateQty(idx: number, qty: number) {
    if (qty <= 0) { setCartItems(p => p.filter((_, i) => i !== idx)); return; }
    setCartItems(p => p.map((item, i) => i === idx ? { ...item, qty } : item));
  }

  function removeItem(idx: number) { setCartItems(p => p.filter((_, i) => i !== idx)); }

  async function startSalesChat(addedProduct?: Product) {
    setChatStarted(true);
    const context = addedProduct
      ? `El cliente agregó "${addedProduct.name}" al carrito. Salúdalo y sugiere algo que combine.`
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
      let parsed: { message?: string; quickReplies?: string[] } = {};
      try { const m=raw.match(/\{[\s\S]*\}/); parsed=JSON.parse(m?.[0]||raw); } catch {}
      const botText = parsed.message || raw;
      const newH = [...newHistory, { role:"assistant", content:raw }];
      setSalesHistory(newH);
      if (!isSystem) setMessages(m=>[...m,{ id:(Date.now()-1).toString(),role:"user",content:userText,timestamp:new Date() }]);
      setMessages(m=>[...m,{ id:Date.now().toString(),role:"assistant",content:botText,timestamp:new Date(),quickReplies:parsed.quickReplies||[] } as Message]);
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
      let parsed: { message?: string; quickReplies?: string[] } = {};
      try { const m=raw.match(/\{[\s\S]*\}/); parsed=JSON.parse(m?.[0]||raw); } catch {}
      setSalesHistory([...newH,{ role:"assistant",content:raw }]);
      setMessages(m=>[...m,{ id:Date.now().toString(),role:"assistant",content:parsed.message||raw,timestamp:new Date(),quickReplies:parsed.quickReplies||[] } as Message]);
    } catch {}
    setLoading(false);
  }

  return (
    <div style={{ background: tpl.pageBg, minHeight: "100vh", fontFamily: "var(--font-jakarta)", color: tpl.pageColor }}>

      {/* ── Promo strip ────────────────────────────────────── */}
      <div className="text-center py-2 text-xs font-semibold tracking-wide overflow-hidden"
        style={{ background: isFood ? "#c0000a" : pc, color: "#fff" }}>
        <span className="inline-flex items-center gap-4 whitespace-nowrap">
          {isFood ? (
            <>
              <span><Bike size={12} className="inline mr-1" />Delivery en 20 min</span>
              <span>·</span>
              <span><Flame size={12} className="inline mr-1" />Combos desde $18.000</span>
              <span>·</span>
              <span><Zap size={12} className="inline mr-1" />Envío gratis desde $25.000</span>
            </>
          ) : (
            <>
              <span><Truck size={12} className="inline mr-1" />Envío gratis en compras +$99.000</span>
              <span>·</span>
              <span><Tag size={12} className="inline mr-1" />Código STYLE10 — 10% off</span>
              <span>·</span>
              <span><Zap size={12} className="inline mr-1" />Compra 2 lleva 3 en seleccionados</span>
            </>
          )}
        </span>
      </div>

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50" style={{ background: tpl.headerBg, borderBottom: `1px solid ${tpl.headerBorderColor}`, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
        <div className="max-w-7xl mx-auto flex items-center gap-4 px-4 py-3">
          {/* Logo */}
          <div className="font-black text-xl flex-shrink-0" style={{ fontFamily: "var(--font-jakarta)", color: tpl.headerColor }}>
            <span style={{ color: pc }}>{storeName[0]}</span>{storeName.slice(1)}
          </div>

          {/* Search bar */}
          <div className="hidden md:flex flex-1 items-center rounded-lg overflow-hidden max-w-xl"
            style={{ border: `1.5px solid ${tpl.headerBorderColor}`, background: tpl.headerIsDark ? "rgba(255,255,255,0.07)" : "#f9f9f9" }}>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={`Buscar en ${storeName}...`}
              className="flex-1 px-4 py-2 text-sm bg-transparent outline-none"
              style={{ color: tpl.headerColor }} />
            <span className="flex items-center justify-center px-4 py-2.5" style={{ background: pc }}>
              <Search size={15} color="white" />
            </span>
          </div>

          {/* Cart button */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setCartOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: pc }}>
              <ShoppingCart size={15} />
              <span className="hidden sm:inline">Carrito</span>
              {cartCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-black"
                  style={{ background: "rgba(255,255,255,0.25)" }}>
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Category nav */}
        <div className="border-t" style={{ borderColor: tpl.headerBorderColor }}>
          <div className="max-w-7xl mx-auto flex items-center gap-6 px-4 py-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
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
        <div className="max-w-7xl mx-auto px-4 py-6 md:py-10 flex flex-col md:flex-row items-center gap-4 md:gap-8">
          <div className="flex-1 min-w-0 w-full">
            {isFood ? (
              /* Live orders badge for food stores */
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4"
                style={{ background: "#f5c842", color: "#111" }}>
                <Flame size={12} /> 🔥 {liveOrders} pedidos en este momento
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4"
                style={{ background: tpl.heroIsDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)", color: tpl.heroColor }}>
                <StoreIcon type={store.type} size={12} color={tpl.heroColor} /> {tpl.navItems[0]} · Colección {new Date().getFullYear()}
              </div>
            )}
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-black leading-tight tracking-tight mb-2 md:mb-3"
              style={{ fontFamily: "var(--font-jakarta)", color: tpl.heroColor }}>
              {store.tagline || storeName}
            </h1>
            <p className="text-xs md:text-sm mb-4 md:mb-6 max-w-md" style={{ color: tpl.heroSubColor }}>
              {isFood
                ? `${allProducts.length} platos · Delivery en 20 min · Pago con Nequi, Daviplata o efectivo`
                : `${allProducts.length} productos · Envío a todo el país · Devoluciones gratis 30 días`}
            </p>
            <div className="flex gap-2 md:gap-3 flex-wrap">
              <a href="#productos"
                className="px-4 md:px-6 py-2.5 md:py-3 text-xs md:text-sm font-bold transition-opacity hover:opacity-90"
                style={{ background: isFood ? "#f5c842" : pc, color: isFood ? "#111" : "#fff", borderRadius: tpl.heroBtnRadius }}>
                {isFood ? "Ver menú →" : "Ver colección →"}
              </a>
              {flashProducts.length > 0 && (
                <a href="#flash"
                  className="px-4 md:px-6 py-2.5 md:py-3 text-xs md:text-sm font-bold transition-all hover:opacity-80 flex items-center gap-1.5"
                  style={{
                    border: tpl.heroIsDark ? "1.5px solid rgba(255,255,255,0.35)" : "1.5px solid rgba(0,0,0,0.2)",
                    color: tpl.heroColor,
                    borderRadius: tpl.heroBtnRadius,
                    background: tpl.heroIsDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.04)",
                  }}>
                  <Flame size={13} /> {isFood ? "Combos del día" : "Ofertas flash"}
                </a>
              )}
            </div>
            {/* Mobile trust strip */}
            <div className="flex md:hidden gap-3 mt-4 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {tpl.trustItems.slice(0, 2).map((ti, i) => (
                <div key={i} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold"
                  style={{ background: tpl.heroIsDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.65)", color: tpl.heroColor, border: tpl.heroIsDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(0,0,0,0.07)" }}>
                  <CheckCircle size={12} color={tpl.heroIsDark ? "#fff" : tpl.heroColor} />{ti.label}
                </div>
              ))}
            </div>
          </div>
          {/* Trust badges — desktop only */}
          <div className="hidden md:grid flex-shrink-0 grid-cols-2 gap-2.5">
            {[
              { icon: isFood ? <Bike size={20} color={tpl.heroIsDark ? "#fff" : tpl.heroColor} /> : <Truck size={20} color={tpl.heroIsDark ? "#fff" : tpl.heroColor} />, ti: tpl.trustItems[0] },
              { icon: isFood ? <CheckCircle size={20} color={tpl.heroIsDark ? "#fff" : tpl.heroColor} /> : <Lock size={20} color={tpl.heroIsDark ? "#fff" : tpl.heroColor} />, ti: tpl.trustItems[1] },
              { icon: isFood ? <Flame size={20} color="#f5c842" /> : <RotateCcw size={20} color={tpl.heroIsDark ? "#fff" : tpl.heroColor} />, ti: tpl.trustItems[2] },
              { icon: <Star size={20} color="#f5c842" />, ti: tpl.trustItems[3] },
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

      {/* ── Food: delivery mode + categories ───────────────── */}
      {isFood && (
        <section style={{ background: tpl.cardBg, borderBottom: `1px solid ${tpl.headerBorderColor}` }}>
          <div className="max-w-7xl mx-auto px-3 md:px-4 py-3 md:py-4">
            {/* Delivery mode toggle */}
            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
              <div className="flex rounded-xl overflow-hidden p-0.5" style={{ background: "#222", border: "1px solid #333" }}>
                <button
                  onClick={() => setDeliveryMode("domicilio")}
                  className="flex items-center gap-1.5 px-3 md:px-5 py-2 rounded-xl text-xs md:text-sm font-bold transition-all"
                  style={{
                    background: deliveryMode === "domicilio" ? "#c0000a" : "transparent",
                    color: deliveryMode === "domicilio" ? "#fff" : "#888",
                  }}>
                  <Bike size={13} /> Domicilio
                </button>
                <button
                  onClick={() => setDeliveryMode("recoger")}
                  className="flex items-center gap-1.5 px-3 md:px-5 py-2 rounded-xl text-xs md:text-sm font-bold transition-all"
                  style={{
                    background: deliveryMode === "recoger" ? "#c0000a" : "transparent",
                    color: deliveryMode === "recoger" ? "#fff" : "#888",
                  }}>
                  <MapPin size={13} /> Recoger
                </button>
              </div>
              {deliveryMode === "domicilio" && (
                <span className="text-[11px] font-semibold flex items-center gap-1" style={{ color: "#888" }}>
                  <Clock size={11} /> 20-35 min
                </span>
              )}
              {deliveryMode === "recoger" && (
                <span className="text-[11px] font-semibold flex items-center gap-1" style={{ color: "#2a9d5c" }}>
                  <CheckCircle size={11} /> Listo en 15 min
                </span>
              )}
            </div>

            {/* Category pills */}
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              <button
                onClick={() => setActiveCategory("all")}
                className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all"
                style={{
                  background: activeCategory === "all" ? "#c0000a" : "rgba(255,255,255,0.07)",
                  color: activeCategory === "all" ? "#fff" : "#aaa",
                  border: activeCategory === "all" ? "none" : "1px solid #333",
                }}>
                🍽️ Todo
              </button>
              {FOOD_CATEGORIES.map(cat => (
                <button
                  key={cat.label}
                  onClick={() => setActiveCategory(cat.label)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all"
                  style={{
                    background: activeCategory === cat.label ? "#c0000a" : "rgba(255,255,255,0.07)",
                    color: activeCategory === cat.label ? "#fff" : "#aaa",
                    border: activeCategory === cat.label ? "none" : "1px solid #333",
                  }}>
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Flash Sale ─────────────────────────────────────── */}
      {flashProducts.length > 0 && (
        <section id="flash" className="py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-black text-white"
                  style={{ background: "#ef4444" }}>
                  <Flame size={14} /> FLASH SALE
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold"
                  style={{ background: tpl.cardBg, border: `1px solid ${tpl.headerBorderColor}`, color: tpl.cardColor }}>
                  <Clock size={14} color="#ef4444" />
                  <span style={{ color: "#ef4444" }}>{countdown}</span>
                </div>
              </div>
              <a href="#productos" className="text-xs font-semibold flex items-center gap-1 hover:underline" style={{ color: pc }}>
                Ver todos <ChevronRight size={12} />
              </a>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
              {flashProducts.map(p => (
                <div key={p.id} className="flex-shrink-0 w-40 cursor-pointer rounded-xl overflow-hidden transition-transform hover:-translate-y-0.5"
                  onClick={() => setSelectedProduct(p)}
                  style={{ background: tpl.cardBg, border: `1px solid ${tpl.headerBorderColor}` }}>
                  <div className="relative">
                    <img src={p.image} alt={p.name} className="w-full h-32 object-cover" />
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-black text-white"
                      style={{ background: "#ef4444" }}>
                      -{productMeta(p).discountPct}%
                    </span>
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-semibold truncate" style={{ color: tpl.cardColor }}>{p.name}</p>
                    <p className="text-sm font-black mt-0.5" style={{ color: pc }}>${p.price.toLocaleString("es-CO")}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Promo banners ──────────────────────────────────── */}
      <section className="py-6 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between px-6 py-5 rounded-2xl overflow-hidden relative cursor-pointer hover:opacity-95 transition-opacity"
            style={{ background: `linear-gradient(135deg, ${pc}, ${pc}cc)` }}>
            <div>
              <p className="text-xs font-bold text-white/70 uppercase tracking-wider mb-1">Oferta especial</p>
              <p className="text-2xl font-black text-white leading-tight">Hasta 40% off<br />en seleccionados</p>
              <a href="#productos" className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-white/90 hover:text-white">
                Ver productos <ChevronRight size={12} />
              </a>
            </div>
            <Zap size={56} color="rgba(255,255,255,0.15)" className="flex-shrink-0" />
          </div>
          <div className="flex items-center justify-between px-6 py-5 rounded-2xl overflow-hidden relative cursor-pointer hover:opacity-95 transition-opacity"
            style={{ background: tpl.cardBg, border: `1px solid ${tpl.headerBorderColor}` }}>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: tpl.pageMutedColor }}>Nuevos ingresos</p>
              <p className="text-2xl font-black leading-tight" style={{ color: tpl.cardColor }}>Lo más nuevo<br />de la temporada</p>
              <a href="#novedades" className="inline-flex items-center gap-1 mt-3 text-xs font-bold hover:underline" style={{ color: pc }}>
                Descubrir <ChevronRight size={12} />
              </a>
            </div>
            <Sparkles size={56} color={`${pc}30`} className="flex-shrink-0" />
          </div>
        </div>
      </section>

      {/* ── Novedades carousel ─────────────────────────────── */}
      {newProducts.length > 0 && (
        <section id="novedades" className="py-6 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black" style={{ color: tpl.pageColor }}>✨ Novedades</h2>
              <a href="#productos" className="text-xs font-semibold flex items-center gap-1 hover:underline" style={{ color: pc }}>
                Ver todos <ChevronRight size={12} />
              </a>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
              {newProducts.map(p => (
                <div key={p.id} className="flex-shrink-0 w-44 cursor-pointer rounded-xl overflow-hidden transition-transform hover:-translate-y-0.5"
                  onClick={() => setSelectedProduct(p)}
                  style={{ background: tpl.cardBg, border: `1px solid ${tpl.headerBorderColor}` }}>
                  <div className="relative">
                    <img src={p.image} alt={p.name} className="w-full h-36 object-cover" />
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-black text-white"
                      style={{ background: pc }}>NUEVO</span>
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-semibold truncate" style={{ color: tpl.cardColor }}>{p.name}</p>
                    <p className="text-sm font-black mt-1" style={{ color: pc }}>${p.price.toLocaleString("es-CO")}</p>
                    <StarRating value={(p as { rating?: number }).rating ?? 4.5} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Más vendidos carousel ──────────────────────────── */}
      {bestSellers.length > 0 && (
        <section className="py-6 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black" style={{ color: tpl.pageColor }}>🔥 Más vendidos</h2>
              <a href="#productos" className="text-xs font-semibold flex items-center gap-1 hover:underline" style={{ color: pc }}>
                Ver todos <ChevronRight size={12} />
              </a>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
              {bestSellers.map(p => (
                <div key={p.id} className="flex-shrink-0 w-44 cursor-pointer rounded-xl overflow-hidden transition-transform hover:-translate-y-0.5"
                  onClick={() => setSelectedProduct(p)}
                  style={{ background: tpl.cardBg, border: `1px solid ${tpl.headerBorderColor}` }}>
                  <div className="relative">
                    <img src={p.image} alt={p.name} className="w-full h-36 object-cover" />
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-black text-white"
                      style={{ background: "#f97316" }}>TOP</span>
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-semibold truncate" style={{ color: tpl.cardColor }}>{p.name}</p>
                    <p className="text-sm font-black mt-1" style={{ color: pc }}>${p.price.toLocaleString("es-CO")}</p>
                    <StarRating value={(p as { rating?: number }).rating ?? 4.5} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── All products grid ──────────────────────────────── */}
      <section id="productos" className="py-6 md:py-8 px-3 md:px-4">
        <div className="max-w-7xl mx-auto">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4 md:mb-5 flex-wrap gap-2 md:gap-3">
            <div>
              <h2 className="text-lg md:text-2xl font-black" style={{ fontFamily: "var(--font-jakarta)", color: tpl.pageColor }}>
                {isFood ? "Nuestro menú" : "Todos los productos"}
              </h2>
              <p className="text-xs md:text-sm mt-0.5" style={{ color: tpl.pageMutedColor }}>
                {filteredProducts.length} artículos{searchQuery ? ` para "${searchQuery}"` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Mobile search */}
              <div className="flex md:hidden items-center rounded-lg overflow-hidden"
                style={{ border: `1px solid ${tpl.headerBorderColor}`, background: tpl.cardBg }}>
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar..."
                  className="px-3 py-1.5 text-xs bg-transparent outline-none w-28"
                  style={{ color: tpl.cardColor }} />
                <span className="px-2"><Search size={12} color={tpl.pageMutedColor} /></span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
                style={{ border: `1px solid ${tpl.headerBorderColor}`, background: tpl.cardBg, color: tpl.cardColor }}>
                <Filter size={12} />
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="bg-transparent outline-none text-xs"
                  style={{ color: tpl.cardColor }}>
                  <option value="relevantes">Relevantes</option>
                  <option value="menor">Menor precio</option>
                  <option value="mayor">Mayor precio</option>
                  <option value="descuento">Más descuento</option>
                </select>
                <ChevronDown size={12} />
              </div>
            </div>
          </div>

          {/* Grid */}
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-20 text-center">
              <Package size={48} color="#ccc" />
              <p className="font-semibold" style={{ color: "#aaa" }}>Sin resultados para &quot;{searchQuery}&quot;</p>
              <button onClick={() => setSearchQuery("")} className="text-xs underline" style={{ color: pc }}>
                Limpiar búsqueda
              </button>
            </div>
          ) : (
            <div className={`grid gap-4 grid-cols-2 ${store.columns >= 4 ? "lg:grid-cols-4" : store.columns === 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
              {filteredProducts.map(p => (
                isFood
                  ? <FoodProductCard key={p.id} p={p} pc={pc} onOpen={setSelectedProduct} tpl={tpl} />
                  : <ProductCard     key={p.id} p={p} pc={pc} onOpen={setSelectedProduct} tpl={tpl} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="mt-10 py-10 px-4" style={{ background: tpl.footerBg }}>
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

      {/* ── Product modal ──────────────────────────────────── */}
      {selectedProduct && (
        isFood
          ? <FoodProductModal p={selectedProduct} pc={pc} tpl={tpl} onClose={() => setSelectedProduct(null)} onAddToCart={addToCart} />
          : <ProductModal p={selectedProduct} pc={pc} tpl={tpl} onClose={() => setSelectedProduct(null)} onAddToCart={addToCart} />
      )}

      {/* ── Order tracking (food) ──────────────────────────── */}
      {isFood && orderPlaced && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }}
          onClick={() => { setOrderPlaced(false); setOrderStep(0); }}>
          <div className="w-full max-w-sm rounded-3xl p-6 flex flex-col items-center text-center"
            style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
            onClick={e => e.stopPropagation()}>
            <div className="text-5xl mb-3">
              {orderStep === 0 ? "✅" : orderStep === 1 ? "🍳" : orderStep === 2 ? "🛵" : "🎉"}
            </div>
            <h3 className="text-xl font-black text-white mb-1">
              {orderStep === 0 ? "¡Pedido recibido!" : orderStep === 1 ? "Preparando tu pedido" : orderStep === 2 ? "En camino" : "¡Entregado!"}
            </h3>
            <p className="text-sm mb-5" style={{ color: "#888" }}>
              {orderStep === 0 ? "Confirmamos tu pedido. Comenzamos en segundos." : orderStep === 1 ? "Nuestros cocineros están preparando tu pedido." : orderStep === 2 ? "Tu pedido está en camino. Aprox. 15 min." : "¡Disfruta tu comida! 😋"}
            </p>
            <div className="flex gap-2 w-full mb-5">
              {["Recibido", "Preparando", "En camino", "Entregado"].map((step, i) => (
                <div key={step} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full h-1.5 rounded-full" style={{ background: i <= orderStep ? "#c0000a" : "#333" }} />
                  <span className="text-[9px] font-bold" style={{ color: i <= orderStep ? "#fff" : "#555" }}>{step}</span>
                </div>
              ))}
            </div>
            {orderStep < 3 ? (
              <button
                onClick={() => setOrderStep(s => s + 1)}
                className="w-full py-3 rounded-xl font-black text-white text-sm"
                style={{ background: "#c0000a" }}>
                Siguiente paso (demo)
              </button>
            ) : (
              <button
                onClick={() => { setOrderPlaced(false); setOrderStep(0); }}
                className="w-full py-3 rounded-xl font-black text-white text-sm"
                style={{ background: "#2a9d5c" }}>
                Cerrar
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Cart drawer ────────────────────────────────────── */}
      {cartOpen && (
        isFood
          ? <FoodCartDrawer
              items={cartItems}
              pc={pc}
              tpl={tpl}
              deliveryMode={deliveryMode}
              setDeliveryMode={setDeliveryMode}
              subtotal={cartSubtotal}
              deliveryCost={deliveryCost}
              freeThreshold={freeDeliveryThreshold}
              onClose={() => setCartOpen(false)}
              onUpdateQty={updateQty}
              onRemove={removeItem}
              onOrder={() => { setCartOpen(false); setOrderPlaced(true); setOrderStep(0); }}
            />
          : <CartDrawer
              items={cartItems}
              pc={pc}
              tpl={tpl}
              onClose={() => setCartOpen(false)}
              onUpdateQty={updateQty}
              onRemove={removeItem}
            />
      )}

      {/* ── Sales agent chat (z-[80] below cart z-90 & modal z-[100]) ─ */}
      <div className="fixed bottom-6 right-6 z-[80]">
        {chatOpen && (
          <div className="absolute bottom-16 right-0 w-80 rounded-2xl overflow-hidden flex flex-col"
            style={{ background: "#fff", border: "1px solid #e4e4e4", boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }}>
            {/* Chat header */}
            <div className="flex items-center gap-3 p-4" style={{ background: pc }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.2)" }}>
                <Bot size={18} color="white" />
              </div>
              <div>
                <div className="font-bold text-sm text-white">Asistente de compras</div>
                <div className="flex items-center gap-1.5 text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.8)" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />En línea
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
              {messages.length > 0 && messages[messages.length - 1].role === "assistant" &&
                (messages[messages.length - 1] as { quickReplies?: string[] }).quickReplies?.length ? (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {((messages[messages.length - 1] as { quickReplies?: string[] }).quickReplies || []).map((qr: string) => (
                    <button key={qr} onClick={() => sendSales(qr)}
                      className="px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{ background: "#fff", border: "1px solid #e0e0e0", color: "#555" }}>
                      {qr}
                    </button>
                  ))}
                </div>
              ) : null}
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
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center text-white"
              style={{ background: "#ef4444" }}>{cartCount}</span>
          )}
        </button>
      </div>
    </div>
  );
}
