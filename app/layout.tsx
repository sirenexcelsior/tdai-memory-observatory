import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { getCurrentLanguage } from "@/lib/server-language";

export const metadata: Metadata = {
  title: "TDAI Memory Observatory",
  description: "Read-only TencentDB memory gateway observability console",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const lang = await getCurrentLanguage();

  return (
    <html
      lang={lang === "zh" ? "zh-CN" : "en"}
      className="h-full antialiased"
    >
      <body className="min-h-full font-[family-name:var(--font-body)]">
        <AppShell lang={lang}>{children}</AppShell>
      </body>
    </html>
  );
}
