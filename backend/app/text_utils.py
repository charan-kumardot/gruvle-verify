"""
Shared low-level text helpers with no pipeline/provider dependencies of their own,
so both providers/ai/local_provider.py and pipeline/contradiction.py can use the same
unit-normalization logic without an awkward providers -> pipeline import.
"""
from __future__ import annotations

# British/American spelling variants must not be treated as different units, or a
# genuine numeric conflict (330 meters vs 324 metres) would be missed just because of
# dialect. Deliberately excludes ambiguous single/double-letter abbreviations (e.g.
# "m", "g") — collapsing those risks false contradictions with unrelated quantities
# (e.g. "5m users").
UNIT_ALIASES = {
    "metres": "meters", "metre": "meters", "meter": "meters",
    "litres": "liters", "litre": "liters", "liter": "liters",
    "kilometres": "kilometers", "kilometre": "kilometers", "kilometer": "kilometers",
    "centimetres": "centimeters", "centimetre": "centimeters", "centimeter": "centimeters",
    "millimetres": "millimeters", "millimetre": "millimeters", "millimeter": "millimeters",
    "grammes": "grams", "gramme": "grams", "gram": "grams",
    "kilogrammes": "kilograms", "kilogramme": "kilograms", "kilogram": "kilograms",
}


def normalize_unit(unit: str) -> str:
    return UNIT_ALIASES.get(unit.lower(), unit.lower())
