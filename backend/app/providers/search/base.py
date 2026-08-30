from __future__ import annotations

from abc import ABC, abstractmethod

from app.models.schemas import ExtractedContent, SearchResult


class WebSearchProvider(ABC):
    name: str = "base"

    @abstractmethod
    def is_configured(self) -> bool: ...

    @abstractmethod
    def search(self, query: str, max_results: int = 8) -> list[SearchResult]: ...


class ContentFetcher(ABC):
    """Separate from WebSearchProvider because fetching/extracting a known URL's
    content is needed regardless of which (if any) search provider found it —
    including when the user submitted a URL directly."""

    @abstractmethod
    def get_page(self, url: str, timeout: float = 15.0) -> str: ...

    @abstractmethod
    def extract_content(self, url: str, timeout: float = 15.0) -> ExtractedContent: ...
