"use client";

import { useTransition } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Languages } from "lucide-react";
import type { Language } from "@/lib/i18n";
import { useRouter } from "next/navigation";

export function LanguageToggle({ current }: { current: Language }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const search = searchParams.toString();
  const redirect = `${pathname}${search ? `?${search}` : ""}`;

  function switchLanguage(next: Language) {
    if (next === current || isPending) return;

    startTransition(async () => {
      await fetch(`/api/language?lang=${next}&redirect=${encodeURIComponent(redirect)}`, {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
      });

      router.refresh();
    });
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--panel)] p-1">
      <span className="inline-flex h-8 w-8 items-center justify-center text-[var(--muted)]">
        <Languages className="h-4 w-4" />
      </span>
      {([
        ["zh", "中文"],
        ["en", "EN"],
      ] as const).map(([value, label]) => {
        const active = current === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => switchLanguage(value)}
            className={[
              "inline-flex h-8 min-w-12 items-center justify-center rounded-full px-3 text-xs transition-colors",
              active
                ? "bg-[var(--panel-strong)] text-[var(--fg-strong)]"
                : "text-[var(--muted)] hover:text-[var(--fg)]",
              isPending ? "opacity-70" : "",
            ].join(" ")}
            aria-pressed={active}
            disabled={isPending}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
