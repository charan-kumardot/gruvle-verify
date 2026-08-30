"""
Auth dependency: validates the Supabase access token on every protected route by
asking Supabase itself who it belongs to (no local JWT-secret verification needed).
Degraded mode: if Supabase isn't configured at all, requests are rejected with a
clear 503 rather than silently treating everyone as anonymous — auth is not a
feature that's safe to degrade quietly.
"""
from __future__ import annotations

from fastapi import Header, HTTPException, status
from starlette.concurrency import run_in_threadpool

from app.db.client import get_service_client


class CurrentUser:
    def __init__(self, id: str, email: str | None):
        self.id = id
        self.email = email


async def get_current_user(authorization: str | None = Header(default=None)) -> CurrentUser:
    client = get_service_client()
    if client is None:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "Authentication is unavailable: Supabase is not configured on the server.",
        )
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing or malformed Authorization header.")

    token = authorization.split(" ", 1)[1]
    try:
        # client.auth.get_user is a blocking network call to Supabase — every
        # protected route depends on this, so leaving it inline would block the
        # event loop on every single authenticated request, not just the slow
        # verification pipeline. run_in_threadpool keeps it off the main loop.
        response = await run_in_threadpool(client.auth.get_user, token)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired session.") from exc

    user = getattr(response, "user", None)
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired session.")
    return CurrentUser(id=user.id, email=user.email)


async def get_optional_user(authorization: str | None = Header(default=None)) -> CurrentUser | None:
    if not authorization:
        return None
    try:
        return await get_current_user(authorization)
    except HTTPException:
        return None
