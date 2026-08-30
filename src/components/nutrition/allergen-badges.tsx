import { getTranslations } from "next-intl/server";
import type { AllergenSlug } from "@/lib/allergens";

export async function AllergenBadges({ slugs }: { slugs: AllergenSlug[] }) {
  const t = await getTranslations("Allergens");
  const tn = await getTranslations("Nutrition");
  if (slugs.length === 0) {
    return <p className="text-sm text-black/60 dark:text-white/60">{tn("noAllergens")}</p>;
  }
  return (
    <ul className="flex flex-wrap gap-2">
      {slugs.map((slug) => (
        <li
          key={slug}
          className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-200"
        >
          {t(slug)}
        </li>
      ))}
    </ul>
  );
}
