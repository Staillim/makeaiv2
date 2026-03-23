import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCOP(n: number): string {
  return "$" + Math.abs(n).toLocaleString("es-CO");
}

export function gradientStyle(g: [string, string], dir = "135deg") {
  return { background: `linear-gradient(${dir}, ${g[0]}, ${g[1]})` };
}

export function stockColor(stock: number) {
  if (stock === 0) return "text-red-400";
  if (stock <= 5)  return "text-yellow-300";
  return "text-emerald-400";
}

export function stockBadge(stock: number): "active" | "warning" | "out" {
  if (stock === 0) return "out";
  if (stock <= 5)  return "warning";
  return "active";
}

export function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}
