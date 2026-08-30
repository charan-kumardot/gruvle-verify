from __future__ import annotations

import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import routes_auth, routes_history, routes_reports, routes_settings, routes_verify, routes_watchlist
from app.config import get_settings
from app.db.client import is_db_configured
from app.providers.ai.router import ModelRouter
from app.providers.search.searxng_provider import SearXNGProvider

logger = logging.getLogger("gruvle.api")

app = FastAPI(title="Gruvle Verify API", version="0.1.0")

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    # Starlette's default behavior for an exception that escapes a route handler
    # is to fall back to a bare ASGI 500 that bypasses CORSMiddleware's header
    # injection — the browser then reports it as a CORS failure, hiding the real
    # error entirely. Returning a normal JSONResponse here keeps it on the regular
    # response path so CORS headers are still applied, and logs the real cause
    # server-side instead of forcing the frontend to guess from a CORS message.
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error."},
    )

app.include_router(routes_verify.router)
app.include_router(routes_history.router)
app.include_router(routes_reports.router)
app.include_router(routes_settings.router)
app.include_router(routes_auth.router)
app.include_router(routes_watchlist.router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/status")
async def status():
    """Lets the frontend show an honest 'running in degraded mode' banner instead
    of silently producing lower-quality reports."""
    s = get_settings()
    ai_router = ModelRouter(s)
    return {
        "database_configured": is_db_configured(s),
        "ai_providers_configured": ai_router.configured_providers(),
        "search_provider_configured": SearXNGProvider(s.searxng_base_url).is_configured(),
        "vision_configured": bool(s.gemini_api_key),
        "email_configured": bool(s.resend_api_key),
    }
