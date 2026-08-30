import { cn } from "@/lib/utils";
import { toneClasses } from "@/lib/verdict";

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: "verified" | "contradicted" | "caution" | "neutral";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        toneClasses(tone),
        className,
      )}
    >
      {children}
    </span>
  );
}
