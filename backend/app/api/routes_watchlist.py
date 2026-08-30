from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from starlette.concurrency import run_in_threadpool

from app.db.client import get_service_client
from app.deps import CurrentUser, get_current_user

router = APIRouter(prefix="/api/watchlist", tags=["watchlist"])


class WatchlistItemCreate(BaseModel):
    label: str
    verification_id: str | None = None
    notes: str | None = None


def _client_or_503():
    client = get_service_client()
    if client is None:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Watchlist storage is not configured.")
    return client


@router.get("")
async def list_watchlist(user: CurrentUser = Depends(get_current_user)):
    client = _client_or_503()
    query = (
        client.table("watchlist_items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", desc=True)
    )
    response = await run_in_threadpool(query.execute)
    return response.data


@router.post("", status_code=status.HTTP_201_CREATED)
async def add_watchlist_item(item: WatchlistItemCreate, user: CurrentUser = Depends(get_current_user)):
    client = _client_or_503()
    query = client.table("watchlist_items").insert({
        "user_id": user.id,
        "label": item.label,
        "verification_id": item.verification_id,
        "notes": item.notes,
    })
    response = await run_in_threadpool(query.execute)
    return response.data[0]


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_watchlist_item(item_id: str, user: CurrentUser = Depends(get_current_user)):
    client = _client_or_503()
    query = client.table("watchlist_items").delete().eq("id", item_id).eq("user_id", user.id)
    await run_in_threadpool(query.execute)
