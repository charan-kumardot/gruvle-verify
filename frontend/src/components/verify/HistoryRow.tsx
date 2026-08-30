import { VerdictBadge } from "@/components/verify/VerdictBadge";
import type { HistoryItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Star } from "lucide-react";
import Link from "next/link";

export function HistoryRow({ item }: { item: HistoryItem }) {
  return (
    <Link
      href={`/verify/${item.id}`}
      className="flex items-center justify-between gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-accent-soft"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{item.title}</p>
          {item.saved && <Star className="h-3.5 w-3.5 shrink-0 fill-caution text-caution" />}
        </div>
        <p className="mt-0.5 text-xs text-muted">{formatDate(item.created_at)}</p>
      </div>
      <div className="flex shrink-0 items-center gap-4">
        <span className="text-sm font-medium tabular-nums text-muted-foreground">
          {item.confidence.overall}%
        </span>
        <VerdictBadge verdict={item.verdict} />
      </div>
    </Link>
  );
}
