import { getSessions } from "@/lib/tdai";
import {
  DataTable,
  EmptyState,
  PageSection,
  SessionLink,
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
  }).format(new Date(value));
}

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const sessions = await getSessions(query);

  return (
    <PageSection
      eyebrow="Sessions"
      title="Session observability"
      detail="Search by session key, last scene, or status reason. Sessions stay read-only here: the goal is to explain what happened, not to mutate it."
    >
      <form action="/sessions" className="mb-5 flex flex-col gap-3 md:flex-row">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search session key, scene, or reason"
          className="h-11 flex-1 rounded-lg border border-[var(--line)] bg-[var(--panel)] px-4 text-sm text-[var(--fg-strong)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--line-strong)]"
        />
        <button
          type="submit"
          className="h-11 rounded-lg border border-[var(--line-strong)] bg-[var(--panel-strong)] px-4 text-sm text-[var(--fg-strong)]"
        >
          Filter
        </button>
      </form>

      {sessions.length === 0 ? (
        <EmptyState
          title="No sessions matched"
          detail="Try a shorter session key prefix or search for a scene name that was emitted by L1."
        />
      ) : (
        <DataTable>
          <TableHead>
            <tr>
              <th className="px-4 py-3">Session</th>
              <th className="px-4 py-3">State</th>
              <th className="px-4 py-3">L0</th>
              <th className="px-4 py-3">L1</th>
              <th className="px-4 py-3">Cursor</th>
              <th className="px-4 py-3">Last L0</th>
              <th className="px-4 py-3">Last scene</th>
            </tr>
          </TableHead>
          <tbody>
            {sessions.map((session) => (
              <TableRow key={session.sessionKey}>
                <td className="px-4 py-4">
                  <SessionLink sessionKey={session.sessionKey} />
                </td>
                <td className="px-4 py-4">
                  <StatusBadge tone={session.state}>{session.state}</StatusBadge>
                  <p className="mt-2 max-w-xs text-xs leading-5 text-[var(--muted)]">{session.stateReason}</p>
                </td>
                <td className="px-4 py-4 text-[var(--fg-strong)]">{session.l0Count}</td>
                <td className="px-4 py-4 text-[var(--fg-strong)]">{session.l1Count}</td>
                <td className="px-4 py-4 font-[family-name:var(--font-mono)] text-xs text-[var(--muted)]">
                  {session.lastCursorMs || 0}
                </td>
                <td className="px-4 py-4 text-[var(--muted)]">{formatDate(session.lastL0At)}</td>
                <td className="px-4 py-4 text-[var(--muted)]">
                  <div className="max-w-md truncate">{session.lastSceneName || "—"}</div>
                </td>
              </TableRow>
            ))}
          </tbody>
        </DataTable>
      )}
    </PageSection>
  );
}
