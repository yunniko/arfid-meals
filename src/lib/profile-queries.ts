import { prisma } from "@/lib/prisma";

export function getProfileWithRules(userId: string) {
  return prisma.userProfile.findUnique({
    where: { userId },
    include: {
      exclusionRules: {
        include: { foodGroup: true, ingredientGroup: true, ingredient: true, product: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export function listFoodGroups() {
  return prisma.foodGroup.findMany({ orderBy: { name: "asc" } });
}
