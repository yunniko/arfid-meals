import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/require-admin";
import { createMealAction } from "@/lib/meal-actions";
import { MealForm } from "@/components/admin/meal-form";

export default async function NewMealPage() {
  await requireAdmin();
  const t = await getTranslations("Admin.meals");

  return (
    <main className="flex-1 p-6 md:p-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold">{t("newLink")}</h1>
        <div className="mt-6">
          <MealForm action={createMealAction} />
        </div>
      </div>
    </main>
  );
}
