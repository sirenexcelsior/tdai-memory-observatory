import "server-only";

import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const DATA_DIR = process.env.TDAI_DATA_DIR ?? "/Users/siren/.memory-tencentdb/memory-tdai";
const DB_PATH = path.join(DATA_DIR, "vectors.db");
const CHECKPOINT_PATH = path.join(DATA_DIR, ".metadata", "recall_checkpoint.json");
const CONFIG_PATH = path.join(DATA_DIR, "tdai-gateway.json");
const STDOUT_LOG_PATH = path.join(DATA_DIR, "logs", "gateway.stdout.log");
const STDERR_LOG_PATH = path.join(DATA_DIR, "logs", "gateway.stderr.log");
const GATEWAY_URL = process.env.TDAI_GATEWAY_URL ?? "http://127.0.0.1:8420";

export type HealthState = "online" | "degraded" | "offline";
export type SessionState = "healthy" | "attention" | "lagging" | "empty";

type GatewayHealthPayload = {
  status: "ok" | "degraded";
  version: string;
  uptime: number;
  stores: {
    vectorStore: boolean;
    embeddingService: boolean;
  };
};

type RunnerState = {
  last_captured_timestamp: number;
  last_l1_cursor: number;
  last_scene_name: string;
};

type PipelineState = {
  conversation_count: number;
  last_extraction_time: string;
  last_extraction_updated_time: string;
  last_active_time: number;
  l2_pending_l1_count: number;
  warmup_threshold: number;
  l2_last_extraction_time: string;
};

type CheckpointPayload = {
  total_processed: number;
  last_persona_time: string;
  memories_since_last_persona: number;
  scenes_processed: number;
  runner_states: Record<string, RunnerState>;
  pipeline_states: Record<string, PipelineState>;
};

export type OverviewData = {
  health: {
    state: HealthState;
    label: string;
    details: string;
    uptimeSeconds: number | null;
    version: string | null;
    stores: { vectorStore: boolean; embeddingService: boolean } | null;
  };
  metrics: Array<{ label: string; value: string; hint: string }>;
  memoryMix: Array<{ label: string; count: number; tone: "teal" | "amber" | "violet" | "slate" }>;
  pipeline: {
    trackedSessions: number;
    activeSessions: number;
    laggingSessions: number;
    lastPersonaTime: string | null;
    scenesProcessed: number;
  };
  recentSessions: SessionListItem[];
  recentErrors: ErrorSummary[];
};

export type SessionListItem = {
  sessionKey: string;
  l0Count: number;
  l1Count: number;
  lastL0At: string | null;
  lastL1At: string | null;
  lastCursorMs: number;
  maxRecordedAtMs: number;
  state: SessionState;
  stateReason: string;
  lastSceneName: string;
  conversationCount: number;
};

export type SessionDetailData = {
  session: SessionListItem | null;
  l0Messages: Array<{
    recordId: string;
    role: string;
    text: string;
    recordedAt: string;
    timestamp: number;
    sessionId: string;
  }>;
  l1Records: Array<{
    recordId: string;
    type: string;
    sceneName: string;
    content: string;
    createdTime: string;
    updatedTime: string;
  }>;
  logs: LogEntry[];
  checkpoint: {
    runner: RunnerState | null;
    pipeline: PipelineState | null;
  };
};

export type ErrorSummary = {
  category: string;
  count: number;
  lastSeen: string | null;
  sample: string;
};

export type ErrorPageData = {
  summaries: ErrorSummary[];
  recentEntries: LogEntry[];
};

export type ConfigPageData = {
  config: unknown;
  paths: Array<{ label: string; value: string }>;
  environment: Array<{ label: string; value: string }>;
  checkpoint: {
    totalProcessed: number;
    memoriesSinceLastPersona: number;
    scenesProcessed: number;
    runnerStates: number;
    pipelineStates: number;
  };
};

export type LogEntry = {
  source: "stdout" | "stderr";
  raw: string;
  timestampGuess: string | null;
  category: string;
  severity: "error" | "warn" | "info";
};

function openDb() {
  return new DatabaseSync(DB_PATH, { readOnly: true });
}

function safeReadJson<T>(filePath: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function safeStat(filePath: string) {
  try {
    return fs.statSync(filePath);
  } catch {
    return null;
  }
}

function maskSecret(value: string) {
  if (!value) return value;
  if (value.length <= 8) return "••••";
  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}

function redactSecrets(input: unknown): unknown {
  if (Array.isArray(input)) {
    return input.map(redactSecrets);
  }

  if (input && typeof input === "object") {
    const next: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      if (/api[-_]?key|token|secret|password/i.test(key) && typeof value === "string") {
        next[key] = maskSecret(value);
      } else {
        next[key] = redactSecrets(value);
      }
    }
    return next;
  }

  return input;
}

function readTail(filePath: string, lineLimit = 600) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return content.split(/\r?\n/).filter(Boolean).slice(-lineLimit);
  } catch {
    return [];
  }
}

function categorizeLog(raw: string): LogEntry {
  const severity: LogEntry["severity"] =
    /failed|error|ENOENT|NO_JSON|reasoning_content|ERR_/i.test(raw) ? "error" :
    /warn|degraded|fallback/i.test(raw) ? "warn" :
    "info";

  const category =
    /NO_JSON/i.test(raw) ? "No JSON" :
    /reasoning_content/i.test(raw) ? "Thinking mismatch" :
    /Embedding FAILED|fetch failed/i.test(raw) ? "Embedding fetch failed" :
    /read_file failed/i.test(raw) ? "Tool read failure" :
    /\[l1-extractor\]/i.test(raw) ? "L1 extraction" :
    /\[pipeline\]/i.test(raw) ? "Pipeline" :
    /\[sqlite\]/i.test(raw) ? "SQLite" :
    "General";

  const isoGuess = raw.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z/)?.[0] ?? null;

  return { raw, category, severity, source: "stdout", timestampGuess: isoGuess };
}

function collectLogs() {
  const stdout = readTail(STDOUT_LOG_PATH).map((raw) => ({ ...categorizeLog(raw), source: "stdout" as const }));
  const stderr = readTail(STDERR_LOG_PATH).map((raw) => ({ ...categorizeLog(raw), source: "stderr" as const }));
  return [...stderr, ...stdout];
}

function summarizeErrors(entries: LogEntry[]): ErrorSummary[] {
  const map = new Map<string, ErrorSummary>();

  for (const entry of entries.filter((item) => item.severity !== "info")) {
    const existing = map.get(entry.category);
    if (existing) {
      existing.count += 1;
      existing.lastSeen = entry.timestampGuess ?? existing.lastSeen;
    } else {
      map.set(entry.category, {
        category: entry.category,
        count: 1,
        lastSeen: entry.timestampGuess,
        sample: entry.raw.slice(0, 220),
      });
    }
  }

  return [...map.values()].sort((a, b) => b.count - a.count);
}

async function readHealth() {
  try {
    const response = await fetch(`${GATEWAY_URL}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(1500),
    });

    if (!response.ok) {
      return {
        state: "offline" as const,
        label: "Offline",
        details: `${response.status} ${response.statusText}`,
        uptimeSeconds: null,
        version: null,
        stores: null,
      };
    }

    const payload = (await response.json()) as GatewayHealthPayload;
    return {
      state: payload.status === "ok" ? "online" as const : "degraded" as const,
      label: payload.status === "ok" ? "Online" : "Degraded",
      details: payload.status === "ok" ? "Gateway reachable and store initialized" : "Gateway reachable but degraded",
      uptimeSeconds: payload.uptime,
      version: payload.version,
      stores: payload.stores,
    };
  } catch {
    return {
      state: "offline" as const,
      label: "Offline",
      details: "Gateway health endpoint not reachable",
      uptimeSeconds: null,
      version: null,
      stores: null,
    };
  }
}

function readCheckpoint() {
  return safeReadJson<CheckpointPayload>(CHECKPOINT_PATH, {
    total_processed: 0,
    last_persona_time: "",
    memories_since_last_persona: 0,
    scenes_processed: 0,
    runner_states: {},
    pipeline_states: {},
  });
}

function deriveSessionState(params: {
  l1Count: number;
  lastCursorMs: number;
  maxRecordedAtMs: number;
  hasErrors: boolean;
}) {
  if (params.hasErrors) {
    return { state: "attention" as const, reason: "Recent session-specific errors in logs" };
  }
  if (params.l1Count === 0) {
    return { state: "empty" as const, reason: "No L1 records yet" };
  }
  if (params.lastCursorMs < params.maxRecordedAtMs) {
    return { state: "lagging" as const, reason: "Checkpoint cursor is behind latest L0 data" };
  }
  return { state: "healthy" as const, reason: "L1 is present and checkpoint is current" };
}

function loadSessionRows() {
  const db = openDb();
  try {
    const rows = db.prepare(`
      WITH l1 AS (
        SELECT session_key, COUNT(*) AS l1_count, MAX(created_time) AS last_l1_at
        FROM l1_records
        WHERE session_key != ''
        GROUP BY session_key
      )
      SELECT
        l0.session_key AS session_key,
        COUNT(*) AS l0_count,
        MAX(l0.recorded_at) AS last_l0_at,
        MAX(l0.timestamp) AS max_timestamp,
        CAST(COALESCE(l1.l1_count, 0) AS INTEGER) AS l1_count,
        l1.last_l1_at AS last_l1_at
      FROM l0_conversations l0
      LEFT JOIN l1 ON l1.session_key = l0.session_key
      WHERE l0.session_key != ''
      GROUP BY l0.session_key
      ORDER BY last_l0_at DESC
    `).all() as Array<{
      session_key: string;
      l0_count: number;
      last_l0_at: string | null;
      max_timestamp: number | null;
      l1_count: number;
      last_l1_at: string | null;
    }>;

    return rows;
  } finally {
    db.close();
  }
}

export async function getOverviewData(): Promise<OverviewData> {
  const [health, sessionRows] = await Promise.all([readHealth(), Promise.resolve(loadSessionRows())]);
  const checkpoint = readCheckpoint();
  const logEntries = collectLogs();
  const errors = summarizeErrors(logEntries);

  const db = openDb();
  try {
    const l0Count = Number(db.prepare("SELECT COUNT(*) AS cnt FROM l0_conversations").get().cnt ?? 0);
    const l1Count = Number(db.prepare("SELECT COUNT(*) AS cnt FROM l1_records").get().cnt ?? 0);
    const typeRows = db.prepare(`
      SELECT type, COUNT(*) AS cnt
      FROM l1_records
      GROUP BY type
      ORDER BY cnt DESC
    `).all() as Array<{ type: string; cnt: number }>;

    const recentSessions = buildSessionList(sessionRows, checkpoint, logEntries).slice(0, 8);
    const activeSessions = Object.values(checkpoint.pipeline_states).filter((item) => item.conversation_count > 0).length;
    const laggingSessions = recentSessions.filter((item) => item.state === "lagging" || item.state === "attention").length;

    return {
      health,
      metrics: [
        { label: "L0 Messages", value: l0Count.toLocaleString(), hint: "Raw captured turns" },
        { label: "L1 Memories", value: l1Count.toLocaleString(), hint: "Structured memory records" },
        { label: "Tracked Sessions", value: `${sessionRows.length}`, hint: "Seen in checkpoint + DB" },
        { label: "Recent Errors", value: `${errors.reduce((sum, item) => sum + item.count, 0)}`, hint: "From latest gateway logs" },
      ],
      memoryMix: typeRows.map((row, index) => ({
        label: row.type || "untyped",
        count: Number(row.cnt),
        tone: (["teal", "amber", "violet", "slate"][index % 4] as OverviewData["memoryMix"][number]["tone"]),
      })),
      pipeline: {
        trackedSessions: Object.keys(checkpoint.runner_states).length,
        activeSessions,
        laggingSessions,
        lastPersonaTime: checkpoint.last_persona_time || null,
        scenesProcessed: checkpoint.scenes_processed,
      },
      recentSessions,
      recentErrors: errors.slice(0, 6),
    };
  } finally {
    db.close();
  }
}

function buildSessionList(
  rows: ReturnType<typeof loadSessionRows>,
  checkpoint: CheckpointPayload,
  logEntries: LogEntry[],
) {
  return rows.map<SessionListItem>((row) => {
    const runner = checkpoint.runner_states[row.session_key] ?? null;
    const pipeline = checkpoint.pipeline_states[row.session_key] ?? null;
    const maxRecordedAtMs = row.last_l0_at ? Date.parse(row.last_l0_at) || 0 : row.max_timestamp ?? 0;
    const hasErrors = logEntries.some(
      (entry) => entry.severity === "error" && entry.raw.includes(row.session_key),
    );
    const derived = deriveSessionState({
      l1Count: Number(row.l1_count),
      lastCursorMs: runner?.last_l1_cursor ?? 0,
      maxRecordedAtMs,
      hasErrors,
    });

    return {
      sessionKey: row.session_key,
      l0Count: Number(row.l0_count),
      l1Count: Number(row.l1_count),
      lastL0At: row.last_l0_at,
      lastL1At: row.last_l1_at,
      lastCursorMs: runner?.last_l1_cursor ?? 0,
      maxRecordedAtMs,
      state: derived.state,
      stateReason: derived.reason,
      lastSceneName: runner?.last_scene_name ?? "",
      conversationCount: pipeline?.conversation_count ?? 0,
    };
  });
}

export async function getSessions(search?: string) {
  const checkpoint = readCheckpoint();
  const logEntries = collectLogs();
  const sessions = buildSessionList(loadSessionRows(), checkpoint, logEntries);

  const normalized = search?.trim().toLowerCase();
  if (!normalized) return sessions;

  return sessions.filter((session) => {
    return (
      session.sessionKey.toLowerCase().includes(normalized) ||
      session.lastSceneName.toLowerCase().includes(normalized) ||
      session.stateReason.toLowerCase().includes(normalized)
    );
  });
}

export async function getSessionDetail(sessionKey: string): Promise<SessionDetailData> {
  const [sessions, checkpoint] = await Promise.all([getSessions(), Promise.resolve(readCheckpoint())]);
  const session = sessions.find((item) => item.sessionKey === sessionKey) ?? null;
  const db = openDb();

  try {
    const l0Messages = db.prepare(`
      SELECT record_id, role, message_text, session_id, recorded_at, timestamp
      FROM l0_conversations
      WHERE session_key = ?
      ORDER BY recorded_at ASC, timestamp ASC
    `).all(sessionKey) as SessionDetailData["l0Messages"];

    const l1Records = db.prepare(`
      SELECT record_id, type, scene_name AS sceneName, content, created_time AS createdTime, updated_time AS updatedTime
      FROM l1_records
      WHERE session_key = ?
      ORDER BY created_time DESC
    `).all(sessionKey) as SessionDetailData["l1Records"];

    const relatedLogs = collectLogs()
      .filter((entry) => entry.raw.includes(sessionKey))
      .slice(-60);

    return {
      session,
      l0Messages,
      l1Records,
      logs: relatedLogs,
      checkpoint: {
        runner: checkpoint.runner_states[sessionKey] ?? null,
        pipeline: checkpoint.pipeline_states[sessionKey] ?? null,
      },
    };
  } finally {
    db.close();
  }
}

export async function getErrorsPageData(): Promise<ErrorPageData> {
  const logs = collectLogs();
  const summaries = summarizeErrors(logs);
  const recentEntries = logs
    .filter((entry) => entry.severity !== "info")
    .slice(-80)
    .reverse();

  return { summaries, recentEntries };
}

export async function getConfigPageData(): Promise<ConfigPageData> {
  const config = redactSecrets(safeReadJson(CONFIG_PATH, {}));
  const checkpoint = readCheckpoint();
  const stdoutStat = safeStat(STDOUT_LOG_PATH);
  const stderrStat = safeStat(STDERR_LOG_PATH);

  return {
    config,
    paths: [
      { label: "Data directory", value: DATA_DIR },
      { label: "SQLite database", value: DB_PATH },
      { label: "Checkpoint", value: CHECKPOINT_PATH },
      { label: "Gateway stdout log", value: STDOUT_LOG_PATH },
      { label: "Gateway stderr log", value: STDERR_LOG_PATH },
    ],
    environment: [
      { label: "Gateway URL", value: GATEWAY_URL },
      { label: "Stdout log size", value: stdoutStat ? `${(stdoutStat.size / 1024).toFixed(1)} KB` : "missing" },
      { label: "Stderr log size", value: stderrStat ? `${(stderrStat.size / 1024).toFixed(1)} KB` : "missing" },
    ],
    checkpoint: {
      totalProcessed: checkpoint.total_processed,
      memoriesSinceLastPersona: checkpoint.memories_since_last_persona,
      scenesProcessed: checkpoint.scenes_processed,
      runnerStates: Object.keys(checkpoint.runner_states).length,
      pipelineStates: Object.keys(checkpoint.pipeline_states).length,
    },
  };
}
