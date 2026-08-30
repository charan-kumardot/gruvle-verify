"""
SearXNG is the recommended primary WebSearchProvider: self-hosted, free, no API key,
aggregates multiple upstream engines. See /docs/searxng.md for a one-command Docker
setup. If SEARXNG_BASE_URL is unset or unreachable, the router falls through to
duckduckgo_provider.py — see search/router.py.
"""
from __future__ import annotations

import httpx

from app.models.schemas import SearchResult
from .base import WebSearchProvider


class SearXNGProvider(WebSearchProvider):
    name = "searxng"

    def __init__(self, base_url: str | None, timeout: float = 40.0):
        # Generous on purpose: a free-tier host (e.g. Render) spins this service
        # down after ~15 minutes idle, and waking it back up can itself take
        # 20-30s. A short timeout here doesn't make anything faster — it just
        # converts a slow-but-real search into a silent "insufficient evidence"
        # report. See current_status.md for the cold-start mitigation options.
        self.base_url = base_url.rstrip("/") if base_url else None
        self.timeout = timeout

    def is_configured(self) -> bool:
        return bool(self.base_url)

    def search(self, query: str, max_results: int = 8) -> list[SearchResult]:
        if not self.is_configured():
            raise RuntimeError("SearXNGProvider is not configured (missing SEARXNG_BASE_URL)")

        resp = httpx.get(
            f"{self.base_url}/search",
            params={"q": query, "format": "json"},
            timeout=self.timeout,
        )
        resp.raise_for_status()
        data = resp.json()
        results = []
        for item in data.get("results", [])[:max_results]:
            results.append(SearchResult(
                title=item.get("title", ""),
                url=item.get("url", ""),
                snippet=item.get("content", ""),
                engine=item.get("engine"),
            ))
        return results
