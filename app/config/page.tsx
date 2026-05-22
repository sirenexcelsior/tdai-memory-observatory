import { getConfigPageData } from "@/lib/tdai";
import { getCopy } from "@/lib/i18n";
import { RuntimeConfigForm } from "@/components/runtime-config-form";
import { DataTable, PageSection, TableHead, TableRow } from "@/components/ui";
import { getCurrentLanguage } from "@/lib/server-language";

export default async function ConfigPage() {
  const lang = await getCurrentLanguage();
  const text = getCopy(lang);
  const data = await getConfigPageData(lang);

  return (
    <>
      <PageSection
        eyebrow={text.config.eyebrow}
        title={text.config.title}
        detail={text.config.detail}
      >
        <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
          <RuntimeConfigForm
            lang={lang}
            initialDataDir={data.runtime.dataDir}
            initialGatewayUrl={data.runtime.gatewayUrl}
            dataDirSource={data.runtime.sources.dataDir}
            gatewayUrlSource={data.runtime.sources.gatewayUrl}
            defaultDataDir={data.runtime.defaults.dataDir}
            defaultGatewayUrl={data.runtime.defaults.gatewayUrl}
          />
          <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">{text.config.checkpointSummary}</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{text.config.totalProcessed}</p>
                <p className="mt-2 text-3xl text-[var(--fg-strong)]">{data.checkpoint.totalProcessed}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{text.config.memoriesSincePersona}</p>
                <p className="mt-2 text-3xl text-[var(--fg-strong)]">{data.checkpoint.memoriesSinceLastPersona}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{text.config.scenesProcessed}</p>
                <p className="mt-2 text-3xl text-[var(--fg-strong)]">{data.checkpoint.scenesProcessed}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{text.config.trackedStates}</p>
                <p className="mt-2 text-3xl text-[var(--fg-strong)]">
                  {data.checkpoint.runnerStates} / {data.checkpoint.pipelineStates}
                </p>
              </div>
            </div>
          </div>
        </div>
      </PageSection>

      <PageSection
        eyebrow={text.config.pathsEyebrow}
        title={text.config.pathsTitle}
        detail={text.config.pathsDetail}
      >
        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">{text.config.environment}</p>
            <div className="mt-4 space-y-3 text-sm">
              {data.environment.map((item) => (
                <div key={item.label} className="flex items-start justify-between gap-4">
                  <span className="text-[var(--muted)]">{item.label}</span>
                  <span className="max-w-sm text-right text-[var(--fg-strong)]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <DataTable>
            <TableHead>
              <tr>
                <th className="px-4 py-3">{text.config.path}</th>
                <th className="px-4 py-3">{text.config.value}</th>
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
        </div>
      </PageSection>

      <PageSection
        eyebrow={text.config.jsonEyebrow}
        title={text.config.jsonTitle}
        detail={text.config.jsonDetail}
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
