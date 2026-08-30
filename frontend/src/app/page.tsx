"use client";

import { ExpandableCard } from "@/components/marketing/ExpandableCard";
import { Faq } from "@/components/marketing/Faq";
import { FadeIn, FadeInStagger, staggerItem } from "@/components/marketing/FadeIn";
import { HeroDemo } from "@/components/marketing/HeroDemo";
import { InteractiveFlow } from "@/components/marketing/InteractiveFlow";
import { LinkButton } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { LandingTeaser } from "@/components/verify/LandingTeaser";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  Car,
  CheckCircle2,
  Eye,
  FileSearch,
  GitCompareArrows,
  Globe,
  Home as HomeIcon,
  Link2,
  MessageSquareWarning,
  Newspaper,
  ScanSearch,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const FLOW = [
  {
    icon: FileSearch,
    label: "Claim",
    description: "We decompose what you submitted into individual, checkable claims.",
    detail: "\"5000mAh battery, 65W charging, waterproof\" becomes three separate claims — each gets its own evidence and its own verdict, instead of one vague yes/no.",
  },
  {
    icon: ScanSearch,
    label: "Evidence",
    description: "We research each claim across multiple independent sources.",
    detail: "Official specs, independent reviews, and retailer listings are searched separately for every claim — never just whichever page loads first.",
  },
  {
    icon: GitCompareArrows,
    label: "Cross-check",
    description: "We score source quality and surface any contradictions.",
    detail: "If the manufacturer says 33W and a lab test says 32W but the listing says 65W, that conflict is shown explicitly — not averaged away or hidden.",
  },
  {
    icon: ShieldCheck,
    label: "Verdict",
    description: "You get a transparent verdict, with every source shown.",
    detail: "Every verdict links back to the evidence that produced it — open any cited source yourself, in one click.",
  },
];

const PRINCIPLES = [
  "No fabricated sources",
  "Every claim cited",
  "Contradictions never hidden",
  "Confidence ≠ certainty",
];

const FEATURES = [
  {
    icon: FileSearch,
    title: "Claim decomposition",
    description: "Every submission is split into discrete, checkable claims — not treated as one vague true/false question.",
    detail: "A 4-sentence product description can become 4+ independently-scored claims, each with its own status.",
  },
  {
    icon: Globe,
    title: "Multi-source research",
    description: "Each claim is researched independently across official, primary, and independent sources — never just one.",
    detail: "One matching source is a coincidence. Three independent ones agreeing is evidence.",
  },
  {
    icon: ShieldCheck,
    title: "Source quality scoring",
    description: "Every source is scored on independence, authorship, and conflict of interest — and the score is explainable.",
    detail: "A manufacturer's own page and an independent lab test don't count the same — and we show you why.",
  },
  {
    icon: GitCompareArrows,
    title: "Contradiction detection",
    description: "When sources disagree, we say so explicitly — including which is newer and which is primary.",
    detail: "Two sources disagreeing isn't an error to hide — it's often the single most useful thing in the report.",
  },
  {
    icon: Link2,
    title: "Auditable evidence chain",
    description: "Every factual statement in a report traces to a numbered evidence ID you can open and verify yourself.",
    detail: "Nothing in a report is asserted without a source you can click through and read yourself.",
  },
  {
    icon: Eye,
    title: "Uncertainty, shown plainly",
    description: "\"What's still uncertain?\" is a required section on every report — not an afterthought.",
    detail: "If we couldn't confirm something, the report says so — instead of quietly rounding uncertainty up to confidence.",
  },
];

const USE_CASES = [
  {
    icon: ShoppingBag,
    title: "Product listings",
    description: "Is this really original, and does it match the seller's claims?",
    detail: "We check specs against the manufacturer's own page and independent reviews — not just the listing itself.",
  },
  {
    icon: Building2,
    title: "Websites & businesses",
    description: "Is this company legitimate, and who's actually behind it?",
    detail: "Domain signals, public registration/contact info, and independent mentions are cross-checked together.",
  },
  {
    icon: Newspaper,
    title: "News & business claims",
    description: "Is this statistic or claim actually supported by evidence?",
    detail: "We trace the number back toward its original source, not just the article repeating it.",
  },
  {
    icon: HomeIcon,
    title: "Property listings",
    description: "Do the details hold up against public evidence?",
    detail: "Listing claims are checked against what's independently discoverable — flagging what isn't.",
  },
  {
    icon: Car,
    title: "Used car listings",
    description: "Are the specs and history consistent, or is something off?",
    detail: "Mileage, condition, and history claims are checked for internal consistency and against public listings.",
  },
  {
    icon: MessageSquareWarning,
    title: "Suspicious messages",
    description: "Is this SMS, email, or DM a social engineering attempt?",
    detail: "We flag urgency language, impersonation signals, and payment/credential requests — and tell you what NOT to click.",
  },
];

const NOT_LIST = ["A generic chatbot", "A simple fact checker", "A deepfake detector", "A search engine"];
const IS_LIST = ["Claim decomposition", "Multi-source research", "Source quality scoring", "An auditable evidence chain"];

function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="group relative py-1 hover:text-foreground">
      {children}
      <span className="absolute inset-x-0 -bottom-0.5 h-px scale-x-0 bg-accent transition-transform duration-300 group-hover:scale-x-100" />
    </a>
  );
}

export default function Home() {
  const scrolled = useScrolled();

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <header
        className={cn(
          "sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md transition-shadow duration-300",
          scrolled ? "border-border shadow-[0_1px_12px_rgba(0,0,0,0.04)]" : "border-transparent",
        )}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
            <NavLink href="#features">Features</NavLink>
            <NavLink href="#use-cases">Use cases</NavLink>
            <NavLink href="#pricing">Pricing</NavLink>
            <NavLink href="#faq">FAQ</NavLink>
          </nav>
          <nav className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Log in
            </Link>
            <LinkButton href="/signup" size="sm" className="transition-transform hover:scale-105 active:scale-95">
              Sign up
            </LinkButton>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative mx-auto max-w-5xl px-6 pb-20 pt-20 lg:pt-28">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute inset-x-0 -top-24 mx-auto h-[420px] max-w-4xl bg-[radial-gradient(ellipse_at_top,_var(--accent-soft),_transparent_70%)] opacity-70" />
            <motion.div
              animate={{ y: [0, -18, 0], x: [0, 12, 0] }}
              transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -left-24 top-40 h-64 w-64 rounded-full bg-accent-soft/60 blur-3xl"
            />
            <motion.div
              animate={{ y: [0, 20, 0], x: [0, -14, 0] }}
              transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-16 top-10 h-56 w-56 rounded-full bg-caution-soft/50 blur-3xl"
            />
          </div>

          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div className="text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground"
              >
                <Sparkles className="h-3 w-3 text-accent" /> An evidence-first verification engine
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.05 }}
                className="text-4xl font-semibold tracking-tight text-balance lg:text-6xl"
              >
                Know what you can trust.
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.12 }}
                className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground text-balance lg:mx-0"
              >
                Investigate claims, listings, websites, documents and online content using
                evidence from multiple sources.
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-6"
              >
                <Link
                  href="/example"
                  className="group inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  See a full example report
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <HeroDemo />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-12"
          >
            <LandingTeaser />
          </motion.div>
        </section>

        {/* Principles strip */}
        <section className="border-y border-border bg-surface/60 py-6">
          <FadeInStagger className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-6">
            {PRINCIPLES.map((p) => (
              <motion.div
                key={p}
                variants={staggerItem}
                whileHover={{ scale: 1.05 }}
                className="flex cursor-default items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <CheckCircle2 className="h-4 w-4 text-verified" />
                {p}
              </motion.div>
            ))}
          </FadeInStagger>
        </section>

        {/* How it works */}
        <section className="py-20">
          <div className="mx-auto max-w-5xl px-6">
            <FadeIn className="mb-12 text-center">
              <p className="text-sm font-medium uppercase tracking-wide text-muted">How it works</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight lg:text-3xl">
                From claim to verdict, every step shown
              </h2>
              <p className="mt-2 text-sm text-muted">Click a step, or watch it play through.</p>
            </FadeIn>
            <FadeIn delay={0.1}>
              <InteractiveFlow steps={FLOW} />
            </FadeIn>
          </div>
        </section>

        {/* Positioning */}
        <section className="border-y border-border bg-surface py-20">
          <div className="mx-auto max-w-4xl px-6">
            <FadeIn className="mb-10 text-center">
              <h2 className="text-2xl font-semibold tracking-tight lg:text-3xl">Not another AI answer box.</h2>
              <p className="mt-2 text-muted-foreground">An evidence-first verification engine, built from four things working together.</p>
            </FadeIn>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FadeIn delay={0.05} className="rounded-xl border border-border p-6">
                <p className="mb-4 text-sm font-semibold text-muted">Gruvle is not</p>
                <FadeInStagger className="space-y-3">
                  {NOT_LIST.map((item) => (
                    <motion.li
                      key={item}
                      variants={staggerItem}
                      className="flex items-center gap-2 text-sm text-muted-foreground line-through decoration-border"
                    >
                      {item}
                    </motion.li>
                  ))}
                </FadeInStagger>
              </FadeIn>
              <FadeIn delay={0.15} className="rounded-xl border border-accent/30 bg-accent-soft p-6">
                <p className="mb-4 text-sm font-semibold text-accent">Gruvle is</p>
                <FadeInStagger className="space-y-3">
                  {IS_LIST.map((item) => (
                    <motion.li
                      key={item}
                      variants={staggerItem}
                      whileHover={{ x: 3 }}
                      className="flex items-center gap-2 text-sm font-medium text-foreground"
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
                      {item}
                    </motion.li>
                  ))}
                </FadeInStagger>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-20">
          <div className="mx-auto max-w-5xl px-6">
            <FadeIn className="mb-12 text-center">
              <p className="text-sm font-medium uppercase tracking-wide text-muted">Features</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight lg:text-3xl">
                The combination that makes it work
              </h2>
              <p className="mt-2 text-sm text-muted">Tap a card for a concrete example.</p>
            </FadeIn>
            <FadeInStagger className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <ExpandableCard key={f.title} icon={f.icon} title={f.title} description={f.description} detail={f.detail} surfaceClassName="bg-surface" />
              ))}
            </FadeInStagger>
          </div>
        </section>

        {/* Use cases */}
        <section id="use-cases" className="border-y border-border bg-surface py-20">
          <div className="mx-auto max-w-5xl px-6">
            <FadeIn className="mb-12 text-center">
              <p className="text-sm font-medium uppercase tracking-wide text-muted">Use cases</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight lg:text-3xl">
                Built for the moment you're not sure
              </h2>
              <p className="mt-2 text-sm text-muted">Tap a card to see what we'd actually check.</p>
            </FadeIn>
            <FadeInStagger className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {USE_CASES.map((u) => (
                <ExpandableCard key={u.title} icon={u.icon} title={u.title} description={u.description} detail={u.detail} surfaceClassName="bg-background" />
              ))}
            </FadeInStagger>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-20">
          <div className="mx-auto max-w-4xl px-6">
            <FadeIn className="mb-12 text-center">
              <p className="text-sm font-medium uppercase tracking-wide text-muted">Pricing</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight lg:text-3xl">Start free. No card required.</h2>
            </FadeIn>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.5 }}
                className="rounded-xl border border-accent/30 bg-accent-soft p-8 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)]"
              >
                <p className="text-sm font-semibold text-accent">Free</p>
                <p className="mt-2 text-3xl font-semibold">$0</p>
                <ul className="mt-6 space-y-2.5 text-sm text-foreground">
                  {["Quick, Deep, Listing, Website, Claim & Message checks", "Full evidence chain on every report", "History, saved reports, and tags", "Watchlist"].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" /> {f}
                    </li>
                  ))}
                </ul>
                <LinkButton href="/signup" className="mt-8 w-full transition-transform hover:scale-[1.02] active:scale-[0.98]">Sign up free</LinkButton>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="rounded-xl border border-border p-8 opacity-80"
              >
                <p className="text-sm font-semibold text-muted">Pro — coming soon</p>
                <p className="mt-2 text-3xl font-semibold text-muted-foreground">TBA</p>
                <ul className="mt-6 space-y-2.5 text-sm text-muted-foreground">
                  {["Higher research depth & volume", "Team workspaces", "API access", "Priority evidence retrieval"].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-muted" /> {f}
                    </li>
                  ))}
                </ul>
                <button disabled className="mt-8 w-full cursor-not-allowed rounded-lg border border-border py-2.5 text-sm font-medium text-muted">
                  Not yet available
                </button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-t border-border bg-surface py-20">
          <div className="mx-auto max-w-2xl px-6">
            <FadeIn className="mb-10 text-center">
              <p className="text-sm font-medium uppercase tracking-wide text-muted">FAQ</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight lg:text-3xl">Common questions</h2>
            </FadeIn>
            <FadeIn delay={0.1}>
              <Faq />
            </FadeIn>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20">
          <FadeIn className="mx-auto max-w-2xl px-6 text-center">
            <h2 className="text-3xl font-semibold tracking-tight lg:text-4xl">Know what you can trust.</h2>
            <p className="mt-3 text-muted-foreground">Give Gruvle a claim, link, image, or document — and see the evidence for yourself.</p>
            <div className="mt-8 flex justify-center gap-3">
              <LinkButton href="/signup" size="lg" className="transition-transform hover:scale-105 active:scale-95">Verify something</LinkButton>
              <LinkButton href="/example" variant="secondary" size="lg" className="transition-transform hover:scale-105 active:scale-95">View example</LinkButton>
            </div>
          </FadeIn>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="flex flex-col justify-between gap-8 sm:flex-row">
            <div>
              <Logo />
              <p className="mt-2 max-w-xs text-xs text-muted">
                Gruvle Verify shows evidence, not certainty — every report distinguishes
                what was found from what remains uncertain.
              </p>
            </div>
            <div className="flex gap-12 text-sm">
              <div>
                <p className="mb-3 font-medium text-muted-foreground">Product</p>
                <ul className="space-y-2 text-muted">
                  <li><a href="#features" className="transition-colors hover:text-foreground">Features</a></li>
                  <li><a href="#pricing" className="transition-colors hover:text-foreground">Pricing</a></li>
                  <li><Link href="/example" className="transition-colors hover:text-foreground">Example report</Link></li>
                </ul>
              </div>
              <div>
                <p className="mb-3 font-medium text-muted-foreground">Legal</p>
                <ul className="space-y-2 text-muted">
                  <li><Link href="/privacy" className="transition-colors hover:text-foreground">Privacy</Link></li>
                  <li><Link href="/terms" className="transition-colors hover:text-foreground">Terms</Link></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-10 border-t border-border pt-6 text-xs text-muted">
            © {new Date().getFullYear()} Gruvle Verify.
          </div>
        </div>
      </footer>
    </div>
  );
}
