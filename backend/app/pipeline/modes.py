from __future__ import annotations

from dataclasses import dataclass

from app.models.schemas import VerificationMode


@dataclass(frozen=True)
class ModeConfig:
    max_claims: int
    max_sources_per_claim: int
    max_queries_per_claim: int
    description: str


MODE_CONFIG: dict[VerificationMode, ModeConfig] = {
    VerificationMode.QUICK_CHECK: ModeConfig(3, 3, 2, "Fast verification using limited sources."),
    VerificationMode.DEEP_CHECK: ModeConfig(10, 6, 4, "Comprehensive multi-source research."),
    VerificationMode.DOCUMENT_CHECK: ModeConfig(15, 4, 3, "Document-focused claim analysis."),
    VerificationMode.LISTING_CHECK: ModeConfig(10, 5, 3, "Product/property/vehicle listing analysis."),
    VerificationMode.CLAIM_CHECK: ModeConfig(6, 5, 3, "Focused fact/evidence verification."),
    VerificationMode.WEBSITE_CHECK: ModeConfig(8, 4, 3, "Website/company trust analysis."),
    VerificationMode.MESSAGE_CHECK: ModeConfig(6, 3, 2, "Suspicious message/social-engineering analysis."),
}
