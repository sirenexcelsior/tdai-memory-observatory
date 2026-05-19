import { getConfigPageData } from "@/lib/tdai";
import { DataTable, PageSection, TableHead, TableRow } from "@/components/ui";

export default async function ConfigPage() {
  const data = await getConfigPageData();

  return (
    <>
      <PageSection
        eyebrow="Config"
        title="Runtime configuration"
        detail="The page mirrors the local gateway configuration in read-only form and masks secrets before rendering."
      >
        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">Environment</p>
            <div className="mt-4 space-y-3 text-sm">
              {data.environment.map((item) => (
                <div key={item.label} className="flex items-start justify-between gap-4">
                  <span className="text-[var(--muted)]">{item.label}</span>
                  <span className="max-w-sm text-right text-[var(--fg-strong)]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">Checkpoint summary</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Total processed</p>
                <p className="mt-2 text-3xl text-[var(--fg-strong)]">{data.checkpoint.totalProcessed}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Memories since persona</p>
                <p className="mt-2 text-3xl text-[var(--fg-strong)]">{data.checkpoint.memoriesSinceLastPersona}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Scenes processed</p>
                <p className="mt-2 text-3xl text-[var(--fg-strong)]">{data.checkpoint.scenesProcessed}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Tracked states</p>
                <p className="mt-2 text-3xl text-[var(--fg-strong)]">
                  {data.checkpoint.runnerStates} / {data.checkpoint.pipelineStates}
                </p>
              </div>
            </div>
          </div>
        </div>
      </PageSection>

      <PageSection
        eyebrow="Paths"
        title="Local filesystem bindings"
        detail="These are the live files and directories the console is reading."
      >
        <DataTable>
          <TableHead>
            <tr>
              <th className="px-4 py-3">Path</th>
              <th className="px-4 py-3">Value</th>
            </tr>
          </TableHead>
          <tbody>
            {data.paths.map((item) => (
              <TableRow key={item.label}>
                <td className="px-4 py-4 text-[var(--muted)]">{item.label}</td>
                <td className="px-4 py-4 font-[family-name:var(--font-mono)] text-xs text-[var(--fg-strong)]">
                  {item.value}
                </td>
              </TableRow>
            ))}
          </tbody>
        </DataTable>
      </PageSection>

      <PageSection
        eyebrow="Sanitized JSON"
        title="Gateway config payload"
        detail="This is the local `tdai-gateway.json` after secret masking."
      >
        <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-4 py-4">
          <pre className="overflow-x-auto whitespace-pre-wrap font-[family-name:var(--font-mono)] text-xs leading-6 text-[var(--muted)]">
            {JSON.stringify(data.config, null, 2)}
          </pre>
        </div>
      </PageSection>
    </>
  );
}
