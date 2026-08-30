import Link from "next/link";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
        ← Back
      </Link>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted">Last updated: August 30, 2026</p>

      <div className="prose-sm mt-8 space-y-6 text-sm leading-relaxed text-foreground">
        <p>
          Gruvle Verify is an early-stage product. This policy describes what we collect
          and why, in plain language. It is not a substitute for professional legal advice,
          and we intend to have it formally reviewed as the product matures.
        </p>

        <section>
          <h2 className="text-base font-semibold">What we collect</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-muted-foreground">
            <li>Account information: your email address, managed via Supabase Auth.</li>
            <li>
              Verification content: whatever you submit to verify — text, URLs, images, or
              documents — plus the resulting report (claims, evidence, sources, your notes
              and tags).
            </li>
            <li>Basic usage data needed to operate the service (e.g. request logs for debugging).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold">How it's used</h2>
          <p className="mt-2 text-muted-foreground">
            Submitted content is sent to third-party AI providers (e.g. Google Gemini, Groq,
            OpenRouter) and search infrastructure to generate your verification report.
            We don't sell your data. We don't use your verification content to train our
            own models.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Where it's stored</h2>
          <p className="mt-2 text-muted-foreground">
            Account and verification data is stored in Supabase (PostgreSQL) with row-level
            security enabled — only your own account can read your own verifications, notes,
            and watchlist.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Your controls</h2>
          <p className="mt-2 text-muted-foreground">
            You can delete individual reports from within the app. To delete your account
            and all associated data entirely, contact us at the address below.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Contact</h2>
          <p className="mt-2 text-muted-foreground">
            Questions about this policy: <a href="mailto:charanrio08@gmail.com" className="text-accent hover:underline">charanrio08@gmail.com</a>
          </p>
        </section>
      </div>
    </div>
  );
}
