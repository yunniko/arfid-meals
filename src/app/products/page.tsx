import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { searchProducts } from "@/lib/nutrition-queries";
import { SearchForm } from "@/components/nutrition/search-form";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const [t, tn] = await Promise.all([getTranslations("Products"), getTranslations("Nutrition")]);
  const products = await searchProducts(q);

  return (
    <main className="flex-1 p-6 md:p-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold">{t("heading")}</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">{t("subheading")}</p>
        <div className="mt-6">
          <SearchForm
            action="/products"
            placeholder={tn("searchPlaceholder")}
            buttonLabel={tn("searchButton")}
            defaultValue={q}
          />
        </div>
        <ul className="mt-6 divide-y divide-black/10 dark:divide-white/10">
          {products.map((product) => (
            <li key={product.id}>
              <Link
                href={`/products/${product.id}`}
                className="flex items-center justify-between gap-4 py-3 hover:underline"
              >
                <span>
                  {product.name}
                  {product.brand && (
                    <span className="ml-2 text-xs text-black/50 dark:text-white/50">
                      {product.brand}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-sm text-black/60 dark:text-white/60">
                  {product.kcal ?? tn("unknown")} {tn("kcal")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {products.length === 0 && (
          <p className="mt-6 text-sm text-black/60 dark:text-white/60">{tn("noResults")}</p>
        )}
        <p className="mt-8 text-xs text-black/50 dark:text-white/50">{t("attribution")}</p>
      </div>
    </main>
  );
}
