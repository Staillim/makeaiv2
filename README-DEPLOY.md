# ShopMind AI - Plataforma de E-commerce con IA 🛍️

Plataforma completa de e-commerce con agentes de IA integrados, constructor de tiendas intuitivo y dashboard de analíticas avanzadas.

## 🚀 Características

- **Constructor de tiendas con IA**: Crea tu tienda hablando en lenguaje natural
- **Agentes inteligentes**: Asistentes de ventas, administración y atención al cliente
- **Dashboard completo**: Analytics, gestión de products, órdenes y pagos
- **Multi-tienda**: Gestiona múltiples tiendas desde una sola cuenta
- **Autenticación segura**: Sistema completo con Supabase Auth
- **Responsive**: Funciona perfectamente en móvil y escritorio

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **IA**: Anthropic Claude API
- **Deploy**: Netlify
- **UI**: Componentes personalizados con Lucide React

## 📦 Instalación Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/Staillim/makeaiv2.git
cd makeaiv2
npm install
```

### 2. Configurar variables de entorno
Crea un archivo `.env.local` basado en `.env.example`:

```bash
cp .env.example .env.local
```

Completa las variables requeridas:
```env
# Supabase - REQUERIDO
NEXT_PUBLIC_SUPABASE_URL=tu-url-de-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key

# Anthropic - Opcional (para funciones de IA)
ANTHROPIC_API_KEY=tu-api-key-anthropic
```

### 3. Ejecutar en desarrollo
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🌐 Deploy en Netlify

### ⚠️ Variables de entorno requeridas

**IMPORTANTE**: En el dashboard de Netlify, ve a **Site Settings > Environment Variables** y configura:

```
NEXT_PUBLIC_SUPABASE_URL = tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = tu-anon-key
ANTHROPIC_API_KEY = sk-ant-api0... (opcional)
```

**Sin estas variables, el build fallará** ❌

### Pasos para deploy:

1. **Fork este repositorio** en tu cuenta de GitHub
2. **Conecta tu repo** a Netlify
3. **Configura las variables** de entorno (paso crítico)
4. **Deploy automático** en cada push

### Configuración automática
El proyecto incluye `netlify.toml` con:
- Build command optimizado
- Plugin de Next.js
- Headers de seguridad
- Redirects para SPA

## 🔧 Configuración de Supabase

### 1. Crear proyecto
1. Ve a [supabase.com](https://supabase.com)
2. Crea nuevo proyecto
3. Copia URL y anon key

### 2. Ejecutar Schema
Copia y ejecuta el SQL de `supabase/schema.sql` en el SQL Editor:

```sql
-- Crea tablas: profiles, stores, products, orders, etc.
-- Ver archivo completo en supabase/schema.sql
```

### 3. Configurar Auth
1. **Authentication > Settings** en Supabase
2. Habilita providers: **Google**, **GitHub**
3. **Site URL**: `https://tu-sitio.netlify.app`
4. **Redirect URLs**:
   - `http://localhost:3000/auth/callback` (dev)
   - `https://tu-sitio.netlify.app/auth/callback` (prod)

## 📁 Estructura del Proyecto

```
shopmind/
├── app/                     # Next.js App Router
│   ├── (auth)/             # Login, Registro
│   ├── dashboard/          # Panel de admin
│   ├── builder/            # Constructor IA
│   ├── store/[slug]/       # Tiendas públicas
│   └── api/chat/           # Endpoint de IA
├── components/             # Componentes React
│   ├── ui/                 # Componentes base
│   ├── dashboard/          # Dashboard específicos
│   └── agents/             # Agentes de IA
├── lib/                    # Utilidades
│   ├── supabase/          # Cliente Supabase
│   ├── store.ts           # Estado global
│   └── utils.ts           # Helpers
├── types/                  # TypeScript definitions
└── supabase/              # DB schema
```

## 🤖 Agentes de IA

### 1. Constructor de Tiendas (`/builder`)
- **Conversación natural** para setup
- **Preview en tiempo real** (móvil/desktop)
- **Configuración completa**: colores, productos, estilo

### 2. Agente Admin (`/dashboard`)
- **FAB inteligente** en dashboard
- **Consultas de analytics**: "¿Cómo van las ventas?"
- **Gestión inteligente** de inventario

### 3. Agente de Ventas (`/store/[slug]`)
- **Asistente de compras** en tienda pública
- **Recomendaciones personalizadas**
- **Soporte 24/7** a clientes

## ⚡ Funciones Principales

### 🏪 Dashboard Completo
- **Analytics en tiempo real**: Ventas, visitas, conversión
- **Gestión de productos**: CRUD con categorías y stock
- **Tracking de órdenes**: Estados y timeline completo
- **Configuración**: Perfil, notificaciones, planes

### 🎨 Constructor Visual
- **Setup conversacional**: "Quiero una tienda de ropa"
- **Preview responsivo**: Ve cómo queda en móvil y desktop
- **Personalización completa**: Colores, layout, productos

### 📊 Analytics Avanzadas
- **Métricas clave**: Revenue, AOV, conversión
- **Gráficos interactivos**: Recharts con datos reales
- **Exportación**: CSV y reportes automáticos

## 🎯 Roadmap

- [ ] **Pagos con Stripe**: Integración completa
- [ ] **Inventario avanzado**: Multi-warehouse
- [ ] **Templates premium**: Diseños pre-hechos
- [ ] **IA predictiva**: Forecasting de ventas
- [ ] **API pública**: Para integraciones
- [ ] **Sistema de afiliados**: programa de partners

## 🐛 Solución de Problemas

### Build falla en Netlify
```bash
# Error: Missing Supabase environment variables
```
**Solución**: Configura `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en Netlify

### Funciones de IA no responden
```bash
# Error: API key missing
```
**Solución**: Agrega `ANTHROPIC_API_KEY` en variables de entorno

### Auth redirect no funciona
**Solución**: Verifica URLs de redirect en Supabase Auth settings

## 📝 Scripts Disponibles

```bash
npm run dev         # Desarrollo local
npm run build       # Build para producción
npm run start       # Servidor producción
npm run lint        # ESLint + TypeScript check
```

## 🤝 Contribuir

1. **Fork** el repositorio
2. **Crea branch**: `git checkout -b feature/nueva-feature`
3. **Commit**: `git commit -m 'Add nueva característica'`
4. **Push**: `git push origin feature/nueva-feature`
5. **Pull Request** con descripción detallada

## 📞 Soporte

- **Issues**: GitHub Issues para bugs
- **Features**: Discussions para nuevas ideas
- **Contacto**: [Crear issue](https://github.com/Staillim/makeaiv2/issues/new)

---

### 🔗 Links Útiles

- **Demo Live**: [Ver demo](https://shopmind-ai.netlify.app)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Anthropic API**: [docs.anthropic.com](https://docs.anthropic.com)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)

**ShopMind AI** - El futuro del e-commerce está aquí 🚀✨