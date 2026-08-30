# Gruvle Verify — Backend

FastAPI service implementing the verification pipeline (claim extraction, evidence
collection, contradiction detection, deterministic verdict/confidence scoring) plus
the API layer backing the frontend. See [../CLAUDE.md](../CLAUDE.md) for architecture.

## Local setup

```bash
cd backend
python -m venv .venv
.venv/Scripts/activate        # or: source .venv/bin/activate on macOS/Linux
pip install -r requirements.txt
```

Environment variables are read from `../.env.local` (repo root) — see
`../.env.example` for the full list. Nothing here is hardcoded; every provider
degrades gracefully if its key is absent (see `app/providers/*/router.py`).

### Search: SearXNG (recommended)

The evidence pipeline needs a search provider. Self-hosted SearXNG is the free,
keyless, primary option:

```bash
docker compose -f ../docker/docker-compose.yml up -d
```

Then `SEARXNG_BASE_URL=http://localhost:8080` in `.env.local` (already the default).
Without it, the app falls back to a best-effort DuckDuckGo HTML scrape, which is
unreliable (rate-limited/CAPTCHA-prone) — fine for a quick local check, not for
real use. Deploy SearXNG for anything beyond a one-off test.

### OCR: Tesseract

Image analysis and scanned-PDF text extraction fall back to Tesseract OCR when no
vision-capable AI provider is configured (or as a supplement even when one is).
Install the `tesseract` binary separately — `pytesseract` only wraps it, it doesn't
ship it:

- Windows: https://github.com/UB-Mannheim/tesseract/wiki (installer), then ensure
  `tesseract.exe` is on `PATH`.
- macOS: `brew install tesseract`
- Linux: `apt-get install tesseract-ocr`

If it's missing, OCR-dependent paths degrade to "OCR unavailable" rather than
crashing (see `app/providers/ocr/tesseract_ocr.py`).

### Database: Supabase

Apply the schema once against your Supabase project (SQL editor, or programmatically
via `psycopg` against `SUPABASE_DB_URL` — see `app/db/schema.sql`). Without it, every
DB-backed route (history, save/tag/notes, watchlist) returns a clear 503/500 rather
than silently pretending to work; verification itself still runs, just isn't
persisted.

## Run

```bash
python -m uvicorn app.main:app --reload --port 8123
```

`GET /api/status` reports which providers are actually configured — check it first
when something seems to be running in a more limited mode than expected.

## Tests

```bash
pytest -q
```

All 28+ tests are hermetic (no network, no external services) — see
`tests/test_orchestrator_integration.py` for how the AI chain is forced down to the
local heuristic tier so results don't depend on what happens to be running on the
test machine (e.g. a local Ollama daemon).

## Deployment

Deployed on Render (free tier) as two services — see `../render.yaml` for the
Blueprint reference and `../current_status.md` for the live URLs and how they were
actually created (via direct Render API calls, not the Blueprint flow). In short:

- `gruvle-verify-api` — this FastAPI app, `rootDir: backend`, Python pinned via
  `.python-version` (Render's default Python is newer than `pydantic-core` has
  wheels for — pin it or the build fails on a Rust compile in a read-only sandbox).
- `gruvle-verify-searxng` — built from `../docker/Dockerfile.searxng`, which layers
  `../docker/searxng/settings.yml` (enables the JSON search API) onto the official
  `searxng/searxng` image. A plain `image:` deploy of the upstream image won't work
  here — there's no way to inject the custom settings.yml into it.

Set `CORS_ORIGINS` on the deployed service to your actual frontend origin(s),
comma-separated — the default only allows `localhost:3000`.

## Known limitations (see ../current_status.md for the full list)

- `/api/verify`'s pipeline work and the auth dependency's Supabase call are offloaded
  to a threadpool (`run_in_threadpool`) so they don't block uvicorn's single event
  loop — the former for the 15-90s a verification can take, the latter because it
  runs on every authenticated request. The remaining DB-only routes now use the same
  pattern too, since it's cheap and this is a single free-tier instance with no
  horizontal scaling — worth revisiting with an async DB client if this ever needs
  to run multiple instances under real concurrent load.
