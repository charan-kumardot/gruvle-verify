"""
End-to-end pipeline test with the LocalProvider AI tier (no network) and a fake
search backend, verifying the stages actually wire together: claim extraction ->
evidence collection -> reasoning -> contradiction detection -> deterministic verdict.
"""
from app.config import Settings
from app.models.schemas import ExtractedContent, InputType, SearchResult, VerificationMode
from app.pipeline import orchestrator as orchestrator_module
from app.providers.ai.openai_compatible import OllamaProvider


class FakeSearchRouter:
    def __init__(self, *_args, **_kwargs):
        pass

    def search(self, query, max_results=8):
        return (
            [
                SearchResult(title="Official spec sheet", url="https://acme.gov/spec", snippet="The device has a 5000mAh battery."),
                SearchResult(title="Retailer listing", url="https://someshop.example.com/item", snippet="Battery: 5000mAh"),
            ],
            "fake",
            False,
        )

    def extract_content(self, url):
        return ExtractedContent(
            url=url,
            title="Fake page",
            text="The device has a 5000mAh battery according to official documentation.",
        )


def test_orchestrator_runs_end_to_end_without_network(monkeypatch):
    monkeypatch.setattr(orchestrator_module, "SearchRouter", FakeSearchRouter)
    # Force the AI chain down to LocalProvider even on a machine that happens to have
    # a real Ollama daemon running locally — this test must be deterministic and fast
    # regardless of the host's environment, not incidentally depend on it.
    monkeypatch.setattr(OllamaProvider, "is_configured", lambda self: False)

    settings = Settings(
        gemini_api_key=None,
        groq_api_key=None,
        openrouter_api_key=None,
        supabase_url=None,
    )

    result = orchestrator_module.run_verification(
        settings=settings,
        verification_id="test-id",
        input_type=InputType.TEXT,
        input_raw="This phone has a 5000mAh battery.",
        text_for_analysis="This phone has a 5000mAh battery.",
        mode=VerificationMode.QUICK_CHECK,
    )

    assert result.id == "test-id"
    assert len(result.claims) >= 1
    assert result.verdict is not None
    assert result.confidence.overall <= 45  # local-tier reasoning caps confidence
    assert result.summary
    assert isinstance(result.next_actions, list) and result.next_actions
