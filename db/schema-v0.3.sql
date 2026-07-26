-- The Ring Vault — v0.3 migration: the suitor side
-- Consent-first by design: nothing is discoverable unless she opts in,
-- and verification only ever uses facts she volunteered for this exact purpose.
-- Run in Supabase: SQL Editor → New query → paste → Run.

-- 1) Discoverability + verification, all opt-in.
--    We store SHA-256 hashes of her verification answers, never the answers
--    themselves, so a database leak reveals nothing about her.
alter table public.designs
  add column if not exists discoverable boolean not null default false,
  add column if not exists full_name text,
  add column if not exists name_key text,               -- normalized name for search
  add column if not exists verify_dob_hash text,
  add column if not exists verify_middle_hash text,
  add column if not exists verify_school_hash text,
  add column if not exists blocked_names text[] default '{}';

create index if not exists designs_name_key_idx on public.designs (name_key)
  where discoverable = true;

-- 2) Unlocks: one row per suitor purchase, gating access to the deliverable.
create table if not exists public.unlocks (
  id uuid primary key default gen_random_uuid(),
  design_id uuid not null references public.designs(id) on delete cascade,
  suitor_email text not null,
  amount_cents integer not null default 1999,
  status text not null default 'pending',   -- pending | paid | refunded
  stripe_session_id text,
  access_token uuid not null default gen_random_uuid(),  -- unguessable deliverable link
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists unlocks_design_idx on public.unlocks (design_id);
create unique index if not exists unlocks_token_idx on public.unlocks (access_token);

alter table public.unlocks enable row level security;
-- No anon/authenticated policies: all access flows through server routes.

-- 3) Jeweler referrals: the real revenue line.
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  unlock_id uuid references public.unlocks(id) on delete set null,
  jeweler_slug text,
  metro text,
  status text not null default 'sent',      -- sent | contacted | closed
  created_at timestamptz not null default now()
);

alter table public.referrals enable row level security;

-- 4) Failed-search capture: suitors whose partner has no ring yet.
--    This is the 2013 spec's "she's not here" loop — a growth engine.
create table if not exists public.suitor_leads (
  id uuid primary key default gen_random_uuid(),
  suitor_email text,
  searched_name text,
  prompt_choice text,      -- direct | advertise | friend | none
  created_at timestamptz not null default now()
);

alter table public.suitor_leads enable row level security;
