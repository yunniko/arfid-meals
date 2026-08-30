import { getTranslations } from "next-intl/server";

// Stub for M1 — full Terms & Conditions (with the safety-reevaluation
// disclaimer as legal text, not just this summary) land in M6. Kept as a
// real route now rather than a dead footer link, and to surface the
// disclaimer from day one.
export default async function AboutPage() {
  const t = await getTranslations("Common");
  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-xl font-semibold">arfid-meals</h1>
      <p className="max-w-md text-sm text-black/70 dark:text-white/70">{t("safetyDisclaimer")}</p>
    </main>
  );
}
