import { prisma } from "@/lib/prisma";
import { computeMealTotals, type ComponentNutrientInput } from "@/lib/meal-nutrition";
import type { AllergenSlug } from "@/lib/allergens";

const componentInclude = {
  include: {
    ingredient: { include: { allergenLinks: { include: { allergen: true } } } },
    product: { include: { allergenLinks: { include: { allergen: true } } } },
  },
} as const;

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

function unionAllergens(
  components: {
    ingredient: { allergenLinks: { allergen: { slug: string } }[] } | null;
    product: { allergenLinks: { allergen: { slug: string } }[] } | null;
  }[],
): AllergenSlug[] {
  const slugs = new Set<AllergenSlug>();
  for (const component of components) {
    const links = component.ingredient?.allergenLinks ?? component.product?.allergenLinks ?? [];
    for (const link of links) slugs.add(link.allergen.slug as AllergenSlug);
  }
  return [...slugs];
}

export async function searchMeals(query: string) {
  const meals = await prisma.meal.findMany({
    where: query ? { name: { contains: query, mode: "insensitive" } } : undefined,
    include: { components: componentInclude },
    orderBy: { name: "asc" },
    take: 30,
  });
  return meals.map((meal) => ({
    ...meal,
    totals: computeMealTotals(meal.components.map(toNutrientInput)),
  }));
}

export async function getMeal(id: string) {
  const meal = await prisma.meal.findUnique({
    where: { id },
    include: { components: componentInclude },
  });
  if (!meal) return null;
  return {
    ...meal,
    totals: computeMealTotals(meal.components.map(toNutrientInput)),
    allergenSlugs: unionAllergens(meal.components),
  };
}

export function listMealsForAdmin() {
  return prisma.meal.findMany({ orderBy: { updatedAt: "desc" } });
}

export function getMealForEdit(id: string) {
  return prisma.meal.findUnique({
    where: { id },
    include: { components: { include: { ingredient: true, product: true } } },
  });
}
