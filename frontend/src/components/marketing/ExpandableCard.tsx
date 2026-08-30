"use client";

import { staggerItem } from "@/components/marketing/FadeIn";
import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export function ExpandableCard({
  icon: Icon,
  title,
  description,
  detail,
  surfaceClassName = "bg-background",
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  detail: string;
  surfaceClassName?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <motion.button
      type="button"
      variants={staggerItem}
      onClick={() => setOpen((v) => !v)}
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`group w-full rounded-xl border border-border ${surfaceClassName} p-6 text-left transition-shadow hover:border-accent/40 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]`}
    >
      <div className="flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent transition-transform duration-300 group-hover:scale-110">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <ChevronDown className={`h-4 w-4 text-muted transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </div>
      <h3 className="mt-3 text-sm font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">{detail}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
