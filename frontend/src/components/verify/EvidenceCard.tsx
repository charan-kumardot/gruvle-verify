import { Badge } from "@/components/ui/Badge";
import type { Evidence, Source } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

const RELATIONSHIP_TONE = {
  SUPPORTS: "verified",
  CONTRADICTS: "contradicted",
  CONTEXT: "neutral",
} as const;

const SOURCE_TYPE_LABEL: Record<Source["source_type"], string> = {
  official: "Official",
  primary: "Primary source",
  regulatory: "Regulatory",
  independent_publication: "Independent publication",
  technical_doc: "Technical documentation",
  commercial: "Commercial",
  forum_ugc: "Forum / user-generated",
  unknown: "Unclassified source",
};

export function EvidenceCard({ evidence, source }: { evidence: Evidence; source: Source | undefined }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{source?.title || source?.domain || "Unknown source"}</p>
          <p className="text-xs text-muted">{source?.domain}</p>
        </div>
        <Badge tone={RELATIONSHIP_TONE[evidence.relationship]}>{evidence.relationship}</Badge>
      </div>

      <blockquote className="mb-3 border-l-2 border-border pl-3 text-sm text-muted-foreground italic">
        &ldquo;{evidence.excerpt}&rdquo;
      </blockquote>

      {evidence.why_it_matters && (
        <p className="mb-3 text-xs text-muted">{evidence.why_it_matters}</p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted">
        <div className="flex flex-wrap items-center gap-3">
          <span>{source ? SOURCE_TYPE_LABEL[source.source_type] : "Unknown"}</span>
          {source?.published_at && <span>Published {formatDate(source.published_at)}</span>}
          {source && <span>Quality {source.quality_score}/100</span>}
        </div>
        {source?.url && (
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
          >
            Open source <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}
