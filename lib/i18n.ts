export type Language = "zh" | "en";

type Copy = {
  shell: {
    navOverview: string;
    navSessions: string;
    navErrors: string;
    navConfig: string;
    sidebarTag: string;
    sidebarTitle: string;
    sidebarDetail: string;
    footerTitle: string;
    footerDetail: string;
    headerEyebrow: string;
    headerDetail: string;
    readOnly: string;
  };
  overview: {
    eyebrow: string;
    title: string;
    detail: string;
    gateway: string;
    version: string;
    unknown: string;
    uptime: string;
    minutes: string;
    pipelinePulse: string;
    trackedSessions: string;
    activeSessions: string;
    needAttention: string;
    lastPersonaWrite: string;
    scenesProcessed: string;
    memoryMixEyebrow: string;
    memoryMixTitle: string;
    memoryMixDetail: string;
    attentionEyebrow: string;
    attentionTitle: string;
    attentionDetail: string;
    latestSignalsEyebrow: string;
    latestSignalsTitle: string;
    latestSignalsDetail: string;
    watch: string;
    metrics: {
      l0Label: string;
      l0Hint: string;
      l1Label: string;
      l1Hint: string;
      trackedLabel: string;
      trackedHint: string;
      errorsLabel: string;
      errorsHint: string;
    };
    table: {
      session: string;
      state: string;
      lastActivity: string;
      lastScene: string;
    };
  };
  sessions: {
    eyebrow: string;
    title: string;
    detail: string;
    searchPlaceholder: string;
    filter: string;
    emptyTitle: string;
    emptyDetail: string;
    table: {
      session: string;
      state: string;
      cursor: string;
      lastL0: string;
      lastScene: string;
    };
  };
  sessionDetail: {
    eyebrow: string;
    detail: string;
    state: string;
    l0l1: string;
    rawVsStructured: string;
    l1Cursor: string;
    consumedByL1: string;
    lastScene: string;
    l0Eyebrow: string;
    l0Title: string;
    l0Detail: string;
    l1Eyebrow: string;
    l1Title: string;
    l1Detail: string;
    noL1Title: string;
    noL1Detail: string;
    logsEyebrow: string;
    logsTitle: string;
    logsDetail: string;
    noLogsTitle: string;
    noLogsDetail: string;
    table: {
      role: string;
      message: string;
      recorded: string;
      type: string;
      scene: string;
      content: string;
      created: string;
    };
  };
  errors: {
    eyebrow: string;
    title: string;
    detail: string;
    errorClass: string;
    recentEyebrow: string;
    recentTitle: string;
    recentDetail: string;
  };
  config: {
    eyebrow: string;
    title: string;
    detail: string;
    environment: string;
    checkpointSummary: string;
    totalProcessed: string;
    memoriesSincePersona: string;
    scenesProcessed: string;
    trackedStates: string;
    pathsEyebrow: string;
    pathsTitle: string;
    pathsDetail: string;
    path: string;
    value: string;
    jsonEyebrow: string;
    jsonTitle: string;
    jsonDetail: string;
  };
  notFound: {
    eyebrow: string;
    title: string;
    detail: string;
    action: string;
  };
  common: {
    noValue: string;
    missing: string;
    stdout: string;
    stderr: string;
  };
};

export const copy: Record<Language, Copy> = {
  zh: {
    shell: {
      navOverview: "总览",
      navSessions: "会话",
      navErrors: "错误",
      navConfig: "配置",
      sidebarTag: "TencentDB Memory",
      sidebarTitle: "观察台",
      sidebarDetail: "用于查看 Gateway 健康状态、会话流转和结构化记忆结果的只读控制台。",
      footerTitle: "观测优先 MVP",
      footerDetail: "面向排障，不做写入。当前所有页面默认只读。",
      headerEyebrow: "本地控制台",
      headerDetail: "在一个视图里查看 Gateway、SQLite、checkpoint 和日志。",
      readOnly: "只读",
    },
    overview: {
      eyebrow: "总览",
      title: "TencentDB 记忆系统状态",
      detail: "先从这里判断系统是否还活着：Gateway 是否在线、对话是否进入 L0，以及 L1 是否真的产出了结构化记忆。",
      gateway: "Gateway",
      version: "版本",
      unknown: "未知",
      uptime: "运行时长",
      minutes: "分钟",
      pipelinePulse: "Pipeline 脉搏",
      trackedSessions: "跟踪中的会话",
      activeSessions: "活跃会话",
      needAttention: "需要关注",
      lastPersonaWrite: "最近 persona 写入",
      scenesProcessed: "已处理场景",
      memoryMixEyebrow: "记忆结构",
      memoryMixTitle: "结构化输出分布",
      memoryMixDetail: "这里展示当前 L1 的类型分布。如果某类突然消失或异常放大，通常意味着提取或去重逻辑发生了变化。",
      attentionEyebrow: "会话关注",
      attentionTitle: "最近会话",
      attentionDetail: "按最新 L0 活跃时间排序。最快看出哪些会话虽然收到了消息，但 L1 仍然为空或已经落后。",
      latestSignalsEyebrow: "最新信号",
      latestSignalsTitle: "错误流",
      latestSignalsDetail: "这里按错误模式聚合，而不是按堆栈展示。目标是让你更快判断现在究竟坏在哪一类链路上。",
      watch: "关注",
      metrics: {
        l0Label: "L0 消息",
        l0Hint: "原始捕获轮次",
        l1Label: "L1 记忆",
        l1Hint: "结构化记忆记录",
        trackedLabel: "会话总数",
        trackedHint: "来自 checkpoint 与数据库",
        errorsLabel: "近期错误",
        errorsHint: "来自最新 Gateway 日志",
      },
      table: {
        session: "会话",
        state: "状态",
        lastActivity: "最近活动",
        lastScene: "最近场景",
      },
    },
    sessions: {
      eyebrow: "会话",
      title: "会话观测",
      detail: "支持按 session key、最近 scene 或状态原因搜索。这里只做解释，不对数据做改写。",
      searchPlaceholder: "搜索 session key、scene 或状态原因",
      filter: "筛选",
      emptyTitle: "没有匹配的会话",
      emptyDetail: "可以尝试更短的前缀，或者搜索某个由 L1 产出的 scene 名称。",
      table: {
        session: "会话",
        state: "状态",
        cursor: "Cursor",
        lastL0: "最近 L0",
        lastScene: "最近场景",
      },
    },
    sessionDetail: {
      eyebrow: "会话详情",
      detail: "把这个会话的 L0 原文、L1 结果、checkpoint cursor 和关联日志串在一起，帮助你把单个会话的链路讲清楚。",
      state: "状态",
      l0l1: "L0 / L1",
      rawVsStructured: "原始消息与结构化记录",
      l1Cursor: "L1 Cursor",
      consumedByL1: "L1 已消费到的最新 recorded_at",
      lastScene: "最近场景",
      l0Eyebrow: "L0",
      l0Title: "捕获消息",
      l0Detail: "按时间顺序展示 `l0_conversations` 里的原始对话记录。",
      l1Eyebrow: "L1",
      l1Title: "结构化记忆输出",
      l1Detail: "这些是当前和该会话关联的 L1 记录。",
      noL1Title: "没有 L1 记录",
      noL1Detail: "这个会话已经有原始 L0 行，但暂时还没有对应的结构化记忆记录。",
      logsEyebrow: "日志",
      logsTitle: "会话相关日志",
      logsDetail: "这里只显示明确包含该 session key 的日志，所以行数不多，但通常更有用。",
      noLogsTitle: "没有直接匹配的日志",
      noLogsDetail: "这不代表处理失败；并不是每条 L1 相关日志都会显式带上 session key。",
      table: {
        role: "角色",
        message: "消息",
        recorded: "记录时间",
        type: "类型",
        scene: "场景",
        content: "内容",
        created: "创建时间",
      },
    },
    errors: {
      eyebrow: "错误",
      title: "按模式分组的失败信号",
      detail: "错误按运维意义分组，方便你快速判断当前问题主要出在提取、thinking mode、embedding 还是工具调用。",
      errorClass: "错误类别",
      recentEyebrow: "最近日志",
      recentTitle: "近期错误日志",
      recentDetail: "这里聚合 stdout 与 stderr 中最近的非 info 日志。",
    },
    config: {
      eyebrow: "配置",
      title: "运行时配置",
      detail: "这里既展示当前本地 Gateway 配置，也允许你为当前浏览器保存运行时输入。对记忆数据库本身仍然保持只读。",
      environment: "环境信息",
      checkpointSummary: "Checkpoint 摘要",
      totalProcessed: "累计处理",
      memoriesSincePersona: "距上次 persona 的记忆数",
      scenesProcessed: "已处理场景",
      trackedStates: "跟踪状态数",
      pathsEyebrow: "路径",
      pathsTitle: "本地文件绑定",
      pathsDetail: "这些是当前控制台正在读取的 live 文件和目录。",
      path: "路径项",
      value: "值",
      jsonEyebrow: "脱敏 JSON",
      jsonTitle: "Gateway 配置载荷",
      jsonDetail: "这里展示的是脱敏后的本地 `tdai-gateway.json`。",
    },
    notFound: {
      eyebrow: "缺失视图",
      title: "这个会话视图暂时不可用。",
      detail: "可能是这个 session key 已经不存在于当前本地存储里，或者数据目录指向了另一个 TencentDB memory 实例。",
      action: "返回会话列表",
    },
    common: {
      noValue: "—",
      missing: "缺失",
      stdout: "标准输出",
      stderr: "标准错误",
    },
  },
  en: {
    shell: {
      navOverview: "Overview",
      navSessions: "Sessions",
      navErrors: "Errors",
      navConfig: "Config",
      sidebarTag: "TencentDB Memory",
      sidebarTitle: "Observatory",
      sidebarDetail: "Read-only operating console for live gateway health, session flow, and structured memory visibility.",
      footerTitle: "Observability-first MVP",
      footerDetail: "Designed for debugging, not mutation. Every page is read-only by default.",
      headerEyebrow: "Local Console",
      headerDetail: "Gateway, SQLite, checkpoint, and log observability in one view.",
      readOnly: "read only",
    },
    overview: {
      eyebrow: "Overview",
      title: "TencentDB memory system status",
      detail: "Start here when you need to answer a simple question quickly: is the gateway alive, are sessions flowing into L0, and is L1 actually being produced.",
      gateway: "Gateway",
      version: "Version",
      unknown: "unknown",
      uptime: "Uptime",
      minutes: "min",
      pipelinePulse: "Pipeline pulse",
      trackedSessions: "Tracked sessions",
      activeSessions: "Active sessions",
      needAttention: "Need attention",
      lastPersonaWrite: "Last persona write",
      scenesProcessed: "Scenes processed",
      memoryMixEyebrow: "Memory Mix",
      memoryMixTitle: "Structured output mix",
      memoryMixDetail: "This is the current shape of L1. If one type suddenly dominates or vanishes, it is often the first sign that extraction or dedup behavior changed.",
      attentionEyebrow: "Attention",
      attentionTitle: "Recent sessions",
      attentionDetail: "Recent session flow, ordered by latest L0 activity. This is the fastest way to spot sessions that captured messages but still look behind or empty.",
      latestSignalsEyebrow: "Latest Signals",
      latestSignalsTitle: "Error stream",
      latestSignalsDetail: "The error list is grouped by pattern, not by stack trace. The goal is to help you answer what class of failure is happening right now.",
      watch: "watch",
      metrics: {
        l0Label: "L0 Messages",
        l0Hint: "Raw captured turns",
        l1Label: "L1 Memories",
        l1Hint: "Structured memory records",
        trackedLabel: "Tracked Sessions",
        trackedHint: "Seen in checkpoint + DB",
        errorsLabel: "Recent Errors",
        errorsHint: "From latest gateway logs",
      },
      table: {
        session: "Session",
        state: "State",
        lastActivity: "Last activity",
        lastScene: "Last scene",
      },
    },
    sessions: {
      eyebrow: "Sessions",
      title: "Session observability",
      detail: "Search by session key, last scene, or status reason. Sessions stay read-only here: the goal is to explain what happened, not to mutate it.",
      searchPlaceholder: "Search session key, scene, or reason",
      filter: "Filter",
      emptyTitle: "No sessions matched",
      emptyDetail: "Try a shorter session key prefix or search for a scene name that was emitted by L1.",
      table: {
        session: "Session",
        state: "State",
        cursor: "Cursor",
        lastL0: "Last L0",
        lastScene: "Last scene",
      },
    },
    sessionDetail: {
      eyebrow: "Session Detail",
      detail: "This page ties together L0 messages, L1 outputs, checkpoint cursors, and session-specific log fragments so you can explain a single session end to end.",
      state: "State",
      l0l1: "L0 / L1",
      rawVsStructured: "Raw messages versus structured records",
      l1Cursor: "L1 cursor",
      consumedByL1: "Latest recorded_at consumed by L1",
      lastScene: "Last scene",
      l0Eyebrow: "L0",
      l0Title: "Captured messages",
      l0Detail: "Chronological raw conversation rows from `l0_conversations`.",
      l1Eyebrow: "L1",
      l1Title: "Structured memory output",
      l1Detail: "These are the L1 records currently associated with this session.",
      noL1Title: "No L1 records",
      noL1Detail: "This session has raw L0 rows but no associated structured memory records yet.",
      logsEyebrow: "Logs",
      logsTitle: "Session-correlated log lines",
      logsDetail: "Only log lines that explicitly mention this session key are shown here, so this section stays sparse but high-signal.",
      noLogsTitle: "No direct log matches",
      noLogsDetail: "The session may still have processed successfully; not every L1 path logs the session key on every line.",
      table: {
        role: "Role",
        message: "Message",
        recorded: "Recorded",
        type: "Type",
        scene: "Scene",
        content: "Content",
        created: "Created",
      },
    },
    errors: {
      eyebrow: "Errors",
      title: "Grouped failure patterns",
      detail: "Errors are grouped by operational meaning so you can see whether the current problem is mostly extraction, thinking mode, embedding, or tooling.",
      errorClass: "error class",
      recentEyebrow: "Recent lines",
      recentTitle: "Recent error-bearing log entries",
      recentDetail: "A compact stream of the latest non-info lines from stdout and stderr.",
    },
    config: {
      eyebrow: "Config",
      title: "Runtime configuration",
      detail: "This page mirrors the local gateway configuration, and also lets you save browser-scoped runtime inputs while keeping the memory data itself read-only.",
      environment: "Environment",
      checkpointSummary: "Checkpoint summary",
      totalProcessed: "Total processed",
      memoriesSincePersona: "Memories since persona",
      scenesProcessed: "Scenes processed",
      trackedStates: "Tracked states",
      pathsEyebrow: "Paths",
      pathsTitle: "Local filesystem bindings",
      pathsDetail: "These are the live files and directories the console is reading.",
      path: "Path",
      value: "Value",
      jsonEyebrow: "Sanitized JSON",
      jsonTitle: "Gateway config payload",
      jsonDetail: "This is the local `tdai-gateway.json` after secret masking.",
    },
    notFound: {
      eyebrow: "Missing View",
      title: "This session view is not available.",
      detail: "The session key may no longer exist in the local store, or the data directory may point at a different TencentDB memory instance.",
      action: "Return to sessions",
    },
    common: {
      noValue: "—",
      missing: "missing",
      stdout: "stdout",
      stderr: "stderr",
    },
  },
};

export function normalizeLanguage(value?: string | null): Language {
  return value === "zh" ? "zh" : "en";
}

export function getCopy(lang: Language) {
  return copy[lang];
}

export function getLocale(lang: Language) {
  return lang === "zh" ? "zh-CN" : "en-US";
}

export function formatDateByLanguage(
  value: string | null,
  lang: Language,
  options: Intl.DateTimeFormatOptions,
) {
  if (!value) {
    return copy[lang].common.noValue;
  }
  return new Intl.DateTimeFormat(getLocale(lang), options).format(new Date(value));
}

export function translateStatusLabel(
  lang: Language,
  value: "online" | "degraded" | "offline" | "healthy" | "attention" | "lagging" | "empty",
) {
  if (lang === "zh") {
    return {
      online: "在线",
      degraded: "降级",
      offline: "离线",
      healthy: "正常",
      attention: "需关注",
      lagging: "滞后",
      empty: "空缺",
    }[value];
  }

  return {
    online: "Online",
    degraded: "Degraded",
    offline: "Offline",
    healthy: "Healthy",
    attention: "Attention",
    lagging: "Lagging",
    empty: "Empty",
  }[value];
}

export function translateRole(lang: Language, role: string) {
  if (lang !== "zh") return role;

  return {
    user: "用户",
    assistant: "助手",
    system: "系统",
    tool: "工具",
  }[role as "user" | "assistant" | "system" | "tool"] ?? role;
}

export function translateMemoryType(lang: Language, type: string) {
  if (lang !== "zh") return type || "untyped";

  return {
    persona: "persona 画像",
    episodic: "经历记忆",
    instruction: "指令记忆",
    preference: "偏好记忆",
    untyped: "未分类",
  }[type as "persona" | "episodic" | "instruction" | "preference" | "untyped"] ?? type;
}
