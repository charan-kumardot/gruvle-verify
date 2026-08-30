from app.providers.ai.local_provider import LocalProvider


def test_extract_claims_flags_subjective():
    provider = LocalProvider()
    claims = provider.extract_claims("This is the best phone in India. It has a 5000mAh battery.")
    types = {c["claim_type"] for c in claims}
    assert "subjective" in types
    assert "numerical" in types


def test_reason_no_evidence_is_insufficient():
    provider = LocalProvider()
    result = provider.reason("The battery is 5000mAh.", [])
    assert result["status"] == "INSUFFICIENT_EVIDENCE"


def test_reason_detects_numeric_contradiction():
    provider = LocalProvider()
    evidence = [
        {"id": "EVIDENCE-001", "excerpt": "The product weighs 1.5kg according to the listing."},
    ]
    result = provider.reason("The product weighs 1.2kg.", evidence)
    assert result["status"] == "CONTRADICTED"
    assert result["evidence_relationships"]["EVIDENCE-001"] == "CONTRADICTS"


def test_reason_detects_numeric_support():
    provider = LocalProvider()
    evidence = [
        {"id": "EVIDENCE-001", "excerpt": "The battery capacity is rated at 5000mAh by the manufacturer."},
    ]
    result = provider.reason("The battery is 5000mAh.", evidence)
    assert result["evidence_relationships"]["EVIDENCE-001"] == "SUPPORTS"


def test_classify_picks_best_matching_label():
    provider = LocalProvider()
    label = provider.classify("This is a great deal, buy now!", ["subjective", "factual"])
    assert label in ("subjective", "factual")


def test_generate_raises_not_implemented():
    provider = LocalProvider()
    try:
        provider.generate("anything")
        assert False, "expected NotImplementedError"
    except NotImplementedError:
        pass
