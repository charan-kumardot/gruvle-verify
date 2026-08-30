// Mirrors backend/app/models/schemas.py. Keep in sync manually — this is a small
// enough surface that a codegen step would add more ceremony than it saves.

export type ClaimStatus =
  | "SUPPORTED"
  | "PARTIALLY_SUPPORTED"
  | "CONTRADICTED"
  | "UNVERIFIED"
  | "INSUFFICIENT_EVIDENCE"
  | "MISLEADING"
  | "TIME_SENSITIVE";

export type ClaimType =
  | "factual"
  | "numerical"
  | "temporal"
  | "commercial"
  | "technical"
  | "identity"
  | "location"
  | "financial"
  | "historical"
  | "product"
  | "legal"
  | "subjective"
  | "promotional";

export type Verdict =
  | "VERIFIED"
  | "LIKELY_TRUE"
  | "PARTIALLY_SUPPORTED"
  | "MISLEADING"
  | "CONTRADICTED"
  | "UNVERIFIED"
  | "INSUFFICIENT_EVIDENCE"
  | "HIGH_RISK";

export type EvidenceRelationship = "SUPPORTS" | "CONTRADICTS" | "CONTEXT";

export type SourceType =
  | "official"
  | "primary"
  | "regulatory"
  | "independent_publication"
  | "technical_doc"
  | "commercial"
  | "forum_ugc"
  | "unknown";

export type VerificationMode =
  | "QUICK_CHECK"
  | "DEEP_CHECK"
  | "DOCUMENT_CHECK"
  | "LISTING_CHECK"
  | "CLAIM_CHECK"
  | "WEBSITE_CHECK"
  | "MESSAGE_CHECK";

export type InputType = "url" | "text" | "image" | "pdf" | "document" | "multi";

export type RiskLevel =
  | "LOW_RISK"
  | "MEDIUM_RISK"
  | "SUSPICIOUS"
  | "HIGH_RISK"
  | "INSUFFICIENT_DATA";

export type EvidenceStrength = "Strong" | "Moderate" | "Weak" | "None";

export interface Source {
  id: string;
  url: string;
  domain: string;
  title: string;
  source_type: SourceType;
  author: string | null;
  published_at: string | null;
  retrieved_at: string;
  quality_score: number;
  quality_factors: Record<string, string>;
  independent: boolean;
}

export interface Evidence {
  id: string;
  claim_id: string;
  source_id: string;
  excerpt: string;
  relationship: EvidenceRelationship;
  why_it_matters: string;
  extracted_at: string;
}

export interface ContradictionRecord {
  claim_id: string;
  evidence_id_a: string;
  evidence_id_b: string;
  description: string;
  resolution_note: string | null;
}

export interface Claim {
  id: string;
  text: string;
  claim_type: ClaimType;
  status: ClaimStatus;
  evidence_for: string[];
  evidence_against: string[];
  evidence_context: string[];
  confidence: number;
  rationale: string;
  time_sensitive: boolean;
}

export interface ConfidenceBreakdown {
  overall: number;
  evidence_strength: EvidenceStrength;
  independent_source_count: number;
  primary_source_count: number;
  contradiction_count: number;
  last_verified: string;
}

export interface ImageAnalysis {
  visible_text: string;
  detected_objects: string[];
  detected_logos: string[];
  manipulation_indicators: string[];
  notes: string;
  provider_used: string;
}

export interface VerificationResult {
  id: string;
  user_id: string | null;
  input_type: InputType;
  input_raw: string;
  user_question: string | null;
  mode: VerificationMode;
  title: string;
  verdict: Verdict;
  risk_level: RiskLevel | null;
  confidence: ConfidenceBreakdown;
  summary: string;
  claims: Claim[];
  evidence: Evidence[];
  sources: Source[];
  contradictions: ContradictionRecord[];
  open_questions: string[];
  next_actions: string[];
  degraded_providers: string[];
  image_analysis: ImageAnalysis | null;
  created_at: string;
  updated_at: string;
  tags: string[];
  notes: string | null;
  saved: boolean;
}

export interface HistoryItem {
  id: string;
  title: string;
  verdict: Verdict;
  risk_level: RiskLevel | null;
  confidence: ConfidenceBreakdown;
  mode: VerificationMode;
  input_type: InputType;
  tags: string[];
  saved: boolean;
  created_at: string;
}

export interface HistoryResponse {
  items: HistoryItem[];
  total: number;
}

export interface StatusResponse {
  database_configured: boolean;
  ai_providers_configured: string[];
  search_provider_configured: boolean;
  vision_configured: boolean;
  email_configured: boolean;
}

export interface Profile {
  id: string;
  verification_interests: string[];
  usual_verification_method: string | null;
  onboarding_completed: boolean;
}
