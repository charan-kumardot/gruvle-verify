from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from pydantic import BaseModel
from starlette.concurrency import run_in_threadpool

from app.db.client import get_service_client
from app.deps import CurrentUser, get_current_user
from app.models.schemas import VerificationResult
from app.pipeline.pdf_export import build_pdf

router = APIRouter(prefix="/api/reports", tags=["reports"])


class ReportUpdate(BaseModel):
    title: str | None = None
    notes: str | None = None
    tags: list[str] | None = None
    saved: bool | None = None


def _client_or_503():
    client = get_service_client()
    if client is None:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Report storage is not configured.")
    return client


@router.patch("/{verification_id}")
async def update_report(
    verification_id: str,
    update: ReportUpdate,
    user: CurrentUser = Depends(get_current_user),
):
    client = _client_or_503()
    payload = {k: v for k, v in update.model_dump(exclude_unset=True).items()}
    if not payload:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No fields to update.")

    query = (
        client.table("verifications")
        .update(payload)
        .eq("id", verification_id)
        .eq("user_id", user.id)
    )
    response = await run_in_threadpool(query.execute)
    if not response.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Verification not found.")
    return response.data[0]


@router.delete("/{verification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_report(verification_id: str, user: CurrentUser = Depends(get_current_user)):
    client = _client_or_503()
    query = client.table("verifications").delete().eq("id", verification_id).eq("user_id", user.id)
    await run_in_threadpool(query.execute)


@router.get("/{verification_id}/export.pdf")
async def export_report_pdf(verification_id: str, user: CurrentUser = Depends(get_current_user)):
    client = _client_or_503()
    query = client.table("verifications").select("*").eq("id", verification_id).eq("user_id", user.id).limit(1)
    response = await run_in_threadpool(query.execute)
    if not response.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Verification not found.")

    result = VerificationResult.model_validate(response.data[0])
    pdf_bytes = await run_in_threadpool(build_pdf, result)

    filename = "".join(c if c.isalnum() or c in " -_" else "" for c in result.title)[:60].strip() or "gruvle-verify-report"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}.pdf"'},
    )
