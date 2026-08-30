"use client";

import { EvidenceCard } from "@/components/verify/EvidenceCard";
import { ClaimStatusBadge } from "@/components/verify/VerdictBadge";
import type { Claim, Evidence, Source } from "@/lib/types";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export function ClaimList({
  claims,
  evidence,
  sources,
}: {
  claims: Claim[];
  evidence: Evidence[];
  sources: Source[];
}) {
  const [openId, setOpenId] = useState<string | null>(claims[0]?.id ?? null);
  const evidenceById = new Map(evidence.map((e) => [e.id, e]));
  const sourceById = new Map(sources.map((s) => [s.id, s]));

  return (
    <div className="divide-y divide-border">
      {claims.map((claim) => {
        const isOpen = openId === claim.id;
        const allEvidenceIds = [...claim.evidence_for, ...claim.evidence_against, ...claim.evidence_context];
        return (
          <div key={claim.id} className="py-4 first:pt-0 last:pb-0">
            <button
              className="flex w-full items-start justify-between gap-4 text-left"
              onClick={() => setOpenId(isOpen ? null : claim.id)}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-snug">{claim.text}</p>
                <p className="mt-1 text-xs capitalize text-muted">{claim.claim_type} claim</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <ClaimStatusBadge status={claim.status} />
                <ChevronDown
                  className={`h-4 w-4 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </div>
            </button>

            {isOpen && (
              <div className="mt-4 space-y-3 border-l-2 border-border pl-4">
                {claim.rationale && (
                  <p className="text-sm text-muted-foreground">{claim.rationale}</p>
                )}
                {allEvidenceIds.length === 0 ? (
                  <p className="text-sm text-muted">No evidence was collected for this claim.</p>
                ) : (
                  <div className="space-y-3">
                    {allEvidenceIds.map((id) => {
                      const e = evidenceById.get(id);
                      if (!e) return null;
                      return <EvidenceCard key={id} evidence={e} source={sourceById.get(e.source_id)} />;
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
