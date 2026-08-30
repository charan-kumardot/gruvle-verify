"use client";

import { motion } from "framer-motion";

// Shared logo mark: a badge with a partial "scanning ring" (evidence being
// checked) and a checkmark (the verdict) that draws itself in on mount; hovering
// spins the ring once. Keep this shape in sync with app/icon.svg,
// app/apple-icon.tsx, and app/opengraph-image.tsx — those run in a static/edge
// renderer and can't import this component, so the geometry is duplicated there
// deliberately, not by mistake, and should render as this animation's resting
// (fully drawn, ring at its rotated position) state.

const RING_R = 9.5;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R;
const RING_DASH = `${RING_CIRCUMFERENCE * 0.76} ${RING_CIRCUMFERENCE * 0.24}`;

export function LogoMark({ className }: { className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      initial="rest"
      whileHover="hover"
      animate="rest"
    >
      <rect width="32" height="32" rx="9" fill="#1e3a5f" />
      <motion.g
        style={{ transformOrigin: "16px 16px" }}
        variants={{ rest: { rotate: 0 }, hover: { rotate: 360 } }}
        transition={{ duration: 1.1, ease: "easeInOut" }}
      >
        <motion.circle
          cx="16"
          cy="16"
          r={RING_R}
          stroke="#f5f0e8"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.85"
          strokeDasharray={RING_DASH}
          transform="rotate(-45 16 16)"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 0.85, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </motion.g>
      <motion.path
        d="M10.5 16.3L14 20L22 11"
        stroke="#f5f0e8"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.35, ease: "easeOut" }}
      />
    </motion.svg>
  );
}

export function Logo({ className, textClassName }: { className?: string; textClassName?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <LogoMark className="h-7 w-7 shrink-0" />
      <span className={`text-[15px] font-semibold tracking-tight ${textClassName ?? ""}`}>Gruvle Verify</span>
    </span>
  );
}
