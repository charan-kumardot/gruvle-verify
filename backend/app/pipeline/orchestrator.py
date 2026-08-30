"""
Ties every pipeline stage together for one verification run:
  extract_claims -> (per researchable claim: research -> collect evidence -> reason)
  -> contradiction detection -> deterministic verdict/confidence -> report text

Kept deliberately as one linear function rather than a class/framework — it's already
the single place that must be read top-to-bottom to understand the pipeline, and a
framework would only hide that. Each stage it calls is independently unit-testable;
this function is covered by an integration-style test with fake providers instead.
"""
from __future__ import annotations

from app.config import Settings
from app.models.schemas import (
    Claim,
    ClaimStatus,
    ConfidenceBreakdown,
    ContradictionRecord,
    Evidence,
    EvidenceRelationship,
    ExtractedContent,
    InputType,
    RiskLevel,
    Source,
    Verdict,
    VerificationMode,
    VerificationResult,
    utcnow,
)
from app.pipeline.claim_extraction import extract_claims, is_researchable
from app.pipeline.confidence import build_confidence_breakdown
from app.pipeline.contradiction import detect_numeric_contradictions
from app.pipeline.evidence_collection import EvidenceIdGenerator, collect_evidence_for_claim
from app.pipeline.modes import MODE_CONFIG
from app.pipeline.report import build_next_actions, build_open_questions, build_summary
from app.pipeline.research import generate_queries
from app.pipeline.source_quality import get_domain
from app.pipeline.verdict_engine import compute_overall_verdict, score_claim
from app.providers.ai.router import ModelRouter
from app.providers.search.router import SearchRouter


def _derive_risk_level(mode: VerificationMode, verdict: Verdict) -> RiskLevel | None:
    if mode not in (VerificationMode.WEBSITE_CHECK, VerificationMode.MESSAGE_CHECK):
        return None
    if verdict == Verdict.INSUFFICIENT_EVIDENCE:
        return RiskLevel.INSUFFICIENT_DATA
    if verdict in (Verdict.CONTRADICTED, Verdict.HIGH_RISK, Verdict.MISLEADING):
        return RiskLevel.HIGH if mode == VerificationMode.WEBSITE_CHECK else RiskLevel.HIGH
    if verdict in (Verdict.PARTIALLY_SUPPORTED, Verdict.UNVERIFIED):
        return RiskLevel.MEDIUM if mode == VerificationMode.WEBSITE_CHECK else RiskLevel.SUSPICIOUS
    return RiskLevel.LOW


def run_verification(
    settings: Settings,
    verification_id: str,
    input_type: InputType,
    input_raw: str,
    text_for_analysis: str,
    mode: VerificationMode,
    user_question: str | None = None,
    subject_url: str | None = None,
    primary_content: ExtractedContent | None = None,
    user_id: str | None = None,
) -> VerificationResult:
    mode_config = MODE_CONFIG[mode]
    ai_router = ModelRouter(settings)
    search_router = SearchRouter(settings)
    subject_domain = get_domain(subject_url) if subject_url else None

    degraded_providers: set[str] = set()
    reasoning_tiers_used: list[str] = []

    claims, extraction_provider, extraction_degraded = extract_claims(ai_router, text_for_analysis)
    if extraction_degraded and extraction_provider:
        degraded_providers.add(extraction_provider)

    researchable = [c for c in claims if is_researchable(c)][: mode_config.max_claims]
    for claim in claims:
        if not is_researchable(claim):
            claim.status = ClaimStatus.UNVERIFIED
            claim.rationale = "Subjective or promotional claim — not objectively verifiable against evidence."

    all_sources: dict[str, Source] = {}
    all_evidence: list[Evidence] = []
    all_contradictions: list[ContradictionRecord] = []
    evidence_ids = EvidenceIdGenerator()

    for claim in researchable:
        queries = generate_queries(claim.text, subject_hint=subject_domain, max_queries=mode_config.max_queries_per_claim)
        primary = (subject_url, primary_content) if (primary_content is not None and subject_url) else None

        sources, evidence, search_degraded = collect_evidence_for_claim(
            claim_id=claim.id,
            claim_text=claim.text,
            queries=queries,
            search_router=search_router,
            evidence_ids=evidence_ids,
            subject_domain=subject_domain,
            primary_content=primary,
            max_sources=mode_config.max_sources_per_claim,
        )
        if search_degraded:
            degraded_providers.add("search")
        for s in sources:
            all_sources[s.id] = s
        all_evidence.extend(evidence)

        evidence_items = [
            {
                "id": e.id,
                "excerpt": e.excerpt,
                "source_quality": all_sources[e.source_id].quality_score,
                "source_title": all_sources[e.source_id].title,
                "published_at": str(all_sources[e.source_id].published_at or "unknown"),
            }
            for e in evidence
        ]

        try:
            reasoning, reasoning_provider, reasoning_degraded = ai_router.run(
                "reason", "reason", claim.text, evidence_items
            )
        except RuntimeError:
            reasoning = {
                "status": "INSUFFICIENT_EVIDENCE",
                "rationale": "All reasoning providers failed or were unconfigured.",
                "evidence_relationships": {},
            }
            reasoning_provider, reasoning_degraded = None, True

        reasoning_tiers_used.append("local" if reasoning_provider == "local" else "network")
        if reasoning_degraded and reasoning_provider:
            degraded_providers.add(reasoning_provider)

        try:
            claim.status = ClaimStatus(reasoning["status"])
        except ValueError:
            claim.status = ClaimStatus.INSUFFICIENT_EVIDENCE
        claim.rationale = reasoning.get("rationale", "")

        relationships = reasoning.get("evidence_relationships", {})
        for e in evidence:
            try:
                e.relationship = EvidenceRelationship(relationships.get(e.id, "CONTEXT"))
            except ValueError:
                e.relationship = EvidenceRelationship.CONTEXT
            if e.relationship == EvidenceRelationship.SUPPORTS:
                claim.evidence_for.append(e.id)
            elif e.relationship == EvidenceRelationship.CONTRADICTS:
                claim.evidence_against.append(e.id)
            else:
                claim.evidence_context.append(e.id)

        evidence_for_objs = [e for e in evidence if e.relationship == EvidenceRelationship.SUPPORTS]
        evidence_against_objs = [e for e in evidence if e.relationship == EvidenceRelationship.CONTRADICTS]
        claim.confidence = score_claim(claim, evidence_for_objs, evidence_against_objs, all_sources)

        all_contradictions.extend(detect_numeric_contradictions(claim.id, evidence, all_sources))

    overall_verdict, avg_confidence = compute_overall_verdict(claims, len(all_contradictions))
    reasoning_tier = "local" if "local" in reasoning_tiers_used else "network"
    confidence = build_confidence_breakdown(avg_confidence, list(all_sources.values()), len(all_contradictions), reasoning_tier)

    title = (user_question or input_raw or (claims[0].text if claims else "Verification"))[:80]

    return VerificationResult(
        id=verification_id,
        user_id=user_id,
        input_type=input_type,
        input_raw=input_raw,
        user_question=user_question,
        mode=mode,
        title=title,
        verdict=overall_verdict,
        risk_level=_derive_risk_level(mode, overall_verdict),
        confidence=confidence,
        summary=build_summary(claims, overall_verdict, all_contradictions),
        claims=claims,
        evidence=all_evidence,
        sources=list(all_sources.values()),
        contradictions=all_contradictions,
        open_questions=build_open_questions(claims),
        next_actions=build_next_actions(claims, overall_verdict, mode),
        degraded_providers=sorted(degraded_providers),
        created_at=utcnow(),
        updated_at=utcnow(),
    )
