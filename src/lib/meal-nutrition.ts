// Computes a meal's total nutrition from its components. Pure and
// unit-tested since this is the arithmetic the whole product promise
// ("balanced meals you can trust") rests on.

export type ComponentNutrientInput = {
  quantityG: number;
  kcal: number | null;
  proteinG: number | null;
  fatG: number | null;
  carbsG: number | null;
  sugarG: number | null;
  fiberG: number | null;
  sodiumMg: number | null;
};

const FIELDS = ["kcal", "proteinG", "fatG", "carbsG", "sugarG", "fiberG", "sodiumMg"] as const;
type Field = (typeof FIELDS)[number];

export type MealNutritionTotals = {
  kcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  sugarG: number;
  fiberG: number;
  sodiumMg: number;
  // Fields where at least one component is missing that value — the total
  // is a real sum of what IS known, but it's an undercount, not a true
  // zero contribution from that component. Surfaced in the UI rather than
  // silently treating "no data" the same as "genuinely zero".
  incompleteFields: Field[];
};

export function computeMealTotals(components: ComponentNutrientInput[]): MealNutritionTotals {
  const totals: Record<Field, number> = {
    kcal: 0,
    proteinG: 0,
    fatG: 0,
    carbsG: 0,
    sugarG: 0,
    fiberG: 0,
    sodiumMg: 0,
  };
  const incomplete = new Set<Field>();

  for (const component of components) {
    const scale = component.quantityG / 100;
    for (const field of FIELDS) {
      const perHundred = component[field];
      if (perHundred === null) {
        incomplete.add(field);
      } else {
        totals[field] += perHundred * scale;
      }
    }
  }

  return { ...totals, incompleteFields: [...incomplete] };
}
