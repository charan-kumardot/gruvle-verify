import Link from "next/link";

export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
        ← Back
      </Link>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted">Last updated: August 30, 2026</p>

      <div className="prose-sm mt-8 space-y-6 text-sm leading-relaxed text-foreground">
        <p>
          Gruvle Verify is an early-stage product provided on an as-is basis. By using it,
          you agree to the terms below. This is a plain-language summary appropriate for a
          beta product, not a substitute for formal legal review.
        </p>

        <section>
          <h2 className="text-base font-semibold">What Gruvle Verify is</h2>
          <p className="mt-2 text-muted-foreground">
            An evidence-research tool. Reports combine automated web research and AI
            reasoning to show you what evidence exists for a claim, and how strong it is.
            Reports are not legal, financial, medical, or safety advice, and a verdict is
            not a guarantee of truth — it reflects the evidence found at the time of the
            check.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">No fabrication, by design — and its limits</h2>
          <p className="mt-2 text-muted-foreground">
            We design the system to never invent sources, quotes, or statistics, and to
            say "insufficient evidence" rather than guess. AI reasoning can still make
            mistakes in judgment even when the underlying evidence is real — always open
            the cited sources yourself before relying on a report for a decision that
            matters (a purchase, a safety concern, a legal or financial choice).
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Acceptable use</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-muted-foreground">
            <li>Don't use Gruvle Verify to harass, defame, or build dossiers on private individuals.</li>
            <li>Don't submit content you don't have the right to share.</li>
            <li>Don't attempt to abuse, overload, or reverse-engineer the service.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold">Availability</h2>
          <p className="mt-2 text-muted-foreground">
            This is a beta product built on free-tier infrastructure and third-party AI
            providers. Features, providers, and availability may change, and the service
            may occasionally run in a degraded mode (fewer sources, lower confidence) when
            an underlying provider is unavailable — reports say so when this happens.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Contact</h2>
          <p className="mt-2 text-muted-foreground">
            Questions about these terms: <a href="mailto:charanrio08@gmail.com" className="text-accent hover:underline">charanrio08@gmail.com</a>
          </p>
        </section>
      </div>
    </div>
  );
}
