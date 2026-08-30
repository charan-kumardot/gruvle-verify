from __future__ import annotations

import httpx

from .base import AIProvider

GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"


class GeminiProvider(AIProvider):
    """Primary provider. Free tier via Google AI Studio. Also implements VisionProvider
    duties (see providers/vision/gemini_vision.py) since Gemini is natively multimodal."""

    name = "gemini"
    tier = "strong"

    def __init__(self, api_key: str | None, model: str = "gemini-3.6-flash", timeout: float = 30.0):
        self.api_key = api_key
        self.model = model
        self.timeout = timeout

    def is_configured(self) -> bool:
        return bool(self.api_key)

    def generate(self, prompt: str, system: str | None = None) -> str:
        if not self.is_configured():
            raise RuntimeError("GeminiProvider is not configured (missing GEMINI_API_KEY)")

        contents = [{"role": "user", "parts": [{"text": prompt}]}]
        payload: dict = {
            "contents": contents,
            # Disable extended "thinking": our prompts ask for short, structured
            # output (classification/JSON), and thinking models can otherwise burn
            # the entire output token budget on internal reasoning and return an
            # empty visible answer (finishReason MAX_TOKENS with no text parts).
            "generationConfig": {
                "maxOutputTokens": 4096,
                "thinkingConfig": {"thinkingBudget": 0},
            },
        }
        if system:
            payload["systemInstruction"] = {"parts": [{"text": system}]}

        url = GEMINI_ENDPOINT.format(model=self.model)
        resp = httpx.post(
            url,
            params={"key": self.api_key},
            json=payload,
            timeout=self.timeout,
        )
        resp.raise_for_status()
        data = resp.json()
        try:
            candidates = data["candidates"]
            parts = candidates[0]["content"]["parts"]
            text = "".join(p.get("text", "") for p in parts if not p.get("thought"))
        except (KeyError, IndexError) as exc:
            raise RuntimeError(f"Unexpected Gemini response shape: {data}") from exc
        if not text.strip():
            raise RuntimeError(f"Gemini returned no usable text (finishReason={candidates[0].get('finishReason')})")
        return text
