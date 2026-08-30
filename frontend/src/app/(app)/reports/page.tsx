import { VerificationList } from "@/components/verify/VerificationList";

export default function ReportsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-2xl font-semibold">Reports</h1>
      <p className="mb-6 text-sm text-muted-foreground">Every verification report you&apos;ve generated.</p>
      <VerificationList />
    </div>
  );
}
