from app.models.schemas import Claim, ClaimStatus, ClaimType, Evidence, EvidenceRelationship, Source, SourceType, Verdict
from app.pipeline.verdict_engine import compute_overall_verdict, score_claim


def make_source(id_, quality, independent=True):
    return Source(id=id_, url=f"https://{id_}.example.com", domain=f"{id_}.example.com",
                  source_type=SourceType.INDEPENDENT_PUBLICATION, quality_score=quality, independent=independent)


def make_evidence(id_, claim_id, source_id, relationship):
    return Evidence(id=id_, claim_id=claim_id, source_id=source_id, excerpt="x", relationship=relationship)


def test_score_claim_zero_with_no_evidence():
    claim = Claim(id="CLAIM-001", text="x", claim_type=ClaimType.FACTUAL, status=ClaimStatus.INSUFFICIENT_EVIDENCE)
    assert score_claim(claim, [], [], {}) == 0


def test_score_claim_high_for_multiple_independent_supporting_high_quality_sources():
    sources = {f"s{i}": make_source(f"s{i}", 90) for i in range(3)}
    evidence_for = [make_evidence(f"E{i}", "CLAIM-001", f"s{i}", EvidenceRelationship.SUPPORTS) for i in range(3)]
    claim = Claim(id="CLAIM-001", text="x", claim_type=ClaimType.FACTUAL, status=ClaimStatus.SUPPORTED)
    score = score_claim(claim, evidence_for, [], sources)
    assert score >= 80


def test_score_claim_capped_when_contradicted():
    sources = {"s1": make_source("s1", 95)}
    evidence_for = [make_evidence("E1", "CLAIM-001", "s1", EvidenceRelationship.SUPPORTS)]
    claim = Claim(id="CLAIM-001", text="x", claim_type=ClaimType.FACTUAL, status=ClaimStatus.CONTRADICTED)
    score = score_claim(claim, evidence_for, [], sources)
    assert score <= 40


def test_score_claim_lower_with_contradicting_evidence_present():
    sources = {"s1": make_source("s1", 90), "s2": make_source("s2", 90)}
    evidence_for = [make_evidence("E1", "CLAIM-001", "s1", EvidenceRelationship.SUPPORTS)]
    evidence_against = [make_evidence("E2", "CLAIM-001", "s2", EvidenceRelationship.CONTRADICTS)]
    claim_clean = Claim(id="CLAIM-001", text="x", claim_type=ClaimType.FACTUAL, status=ClaimStatus.PARTIALLY_SUPPORTED)
    score_with_conflict = score_claim(claim_clean, evidence_for, evidence_against, sources)
    score_without_conflict = score_claim(claim_clean, evidence_for, [], sources)
    assert score_with_conflict < score_without_conflict


def make_claim(status, confidence):
    return Claim(id="CLAIM-001", text="x", claim_type=ClaimType.FACTUAL, status=status, confidence=confidence)


def test_compute_overall_verdict_empty_claims():
    verdict, confidence = compute_overall_verdict([], 0)
    assert verdict == Verdict.INSUFFICIENT_EVIDENCE
    assert confidence == 0


def test_compute_overall_verdict_all_supported_high_confidence_is_verified():
    claims = [make_claim(ClaimStatus.SUPPORTED, 90) for _ in range(3)]
    verdict, confidence = compute_overall_verdict(claims, 0)
    assert verdict == Verdict.VERIFIED
    assert confidence == 90


def test_compute_overall_verdict_majority_contradicted_is_contradicted():
    claims = [make_claim(ClaimStatus.CONTRADICTED, 30) for _ in range(2)] + [make_claim(ClaimStatus.SUPPORTED, 80)]
    verdict, _ = compute_overall_verdict(claims, 2)
    assert verdict == Verdict.CONTRADICTED


def test_compute_overall_verdict_mostly_insufficient_is_insufficient():
    claims = [make_claim(ClaimStatus.INSUFFICIENT_EVIDENCE, 0) for _ in range(3)]
    verdict, _ = compute_overall_verdict(claims, 0)
    assert verdict == Verdict.INSUFFICIENT_EVIDENCE
