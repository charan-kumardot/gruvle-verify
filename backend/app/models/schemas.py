"""
Core domain types shared across providers, pipeline stages, and the API layer.

Design rule: anything that ends up in a rendered report traces back to one of these
objects. `Evidence.excerpt` must be a verbatim substring of the source content it was
extracted from (enforced in pipeline/evidence_collection.py) — never a paraphrase
presented as a quote.
"""
from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum

from pydantic import BaseModel, Field


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


# --------------------------------------------------------------------------
# Enums
# --------------------------------------------------------------------------

class ClaimStatus(str, Enum):
    SUPPORTED = "SUPPORTED"
    PARTIALLY_SUPPORTED = "PARTIALLY_SUPPORTED"
    CONTRADICTED = "CONTRADICTED"
    UNVERIFIED = "UNVERIFIED"
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"
    MISLEADING = "MISLEADING"
    TIME_SENSITIVE = "TIME_SENSITIVE"


class ClaimType(str, Enum):
    FACTUAL = "factual"
    NUMERICAL = "numerical"
    TEMPORAL = "temporal"
    COMMERCIAL = "commercial"
    TECHNICAL = "technical"
    IDENTITY = "identity"
    LOCATION = "location"
    FINANCIAL = "financial"
    HISTORICAL = "historical"
    PRODUCT = "product"
    LEGAL = "legal"
    SUBJECTIVE = "subjective"
    PROMOTIONAL = "promotional"


class Verdict(str, Enum):
    VERIFIED = "VERIFIED"
    LIKELY_TRUE = "LIKELY_TRUE"
    PARTIALLY_SUPPORTED = "PARTIALLY_SUPPORTED"
    MISLEADING = "MISLEADING"
    CONTRADICTED = "CONTRADICTED"
    UNVERIFIED = "UNVERIFIED"
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"
    HIGH_RISK = "HIGH_RISK"


class EvidenceRelationship(str, Enum):
    SUPPORTS = "SUPPORTS"
    CONTRADICTS = "CONTRADICTS"
    CONTEXT = "CONTEXT"


class SourceType(str, Enum):
    OFFICIAL = "official"
    PRIMARY = "primary"
    REGULATORY = "regulatory"
    INDEPENDENT_PUBLICATION = "independent_publication"
    TECHNICAL_DOC = "technical_doc"
    COMMERCIAL = "commercial"
    FORUM_UGC = "forum_ugc"
    UNKNOWN = "unknown"


class VerificationMode(str, Enum):
    QUICK_CHECK = "QUICK_CHECK"
    DEEP_CHECK = "DEEP_CHECK"
    DOCUMENT_CHECK = "DOCUMENT_CHECK"
    LISTING_CHECK = "LISTING_CHECK"
    CLAIM_CHECK = "CLAIM_CHECK"
    WEBSITE_CHECK = "WEBSITE_CHECK"
    MESSAGE_CHECK = "MESSAGE_CHECK"


class InputType(str, Enum):
    URL = "url"
    TEXT = "text"
    IMAGE = "image"
    PDF = "pdf"
    DOCUMENT = "document"
    MULTI = "multi"


class RiskLevel(str, Enum):
    LOW = "LOW_RISK"
    MEDIUM = "MEDIUM_RISK"
    SUSPICIOUS = "SUSPICIOUS"
    HIGH = "HIGH_RISK"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"


class EvidenceStrength(str, Enum):
    STRONG = "Strong"
    MODERATE = "Moderate"
    WEAK = "Weak"
    NONE = "None"


# --------------------------------------------------------------------------
# Research / provider payloads
# --------------------------------------------------------------------------

class SearchResult(BaseModel):
    title: str
    url: str
    snippet: str = ""
    published_at: datetime | None = None
    engine: str | None = None


class ExtractedContent(BaseModel):
    url: str
    title: str = ""
    text: str = ""
    published_at: datetime | None = None
    author: str | None = None
    fetch_error: str | None = None


class ImageAnalysis(BaseModel):
    visible_text: str = ""
    detected_objects: list[str] = Field(default_factory=list)
    detected_logos: list[str] = Field(default_factory=list)
    manipulation_indicators: list[str] = Field(default_factory=list)
    notes: str = ""
    provider_used: str = "none"


class ExtractedDocument(BaseModel):
    text: str = ""
    pages: int = 0
    used_ocr: bool = False
    structure_notes: list[str] = Field(default_factory=list)


# --------------------------------------------------------------------------
# Core verification domain objects
# --------------------------------------------------------------------------

class Source(BaseModel):
    id: str
    url: str
    domain: str
    title: str = ""
    source_type: SourceType = SourceType.UNKNOWN
    author: str | None = None
    published_at: datetime | None = None
    retrieved_at: datetime = Field(default_factory=utcnow)
    quality_score: int = 0
    quality_factors: dict[str, str] = Field(default_factory=dict)
    independent: bool = True


class Evidence(BaseModel):
    id: str  # e.g. "EVIDENCE-001"
    claim_id: str
    source_id: str
    excerpt: str
    relationship: EvidenceRelationship
    why_it_matters: str = ""
    extracted_at: datetime = Field(default_factory=utcnow)


class ContradictionRecord(BaseModel):
    claim_id: str
    evidence_id_a: str
    evidence_id_b: str
    description: str
    resolution_note: str | None = None


class Claim(BaseModel):
    id: str  # e.g. "CLAIM-001"
    text: str
    claim_type: ClaimType
    status: ClaimStatus = ClaimStatus.UNVERIFIED
    evidence_for: list[str] = Field(default_factory=list)
    evidence_against: list[str] = Field(default_factory=list)
    evidence_context: list[str] = Field(default_factory=list)
    confidence: int = 0
    rationale: str = ""
    time_sensitive: bool = False


class ConfidenceBreakdown(BaseModel):
    overall: int = 0
    evidence_strength: EvidenceStrength = EvidenceStrength.NONE
    independent_source_count: int = 0
    primary_source_count: int = 0
    contradiction_count: int = 0
    last_verified: datetime = Field(default_factory=utcnow)


class VerificationResult(BaseModel):
    id: str
    user_id: str | None = None
    input_type: InputType
    input_raw: str
    user_question: str | None = None
    mode: VerificationMode
    title: str = ""
    verdict: Verdict = Verdict.INSUFFICIENT_EVIDENCE
    risk_level: RiskLevel | None = None
    confidence: ConfidenceBreakdown = Field(default_factory=ConfidenceBreakdown)
    summary: str = ""
    claims: list[Claim] = Field(default_factory=list)
    evidence: list[Evidence] = Field(default_factory=list)
    sources: list[Source] = Field(default_factory=list)
    contradictions: list[ContradictionRecord] = Field(default_factory=list)
    open_questions: list[str] = Field(default_factory=list)
    next_actions: list[str] = Field(default_factory=list)
    degraded_providers: list[str] = Field(default_factory=list)
    image_analysis: ImageAnalysis | None = None
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)
    tags: list[str] = Field(default_factory=list)
    notes: str | None = None
    saved: bool = False
