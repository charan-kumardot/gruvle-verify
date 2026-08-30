"""
Two Supabase clients, deliberately kept separate:
  - service client: full-privilege (service role key), backend-only, used for writes
    that the API layer has already authorized against the request's own user_id.
  - user client factory: builds a client scoped to the caller's JWT so RLS policies
    apply — used wherever we want the database itself to be the enforcement point,
    not just application code.

Both are None when Supabase isn't configured; callers must handle that (degraded
mode: verification still runs, just isn't persisted — see api/routes_verify.py).
"""
from __future__ import annotations

from functools import lru_cache

from supabase import Client, create_client

from app.config import Settings, get_settings


@lru_cache
def get_service_client() -> Client | None:
    settings = get_settings()
    if not (settings.supabase_url and settings.supabase_service_role_key):
        return None
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def get_user_client(access_token: str) -> Client | None:
    settings = get_settings()
    if not (settings.supabase_url and settings.supabase_anon_key):
        return None
    client = create_client(settings.supabase_url, settings.supabase_anon_key)
    client.postgrest.auth(access_token)
    return client


def is_db_configured(settings: Settings | None = None) -> bool:
    settings = settings or get_settings()
    return bool(settings.supabase_url and settings.supabase_service_role_key)
