import { prisma } from "@/lib/prisma";

const SEARCH_LIMIT = 30;
// Generous, not a real pagination cap: the whole ingredient table is ~2,400
// rows, and browseIngredients groups most of them under ~180 variant groups
// (see IngredientGroup) before rendering, so a plain findMany with no limit
// would already be fine — this just guards against the table growing far
// beyond its current size unnoticed.
const BROWSE_LIMIT = 5000;

// Used by the search-as-you-type pickers (meal composer, exclusion item
// rule) where the caller needs to land on one exact USDA variant — kept
// flat/ungrouped on purpose, unlike browseIngredients below.
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

type BrowseIngredient = Awaited<ReturnType<typeof searchIngredients>>[number];

export type IngredientBrowseEntry =
  | { kind: "group"; id: string; name: string; count: number }
  | { kind: "single"; ingredient: BrowseIngredient };

// Powers the /ingredients browse page: buckets matching ingredients under
// their IngredientGroup (see schema comment + HANDOVER D18) instead of
// listing every real USDA variant flat, which is what made the page
// unusable for anything with lots of variants (e.g. searching "milk" used
// to return 44 near-identical rows with no structure). A group only
// appears as its own entry when 2+ of its members are actually in the
// current (possibly search-filtered) result set — a single matching
// member renders as a normal standalone row instead.
export async function browseIngredients(query: string): Promise<IngredientBrowseEntry[]> {
  const ingredients = await prisma.ingredient.findMany({
    where: query ? { name: { contains: query, mode: "insensitive" } } : undefined,
    include: { foodGroup: true, allergenLinks: { include: { allergen: true } } },
    orderBy: { name: "asc" },
    take: BROWSE_LIMIT,
  });

  const groupBuckets = new Map<string, { name: string; members: BrowseIngredient[] }>();
  const standalone: BrowseIngredient[] = [];
  for (const ingredient of ingredients) {
    if (!ingredient.ingredientGroupId) {
      standalone.push(ingredient);
      continue;
    }
    const bucket = groupBuckets.get(ingredient.ingredientGroupId) ?? {
      name: deriveGroupDisplayName(ingredient),
      members: [],
    };
    bucket.members.push(ingredient);
    groupBuckets.set(ingredient.ingredientGroupId, bucket);
  }

  const entries: IngredientBrowseEntry[] = [];
  for (const [id, bucket] of groupBuckets) {
    if (bucket.members.length >= 2) {
      entries.push({ kind: "group", id, name: bucket.name, count: bucket.members.length });
    } else {
      entries.push({ kind: "single", ingredient: bucket.members[0] });
    }
  }
  for (const ingredient of standalone) entries.push({ kind: "single", ingredient });

  entries.sort((a, b) => {
    const aName = a.kind === "group" ? a.name : a.ingredient.name;
    const bName = b.kind === "group" ? b.name : b.ingredient.name;
    return aName.localeCompare(bName);
  });
  return entries;
}

// The group relation isn't included in the query above (only its id, via
// ingredientGroupId) to avoid an extra join for a value only needed once
// per group — this derives the same "first comma segment" name a fresh
// group would get, purely for display; the real name of record lives on
// IngredientGroup itself (see getIngredientGroup).
function deriveGroupDisplayName(ingredient: { name: string }): string {
  return ingredient.name.split(",")[0].trim();
}

export function getIngredientGroup(id: string) {
  return prisma.ingredientGroup.findUnique({ where: { id } });
}

export async function searchIngredientGroupMembers(groupId: string, query: string) {
  return prisma.ingredient.findMany({
    where: {
      ingredientGroupId: groupId,
      name: query ? { contains: query, mode: "insensitive" } : undefined,
    },
    orderBy: { name: "asc" },
  });
}

// Backs the exclusion-rule "specific food" picker (see
// src/components/profile/food-rule-form.tsx) — the list of real variant
// groups is small (~180) and slow-changing, so a plain alphabetical list
// with counts is enough; no search-as-you-type needed.
export function listIngredientGroups() {
  return prisma.ingredientGroup.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { ingredients: true } } },
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
