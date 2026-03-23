-- ═══════════════════════════════════════════════════════════════════════════
--  Maket AI — Schema SQL Completo
--  Pega y ejecuta TODO esto en el SQL Editor de Supabase
--  Una sola pasada. Idempotente (se puede correr múltiples veces).
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
--  0. EXTENSIONES
-- ─────────────────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";


-- ─────────────────────────────────────────────────────────────────────────
--  1. FUNCIÓN GLOBAL: updated_at automático
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ─────────────────────────────────────────────────────────────────────────
--  2. PROFILES — extiende auth.users
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id                  uuid        primary key references auth.users(id) on delete cascade,
  name                text        not null default '',
  email               text        not null default '',
  plan                text        not null default 'free' check (plan in ('free','pro','business')),
  avatar_from         text        not null default '#7c5cfc',
  avatar_to           text        not null default '#f43f8e',
  notif_ventas        boolean     not null default true,
  notif_stock         boolean     not null default true,
  notif_reportes      boolean     not null default false,
  notif_devoluciones  boolean     not null default true,
  notif_ia            boolean     not null default true,
  stripe_customer_id  text,
  plan_expires_at     timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, plan)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'plan', 'free')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ─────────────────────────────────────────────────────────────────────────
--  3. STORES
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.stores (
  id              uuid          primary key default uuid_generate_v4(),
  owner_id        uuid          not null references public.profiles(id) on delete cascade,
  name            text          not null,
  slug            text          not null,
  tagline         text          not null default '',
  type            text          not null default 'general' check (type in ('ropa','tech','food','beauty','hogar','general')),
  primary_color   text          not null default '#7c5cfc',
  secondary_color text          not null default '#f43f8e',
  columns         int           not null default 3 check (columns between 1 and 4),
  style           text          not null default 'moderno' check (style in ('minimalista','moderno','organico','lujo')),
  active          boolean       not null default true,
  total_products  int           not null default 0,
  total_orders    int           not null default 0,
  total_revenue   numeric(14,2) not null default 0,
  created_at      timestamptz   not null default now(),
  updated_at      timestamptz   not null default now(),
  unique (owner_id, slug)
);

create index if not exists idx_stores_owner  on public.stores(owner_id);
create index if not exists idx_stores_slug   on public.stores(slug);
create index if not exists idx_stores_active on public.stores(active);

drop trigger if exists trg_stores_updated_at on public.stores;
create trigger trg_stores_updated_at
  before update on public.stores
  for each row execute procedure public.set_updated_at();


-- ─────────────────────────────────────────────────────────────────────────
--  4. PRODUCTS
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.products (
  id            uuid          primary key default uuid_generate_v4(),
  store_id      uuid          not null references public.stores(id) on delete cascade,
  name          text          not null,
  sku           text          not null,
  description   text          not null default '',
  price         numeric(12,2) not null default 0 check (price >= 0),
  compare_price numeric(12,2),
  stock         int           not null default 0 check (stock >= 0),
  category      text          not null default 'general',
  variants      text[]        not null default '{}',
  gradient_from text          not null default '#667eea',
  gradient_to   text          not null default '#764ba2',
  badge         text          not null default '',
  active        boolean       not null default true,
  sales         int           not null default 0,
  created_at    timestamptz   not null default now(),
  updated_at    timestamptz   not null default now(),
  unique (store_id, sku)
);

create index if not exists idx_products_store    on public.products(store_id);
create index if not exists idx_products_category on public.products(store_id, category);
create index if not exists idx_products_stock    on public.products(store_id, stock);
create index if not exists idx_products_active   on public.products(store_id, active);
create index if not exists idx_products_name_trgm on public.products using gin (name gin_trgm_ops);

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
  before update on public.products
  for each row execute procedure public.set_updated_at();

create or replace function public.sync_store_product_count()
returns trigger language plpgsql security definer as $$
begin
  if TG_OP = 'INSERT' then
    update public.stores set total_products = total_products + 1 where id = new.store_id;
  elsif TG_OP = 'DELETE' then
    update public.stores set total_products = greatest(0, total_products - 1) where id = old.store_id;
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_product_count on public.products;
create trigger trg_product_count
  after insert or delete on public.products
  for each row execute procedure public.sync_store_product_count();


-- ─────────────────────────────────────────────────────────────────────────
--  5. ORDERS
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.orders (
  id                uuid          primary key default uuid_generate_v4(),
  store_id          uuid          not null references public.stores(id) on delete cascade,
  order_number      text          not null,
  status            text          not null default 'pendiente' check (status in ('pendiente','preparando','camino','entregada','devolucion')),
  client_name       text          not null,
  client_email      text          not null,
  client_phone      text          not null default '',
  client_initials   text          not null default '',
  client_grad_from  text          not null default '#667eea',
  client_grad_to    text          not null default '#764ba2',
  items             jsonb         not null default '[]',
  total             numeric(12,2) not null default 0,
  payment_method    text          not null default '',
  address           text          not null default '',
  notes             text          not null default '',
  created_at        timestamptz   not null default now(),
  updated_at        timestamptz   not null default now(),
  unique (store_id, order_number)
);

create index if not exists idx_orders_store   on public.orders(store_id);
create index if not exists idx_orders_status  on public.orders(store_id, status);
create index if not exists idx_orders_created on public.orders(store_id, created_at desc);
create index if not exists idx_orders_client  on public.orders(store_id, client_name);

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
  before update on public.orders
  for each row execute procedure public.set_updated_at();

create or replace function public.sync_store_order_stats()
returns trigger language plpgsql security definer as $$
begin
  if TG_OP = 'INSERT' then
    update public.stores
    set total_orders  = total_orders + 1,
        total_revenue = total_revenue + greatest(0, new.total)
    where id = new.store_id;
  elsif TG_OP = 'UPDATE' and old.total <> new.total then
    update public.stores
    set total_revenue = total_revenue - greatest(0, old.total) + greatest(0, new.total)
    where id = new.store_id;
  elsif TG_OP = 'DELETE' then
    update public.stores
    set total_orders  = greatest(0, total_orders - 1),
        total_revenue = greatest(0, total_revenue - greatest(0, old.total))
    where id = old.store_id;
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_order_stats on public.orders;
create trigger trg_order_stats
  after insert or update or delete on public.orders
  for each row execute procedure public.sync_store_order_stats();


-- ─────────────────────────────────────────────────────────────────────────
--  6. ANALYTICS DAILY
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.analytics_daily (
  id               uuid          primary key default uuid_generate_v4(),
  store_id         uuid          not null references public.stores(id) on delete cascade,
  date             date          not null,
  visits           int           not null default 0,
  revenue          numeric(12,2) not null default 0,
  orders_count     int           not null default 0,
  units_sold       int           not null default 0,
  funnel_views     int           not null default 0,
  funnel_cart      int           not null default 0,
  funnel_checkout  int           not null default 0,
  src_organic      int           not null default 0,
  src_social       int           not null default 0,
  src_direct       int           not null default 0,
  src_paid         int           not null default 0,
  created_at       timestamptz   not null default now(),
  unique (store_id, date)
);

create index if not exists idx_analytics_store_date on public.analytics_daily(store_id, date desc);


-- ─────────────────────────────────────────────────────────────────────────
--  7. PRODUCT VIEWS
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.product_views (
  id          uuid        primary key default uuid_generate_v4(),
  product_id  uuid        not null references public.products(id) on delete cascade,
  store_id    uuid        not null references public.stores(id) on delete cascade,
  viewed_at   timestamptz not null default now(),
  session_id  text
);

create index if not exists idx_pviews_product on public.product_views(product_id, viewed_at desc);
create index if not exists idx_pviews_store   on public.product_views(store_id, viewed_at desc);


-- ─────────────────────────────────────────────────────────────────────────
--  8. CART SESSIONS
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.cart_sessions (
  id          uuid        primary key default uuid_generate_v4(),
  store_id    uuid        not null references public.stores(id) on delete cascade,
  session_id  text        not null,
  items       jsonb       not null default '[]',
  status      text        not null default 'open' check (status in ('open','converted','abandoned')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_cart_store   on public.cart_sessions(store_id, status);
create index if not exists idx_cart_session on public.cart_sessions(session_id);

drop trigger if exists trg_cart_updated_at on public.cart_sessions;
create trigger trg_cart_updated_at
  before update on public.cart_sessions
  for each row execute procedure public.set_updated_at();


-- ─────────────────────────────────────────────────────────────────────────
--  9. AGENT CONVERSATIONS
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.agent_conversations (
  id             uuid        primary key default uuid_generate_v4(),
  owner_id       uuid        not null references public.profiles(id) on delete cascade,
  store_id       uuid        references public.stores(id) on delete set null,
  agent_type     text        not null check (agent_type in ('constructor','admin','ventas')),
  messages       jsonb       not null default '[]',
  builder_config jsonb,
  published      boolean     not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_conversations_owner on public.agent_conversations(owner_id, agent_type);
create index if not exists idx_conversations_store on public.agent_conversations(store_id);

drop trigger if exists trg_conversations_updated_at on public.agent_conversations;
create trigger trg_conversations_updated_at
  before update on public.agent_conversations
  for each row execute procedure public.set_updated_at();


-- ─────────────────────────────────────────────────────────────────────────
--  10. PAYMENTS
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.payments (
  id             uuid          primary key default uuid_generate_v4(),
  owner_id       uuid          not null references public.profiles(id) on delete cascade,
  store_id       uuid          references public.stores(id) on delete set null,
  type           text          not null check (type in ('sale','withdrawal','refund','commission')),
  amount         numeric(12,2) not null,
  description    text          not null default '',
  reference_id   text,
  status         text          not null default 'completed' check (status in ('pending','completed','failed','reversed')),
  payment_method text,
  created_at     timestamptz   not null default now()
);

create index if not exists idx_payments_owner on public.payments(owner_id, created_at desc);
create index if not exists idx_payments_store on public.payments(store_id, created_at desc);
create index if not exists idx_payments_type  on public.payments(owner_id, type);


-- ─────────────────────────────────────────────────────────────────────────
--  11. INVOICES
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.invoices (
  id             uuid          primary key default uuid_generate_v4(),
  owner_id       uuid          not null references public.profiles(id) on delete cascade,
  invoice_number text          not null unique,
  plan           text          not null,
  amount         numeric(10,2) not null,
  status         text          not null default 'paid' check (status in ('paid','pending','failed','void')),
  period_start   date          not null,
  period_end     date          not null,
  pdf_url        text,
  created_at     timestamptz   not null default now()
);

create index if not exists idx_invoices_owner on public.invoices(owner_id, created_at desc);


-- ─────────────────────────────────────────────────────────────────────────
--  12. NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id          uuid        primary key default uuid_generate_v4(),
  owner_id    uuid        not null references public.profiles(id) on delete cascade,
  store_id    uuid        references public.stores(id) on delete cascade,
  type        text        not null check (type in ('new_order','low_stock','no_stock','refund','payment','system','ai_summary')),
  title       text        not null,
  body        text        not null default '',
  data        jsonb,
  read        boolean     not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists idx_notifs_owner on public.notifications(owner_id, read, created_at desc);
create index if not exists idx_notifs_store on public.notifications(store_id, created_at desc);

create or replace function public.notify_low_stock()
returns trigger language plpgsql security definer as $$
declare
  v_owner_id uuid;
begin
  if (new.stock <= 5 and (old.stock > 5 or TG_OP = 'INSERT')) then
    select owner_id into v_owner_id from public.stores where id = new.store_id;
    insert into public.notifications (owner_id, store_id, type, title, body, data)
    values (
      v_owner_id, new.store_id,
      case when new.stock = 0 then 'no_stock' else 'low_stock' end,
      case when new.stock = 0 then 'Sin stock: ' || new.name else 'Stock bajo: ' || new.name end,
      case when new.stock = 0
        then new.name || ' se quedó sin unidades.'
        else new.name || ' tiene solo ' || new.stock || ' unidades restantes.'
      end,
      jsonb_build_object('product_id', new.id, 'stock', new.stock, 'sku', new.sku)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_low_stock_notif on public.products;
create trigger trg_low_stock_notif
  after insert or update of stock on public.products
  for each row execute procedure public.notify_low_stock();

create or replace function public.notify_new_order()
returns trigger language plpgsql security definer as $$
declare
  v_owner_id uuid;
begin
  select owner_id into v_owner_id from public.stores where id = new.store_id;
  insert into public.notifications (owner_id, store_id, type, title, body, data)
  values (
    v_owner_id, new.store_id, 'new_order',
    'Nueva orden ' || new.order_number,
    new.client_name || ' realizó un pedido por $' || trim(to_char(new.total, 'FM999,999,999')) || ' COP.',
    jsonb_build_object('order_id', new.id, 'total', new.total, 'status', new.status)
  );
  return new;
end;
$$;

drop trigger if exists trg_new_order_notif on public.orders;
create trigger trg_new_order_notif
  after insert on public.orders
  for each row execute procedure public.notify_new_order();


-- ─────────────────────────────────────────────────────────────────────────
--  13. VISTAS
-- ─────────────────────────────────────────────────────────────────────────
create or replace view public.v_store_summary as
select
  s.id, s.owner_id, s.name, s.slug, s.type,
  s.primary_color, s.secondary_color, s.active,
  s.total_products, s.total_orders, s.total_revenue,
  count(distinct p.id) filter (where p.active and p.stock = 0)          as products_out_of_stock,
  count(distinct p.id) filter (where p.active and p.stock between 1 and 5) as products_low_stock,
  count(distinct o.id) filter (where o.status = 'pendiente')             as orders_pending,
  count(distinct o.id) filter (where o.status = 'camino')                as orders_in_transit,
  coalesce(sum(ad.revenue) filter (where ad.date >= date_trunc('month', current_date)::date), 0) as revenue_this_month,
  coalesce(sum(ad.visits)  filter (where ad.date = current_date), 0) as visits_today
from public.stores s
left join public.products p on p.store_id = s.id
left join public.orders o   on o.store_id = s.id
left join public.analytics_daily ad on ad.store_id = s.id
group by s.id;

create or replace view public.v_top_products as
select
  p.id, p.store_id, p.name, p.sku, p.price, p.stock,
  p.category, p.sales, p.active, p.gradient_from, p.gradient_to,
  count(pv.id) as views_total,
  case when count(pv.id) > 0 then round((p.sales::numeric / count(pv.id)) * 100, 1) else 0 end as conversion_rate
from public.products p
left join public.product_views pv on pv.product_id = p.id
group by p.id;

create or replace view public.v_unread_notifications as
select owner_id, count(*) as unread_count
from public.notifications
where read = false
group by owner_id;


-- ─────────────────────────────────────────────────────────────────────────
--  14. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────
alter table public.profiles            enable row level security;
alter table public.stores              enable row level security;
alter table public.products            enable row level security;
alter table public.orders              enable row level security;
alter table public.analytics_daily     enable row level security;
alter table public.product_views       enable row level security;
alter table public.cart_sessions       enable row level security;
alter table public.agent_conversations enable row level security;
alter table public.payments            enable row level security;
alter table public.invoices            enable row level security;
alter table public.notifications       enable row level security;

-- Profiles
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Stores
drop policy if exists "stores_owner_all"    on public.stores;
drop policy if exists "stores_public_read"  on public.stores;
create policy "stores_owner_all"   on public.stores for all    using (auth.uid() = owner_id);
create policy "stores_public_read" on public.stores for select using (active = true);

-- Products
drop policy if exists "products_owner_all"   on public.products;
drop policy if exists "products_public_read" on public.products;
create policy "products_owner_all" on public.products for all
  using (exists (select 1 from public.stores where id = store_id and owner_id = auth.uid()));
create policy "products_public_read" on public.products for select using (active = true);

-- Orders
drop policy if exists "orders_owner_all" on public.orders;
create policy "orders_owner_all" on public.orders for all
  using (exists (select 1 from public.stores where id = store_id and owner_id = auth.uid()));

-- Analytics
drop policy if exists "analytics_owner_all" on public.analytics_daily;
create policy "analytics_owner_all" on public.analytics_daily for all
  using (exists (select 1 from public.stores where id = store_id and owner_id = auth.uid()));

-- Product views (write public, read owner)
drop policy if exists "pviews_public_insert" on public.product_views;
drop policy if exists "pviews_owner_select"  on public.product_views;
create policy "pviews_public_insert" on public.product_views for insert with check (true);
create policy "pviews_owner_select"  on public.product_views for select
  using (exists (select 1 from public.stores where id = store_id and owner_id = auth.uid()));

-- Cart sessions (full public access)
drop policy if exists "cart_public_all"  on public.cart_sessions;
drop policy if exists "cart_owner_read"  on public.cart_sessions;
create policy "cart_public_all"  on public.cart_sessions for all  using (true);
create policy "cart_owner_read"  on public.cart_sessions for select
  using (exists (select 1 from public.stores where id = store_id and owner_id = auth.uid()));

-- Agent conversations
drop policy if exists "conversations_owner_all" on public.agent_conversations;
create policy "conversations_owner_all" on public.agent_conversations for all using (auth.uid() = owner_id);

-- Payments
drop policy if exists "payments_owner_all" on public.payments;
create policy "payments_owner_all" on public.payments for all using (auth.uid() = owner_id);

-- Invoices
drop policy if exists "invoices_owner_all" on public.invoices;
create policy "invoices_owner_all" on public.invoices for all using (auth.uid() = owner_id);

-- Notifications
drop policy if exists "notifs_owner_all" on public.notifications;
create policy "notifs_owner_all" on public.notifications for all using (auth.uid() = owner_id);


-- ─────────────────────────────────────────────────────────────────────────
--  15. FUNCIONES RPC
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.mark_notifications_read(p_owner_id uuid)
returns void language plpgsql security definer as $$
begin
  update public.notifications set read = true
  where owner_id = p_owner_id and read = false;
end;
$$;

create or replace function public.update_order_status(p_order_id uuid, p_status text)
returns void language plpgsql security definer as $$
begin
  update public.orders set status = p_status
  where id = p_order_id
    and exists (select 1 from public.stores where id = store_id and owner_id = auth.uid());
  if not found then raise exception 'Orden no encontrada o sin permisos'; end if;
end;
$$;

create or replace function public.upsert_analytics(
  p_store_id uuid, p_date date,
  p_visits int default 0, p_revenue numeric default 0,
  p_orders int default 0, p_units int default 0
)
returns void language plpgsql security definer as $$
begin
  insert into public.analytics_daily (store_id, date, visits, revenue, orders_count, units_sold)
  values (p_store_id, p_date, p_visits, p_revenue, p_orders, p_units)
  on conflict (store_id, date) do update set
    visits       = analytics_daily.visits       + excluded.visits,
    revenue      = analytics_daily.revenue      + excluded.revenue,
    orders_count = analytics_daily.orders_count + excluded.orders_count,
    units_sold   = analytics_daily.units_sold   + excluded.units_sold;
end;
$$;


-- ─────────────────────────────────────────────────────────────────────────
--  16. SEED DATA — StyleBox Moda
--      Se inserta automáticamente para el primer usuario registrado.
--      Si no hay usuarios aún, ejecuta de nuevo después de registrarte.
-- ─────────────────────────────────────────────────────────────────────────
do $$
declare
  v_owner_id  uuid;
  v_store_id  uuid;
  v_exists    boolean;
begin
  select id into v_owner_id from public.profiles order by created_at limit 1;
  if v_owner_id is null then
    raise notice 'No hay usuarios todavía. Regístrate y vuelve a ejecutar el seed.';
    return;
  end if;

  select exists(select 1 from public.stores where owner_id = v_owner_id and slug = 'stylebox')
  into v_exists;
  if v_exists then
    raise notice 'Tienda StyleBox ya existe — seed omitido.';
    return;
  end if;

  -- Tienda
  insert into public.stores (owner_id, name, slug, tagline, type, primary_color, secondary_color, columns, style)
  values (v_owner_id, 'StyleBox Moda', 'stylebox', 'Moda que te define', 'ropa', '#7c5cfc', '#f43f8e', 3, 'moderno')
  returning id into v_store_id;

  -- Productos
  insert into public.products (store_id, name, sku, description, price, stock, category, variants, gradient_from, gradient_to, badge, sales)
  values
    (v_store_id,'Vestido Floral Primavera','VF-001','Tela premium importada, tallas S-L',         89900, 47,'ropa',      '{"S","M","L"}',        '#667eea','#764ba2','Nuevo',  92),
    (v_store_id,'Sneakers Urban Casual',   'SN-003','Comodidad todo el día, suela antideslizante',145000, 23,'calzado',   '{"38","40","42"}',      '#f093fb','#f5576c','Popular',71),
    (v_store_id,'Abrigo Invierno Premium', 'AB-007','Lana 100% natural, corte moderno',           220000,  3,'ropa',      '{"M","L","XL"}',        '#4facfe','#00f2fe','',       34),
    (v_store_id,'Bolso Cuero Genuino',     'BL-011','Hecho a mano, varios compartimentos',        175000, 18,'accesorios','{"Café","Negro"}',      '#43e97b','#38f9d7','Oferta', 49),
    (v_store_id,'Gafas Sol Polarizadas',   'GF-005','UV400, marco metálico titanio',               68000,  0,'accesorios','{"Dorado","Negro"}',    '#fa709a','#fee140','',       18),
    (v_store_id,'Collar Plata 925',        'CO-014','Diseño exclusivo, incluye estuche regalo',    95000,  4,'accesorios','{"45cm"}',              '#a18cd1','#fbc2eb','Nuevo',  38),
    (v_store_id,'Blusa Seda Italiana',     'BS-022','Seda 100% importada, varios colores',        115000, 31,'ropa',      '{"XS","S","M"}',        '#f7971e','#ffd200','',       27),
    (v_store_id,'Cinturón Cuero Premium',  'CI-031','Cuero genuino, hebilla metálica',             55000, 42,'accesorios','{"S","M","L","XL"}',    '#1e3c72','#2a5298','',       19);

  -- Órdenes
  insert into public.orders (store_id, order_number, status, client_name, client_email, client_phone, client_initials, client_grad_from, client_grad_to, items, total, payment_method, address)
  values
    (v_store_id,'#1048','pendiente', 'María López',    'maria.lopez@email.com', '+57 310 555 0011','ML','#667eea','#764ba2',
     '[{"productName":"Vestido Floral Primavera","variant":"Talla S · Rosa","gradientFrom":"#667eea","gradientTo":"#764ba2"},{"productName":"Collar Plata 925","variant":"Cadena 45cm","gradientFrom":"#a18cd1","gradientTo":"#fbc2eb"}]',
     184900,'💳 Tarjeta •••• 4012','Bogotá, Chapinero'),

    (v_store_id,'#1047','preparando','Carlos Ruiz',    'carlos.ruiz@email.com', '+57 300 123 4567','CR','#f093fb','#f5576c',
     '[{"productName":"Sneakers Urban Casual","variant":"Talla 42 · Negro","gradientFrom":"#f093fb","gradientTo":"#f5576c"}]',
     145000,'📱 Nequi','Medellín, El Poblado'),

    (v_store_id,'#1046','camino',    'Ana García',     'ana.garcia@email.com',  '+57 315 888 2020','AG','#43e97b','#38f9d7',
     '[{"productName":"Bolso Cuero Genuino","variant":"Color Café","gradientFrom":"#43e97b","gradientTo":"#38f9d7"}]',
     175000,'🏦 PSE Bancolombia','Cali, Granada'),

    (v_store_id,'#1045','camino',    'Luis Mendoza',   'luis.m@email.com',      '+57 312 444 7890','LM','#4facfe','#00f2fe',
     '[{"productName":"Abrigo Invierno Premium","variant":"Talla L","gradientFrom":"#4facfe","gradientTo":"#00f2fe"}]',
     220000,'💳 Tarjeta •••• 7741','Barranquilla, Centro'),

    (v_store_id,'#1044','entregada', 'Sofía Castro',   'sofia.c@email.com',     '+57 321 777 3344','SC','#fa709a','#fee140',
     '[{"productName":"Vestido Floral Primavera","variant":"Talla M · Blanco","gradientFrom":"#667eea","gradientTo":"#764ba2"},{"productName":"Gafas Sol Polarizadas","variant":"Marco Dorado","gradientFrom":"#fa709a","gradientTo":"#fee140"}]',
     157900,'📱 Daviplata','Bogotá, Usaquén'),

    (v_store_id,'#1043','pendiente', 'Pedro Martínez', 'pedro.m@email.com',     '+57 305 777 2233','PM','#f7971e','#ffd200',
     '[{"productName":"Blusa Seda Italiana","variant":"Talla M · Azul","gradientFrom":"#f7971e","gradientTo":"#ffd200"},{"productName":"Cinturón Cuero Premium","variant":"Talla S · Negro","gradientFrom":"#1e3c72","gradientTo":"#2a5298"}]',
     170000,'📱 Nequi','Bogotá, Chapinero'),

    (v_store_id,'#1039','devolucion','Karen Rodríguez','karen.r@email.com',     '+57 304 222 8877','KR','#f43f8e','#fb923c',
     '[{"productName":"Abrigo Invierno Premium","variant":"Talla M → pide L","gradientFrom":"#4facfe","gradientTo":"#00f2fe"}]',
     -220000,'⚠ Talla incorrecta','Bogotá, Suba'),

    (v_store_id,'#1031','devolucion','Camila Rojas',   'camila.r@email.com',    '+57 316 444 9900','CR','#a18cd1','#fbc2eb',
     '[{"productName":"Collar Plata 925","variant":"Defecto de fábrica","gradientFrom":"#a18cd1","gradientTo":"#fbc2eb"}]',
     -95000,'⚠ Defecto fábrica','Bucaramanga, Centro');

  -- Analytics: últimos 7 días
  insert into public.analytics_daily (store_id, date, visits, revenue, orders_count, units_sold, funnel_views, funnel_cart, funnel_checkout, src_organic, src_social, src_direct)
  values
    (v_store_id, current_date-6, 1240, 320000, 4,  12,  840, 148, 22, 520, 388, 332),
    (v_store_id, current_date-5, 1820, 480000, 6,  17, 1240, 218, 34, 764, 564, 492),
    (v_store_id, current_date-4,  980, 290000, 3,   9,  665, 117, 18, 411, 304, 265),
    (v_store_id, current_date-3, 2340, 610000, 8,  23, 1591, 280, 44, 982, 725, 633),
    (v_store_id, current_date-2, 1960, 540000, 7,  21, 1332, 235, 37, 823, 607, 530),
    (v_store_id, current_date-1, 3100, 820000, 11, 33, 2108, 371, 58,1302, 961, 837),
    (v_store_id, current_date,   1640, 430000, 5,  16, 1115, 196, 31, 688, 508, 444);

  -- Pagos
  insert into public.payments (owner_id, store_id, type, amount, description, status, payment_method)
  values
    (v_owner_id, v_store_id, 'sale',       184900,'Venta #1048 · Vestido Floral + Collar',  'completed','💳 Tarjeta •••• 4012'),
    (v_owner_id, v_store_id, 'sale',       145000,'Venta #1047 · Sneakers Urban',            'completed','📱 Nequi'),
    (v_owner_id, v_store_id, 'withdrawal',-500000,'Retiro a Bancolombia ****4821',           'completed', null),
    (v_owner_id, v_store_id, 'sale',        95000,'Venta #1046 · Collar Plata 925',          'completed','🏦 PSE'),
    (v_owner_id, v_store_id, 'sale',       175000,'Venta #1045 · Bolso Cuero Genuino',       'completed','💳 Tarjeta •••• 7741'),
    (v_owner_id, v_store_id, 'refund',    -220000,'Devolución #1039 · Abrigo talla incorrecta','completed', null);

  -- Facturas
  insert into public.invoices (owner_id, invoice_number, plan, amount, status, period_start, period_end)
  values
    (v_owner_id,'F-2024-038','Pro',89000,'paid','2024-03-22','2024-04-21'),
    (v_owner_id,'F-2024-021','Pro',89000,'paid','2024-02-22','2024-03-21'),
    (v_owner_id,'F-2024-009','Pro',89000,'paid','2024-01-22','2024-02-21'),
    (v_owner_id,'F-2023-097','Pro',89000,'paid','2023-12-22','2024-01-21');

  raise notice '✅ Seed completado. Store ID: %', v_store_id;
end;
$$;
