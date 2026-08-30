from __future__ import annotations

from abc import ABC, abstractmethod


class TranscriptionProvider(ABC):
    name: str = "base"

    @abstractmethod
    def is_configured(self) -> bool: ...

    @abstractmethod
    def transcribe(self, audio_bytes: bytes, filename: str, content_type: str) -> str: ...
