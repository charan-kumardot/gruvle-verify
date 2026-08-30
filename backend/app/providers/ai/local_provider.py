"""
LocalProvider is the guaranteed-available last-resort tier: zero network calls, zero
dependencies, always `is_configured() == True`. It exists so the app degrades to
"less capable" rather than "broken" when every network AI provider is unconfigured
or down.

It does NOT pretend to reason like an LLM. `reason()` uses a conservative numeric/
keyword-overlap heuristic and always labels its output as heuristic in the rationale,
so a report produced entirely in local mode is honest about its reduced reliability
rather than presenting heuristic guesses as confident analysis. The orchestrator caps
confidence when this tier was used for reasoning (see pipeline/confidence.py).
"""
from __future__ import annotations

import re

from app.text_utils import normalize_unit

from .base import AIProvider, CLAIM_TYPES

SUBJECTIVE_MARKERS = {
    "best", "worst", "amazing", "great", "greatest", "love", "hate", "should",
    "must", "incredible", "perfect", "beautiful", "ugly", "favorite", "favourite",
    "awesome", "terrible", "stunning", "gorgeous", "excellent", "outstanding",
}
PROMOTIONAL_MARKERS = {
    "limited time", "buy now", "act now", "guaranteed", "risk-free", "exclusive",
    "sale", "discount", "% off", "free shipping",
}
NEGATION_MARKERS = {"not", "no", "never", "isn't", "doesn't", "wasn't", "false", "incorrect"}

_NUMBER_RE = re.compile(r"(\d+(?:\.\d+)?)\s*([a-zA-Z%]{0,10})")
_WORD_RE = re.compile(r"[a-zA-Z]{4,}")
_STOPWORDS = {"this", "that", "with", "from", "have", "does", "will", "which", "there"}


def _sentences(text: str) -> list[str]:
    raw = re.split(r"(?<=[.!?])\s+", text.strip())
    return [s.strip() for s in raw if len(s.strip()) > 8]


def _keywords(text: str) -> set[str]:
    return {w.lower() for w in _WORD_RE.findall(text) if w.lower() not in _STOPWORDS}


class LocalProvider(AIProvider):
    name = "local"
    tier = "local"

    def is_configured(self) -> bool:
        return True

    def generate(self, prompt: str, system: str | None = None) -> str:
        raise NotImplementedError(
            "LocalProvider has no general-purpose text generation; it implements "
            "classify/extract_claims/reason/summarize directly with heuristics."
        )

    def classify(self, text: str, labels: list[str]) -> str:
        lowered = text.lower()
        scores = {label: lowered.count(label.lower()) for label in labels}
        best = max(scores, key=scores.get)
        return best if scores[best] > 0 else labels[-1]

    def extract_claims(self, text: str) -> list[dict]:
        claims = []
        for sentence in _sentences(text)[:20]:
            lowered = sentence.lower()
            if any(m in lowered for m in PROMOTIONAL_MARKERS):
                claim_type = "promotional"
            elif any(m in lowered.split() or m in lowered for m in SUBJECTIVE_MARKERS):
                claim_type = "subjective"
            elif re.search(r"\b\d{4}\b", sentence) and re.search(r"\b(in|since|by|on)\b", lowered):
                claim_type = "temporal"
            elif _NUMBER_RE.search(sentence):
                claim_type = "numerical"
            else:
                claim_type = "factual"
            claims.append({
                "text": sentence,
                "claim_type": claim_type if claim_type in CLAIM_TYPES else "factual",
                "time_sensitive": claim_type == "temporal",
            })
        return claims

    def reason(self, claim_text: str, evidence_items: list[dict]) -> dict:
        if not evidence_items:
            return {
                "status": "INSUFFICIENT_EVIDENCE",
                "rationale": "[Heuristic mode — no AI provider configured] No evidence was collected.",
                "evidence_relationships": {},
                "evidence_ids_used": [],
            }

        claim_numbers = {(n, normalize_unit(u)) for n, u in _NUMBER_RE.findall(claim_text)}
        claim_kw = _keywords(claim_text)

        relationships: dict[str, str] = {}
        supports, contradicts, used = [], [], []
        for ev in evidence_items:
            excerpt = ev.get("excerpt", "")
            ev_numbers = {(n, normalize_unit(u)) for n, u in _NUMBER_RE.findall(excerpt)}
            ev_kw = _keywords(excerpt)
            overlap = len(claim_kw & ev_kw) / max(len(claim_kw), 1)

            relationship = "CONTEXT"
            if claim_numbers and ev_numbers:
                same_unit_conflict = any(
                    u1 == u2 and n1 != n2
                    for n1, u1 in claim_numbers
                    for n2, u2 in ev_numbers
                    if u1
                )
                same_value = bool(claim_numbers & ev_numbers)
                if same_value and overlap > 0.2:
                    supports.append(ev["id"])
                    used.append(ev["id"])
                    relationship = "SUPPORTS"
                elif same_unit_conflict and overlap > 0.2:
                    contradicts.append(ev["id"])
                    used.append(ev["id"])
                    relationship = "CONTRADICTS"
            elif overlap > 0.4:
                negated = any(neg in excerpt.lower() for neg in NEGATION_MARKERS)
                if negated:
                    contradicts.append(ev["id"])
                    relationship = "CONTRADICTS"
                else:
                    supports.append(ev["id"])
                    relationship = "SUPPORTS"
                used.append(ev["id"])
            relationships[ev["id"]] = relationship

        prefix = "[Heuristic mode — no AI provider configured, keyword/number overlap only] "
        if contradicts:
            status = "CONTRADICTED"
            rationale = prefix + f"Conflicting values/statements found in {', '.join(contradicts)}."
        elif supports and len(supports) >= 2:
            status = "PARTIALLY_SUPPORTED"
            rationale = prefix + f"Overlapping statements found in {', '.join(supports)}; not confirmed by semantic reasoning."
        elif supports:
            status = "PARTIALLY_SUPPORTED"
            rationale = prefix + f"Some overlap found in {supports[0]}; treat as weak signal only."
        else:
            status = "INSUFFICIENT_EVIDENCE"
            rationale = prefix + "No sufficiently overlapping evidence found."

        return {
            "status": status,
            "rationale": rationale,
            "evidence_relationships": relationships,
            "evidence_ids_used": used,
        }

    def summarize(self, text: str, max_words: int = 80) -> str:
        sentences = _sentences(text)
        out, words = [], 0
        for s in sentences:
            w = len(s.split())
            if words + w > max_words:
                break
            out.append(s)
            words += w
        return " ".join(out) if out else text[:400]
