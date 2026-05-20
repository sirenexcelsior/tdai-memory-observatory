import Link from "next/link";
import { getCopy } from "@/lib/i18n";
import { getCurrentLanguage } from "@/lib/server-language";

export default async function NotFound() {
  const lang = await getCurrentLanguage();
  const text = getCopy(lang);

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-6 py-16">
      <div className="w-full max-w-2xl rounded-lg border border-[var(--line)] bg-[var(--panel)] p-8 shadow-[var(--shadow)]">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">{text.notFound.eyebrow}</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl text-[var(--fg-strong)]">
          {text.notFound.title}
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--muted)]">
          {text.notFound.detail}
        </p>
        <div className="mt-8">
          <Link
            href="/sessions"
            className="inline-flex h-11 items-center rounded-lg border border-[var(--line-strong)] bg-[var(--panel-strong)] px-4 text-sm text-[var(--fg-strong)]"
          >
            {text.notFound.action}
          </Link>
        </div>
      </div>
    </main>
  );
}
