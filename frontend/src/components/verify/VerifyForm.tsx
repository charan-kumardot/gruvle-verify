"use client";

import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { VoiceInputButton } from "@/components/verify/VoiceInputButton";
import { ApiError, submitVerification } from "@/lib/api";
import type { VerificationMode } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Loader2, Paperclip, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const MODES: { value: VerificationMode; label: string; description: string }[] = [
  { value: "QUICK_CHECK", label: "Quick Check", description: "Fast, limited sources" },
  { value: "DEEP_CHECK", label: "Deep Check", description: "Comprehensive research" },
  { value: "LISTING_CHECK", label: "Listing Check", description: "Product / property / vehicle" },
  { value: "WEBSITE_CHECK", label: "Website Check", description: "Site & company trust" },
  { value: "CLAIM_CHECK", label: "Claim Check", description: "Focused fact check" },
  { value: "MESSAGE_CHECK", label: "Message Check", description: "Suspicious message" },
  { value: "DOCUMENT_CHECK", label: "Document Check", description: "PDF / document analysis" },
];

const PREFILL_KEY = "gruvle_prefill_input";

export function VerifyForm() {
  const router = useRouter();
  const [mode, setMode] = useState<VerificationMode>("QUICK_CHECK");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [question, setQuestion] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [inputKind, setInputKind] = useState<"text" | "url" | "files">("text");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const prefill = typeof window !== "undefined" ? window.localStorage.getItem(PREFILL_KEY) : null;
    if (prefill) {
      setText(prefill);
      window.localStorage.removeItem(PREFILL_KEY);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await submitVerification({
        mode,
        text: inputKind === "text" ? text : undefined,
        url: inputKind === "url" ? url : undefined,
        files: inputKind === "files" ? files : undefined,
        question: question || undefined,
      });
      router.push(`/verify/${result.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const canSubmit =
    (inputKind === "text" && text.trim().length > 0) ||
    (inputKind === "url" && url.trim().length > 0) ||
    (inputKind === "files" && files.length > 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => setMode(m.value)}
            title={m.description}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              mode === m.value
                ? "border-accent bg-accent-soft text-accent"
                : "border-border text-muted-foreground hover:bg-accent-soft",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="flex gap-1 rounded-lg bg-accent-soft p-1 text-sm w-fit">
        {(["text", "url", "files"] as const).map((kind) => (
          <button
            key={kind}
            type="button"
            onClick={() => setInputKind(kind)}
            className={cn(
              "rounded-md px-3 py-1.5 font-medium capitalize transition-colors",
              inputKind === kind ? "bg-surface shadow-sm" : "text-muted-foreground",
            )}
          >
            {kind === "url" ? "URL" : kind}
          </button>
        ))}
      </div>

      {inputKind === "text" && (
        <div className="relative">
          <Textarea
            rows={6}
            placeholder="Paste a claim, message, or listing description to verify..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="pr-14"
          />
          <VoiceInputButton
            onTranscribed={(spoken) => setText((prev) => (prev ? `${prev} ${spoken}` : spoken))}
            className="absolute bottom-3 right-3"
          />
        </div>
      )}
      {inputKind === "url" && (
        <Input
          type="url"
          placeholder="https://example.com/product-listing"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      )}
      {inputKind === "files" && (
        <div>
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-border p-8 text-center hover:bg-accent-soft">
            <Paperclip className="h-5 w-5 text-muted" />
            <span className="text-sm text-muted-foreground">
              Upload a screenshot, image, PDF, or document
            </span>
            <input
              type="file"
              className="hidden"
              multiple
              accept="image/*,.pdf,.docx"
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            />
          </label>
          {files.length > 0 && (
            <ul className="mt-2 space-y-1">
              {files.map((f, i) => (
                <li key={i} className="flex items-center justify-between rounded-md bg-accent-soft px-3 py-1.5 text-sm">
                  {f.name}
                  <button
                    type="button"
                    onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                    aria-label="Remove file"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <Input
        placeholder={'Optional: what do you want to know? e.g. "Is this safe to buy?"'}
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />

      {error && <p className="text-sm text-contradicted">{error}</p>}

      <Button type="submit" size="lg" disabled={!canSubmit || loading} className="w-full sm:w-auto">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? "Investigating…" : "Verify"}
      </Button>
    </form>
  );
}

export { PREFILL_KEY };
