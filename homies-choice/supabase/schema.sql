-- HOMIES CHOICE — optional Supabase schema
-- The website currently reads its catalogue from src/data/products.ts.
-- This schema is the suggested structure for moving the catalogue, inventory,
-- orders and enquiries into Supabase. Run it in the Supabase SQL editor.

create extension if not exists "pgcrypto";

-- Admins: add a row per staff user (auth.users.id) who may manage the shop.
create table if not exists admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admin_users where user_id = auth.uid());
$$;

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  sort_order int not null default 0
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  brand text not null,
  name text not null,
  concentration text,
  gender text not null check (gender in ('men', 'women', 'unisex')),
  origin text not null check (origin in ('designer', 'arabic')),
  families text[] not null default '{}',
  moods text[] not null default '{}',
  description text not null default '',
  notes jsonb,                -- { top: [], heart: [], base: [], source: "" } once verified
  images jsonb not null default '[]',
  bestseller boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists product_categories (
  product_id uuid references products (id) on delete cascade,
  category_id uuid references categories (id) on delete cascade,
  primary key (product_id, category_id)
);

create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  sku text unique not null,
  size_ml int check (size_ml > 0),
  price_inr numeric(10, 2) check (price_inr >= 0),          -- null = price on request
  compare_at_price_inr numeric(10, 2) check (compare_at_price_inr >= 0),
  sort_order int not null default 0
);

create table if not exists inventory (
  variant_id uuid primary key references product_variants (id) on delete cascade,
  quantity int not null default 0 check (quantity >= 0),
  status text not null default 'on_request' check (status in ('in_stock', 'low_stock', 'out_of_stock', 'on_request')),
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text,
  customer_phone text,
  delivery_area text,
  note text,
  status text not null default 'enquiry' check (status in ('enquiry', 'confirmed', 'paid', 'dispatched', 'completed', 'cancelled')),
  subtotal_inr numeric(10, 2),
  delivery_inr numeric(10, 2),
  total_inr numeric(10, 2),
  created_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  variant_id uuid references product_variants (id),
  product_name text not null,
  size_ml int,
  quantity int not null check (quantity > 0),
  unit_price_inr numeric(10, 2)
);

create table if not exists enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  phone text not null check (char_length(phone) between 10 and 25),
  message text not null check (char_length(message) between 10 and 1000),
  source text,
  handled boolean not null default false,
  created_at timestamptz not null default now()
);

-- Row level security ---------------------------------------------------------
alter table admin_users enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_categories enable row level security;
alter table product_variants enable row level security;
alter table inventory enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table enquiries enable row level security;

-- Public (anon) can read the published catalogue only.
create policy "public read categories" on categories for select using (true);
create policy "public read published products" on products for select using (is_published or is_admin());
create policy "public read product categories" on product_categories for select using (true);
create policy "public read variants" on product_variants for select
  using (exists (select 1 from products p where p.id = product_id and (p.is_published or is_admin())));
create policy "public read inventory" on inventory for select using (true);

-- Admins manage everything.
create policy "admin all categories" on categories for all using (is_admin()) with check (is_admin());
create policy "admin all products" on products for all using (is_admin()) with check (is_admin());
create policy "admin all product categories" on product_categories for all using (is_admin()) with check (is_admin());
create policy "admin all variants" on product_variants for all using (is_admin()) with check (is_admin());
create policy "admin all inventory" on inventory for all using (is_admin()) with check (is_admin());
create policy "admin all orders" on orders for all using (is_admin()) with check (is_admin());
create policy "admin all order items" on order_items for all using (is_admin()) with check (is_admin());
create policy "admin read enquiries" on enquiries for select using (is_admin());
create policy "admin update enquiries" on enquiries for update using (is_admin()) with check (is_admin());
create policy "admin read admins" on admin_users for select using (is_admin());

-- Enquiries are inserted only by the website's server route with the
-- service-role key (which bypasses RLS) — there is deliberately no anon insert policy.
