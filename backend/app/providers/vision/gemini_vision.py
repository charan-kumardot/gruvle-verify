from __future__ import annotations

import base64

import httpx

from app.models.schemas import ImageAnalysis
from app.providers.ai.base import extract_json
from .base import VISION_PROMPT, VisionProvider

GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"


class GeminiVisionProvider(VisionProvider):
    name = "gemini_vision"

    def __init__(self, api_key: str | None, model: str = "gemini-3.6-flash", timeout: float = 45.0):
        self.api_key = api_key
        self.model = model
        self.timeout = timeout

    def is_configured(self) -> bool:
        return bool(self.api_key)

    def analyze_image(self, image_bytes: bytes, mime_type: str, prompt: str = VISION_PROMPT) -> ImageAnalysis:
        if not self.is_configured():
            raise RuntimeError("GeminiVisionProvider is not configured (missing GEMINI_API_KEY)")

        b64 = base64.b64encode(image_bytes).decode("ascii")
        payload = {
            "contents": [{
                "role": "user",
                "parts": [
                    {"text": prompt},
                    {"inline_data": {"mime_type": mime_type, "data": b64}},
                ],
            }]
        }
        url = GEMINI_ENDPOINT.format(model=self.model)
        resp = httpx.post(url, params={"key": self.api_key}, json=payload, timeout=self.timeout)
        resp.raise_for_status()
        data = resp.json()
        text = "".join(p.get("text", "") for p in data["candidates"][0]["content"]["parts"])
        try:
            parsed = extract_json(text)
        except ValueError:
            return ImageAnalysis(notes=text[:500], provider_used=self.name)
        return ImageAnalysis(
            visible_text=parsed.get("visible_text", ""),
            detected_objects=parsed.get("detected_objects", []) or [],
            detected_logos=parsed.get("detected_logos", []) or [],
            manipulation_indicators=parsed.get("manipulation_indicators", []) or [],
            notes=parsed.get("notes", ""),
            provider_used=self.name,
        )
