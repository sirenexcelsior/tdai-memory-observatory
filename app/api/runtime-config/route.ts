import { NextResponse } from "next/server";
import {
  DATA_DIR_COOKIE,
  GATEWAY_URL_COOKIE,
  normalizeDataDirInput,
  normalizeGatewayUrlInput,
} from "@/lib/runtime-config";

type RuntimeConfigPayload = {
  dataDir?: string;
  gatewayUrl?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as RuntimeConfigPayload | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  const dataDir = normalizeDataDirInput(body.dataDir);
  const gatewayUrlRaw = body.gatewayUrl?.trim();
  const gatewayUrl = normalizeGatewayUrlInput(body.gatewayUrl);

  if (body.dataDir !== undefined) {
    if (dataDir) {
      response.cookies.set(DATA_DIR_COOKIE, dataDir, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
        httpOnly: true,
      });
    } else {
      response.cookies.delete(DATA_DIR_COOKIE);
    }
  }

  if (body.gatewayUrl !== undefined) {
    if (gatewayUrlRaw && !gatewayUrl) {
      return NextResponse.json(
        { error: "Gateway URL must be a valid http:// or https:// URL", code: "INVALID_GATEWAY_URL" },
        { status: 400 },
      );
    }

    if (gatewayUrl) {
      response.cookies.set(GATEWAY_URL_COOKIE, gatewayUrl, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
        httpOnly: true,
      });
    } else {
      response.cookies.delete(GATEWAY_URL_COOKIE);
    }
  }

  return response;
}
