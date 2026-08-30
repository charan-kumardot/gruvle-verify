from __future__ import annotations

import logging

from app.config import Settings

from .groq_whisper import GroqWhisperProvider

logger = logging.getLogger("gruvle.transcription_router")


class TranscriptionRouter:
    """Single provider today, but kept as a router (not a direct call) so a local
    Whisper fallback can be dropped in later without touching call sites — same
    pattern as ai/router.py and vision/router.py."""

    def __init__(self, settings: Settings):
        self.chain = [GroqWhisperProvider(settings.groq_api_key)]

    def is_available(self) -> bool:
        return any(p.is_configured() for p in self.chain)

    def transcribe(self, audio_bytes: bytes, filename: str, content_type: str) -> str:
        errors = []
        for provider in self.chain:
            if not provider.is_configured():
                continue
            try:
                return provider.transcribe(audio_bytes, filename, content_type)
            except Exception as exc:  # noqa: BLE001
                logger.warning("transcription provider %s failed: %s", provider.name, exc)
                errors.append(f"{provider.name}: {exc}")
        raise RuntimeError(
            f"No transcription provider available. Errors: {'; '.join(errors) if errors else 'none configured'}"
        )
