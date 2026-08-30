import { LandingTeaser } from "@/components/verify/LandingTeaser";
import { LinkButton } from "@/components/ui/Button";
import { ArrowRight, FileSearch, GitCompareArrows, ScanSearch, ShieldCheck } from "lucide-react";
import Link from "next/link";

const FLOW = [
  { icon: FileSearch, label: "Claim", description: "We decompose what you submitted into individual, checkable claims." },
  { icon: ScanSearch, label: "Evidence", description: "We research each claim across multiple independent sources." },
  { icon: GitCompareArrows, label: "Cross-check", description: "We score source quality and surface any contradictions." },
  { icon: ShieldCheck, label: "Verdict", description: "You get a transparent verdict, with every source shown." },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-5 lg:px-12">
        <span className="text-[15px] font-semibold tracking-tight">Gruvle Verify</span>
        <nav className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Log in
          </Link>
          <LinkButton href="/signup" size="sm">
            Sign up
          </LinkButton>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-6 pb-16 pt-16 text-center lg:pt-24">
          <h1 className="text-4xl font-semibold tracking-tight text-balance lg:text-5xl">
            Know what you can trust.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground text-balance">
            Investigate claims, listings, websites, documents and online content using
            evidence from multiple sources.
          </p>

          <div className="mt-10">
            <LandingTeaser />
          </div>

          <div className="mt-6">
            <Link
              href="/example"
              className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              View example <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>

        <section className="border-t border-border bg-surface py-16">
          <div className="mx-auto max-w-5xl px-6">
            <p className="mb-10 text-center text-sm font-medium uppercase tracking-wide text-muted">
              An evidence-first verification engine
            </p>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {FLOW.map((step, i) => (
                <div key={step.label} className="relative">
                  <div className="flex items-center gap-2 text-accent">
                    <step.icon className="h-5 w-5" />
                    <span className="text-sm font-semibold text-foreground">
                      {i + 1}. {step.label}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-8 text-center text-xs text-muted lg:px-12">
        Gruvle Verify shows evidence, not certainty — every report distinguishes what
        was found from what remains uncertain.
      </footer>
    </div>
  );
}
