# The Ring Vault — App

Design your dream engagement ring; keep it safe until they're ready to propose.

**v0.1 scope:** the nine-step design flow (from the 2013 spec + 2026 prototypes) with an
email-gated "place in the vault" save, backed by Supabase. Accounts, the suitor side,
Stripe, and AI renders come in v0.2–v0.4.

## Stack

- Next.js 14 (App Router, TypeScript) — hosted on Netlify
- Supabase (Postgres) — designs + waitlist tables, RLS locked (server-only writes)
- Fonts: Cormorant Garamond + Inter (champagne design system)

## Setup

1. **Supabase**: open the SQL Editor and run `db/schema.sql`.
2. **Env vars** (locally in `.env.local`, in production under Netlify → Site settings → Environment variables):
   - `NEXT_PUBLIC_SUPABASE_URL` — Project Settings → API → Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Project Settings → API → anon public key
   - `SUPABASE_SERVICE_ROLE_KEY` — Project Settings → API → service_role key (server-only; never exposed)
3. **Local dev**: `npm install && npm run dev` → http://localhost:3000
4. **Deploy**: push to `main`; Netlify (linked to this repo) builds and deploys automatically.

## Structure

- `app/page.tsx` — minimal home (the marketing landing page lives separately at ringvault.co until cutover)
- `app/design/page.tsx` + `components/Wizard.tsx` — the design flow
- `app/api/save-design`, `app/api/waitlist` — server routes (service-role writes)
- `lib/taxonomy.ts` — the ring variables (2013 sheet, refined 2026)
- `db/schema.sql` — database schema + RLS

## Roadmap

- v0.2 — accounts (Supabase Auth), the vault (revisit/edit), photo book
- v0.3 — suitor side: search, consent-based verification, Stripe unlock, jeweler deliverable
- v0.4 — AI ring renders, hint loops, share-with-friends
