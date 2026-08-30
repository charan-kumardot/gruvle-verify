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

## Known limitations (see ../current_status.md for the full list)

- Only `/api/verify`'s pipeline work is offloaded to a threadpool (`run_in_threadpool`)
  to avoid blocking the event loop for the 15-90s a verification can take. The other
  routes make quick (sub-second) synchronous Supabase calls directly in `async def`
  handlers — acceptable for an MVP's request volume, but should move to the same
  pattern (or an async DB client) before high-concurrency production load.
