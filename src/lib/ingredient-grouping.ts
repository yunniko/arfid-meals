// Derives a tree from USDA's own naming convention instead of hand-curating
// one: SR Legacy descriptions are already written as
// "food, descriptor, descriptor, ..." (e.g. "Milk, dry, nonfat, instant, ..."
// or "Chicken, broilers or fryers, breast, meat only, raw"), most-general
// segment first. Taking each ingredient's first comma segment as its group
// name is therefore a real, reproducible property of the source data, not an
// invented grouping — see HANDOVER D18 and scripts/import-ingredients.ts.
export function deriveIngredientGroupName(ingredientName: string): string {
  return ingredientName.split(",")[0].trim();
}

export type GroupableIngredient = { id: string; name: string };

export type ComputedIngredientGroup = {
  name: string;
  memberIds: string[];
};

// Only returns groups with 2+ members — a name with a single ingredient has
// no real variants to group, so it stays ungrouped rather than becoming a
// meaningless group of one (see IngredientGroup's schema comment).
export function computeIngredientGroups(
  ingredients: GroupableIngredient[],
): ComputedIngredientGroup[] {
  const byName = new Map<string, string[]>();
  for (const ingredient of ingredients) {
    const name = deriveIngredientGroupName(ingredient.name);
    const members = byName.get(name) ?? [];
    members.push(ingredient.id);
    byName.set(name, members);
  }
  return [...byName.entries()]
    .filter(([, memberIds]) => memberIds.length >= 2)
    .map(([name, memberIds]) => ({ name, memberIds }));
}
