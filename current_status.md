# Current Status — Gruvle Verify

Last updated: 2026-08-30

## Phase: 2 — Deployed to production, validated end-to-end on the live URLs

**Live:**
- App: https://gruvle-verify.vercel.app
- API: https://gruvle-verify-api.onrender.com
- Search: https://gruvle-verify-searxng.onrender.com
- Source: https://github.com/charan-kumardot/gruvle-verify (public — required for
  Render's free tier to fetch it without an interactive GitHub App install)

The full signup → login → submit a claim → real evidence collection → report was
re-run against these live URLs (not localhost) via a Playwright script, with zero
console errors and zero failed requests. Test accounts and verifications created
during that run were deleted from Supabase afterward.

## What changed since Phase 1 (functional-but-local MVP)

### Production hardening
- **Every route now offloads its Supabase calls to a threadpool.** Phase 1 only
  fixed `/api/verify` (the 15-90s pipeline call); this pass extended the same
  `run_in_threadpool` pattern to `get_current_user` (runs on every authenticated
  request), `/api/history`, `/api/reports/*`, `/api/settings/profile`,
  `/api/watchlist/*`, and `GET /api/verify/{id}` — none of them should be able to
  freeze the single-worker event loop anymore.
- Global exception handler and the schema-application fix from Phase 1 carried
  forward unchanged (see git history if you need the detail).

### Marketing site
- The landing page was a functional but minimal single-screen layout. It's now a
  full premium-SaaS page: sticky nav, animated hero (framer-motion), a trust-
  principles strip, a "not a chatbot / is an evidence engine" positioning section,
  a features grid, a use-cases grid, honest pricing (a real free tier + a "Pro —
  coming soon" tier that is visibly disabled, not a fake checkout), an FAQ
  accordion, a final CTA, and a real footer.
- Added `/privacy` and `/terms` — genuinely required once the product handles real
  user accounts and sends user content to third-party AI providers. Both are
  honest about being beta-stage, plain-language pages, not a substitute for formal
  legal review, with a real contact address.
- Scroll-triggered animations use `whileInView` — verified by actually scrolling
  through the deployed page in a browser, not just screenshotting it (a naive
  full-page screenshot renders these sections as blank, because the animation
  never gets a chance to trigger without real scroll events — that's a testing
  artifact, not a real-user bug; a person scrolling the actual page sees it fine).

### Speech-to-text and PDF export
- **Voice input**: a `TranscriptionProvider` abstraction (same pattern as
  `AIProvider`/`VisionProvider`/`WebSearchProvider`) backed by Groq's free Whisper
  endpoint (`whisper-large-v3-turbo`). Chose Groq over puter.js (the originally
  suggested candidate) because it reuses a provider already validated live in this
  project rather than adding a third-party client-side script with its own
  reliability/terms; chose it over local Whisper because Render's free-tier
  instance doesn't have the CPU/RAM to run one at usable latency. A mic button on
  the verify form records via `MediaRecorder`, uploads to `POST /api/transcribe`,
  and fills the textarea with the result. Validated end-to-end in a real Chromium
  browser using `--use-file-for-fake-audio-capture` (a real WAV file standing in
  for a microphone) against both localhost and the deployed production URLs —
  recording, transcription, submission, and the resulting report all worked with
  zero console errors.
- **PDF export**: generated straight from the structured `VerificationResult` with
  `reportlab` (pure Python, no system libraries) rather than by rendering the
  frontend's HTML — same reasoning as the deterministic report-text builders: one
  source of truth, no separate rendering path to drift from it. Chose reportlab
  specifically over an HTML-to-PDF engine (WeasyPrint, etc.) because this project
  already hit one native-dependency build failure on Render (`pydantic-core`
  needing a Rust toolchain the sandbox forbids) and reportlab has zero native
  dependencies to repeat that risk with. Exposed at `GET
  /api/reports/{id}/export.pdf`, one-click download button on the report page.
  Validated by actually downloading and reading the resulting PDF, both locally
  and from the deployed production app — real report data, correctly formatted,
  not a stub.
- Both features required a live-API check before committing to an approach — e.g.
  confirming Groq's `/audio/transcriptions` endpoint and exact field names by
  generating a real WAV file (Windows TTS) and transcribing it, rather than coding
  against assumed API shape. That habit already paid off twice in earlier phases
  (Gemini's model names, Groq's chat model catalog); no reason to stop now.
- **`/api/transcribe` has no auth requirement**, matching `/api/verify`'s existing
  optional-auth pattern (anonymous quick verification is allowed) — but it's not
  linked from the public landing page, only from the authenticated verify form, so
  the abuse surface is smaller than `/api/verify`'s. Worth adding rate limiting to
  both if abuse becomes a real problem; not done here.
- **Render's GitHub fetch doesn't auto-deploy on push** the way a proper GitHub
  App integration would — `autoDeploy: "yes"` was set, but no webhook actually
  fires (fetching a public repo by bare URL isn't the same as installing Render's
  GitHub App). Every deploy in this project, including this feature's, needed an
  explicit `POST /v1/services/{id}/deploys` call after pushing. Same underlying
  limitation as point 3 below.

## Real problems hit during deployment (worth knowing before you touch this again)

1. **Render's default Python (3.14) can't build `pydantic-core`.** It's a Rust
   extension without a prebuilt wheel yet for 3.14, and Render's build sandbox has
   a read-only cargo registry directory, so the from-source build fails outright.
   Fixed with `backend/.python-version` pinning `3.12.10`. If a future dependency
   bump reintroduces this, the error looks like `maturin failed` / `Read-only file
   system` in the build log, not an obviously-Python-version-shaped error.
2. **SearXNG can't be deployed as a bare upstream Docker image on Render.** The
   default `searxng/searxng` image ships with the JSON search API disabled
   (`search.formats` doesn't include `json` in its default `settings.yml`), and
   Render's image-based deploy (`serviceDetails.env: "image"`) gives no way to
   mount a custom config file into it. Fixed by deploying from
   `docker/Dockerfile.searxng`, which is just `FROM searxng/searxng:latest` +
   `COPY settings.yml /etc/searxng/settings.yml`, built from the repo instead of
   pulled as a bare image.
3. **Render's GitHub fetch needs a public repo.** Creating a service via the API
   against a private repo fails with "invalid or unfetchable" — Render's GitHub
   App wasn't installed/authorized for this account. Made the repo public rather
   than working through an interactive GitHub App install; there's nothing secret
   in it (`.env.local` is git-ignored throughout).
4. **Env var changes on Render don't take effect on `restart` alone** — they need
   an actual redeploy (`POST /v1/services/{id}/deploys`). A plain restart kept
   serving the old `CORS_ORIGINS` value and the frontend's requests were rejected
   with "Disallowed CORS origin" until a real redeploy ran.
5. **Vercel's GitHub integration couldn't be linked via CLI/API** (`vercel git
   connect` / `vercel link`) — it needs the Vercel GitHub App authorized through
   their dashboard, which requires an interactive OAuth consent screen. Frontend
   deploys go out via `vercel deploy --prod --token=...` instead; connecting
   push-to-deploy later is a one-time manual step in Project Settings → Git.

## Known gaps / not built

- **Team/API/Integrations** nav items: correctly out of scope for MVP.
- **Resend**: key stored, unused — Supabase's own auth email is what's live.
- **Vercel git integration**: not connected (see point 5 above) — redeploys are a
  manual CLI command until someone authorizes it via the dashboard.
- **SearXNG is a single free-tier Render instance with no scaling/monitoring** —
  fine for current load, but it's also the one component with no automatic
  fallback quality guarantee if Render's free tier throttles or sleeps it (the
  app falls back to DuckDuckGo scraping, which is unreliable, not to a second
  SearXNG instance).
- **No automated browser test is committed** — the end-to-end validation (both
  the Phase 1 local run and this phase's production run) was a one-off Playwright
  script, not a checked-in test suite. Worth adding given it's exactly where the
  real bugs in both phases were hiding.
- Free-tier constraints worth remembering day to day: Render's free web services
  spin down after inactivity (first request after idle can be slow — a "cold
  start" delay, not a bug); Gemini's free tier rate-limits aggressively (this is
  why the AI provider fallback chain exists, not just for show); OpenRouter's free
  tier caps around 50 requests/day per key.

## Immediate next steps, in order

1. Add a committed Playwright test for signup → verify → report (and now the
   voice-input and PDF-export paths) — every real bug found across every phase
   of this project only surfaced under an actual end-to-end run, never from unit
   tests alone.
2. Authorize Vercel's GitHub App via the dashboard for push-to-deploy, and look
   into whether Render's GitHub App can be installed the same way — both
   platforms currently need a manual CLI/API deploy after every push.
3. Consider a paid or more resilient search fallback if SearXNG's free-tier
   Render instance proves to be a reliability bottleneck under real usage.
4. Add rate limiting to `/api/verify` and `/api/transcribe` if anonymous/low-
   friction abuse becomes a real problem — neither has any today.
