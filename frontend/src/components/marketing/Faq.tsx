"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

const FAQS = [
  {
    q: "How is this different from just asking an AI chatbot?",
    a: "A chatbot answers from its training data and can sound confident either way. Gruvle decomposes your input into individual claims, researches each one across live sources, scores those sources, and shows you the evidence — the AI's role is to reason over that evidence, not replace it.",
  },
  {
    q: "Does Gruvle ever fabricate sources or quotes?",
    a: "No. Every excerpt shown in a report is a verbatim substring of content actually retrieved from that source. If we can't find evidence for a claim, the report says so explicitly — it never fills the gap with a plausible-sounding guess.",
  },
  {
    q: "What does \"confidence\" actually mean here?",
    a: "It's not how sure the AI sounds — it's a score computed from source quality, independence, agreement across sources, and contradictions found. Two providers disagreeing will lower confidence even if the AI's language sounds certain.",
  },
  {
    q: "What happens when there isn't enough evidence?",
    a: "The report says \"insufficient evidence\" rather than guessing. Every report also has a \"What's still uncertain?\" section — surfacing what we couldn't confirm is treated as core information, not a footnote.",
  },
  {
    q: "Is my verification history private?",
    a: "Yes. Reports are tied to your account and protected by row-level security — only you can read your own history, saved reports, and notes.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-border rounded-xl border border-border bg-surface">
      {FAQS.map((item, i) => (
        <div key={item.q}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
          >
            <span className="text-sm font-medium">{item.q}</span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-muted transition-transform duration-300 ${open === i ? "rotate-180" : ""}`}
            />
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <p className="px-5 pb-4 text-sm text-muted-foreground">{item.a}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
