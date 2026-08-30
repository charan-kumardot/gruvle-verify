"""
Turns search results / a primary fetched page into Source + Evidence objects.
Excerpts are always a verbatim substring of content actually retrieved — either the
extracted page text (preferred) or, failing that, the search engine's own snippet for
that URL. Never a paraphrase presented as a quote (see CLAUDE.md rule 6).
"""
from __future__ import annotations

import re
from itertools import count

from app.models.schemas import Evidence, EvidenceRelationship, ExtractedContent, Source
from app.pipeline.source_quality import classify_domain, get_domain, score_source
from app.providers.search.router import SearchRouter

_WORD_RE = re.compile(r"[a-zA-Z0-9]{3,}")
_SENTENCE_RE = re.compile(r"(?<=[.!?])\s+")


class EvidenceIdGenerator:
    """One counter shared across an entire verification run so evidence IDs
    (EVIDENCE-001, EVIDENCE-002, ...) are unique across all claims, not just within one."""

    def __init__(self):
        self._counter = count(1)

    def next(self) -> str:
        return f"EVIDENCE-{next(self._counter):03d}"


def _best_excerpt(claim_text: str, content: str, fallback: str, window_chars: int = 320) -> str:
    if not content:
        return fallback[:window_chars] if fallback else ""

    claim_words = {w.lower() for w in _WORD_RE.findall(claim_text)}
    if not claim_words:
        return content[:window_chars]

    sentences = _SENTENCE_RE.split(content)
    best_sentence, best_score = "", 0
    for sentence in sentences:
        sentence_words = {w.lower() for w in _WORD_RE.findall(sentence)}
        overlap = len(claim_words & sentence_words)
        if overlap > best_score:
            best_score, best_sentence = overlap, sentence

    if best_score == 0:
        return fallback[:window_chars] if fallback else content[:window_chars]
    return best_sentence.strip()[:window_chars]


def source_from_content(
    source_id: str,
    url: str,
    content: ExtractedContent,
    subject_domain: str | None,
) -> Source:
    domain = get_domain(url)
    source_type = classify_domain(domain, subject_domain=subject_domain)
    is_independent = source_type not in ("official",) and domain != (subject_domain or "").lower()
    quality_score, quality_factors = score_source(
        source_type=source_type,
        has_author=bool(content.author),
        independent=is_independent,
        is_https=url.lower().startswith("https://"),
    )
    return Source(
        id=source_id,
        url=url,
        domain=domain,
        title=content.title,
        source_type=source_type,
        author=content.author,
        published_at=content.published_at,
        quality_score=quality_score,
        quality_factors=quality_factors,
        independent=is_independent,
    )


def collect_evidence_for_claim(
    claim_id: str,
    claim_text: str,
    queries: list[str],
    search_router: SearchRouter,
    evidence_ids: EvidenceIdGenerator,
    subject_domain: str | None = None,
    primary_content: tuple[str, ExtractedContent] | None = None,
    max_sources: int = 5,
) -> tuple[list[Source], list[Evidence], bool]:
    """Returns (sources, evidence, search_degraded)."""
    sources: list[Source] = []
    evidence: list[Evidence] = []
    seen_domains: set[str] = set()
    search_degraded = False

    if primary_content is not None:
        url, content = primary_content
        if content.text and not content.fetch_error:
            source_id = f"SOURCE-{get_domain(url)}-primary"
            source = source_from_content(source_id, url, content, subject_domain)
            sources.append(source)
            seen_domains.add(source.domain)
            evidence.append(Evidence(
                id=evidence_ids.next(),
                claim_id=claim_id,
                source_id=source.id,
                excerpt=_best_excerpt(claim_text, content.text, content.text),
                relationship=EvidenceRelationship.CONTEXT,
                why_it_matters="This is the page/content directly submitted for verification.",
            ))

    for query in queries:
        if len(sources) >= max_sources:
            break
        results, provider_used, degraded = search_router.search(query, max_results=max_sources)
        search_degraded = search_degraded or degraded or provider_used is None
        for result in results:
            if len(sources) >= max_sources:
                break
            domain = get_domain(result.url)
            if domain in seen_domains:
                continue
            content = search_router.extract_content(result.url)
            if content.fetch_error or not content.text:
                excerpt_source_text, fallback = "", result.snippet
                if not fallback:
                    continue
            else:
                excerpt_source_text, fallback = content.text, result.snippet

            source_id = f"SOURCE-{domain}-{len(sources) + 1}"
            source = source_from_content(source_id, result.url, content if not content.fetch_error else ExtractedContent(url=result.url, title=result.title), subject_domain)
            sources.append(source)
            seen_domains.add(domain)
            evidence.append(Evidence(
                id=evidence_ids.next(),
                claim_id=claim_id,
                source_id=source.id,
                excerpt=_best_excerpt(claim_text, excerpt_source_text, fallback),
                relationship=EvidenceRelationship.CONTEXT,
                why_it_matters=f"Found via search query: \"{query}\"",
            ))

    return sources, evidence, search_degraded
