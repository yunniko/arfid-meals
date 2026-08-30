import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "@/app/locale-switcher";
import "./globals.css";

// latin-ext covers Czech diacritics — the default "latin"-only subset would
// silently fall back to a system font for Czech text instead of Geist.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

const baseUrl = process.env.APP_URL || "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  const title = t("title");
  const description = t("description");
  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    openGraph: { title, description, url: baseUrl, siteName: title, type: "website" },
    twitter: { card: "summary", title, description },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const t = await getTranslations("Common");
  const tNav = await getTranslations("Nav");
  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>
          <div className="flex items-center justify-between px-4 py-2">
            <nav className="flex gap-4 text-sm">
              <Link href="/" className="hover:underline">
                {tNav("home")}
              </Link>
              <Link href="/ingredients" className="hover:underline">
                {tNav("ingredients")}
              </Link>
              <Link href="/products" className="hover:underline">
                {tNav("products")}
              </Link>
            </nav>
            <LocaleSwitcher />
          </div>
          <div className="flex-1 flex flex-col">{children}</div>
          <footer className="px-4 py-4 text-center">
            <Link href="/about" className="text-xs text-black/60 underline dark:text-white/60">
              {t("aboutLink")}
            </Link>
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
