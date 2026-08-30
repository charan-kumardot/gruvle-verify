"use client";

import { Logo } from "@/components/ui/Logo";
import { Button, LinkButton } from "@/components/ui/Button";
import { TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Link href="/" className="mb-8">
        <Logo />
      </Link>
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-contradicted-soft text-contradicted">
        <TriangleAlert className="h-6 w-6" />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        This is on us, not you — the error has been logged. Try again, or head back home.
      </p>
      <div className="mt-8 flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <LinkButton href="/" variant="secondary">Go home</LinkButton>
      </div>
    </div>
  );
}
