import type { ClaimStatus, RiskLevel, Verdict } from "@/lib/types";

type Tone = "verified" | "contradicted" | "caution" | "neutral";

const VERDICT_TONE: Record<Verdict, Tone> = {
  VERIFIED: "verified",
  LIKELY_TRUE: "verified",
  PARTIALLY_SUPPORTED: "caution",
  MISLEADING: "contradicted",
  CONTRADICTED: "contradicted",
  UNVERIFIED: "neutral",
  INSUFFICIENT_EVIDENCE: "neutral",
  HIGH_RISK: "contradicted",
};

const VERDICT_LABEL: Record<Verdict, string> = {
  VERIFIED: "Verified",
  LIKELY_TRUE: "Likely True",
  PARTIALLY_SUPPORTED: "Partially Supported",
  MISLEADING: "Misleading",
  CONTRADICTED: "Contradicted",
  UNVERIFIED: "Unverified",
  INSUFFICIENT_EVIDENCE: "Insufficient Evidence",
  HIGH_RISK: "High Risk",
};

const CLAIM_STATUS_TONE: Record<ClaimStatus, Tone> = {
  SUPPORTED: "verified",
  PARTIALLY_SUPPORTED: "caution",
  CONTRADICTED: "contradicted",
  UNVERIFIED: "neutral",
  INSUFFICIENT_EVIDENCE: "neutral",
  MISLEADING: "contradicted",
  TIME_SENSITIVE: "caution",
};

const CLAIM_STATUS_LABEL: Record<ClaimStatus, string> = {
  SUPPORTED: "Supported",
  PARTIALLY_SUPPORTED: "Partially Supported",
  CONTRADICTED: "Contradicted",
  UNVERIFIED: "Unverified",
  INSUFFICIENT_EVIDENCE: "Insufficient Evidence",
  MISLEADING: "Misleading",
  TIME_SENSITIVE: "Time-Sensitive",
};

const RISK_TONE: Record<RiskLevel, Tone> = {
  LOW_RISK: "verified",
  MEDIUM_RISK: "caution",
  SUSPICIOUS: "caution",
  HIGH_RISK: "contradicted",
  INSUFFICIENT_DATA: "neutral",
};

const RISK_LABEL: Record<RiskLevel, string> = {
  LOW_RISK: "Low Risk",
  MEDIUM_RISK: "Medium Risk",
  SUSPICIOUS: "Suspicious",
  HIGH_RISK: "High Risk",
  INSUFFICIENT_DATA: "Insufficient Data",
};

const TONE_CLASSES: Record<Tone, string> = {
  verified: "bg-verified-soft text-verified border-verified/20",
  contradicted: "bg-contradicted-soft text-contradicted border-contradicted/20",
  caution: "bg-caution-soft text-caution border-caution/20",
  neutral: "bg-neutral-status-soft text-neutral-status border-neutral-status/20",
};

export function verdictTone(v: Verdict): Tone {
  return VERDICT_TONE[v];
}
export function verdictLabel(v: Verdict): string {
  return VERDICT_LABEL[v];
}
export function claimStatusTone(s: ClaimStatus): Tone {
  return CLAIM_STATUS_TONE[s];
}
export function claimStatusLabel(s: ClaimStatus): string {
  return CLAIM_STATUS_LABEL[s];
}
export function riskTone(r: RiskLevel): Tone {
  return RISK_TONE[r];
}
export function riskLabel(r: RiskLevel): string {
  return RISK_LABEL[r];
}
export function toneClasses(t: Tone): string {
  return TONE_CLASSES[t];
}
