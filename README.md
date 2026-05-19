# TDAI Memory Observatory

Read-only observability console for a local TencentDB Agent Memory deployment.

This UI is designed for debugging and understanding the live memory pipeline rather than editing memory data. It reads from the local SQLite store, gateway health endpoint, checkpoint metadata, and gateway logs, then presents a compact operations view across:

- gateway health
- recent sessions
- L0 to L1 flow
- grouped error patterns
- runtime configuration

## Principles

- Read-only by default
- Local-first: reads files from your existing TencentDB memory data directory
- Observability-first: optimized for answering why L1 did or did not happen
- GitHub-friendly: standard Next.js app with a small env surface

## Pages

- `Overview`: health, counts, recent sessions, error stream
- `Sessions`: searchable session list
- `Session Detail`: L0 rows, L1 rows, checkpoint state, session-correlated logs
- `Errors`: grouped operational failures
- `Config`: sanitized runtime config and filesystem bindings

## Environment

Copy `.env.example` to `.env.local` and adjust if needed.

```bash
cp .env.example .env.local
```

Variables:

- `TDAI_DATA_DIR`: local TencentDB memory data directory
- `TDAI_GATEWAY_URL`: local gateway base URL

Defaults already point at:

- `/Users/siren/.memory-tencentdb/memory-tdai`
- `http://127.0.0.1:8420`

## Run locally

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Notes

- Secrets from `tdai-gateway.json` are masked before rendering.
- This project does not write to `vectors.db` or mutate gateway data.
- If the gateway is offline, the app still renders file-backed diagnostics where possible.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS 4
- server-only file and SQLite reads
