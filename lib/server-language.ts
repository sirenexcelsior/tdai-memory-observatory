import { cookies } from "next/headers";
import { normalizeLanguage } from "@/lib/i18n";

export async function getCurrentLanguage() {
  const cookieStore = await cookies();
  return normalizeLanguage(cookieStore.get("tdai-lang")?.value);
}
