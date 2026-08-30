"""
ModelRouter: picks an AIProvider by task, tries it, and falls back down the chain on
failure or misconfiguration. Call sites never import a specific provider — they ask
the router for a task-appropriate one. This is what makes "the app keeps working if
one AI provider fails" true rather than aspirational.

Task -> preferred tier:
  - classification / extraction / dedup / routing  -> cheap first (fast, high volume)
  - reasoning / contradiction synthesis / final report -> strong first (quality matters)
  - anything -> local heuristic tier is the guaranteed last resort
"""
from __future__ import annotations

import logging

from app.config import Settings
from .base import AIProvider
from .gemini_provider import GeminiProvider
from .local_provider import LocalProvider
from .openai_compatible import GroqProvider, OllamaProvider, OpenRouterProvider

logger = logging.getLogger("gruvle.ai_router")

CHEAP_TASKS = {"classify", "extract_claims", "dedup", "summarize"}
STRONG_TASKS = {"reason", "final_report", "contradiction_synthesis"}


class ModelRouter:
    def __init__(self, settings: Settings):
        gemini = GeminiProvider(settings.gemini_api_key)
        groq = GroqProvider(settings.groq_api_key)
        openrouter = OpenRouterProvider(settings.openrouter_api_key)
        ollama_fast = OllamaProvider(model="qwen3:4b")
        ollama_strong = OllamaProvider(model="qwen3:8b")
        local = LocalProvider()

        self.cheap_chain: list[AIProvider] = [groq, gemini, openrouter, ollama_fast, local]
        self.strong_chain: list[AIProvider] = [gemini, openrouter, groq, ollama_strong, local]
        self.last_used: str | None = None

    def _chain_for(self, task: str) -> list[AIProvider]:
        return self.cheap_chain if task in CHEAP_TASKS else self.strong_chain

    def configured_providers(self) -> list[str]:
        seen, out = set(), []
        for p in self.cheap_chain + self.strong_chain:
            if p.name not in seen and p.is_configured():
                seen.add(p.name)
                out.append(p.name)
        return out

    def run(self, task: str, method: str, *args, **kwargs):
        """task: one of CHEAP_TASKS/STRONG_TASKS (routing hint).
        method: the AIProvider method name to call (classify/extract_claims/reason/summarize).
        Returns (result, provider_name_used, degraded: bool)."""
        chain = self._chain_for(task)
        errors = []
        for i, provider in enumerate(chain):
            if not provider.is_configured():
                continue
            try:
                result = getattr(provider, method)(*args, **kwargs)
                self.last_used = provider.name
                degraded = i > 0 or provider.tier == "local"
                return result, provider.name, degraded
            except NotImplementedError:
                continue
            except Exception as exc:  # noqa: BLE001 — any provider failure must fall through
                logger.warning("provider %s failed for %s.%s: %s", provider.name, task, method, exc)
                errors.append(f"{provider.name}: {exc}")
                continue
        raise RuntimeError(
            f"All AI providers failed or unconfigured for task={task} method={method}. "
            f"Errors: {'; '.join(errors) if errors else 'none configured'}"
        )
