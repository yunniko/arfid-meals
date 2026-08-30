// Seeds the app's own controlled vocabulary: the 14 EU-regulated allergens
// and a baseline FoodGroup tree. This is app configuration data (not
// Owner-authored recipe content, see GOALS.md D5) — idempotent, safe to
// re-run any time via `npm run seed:taxonomy`.
import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { EU_ALLERGENS } from "../src/lib/allergens";

// Two-level tree: "meat" groups the four USDA meat categories as children,
// matching the exact exclusion example from the product spec ("exclude
// meat as a whole group, or just chicken"). Eggs are split out from dairy
// deliberately — an egg allergy and a milk allergy are different
// conditions, and USDA's own "Dairy and Egg Products" category conflates
// them.
const FOOD_GROUPS: { slug: string; name: string; parentSlug?: string }[] = [
  { slug: "meat", name: "Meat" },
  { slug: "beef", name: "Beef", parentSlug: "meat" },
  { slug: "poultry", name: "Poultry", parentSlug: "meat" },
  { slug: "pork", name: "Pork", parentSlug: "meat" },
  { slug: "lamb-veal-game", name: "Lamb, veal, and game", parentSlug: "meat" },
  { slug: "fish-and-seafood", name: "Fish and seafood" },
  { slug: "dairy", name: "Dairy" },
  { slug: "eggs", name: "Eggs" },
  { slug: "vegetables", name: "Vegetables" },
  { slug: "fruits", name: "Fruits" },
  { slug: "grains-and-pasta", name: "Grains and pasta" },
  { slug: "legumes", name: "Legumes" },
  { slug: "nuts-and-seeds", name: "Nuts and seeds" },
  { slug: "fats-and-oils", name: "Fats and oils" },
  { slug: "spices-and-herbs", name: "Spices and herbs" },
];

async function main() {
  for (const allergen of EU_ALLERGENS) {
    await prisma.allergen.upsert({
      where: { slug: allergen.slug },
      update: { name: allergen.name },
      create: { slug: allergen.slug, name: allergen.name },
    });
  }
  console.log(`Upserted ${EU_ALLERGENS.length} allergens.`);

  // Parents before children — a child references its parent's id.
  const topLevel = FOOD_GROUPS.filter((g) => !g.parentSlug);
  const children = FOOD_GROUPS.filter((g) => g.parentSlug);
  for (const group of topLevel) {
    await prisma.foodGroup.upsert({
      where: { slug: group.slug },
      update: { name: group.name },
      create: { slug: group.slug, name: group.name },
    });
  }
  for (const group of children) {
    const parent = await prisma.foodGroup.findUniqueOrThrow({
      where: { slug: group.parentSlug! },
    });
    await prisma.foodGroup.upsert({
      where: { slug: group.slug },
      update: { name: group.name, parentId: parent.id },
      create: { slug: group.slug, name: group.name, parentId: parent.id },
    });
  }
  console.log(`Upserted ${FOOD_GROUPS.length} food groups.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
