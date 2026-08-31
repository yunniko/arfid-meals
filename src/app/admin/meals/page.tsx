import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/require-admin";
import { listMealsForAdmin } from "@/lib/meal-queries";
import { deleteMealAction } from "@/lib/meal-actions";

export default async function AdminMealsPage() {
  await requireAdmin();
  const t = await getTranslations("Admin.meals");
  const meals = await listMealsForAdmin();

  return (
    <main className="flex-1 p-6 md:p-10">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t("heading")}</h1>
          <Link
            href="/admin/meals/new"
            className="rounded-md bg-black px-4 py-2 text-sm text-white dark:bg-white dark:text-black"
          >
            {t("newLink")}
          </Link>
        </div>

        {meals.length === 0 ? (
          <p className="mt-6 text-sm text-black/60 dark:text-white/60">{t("noMeals")}</p>
        ) : (
          <ul className="mt-6 divide-y divide-black/10 dark:divide-white/10">
            {meals.map((meal) => (
              <li key={meal.id} className="flex items-center justify-between gap-4 py-3">
                <span>{meal.name}</span>
                <div className="flex shrink-0 gap-3 text-sm">
                  <Link href={`/admin/meals/${meal.id}/edit`} className="underline">
                    {t("editLink")}
                  </Link>
                  <form action={deleteMealAction.bind(null, meal.id)}>
                    <button type="submit" className="text-red-700 underline dark:text-red-400">
                      {t("deleteButton")}
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
