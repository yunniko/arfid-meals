import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProduct } from "@/lib/nutrition-queries";
import { NutritionFacts } from "@/components/nutrition/nutrition-facts";
import { AllergenBadges } from "@/components/nutrition/allergen-badges";
import type { AllergenSlug } from "@/lib/allergens";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const [t, tn, tc] = await Promise.all([
    getTranslations("Products"),
    getTranslations("Nutrition"),
    getTranslations("Common"),
  ]);

  return (
    <main className="flex-1 p-6 md:p-10">
      <div className="mx-auto max-w-2xl">
        <Link href="/products" className="text-sm underline">
          {t("backLink")}
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{product.name}</h1>
        {product.brand && (
          <p className="text-sm text-black/60 dark:text-white/60">
            {product.brand} — {product.countryCode}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-4">
          <span className="rounded-md bg-black/5 px-3 py-1 text-sm dark:bg-white/10">
            {product.containsGluten ? tn("gluten") : tn("noGluten")}
          </span>
          <span className="rounded-md bg-black/5 px-3 py-1 text-sm dark:bg-white/10">
            {product.containsLactose ? tn("lactose") : tn("noLactose")}
          </span>
        </div>

        <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-black/60 dark:text-white/60">
          {tn("allergensLabel")}
        </h2>
        <div className="mt-2">
          <AllergenBadges
            slugs={product.allergenLinks.map((l) => l.allergen.slug) as AllergenSlug[]}
          />
        </div>

        <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-black/60 dark:text-white/60">
          {tn("factsHeading")}
        </h2>
        <div className="mt-2">
          <NutritionFacts nutrients={product} />
        </div>

        <p className="mt-6 rounded-md bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          {tc("safetyDisclaimer")}
        </p>

        <p className="mt-4 text-xs text-black/50 dark:text-white/50">
          {tn("source")}: {t("attribution")}
          {product.sourceUrl && (
            <>
              {" — "}
              <a href={product.sourceUrl} className="underline" target="_blank" rel="noreferrer">
                {product.sourceUrl}
              </a>
            </>
          )}
        </p>
      </div>
    </main>
  );
}
