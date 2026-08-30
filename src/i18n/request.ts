import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import enMessages from "../../messages/en.json";
import { DEFAULT_LOCALE, enabledUiLocales, mergeMessages } from "@/lib/ui-locales";

export { DEFAULT_LOCALE };

// Locale comes from a cookie (no locale segment in URLs), matching the
// portfolio pattern. The enabled locale list is a fixed cs/en set (see
// lib/ui-locales.ts); a locale without a messages file falls back to
// English key-by-key, so partial translations still render.
export default getRequestConfig(async () => {
  const locales = enabledUiLocales();
  const cookieLocale = (await cookies()).get("locale")?.value;
  const locale =
    cookieLocale && locales.includes(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

  type Messages = Parameters<typeof mergeMessages>[0];
  let messages = enMessages as unknown as Messages;
  if (locale !== DEFAULT_LOCALE) {
    try {
      const overlay = (await import(`../../messages/${locale}.json`)).default;
      messages = mergeMessages(messages, overlay as Messages);
    } catch {
      // No translation file yet — full English fallback
    }
  }

  return { locale, messages };
});
