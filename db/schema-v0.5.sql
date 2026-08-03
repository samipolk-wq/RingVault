-- The Ring Vault — v0.5 migration: the photo book
--
-- Photos she uploads live in a PRIVATE Supabase Storage bucket. Nothing is
-- ever publicly readable: the suitor deliverable serves time-limited signed
-- URLs, and only after payment. If the bucket were public, a guessable URL
-- would defeat the paywall entirely.
--
-- Run in Supabase: SQL Editor → New query → paste → Run. Safe to run twice.

create table if not exists public.design_photos (
  id uuid primary key default gen_random_uuid(),

  -- design_id is null while she's still designing. draft_id ties uploads to an
  -- in-progress session, and save-design claims them once the ring exists.
  design_id uuid references public.designs(id) on delete cascade,
  draft_id uuid not null,

  storage_path text not null,
  note text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists design_photos_design_idx on public.design_photos (design_id);
create index if not exists design_photos_draft_idx on public.design_photos (draft_id)
  where design_id is null;

alter table public.design_photos enable row level security;

-- She may read her own photos once they belong to a design she owns.
-- Every write goes through a server route holding the service-role key.
drop policy if exists "own photos: select" on public.design_photos;
create policy "own photos: select"
  on public.design_photos for select
  to authenticated
  using (
    exists (
      select 1 from public.designs d
      where d.id = design_photos.design_id and d.user_id = auth.uid()
    )
  );

-- Abandoned drafts: uploads that never became a ring. Worth clearing
-- occasionally so storage doesn't fill with photos nobody claimed.
-- Run by hand, or wire to a scheduled function later:
--
--   delete from public.design_photos
--    where design_id is null and created_at < now() - interval '7 days';
