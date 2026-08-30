"""
Summary, open-questions, and next-actions text is built from templates driven by
claim statuses/verdict — deterministic, so the report never says something the
scoring layer didn't actually conclude. This is deliberately duller prose than an
LLM would produce; that's the trade-off for never fabricating a persuasive-sounding
sentence that outruns the evidence.
"""
from __future__ import annotations

from app.models.schemas import Claim, ClaimStatus, ContradictionRecord, Verdict, VerificationMode

_UNCERTAIN_STATUSES = {
    ClaimStatus.UNVERIFIED,
    ClaimStatus.INSUFFICIENT_EVIDENCE,
    ClaimStatus.PARTIALLY_SUPPORTED,
    ClaimStatus.TIME_SENSITIVE,
}


def build_summary(claims: list[Claim], verdict: Verdict, contradictions: list[ContradictionRecord]) -> str:
    if not claims:
        return "No checkable claims were found in the submitted content."

    n = len(claims)
    supported = sum(1 for c in claims if c.status == ClaimStatus.SUPPORTED)
    contradicted = sum(1 for c in claims if c.status == ClaimStatus.CONTRADICTED)
    insufficient = sum(1 for c in claims if c.status in (ClaimStatus.INSUFFICIENT_EVIDENCE, ClaimStatus.UNVERIFIED))

    parts = [f"{supported} of {n} claim(s) are supported by the evidence found."]
    if contradicted:
        parts.append(f"{contradicted} claim(s) are contradicted by conflicting sources.")
    if insufficient:
        parts.append(f"{insufficient} claim(s) could not be independently confirmed.")
    if contradictions:
        parts.append(f"{len(contradictions)} direct factual conflict(s) were detected between sources.")
    return " ".join(parts)


def build_open_questions(claims: list[Claim]) -> list[str]:
    questions = []
    for claim in claims:
        if claim.status in _UNCERTAIN_STATUSES:
            questions.append(f"We could not independently confirm: \"{claim.text}\"")
    if not questions:
        questions.append("No major open questions — all extracted claims were checked against available evidence.")
    return questions


def build_next_actions(claims: list[Claim], verdict: Verdict, mode: VerificationMode) -> list[str]:
    actions: list[str] = []

    if verdict in (Verdict.CONTRADICTED, Verdict.MISLEADING, Verdict.HIGH_RISK):
        actions.append("Do not proceed (purchase, payment, or agreement) until the contradicted claim(s) are resolved directly with the source.")
    if any(c.status == ClaimStatus.INSUFFICIENT_EVIDENCE for c in claims):
        actions.append("Ask the original source directly for documentation supporting the unconfirmed claim(s).")
    if mode == VerificationMode.LISTING_CHECK:
        actions.append("Request the original invoice, serial number, or certificate of authenticity from the seller.")
        actions.append("Check the manufacturer's official specification page directly.")
    if mode == VerificationMode.WEBSITE_CHECK:
        actions.append("Look up the company's official registration/contact details through an independent registry, not only the site itself.")
    if mode == VerificationMode.MESSAGE_CHECK:
        actions.append("Do not click any links or provide credentials/payment from this message — contact the organization through a channel you already trust.")
    actions.append("Open the original sources listed in the evidence section to review them yourself.")

    seen, deduped = set(), []
    for a in actions:
        if a not in seen:
            seen.add(a)
            deduped.append(a)
    return deduped
