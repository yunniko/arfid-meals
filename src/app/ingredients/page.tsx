import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { browseIngredients } from "@/lib/nutrition-queries";
import { SearchForm } from "@/components/nutrition/search-form";

export default async function IngredientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const [t, tn] = await Promise.all([
    getTranslations("Ingredients"),
    getTranslations("Nutrition"),
  ]);
  const entries = await browseIngredients(q);

  return (
    <main className="flex-1 p-6 md:p-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold">{t("heading")}</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">{t("subheading")}</p>
        <div className="mt-6">
          <SearchForm
            action="/ingredients"
            placeholder={tn("searchPlaceholder")}
            buttonLabel={tn("searchButton")}
            defaultValue={q}
          />
        </div>
        <ul className="mt-6 divide-y divide-black/10 dark:divide-white/10">
          {entries.map((entry) =>
            entry.kind === "group" ? (
              <li key={`group-${entry.id}`}>
                <Link
                  href={`/ingredients/groups/${entry.id}${q ? `?q=${encodeURIComponent(q)}` : ""}`}
                  className="flex items-center justify-between gap-4 py-3 hover:underline"
                >
                  <span className="font-medium">{entry.name}</span>
                  <span className="shrink-0 text-sm text-black/60 dark:text-white/60">
                    {t("variantsLabel", { count: entry.count })}
                  </span>
                </Link>
              </li>
            ) : (
              <li key={entry.ingredient.id}>
                <Link
                  href={`/ingredients/${entry.ingredient.id}`}
                  className="flex items-center justify-between gap-4 py-3 hover:underline"
                >
                  <span>
                    {entry.ingredient.name}
                    {entry.ingredient.foodGroup && (
                      <span className="ml-2 text-xs text-black/50 dark:text-white/50">
                        {entry.ingredient.foodGroup.name}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-sm text-black/60 dark:text-white/60">
                    {entry.ingredient.kcal ?? tn("unknown")} {tn("kcal")}
                  </span>
                </Link>
              </li>
            ),
          )}
        </ul>
        {entries.length === 0 && (
          <p className="mt-6 text-sm text-black/60 dark:text-white/60">{tn("noResults")}</p>
        )}
      </div>
    </main>
  );
}
