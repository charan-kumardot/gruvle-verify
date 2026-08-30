import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { ClaimList } from "@/components/verify/ClaimList";
import { ConfidenceMeter } from "@/components/verify/ConfidenceMeter";
import { EvidenceGraph } from "@/components/verify/EvidenceGraph";
import { RiskBadge, VerdictBadge } from "@/components/verify/VerdictBadge";
import type { VerificationResult } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

export function ReportView({
  result,
  sidebarExtra,
}: {
  result: VerificationResult;
  sidebarExtra?: React.ReactNode;
}) {
  const primaryClaim = result.claims[0];

  return (
    <div>
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <VerdictBadge verdict={result.verdict} />
          {result.risk_level && <RiskBadge risk={result.risk_level} />}
        </div>
        <h1 className="mt-2 text-2xl font-semibold leading-tight">{result.title}</h1>
        <p className="mt-1 text-sm text-muted">Verified as of {formatDate(result.confidence.last_verified)}</p>
      </div>

      {result.degraded_providers.length > 0 && (
        <div className="mb-6 flex items-start gap-2 rounded-lg border border-caution/20 bg-caution-soft p-3 text-sm text-caution">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Some providers used to build this report ({result.degraded_providers.join(", ")}) were
            operating in a fallback or degraded state — treat this report with extra caution.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold">Summary</h2>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground">{result.summary}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold">Claims</h2>
            </CardHeader>
            <CardContent>
              <ClaimList claims={result.claims} evidence={result.evidence} sources={result.sources} />
            </CardContent>
          </Card>

          {result.contradictions.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold text-contradicted">Contradictions detected</h2>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.contradictions.map((c, i) => (
                  <p key={i} className="text-sm text-foreground">
                    {c.description}
                  </p>
                ))}
              </CardContent>
            </Card>
          )}

          {primaryClaim && (
            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold">Evidence map</h2>
              </CardHeader>
              <CardContent>
                <EvidenceGraph claim={primaryClaim} evidence={result.evidence} sources={result.sources} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold">What&apos;s still uncertain?</h2>
            </CardHeader>
            <CardContent>
              <ul className="list-inside list-disc space-y-1.5 text-sm text-muted-foreground">
                {result.open_questions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold">Recommended next steps</h2>
            </CardHeader>
            <CardContent>
              <ul className="list-inside list-disc space-y-1.5 text-sm text-muted-foreground">
                {result.next_actions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {result.image_analysis && (
            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold">Image analysis</h2>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {result.image_analysis.visible_text && (
                  <p>
                    <span className="font-medium">Visible text: </span>
                    {result.image_analysis.visible_text}
                  </p>
                )}
                {result.image_analysis.manipulation_indicators.length > 0 && (
                  <p>
                    <span className="font-medium">Potential manipulation indicators: </span>
                    {result.image_analysis.manipulation_indicators.join("; ")}
                  </p>
                )}
                {result.image_analysis.notes && <p className="text-muted">{result.image_analysis.notes}</p>}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold">Confidence</h2>
            </CardHeader>
            <CardContent>
              <ConfidenceMeter confidence={result.confidence} />
            </CardContent>
          </Card>
          {sidebarExtra}
        </div>
      </div>
    </div>
  );
}
