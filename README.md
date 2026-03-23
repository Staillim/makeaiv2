# Maket AI 🛍️

Plataforma de e-commerce con IA. Crea, administra y vende con 3 agentes inteligentes.

## Stack

- **Next.js 14** — App Router, Server Actions
- **TypeScript** — Tipado completo
- **Tailwind CSS** — Estilos utilitarios
- **Zustand** — Estado global
- **Recharts** — Gráficas analytics
- **Framer Motion** — Animaciones
- **Anthropic Claude** — Los 3 agentes IA

## Setup

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar API key
cp .env.example .env.local
# Edita .env.local y agrega tu ANTHROPIC_API_KEY

# 3. Correr en desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## Estructura

```
maket-ai/
├── app/
│   ├── page.tsx              # Landing
│   ├── dashboard/            # Dashboard SPA
│   │   ├── page.tsx
│   │   └── sections/         # 8 secciones (Home, Tiendas, Analytics, etc.)
│   ├── builder/              # Agente Constructor
│   │   └── page.tsx
│   ├── store/[slug]/         # Tienda pública + Agente de Ventas
│   │   └── page.tsx
│   └── api/chat/             # Proxy Anthropic API
│       └── route.ts
├── components/
│   ├── ui/                   # Componentes base (Badge, StatCard, etc.)
│   ├── dashboard/            # Sidebar
│   └── agents/               # AdminAgent (FAB + panel)
├── lib/
│   ├── data.ts               # Datos mock
│   ├── store.ts              # Zustand store
│   └── utils.ts              # Helpers
└── types/index.ts            # TypeScript types
```

## Agentes IA

| Agente | Ruta | Descripción |
|--------|------|-------------|
| 🏗️ Constructor | `/builder` | Crea la tienda conversacionalmente con preview en vivo |
| 🧑‍💼 Administrativo | Dashboard (FAB) | Gestiona productos, órdenes, analytics con contexto completo |
| 💰 Ventas | `/store/[slug]` | Convierte visitas en ventas en la tienda pública |

## Variables de entorno

```env
ANTHROPIC_API_KEY=sk-ant-...   # Requerido
```
