from __future__ import annotations

import logging

from app.config import Settings
from app.models.schemas import ImageAnalysis
from .gemini_vision import GeminiVisionProvider
from .local_vision import LocalVisionProvider

logger = logging.getLogger("gruvle.vision_router")


class VisionRouter:
    def __init__(self, settings: Settings):
        self.chain = [GeminiVisionProvider(settings.gemini_api_key), LocalVisionProvider()]

    def analyze(self, image_bytes: bytes, mime_type: str) -> tuple[ImageAnalysis, bool]:
        for i, provider in enumerate(self.chain):
            if not provider.is_configured():
                continue
            try:
                return provider.analyze_image(image_bytes, mime_type), i > 0
            except Exception as exc:  # noqa: BLE001
                logger.warning("vision provider %s failed: %s", provider.name, exc)
                continue
        return ImageAnalysis(notes="No vision provider could process this image."), True
