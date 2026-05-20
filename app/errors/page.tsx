import { getErrorsPageData } from "@/lib/tdai";
import { getCopy } from "@/lib/i18n";
import { PageSection, StatusBadge } from "@/components/ui";
import { getCurrentLanguage } from "@/lib/server-language";

export default async function ErrorsPage() {
  const lang = await getCurrentLanguage();
  const text = getCopy(lang);
  const data = await getErrorsPageData(lang);

  return (
    <>
      <PageSection
        eyebrow={text.errors.eyebrow}
        title={text.errors.title}
        detail={text.errors.detail}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {data.summaries.map((summary) => (
            <div key={summary.category} className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-4 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">{summary.category}</p>
                  <p className="mt-2 text-3xl text-[var(--fg-strong)]">{summary.count}</p>
                </div>
                <StatusBadge tone="attention">{text.errors.errorClass}</StatusBadge>
              </div>
              <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{summary.sample}</p>
            </div>
          ))}
        </div>
      </PageSection>

      <PageSection
        eyebrow={text.errors.recentEyebrow}
        title={text.errors.recentTitle}
        detail={text.errors.recentDetail}
      >
        <div className="space-y-3">
          {data.recentEntries.map((entry, index) => (
            <div key={`${entry.source}-${index}`} className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-4 py-4">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge tone={entry.severity === "error" ? "attention" : "lagging"}>
                  {entry.source === "stdout" ? text.common.stdout : text.common.stderr}
                </StatusBadge>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{entry.category}</p>
                {entry.timestampGuess ? (
                  <p className="text-xs text-[var(--muted)]">{entry.timestampGuess}</p>
                ) : null}
              </div>
              <pre className="mt-3 overflow-x-auto whitespace-pre-wrap font-[family-name:var(--font-mono)] text-xs leading-6 text-[var(--muted)]">
                {entry.raw}
              </pre>
            </div>
          ))}
        </div>
      </PageSection>
    </>
  );
}
