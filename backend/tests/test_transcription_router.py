import pytest

from app.config import Settings
from app.providers.transcription.groq_whisper import GroqWhisperProvider
from app.providers.transcription.router import TranscriptionRouter


def test_not_available_when_unconfigured():
    router = TranscriptionRouter(Settings(groq_api_key=None))
    assert router.is_available() is False


def test_available_when_groq_key_present():
    router = TranscriptionRouter(Settings(groq_api_key="fake-key"))
    assert router.is_available() is True


def test_transcribe_raises_when_provider_fails(monkeypatch):
    def boom(self, audio_bytes, filename, content_type):
        raise RuntimeError("network unavailable")

    monkeypatch.setattr(GroqWhisperProvider, "transcribe", boom)
    router = TranscriptionRouter(Settings(groq_api_key="fake-key"))
    with pytest.raises(RuntimeError, match="No transcription provider available"):
        router.transcribe(b"fake-audio", "clip.webm", "audio/webm")
