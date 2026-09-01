import { prisma } from "@/lib/prisma";
import { computeMealTotals, type ComponentNutrientInput } from "@/lib/meal-nutrition";
import { isMealCompliant, type ComplianceMeal, type ComplianceRule } from "@/lib/meal-compliance";
import type { MealEffortTag, MealTypeTag } from "@/generated/prisma/enums";

function mealText(meal: { name: string; description: string | null; steps: string | null }) {
  return [meal.name, meal.description, meal.steps].filter(Boolean).join(" ").toLowerCase();
}

type NutrientFields = Omit<ComponentNutrientInput, "quantityG">;

function toNutrientInput(component: {
  quantityG: number;
  ingredient: NutrientFields | null;
  product: NutrientFields | null;
}): ComponentNutrientInput {
  const source = component.ingredient ?? component.product;
  return {
    quantityG: component.quantityG,
    kcal: source?.kcal ?? null,
    proteinG: source?.proteinG ?? null,
    fatG: source?.fatG ?? null,
    carbsG: source?.carbsG ?? null,
    sugarG: source?.sugarG ?? null,
    fiberG: source?.fiberG ?? null,
    sodiumMg: source?.sodiumMg ?? null,
  };
}

export async function generateCompliantMeals(
  userId: string,
  filters: { typeTag?: MealTypeTag; effortTag?: MealEffortTag },
) {
  const [profile, groups, meals] = await Promise.all([
    prisma.userProfile.findUnique({
      where: { userId },
      include: { exclusionRules: true },
    }),
    prisma.foodGroup.findMany({ select: { id: true, parentId: true } }),
    prisma.meal.findMany({
      where: {
        typeTags: filters.typeTag ? { has: filters.typeTag } : undefined,
        effortTags: filters.effortTag ? { has: filters.effortTag } : undefined,
      },
      include: {
        components: {
          include: { ingredient: true, product: true },
        },
      },
    }),
  ]);

  const rules: ComplianceRule[] = (profile?.exclusionRules ?? []).map((r) => ({
    listType: r.listType,
    foodGroupId: r.foodGroupId,
    ingredientId: r.ingredientId,
    productId: r.productId,
    preparation: r.preparation,
  }));

  const compliant = meals.filter((meal) => {
    const complianceMeal: ComplianceMeal = {
      mealText: mealText(meal),
      components: meal.components.map((c) => ({
        ingredientId: c.ingredientId,
        productId: c.productId,
        ingredientFoodGroupId: c.ingredient?.foodGroupId ?? null,
      })),
    };
    return isMealCompliant(complianceMeal, rules, groups);
  });

  const compliantMeals = compliant.map((meal) => ({
    id: meal.id,
    name: meal.name,
    typeTags: meal.typeTags,
    effortTags: meal.effortTags,
    totals: computeMealTotals(meal.components.map(toNutrientInput)),
  }));

  // Picked here, not in the page component: Math.random() inside a
  // component's render body trips the react-hooks/purity lint rule
  // (and is genuinely the wrong place for it) — this is a plain data
  // function, not a component, so a fresh random pick per call is fine.
  const picked =
    compliantMeals.length > 0
      ? compliantMeals[Math.floor(Math.random() * compliantMeals.length)]
      : null;

  return {
    totalCandidates: meals.length,
    compliantCount: compliantMeals.length,
    picked,
  };
}
