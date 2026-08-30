"use client";

import { Faq } from "@/components/marketing/Faq";
import { FadeIn, FadeInStagger, staggerItem } from "@/components/marketing/FadeIn";
import { LinkButton } from "@/components/ui/Button";
import { LandingTeaser } from "@/components/verify/LandingTeaser";
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

const FLOW = [
  { icon: FileSearch, label: "Claim", description: "We decompose what you submitted into individual, checkable claims." },
  { icon: ScanSearch, label: "Evidence", description: "We research each claim across multiple independent sources." },
  { icon: GitCompareArrows, label: "Cross-check", description: "We score source quality and surface any contradictions." },
  { icon: ShieldCheck, label: "Verdict", description: "You get a transparent verdict, with every source shown." },
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
  },
  {
    icon: Globe,
    title: "Multi-source research",
    description: "Each claim is researched independently across official, primary, and independent sources — never just one.",
  },
  {
    icon: ShieldCheck,
    title: "Source quality scoring",
    description: "Every source is scored on independence, authorship, and conflict of interest — and the score is explainable.",
  },
  {
    icon: GitCompareArrows,
    title: "Contradiction detection",
    description: "When sources disagree, we say so explicitly — including which is newer and which is primary.",
  },
  {
    icon: Link2,
    title: "Auditable evidence chain",
    description: "Every factual statement in a report traces to a numbered evidence ID you can open and verify yourself.",
  },
  {
    icon: Eye,
    title: "Uncertainty, shown plainly",
    description: "\"What's still uncertain?\" is a required section on every report — not an afterthought.",
  },
];

const USE_CASES = [
  { icon: ShoppingBag, title: "Product listings", description: "Is this really original, and does it match the seller's claims?" },
  { icon: Building2, title: "Websites & businesses", description: "Is this company legitimate, and who's actually behind it?" },
  { icon: Newspaper, title: "News & business claims", description: "Is this statistic or claim actually supported by evidence?" },
  { icon: HomeIcon, title: "Property listings", description: "Do the details hold up against public evidence?" },
  { icon: Car, title: "Used car listings", description: "Are the specs and history consistent, or is something off?" },
  { icon: MessageSquareWarning, title: "Suspicious messages", description: "Is this SMS, email, or DM a social engineering attempt?" },
];

const NOT_LIST = ["A generic chatbot", "A simple fact checker", "A deepfake detector", "A search engine"];
const IS_LIST = ["Claim decomposition", "Multi-source research", "Source quality scoring", "An auditable evidence chain"];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-[15px] font-semibold tracking-tight">Gruvle Verify</span>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#use-cases" className="hover:text-foreground">Use cases</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
          </nav>
          <nav className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Log in
            </Link>
            <LinkButton href="/signup" size="sm">
              Sign up
            </LinkButton>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative mx-auto max-w-3xl px-6 pb-16 pt-20 text-center lg:pt-28">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-24 -z-10 mx-auto h-[420px] max-w-4xl bg-[radial-gradient(ellipse_at_top,_var(--accent-soft),_transparent_70%)] opacity-70"
          />
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
            className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground text-balance"
          >
            Investigate claims, listings, websites, documents and online content using
            evidence from multiple sources.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-10"
          >
            <LandingTeaser />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-6"
          >
            <Link
              href="/example"
              className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              View example <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>
        </section>

        {/* Principles strip */}
        <section className="border-y border-border bg-surface/60 py-6">
          <FadeInStagger className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-6">
            {PRINCIPLES.map((p) => (
              <motion.div key={p} variants={staggerItem} className="flex items-center gap-2 text-sm text-muted-foreground">
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
            </FadeIn>
            <FadeInStagger className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {FLOW.map((step, i) => (
                <motion.div key={step.label} variants={staggerItem} className="relative">
                  <div className="flex items-center gap-2 text-accent">
                    <step.icon className="h-5 w-5" />
                    <span className="text-sm font-semibold text-foreground">
                      {i + 1}. {step.label}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
                </motion.div>
              ))}
            </FadeInStagger>
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
                <ul className="space-y-3">
                  {NOT_LIST.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground line-through decoration-border">
                      {item}
                    </li>
                  ))}
                </ul>
              </FadeIn>
              <FadeIn delay={0.15} className="rounded-xl border border-accent/30 bg-accent-soft p-6">
                <p className="mb-4 text-sm font-semibold text-accent">Gruvle is</p>
                <ul className="space-y-3">
                  {IS_LIST.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
                      {item}
                    </li>
                  ))}
                </ul>
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
            </FadeIn>
            <FadeInStagger className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <motion.div
                  key={f.title}
                  variants={staggerItem}
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="rounded-xl border border-border bg-surface p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                >
                  <f.icon className="h-5 w-5 text-accent" />
                  <h3 className="mt-3 text-sm font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{f.description}</p>
                </motion.div>
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
            </FadeIn>
            <FadeInStagger className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {USE_CASES.map((u) => (
                <motion.div
                  key={u.title}
                  variants={staggerItem}
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="rounded-xl border border-border bg-background p-6"
                >
                  <u.icon className="h-5 w-5 text-accent" />
                  <h3 className="mt-3 text-sm font-semibold">{u.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{u.description}</p>
                </motion.div>
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
              <FadeIn delay={0.05} className="rounded-xl border border-accent/30 bg-accent-soft p-8">
                <p className="text-sm font-semibold text-accent">Free</p>
                <p className="mt-2 text-3xl font-semibold">$0</p>
                <ul className="mt-6 space-y-2.5 text-sm text-foreground">
                  {["Quick, Deep, Listing, Website, Claim & Message checks", "Full evidence chain on every report", "History, saved reports, and tags", "Watchlist"].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" /> {f}
                    </li>
                  ))}
                </ul>
                <LinkButton href="/signup" className="mt-8 w-full">Sign up free</LinkButton>
              </FadeIn>
              <FadeIn delay={0.15} className="rounded-xl border border-border p-8 opacity-80">
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
              </FadeIn>
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
              <LinkButton href="/signup" size="lg">Verify something</LinkButton>
              <LinkButton href="/example" variant="secondary" size="lg">View example</LinkButton>
            </div>
          </FadeIn>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="flex flex-col justify-between gap-8 sm:flex-row">
            <div>
              <span className="text-sm font-semibold tracking-tight">Gruvle Verify</span>
              <p className="mt-2 max-w-xs text-xs text-muted">
                Gruvle Verify shows evidence, not certainty — every report distinguishes
                what was found from what remains uncertain.
              </p>
            </div>
            <div className="flex gap-12 text-sm">
              <div>
                <p className="mb-3 font-medium text-muted-foreground">Product</p>
                <ul className="space-y-2 text-muted">
                  <li><a href="#features" className="hover:text-foreground">Features</a></li>
                  <li><a href="#pricing" className="hover:text-foreground">Pricing</a></li>
                  <li><Link href="/example" className="hover:text-foreground">Example report</Link></li>
                </ul>
              </div>
              <div>
                <p className="mb-3 font-medium text-muted-foreground">Legal</p>
                <ul className="space-y-2 text-muted">
                  <li><Link href="/privacy" className="hover:text-foreground">Privacy</Link></li>
                  <li><Link href="/terms" className="hover:text-foreground">Terms</Link></li>
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
