from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from starlette.concurrency import run_in_threadpool

from app.config import Settings, get_settings
from app.providers.transcription.router import TranscriptionRouter

router = APIRouter(prefix="/api/transcribe", tags=["transcribe"])

MAX_AUDIO_BYTES = 15 * 1024 * 1024  # 15MB — a few minutes of compressed speech audio


@router.post("")
async def transcribe(file: UploadFile, settings: Settings = Depends(get_settings)):
    transcription_router = TranscriptionRouter(settings)
    if not transcription_router.is_available():
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "Voice input is unavailable: no transcription provider is configured on the server.",
        )

    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No audio received.")
    if len(audio_bytes) > MAX_AUDIO_BYTES:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "Audio recording is too large.")

    try:
        text = await run_in_threadpool(
            transcription_router.transcribe, audio_bytes, file.filename or "audio.webm", file.content_type or "audio/webm"
        )
    except RuntimeError as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, str(exc)) from exc

    return {"text": text}
