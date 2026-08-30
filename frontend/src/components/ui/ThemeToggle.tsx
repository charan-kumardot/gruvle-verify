"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";
const STORAGE_KEY = "gruvle-theme";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}

const OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "system";
    setTheme(stored);
    setMounted(true);
  }, []);

  function select(value: Theme) {
    setTheme(value);
    localStorage.setItem(STORAGE_KEY, value);
    applyTheme(value);
  }

  if (!mounted) return <div className="h-9 w-[132px]" aria-hidden />;

  return (
    <div className="inline-flex rounded-lg border border-border bg-surface p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => select(opt.value)}
          aria-label={opt.label}
          title={opt.label}
          className={`flex h-7 w-9 items-center justify-center rounded-md transition-colors ${
            theme === opt.value ? "bg-accent-soft text-accent" : "text-muted hover:text-foreground"
          }`}
        >
          <opt.icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}
