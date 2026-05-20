import type { Metadata } from "next";
import { Fraunces, Manrope, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { getCurrentLanguage } from "@/lib/server-language";

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const monoFont = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const displayFont = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

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
      className={`${bodyFont.variable} ${monoFont.variable} ${displayFont.variable} h-full antialiased`}
    >
      <body className="min-h-full font-[family-name:var(--font-body)]">
        <AppShell lang={lang}>{children}</AppShell>
      </body>
    </html>
  );
}
