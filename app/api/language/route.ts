import { NextResponse } from "next/server";
import { normalizeLanguage } from "@/lib/i18n";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lang = normalizeLanguage(url.searchParams.get("lang"));
  const redirectParam = url.searchParams.get("redirect") || "/";
  const redirect = redirectParam.startsWith("/") ? redirectParam : "/";

  const response = NextResponse.redirect(new URL(redirect, url.origin));
  response.cookies.set("tdai-lang", lang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  return response;
}
