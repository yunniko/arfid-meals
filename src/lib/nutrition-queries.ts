import { prisma } from "@/lib/prisma";

const SEARCH_LIMIT = 30;

export async function searchIngredients(query: string) {
  return prisma.ingredient.findMany({
    where: query ? { name: { contains: query, mode: "insensitive" } } : undefined,
    include: { foodGroup: true, allergenLinks: { include: { allergen: true } } },
    orderBy: { name: "asc" },
    take: SEARCH_LIMIT,
  });
}

export function getIngredient(id: string) {
  return prisma.ingredient.findUnique({
    where: { id },
    include: { foodGroup: true, allergenLinks: { include: { allergen: true } } },
  });
}

export async function searchProducts(query: string) {
  return prisma.product.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { brand: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: { allergenLinks: { include: { allergen: true } } },
    orderBy: { name: "asc" },
    take: SEARCH_LIMIT,
  });
}

export function getProduct(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: { allergenLinks: { include: { allergen: true } } },
  });
}
