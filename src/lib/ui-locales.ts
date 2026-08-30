// UI locale configuration — pure module, unit-testable in isolation. Fixed
// two-language MVP set (cs/en, see GOALS.md D4) rather than env-driven —
// there's no staged-rollout need yet, matching when-we-meet's precedent for
// a fixed set over listing-studio's env-driven one. English stays the
// fallback baseline (portfolio convention): a locale without a messages
// file, or with a partial one, falls back to English key-by-key via
// mergeMessages.

export const DEFAULT_LOCALE = "en";

const ENABLED_LOCALES = ["en", "cs"] as const;

export type UiLocale = (typeof ENABLED_LOCALES)[number];

export function enabledUiLocales(): string[] {
  return [...ENABLED_LOCALES];
}

export function isUiLocale(value: string): value is UiLocale {
  return (ENABLED_LOCALES as readonly string[]).includes(value);
}

// Human-readable native name for the switcher ("English", "Čeština")
// without maintaining a translation-of-language-names table.
export function localeDisplayName(code: string): string {
  try {
    const name = new Intl.DisplayNames([code], { type: "language" }).of(code);
    if (name && name !== code) return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    // fall through to the raw code
  }
  return code.toUpperCase();
}

type Messages = { [key: string]: string | Messages };

// Deep-merges a (possibly partial) translation file over the English base so
// untranslated keys render in English instead of erroring.
export function mergeMessages(base: Messages, overlay: Messages): Messages {
  const result: Messages = { ...base };
  for (const [key, value] of Object.entries(overlay)) {
    const existing = result[key];
    if (
      value !== null &&
      typeof value === "object" &&
      existing !== null &&
      typeof existing === "object"
    ) {
      result[key] = mergeMessages(existing as Messages, value as Messages);
    } else {
      result[key] = value;
    }
  }
  return result;
}
