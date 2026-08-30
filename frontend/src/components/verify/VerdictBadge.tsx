import { Badge } from "@/components/ui/Badge";
import type { ClaimStatus, RiskLevel, Verdict } from "@/lib/types";
import { claimStatusLabel, claimStatusTone, riskLabel, riskTone, verdictLabel, verdictTone } from "@/lib/verdict";

export function VerdictBadge({ verdict, className }: { verdict: Verdict; className?: string }) {
  return (
    <Badge tone={verdictTone(verdict)} className={className}>
      {verdictLabel(verdict)}
    </Badge>
  );
}

export function ClaimStatusBadge({ status }: { status: ClaimStatus }) {
  return <Badge tone={claimStatusTone(status)}>{claimStatusLabel(status)}</Badge>;
}

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  return <Badge tone={riskTone(risk)}>{riskLabel(risk)}</Badge>;
}
