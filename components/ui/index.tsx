"use client";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

// ── Badge ──────────────────────────────────────────
type BadgeVariant = "green" | "yellow" | "red" | "purple" | "blue";
export function Badge({ children, variant = "purple" }: { children: ReactNode; variant?: BadgeVariant }) {
  return <span className={cn("badge", `badge-${variant}`)}>{children}</span>;
}

// ── Stat Card ─────────────────────────────────────
export function StatCard({
  icon, value, label, trend, glowColor, onClick,
}: { icon: string; value: string; label: string; trend?: string; glowColor: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn("card p-5 relative overflow-hidden transition-all duration-300", onClick && "cursor-pointer hover:-translate-y-1")}
      style={{ borderColor: `${glowColor}25` }}>
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full pointer-events-none"
        style={{ background: glowColor, opacity: 0.15, filter: "blur(30px)" }} />
      <div className="text-xl mb-2">{icon}</div>
      <div className="text-3xl font-black tracking-tight mb-1" style={{ fontFamily: "var(--font-syne)", color: glowColor }}>{value}</div>
      <div className="text-xs mb-1" style={{ color: "#8884aa" }}>{label}</div>
      {trend && <div className="text-xs font-semibold" style={{ color: "#6ee7b7" }}>{trend}</div>}
    </div>
  );
}

// ── Empty State ───────────────────────────────────
export function EmptyState({ icon, title, sub }: { icon: string; title: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <div className="font-bold text-base mb-1" style={{ fontFamily: "var(--font-syne)", color: "#8884aa" }}>{title}</div>
      {sub && <div className="text-sm" style={{ color: "#3d3b5a" }}>{sub}</div>}
    </div>
  );
}

// ── Section Header ────────────────────────────────
export function SectionHead({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="section-head">
      <div>
        <h1 className="section-title">{title}</h1>
        {sub && <p className="section-sub">{sub}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ── Typing Indicator ──────────────────────────────
export function TypingIndicator() {
  return (
    <div className="flex gap-1.5 items-center p-1">
      <div className="typing-dot" />
      <div className="typing-dot" />
      <div className="typing-dot" />
    </div>
  );
}

// ── Order status badge ────────────────────────────
const orderBadgeMap: Record<string, { label: string; cls: string }> = {
  pendiente:  { label: "⏳ Pendiente envío", cls: "badge-yellow" },
  preparando: { label: "📦 Preparando",      cls: "badge-purple" },
  camino:     { label: "🚚 En camino",        cls: "badge-purple" },
  entregada:  { label: "✅ Entregada",         cls: "badge-green"  },
  devolucion: { label: "↩️ Devolución",        cls: "badge-red"    },
};

export function OrderBadge({ status }: { status: string }) {
  const b = orderBadgeMap[status] ?? { label: status, cls: "badge-purple" };
  return <span className={cn("badge", b.cls)}>{b.label}</span>;
}
