import "server-only";

import os from "node:os";
import path from "node:path";
import { cookies } from "next/headers";

export const DATA_DIR_COOKIE = "tdai-data-dir";
export const GATEWAY_URL_COOKIE = "tdai-gateway-url";

export const DEFAULT_DATA_DIR = path.join(os.homedir(), ".memory-tencentdb", "memory-tdai");
export const DEFAULT_GATEWAY_URL = "http://127.0.0.1:8420";

export type RuntimeValueSource = "saved" | "environment" | "default";

export type RuntimeConfig = {
  dataDir: string;
  gatewayUrl: string;
  dbPath: string;
  checkpointPath: string;
  configPath: string;
  stdoutLogPath: string;
  stderrLogPath: string;
  sources: {
    dataDir: RuntimeValueSource;
    gatewayUrl: RuntimeValueSource;
  };
  defaults: {
    dataDir: string;
    gatewayUrl: string;
  };
};

export function normalizeDataDirInput(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function normalizeGatewayUrlInput(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    if (!/^https?:$/.test(url.protocol)) return null;
    const normalizedPath = url.pathname === "/" ? "" : url.pathname.replace(/\/+$/, "");
    return `${url.origin}${normalizedPath}`;
  } catch {
    return null;
  }
}

export async function getRuntimeConfig(): Promise<RuntimeConfig> {
  const cookieStore = await cookies();
  const savedDataDir = normalizeDataDirInput(cookieStore.get(DATA_DIR_COOKIE)?.value);
  const savedGatewayUrl = normalizeGatewayUrlInput(cookieStore.get(GATEWAY_URL_COOKIE)?.value);
  const envDataDir = normalizeDataDirInput(process.env.TDAI_DATA_DIR);
  const envGatewayUrl = normalizeGatewayUrlInput(process.env.TDAI_GATEWAY_URL);

  const dataDir = savedDataDir ?? envDataDir ?? DEFAULT_DATA_DIR;
  const gatewayUrl = savedGatewayUrl ?? envGatewayUrl ?? DEFAULT_GATEWAY_URL;

  return {
    dataDir,
    gatewayUrl,
    dbPath: path.join(dataDir, "vectors.db"),
    checkpointPath: path.join(dataDir, ".metadata", "recall_checkpoint.json"),
    configPath: path.join(dataDir, "tdai-gateway.json"),
    stdoutLogPath: path.join(dataDir, "logs", "gateway.stdout.log"),
    stderrLogPath: path.join(dataDir, "logs", "gateway.stderr.log"),
    sources: {
      dataDir: savedDataDir ? "saved" : envDataDir ? "environment" : "default",
      gatewayUrl: savedGatewayUrl ? "saved" : envGatewayUrl ? "environment" : "default",
    },
    defaults: {
      dataDir: DEFAULT_DATA_DIR,
      gatewayUrl: DEFAULT_GATEWAY_URL,
    },
  };
}
