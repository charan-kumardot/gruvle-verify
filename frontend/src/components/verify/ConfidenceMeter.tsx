import type { ConfidenceBreakdown } from "@/lib/types";
import { formatDate } from "@/lib/utils";

function barColor(score: number): string {
  if (score >= 75) return "bg-verified";
  if (score >= 40) return "bg-caution";
  if (score > 0) return "bg-contradicted";
  return "bg-neutral-status";
}

export function ConfidenceMeter({ confidence }: { confidence: ConfidenceBreakdown }) {
  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="text-sm font-medium text-muted-foreground">Confidence</span>
          <span className="text-2xl font-semibold tabular-nums">{confidence.overall}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-border">
          <div
            className={`h-full rounded-full ${barColor(confidence.overall)}`}
            style={{ width: `${confidence.overall}%` }}
          />
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-muted">Evidence strength</dt>
          <dd className="font-medium">{confidence.evidence_strength}</dd>
        </div>
        <div>
          <dt className="text-muted">Independent sources</dt>
          <dd className="font-medium">{confidence.independent_source_count}</dd>
        </div>
        <div>
          <dt className="text-muted">Primary sources</dt>
          <dd className="font-medium">{confidence.primary_source_count}</dd>
        </div>
        <div>
          <dt className="text-muted">Contradictions</dt>
          <dd className="font-medium">{confidence.contradiction_count}</dd>
        </div>
      </dl>

      <p className="text-xs text-muted">Verified as of {formatDate(confidence.last_verified)}</p>
    </div>
  );
}
