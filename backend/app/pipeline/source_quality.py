"""
Deterministic source-quality scoring. This module makes NO network or LLM calls —
it is pure, testable arithmetic over classification inputs, by design (see CLAUDE.md:
"Scoring/verdict logic lives in pure, deterministic, unit-testable functions").

Domain classification (which SourceType a URL falls into) is necessarily heuristic —
the web has no registry of "this domain is an official source for X" — but the score
formula built on top of that classification is fixed and explainable: every point
added or subtracted is recorded in `quality_factors` so a user can see exactly why a
source scored the way it did.
"""
from __future__ import annotations

from urllib.parse import urlparse

from app.models.schemas import SourceType

REGULATORY_TLD_SUFFIXES = (".gov", ".gov.uk", ".gov.in", ".europa.eu", ".int", ".mil")

REPUTABLE_PUBLICATIONS = {
    "reuters.com", "apnews.com", "bbc.com", "bbc.co.uk", "npr.org",
    "theguardian.com", "nytimes.com", "wsj.com", "bloomberg.com",
    "economist.com", "aljazeera.com", "afp.com", "pbs.org", "propublica.org",
}

TECHNICAL_DOC_DOMAINS = {
    "developer.mozilla.org", "docs.python.org", "w3.org", "ietf.org",
    "iso.org", "ieee.org",
}

FORUM_UGC_DOMAINS = {
    "reddit.com", "quora.com", "x.com", "twitter.com", "facebook.com",
    "instagram.com", "tiktok.com", "medium.com", "yahoo.com",
}

BASE_SCORES: dict[SourceType, int] = {
    SourceType.REGULATORY: 90,
    SourceType.PRIMARY: 85,
    SourceType.INDEPENDENT_PUBLICATION: 82,
    SourceType.TECHNICAL_DOC: 80,
    SourceType.OFFICIAL: 70,
    SourceType.COMMERCIAL: 50,
    SourceType.FORUM_UGC: 30,
    SourceType.UNKNOWN: 20,
}


def get_domain(url: str) -> str:
    netloc = urlparse(url).netloc.lower()
    return netloc[4:] if netloc.startswith("www.") else netloc


def classify_domain(domain: str, subject_domain: str | None = None) -> SourceType:
    d = domain.lower()
    if any(d.endswith(suffix) for suffix in REGULATORY_TLD_SUFFIXES):
        return SourceType.REGULATORY
    if d in REPUTABLE_PUBLICATIONS:
        return SourceType.INDEPENDENT_PUBLICATION
    if d in TECHNICAL_DOC_DOMAINS:
        return SourceType.TECHNICAL_DOC
    if d in FORUM_UGC_DOMAINS:
        return SourceType.FORUM_UGC
    if subject_domain and (d == subject_domain.lower() or d.endswith("." + subject_domain.lower())):
        return SourceType.OFFICIAL
    return SourceType.UNKNOWN


def score_source(
    source_type: SourceType,
    has_author: bool,
    independent: bool,
    is_https: bool = True,
) -> tuple[int, dict[str, str]]:
    """Returns (0-100 score, human-readable factor breakdown)."""
    score = BASE_SCORES[source_type]
    factors: dict[str, str] = {"source_type": f"{source_type.value} (base {score})"}

    if has_author:
        score += 5
        factors["authorship"] = "Identifiable author or byline (+5)"
    else:
        score -= 5
        factors["authorship"] = "No identifiable author (-5)"

    if independent:
        score += 8
        factors["independence"] = "Independent of the subject being verified (+8)"
    else:
        score -= 15
        factors["independence"] = "Same entity as the subject being verified — potential conflict of interest (-15)"

    if not is_https:
        score -= 10
        factors["transport_security"] = "Not served over HTTPS (-10)"

    score = max(0, min(100, score))
    factors["final_score"] = str(score)
    return score, factors
