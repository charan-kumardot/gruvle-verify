"""
Groq's free tier exposes OpenAI's Whisper models (whisper-large-v3-turbo) over an
OpenAI-compatible /audio/transcriptions endpoint. Chosen over puter.js (the other
candidate considered — see current_status.md) because it reuses a provider we
already depend on and have validated live, rather than adding a third-party
client-side script whose reliability/terms we don't control. Chosen over a local
Whisper model because Render's free-tier instance doesn't have the CPU/RAM budget
to run one at usable latency.
"""
from __future__ import annotations

import httpx

from .base import TranscriptionProvider


class GroqWhisperProvider(TranscriptionProvider):
    name = "groq_whisper"

    def __init__(self, api_key: str | None, model: str = "whisper-large-v3-turbo", timeout: float = 30.0):
        self.api_key = api_key
        self.model = model
        self.timeout = timeout

    def is_configured(self) -> bool:
        return bool(self.api_key)

    def transcribe(self, audio_bytes: bytes, filename: str, content_type: str) -> str:
        if not self.is_configured():
            raise RuntimeError("GroqWhisperProvider is not configured (missing GROQ_API_KEY)")

        resp = httpx.post(
            "https://api.groq.com/openai/v1/audio/transcriptions",
            headers={"Authorization": f"Bearer {self.api_key}"},
            files={"file": (filename or "audio.webm", audio_bytes, content_type or "audio/webm")},
            data={"model": self.model, "response_format": "json"},
            timeout=self.timeout,
        )
        resp.raise_for_status()
        data = resp.json()
        text = data.get("text", "")
        if not text.strip():
            raise RuntimeError("Transcription returned no text")
        return text.strip()
