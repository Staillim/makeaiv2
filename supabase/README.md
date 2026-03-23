# 🗄️ Configuración de la Base de Datos Supabase

## 📋 Pasos para Ejecutar el Schema

### 1. Acceder al SQL Editor de Supabase

1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto **Maket AI**
4. En el menú lateral, haz clic en **SQL Editor**

### 2. Ejecutar el Schema Completo

1. En el SQL Editor, haz clic en **"New query"**
2. Copia **TODO** el contenido del archivo `schema.sql`
3. Pega el contenido en el editor
4. Haz clic en **"Run"** (o presiona `Ctrl + Enter`)

⏱️ **Tiempo estimado de ejecución**: 5-10 segundos

### 3. Verificar la Creación de Tablas

Después de ejecutar el script, verifica que se crearon correctamente:

1. En el menú lateral, haz clic en **Table Editor**
2. Deberías ver las siguientes tablas:
   - ✅ `profiles`
   - ✅ `stores`
   - ✅ `products`
   - ✅ `orders`
   - ✅ `analytics_daily`
   - ✅ `product_views`
   - ✅ `cart_sessions`
   - ✅ `agent_conversations`
   - ✅ `payments`
   - ✅ `invoices`
   - ✅ `notifications`

### 4. Registrar tu Primer Usuario

1. En tu aplicación local ([http://localhost:3000](http://localhost:3000))
2. Ve a la página de registro (`/registro`)
3. Crea tu cuenta con email y contraseña
4. Esto automáticamente:
   - Creará tu perfil en `profiles`
   - Ejecutará el **seed data** automáticamente
   - Creará la tienda de ejemplo **"StyleBox Moda"** con:
     - 8 productos
     - 8 órdenes de muestra
     - 7 días de analytics
     - Pagos e invoices de ejemplo

### 5. Verificar el Seed Data

Después de registrarte:

1. Ve al **Table Editor** en Supabase
2. Abre la tabla `stores` → deberías ver **StyleBox Moda**
3. Abre la tabla `products` → deberías ver **8 productos**
4. Abre la tabla `orders` → deberías ver **8 órdenes**

---

## 🔄 Re-ejecutar el Seed (Opcional)

Si el seed no se ejecutó automáticamente al registrarte:

1. Ve al **SQL Editor**
2. Ejecuta **solo la sección #16** del archivo `schema.sql` (desde "SEED DATA" hasta el final)

---

## 🔐 Seguridad Configurada (RLS)

El schema incluye **Row Level Security (RLS)** preconfigurado:

- ✅ Los usuarios solo ven **sus propias tiendas, productos y órdenes**
- ✅ Las tiendas **activas** son públicas (para visitantes)
- ✅ Los productos **activos** son visibles públicamente
- ✅ Los carritos tienen acceso público (para clientes anónimos)
- ✅ Notificaciones, pagos e invoices son **privados por usuario**

---

## 📊 Funciones RPC Disponibles

El schema incluye 3 funciones que puedes llamar desde tu código:

```typescript
// Marcar notificaciones como leídas
await supabase.rpc('mark_notifications_read', { p_owner_id: userId });

// Actualizar estado de una orden
await supabase.rpc('update_order_status', {
  p_order_id: orderId,
  p_status: 'preparando'
});

// Registrar analytics
await supabase.rpc('upsert_analytics', {
  p_store_id: storeId,
  p_date: '2024-03-22',
  p_visits: 100,
  p_revenue: 50000,
  p_orders: 5,
  p_units: 12
});
```

---

## ⚠️ Notas Importantes

- El script es **idempotente** (puedes ejecutarlo múltiples veces sin problemas)
- Si ya existen las tablas, no se duplicarán
- Los triggers y funciones se reemplazarán con la última versión
- El seed solo se ejecuta si hay usuarios registrados

---

## 🚀 Siguiente Paso

Una vez completada la configuración de la base de datos:

1. Asegúrate de que tu servidor Next.js esté corriendo (`npm run dev`)
2. Regístrate en [http://localhost:3000/registro](http://localhost:3000/registro)
3. Inicia sesión y explora tu dashboard con datos de ejemplo
4. Visita tu tienda en: `http://localhost:3000/store/stylebox`

---

## 📖 Estructura de la Base de Datos

```
auth.users (Supabase Auth)
    ↓
public.profiles (Extensión de usuario)
    ↓
public.stores (Tiendas del usuario)
    ├── public.products (Productos de la tienda)
    ├── public.orders (Órdenes de la tienda)
    ├── public.analytics_daily (Métricas diarias)
    ├── public.product_views (Vistas de productos)
    └── public.cart_sessions (Carritos de compra)
    
public.notifications (Notificaciones del usuario)
public.payments (Historial de pagos)
public.invoices (Facturas de suscripción)
public.agent_conversations (Conversaciones con IA)
```

---

## 💻 Ejemplos de Uso del Cliente

### Configurar el Cliente

```typescript
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
```

### Obtener Tiendas del Usuario

```typescript
const { data: stores, error } = await supabase
  .from("stores")
  .select("*")
  .eq("owner_id", userId)
  .order("created_at", { ascending: false });
```

### Crear un Producto

```typescript
const { data: product, error } = await supabase
  .from("products")
  .insert({
    store_id: storeId,
    name: "Producto Nuevo",
    sku: "SKU-001",
    description: "Descripción",
    price: 50000,
    stock: 10,
    category: "general",
    variants: ["Talla M", "Talla L"],
    gradient_from: "#667eea",
    gradient_to: "#764ba2",
    badge: "Nuevo",
    active: true,
  })
  .select()
  .single();
```

### Obtener Órdenes de una Tienda

```typescript
const { data: orders, error } = await supabase
  .from("orders")
  .select("*")
  .eq("store_id", storeId)
  .eq("status", "pendiente")
  .order("created_at", { ascending: false });
```

### Actualizar Estado de una Orden (usando RPC)

```typescript
await supabase.rpc("update_order_status", {
  p_order_id: orderId,
  p_status: "preparando",
});
```

### Obtener Notificaciones No Leídas

```typescript
const { data: notifications, error } = await supabase
  .from("notifications")
  .select("*")
  .eq("owner_id", userId)
  .eq("read", false)
  .order("created_at", { ascending: false });
```

### Marcar Notificaciones como Leídas

```typescript
await supabase.rpc("mark_notifications_read", {
  p_owner_id: userId,
});
```

### Obtener Analytics de una Tienda

```typescript
const { data: analytics, error } = await supabase
  .from("analytics_daily")
  .select("*")
  .eq("store_id", storeId)
  .gte("date", "2024-03-01")
  .order("date", { ascending: true });
```

### Usar Vista de Resumen de Tienda

```typescript
const { data: summary, error } = await supabase
  .from("v_store_summary")
  .select("*")
  .eq("id", storeId)
  .single();

// summary incluye productos_out_of_stock, orders_pending, revenue_this_month, etc.
```

