from __future__ import annotations

from app.models.schemas import Claim, ClaimType
from app.providers.ai.router import ModelRouter

RESEARCHABLE_TYPES = {t for t in ClaimType if t not in (ClaimType.SUBJECTIVE, ClaimType.PROMOTIONAL)}


def extract_claims(router: ModelRouter, text: str) -> tuple[list[Claim], str | None, bool]:
    if not text or not text.strip():
        return [], None, False

    try:
        raw_claims, provider_used, degraded = router.run("extract_claims", "extract_claims", text)
    except RuntimeError:
        raw_claims, provider_used, degraded = [], None, True

    if not raw_claims:
        # Nothing decomposable found (or extraction failed) — fall back to treating
        # the whole input as a single claim rather than returning an empty report.
        raw_claims = [{"text": text.strip()[:500], "claim_type": "factual", "time_sensitive": False}]

    claims = []
    for i, item in enumerate(raw_claims, start=1):
        try:
            claim_type = ClaimType(item.get("claim_type", "factual"))
        except ValueError:
            claim_type = ClaimType.FACTUAL
        claims.append(Claim(
            id=f"CLAIM-{i:03d}",
            text=item["text"],
            claim_type=claim_type,
            time_sensitive=bool(item.get("time_sensitive", False)),
        ))
    return claims, provider_used, degraded


def is_researchable(claim: Claim) -> bool:
    return claim.claim_type in RESEARCHABLE_TYPES
