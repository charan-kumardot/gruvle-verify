"""
The verdict is a deterministic function of evidence-quality signals — never a direct
readout of what an LLM "feels". An AIProvider.reason() call decides each claim's
*status* (SUPPORTED/CONTRADICTED/etc, grounded in cited evidence IDs); this module
turns statuses + source quality + independence + contradictions into a numeric
per-claim confidence and an overall Verdict. No network/LLM calls happen here —
that separation is what makes this file unit-testable in isolation (see
backend/tests/test_verdict_engine.py).
"""
from __future__ import annotations

from collections import Counter

from app.models.schemas import Claim, ClaimStatus, Evidence, Source, Verdict


def score_claim(
    claim: Claim,
    evidence_for: list[Evidence],
    evidence_against: list[Evidence],
    sources: dict[str, Source],
) -> int:
    """0-100 confidence for a single claim's status."""
    if not evidence_for and not evidence_against:
        return 0

    for_scores = [sources[e.source_id].quality_score for e in evidence_for if e.source_id in sources]
    against_scores = [sources[e.source_id].quality_score for e in evidence_against if e.source_id in sources]
    avg_for = sum(for_scores) / len(for_scores) if for_scores else 0
    avg_against = sum(against_scores) / len(against_scores) if against_scores else 0

    independent_domains_for = {
        sources[e.source_id].domain
        for e in evidence_for
        if e.source_id in sources and sources[e.source_id].independent
    }
    corroboration_bonus = min(len(independent_domains_for), 5) * 4  # up to +20

    score = avg_for - (avg_against * 0.7) + corroboration_bonus

    if claim.status == ClaimStatus.CONTRADICTED:
        score = min(score, 40)
    elif claim.status in (ClaimStatus.INSUFFICIENT_EVIDENCE, ClaimStatus.UNVERIFIED):
        score = min(score, 30)
    elif claim.status == ClaimStatus.PARTIALLY_SUPPORTED:
        score = min(score, 70)
    elif claim.status == ClaimStatus.MISLEADING:
        score = min(score, 50)

    return max(0, min(100, round(score)))


def compute_overall_verdict(claims: list[Claim], total_contradictions: int) -> tuple[Verdict, int]:
    """Returns (Verdict, average per-claim confidence 0-100)."""
    if not claims:
        return Verdict.INSUFFICIENT_EVIDENCE, 0

    status_counts = Counter(c.status for c in claims)
    n = len(claims)
    avg_confidence = round(sum(c.confidence for c in claims) / n)

    contradicted_ratio = status_counts[ClaimStatus.CONTRADICTED] / n
    insufficient_ratio = (
        status_counts[ClaimStatus.INSUFFICIENT_EVIDENCE] + status_counts[ClaimStatus.UNVERIFIED]
    ) / n
    supported_ratio = (
        status_counts[ClaimStatus.SUPPORTED] + status_counts[ClaimStatus.PARTIALLY_SUPPORTED]
    ) / n
    misleading_ratio = status_counts[ClaimStatus.MISLEADING] / n

    if contradicted_ratio >= 0.4 or total_contradictions >= max(2, n):
        verdict = Verdict.CONTRADICTED
    elif misleading_ratio >= 0.3:
        verdict = Verdict.MISLEADING
    elif insufficient_ratio >= 0.6:
        verdict = Verdict.INSUFFICIENT_EVIDENCE
    elif status_counts[ClaimStatus.SUPPORTED] == n and avg_confidence >= 80:
        verdict = Verdict.VERIFIED
    elif supported_ratio >= 0.8 and avg_confidence >= 60:
        verdict = Verdict.LIKELY_TRUE
    elif supported_ratio >= 0.4:
        verdict = Verdict.PARTIALLY_SUPPORTED
    else:
        verdict = Verdict.UNVERIFIED

    return verdict, avg_confidence
