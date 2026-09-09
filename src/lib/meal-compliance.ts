// Decides whether a meal is safe to suggest to a given profile, per its
// exclusion rules. Pure and unit-tested — this is the actual safety-facing
// logic behind "generate a meal for me" (G-001 acceptance criterion 5).
//
// Deliberately NOT scored/ranked by any nutrition-balance formula (see
// HANDOVER D13): the acceptance criterion is "never suggest something on
// the blacklist, and only whitelist items for a whitelist-only user" —
// compliance is a hard filter, not a fuzzy heuristic. Nutrition balance
// itself is left to the user to judge from the numbers already shown on
// each meal, matching the app's existing safety-disclaimer stance rather
// than inventing target macro ranges with no real backing.

export type ComplianceComponent = {
  ingredientId: string | null;
  productId: string | null;
  // Only set for ingredient components with a food group; null for
  // products (which have no group in this schema) or ungrouped
  // ingredients. A null value here means a group-targeted rule can never
  // match this component — see HANDOVER D13 for why group rules are
  // ingredient-only for now.
  ingredientFoodGroupId: string | null;
  // The ingredient's IngredientGroup id (e.g. "Chicken" — every USDA
  // chicken cut, see HANDOVER D18), a different, finer-grained axis from
  // ingredientFoodGroupId above. Same ingredient-only limitation as that
  // field, for the same reason (products have no group in this schema).
  ingredientGroupId: string | null;
};

export type ComplianceRule = {
  listType: "BLACKLIST" | "WHITELIST";
  foodGroupId: string | null;
  ingredientGroupId: string | null;
  ingredientId: string | null;
  productId: string | null;
  preparation: string | null;
};

export type ComplianceMeal = {
  // Pre-joined name + description + steps, used only to test a rule's
  // free-text `preparation` qualifier against — see componentMatchesRule.
  mealText: string;
  components: ComplianceComponent[];
};

export type FoodGroupNode = { id: string; parentId: string | null };

export function isInGroupOrDescendant(
  componentGroupId: string,
  ruleGroupId: string,
  groups: FoodGroupNode[],
): boolean {
  if (componentGroupId === ruleGroupId) return true;
  const byId = new Map(groups.map((g) => [g.id, g]));
  let current = byId.get(componentGroupId);
  while (current?.parentId) {
    if (current.parentId === ruleGroupId) return true;
    current = byId.get(current.parentId);
  }
  return false;
}

export function componentMatchesRule(
  component: ComplianceComponent,
  rule: ComplianceRule,
  mealText: string,
  groups: FoodGroupNode[],
): boolean {
  if (rule.foodGroupId) {
    if (!component.ingredientFoodGroupId) return false;
    return isInGroupOrDescendant(component.ingredientFoodGroupId, rule.foodGroupId, groups);
  }

  if (rule.ingredientGroupId) {
    if (component.ingredientGroupId !== rule.ingredientGroupId) return false;
    if (!rule.preparation) return true;
    return mealText.includes(rule.preparation.toLowerCase());
  }

  const idMatches =
    (rule.ingredientId !== null && component.ingredientId === rule.ingredientId) ||
    (rule.productId !== null && component.productId === rule.productId);
  if (!idMatches) return false;

  // No preparation qualifier -> the rule covers this food in every state.
  if (!rule.preparation) return true;
  // A qualifier only matches if the meal's own text (name/description/
  // steps) names that preparation — there's no per-component "how this
  // was cooked" field, since the Ingredient tier only stores raw/base
  // foods (see M2's import filter). This is a best-effort text match,
  // same spirit as the ingredient-tier allergen heuristic (D9).
  return mealText.includes(rule.preparation.toLowerCase());
}

export function isMealCompliant(
  meal: ComplianceMeal,
  rules: ComplianceRule[],
  groups: FoodGroupNode[],
): boolean {
  const blacklist = rules.filter((r) => r.listType === "BLACKLIST");
  const whitelist = rules.filter((r) => r.listType === "WHITELIST");

  for (const component of meal.components) {
    for (const rule of blacklist) {
      if (componentMatchesRule(component, rule, meal.mealText, groups)) return false;
    }
  }

  // A whitelist-only profile can eat ONLY what's listed — every component
  // must be covered by at least one whitelist rule, not just one of them.
  if (whitelist.length > 0) {
    for (const component of meal.components) {
      const covered = whitelist.some((rule) =>
        componentMatchesRule(component, rule, meal.mealText, groups),
      );
      if (!covered) return false;
    }
  }

  return true;
}
