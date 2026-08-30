"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useState } from "react";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setMessage("Check your email for a password reset link.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 inline-flex">
          <Logo />
        </Link>
        <h1 className="mb-1 text-2xl font-semibold">Reset your password</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-accent hover:underline">
            Back to log in
          </Link>
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          {error && <p className="text-sm text-contradicted">{error}</p>}
          {message && <p className="text-sm text-verified">{message}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      </div>
    </div>
  );
}
