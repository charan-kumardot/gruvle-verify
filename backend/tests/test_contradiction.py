from datetime import datetime, timezone

from app.models.schemas import Evidence, EvidenceRelationship, Source, SourceType
from app.pipeline.contradiction import detect_numeric_contradictions


def make_source(id_, published_at=None):
    return Source(id=id_, url=f"https://{id_}.example.com", domain=f"{id_}.example.com",
                  source_type=SourceType.INDEPENDENT_PUBLICATION, quality_score=80, published_at=published_at)


def test_detects_conflicting_numeric_values():
    sources = {
        "s1": make_source("s1", datetime(2024, 1, 1, tzinfo=timezone.utc)),
        "s2": make_source("s2", datetime(2026, 1, 1, tzinfo=timezone.utc)),
    }
    evidence = [
        Evidence(id="E1", claim_id="C1", source_id="s1", excerpt="The product weighs 1.5kg.", relationship=EvidenceRelationship.CONTEXT),
        Evidence(id="E2", claim_id="C1", source_id="s2", excerpt="The product weighs 1.2kg.", relationship=EvidenceRelationship.CONTEXT),
    ]
    records = detect_numeric_contradictions("C1", evidence, sources)
    assert len(records) == 1
    assert "kg" in records[0].description
    assert "E2" in records[0].description  # newer source called out


def test_no_contradiction_when_values_agree():
    sources = {"s1": make_source("s1"), "s2": make_source("s2")}
    evidence = [
        Evidence(id="E1", claim_id="C1", source_id="s1", excerpt="Battery capacity is 5000mAh.", relationship=EvidenceRelationship.CONTEXT),
        Evidence(id="E2", claim_id="C1", source_id="s2", excerpt="It has a 5000mAh battery.", relationship=EvidenceRelationship.CONTEXT),
    ]
    records = detect_numeric_contradictions("C1", evidence, sources)
    assert records == []


def test_no_contradiction_with_single_evidence():
    sources = {"s1": make_source("s1")}
    evidence = [Evidence(id="E1", claim_id="C1", source_id="s1", excerpt="5000mAh battery.", relationship=EvidenceRelationship.CONTEXT)]
    assert detect_numeric_contradictions("C1", evidence, sources) == []
