import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { generateCompliantMeals } from "@/lib/generation-queries";
import { NutritionFacts } from "@/components/nutrition/nutrition-facts";
import { MealTypeTag, MealEffortTag } from "@/generated/prisma/enums";

export default async function GenerateMealPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; effort?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { type, effort } = await searchParams;
  const typeTag = Object.values(MealTypeTag).includes(type as MealTypeTag)
    ? (type as MealTypeTag)
    : undefined;
  const effortTag = Object.values(MealEffortTag).includes(effort as MealEffortTag)
    ? (effort as MealEffortTag)
    : undefined;

  const [t, tType, tEffort] = await Promise.all([
    getTranslations("Generate"),
    getTranslations("MealTypeTag"),
    getTranslations("MealEffortTag"),
  ]);

  const result = await generateCompliantMeals(session.user.id, { typeTag, effortTag });
  const { picked } = result;

  const currentParams = new URLSearchParams();
  if (type) currentParams.set("type", type);
  if (effort) currentParams.set("effort", effort);
  const regenerateHref = `/meals/generate${currentParams.size > 0 ? `?${currentParams}` : ""}`;

  return (
    <main className="flex-1 p-6 md:p-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold">{t("heading")}</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">{t("subheading")}</p>

        <form className="mt-6 flex flex-wrap items-end gap-4" action="/meals/generate">
          <label className="flex flex-col gap-1 text-sm">
            {t("typeLabel")}
            <select
              name="type"
              defaultValue={type ?? ""}
              className="rounded-md border border-black/15 px-3 py-2 dark:border-white/15 dark:bg-black"
            >
              <option value="">{t("anyOption")}</option>
              {Object.values(MealTypeTag).map((tag) => (
                <option key={tag} value={tag}>
                  {tType(tag)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t("effortLabel")}
            <select
              name="effort"
              defaultValue={effort ?? ""}
              className="rounded-md border border-black/15 px-3 py-2 dark:border-white/15 dark:bg-black"
            >
              <option value="">{t("anyOption")}</option>
              {Object.values(MealEffortTag).map((tag) => (
                <option key={tag} value={tag}>
                  {tEffort(tag)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="rounded-md bg-black px-4 py-2 text-sm text-white dark:bg-white dark:text-black"
          >
            {t("submit")}
          </button>
        </form>

        {result.totalCandidates === 0 ? (
          <p className="mt-8 text-sm text-black/60 dark:text-white/60">{t("noMeals")}</p>
        ) : (
          <>
            <p className="mt-8 text-sm text-black/60 dark:text-white/60">
              {t("matchSummary", {
                compliant: result.compliantCount,
                total: result.totalCandidates,
              })}
            </p>

            {picked ? (
              <div className="mt-4 rounded-lg border border-black/10 p-4 dark:border-white/10">
                <h2 className="text-xl font-semibold">{picked.name}</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {picked.typeTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-black/5 px-3 py-1 text-xs dark:bg-white/10"
                    >
                      {tType(tag)}
                    </span>
                  ))}
                  {picked.effortTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-black/5 px-3 py-1 text-xs dark:bg-white/10"
                    >
                      {tEffort(tag)}
                    </span>
                  ))}
                </div>
                <div className="mt-4">
                  <NutritionFacts
                    nutrients={picked.totals}
                    mode="total"
                    incompleteFields={picked.totals.incompleteFields}
                  />
                </div>
                <div className="mt-4 flex gap-4 text-sm">
                  <Link href={`/meals/${picked.id}`} className="underline">
                    {t("viewDetails")}
                  </Link>
                  <Link href={regenerateHref} className="underline">
                    {t("tryAnother")}
                  </Link>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-black/60 dark:text-white/60">
                {t("noMatches", { total: result.totalCandidates })}
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
