import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/require-admin";
import { getMealForEdit } from "@/lib/meal-queries";
import { updateMealAction } from "@/lib/meal-actions";
import { MealForm } from "@/components/admin/meal-form";

export default async function EditMealPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const meal = await getMealForEdit(id);
  if (!meal) notFound();

  const t = await getTranslations("Admin.meals");
  const boundUpdate = updateMealAction.bind(null, meal.id);

  return (
    <main className="flex-1 p-6 md:p-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold">{t("editLink")}</h1>
        <div className="mt-6">
          <MealForm
            action={boundUpdate}
            initial={{
              name: meal.name,
              description: meal.description ?? "",
              steps: meal.steps ?? "",
              safetyNote: meal.safetyNote ?? "",
              typeTags: meal.typeTags,
              effortTags: meal.effortTags,
              components: meal.components.map((c) => ({
                kind: c.ingredientId ? ("ingredient" as const) : ("product" as const),
                id: (c.ingredientId ?? c.productId)!,
                name: c.ingredient?.name ?? c.product?.name ?? "",
                quantityG: c.quantityG,
              })),
            }}
          />
        </div>
      </div>
    </main>
  );
}
