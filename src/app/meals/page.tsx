import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { searchMeals } from "@/lib/meal-queries";
import { SearchForm } from "@/components/nutrition/search-form";

export default async function MealsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const [t, tn, tType] = await Promise.all([
    getTranslations("Meals"),
    getTranslations("Nutrition"),
    getTranslations("MealTypeTag"),
  ]);
  const meals = await searchMeals(q);

  return (
    <main className="flex-1 p-6 md:p-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold">{t("heading")}</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">{t("subheading")}</p>
        <div className="mt-6">
          <SearchForm
            action="/meals"
            placeholder={tn("searchPlaceholder")}
            buttonLabel={tn("searchButton")}
            defaultValue={q}
          />
        </div>
        <ul className="mt-6 divide-y divide-black/10 dark:divide-white/10">
          {meals.map((meal) => (
            <li key={meal.id}>
              <Link
                href={`/meals/${meal.id}`}
                className="flex items-center justify-between gap-4 py-3 hover:underline"
              >
                <span>
                  {meal.name}
                  {meal.typeTags.length > 0 && (
                    <span className="ml-2 text-xs text-black/50 dark:text-white/50">
                      {meal.typeTags.map((tag) => tType(tag)).join(", ")}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-sm text-black/60 dark:text-white/60">
                  {Math.round(meal.totals.kcal)} {tn("kcalUnit")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {meals.length === 0 && (
          <p className="mt-6 text-sm text-black/60 dark:text-white/60">{tn("noResults")}</p>
        )}
      </div>
    </main>
  );
}
