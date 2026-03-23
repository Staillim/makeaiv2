-- ═══════════════════════════════════════════════════════
--  Maket AI — Supabase Schema
--  Run this in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── PROFILES (extends auth.users) ─────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null default '',
  email       text not null default '',
  plan        text not null default 'free' check (plan in ('free','pro','business')),
  avatar_from text default '#7c5cfc',
  avatar_to   text default '#f43f8e',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── STORES ────────────────────────────────────────────
create table if not exists public.stores (
  id            uuid primary key default uuid_generate_v4(),
  owner_id      uuid not null references public.profiles(id) on delete cascade,
  name          text not null,
  slug          text not null unique,
  tagline       text default '',
  type          text not null default 'general' check (type in ('ropa','tech','food','beauty','hogar','general')),
  primary_color text default '#7c5cfc',
  secondary_color text default '#f43f8e',
  columns       int default 3 check (columns between 1 and 4),
  style         text default 'moderno' check (style in ('minimalista','moderno','organico','lujo')),
  active        boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ── PRODUCTS ──────────────────────────────────────────
create table if not exists public.products (
  id            uuid primary key default uuid_generate_v4(),
  store_id      uuid not null references public.stores(id) on delete cascade,
  name          text not null,
  sku           text not null,
  description   text default '',
  price         numeric(12,2) not null default 0,
  stock         int not null default 0,
  category      text default 'general',
  variants      text[] default '{}',
  gradient_from text default '#667eea',
  gradient_to   text default '#764ba2',
  badge         text default '',
  active        boolean default true,
  sales         int default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ── ORDERS ────────────────────────────────────────────
create table if not exists public.orders (
  id              uuid primary key default uuid_generate_v4(),
  store_id        uuid not null references public.stores(id) on delete cascade,
  order_number    text not null,
  status          text not null default 'pendiente'
                  check (status in ('pendiente','preparando','camino','entregada','devolucion')),
  client_name     text not null,
  client_email    text not null,
  client_phone    text default '',
  items           jsonb not null default '[]',
  total           numeric(12,2) not null default 0,
  payment_method  text default '',
  address         text default '',
  notes           text default '',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ── ANALYTICS (daily snapshots) ───────────────────────
create table if not exists public.analytics_daily (
  id          uuid primary key default uuid_generate_v4(),
  store_id    uuid not null references public.stores(id) on delete cascade,
  date        date not null,
  visits      int default 0,
  revenue     numeric(12,2) default 0,
  orders      int default 0,
  unique constraint uq_analytics_store_date (store_id, date)
);

-- ── AGENT CONVERSATIONS ───────────────────────────────
create table if not exists public.agent_conversations (
  id          uuid primary key default uuid_generate_v4(),
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  store_id    uuid references public.stores(id) on delete set null,
  agent_type  text not null check (agent_type in ('constructor','admin','ventas')),
  messages    jsonb not null default '[]',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── ROW LEVEL SECURITY ────────────────────────────────
alter table public.profiles              enable row level security;
alter table public.stores                enable row level security;
alter table public.products              enable row level security;
alter table public.orders                enable row level security;
alter table public.analytics_daily       enable row level security;
alter table public.agent_conversations   enable row level security;

-- Profiles: users can only see/edit their own
create policy "profiles_self" on public.profiles
  for all using (auth.uid() = id);

-- Stores: owners can do everything, public can read active stores
create policy "stores_owner"  on public.stores
  for all using (auth.uid() = owner_id);
create policy "stores_public" on public.stores
  for select using (active = true);

-- Products: owner access via store, public can read active
create policy "products_owner" on public.products
  for all using (
    exists (select 1 from public.stores where id = store_id and owner_id = auth.uid())
  );
create policy "products_public" on public.products
  for select using (active = true);

-- Orders: owner only
create policy "orders_owner" on public.orders
  for all using (
    exists (select 1 from public.stores where id = store_id and owner_id = auth.uid())
  );

-- Analytics: owner only
create policy "analytics_owner" on public.analytics_daily
  for all using (
    exists (select 1 from public.stores where id = store_id and owner_id = auth.uid())
  );

-- Agent conversations: owner only
create policy "conversations_owner" on public.agent_conversations
  for all using (auth.uid() = owner_id);

-- ── UPDATED_AT TRIGGER ────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger set_updated_at before update on public.stores
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.products
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.orders
  for each row execute procedure public.set_updated_at();

-- ── SEED DATA (demo store — optional) ─────────────────
-- Uncomment to insert demo data after creating your account
/*
insert into public.stores (owner_id, name, slug, tagline, type, primary_color, secondary_color)
values (
  auth.uid(),
  'StyleBox Moda',
  'stylebox',
  'Moda que te define',
  'ropa',
  '#7c5cfc',
  '#f43f8e'
);
*/
