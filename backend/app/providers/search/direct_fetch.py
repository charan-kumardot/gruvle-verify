from __future__ import annotations

import logging
from datetime import datetime

import httpx
from bs4 import BeautifulSoup

from app.models.schemas import ExtractedContent
from .base import ContentFetcher

logger = logging.getLogger("gruvle.fetch")

USER_AGENT = "GruvleVerifyBot/0.1 (+https://gruvle.example; evidence-collection research bot)"

_DATE_META_KEYS = [
    ("meta", {"property": "article:published_time"}),
    ("meta", {"name": "publish-date"}),
    ("meta", {"name": "date"}),
    ("meta", {"property": "og:updated_time"}),
]


class DirectFetchContentFetcher(ContentFetcher):
    """Always available — no API key. This is also the mechanism used when the
    user submits a URL directly rather than a claim requiring search."""

    name = "direct_fetch"

    def get_page(self, url: str, timeout: float = 15.0) -> str:
        resp = httpx.get(
            url,
            headers={"User-Agent": USER_AGENT},
            timeout=timeout,
            follow_redirects=True,
        )
        resp.raise_for_status()
        return resp.text

    def extract_content(self, url: str, timeout: float = 15.0) -> ExtractedContent:
        try:
            html = self.get_page(url, timeout=timeout)
        except httpx.HTTPError as exc:
            return ExtractedContent(url=url, fetch_error=str(exc))

        soup = BeautifulSoup(html, "lxml")
        for tag in soup(["script", "style", "nav", "footer", "noscript", "svg"]):
            tag.decompose()

        title = soup.title.string.strip() if soup.title and soup.title.string else ""

        published_at = None
        for tag_name, attrs in _DATE_META_KEYS:
            tag = soup.find(tag_name, attrs=attrs)
            if tag and tag.get("content"):
                try:
                    published_at = datetime.fromisoformat(tag["content"].replace("Z", "+00:00"))
                    break
                except ValueError:
                    continue

        author = None
        author_tag = soup.find("meta", attrs={"name": "author"})
        if author_tag and author_tag.get("content"):
            author = author_tag["content"]

        main = soup.find("main") or soup.find("article") or soup.body or soup
        text = " ".join(main.get_text(separator=" ").split())

        return ExtractedContent(
            url=url,
            title=title,
            text=text[:20000],
            published_at=published_at,
            author=author,
        )
