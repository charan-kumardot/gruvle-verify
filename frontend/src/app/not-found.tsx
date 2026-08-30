import { Logo } from "@/components/ui/Logo";
import { LinkButton } from "@/components/ui/Button";
import { SearchX } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Link href="/" className="mb-8">
        <Logo />
      </Link>
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
        <SearchX className="h-6 w-6" />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">We couldn&apos;t find that page</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist, or may have moved.
      </p>
      <div className="mt-8 flex gap-3">
        <LinkButton href="/">Go home</LinkButton>
        <LinkButton href="/dashboard" variant="secondary">Dashboard</LinkButton>
      </div>
    </div>
  );
}
