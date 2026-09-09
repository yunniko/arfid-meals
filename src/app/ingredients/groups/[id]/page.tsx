import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getIngredientGroup, searchIngredientGroupMembers } from "@/lib/nutrition-queries";
import { SearchForm } from "@/components/nutrition/search-form";

export default async function IngredientGroupPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { id } = await params;
  const { q = "" } = await searchParams;
  const group = await getIngredientGroup(id);
  if (!group) notFound();

  const [t, tn] = await Promise.all([
    getTranslations("Ingredients"),
    getTranslations("Nutrition"),
  ]);
  const members = await searchIngredientGroupMembers(id, q);

  return (
    <main className="flex-1 p-6 md:p-10">
      <div className="mx-auto max-w-2xl">
        <Link href="/ingredients" className="text-sm underline">
          {t("backLink")}
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{group.name}</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">{t("groupSubheading")}</p>
        <div className="mt-6">
          <SearchForm
            action={`/ingredients/groups/${id}`}
            placeholder={tn("searchPlaceholder")}
            buttonLabel={tn("searchButton")}
            defaultValue={q}
          />
        </div>
        <ul className="mt-6 divide-y divide-black/10 dark:divide-white/10">
          {members.map((ingredient) => (
            <li key={ingredient.id}>
              <Link
                href={`/ingredients/${ingredient.id}`}
                className="flex items-center justify-between gap-4 py-3 hover:underline"
              >
                <span>{ingredient.name}</span>
                <span className="shrink-0 text-sm text-black/60 dark:text-white/60">
                  {ingredient.kcal ?? tn("unknown")} {tn("kcal")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {members.length === 0 && (
          <p className="mt-6 text-sm text-black/60 dark:text-white/60">{tn("noResults")}</p>
        )}
      </div>
    </main>
  );
}
