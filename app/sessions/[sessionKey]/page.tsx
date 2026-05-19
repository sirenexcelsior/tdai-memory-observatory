import { notFound } from "next/navigation";
import { getSessionDetail } from "@/lib/tdai";
import {
  DataTable,
  EmptyState,
  PageSection,
  StatusBadge,
  TableHead,
  TableRow,
} from "@/components/ui";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ sessionKey: string }>;
}) {
  const { sessionKey } = await params;
  const detail = await getSessionDetail(decodeURIComponent(sessionKey));

  if (!detail.session) {
    notFound();
  }

  return (
    <>
      <PageSection
        eyebrow="Session Detail"
        title={detail.session.sessionKey}
        detail="This page ties together L0 messages, L1 outputs, checkpoint cursors, and session-specific log fragments so you can explain a single session end to end."
      >
        <div className="grid gap-4 lg:grid-cols-4">
          <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">State</p>
            <div className="mt-3">
              <StatusBadge tone={detail.session.state}>{detail.session.state}</StatusBadge>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{detail.session.stateReason}</p>
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">L0 / L1</p>
            <p className="mt-3 text-3xl text-[var(--fg-strong)]">
              {detail.session.l0Count} / {detail.session.l1Count}
            </p>
            <p className="mt-2 text-sm text-[var(--muted)]">Raw messages versus structured records</p>
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">L1 cursor</p>
            <p className="mt-3 font-[family-name:var(--font-mono)] text-lg text-[var(--fg-strong)]">
              {detail.checkpoint.runner?.last_l1_cursor ?? 0}
            </p>
            <p className="mt-2 text-sm text-[var(--muted)]">Latest recorded_at consumed by L1</p>
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">Last scene</p>
            <p className="mt-3 text-sm leading-6 text-[var(--fg-strong)]">
              {detail.checkpoint.runner?.last_scene_name || "—"}
            </p>
          </div>
        </div>
      </PageSection>

      <PageSection
        eyebrow="L0"
        title="Captured messages"
        detail="Chronological raw conversation rows from `l0_conversations`."
      >
        <DataTable>
          <TableHead>
            <tr>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Message</th>
              <th className="px-4 py-3">Recorded</th>
            </tr>
          </TableHead>
          <tbody>
            {detail.l0Messages.map((message) => (
              <TableRow key={message.recordId}>
                <td className="px-4 py-4 text-[var(--fg-strong)]">{message.role}</td>
                <td className="px-4 py-4 text-sm leading-6 text-[var(--muted)]">
                  <div className="max-w-4xl whitespace-pre-wrap">{message.text}</div>
                </td>
                <td className="px-4 py-4 text-xs text-[var(--muted)]">{formatDate(message.recordedAt)}</td>
              </TableRow>
            ))}
          </tbody>
        </DataTable>
      </PageSection>

      <PageSection
        eyebrow="L1"
        title="Structured memory output"
        detail="These are the L1 records currently associated with this session."
      >
        {detail.l1Records.length === 0 ? (
          <EmptyState
            title="No L1 records"
            detail="This session has raw L0 rows but no associated structured memory records yet."
          />
        ) : (
          <DataTable>
            <TableHead>
              <tr>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Scene</th>
                <th className="px-4 py-3">Content</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </TableHead>
            <tbody>
              {detail.l1Records.map((record) => (
                <TableRow key={record.recordId}>
                  <td className="px-4 py-4 text-[var(--fg-strong)]">{record.type}</td>
                  <td className="px-4 py-4 text-[var(--muted)]">{record.sceneName || "—"}</td>
                  <td className="px-4 py-4 text-sm leading-6 text-[var(--muted)]">
                    <div className="max-w-4xl whitespace-pre-wrap">{record.content}</div>
                  </td>
                  <td className="px-4 py-4 text-xs text-[var(--muted)]">{formatDate(record.createdTime)}</td>
                </TableRow>
              ))}
            </tbody>
          </DataTable>
        )}
      </PageSection>

      <PageSection
        eyebrow="Logs"
        title="Session-correlated log lines"
        detail="Only log lines that explicitly mention this session key are shown here, so this section stays sparse but high-signal."
      >
        {detail.logs.length === 0 ? (
          <EmptyState
            title="No direct log matches"
            detail="The session may still have processed successfully; not every L1 path logs the session key on every line."
          />
        ) : (
          <div className="space-y-3">
            {detail.logs.map((entry, index) => (
              <div key={`${entry.source}-${index}`} className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-4 py-4">
                <div className="flex items-center gap-3">
                  <StatusBadge tone={entry.severity === "error" ? "attention" : "lagging"}>
                    {entry.source}
                  </StatusBadge>
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{entry.category}</p>
                </div>
                <pre className="mt-3 overflow-x-auto whitespace-pre-wrap font-[family-name:var(--font-mono)] text-xs leading-6 text-[var(--muted)]">
                  {entry.raw}
                </pre>
              </div>
            ))}
          </div>
        )}
      </PageSection>
    </>
  );
}
