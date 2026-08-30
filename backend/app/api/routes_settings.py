from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from starlette.concurrency import run_in_threadpool

from app.db.client import get_service_client
from app.deps import CurrentUser, get_current_user

router = APIRouter(prefix="/api/settings", tags=["settings"])


class ProfileUpdate(BaseModel):
    verification_interests: list[str] | None = None
    usual_verification_method: str | None = None
    onboarding_completed: bool | None = None


def _client_or_503():
    client = get_service_client()
    if client is None:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Profile storage is not configured.")
    return client


@router.get("/profile")
async def get_profile(user: CurrentUser = Depends(get_current_user)):
    client = _client_or_503()
    query = client.table("profiles").select("*").eq("id", user.id).limit(1)
    response = await run_in_threadpool(query.execute)
    if response.data:
        return response.data[0]
    return {
        "id": user.id,
        "verification_interests": [],
        "usual_verification_method": None,
        "onboarding_completed": False,
    }


@router.put("/profile")
async def upsert_profile(update: ProfileUpdate, user: CurrentUser = Depends(get_current_user)):
    client = _client_or_503()
    payload = {k: v for k, v in update.model_dump(exclude_unset=True).items()}
    payload["id"] = user.id
    query = client.table("profiles").upsert(payload)
    response = await run_in_threadpool(query.execute)
    return response.data[0] if response.data else payload
