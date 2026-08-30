"use client";

import { HistoryRow } from "@/components/verify/HistoryRow";
import { Input } from "@/components/ui/Input";
import { getHistory } from "@/lib/api";
import type { HistoryItem, Verdict } from "@/lib/types";
import { useEffect, useState } from "react";

const VERDICT_OPTIONS: Verdict[] = [
  "VERIFIED",
  "LIKELY_TRUE",
  "PARTIALLY_SUPPORTED",
  "MISLEADING",
  "CONTRADICTED",
  "UNVERIFIED",
  "INSUFFICIENT_EVIDENCE",
  "HIGH_RISK",
];

export function VerificationList({
  savedOnly = false,
  showFilters = true,
}: {
  savedOnly?: boolean;
  showFilters?: boolean;
}) {
  const [items, setItems] = useState<HistoryItem[] | null>(null);
  const [search, setSearch] = useState("");
  const [verdict, setVerdict] = useState("");
  const [sort, setSort] = useState("created_at_desc");

  useEffect(() => {
    setItems(null);
    getHistory({ saved_only: savedOnly, search, verdict, sort, limit: 50 })
      .then((res) => setItems(res.items))
      .catch(() => setItems([]));
  }, [savedOnly, search, verdict, sort]);

  return (
    <div>
      {showFilters && (
        <div className="mb-4 flex flex-wrap gap-3">
          <Input
            placeholder="Search by title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <select
            value={verdict}
            onChange={(e) => setVerdict(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          >
            <option value="">All verdicts</option>
            {VERDICT_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {v.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          >
            <option value="created_at_desc">Newest first</option>
            <option value="created_at_asc">Oldest first</option>
            <option value="confidence_desc">Highest confidence</option>
            <option value="confidence_asc">Lowest confidence</option>
          </select>
        </div>
      )}

      <div className="space-y-2">
        {items === null && <p className="text-sm text-muted">Loading…</p>}
        {items?.length === 0 && (
          <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted">
            Nothing here yet.
          </p>
        )}
        {items?.map((item) => (
          <HistoryRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
