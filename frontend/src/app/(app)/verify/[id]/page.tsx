"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Input";
import { ReportView } from "@/components/verify/ReportView";
import { ApiError, deleteReport, getVerification, updateReport } from "@/lib/api";
import type { VerificationResult } from "@/lib/types";
import { Check, Copy, Loader2, Star, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const TAG_OPTIONS = ["Purchase", "Research", "Work", "Business", "Safety", "Travel", "Other"];

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getVerification(id)
      .then((r) => {
        setResult(r);
        setNotes(r.notes ?? "");
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load report."));
  }, [id]);

  async function toggleSaved() {
    if (!result) return;
    const saved = !result.saved;
    setResult({ ...result, saved });
    try {
      await updateReport(result.id, { saved });
    } catch {
      setResult({ ...result, saved: !saved });
    }
  }

  async function toggleTag(tag: string) {
    if (!result) return;
    const tags = result.tags.includes(tag) ? result.tags.filter((t) => t !== tag) : [...result.tags, tag];
    setResult({ ...result, tags });
    try {
      await updateReport(result.id, { tags });
    } catch {
      // best-effort — leave the optimistic state
    }
  }

  async function saveNotes() {
    if (!result) return;
    try {
      await updateReport(result.id, { notes });
    } catch {
      // best-effort
    }
  }

  async function handleDelete() {
    if (!result || !confirm("Delete this verification permanently?")) return;
    await deleteReport(result.id);
    router.push("/history");
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (error) {
    return <p className="text-sm text-contradicted">{error}</p>;
  }
  if (!result) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading report…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={toggleSaved}>
          <Star className={`h-3.5 w-3.5 ${result.saved ? "fill-caution text-caution" : ""}`} />
          {result.saved ? "Saved" : "Save"}
        </Button>
        <Button variant="secondary" size="sm" onClick={copyLink}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy link"}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleDelete}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <ReportView
        result={result}
        sidebarExtra={
          <>
            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold">Tags</h2>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {TAG_OPTIONS.map((tag) => (
                    <button key={tag} onClick={() => toggleTag(tag)}>
                      <Badge tone={result.tags.includes(tag) ? "verified" : "neutral"}>{tag}</Badge>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold">Notes</h2>
              </CardHeader>
              <CardContent>
                <Textarea
                  rows={4}
                  placeholder="Add a private note…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={saveNotes}
                />
              </CardContent>
            </Card>
          </>
        }
      />
    </div>
  );
}
