# Current Status — Gruvle Verify

Last updated: 2026-08-30

## Phase: 1 — Functional MVP, validated end-to-end with real providers

The core product is built and has been driven through a real browser (Playwright)
against the live Supabase project and real Gemini/Groq AI calls: signup → login →
submit a claim → real evidence collection via self-hosted SearXNG → contradiction
detection → verdict/confidence scoring → full report render → save/tag/notes →
history listing. Zero console errors, zero failed requests, on the final run.

This is not a mockup — every screenshot referenced below came from the app actually
running against real infrastructure, not stubbed data (except `/example`, which is
deliberately a fixed static report for unauthenticated visitors).

## What's built

**Backend** (`/backend`, FastAPI, 28 hermetic tests passing in ~1.5s):
- Full pipeline: claim extraction → per-claim research (template query generation,
  no AI needed) → evidence collection (search + content extraction + verbatim-excerpt
  selection) → AI reasoning (per-claim status + per-evidence relationship) →
  deterministic numeric contradiction detection → deterministic verdict/confidence
  scoring (pure functions, zero network calls, unit tested).
- Provider abstractions with real fallback chains, not just interfaces on paper:
  - `AIProvider`: Gemini (`gemini-3.6-flash`) → OpenRouter (free tier, ~50 req/day
    cap) → Groq (`openai/gpt-oss-20b`) → Ollama (auto-detected if running locally —
    this dev machine has one, with `qwen3:4b`/`qwen3:8b`) → `LocalProvider`
    (zero-dependency keyword/numeric heuristics, always available, clearly labels
    its own output as heuristic).
  - `WebSearchProvider`: self-hosted SearXNG (primary) → DuckDuckGo HTML scrape
    (best-effort fallback, observed to be unreliable/CAPTCHA'd — don't depend on it).
  - `VisionProvider`: Gemini vision → Tesseract-OCR-only local fallback.
  - Document/OCR: PyMuPDF + pdfplumber-style OCR-on-empty-page fallback, python-docx,
    Tesseract.
- Supabase integration: schema applied to the live project (`app/db/schema.sql`,
  RLS enabled, `verifications`/`profiles`/`watchlist_items` tables), auth verified
  via Supabase's own `auth.get_user`, service-role client for backend writes.
- API surface: `/api/verify` (submit — text/URL/file, all modes), `/api/verify/{id}`,
  `/api/history` (filter/sort/paginate), `/api/reports/{id}` (patch/delete),
  `/api/settings/profile`, `/api/watchlist`, `/api/auth/me`, `/api/status` (reports
  which providers are actually configured, used by the frontend's degraded-mode
  banner), `/api/health`.

**Frontend** (`/frontend`, Next.js 16 App Router + TypeScript + Tailwind v4):
- Public: landing page (hero, live verify-teaser box that routes through signup if
  not logged in, evidence-flow diagram), `/example` (static report demo), login,
  signup (email/password + magic link + Google OAuth button), password reset,
  OAuth/magic-link callback route.
- Authenticated app shell (sidebar nav: Dashboard, Verify, History, Saved,
  Watchlist, Reports, Settings) gated by both Next.js middleware and a server-side
  session check in the layout.
- Onboarding (two-screen, skippable, persists to `profiles`).
- Verify flow: mode selector (all 7 modes), text/URL/file input, optional question,
  submits to the real backend, redirects to the report.
- Report view: verdict + risk badges, confidence meter with breakdown, expandable
  claims list with cited evidence cards (source quality, relationship, "open
  source" link), contradiction callouts, a simple evidence map, "What's still
  uncertain?", "Recommended next steps", image-analysis section, save/tag/notes/
  delete/copy-link actions.
- History/Saved/Reports share one filterable list component; Watchlist has its own
  simple add/remove flow against the real `watchlist_items` API.

## Two real bugs found and fixed during end-to-end testing

These are worth recording because they're the kind of thing that looks fine in
isolation and only breaks under a real browser flow:

1. **The verification pipeline was blocking the entire server.** `/api/verify`'s
   route was `async def` but called fully synchronous, long-running work (search,
   page fetches, AI calls — 15-90s total) directly. On a single-worker uvicorn
   process this froze the event loop for that whole span, so any other concurrent
   request (even the same page's own status check) would hang. Fixed by running the
   pipeline via `starlette.concurrency.run_in_threadpool` (`backend/app/api/routes_verify.py`).
   The other routes still make quick synchronous Supabase calls directly in
   `async def` handlers — fine at MVP request volume, but should get the same
   treatment (or an async DB client) before real concurrent load.
2. **Unhandled exceptions were masquerading as CORS errors.** The `verifications`
   table hadn't actually been applied to the live Supabase project yet (the SQL file
   existed, but nobody had run it) — every DB-backed route was throwing a 500. When
   an exception escapes a route handler entirely, Starlette's default error path
   bypasses `CORSMiddleware`'s header injection, so the browser reports "blocked by
   CORS policy" instead of the real 500 — that error message sent the debugging
   session in the wrong direction for a while. Fixed two things: applied the schema
   for real (`psycopg` against `SUPABASE_DB_URL`), and added a global
   `@app.exception_handler(Exception)` in `main.py` so any future unhandled error
   returns a normal `JSONResponse` (which keeps CORS headers) with the real cause
   logged server-side instead of surfacing as a misleading CORS failure.

## Verified live-provider quirks worth knowing

- The Gemini key's format (`AQ.` prefix) is unusual but genuinely works.
  `gemini-2.5-flash` is retired for new callers — use `gemini-3.6-flash`. Also:
  Gemini 3.x "thinking" models can burn the whole output budget on internal
  reasoning and return empty visible text for structured-output prompts unless you
  pass `generationConfig.thinkingConfig.thinkingBudget: 0` (done in
  `gemini_provider.py`) — otherwise `reason()`/`extract_claims()` silently look like
  "the model returned garbage" when it's actually "the model never got to answer."
- Free-tier Gemini is rate-limited tightly enough to hit 429s within a handful of
  requests in quick succession — the router's fallback chain exists precisely for
  this, not just as a theoretical resilience feature.
- Groq's model catalog has moved on from `llama-3.3-70b-versatile` (410/model_not_found)
  to `openai/gpt-oss-20b` etc. — check `GET /openai/v1/models` against your own key
  before assuming a model name from documentation still exists.
- OpenRouter's free tier caps around 50 requests/day per key without adding credits
  — it's correctly positioned in the chain as a fallback, not a primary.
- `AIProvider.reason()`/`extract_claims()` deliberately **raise** on unparsable model
  output rather than swallowing the error into a fake "insufficient evidence"
  result — that swallowing was itself a bug we hit and fixed, because it prevented
  `ModelRouter` from ever falling through to the next provider when the first one
  returned malformed output instead of failing outright.
- Numeric contradiction detection normalizes British/American unit spelling
  ("metres" vs "meters") — without it, a genuine conflict (Wikipedia's "330 meters"
  vs a listing's "324 metres") is invisible to the detector purely because of
  dialect, which defeats the point of the feature.

## Known gaps / not built

- **Speech-to-text** (puter.js vs. Groq Whisper vs. local Whisper): not evaluated
  or wired in. No voice input anywhere in the product yet.
- **Report export/sharing**: "Copy link" only — no PDF export.
- **Team/API/Integrations** nav items from the spec's "optional future navigation"
  were correctly left out of MVP scope.
- **Resend**: key is stored but unused — Supabase's own auth email (confirmation,
  magic link, password reset) is what's actually wired up. Decide later if
  transactional email needs to move to Resend for deliverability/branding reasons.
- **Vercel/Render tokens**: stored, but nothing has actually been deployed yet —
  this has only been run locally. `backend/render.yaml` exists as a starting point.
- Remaining synchronous-Supabase-in-async-route pattern noted above.
- No automated frontend tests (the end-to-end validation was a one-off Playwright
  script run manually during this build, not a committed test suite).

## Immediate next steps, in order

1. Decide on and wire up speech-to-text if voice input is actually wanted for v1.
2. Deploy: backend to Render (or similar) with SearXNG alongside it (a Render
   background worker or a separate small host — it needs to be reachable at
   `SEARXNG_BASE_URL` from the deployed backend, not just `localhost`), frontend to
   Vercel with `NEXT_PUBLIC_API_URL` pointing at the deployed backend.
3. Apply the same `run_in_threadpool` treatment to the remaining Supabase-backed
   routes before expecting concurrent production traffic.
4. Add a committed browser test (Playwright) covering the signup → verify → report
   path, since that's exactly where the two real bugs above were hiding.
