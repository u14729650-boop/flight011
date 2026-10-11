-- HOMIES CHOICE — Supabase schema for the admin panel
-- Run this once in Supabase → SQL Editor. Safe to re-run.
--
-- The website talks to these tables only from the server, using the
-- service-role key (SUPABASE_SERVICE_ROLE_KEY), which bypasses RLS.
-- RLS is enabled with no public write policies, so the anon key can never
-- change anything.

create extension if not exists "pgcrypto";

-- Products (fragrances and watches). Sizes/options, photos and specs are JSON.
create table if not exists products (
  slug text primary key check (slug ~ '^[a-z0-9-]{1,80}$'),
  category text not null default 'fragrance' check (category in ('fragrance', 'watch')),
  brand text not null,
  name text not null,
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

create table if not exists enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  phone text not null check (char_length(phone) between 10 and 25),
  message text not null check (char_length(message) between 10 and 1000),
  source text,
  handled boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table products enable row level security;
alter table enquiries enable row level security;
alter table settings enable row level security;

-- Public read of published products only (useful if you later read with the anon key).
drop policy if exists "public read published products" on products;
create policy "public read published products" on products for select using (is_published);

-- Storage bucket for product photos (public read; uploads happen server-side).
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;
