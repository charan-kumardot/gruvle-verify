import type { Claim, Evidence, Source } from "@/lib/types";

const DOT_COLOR: Record<Evidence["relationship"], string> = {
  SUPPORTS: "bg-verified",
  CONTRADICTS: "bg-contradicted",
  CONTEXT: "bg-neutral-status",
};

export function EvidenceGraph({
  claim,
  evidence,
  sources,
}: {
  claim: Claim;
  evidence: Evidence[];
  sources: Source[];
}) {
  const sourceById = new Map(sources.map((s) => [s.id, s]));
  const items = [...claim.evidence_for, ...claim.evidence_against, ...claim.evidence_context]
    .map((id) => evidence.find((e) => e.id === id))
    .filter((e): e is Evidence => !!e);

  if (items.length === 0) {
    return <p className="text-sm text-muted">No evidence to map for this claim yet.</p>;
  }

  return (
    <div className="flex flex-col items-start">
      <div className="rounded-lg border border-border bg-accent-soft px-3 py-2 text-sm font-medium">
        {claim.text}
      </div>
      <div className="ml-4 mt-2 border-l-2 border-border pl-4">
        {items.map((e) => {
          const source = sourceById.get(e.source_id);
          return (
            <div key={e.id} className="relative py-1.5">
              <span
                className={`absolute -left-[21px] top-3 h-2.5 w-2.5 rounded-full ${DOT_COLOR[e.relationship]}`}
              />
              <span className="text-sm">
                <span className="font-medium">{source?.domain ?? "Unknown"}</span>{" "}
                <span className="text-xs uppercase text-muted">{e.relationship}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
