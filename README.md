# Gruvle Verify

An evidence-first verification engine. See [CLAUDE.md](CLAUDE.md) for architecture
and [current_status.md](current_status.md) for what's built, tested, and still
outstanding.

```
/backend    FastAPI verification pipeline + API — see backend/README.md
/frontend   Next.js app — see frontend/README.md
/docker     Self-hosted SearXNG (the free web-search provider)
```

## Quick start

```bash
# 1. Search (recommended before anything else — QUICK_CHECK/DEEP_CHECK need it)
docker compose -f docker/docker-compose.yml up -d

# 2. Backend
cd backend
python -m venv .venv && .venv/Scripts/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8123

# 3. Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Then open http://localhost:3000. Credentials for Supabase/Gemini/Groq/OpenRouter/etc.
live in `.env.local` at the repo root (git-ignored) — see `.env.example` for the
schema. `GET http://localhost:8123/api/status` shows which providers are actually
configured at any time.
