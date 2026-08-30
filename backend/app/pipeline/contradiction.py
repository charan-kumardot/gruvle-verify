"""
Deterministic numeric-contradiction detection. Independent of any AI provider's
opinion — if two evidence excerpts for the same claim contain different numeric
values for what looks like the same unit, that's a contradiction the report must
surface regardless of what the LLM (or heuristic reasoner) concluded about overall
claim status. See CLAUDE.md rule 8: contradictions are never hidden.
"""
from __future__ import annotations

import re
from collections import defaultdict
from datetime import datetime, timezone

from app.models.schemas import ContradictionRecord, Evidence, Source
from app.text_utils import normalize_unit

_NUMBER_RE = re.compile(r"(\d+(?:\.\d+)?)\s*([a-zA-Z%]{1,10})\b")


def _to_aware(dt: datetime | None) -> datetime:
    if dt is None:
        return datetime.min.replace(tzinfo=timezone.utc)
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def detect_numeric_contradictions(
    claim_id: str,
    evidence_list: list[Evidence],
    sources: dict[str, Source],
) -> list[ContradictionRecord]:
    by_unit: dict[str, list[tuple[float, Evidence]]] = defaultdict(list)

    for ev in evidence_list:
        for raw_num, unit in _NUMBER_RE.findall(ev.excerpt):
            if not unit:
                continue
            by_unit[normalize_unit(unit)].append((float(raw_num), ev))

    records: list[ContradictionRecord] = []
    for unit, entries in by_unit.items():
        distinct_values = sorted({value for value, _ in entries})
        if len(distinct_values) < 2:
            continue

        # Take the two evidence items representing the lowest and highest distinct values.
        low_value, high_value = distinct_values[0], distinct_values[-1]
        low_ev = next(ev for value, ev in entries if value == low_value)
        high_ev = next(ev for value, ev in entries if value == high_value)

        low_source = sources.get(low_ev.source_id)
        high_source = sources.get(high_ev.source_id)
        low_date = _to_aware(low_source.published_at if low_source else None)
        high_date = _to_aware(high_source.published_at if high_source else None)

        if low_date > high_date:
            newer_desc = f"{low_ev.id} ({low_value}{unit}) is more recent"
        elif high_date > low_date:
            newer_desc = f"{high_ev.id} ({high_value}{unit}) is more recent"
        else:
            newer_desc = "publication dates are unknown or identical, so recency does not resolve this"

        records.append(ContradictionRecord(
            claim_id=claim_id,
            evidence_id_a=low_ev.id,
            evidence_id_b=high_ev.id,
            description=(
                f"Sources disagree on a value in \"{unit}\": {low_ev.id} states {low_value}{unit}, "
                f"{high_ev.id} states {high_value}{unit}. {newer_desc}."
            ),
        ))

    return records
