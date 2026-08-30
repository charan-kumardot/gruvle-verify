"""
Best-effort, keyless search fallback for when SearXNG isn't deployed yet (e.g. local
dev, or a deployment that hasn't stood up the container). Scrapes DuckDuckGo's HTML
lite endpoint, which has no official API contract — this is intentionally the LAST
resort in the search chain, not the primary path. Production deployments should run
SearXNG (see docs/searxng.md); this exists so the app isn't dead in the water before
that's set up.
"""
from __future__ import annotations

import httpx
from bs4 import BeautifulSoup

from app.models.schemas import SearchResult
from .base import WebSearchProvider

USER_AGENT = "Mozilla/5.0 (compatible; GruvleVerifyBot/0.1)"


class DuckDuckGoLiteProvider(WebSearchProvider):
    name = "duckduckgo_lite"

    def __init__(self, timeout: float = 10.0):
        self.timeout = timeout

    def is_configured(self) -> bool:
        return True

    def search(self, query: str, max_results: int = 8) -> list[SearchResult]:
        resp = httpx.post(
            "https://html.duckduckgo.com/html/",
            data={"q": query},
            headers={"User-Agent": USER_AGENT},
            timeout=self.timeout,
        )
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "lxml")
        results = []
        for result in soup.select(".result")[:max_results]:
            link = result.select_one(".result__a")
            snippet = result.select_one(".result__snippet")
            if not link or not link.get("href"):
                continue
            results.append(SearchResult(
                title=link.get_text(strip=True),
                url=link["href"],
                snippet=snippet.get_text(strip=True) if snippet else "",
                engine="duckduckgo_lite",
            ))
        return results
