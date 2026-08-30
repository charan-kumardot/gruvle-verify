// Shared logo mark. Keep this SVG in sync with app/icon.svg, app/apple-icon.tsx, and
// app/opengraph-image.tsx — those can't import from here (special Next.js files run
// in a different renderer), so the shape is duplicated deliberately, not by mistake.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="32" height="32" rx="8" fill="#1e3a5f" />
      <path
        d="M16 6.5L24.5 10v6.2c0 5.6-3.6 9.9-8.5 11.3-4.9-1.4-8.5-5.7-8.5-11.3V10L16 6.5Z"
        stroke="#f5f0e8"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M12 16.2l2.6 2.6L20.2 13" stroke="#f5f0e8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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
