from __future__ import annotations

import logging

from app.config import Settings
from app.models.schemas import ExtractedContent, SearchResult
from .direct_fetch import DirectFetchContentFetcher
from .duckduckgo_provider import DuckDuckGoLiteProvider
from .searxng_provider import SearXNGProvider

logger = logging.getLogger("gruvle.search_router")


class SearchRouter:
    def __init__(self, settings: Settings):
        self.chain = [SearXNGProvider(settings.searxng_base_url), DuckDuckGoLiteProvider()]
        self.fetcher = DirectFetchContentFetcher()

    def search(self, query: str, max_results: int = 8) -> tuple[list[SearchResult], str | None, bool]:
        for i, provider in enumerate(self.chain):
            if not provider.is_configured():
                continue
            try:
                results = provider.search(query, max_results=max_results)
                if results:
                    return results, provider.name, i > 0
            except Exception as exc:  # noqa: BLE001
                logger.warning("search provider %s failed: %s", provider.name, exc)
                continue
        return [], None, True

    def extract_content(self, url: str) -> ExtractedContent:
        return self.fetcher.extract_content(url)
