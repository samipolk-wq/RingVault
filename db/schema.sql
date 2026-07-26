-- The Ring Vault — v0.1 schema
-- Run this in Supabase: SQL Editor → New query → paste → Run.

-- Saved ring designs (email-gated; accounts come in v0.2)
create table if not exists public.designs (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  selections jsonb not null default '{}'::jsonb,
  note text,
  source text default 'web',
  created_at timestamptz not null default now()
);

-- Waitlist signups (mirrors the Netlify Forms capture as we migrate)
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  placement text,
  audience text default 'designer', -- 'designer' | 'suitor'
  created_at timestamptz not null default now()
);

create index if not exists designs_email_idx on public.designs (email);
create index if not exists waitlist_email_idx on public.waitlist (email);

-- Row Level Security: locked down. All writes go through the server
-- (service role key) so the anon key exposes nothing.
alter table public.designs enable row level security;
alter table public.waitlist enable row level security;
-- No anon policies on purpose: anon key can neither read nor write these tables.
