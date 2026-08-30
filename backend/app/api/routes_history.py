from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from starlette.concurrency import run_in_threadpool

from app.db.client import get_service_client
from app.deps import CurrentUser, get_current_user

router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("")
async def list_history(
    user: CurrentUser = Depends(get_current_user),
    verdict: str | None = Query(None),
    saved_only: bool = Query(False),
    tag: str | None = Query(None),
    search: str | None = Query(None),
    sort: str = Query("created_at_desc"),
    limit: int = Query(20, le=100),
    offset: int = Query(0, ge=0),
):
    client = get_service_client()
    if client is None:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "History storage is not configured.")

    query = client.table("verifications").select(
        "id, title, verdict, risk_level, confidence, mode, input_type, tags, saved, created_at",
        count="exact",
    ).eq("user_id", user.id)

    if verdict:
        query = query.eq("verdict", verdict)
    if saved_only:
        query = query.eq("saved", True)
    if tag:
        query = query.contains("tags", [tag])
    if search:
        query = query.ilike("title", f"%{search}%")

    column, _, direction = sort.rpartition("_")
    column = column or "created_at"
    order_column = "confidence->overall" if column == "confidence" else column
    query = query.order(order_column, desc=(direction != "asc"))
    query = query.range(offset, offset + limit - 1)

    response = await run_in_threadpool(query.execute)
    return {"items": response.data, "total": response.count}
