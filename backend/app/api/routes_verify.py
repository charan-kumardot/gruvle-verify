from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile, status
from starlette.concurrency import run_in_threadpool

from app.config import Settings, get_settings
from app.db.client import get_service_client
from app.deps import CurrentUser, get_optional_user
from app.models.schemas import VerificationMode, VerificationResult
from app.pipeline.input_resolution import resolve_files, resolve_text, resolve_url
from app.pipeline.orchestrator import run_verification

router = APIRouter(prefix="/api/verify", tags=["verify"])


def _persist(result: VerificationResult) -> None:
    client = get_service_client()
    if client is None or not result.user_id:
        return
    row = result.model_dump(mode="json")
    row["confidence"] = row["confidence"]
    try:
        client.table("verifications").insert({
            "id": row["id"],
            "user_id": row["user_id"],
            "input_type": row["input_type"],
            "input_raw": row["input_raw"],
            "user_question": row["user_question"],
            "mode": row["mode"],
            "title": row["title"],
            "verdict": row["verdict"],
            "risk_level": row["risk_level"],
            "confidence": row["confidence"],
            "summary": row["summary"],
            "claims": row["claims"],
            "evidence": row["evidence"],
            "sources": row["sources"],
            "contradictions": row["contradictions"],
            "open_questions": row["open_questions"],
            "next_actions": row["next_actions"],
            "degraded_providers": row["degraded_providers"],
            "tags": row["tags"],
            "notes": row["notes"],
            "saved": row["saved"],
        }).execute()
    except Exception:  # noqa: BLE001
        # Persistence failure must not fail the verification response — the user
        # still gets their report, just not saved to history.
        pass


@router.post("", response_model=VerificationResult)
async def verify(
    mode: str = Form("QUICK_CHECK"),
    text: str | None = Form(None),
    url: str | None = Form(None),
    question: str | None = Form(None),
    files: list[UploadFile] | None = None,
    user: CurrentUser | None = Depends(get_optional_user),
    settings: Settings = Depends(get_settings),
):
    try:
        verification_mode = VerificationMode(mode)
    except ValueError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Unknown verification mode: {mode}")

    uploaded = []
    if files:
        for f in files:
            data = await f.read()
            if data:
                uploaded.append((f.filename or "upload", f.content_type or "", data))

    if not (uploaded or url or text):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Provide one of: text, url, or files.")

    def _run_pipeline() -> VerificationResult:
        # Every step here — page fetch, OCR, search, AI calls — is a blocking call.
        # A verification can take 15-90+ seconds; running this inline in the async
        # route would freeze uvicorn's single event loop for that whole span, so
        # even unrelated concurrent requests (another tab, the app shell's own
        # status check) would hang. run_in_threadpool below hands the entire
        # sequence to a worker thread instead.
        if uploaded:
            resolved = resolve_files(uploaded, settings)
        elif url:
            resolved = resolve_url(url, settings)
        else:
            resolved = resolve_text(text)

        if not resolved.text_for_analysis.strip():
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                "No analyzable content could be extracted from the submission.",
            )

        verification_id = str(uuid.uuid4())
        result = run_verification(
            settings=settings,
            verification_id=verification_id,
            input_type=resolved.input_type,
            input_raw=url or text or (uploaded[0][0] if uploaded else ""),
            text_for_analysis=resolved.text_for_analysis,
            mode=verification_mode,
            user_question=question,
            subject_url=resolved.subject_url,
            primary_content=resolved.primary_content,
            user_id=user.id if user else None,
        )
        result.image_analysis = resolved.image_analysis

        if user:
            _persist(result)

        return result

    return await run_in_threadpool(_run_pipeline)


@router.get("/{verification_id}", response_model=VerificationResult)
async def get_verification(verification_id: str, user: CurrentUser = Depends(get_optional_user)):
    client = get_service_client()
    if client is None:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "History storage is not configured.")
    query = client.table("verifications").select("*").eq("id", verification_id)
    if user:
        query = query.eq("user_id", user.id)
    response = await run_in_threadpool(query.limit(1).execute)
    if not response.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Verification not found.")
    return response.data[0]
