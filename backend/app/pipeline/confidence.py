"""
Confidence here means "how strongly does the available evidence support this
conclusion", never "how confident the model sounds". Pure function of the inputs
below — no LLM call happens in this module.
"""
from __future__ import annotations

from app.models.schemas import ConfidenceBreakdown, EvidenceStrength, Source, utcnow


def classify_evidence_strength(overall_score: int) -> EvidenceStrength:
    if overall_score <= 0:
        return EvidenceStrength.NONE
    if overall_score < 40:
        return EvidenceStrength.WEAK
    if overall_score < 75:
        return EvidenceStrength.MODERATE
    return EvidenceStrength.STRONG


def build_confidence_breakdown(
    overall_score: int,
    sources_used: list[Source],
    contradiction_count: int,
    reasoning_tier: str,
) -> ConfidenceBreakdown:
    capped = overall_score
    if reasoning_tier == "local":
        # Heuristic-only reasoning (no configured LLM) cannot support high confidence,
        # no matter how strong the raw evidence signal looks — see LocalProvider.reason.
        capped = min(capped, 45)

    independent_domains = {s.domain for s in sources_used if s.independent}
    primary_count = sum(1 for s in sources_used if s.source_type.value in ("primary", "regulatory"))

    return ConfidenceBreakdown(
        overall=max(0, min(100, capped)),
        evidence_strength=classify_evidence_strength(capped),
        independent_source_count=len(independent_domains),
        primary_source_count=primary_count,
        contradiction_count=contradiction_count,
        last_verified=utcnow(),
    )
