-- HOMIES CHOICE — Supabase schema (run in Supabase → SQL Editor; safe to re-run)
--
-- The website reads and writes these tables only from its server, with the
-- service-role key (SUPABASE_SERVICE_ROLE_KEY). Row-level security is on and
-- there are no public write policies, so the public anon key can never change
-- anything. Public read policies exist only for published/active content.

create extension if not exists "pgcrypto";

-- ── Shared: keep updated_at current ─────────────────────────────────────────
create or replace function public.touch_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ── Products (fragrances and watches) ───────────────────────────────────────
create table if not exists public.products (
  slug text primary key check (slug ~ '^[a-z0-9-]{1,80}$'),
  category text not null default 'fragrance' check (category in ('fragrance', 'watch')),
  brand text not null check (char_length(brand) between 1 and 80),
  name text not null check (char_length(name) between 1 and 120),
  concentration text,
  gender text not null check (gender in ('men', 'women', 'unisex')),
  origin text check (origin in ('designer', 'arabic')),
  families text[] not null default '{}',
  moods text[] not null default '{}',
  description text not null default '',
  notes jsonb,                               -- { top: [], heart: [], base: [], source: "" }
  specs jsonb not null default '[]',         -- [{ label, value }]
  images jsonb not null default '[]',        -- [{ src, alt, width, height }]
  variants jsonb not null default '[]',      -- [{ id, sizeMl, label, price, compareAtPrice, availability }]
  bestseller boolean not null default false,
  is_published boolean not null default true,
  pending_verification text,
  sort_order bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_published_order_idx on public.products (is_published, sort_order, created_at);
create index if not exists products_category_idx on public.products (category) where is_published;
drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();

-- ── Banners (home carousel and shop pages) ──────────────────────────────────
create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  placement text not null default 'home' check (placement in ('home', 'shop')),
  eyebrow text,
  title text not null check (char_length(title) between 1 and 90),
  subtitle text,
  cta_label text,
  cta_href text,
  image jsonb,                               -- { src, alt, width, height }
  mobile_image jsonb,
  theme text not null default 'dark' check (theme in ('dark', 'light')),
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint banners_schedule check (ends_at is null or starts_at is null or ends_at > starts_at)
);
create index if not exists banners_placement_order_idx on public.banners (placement, sort_order) where is_active;
drop trigger if exists banners_touch on public.banners;
create trigger banners_touch before update on public.banners for each row execute function public.touch_updated_at();

-- ── Contact-form enquiries ──────────────────────────────────────────────────
create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  phone text not null check (char_length(phone) between 10 and 25),
  message text not null check (char_length(message) between 10 and 1000),
  source text,
  handled boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists enquiries_created_idx on public.enquiries (created_at desc);
create index if not exists enquiries_open_idx on public.enquiries (created_at desc) where not handled;

-- ── Orders from the checkout (copy of what the customer sends on WhatsApp) ───
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique check (ref ~ '^HC-[2-9A-HJKMNP-Z]{6}$'),
  status text not null default 'new' check (status in ('new', 'confirmed', 'paid', 'shipped', 'delivered', 'cancelled')),
  customer_name text not null default '' check (char_length(customer_name) <= 80),
  area text not null default '' check (char_length(area) <= 120),
  note text not null default '' check (char_length(note) <= 500),
  payment_method text not null check (payment_method in ('cod', 'upi', 'whatsapp')),
  payment_ref text not null default '' check (char_length(payment_ref) <= 40),
  token_amount integer check (token_amount is null or token_amount >= 0),
  subtotal integer check (subtotal is null or subtotal >= 0),
  unpriced_items integer not null default 0,
  items jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_created_idx on public.orders (created_at desc);
drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders for each row execute function public.touch_updated_at();

-- ── Store settings (business details, home page, payments, SEO, announcement) ─
create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
drop trigger if exists settings_touch on public.settings;
create trigger settings_touch before update on public.settings for each row execute function public.touch_updated_at();

-- ── Row-level security ──────────────────────────────────────────────────────
alter table public.products enable row level security;
alter table public.banners enable row level security;
alter table public.enquiries enable row level security;
alter table public.settings enable row level security;
alter table public.orders enable row level security;

drop policy if exists "public read published products" on public.products;
create policy "public read published products" on public.products for select using (is_published);

drop policy if exists "public read live banners" on public.banners;
create policy "public read live banners" on public.banners for select
  using (is_active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()));

-- enquiries, orders and settings: no public policies (server-only access).

-- ── Storage: product and banner photos ──────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 6291456, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public read product images" on storage.objects;
create policy "public read product images" on storage.objects for select using (bucket_id = 'product-images');
-- Uploads go through the website's admin API with the service-role key (no public insert policy).
