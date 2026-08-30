"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Search, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

type Phase = "claim" | "research" | "verdict";

interface Scenario {
  claim: string;
  sources: { domain: string; relation: "supports" | "contradicts" | "context" }[];
  verdict: string;
  confidence: number;
  tone: "caution" | "verified";
}

// Illustrative only — same convention as the static /example report (placeholder
// domains, not real sites or real evidence). This demonstrates the mechanism for
// a first-time visitor; it is never presented as a live or real verification.
const SCENARIOS: Scenario[] = [
  {
    claim: "“This charger supports 65W fast charging.”",
    sources: [
      { domain: "official-spec-sheet.com", relation: "contradicts" },
      { domain: "independent-lab-review.com", relation: "contradicts" },
      { domain: "retailer-listing.com", relation: "context" },
    ],
    verdict: "Contradicted",
    confidence: 18,
    tone: "caution",
  },
  {
    claim: "“Seller has a verified return policy.”",
    sources: [
      { domain: "marketplace-policy.com", relation: "supports" },
      { domain: "buyer-forum.com", relation: "supports" },
      { domain: "seller-profile.com", relation: "context" },
    ],
    verdict: "Supported",
    confidence: 84,
    tone: "verified",
  },
  {
    claim: "“Listed mileage matches service history.”",
    sources: [
      { domain: "dealer-listing.com", relation: "context" },
      { domain: "service-records.com", relation: "contradicts" },
      { domain: "inspection-report.com", relation: "contradicts" },
    ],
    verdict: "Contradicted",
    confidence: 12,
    tone: "caution",
  },
];

const RELATION_STYLE = {
  supports: { dot: "bg-verified", icon: CheckCircle2, color: "text-verified" },
  contradicts: { dot: "bg-contradicted", icon: XCircle, color: "text-contradicted" },
  context: { dot: "bg-neutral-status", icon: Search, color: "text-muted" },
} as const;

const PHASE_DURATIONS: Record<Phase, number> = { claim: 1400, research: 2400, verdict: 2600 };

export function HeroDemo() {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("claim");
  const [visibleSources, setVisibleSources] = useState(0);

  const scenario = SCENARIOS[scenarioIndex];

  useEffect(() => {
    setVisibleSources(0);
    const timer = setTimeout(() => {
      if (phase === "claim") setPhase("research");
      else if (phase === "research") setPhase("verdict");
      else {
        setPhase("claim");
        setScenarioIndex((i) => (i + 1) % SCENARIOS.length);
      }
    }, PHASE_DURATIONS[phase]);
    return () => clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "research") return;
    const interval = setInterval(() => {
      setVisibleSources((n) => Math.min(n + 1, scenario.sources.length));
    }, 550);
    return () => clearInterval(interval);
  }, [phase, scenario.sources.length]);

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-surface p-5 text-left shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted">Illustrative example</span>
        <div className="flex gap-1">
          {SCENARIOS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${i === scenarioIndex ? "bg-accent" : "bg-border"}`}
            />
          ))}
        </div>
      </div>

      <div className="min-h-[172px]">
        <AnimatePresence mode="wait">
          {phase === "claim" && (
            <motion.div
              key={`claim-${scenarioIndex}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex h-[172px] flex-col justify-center"
            >
              <p className="text-xs font-medium text-muted">Claim submitted</p>
              <p className="mt-2 text-base font-medium leading-snug">{scenario.claim}</p>
            </motion.div>
          )}

          {phase === "research" && (
            <motion.div
              key={`research-${scenarioIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-[172px]"
            >
              <p className="mb-3 flex items-center gap-1.5 text-xs font-medium text-muted">
                <Search className="h-3 w-3 animate-pulse" /> Researching across sources…
              </p>
              <div className="space-y-2.5">
                {scenario.sources.map((s, i) => {
                  const style = RELATION_STYLE[s.relation];
                  const shown = i < visibleSources;
                  return (
                    <motion.div
                      key={s.domain}
                      initial={{ opacity: 0, x: -8 }}
                      animate={shown ? { opacity: 1, x: 0 } : { opacity: 0.15, x: -8 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                      <span className="text-muted-foreground">{s.domain}</span>
                      {shown && <style.icon className={`h-3.5 w-3.5 ${style.color}`} />}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {phase === "verdict" && (
            <motion.div
              key={`verdict-${scenarioIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-[172px] flex-col justify-center"
            >
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
                className={`inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                  scenario.tone === "verified" ? "border-verified/20 bg-verified-soft text-verified" : "border-caution/20 bg-caution-soft text-caution"
                }`}
              >
                {scenario.verdict}
              </motion.span>
              <p className="mt-3 text-xs font-medium text-muted">Confidence</p>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-border">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${scenario.confidence}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`h-full rounded-full ${scenario.tone === "verified" ? "bg-verified" : "bg-caution"}`}
                />
              </div>
              <p className="mt-1 text-right text-xs font-semibold tabular-nums">{scenario.confidence}%</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
