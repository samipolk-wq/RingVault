-- The Ring Vault — v0.4 migration: Stripe checkout + the notification process
-- (Follows db/schema-v0.3.sql, which you have already run.)
-- Run in Supabase: SQL Editor → New query → paste → Run. Safe to run twice.

-- 1) Her notification preference — the three options from the deposit flow.
--    'discreet' is the default on purpose: she hears about anything that
--    touches her privacy (a stranger failing her questions) but never about
--    the unlock itself, so the proposal stays a surprise.
alter table public.designs
  add column if not exists notify_mode text not null default 'discreet',
  add column if not exists allow_lead_alerts boolean not null default true;

alter table public.designs
  drop constraint if exists designs_notify_mode_chk;
alter table public.designs
  add constraint designs_notify_mode_chk
  check (notify_mode in ('everything', 'discreet', 'nothing'));

-- 2) Vault event log — powers the "who's peeking" dashboard and is the
--    trigger source for notifications. One row per meaningful action.
create table if not exists public.vault_events (
  id uuid primary key default gen_random_uuid(),
  design_id uuid not null references public.designs(id) on delete cascade,
  kind text not null,            -- verify_failed | verify_passed | unlock_paid | unlock_refunded
  actor_name text,               -- what the suitor typed, if anything
  actor_email text,
  created_at timestamptz not null default now()
);

create index if not exists vault_events_design_idx
  on public.vault_events (design_id, created_at desc);

alter table public.vault_events enable row level security;

drop policy if exists "own vault events: select" on public.vault_events;
create policy "own vault events: select"
  on public.vault_events for select
  to authenticated
  using (
    exists (
      select 1 from public.designs d
      where d.id = vault_events.design_id and d.user_id = auth.uid()
    )
  );

-- 3) Email outbox. Every send is queued first, then delivered. This keeps the
--    Stripe webhook fast and idempotent: if an email provider is down, the
--    payment still records and the message retries later instead of forcing
--    Stripe to replay the event.
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  design_id uuid references public.designs(id) on delete set null,
  unlock_id uuid references public.unlocks(id) on delete set null,
  lead_id uuid references public.suitor_leads(id) on delete set null,
  template text not null,        -- see lib/emails/templates.ts
  to_email text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',   -- pending | sent | failed | skipped
  attempts integer not null default 0,
  last_error text,
  dedupe_key text,               -- prevents duplicate sends on webhook replay
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create unique index if not exists notifications_dedupe_idx
  on public.notifications (dedupe_key) where dedupe_key is not null;
create index if not exists notifications_pending_idx
  on public.notifications (status, created_at) where status = 'pending';

alter table public.notifications enable row level security;
-- No anon/authenticated policies: server routes only.

-- 4) Track which suitor leads have already been told she deposited, so the
--    growth loop never emails the same person twice.
alter table public.suitor_leads
  add column if not exists notified_at timestamptz,
  add column if not exists searched_name_key text;

create index if not exists suitor_leads_key_idx
  on public.suitor_leads (searched_name_key) where notified_at is null;

-- Backfill the name key for leads captured before this migration.
update public.suitor_leads
   set searched_name_key = regexp_replace(lower(trim(searched_name)), '[^a-z0-9]', '', 'g')
 where searched_name_key is null and searched_name is not null;

-- 5) Align the stored default with the live price ($49.99). The checkout route
--    always passes an explicit amount, so this only affects hand-inserted rows.
alter table public.unlocks alter column amount_cents set default 4999;

-- 6) Verification attempt log: rate-limit material and an audit trail of who
--    tried to open which vault. Written by lib/notify.ts.
create table if not exists public.verify_attempts (
  id uuid primary key default gen_random_uuid(),
  design_id uuid not null references public.designs(id) on delete cascade,
  suitor_email text,
  ip text,
  success boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists verify_attempts_design_idx
  on public.verify_attempts (design_id, created_at desc);
alter table public.verify_attempts enable row level security;

-- 7) Fast webhook lookups by Stripe session.
create index if not exists unlocks_session_idx on public.unlocks (stripe_session_id);
