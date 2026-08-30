from app.models.schemas import SourceType
from app.pipeline.source_quality import classify_domain, get_domain, score_source


def test_get_domain_strips_www():
    assert get_domain("https://www.example.com/page") == "example.com"
    assert get_domain("https://example.com/page") == "example.com"


def test_classify_domain_regulatory():
    assert classify_domain("fda.gov") == SourceType.REGULATORY


def test_classify_domain_reputable_publication():
    assert classify_domain("reuters.com") == SourceType.INDEPENDENT_PUBLICATION


def test_classify_domain_forum():
    assert classify_domain("reddit.com") == SourceType.FORUM_UGC


def test_classify_domain_official_when_matches_subject():
    assert classify_domain("shop.acme.com", subject_domain="acme.com") == SourceType.OFFICIAL


def test_classify_domain_unknown_default():
    assert classify_domain("some-random-blog.net") == SourceType.UNKNOWN


def test_score_source_regulatory_with_author_and_independent_is_high():
    score, factors = score_source(SourceType.REGULATORY, has_author=True, independent=True)
    assert score >= 90
    assert "final_score" in factors


def test_score_source_penalizes_conflict_of_interest():
    independent_score, _ = score_source(SourceType.OFFICIAL, has_author=True, independent=True)
    conflicted_score, _ = score_source(SourceType.OFFICIAL, has_author=True, independent=False)
    assert conflicted_score < independent_score


def test_score_source_penalizes_no_https():
    https_score, _ = score_source(SourceType.UNKNOWN, has_author=False, independent=True, is_https=True)
    http_score, _ = score_source(SourceType.UNKNOWN, has_author=False, independent=True, is_https=False)
    assert http_score < https_score


def test_score_source_bounded_0_to_100():
    score, _ = score_source(SourceType.FORUM_UGC, has_author=False, independent=False, is_https=False)
    assert 0 <= score <= 100
