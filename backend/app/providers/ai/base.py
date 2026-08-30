"""
AIProvider contract. Concrete providers (Gemini/Groq/OpenRouter/Ollama/Local) only need
to implement `generate()`. The semantic operations (extract_claims, classify, reason,
summarize) are implemented once here on top of `generate_json`/`generate`, so every
provider gets them for free and stays consistent — no per-provider prompt drift.

IMPORTANT: extract_claims/reason deliberately RAISE when the model's output can't be
parsed into valid JSON — that failure must propagate up to ModelRouter.run so it falls
through to the next provider in the chain, rather than being swallowed here and
mistaken for a legitimate "insufficient evidence" conclusion from a provider that never
actually answered the question. The chain's terminal LocalProvider never raises, so a
verification can never fail outright — but a single flaky network response must not
short-circuit the fallback (see providers/ai/router.py and orchestrator.py for the
outermost safety nets).
"""
from __future__ import annotations

import json
import re
from abc import ABC, abstractmethod


def extract_json(raw: str):
    """Best-effort extraction of a JSON value from LLM text output."""
    text = raw.strip()
    fence = re.search(r"```(?:json)?\s*(.*?)```", text, re.DOTALL)
    if fence:
        text = fence.group(1).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # last resort: grab the outermost {...} or [...]
    for open_ch, close_ch in (("[", "]"), ("{", "}")):
        start = text.find(open_ch)
        end = text.rfind(close_ch)
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(text[start : end + 1])
            except json.JSONDecodeError:
                continue
    raise ValueError(f"Could not extract JSON from model output: {raw[:200]!r}")


CLAIM_TYPES = [
    "factual", "numerical", "temporal", "commercial", "technical", "identity",
    "location", "financial", "historical", "product", "legal", "subjective",
    "promotional",
]

CLAIM_STATUSES = [
    "SUPPORTED", "PARTIALLY_SUPPORTED", "CONTRADICTED", "UNVERIFIED",
    "INSUFFICIENT_EVIDENCE", "MISLEADING", "TIME_SENSITIVE",
]


class AIProvider(ABC):
    name: str = "base"
    tier: str = "unknown"  # "cheap" | "strong" | "local"

    @abstractmethod
    def is_configured(self) -> bool: ...

    @abstractmethod
    def generate(self, prompt: str, system: str | None = None) -> str: ...

    def generate_json(self, prompt: str, system: str | None = None):
        raw = self.generate(prompt, system=system)
        return extract_json(raw)

    def classify(self, text: str, labels: list[str]) -> str:
        prompt = (
            "Classify the text into exactly one of these labels: "
            f"{', '.join(labels)}.\nRespond with only the label, nothing else.\n\n"
            f"Text:\n{text[:4000]}"
        )
        result = self.generate(prompt).strip().strip('"').strip(".")
        for label in labels:
            if label.lower() == result.lower() or label.lower() in result.lower():
                return label
        return labels[-1] if labels else result

    def extract_claims(self, text: str) -> list[dict]:
        prompt = (
            "You are decomposing a piece of content into individually checkable factual "
            "claims. Do NOT ask 'is this true'. Just split the content into discrete, "
            "atomic claims that can each be researched independently.\n\n"
            "Rules:\n"
            "- Subjective/marketing language (e.g. 'best phone in India') must be extracted "
            "as claim_type='subjective' or 'promotional', never 'factual'.\n"
            "- Each claim must be a single self-contained statement (no 'and').\n"
            "- If the content contains no checkable claims, return an empty list.\n\n"
            f"Valid claim_type values: {', '.join(CLAIM_TYPES)}\n\n"
            "Return ONLY a JSON array like:\n"
            '[{"text": "...", "claim_type": "numerical", "time_sensitive": false}]\n\n'
            f"Content:\n{text[:8000]}"
        )
        result = self.generate_json(prompt)  # raises on unparsable output — let it fall through
        if not isinstance(result, list):
            raise ValueError(f"Expected a JSON array of claims, got: {type(result).__name__}")
        cleaned = []
        for item in result:
            if not isinstance(item, dict) or "text" not in item:
                continue
            item["claim_type"] = item.get("claim_type") if item.get("claim_type") in CLAIM_TYPES else "factual"
            item["time_sensitive"] = bool(item.get("time_sensitive", False))
            cleaned.append(item)
        return cleaned

    def reason(self, claim_text: str, evidence_items: list[dict]) -> dict:
        """
        evidence_items: [{"id": "EVIDENCE-001", "excerpt": "...", "source_quality": 82,
                           "source_title": "...", "published_at": "2026-01-01"}]
        Returns: {"status": "SUPPORTED", "rationale": "...",
                  "evidence_relationships": {"EVIDENCE-001": "SUPPORTS"},
                  "evidence_ids_used": [...]}
        The rationale must only reference the given evidence IDs — no outside knowledge
        may be presented as evidence.
        """
        empty = {
            "status": "INSUFFICIENT_EVIDENCE",
            "rationale": "No evidence was collected for this claim.",
            "evidence_relationships": {},
            "evidence_ids_used": [],
        }
        if not evidence_items:
            return empty

        evidence_block = "\n".join(
            f"- {e['id']} (source quality {e.get('source_quality', '?')}/100, "
            f"published {e.get('published_at', 'unknown')}): \"{e['excerpt']}\""
            for e in evidence_items
        )
        prompt = (
            "You are a careful evidence analyst. Given a claim and a list of evidence "
            "snippets (each with a stable ID), decide the claim's status AND classify "
            "each evidence item's relationship to the claim.\n\n"
            f"Valid statuses: {', '.join(CLAIM_STATUSES)}\n"
            "Valid relationships per evidence item: SUPPORTS, CONTRADICTS, CONTEXT\n\n"
            "STRICT RULES:\n"
            "- Only use the provided evidence. Do not introduce facts from your own "
            "knowledge and present them as evidence.\n"
            "- Your rationale must cite evidence IDs (e.g. 'EVIDENCE-002 shows...').\n"
            "- If evidence conflicts, status should be CONTRADICTED or PARTIALLY_SUPPORTED, "
            "not SUPPORTED.\n"
            "- If evidence is thin or tangential, prefer INSUFFICIENT_EVIDENCE over guessing.\n\n"
            f"Claim: {claim_text}\n\nEvidence:\n{evidence_block}\n\n"
            "Return ONLY JSON: "
            '{"status": "...", "rationale": "...", '
            '"evidence_relationships": {"EVIDENCE-001": "SUPPORTS"}, '
            '"evidence_ids_used": ["EVIDENCE-001"]}'
        )
        result = self.generate_json(prompt)  # raises on unparsable output — let it fall through
        if not isinstance(result, dict) or result.get("status") not in CLAIM_STATUSES:
            raise ValueError(f"Model returned an invalid/missing status: {result!r}")
        result.setdefault("rationale", "")
        result.setdefault("evidence_relationships", {})
        result.setdefault("evidence_ids_used", list(result.get("evidence_relationships", {}).keys()))
        return result

    def summarize(self, text: str, max_words: int = 80) -> str:
        prompt = (
            f"Summarize the following in at most {max_words} words. Plain, neutral "
            f"language. No marketing tone, no unsupported claims beyond what's stated.\n\n"
            f"{text[:6000]}"
        )
        try:
            return self.generate(prompt).strip()
        except Exception:
            return ""
