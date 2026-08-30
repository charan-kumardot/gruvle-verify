import { VerifyForm } from "@/components/verify/VerifyForm";

export default function VerifyPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold">Verify something</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Choose a mode, then paste a link, claim, screenshot, document, or message.
      </p>
      <div className="mt-6 rounded-xl border border-border bg-surface p-5">
        <VerifyForm />
      </div>
    </div>
  );
}
