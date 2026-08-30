"use client";

import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { ApiError, submitVerification } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Paperclip } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PREFILL_KEY } from "@/components/verify/VerifyForm";

const EXAMPLES = [
  "Is this product genuine?",
  "Is this website legitimate?",
  "Does this claim have evidence?",
  "Is this listing misleading?",
];

export function LandingTeaser() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleVerify() {
    if (!text.trim()) return;
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.localStorage.setItem(PREFILL_KEY, text);
      router.push("/signup");
      return;
    }

    setLoading(true);
    try {
      const result = await submitVerification({ mode: "QUICK_CHECK", text });
      router.push(`/verify/${result.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="rounded-2xl border border-border bg-surface p-3 shadow-sm">
        <Textarea
          rows={3}
          placeholder="Paste a URL, claim, message, or upload evidence..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="border-none px-2 py-2 focus:ring-0"
        />
        <div className="flex items-center justify-between px-1 pt-1">
          <button
            type="button"
            onClick={() => router.push("/signup")}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground hover:bg-accent-soft"
          >
            <Paperclip className="h-4 w-4" /> Upload
          </button>
          <Button onClick={handleVerify} disabled={!text.trim() || loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Investigating…" : "Verify"}
          </Button>
        </div>
      </div>

      {error && <p className="mt-3 text-center text-sm text-contradicted">{error}</p>}

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {EXAMPLES.map((example) => (
          <button
            key={example}
            onClick={() => setText(example)}
            className="rounded-full border border-border px-3.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent-soft hover:text-foreground"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
