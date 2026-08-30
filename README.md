# Gruvle Verify

An evidence-first verification engine. See [CLAUDE.md](CLAUDE.md) for architecture
and [current_status.md](current_status.md) for what's built, tested, deployed, and
still outstanding.

**Live:**
- App: https://gruvle-verify.vercel.app
- API: https://gruvle-verify-api.onrender.com (`/api/status` shows configured providers)
- Search: https://gruvle-verify-searxng.onrender.com

```
/backend    FastAPI verification pipeline + API — see backend/README.md
/frontend   Next.js app — see frontend/README.md
/docker     Self-hosted SearXNG (the free web-search provider)
render.yaml Reference Blueprint for the two Render services (see current_status.md
            for how they were actually created and their real env vars)
```

## Local development

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

## Deploying changes

- **Backend**: pushing to `main` on GitHub auto-deploys `gruvle-verify-api` on
  Render (repo: https://github.com/charan-kumardot/gruvle-verify, public — Render's
  free tier needs a fetchable repo URL). Env vars are set on the Render service
  directly, not committed anywhere.
- **Frontend**: Vercel's GitHub auto-deploy could not be linked programmatically
  (needs the Vercel GitHub App authorized via their dashboard, which requires
  interactive OAuth) — redeploy manually from `frontend/`:
  `npx vercel deploy --prod --token=<VERCEL_TOKEN>`. Connecting `vercel git connect`
  from the dashboard's Project Settings → Git takes about a minute if you want
  push-to-deploy instead.
