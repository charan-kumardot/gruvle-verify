from __future__ import annotations

import httpx

from .base import AIProvider


class OpenAICompatibleProvider(AIProvider):
    """Base for any provider that speaks the OpenAI chat-completions wire format:
    Groq, OpenRouter, Ollama (via its OpenAI-compatible endpoint), and any future
    OpenAI-compatible free/local endpoint. Subclasses just set base_url/name/tier."""

    def __init__(
        self,
        api_key: str | None,
        base_url: str,
        model: str,
        timeout: float = 30.0,
        requires_key: bool = True,
    ):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.timeout = timeout
        self.requires_key = requires_key

    def is_configured(self) -> bool:
        return bool(self.api_key) or not self.requires_key

    def generate(self, prompt: str, system: str | None = None) -> str:
        if not self.is_configured():
            raise RuntimeError(f"{self.name} is not configured (missing API key)")

        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        resp = httpx.post(
            f"{self.base_url}/chat/completions",
            headers=headers,
            json={"model": self.model, "messages": messages, "temperature": 0.2},
            timeout=self.timeout,
        )
        resp.raise_for_status()
        data = resp.json()
        try:
            return data["choices"][0]["message"]["content"]
        except (KeyError, IndexError) as exc:
            raise RuntimeError(f"Unexpected {self.name} response shape: {data}") from exc


class GroqProvider(OpenAICompatibleProvider):
    """Cheap/fast tier: classification, extraction, dedup, routing decisions."""

    name = "groq"
    tier = "cheap"

    def __init__(self, api_key: str | None, model: str = "openai/gpt-oss-20b"):
        super().__init__(api_key, "https://api.groq.com/openai/v1", model, requires_key=True)


class OpenRouterProvider(OpenAICompatibleProvider):
    """Fallback strong-tier provider; also useful for model diversity on reasoning.
    OpenRouter's free-tier models are rate-limited (~50 req/day per key without
    credits) — this is a fallback tier, not a primary, precisely because of that."""

    name = "openrouter"
    tier = "strong"

    def __init__(self, api_key: str | None, model: str = "google/gemma-4-31b-it:free"):
        super().__init__(api_key, "https://openrouter.ai/api/v1", model, requires_key=True)


class OllamaProvider(OpenAICompatibleProvider):
    """Fully local/offline provider. No key required, but the daemon must be running
    at base_url — if it isn't, is_configured() still returns True (no key needed) and
    the router will catch the connection error and fall through to the next provider."""

    name = "ollama"
    tier = "local"

    def __init__(self, base_url: str = "http://localhost:11434/v1", model: str = "qwen3:4b"):
        super().__init__(None, base_url, model, timeout=60.0, requires_key=False)

    def is_configured(self) -> bool:
        # Local daemon presence can't be verified without a network call; the router
        # treats this as "attempt, fall through on failure" rather than "configured".
        try:
            resp = httpx.get(self.base_url.replace("/v1", "") + "/api/tags", timeout=1.5)
            return resp.status_code == 200
        except httpx.HTTPError:
            return False
