"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { addWatchlistItem, deleteWatchlistItem, getWatchlist, WatchlistItem } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchlistItem[] | null>(null);
  const [label, setLabel] = useState("");

  function refresh() {
    getWatchlist()
      .then(setItems)
      .catch(() => setItems([]));
  }

  useEffect(refresh, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    await addWatchlistItem({ label });
    setLabel("");
    refresh();
  }

  async function handleDelete(id: string) {
    await deleteWatchlistItem(id);
    refresh();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold">Watchlist</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Keep track of claims, listings, or entities you want to re-check over time.
      </p>

      <form onSubmit={handleAdd} className="mt-6 flex gap-2">
        <Input
          placeholder={'e.g. "Acme Corp customer count claim"'}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <Button type="submit">Add</Button>
      </form>

      <div className="mt-6 space-y-2">
        {items === null && <p className="text-sm text-muted">Loading…</p>}
        {items?.length === 0 && (
          <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted">
            Nothing on your watchlist yet.
          </p>
        )}
        {items?.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-xs text-muted">Added {formatDate(item.created_at)}</p>
            </div>
            <button onClick={() => handleDelete(item.id)} aria-label="Remove" className="text-muted hover:text-contradicted">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
