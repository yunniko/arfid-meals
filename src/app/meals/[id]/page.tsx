import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getMeal } from "@/lib/meal-queries";
import { NutritionFacts } from "@/components/nutrition/nutrition-facts";
import { AllergenBadges } from "@/components/nutrition/allergen-badges";

export default async function MealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const meal = await getMeal(id);
  if (!meal) notFound();

  const [t, tn, tc, tType, tEffort] = await Promise.all([
    getTranslations("Meals"),
    getTranslations("Nutrition"),
    getTranslations("Common"),
    getTranslations("MealTypeTag"),
    getTranslations("MealEffortTag"),
  ]);

  return (
    <main className="flex-1 p-6 md:p-10">
      <div className="mx-auto max-w-2xl">
        <Link href="/meals" className="text-sm underline">
          {t("backLink")}
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{meal.name}</h1>
        {meal.description && (
          <p className="mt-1 text-sm text-black/70 dark:text-white/70">{meal.description}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {meal.typeTags.map((tag) => (
            <span key={tag} className="rounded-full bg-black/5 px-3 py-1 text-xs dark:bg-white/10">
              {tType(tag)}
            </span>
          ))}
          {meal.effortTags.map((tag) => (
            <span key={tag} className="rounded-full bg-black/5 px-3 py-1 text-xs dark:bg-white/10">
              {tEffort(tag)}
            </span>
          ))}
        </div>

        <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-black/60 dark:text-white/60">
          {tn("allergensLabel")}
        </h2>
        <p className="mt-1 text-xs text-black/50 dark:text-white/50">{t("allergensNote")}</p>
        <div className="mt-2">
          <AllergenBadges slugs={meal.allergenSlugs} />
        </div>

        <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-black/60 dark:text-white/60">
          {tn("factsHeading")}
        </h2>
        <div className="mt-2">
          <NutritionFacts
            nutrients={meal.totals}
            mode="total"
            incompleteFields={meal.totals.incompleteFields}
          />
        </div>

        <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-black/60 dark:text-white/60">
          {t("preparationHeading")}
        </h2>
        <p className="mt-2 whitespace-pre-line text-sm">{meal.steps || t("noSteps")}</p>

        <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-black/60 dark:text-white/60">
          {t("componentsHeading")}
        </h2>
        <ul className="mt-2 text-sm">
          {meal.components.map((component) => {
            const item = component.ingredient ?? component.product;
            const href = component.ingredientId
              ? `/ingredients/${component.ingredientId}`
              : `/products/${component.productId}`;
            return (
              <li key={component.id}>
                <Link href={href} className="underline">
                  {item?.name}
                </Link>{" "}
                — {component.quantityG}g
              </li>
            );
          })}
        </ul>

        <p className="mt-6 rounded-md bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          {meal.safetyNote || tc("safetyDisclaimer")}
        </p>
      </div>
    </main>
  );
}
