// Turns a display name into a URL/DB-safe kebab-case slug. Used wherever a
// slug must be derived from arbitrary text rather than hand-written (see
// scripts/import-ingredients.ts's IngredientGroup slugs) — seed-taxonomy.ts's
// FoodGroup/Allergen slugs stay hand-written since that vocabulary is small
// and fixed.
export function slugify(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
