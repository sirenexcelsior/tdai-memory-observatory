import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-6 py-16">
      <div className="w-full max-w-2xl rounded-lg border border-[var(--line)] bg-[var(--panel)] p-8 shadow-[var(--shadow)]">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">Missing View</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl text-[var(--fg-strong)]">
          This session view is not available.
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--muted)]">
          The session key may no longer exist in the local store, or the data directory may point at a different
          TencentDB memory instance.
        </p>
        <div className="mt-8">
          <Link
            href="/sessions"
            className="inline-flex h-11 items-center rounded-lg border border-[var(--line-strong)] bg-[var(--panel-strong)] px-4 text-sm text-[var(--fg-strong)]"
          >
            Return to sessions
          </Link>
        </div>
      </div>
    </main>
  );
}
