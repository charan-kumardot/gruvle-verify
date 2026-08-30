from __future__ import annotations

from abc import ABC, abstractmethod

from app.models.schemas import ImageAnalysis

VISION_PROMPT = (
    "You are analyzing an image submitted for verification (e.g. a product photo, "
    "screenshot, or listing image). Report ONLY what is visibly present. Do not guess "
    "brand authenticity or make definitive manipulation claims.\n\n"
    "Return ONLY JSON with this shape:\n"
    '{"visible_text": "all text visible in the image, verbatim", '
    '"detected_objects": ["..."], "detected_logos": ["..."], '
    '"manipulation_indicators": ["specific, hedged observations only, e.g. '
    '\'inconsistent shadow direction on the left edge\' — NEVER \'this is AI-generated\' '
    'or \'this is fake\' unless the evidence is unambiguous (e.g. visible watermark)"], '
    '"notes": "brief neutral notes"}'
)


class VisionProvider(ABC):
    name: str = "base"

    @abstractmethod
    def is_configured(self) -> bool: ...

    @abstractmethod
    def analyze_image(self, image_bytes: bytes, mime_type: str, prompt: str = VISION_PROMPT) -> ImageAnalysis: ...
