from app.models.schemas import (
    Claim,
    ClaimStatus,
    ClaimType,
    ConfidenceBreakdown,
    ContradictionRecord,
    Evidence,
    EvidenceRelationship,
    EvidenceStrength,
    InputType,
    Source,
    SourceType,
    Verdict,
    VerificationMode,
    VerificationResult,
)
from app.pipeline.pdf_export import build_pdf


def make_result(**overrides) -> VerificationResult:
    source = Source(id="S1", url="https://example.com/spec", domain="example.com", source_type=SourceType.OFFICIAL, quality_score=78)
    evidence = Evidence(id="EVIDENCE-001", claim_id="CLAIM-001", source_id="S1", excerpt="Battery: 5000 mAh", relationship=EvidenceRelationship.SUPPORTS)
    claim = Claim(id="CLAIM-001", text="Battery capacity is 5000mAh.", claim_type=ClaimType.NUMERICAL, status=ClaimStatus.SUPPORTED, evidence_for=["EVIDENCE-001"], confidence=88)
    defaults = dict(
        id="test",
        input_type=InputType.TEXT,
        input_raw="claim text",
        mode=VerificationMode.CLAIM_CHECK,
        title="Battery capacity claim",
        verdict=Verdict.PARTIALLY_SUPPORTED,
        confidence=ConfidenceBreakdown(overall=62, evidence_strength=EvidenceStrength.MODERATE),
        summary="Test summary.",
        claims=[claim],
        evidence=[evidence],
        sources=[source],
    )
    defaults.update(overrides)
    return VerificationResult(**defaults)


def test_build_pdf_produces_valid_pdf_bytes():
    result = make_result()
    pdf_bytes = build_pdf(result)
    assert pdf_bytes.startswith(b"%PDF-")
    assert len(pdf_bytes) > 500


def test_build_pdf_handles_empty_claims_and_evidence():
    result = make_result(claims=[], evidence=[], sources=[])
    pdf_bytes = build_pdf(result)
    assert pdf_bytes.startswith(b"%PDF-")


def test_build_pdf_handles_contradictions_and_degraded_providers():
    result = make_result(
        contradictions=[ContradictionRecord(claim_id="CLAIM-001", evidence_id_a="EVIDENCE-001", evidence_id_b="EVIDENCE-001", description="Conflict found.")],
        degraded_providers=["groq"],
        open_questions=["Is this real?"],
        next_actions=["Check the source."],
    )
    pdf_bytes = build_pdf(result)
    assert pdf_bytes.startswith(b"%PDF-")


def test_build_pdf_escapes_html_special_characters():
    result = make_result(title="<script>alert(1)</script> & \"quotes\"", summary="Contains < and > and &")
    pdf_bytes = build_pdf(result)
    assert pdf_bytes.startswith(b"%PDF-")
