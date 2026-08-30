import { LinkButton } from "@/components/ui/Button";
import { ReportView } from "@/components/verify/ReportView";
import { EXAMPLE_REPORT } from "@/lib/exampleReport";
import Link from "next/link";

export default function ExamplePage() {
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between px-6 py-5 lg:px-12">
        <Link href="/" className="text-[15px] font-semibold tracking-tight">
          Gruvle Verify
        </Link>
        <LinkButton href="/signup" size="sm">
          Sign up
        </LinkButton>
      </header>

      <div className="border-b border-border bg-caution-soft px-6 py-2 text-center text-xs text-caution">
        This is a fixed example report to show the format — not a live verification.
      </div>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <ReportView result={EXAMPLE_REPORT} />
      </main>
    </div>
  );
}
