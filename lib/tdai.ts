import "server-only";

import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { translateMemoryType, type Language } from "@/lib/i18n";
import { getRuntimeConfig, type RuntimeConfig, type RuntimeValueSource } from "@/lib/runtime-config";

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
  memoryMix: Array<{ label: string; count: number; sharePercent: number; tone: "teal" | "amber" | "violet" | "slate" }>;
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
  runtime: {
    dataDir: string;
    gatewayUrl: string;
    defaults: {
      dataDir: string;
      gatewayUrl: string;
    };
    sources: {
      dataDir: RuntimeValueSource;
      gatewayUrl: RuntimeValueSource;
    };
  };
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
  timestampMs: number | null;
  category: string;
  severity: "error" | "warn" | "info";
  order: number;
};

function openDb(dbPath: string) {
  return new DatabaseSync(dbPath, { readOnly: true });
}

function tryOpenDb(dbPath: string) {
  try {
    return openDb(dbPath);
  } catch {
    return null;
  }
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
  const timestampGuess = raw.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z/)?.[0] ?? null;
  const timestampMs = timestampGuess ? Date.parse(timestampGuess) : null;
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

  return { raw, category, severity, source: "stdout", timestampGuess, timestampMs, order: 0 };
}

function translateLogCategory(lang: Language, category: string) {
  if (lang !== "zh") return category;

  return {
    "No JSON": "未提取到 JSON",
    "Thinking mismatch": "thinking 模式不匹配",
    "Embedding fetch failed": "Embedding 调用失败",
    "Tool read failure": "工具读取失败",
    "L1 extraction": "L1 提取",
    Pipeline: "Pipeline",
    SQLite: "SQLite",
    General: "一般",
  }[category] ?? category;
}

function translateHealthLabel(lang: Language, state: HealthState) {
  if (lang === "zh") {
    return {
      online: "在线",
      degraded: "降级",
      offline: "离线",
    }[state];
  }

  return {
    online: "Online",
    degraded: "Degraded",
    offline: "Offline",
  }[state];
}

function translateHealthDetails(lang: Language, state: HealthState, responseText?: string) {
  if (lang === "zh") {
    if (state === "online") return "Gateway 可访问，存储已初始化";
    if (state === "degraded") return "Gateway 可访问，但当前处于降级状态";
    return responseText ?? "Gateway 健康检查端点不可访问";
  }

  if (state === "online") return "Gateway reachable and store initialized";
  if (state === "degraded") return "Gateway reachable but degraded";
  return responseText ?? "Gateway health endpoint not reachable";
}

function translateSessionReason(
  lang: Language,
  params: {
    state: SessionState;
    l0Count: number;
    l1Count: number;
    pipeline: PipelineState | null;
    runner: RunnerState | null;
    hasErrors: boolean;
    errorCategory?: string | null;
  },
) {
  const { state, l0Count, l1Count, pipeline, runner, hasErrors, errorCategory } = params;

  const attentionReason = (() => {
    if (lang === "zh") {
      if (errorCategory === "Embedding fetch failed") {
        return l1Count === 0
          ? "Embedding 失败迹象：最近和该会话相关的向量化请求失败，L1 可能因此没有完成写入"
          : "Embedding 失败迹象：最近和该会话相关的向量化请求失败，后续召回或补写可能受影响";
      }

      if (errorCategory === "Thinking mismatch") {
        return "提取失败迹象：最近和该会话相关的 thinking 模式不匹配，L1 提取被中断";
      }

      if (errorCategory === "No JSON" || errorCategory === "L1 extraction") {
        return "提取失败迹象：最近和该会话相关的 L1 提取没有得到可写入的结构化结果";
      }

      if (errorCategory === "Tool read failure") {
        return "工具失败迹象：最近和该会话相关的工具读取失败，提取链路可能被打断";
      }

      if (errorCategory === "SQLite") {
        return "存储失败迹象：最近和该会话相关的 SQLite 读写出现异常";
      }

      if (errorCategory === "Pipeline") {
        return "Pipeline 失败迹象：最近和该会话相关的调度或队列处理出现异常";
      }

      return l1Count === 0
        ? "最近日志里有和该会话直接相关的错误，且还没有写入 L1"
        : "最近日志里出现了和该会话直接相关的错误";
    }

    if (errorCategory === "Embedding fetch failed") {
      return l1Count === 0
        ? "Embedding failure signal: recent vectorization requests tied to this session failed, so L1 may never have completed"
        : "Embedding failure signal: recent vectorization requests tied to this session failed, which may affect follow-on recall or enrichment";
    }

    if (errorCategory === "Thinking mismatch") {
      return "Extraction failure signal: a recent thinking-mode mismatch interrupted L1 extraction for this session";
    }

    if (errorCategory === "No JSON" || errorCategory === "L1 extraction") {
      return "Extraction failure signal: a recent L1 extraction for this session did not yield a storable structured result";
    }

    if (errorCategory === "Tool read failure") {
      return "Tooling failure signal: a recent read-tool error appears to have interrupted extraction for this session";
    }

    if (errorCategory === "SQLite") {
      return "Storage failure signal: recent SQLite reads or writes tied to this session failed";
    }

    if (errorCategory === "Pipeline") {
      return "Pipeline failure signal: recent scheduling or queue handling tied to this session failed";
    }

    return l1Count === 0
      ? "Recent session-specific errors were logged and no L1 has been written yet"
      : "Recent session-specific errors in logs";
  })();

  if (lang === "zh") {
    if (state === "attention") {
      return attentionReason;
    }

    if (state === "lagging") {
      if (pipeline && pipeline.conversation_count > 0 && pipeline.conversation_count < pipeline.warmup_threshold) {
        return "L1 已存在，但最新 L0 还没到下一次提取窗口";
      }
      return "Checkpoint cursor 落后于最新 L0 数据";
    }

    if (state === "healthy") {
      return "L1 已存在，且 checkpoint 已追平";
    }

    if (!pipeline && !runner) {
      return l0Count >= 10
        ? "已有较多历史 L0，但当前没有关联的 checkpoint 或 L1 记录"
        : "L0 已捕获，尚未进入 L1 跟踪";
    }

    if (pipeline?.last_extraction_time) {
      return "发生过 L1 提取，但没有写入任何 L1 记录";
    }

    if (pipeline && pipeline.conversation_count > 0 && pipeline.conversation_count < pipeline.warmup_threshold) {
      return `已捕获 ${pipeline.conversation_count} 轮对话，尚未达到下一次 L1 触发阈值`;
    }

    if (pipeline && pipeline.conversation_count >= pipeline.warmup_threshold) {
      return "已达到 L1 触发条件，但还没有看到 L1 结果";
    }

    return hasErrors ? "还没有产生 L1 记录，且近期出现过错误" : "还没有产生 L1 记录";
  }

  if (state === "attention") {
    return attentionReason;
  }

  if (state === "lagging") {
    if (pipeline && pipeline.conversation_count > 0 && pipeline.conversation_count < pipeline.warmup_threshold) {
      return "L1 exists, but the newest L0 has not reached the next extraction window yet";
    }
    return "Checkpoint cursor is behind latest L0 data";
  }

  if (state === "healthy") {
    return "L1 is present and checkpoint is current";
  }

  if (!pipeline && !runner) {
    return l0Count >= 10
      ? "There is substantial historical L0, but no associated checkpoint or L1 record right now"
      : "L0 has been captured but is not being tracked by L1 yet";
  }

  if (pipeline?.last_extraction_time) {
    return "An L1 extraction appears to have run, but it did not write any L1 records";
  }

  if (pipeline && pipeline.conversation_count > 0 && pipeline.conversation_count < pipeline.warmup_threshold) {
    return `${pipeline.conversation_count} conversation turns were captured, but the next L1 trigger threshold has not been reached yet`;
  }

  if (pipeline && pipeline.conversation_count >= pipeline.warmup_threshold) {
    return "The session appears eligible for L1, but no L1 result is visible yet";
  }

  return hasErrors ? "No L1 records yet, and recent errors were observed" : "No L1 records yet";
}

function translatePathLabel(lang: Language, label: string) {
  if (lang !== "zh") return label;

  return {
    "Data directory": "数据目录",
    "SQLite database": "SQLite 数据库",
    Checkpoint: "Checkpoint",
    "Gateway stdout log": "Gateway stdout 日志",
    "Gateway stderr log": "Gateway stderr 日志",
  }[label] ?? label;
}

function translateEnvironmentLabel(lang: Language, label: string) {
  if (lang !== "zh") return label;

  return {
    "Gateway URL": "Gateway 地址",
    "Gateway URL source": "Gateway 地址来源",
    "Data directory source": "数据目录来源",
    "Stdout log size": "stdout 日志大小",
    "Stderr log size": "stderr 日志大小",
  }[label] ?? label;
}

function translateRuntimeSource(lang: Language, source: RuntimeValueSource) {
  if (lang === "zh") {
    return {
      saved: "页面保存",
      environment: "环境变量",
      default: "默认值",
    }[source];
  }

  return {
    saved: "Saved in browser",
    environment: "Environment variable",
    default: "Default fallback",
  }[source];
}

function collectLogs(config: RuntimeConfig) {
  const stdoutMtimeMs = safeStat(config.stdoutLogPath)?.mtimeMs ?? 0;
  const stderrMtimeMs = safeStat(config.stderrLogPath)?.mtimeMs ?? 0;
  const stdout = readTail(config.stdoutLogPath).map((raw, index) => ({
    ...categorizeLog(raw),
    source: "stdout" as const,
    order: index,
  }));
  const stderr = readTail(config.stderrLogPath).map((raw, index) => ({
    ...categorizeLog(raw),
    source: "stderr" as const,
    order: index,
  }));

  return [...stdout, ...stderr].sort((left, right) => {
    const leftSortMs = left.timestampMs ?? (left.source === "stdout" ? stdoutMtimeMs : stderrMtimeMs);
    const rightSortMs = right.timestampMs ?? (right.source === "stdout" ? stdoutMtimeMs : stderrMtimeMs);

    if (leftSortMs !== rightSortMs) {
      return leftSortMs - rightSortMs;
    }

    if (left.source !== right.source) {
      return left.source === "stdout" ? -1 : 1;
    }

    return left.order - right.order;
  });
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

async function readHealth(lang: Language, gatewayUrl: string) {
  try {
    const response = await fetch(`${gatewayUrl}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(1500),
    });

    if (!response.ok) {
      return {
        state: "offline" as const,
        label: translateHealthLabel(lang, "offline"),
        details: `${response.status} ${response.statusText}`,
        uptimeSeconds: null,
        version: null,
        stores: null,
      };
    }

    const payload = (await response.json()) as GatewayHealthPayload;
    return {
      state: payload.status === "ok" ? "online" as const : "degraded" as const,
      label: translateHealthLabel(lang, payload.status === "ok" ? "online" : "degraded"),
      details: translateHealthDetails(lang, payload.status === "ok" ? "online" : "degraded"),
      uptimeSeconds: payload.uptime,
      version: payload.version,
      stores: payload.stores,
    };
  } catch {
    return {
      state: "offline" as const,
      label: translateHealthLabel(lang, "offline"),
      details: translateHealthDetails(lang, "offline"),
      uptimeSeconds: null,
      version: null,
      stores: null,
    };
  }
}

function readCheckpoint(checkpointPath: string) {
  return safeReadJson<CheckpointPayload>(checkpointPath, {
    total_processed: 0,
    last_persona_time: "",
    memories_since_last_persona: 0,
    scenes_processed: 0,
    runner_states: {},
    pipeline_states: {},
  });
}

const SESSION_ERROR_WINDOW_MS = 6 * 60 * 60 * 1000;

type SessionErrorQuery = {
  sessionKey: string;
  logEntries: LogEntry[];
  l1Count: number;
  maxRecordedAtMs: number;
  lastCursorMs: number;
  lastL1At: string | null;
};

function isRelevantSessionError(entry: LogEntry, params: SessionErrorQuery) {
  const { sessionKey, l1Count, maxRecordedAtMs, lastCursorMs, lastL1At } = params;

  if (entry.severity !== "error" || !entry.raw.includes(sessionKey)) {
    return false;
  }

  const lastL1AtMs = lastL1At ? Date.parse(lastL1At) || 0 : 0;
  const lastSuccessMs = Math.max(lastCursorMs, lastL1AtMs);
  const recentCutoffMs = maxRecordedAtMs > 0 ? maxRecordedAtMs - SESSION_ERROR_WINDOW_MS : 0;

  if (entry.timestampMs == null) {
    return l1Count === 0 || lastSuccessMs < maxRecordedAtMs;
  }

  if (l1Count === 0) {
    return entry.timestampMs >= recentCutoffMs;
  }

  return entry.timestampMs >= Math.max(lastSuccessMs, recentCutoffMs);
}

function getRelevantSessionError(params: SessionErrorQuery) {
  const sessionErrors = params.logEntries.filter((entry) => isRelevantSessionError(entry, params));

  if (sessionErrors.length === 0) {
    return null;
  }

  return sessionErrors[sessionErrors.length - 1];
}

function deriveSessionState(params: {
  l1Count: number;
  l0Count: number;
  lastCursorMs: number;
  maxRecordedAtMs: number;
  recentRelevantError: LogEntry | null;
  pipeline: PipelineState | null;
  runner: RunnerState | null;
}, lang: Language) {
  let baseState: SessionState;

  if (params.l1Count === 0) {
    baseState = "empty";
  } else if (params.lastCursorMs < params.maxRecordedAtMs) {
    baseState = "lagging";
  } else {
    baseState = "healthy";
  }

  if (baseState !== "healthy" && params.recentRelevantError) {
    return {
      state: "attention" as const,
      reason: translateSessionReason(lang, {
        state: "attention",
        l0Count: params.l0Count,
        l1Count: params.l1Count,
        pipeline: params.pipeline,
        runner: params.runner,
        hasErrors: true,
        errorCategory: params.recentRelevantError.category,
      }),
    };
  }

  if (baseState === "empty") {
    return {
      state: "empty" as const,
      reason: translateSessionReason(lang, {
        state: "empty",
        l0Count: params.l0Count,
        l1Count: params.l1Count,
        pipeline: params.pipeline,
        runner: params.runner,
        hasErrors: Boolean(params.recentRelevantError),
      }),
    };
  }

  if (baseState === "lagging") {
    return {
      state: "lagging" as const,
      reason: translateSessionReason(lang, {
        state: "lagging",
        l0Count: params.l0Count,
        l1Count: params.l1Count,
        pipeline: params.pipeline,
        runner: params.runner,
        hasErrors: Boolean(params.recentRelevantError),
      }),
    };
  }

  return {
    state: "healthy" as const,
    reason: translateSessionReason(lang, {
      state: "healthy",
      l0Count: params.l0Count,
      l1Count: params.l1Count,
      pipeline: params.pipeline,
      runner: params.runner,
      hasErrors: Boolean(params.recentRelevantError),
    }),
  };
}

function loadSessionRows(config: RuntimeConfig) {
  const db = tryOpenDb(config.dbPath);
  if (!db) {
    return [];
  }

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

export async function getOverviewData(lang: Language = "en"): Promise<OverviewData> {
  const runtime = await getRuntimeConfig();
  const [health, sessionRows] = await Promise.all([
    readHealth(lang, runtime.gatewayUrl),
    Promise.resolve(loadSessionRows(runtime)),
  ]);
  const checkpoint = readCheckpoint(runtime.checkpointPath);
  const logEntries = collectLogs(runtime);
  const errors = summarizeErrors(logEntries).map((item) => ({
    ...item,
    category: translateLogCategory(lang, item.category),
  }));

  const db = tryOpenDb(runtime.dbPath);
  if (!db) {
    const allSessions = buildSessionList(sessionRows, checkpoint, logEntries, lang);
    return {
      health,
      metrics: [
        { label: lang === "zh" ? "L0 消息" : "L0 Messages", value: "0", hint: lang === "zh" ? "数据库当前不可读" : "Database currently unavailable" },
        { label: lang === "zh" ? "L1 记忆" : "L1 Memories", value: "0", hint: lang === "zh" ? "数据库当前不可读" : "Database currently unavailable" },
        { label: lang === "zh" ? "会话总数" : "Tracked Sessions", value: `${sessionRows.length}`, hint: lang === "zh" ? "来自 checkpoint 与数据库" : "Seen in checkpoint + DB" },
        { label: lang === "zh" ? "近期错误" : "Recent Errors", value: `${errors.reduce((sum, item) => sum + item.count, 0)}`, hint: lang === "zh" ? "来自最新 Gateway 日志" : "From latest gateway logs" },
      ],
      memoryMix: [],
      pipeline: {
        trackedSessions: Object.keys(checkpoint.runner_states).length,
        activeSessions: Object.values(checkpoint.pipeline_states).filter((item) => item.conversation_count > 0).length,
        laggingSessions: allSessions.filter((item) => item.state === "lagging" || item.state === "attention").length,
        lastPersonaTime: checkpoint.last_persona_time || null,
        scenesProcessed: checkpoint.scenes_processed,
      },
      recentSessions: allSessions.slice(0, 8),
      recentErrors: errors.slice(0, 6),
    };
  }

  try {
    const l0Count = Number(db.prepare("SELECT COUNT(*) AS cnt FROM l0_conversations").get().cnt ?? 0);
    const l1Count = Number(db.prepare("SELECT COUNT(*) AS cnt FROM l1_records").get().cnt ?? 0);
    const typeRows = db.prepare(`
      SELECT type, COUNT(*) AS cnt
      FROM l1_records
      GROUP BY type
      ORDER BY cnt DESC
    `).all() as Array<{ type: string; cnt: number }>;

    const allSessions = buildSessionList(sessionRows, checkpoint, logEntries, lang);
    const recentSessions = allSessions.slice(0, 8);
    const activeSessions = Object.values(checkpoint.pipeline_states).filter((item) => item.conversation_count > 0).length;
    const laggingSessions = allSessions.filter((item) => item.state === "lagging" || item.state === "attention").length;

    return {
      health,
      metrics: [
        { label: lang === "zh" ? "L0 消息" : "L0 Messages", value: l0Count.toLocaleString(), hint: lang === "zh" ? "原始捕获轮次" : "Raw captured turns" },
        { label: lang === "zh" ? "L1 记忆" : "L1 Memories", value: l1Count.toLocaleString(), hint: lang === "zh" ? "结构化记忆记录" : "Structured memory records" },
        { label: lang === "zh" ? "会话总数" : "Tracked Sessions", value: `${sessionRows.length}`, hint: lang === "zh" ? "来自 checkpoint 与数据库" : "Seen in checkpoint + DB" },
        { label: lang === "zh" ? "近期错误" : "Recent Errors", value: `${errors.reduce((sum, item) => sum + item.count, 0)}`, hint: lang === "zh" ? "来自最新 Gateway 日志" : "From latest gateway logs" },
      ],
      memoryMix: typeRows.map((row, index) => ({
        label: translateMemoryType(lang, row.type || "untyped"),
        count: Number(row.cnt),
        sharePercent: l1Count > 0 ? Math.round((Number(row.cnt) / l1Count) * 100) : 0,
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
  lang: Language,
) {
  return rows.map<SessionListItem>((row) => {
    const runner = checkpoint.runner_states[row.session_key] ?? null;
    const pipeline = checkpoint.pipeline_states[row.session_key] ?? null;
    const maxRecordedAtMs = row.last_l0_at ? Date.parse(row.last_l0_at) || 0 : row.max_timestamp ?? 0;
    const recentRelevantError = getRelevantSessionError({
      sessionKey: row.session_key,
      logEntries,
      l1Count: Number(row.l1_count),
      maxRecordedAtMs,
      lastCursorMs: runner?.last_l1_cursor ?? 0,
      lastL1At: row.last_l1_at,
    });
    const derived = deriveSessionState({
      l1Count: Number(row.l1_count),
      l0Count: Number(row.l0_count),
      lastCursorMs: runner?.last_l1_cursor ?? 0,
      maxRecordedAtMs,
      recentRelevantError,
      pipeline,
      runner,
    }, lang);

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

export async function getSessions(search?: string, lang: Language = "en") {
  const runtime = await getRuntimeConfig();
  const checkpoint = readCheckpoint(runtime.checkpointPath);
  const logEntries = collectLogs(runtime);
  const sessions = buildSessionList(loadSessionRows(runtime), checkpoint, logEntries, lang);

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

export async function getSessionDetail(sessionKey: string, lang: Language = "en"): Promise<SessionDetailData> {
  const runtime = await getRuntimeConfig();
  const [sessions, checkpoint] = await Promise.all([
    getSessions(undefined, lang),
    Promise.resolve(readCheckpoint(runtime.checkpointPath)),
  ]);
  const session = sessions.find((item) => item.sessionKey === sessionKey) ?? null;
  const db = tryOpenDb(runtime.dbPath);

  if (!db) {
    return {
      session,
      l0Messages: [],
      l1Records: [],
      logs: collectLogs(runtime)
        .filter((entry) => entry.raw.includes(sessionKey))
        .map((entry) => ({ ...entry, category: translateLogCategory(lang, entry.category) }))
        .slice(-60),
      checkpoint: {
        runner: checkpoint.runner_states[sessionKey] ?? null,
        pipeline: checkpoint.pipeline_states[sessionKey] ?? null,
      },
    };
  }

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

    const relatedLogs = collectLogs(runtime)
      .filter((entry) => entry.raw.includes(sessionKey))
      .map((entry) => ({ ...entry, category: translateLogCategory(lang, entry.category) }))
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

export async function getErrorsPageData(lang: Language = "en"): Promise<ErrorPageData> {
  const runtime = await getRuntimeConfig();
  const logs = collectLogs(runtime);
  const summaries = summarizeErrors(logs).map((entry) => ({
    ...entry,
    category: translateLogCategory(lang, entry.category),
  }));
  const recentEntries = logs
    .filter((entry) => entry.severity !== "info")
    .map((entry) => ({ ...entry, category: translateLogCategory(lang, entry.category) }))
    .slice(-80)
    .reverse();

  return { summaries, recentEntries };
}

export async function getConfigPageData(lang: Language = "en"): Promise<ConfigPageData> {
  const runtime = await getRuntimeConfig();
  const config = redactSecrets(safeReadJson(runtime.configPath, {}));
  const checkpoint = readCheckpoint(runtime.checkpointPath);
  const stdoutStat = safeStat(runtime.stdoutLogPath);
  const stderrStat = safeStat(runtime.stderrLogPath);

  return {
    config,
    runtime: {
      dataDir: runtime.dataDir,
      gatewayUrl: runtime.gatewayUrl,
      defaults: runtime.defaults,
      sources: runtime.sources,
    },
    paths: [
      { label: translatePathLabel(lang, "Data directory"), value: runtime.dataDir },
      { label: translatePathLabel(lang, "SQLite database"), value: runtime.dbPath },
      { label: translatePathLabel(lang, "Checkpoint"), value: runtime.checkpointPath },
      { label: translatePathLabel(lang, "Gateway stdout log"), value: runtime.stdoutLogPath },
      { label: translatePathLabel(lang, "Gateway stderr log"), value: runtime.stderrLogPath },
    ],
    environment: [
      { label: translateEnvironmentLabel(lang, "Gateway URL"), value: runtime.gatewayUrl },
      { label: translateEnvironmentLabel(lang, "Gateway URL source"), value: translateRuntimeSource(lang, runtime.sources.gatewayUrl) },
      { label: translateEnvironmentLabel(lang, "Data directory source"), value: translateRuntimeSource(lang, runtime.sources.dataDir) },
      { label: translateEnvironmentLabel(lang, "Stdout log size"), value: stdoutStat ? `${(stdoutStat.size / 1024).toFixed(1)} KB` : (lang === "zh" ? "缺失" : "missing") },
      { label: translateEnvironmentLabel(lang, "Stderr log size"), value: stderrStat ? `${(stderrStat.size / 1024).toFixed(1)} KB` : (lang === "zh" ? "缺失" : "missing") },
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
