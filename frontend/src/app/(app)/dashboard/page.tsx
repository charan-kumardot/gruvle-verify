"use client";

import { HistoryRow } from "@/components/verify/HistoryRow";
import { VerifyForm } from "@/components/verify/VerifyForm";
import { getHistory } from "@/lib/api";
import type { HistoryItem } from "@/lib/types";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [recent, setRecent] = useState<HistoryItem[] | null>(null);

  useEffect(() => {
    getHistory({ limit: 5 })
      .then((res) => setRecent(res.items))
      .catch(() => setRecent([]));
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div>
        <h1 className="text-2xl font-semibold">Verify something</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste a link, claim, screenshot, document, or message.
        </p>
        <div className="mt-6 rounded-xl border border-border bg-surface p-5">
          <VerifyForm />
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">Recent verifications</h2>
          <Link href="/history" className="text-sm font-medium text-accent hover:underline">
            View all
          </Link>
        </div>
        <div className="space-y-2">
          {recent === null && <p className="text-sm text-muted">Loading…</p>}
          {recent?.length === 0 && (
            <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
              No verifications yet — try one above.
            </p>
          )}
          {recent?.map((item) => (
            <HistoryRow key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
