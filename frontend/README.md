# Gruvle Verify — Frontend

Next.js (App Router) + TypeScript + Tailwind. See [../CLAUDE.md](../CLAUDE.md) for
overall architecture and design system notes.

## Local setup

```bash
cd frontend
npm install
```

Copy `.env.local.example` to `.env.local` and fill in your Supabase project's URL
and anon/publishable key, plus the backend API URL (defaults to
`http://localhost:8123`). The anon key is safe to expose client-side — Postgres row
-level security (see `../backend/app/db/schema.sql`) is what actually protects data,
not key secrecy.

## Run

```bash
npm run dev       # http://localhost:3000
```

The backend must be running separately (see `../backend/README.md`) — the frontend
calls it directly via `NEXT_PUBLIC_API_URL`, it doesn't proxy through Next.js API
routes.

## Build

```bash
npm run build && npm run start
```

## Deploying

Vercel's free tier is a straightforward fit for this app (standard Next.js App
Router, no custom server needed). Set `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_API_URL` (pointing at wherever the
backend is deployed, e.g. Render) as project environment variables — never commit
them.

## Structure

- `src/app/` — routes. `(auth)/` holds login/signup/reset; `(app)/` holds the
  authenticated shell (dashboard, verify, history, saved, watchlist, reports,
  settings, onboarding) and is gated by `src/middleware.ts` + each layout's own
  server-side session check.
- `src/components/verify/` — the report rendering pieces (`ReportView` is the
  single source of truth for report layout; both the real report page and the
  public `/example` page render through it).
- `src/lib/api.ts` — the only place that talks to the backend; every page goes
  through it rather than calling `fetch` directly, and it's where the Supabase
  access token gets attached to requests.
- `src/lib/types.ts` — mirrors `backend/app/models/schemas.py` by hand. Keep them
  in sync when the backend's shape changes.
