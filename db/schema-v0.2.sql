-- The Ring Vault — v0.2 migration: accounts + the vault
-- Run this in Supabase: SQL Editor → New query → paste → Run.
-- Safe to run more than once.

-- 1) Link designs to authenticated users (nullable: pre-account designs keep working)
alter table public.designs
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- 2) One canonical design per user (their vault), plus revision history via created_at
alter table public.designs
  add column if not exists is_current boolean not null default true;

create index if not exists designs_user_idx on public.designs (user_id);

-- 3) Row Level Security policies
--    Users may read/write only their own designs. The service role (server routes)
--    bypasses RLS, so anonymous saves keep working.

drop policy if exists "own designs: select" on public.designs;
create policy "own designs: select"
  on public.designs for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "own designs: insert" on public.designs;
create policy "own designs: insert"
  on public.designs for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "own designs: update" on public.designs;
create policy "own designs: update"
  on public.designs for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 4) Claim helper: when someone creates an account with the same email they used
--    for an anonymous save, attach those designs to the new account.
create or replace function public.claim_designs_for_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.designs
     set user_id = new.id
   where user_id is null
     and lower(email) = lower(new.email);
  return new;
end;
$$;

drop trigger if exists claim_designs_on_signup on auth.users;
create trigger claim_designs_on_signup
  after insert on auth.users
  for each row execute function public.claim_designs_for_user();
