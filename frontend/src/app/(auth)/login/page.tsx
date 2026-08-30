"use client";

import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNeedsConfirmation(false);
    setResendMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      if (error.message.toLowerCase().includes("confirm")) {
        setNeedsConfirmation(true);
      }
      return;
    }
    router.push(searchParams.get("next") || "/dashboard");
    router.refresh();
  }

  async function handleResendConfirmation() {
    setResendMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setResendMessage(error ? error.message : "Confirmation email sent — check your inbox.");
  }

  async function handleMagicLink() {
    if (!email) {
      setError("Enter your email first.");
      return;
    }
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setError(error ? error.message : "Check your email for a magic link.");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium">Email</label>
        <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="block text-sm font-medium">Password</label>
          <Link href="/reset-password" className="text-xs text-muted-foreground hover:text-foreground">
            Forgot password?
          </Link>
        </div>
        <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      {error && <p className="text-sm text-contradicted">{error}</p>}
      {needsConfirmation && (
        <button
          type="button"
          onClick={handleResendConfirmation}
          className="text-sm font-medium text-accent hover:underline"
        >
          Resend confirmation email
        </button>
      )}
      {resendMessage && <p className="text-sm text-verified">{resendMessage}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Logging in…" : "Log in"}
      </Button>
      <button
        type="button"
        onClick={handleMagicLink}
        className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
      >
        Or send me a magic link
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 inline-flex">
          <Logo />
        </Link>
        <h1 className="mb-1 text-2xl font-semibold">Log in</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-accent hover:underline">
            Sign up
          </Link>
        </p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
