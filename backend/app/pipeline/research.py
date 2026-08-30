"""
Query generation is template-based, not AI-generated — it must work identically
whether or not any LLM is configured, since it's the input to search, not a
reasoning step.
"""
from __future__ import annotations


def generate_queries(claim_text: str, subject_hint: str | None = None, max_queries: int = 4) -> list[str]:
    base = claim_text.strip().rstrip(".")
    queries = [base]
    if subject_hint:
        queries.append(f"{subject_hint} {base}")
    queries.append(f"{base} official")
    queries.append(f"{base} fact check")
    seen: set[str] = set()
    unique = []
    for q in queries:
        key = q.lower()
        if key not in seen:
            seen.add(key)
            unique.append(q)
    return unique[:max_queries]
