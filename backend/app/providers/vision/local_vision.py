from __future__ import annotations

from app.models.schemas import ImageAnalysis
from app.providers.ocr.tesseract_ocr import TesseractOCR
from .base import VisionProvider


class LocalVisionProvider(VisionProvider):
    """Guaranteed fallback when no vision-capable LLM is configured: OCR only.
    Cannot detect objects/logos/manipulation — says so explicitly rather than
    guessing, per the no-fabrication rule."""

    name = "local_vision_ocr_only"

    def __init__(self):
        self.ocr = TesseractOCR()

    def is_configured(self) -> bool:
        return True

    def analyze_image(self, image_bytes: bytes, mime_type: str, prompt: str = "") -> ImageAnalysis:
        text, ocr_available = self.ocr.extract_from_image_bytes(image_bytes)
        notes = (
            "No vision-capable AI provider configured — this analysis is OCR text "
            "extraction only. Object/logo detection and manipulation indicators are "
            "unavailable in this mode."
            if ocr_available
            else "No vision-capable AI provider configured and OCR is unavailable in "
            "this environment — no image content could be analyzed."
        )
        return ImageAnalysis(visible_text=text, notes=notes, provider_used=self.name)
