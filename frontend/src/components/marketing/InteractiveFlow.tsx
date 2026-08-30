"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

export interface FlowStep {
  icon: LucideIcon;
  label: string;
  description: string;
  detail: string;
}

export function InteractiveFlow({ steps }: { steps: FlowStep[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => setActive((i) => (i + 1) % steps.length), 3200);
    return () => clearInterval(interval);
  }, [paused, steps.length]);

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="relative grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="absolute left-0 right-0 top-5 hidden h-px bg-border lg:block" aria-hidden />
        <motion.div
          className="absolute left-0 top-5 hidden h-px bg-accent lg:block"
          animate={{ width: `${(active / (steps.length - 1)) * 100}%` }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          aria-hidden
        />
        {steps.map((step, i) => {
          const isActive = i === active;
          return (
            <button
              key={step.label}
              onClick={() => setActive(i)}
              className="group relative text-left"
            >
              <div
                className={cn(
                  "relative z-10 mb-3 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors duration-300",
                  isActive ? "border-accent bg-accent text-accent-foreground" : "border-border bg-surface text-muted-foreground group-hover:border-accent/50",
                )}
              >
                <step.icon className="h-4 w-4" />
              </div>
              <span className={cn("text-sm font-semibold transition-colors", isActive ? "text-accent" : "text-foreground")}>
                {i + 1}. {step.label}
              </span>
              <p className="mt-1.5 text-sm text-muted-foreground">{step.description}</p>
            </button>
          );
        })}
      </div>

      <motion.div
        key={active}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mt-8 rounded-xl border border-accent/20 bg-accent-soft px-5 py-4 text-sm text-foreground"
      >
        <span className="font-semibold text-accent">In practice: </span>
        {steps[active].detail}
      </motion.div>
    </div>
  );
}
