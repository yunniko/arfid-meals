// Imports a starter set of raw/generic ingredients from USDA FoodData
// Central's SR Legacy dataset (public domain — no API key, no account,
// see GOALS.md/HANDOVER D2) into the Ingredient table.
//
// Source subset selection (a real, principled slice of SR Legacy, not an
// arbitrary hand-picked list): foods in ALLOWED_CATEGORIES whose
// description does NOT mention a cooking/processing method — this keeps
// the generic "raw/base" form of each food (e.g. "Chicken, broilers or
// fryers, breast, meat only, raw") and drops SR Legacy's many
// cooked/roasted/canned duplicates per cut, which belong to meal
// preparation, not the ingredient tier.
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import AdmZip from "adm-zip";
import { prisma } from "../src/lib/prisma";
import { inferAllergenSlugsFromName, inferContainsGluten, inferContainsLactose } from "../src/lib/food-heuristics";
import { computeIngredientGroups } from "../src/lib/ingredient-grouping";
import { slugify } from "../src/lib/slugify";

const DATASET_URL =
  "https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_json_2018-04.zip";
const DATA_DIR = path.resolve(__dirname, "../.data/fdc");
const ZIP_PATH = path.join(DATA_DIR, "sr-legacy.zip");
const JSON_PATH = path.join(DATA_DIR, "sr-legacy.json");

const EXCLUDE_STATE_RE =
  /\b(cooked|boiled|roasted|broiled|braised|stewed|fried|grilled|baked|canned|smoked|cured|pickled|toasted|simmered|poached|steamed|microwaved|rotisserie|drained|heated)\b/i;

// USDA foodCategory.description -> our FoodGroup slug. Eggs are split out
// of "Dairy and Egg Products" (see scripts/seed-taxonomy.ts) since an egg
// allergy and a milk allergy are different conditions.
const CATEGORY_TO_GROUP: Record<string, string> = {
  "Beef Products": "beef",
  "Poultry Products": "poultry",
  "Pork Products": "pork",
  "Lamb, Veal, and Game Products": "lamb-veal-game",
  "Finfish and Shellfish Products": "fish-and-seafood",
  "Vegetables and Vegetable Products": "vegetables",
  "Fruits and Fruit Juices": "fruits",
  "Cereal Grains and Pasta": "grains-and-pasta",
  "Legumes and Legume Products": "legumes",
  "Nut and Seed Products": "nuts-and-seeds",
  "Fats and Oils": "fats-and-oils",
  "Spices and Herbs": "spices-and-herbs",
};
const ALLOWED_CATEGORIES = new Set(Object.keys(CATEGORY_TO_GROUP).concat("Dairy and Egg Products"));

// USDA nutrient ids we care about (per 100g), from the standard USDA
// nutrient numbering (confirmed against this dataset directly, not
// assumed): 1008 Energy(kcal), 1003 Protein, 1004 Total lipid (fat),
// 1005 Carbohydrate by difference, 2000 Total Sugars, 1079 Fiber total
// dietary, 1093 Sodium.
const NUTRIENT_IDS = {
  kcal: 1008,
  proteinG: 1003,
  fatG: 1004,
  carbsG: 1005,
  sugarG: 2000,
  fiberG: 1079,
  sodiumMg: 1093,
} as const;

type FdcFood = {
  fdcId: number;
  description: string;
  foodCategory?: { description?: string };
  foodNutrients?: { nutrient?: { id?: number }; amount?: number }[];
};

async function ensureDataset(): Promise<string> {
  if (fs.existsSync(JSON_PATH)) return JSON_PATH;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log("Downloading SR Legacy dataset from USDA FoodData Central (no API key needed)...");
  const res = await fetch(DATASET_URL);
  if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(ZIP_PATH, buf);
  const zip = new AdmZip(ZIP_PATH);
  const entry = zip.getEntries().find((e) => e.entryName.endsWith(".json"));
  if (!entry) throw new Error("No .json entry found in the downloaded zip");
  fs.writeFileSync(JSON_PATH, zip.readAsText(entry));
  fs.unlinkSync(ZIP_PATH);
  return JSON_PATH;
}

function nutrientValue(food: FdcFood, nutrientId: number): number | null {
  const match = food.foodNutrients?.find((n) => n.nutrient?.id === nutrientId);
  return typeof match?.amount === "number" ? match.amount : null;
}

async function main() {
  const jsonPath = await ensureDataset();
  console.log("Parsing dataset...");
  const raw = JSON.parse(fs.readFileSync(jsonPath, "utf8")) as { SRLegacyFoods: FdcFood[] };
  const foods = raw.SRLegacyFoods;
  console.log(`${foods.length} total foods in dataset.`);

  const foodGroups = await prisma.foodGroup.findMany();
  const groupIdBySlug = new Map(foodGroups.map((g) => [g.slug, g.id]));
  if (groupIdBySlug.size === 0) {
    throw new Error("No food groups found — run `npm run seed:taxonomy` first.");
  }
  const allergens = await prisma.allergen.findMany();
  const allergenIdBySlug = new Map(allergens.map((a) => [a.slug, a.id]));
  if (allergenIdBySlug.size === 0) {
    throw new Error("No allergens found — run `npm run seed:taxonomy` first.");
  }

  const selected = foods.filter(
    (f) =>
      f.foodCategory?.description &&
      ALLOWED_CATEGORIES.has(f.foodCategory.description) &&
      !EXCLUDE_STATE_RE.test(f.description),
  );
  console.log(`${selected.length} foods match the raw/generic-ingredient filter.`);

  let imported = 0;
  for (const food of selected) {
    const categoryName = food.foodCategory!.description!;
    const groupSlug =
      categoryName === "Dairy and Egg Products"
        ? /^egg\b|,\s*egg\b/i.test(food.description)
          ? "eggs"
          : "dairy"
        : CATEGORY_TO_GROUP[categoryName];
    const foodGroupId = groupIdBySlug.get(groupSlug) ?? null;

    const ingredient = await prisma.ingredient.upsert({
      where: { fdcId: food.fdcId },
      update: {
        name: food.description,
        foodGroupId,
        kcal: nutrientValue(food, NUTRIENT_IDS.kcal),
        proteinG: nutrientValue(food, NUTRIENT_IDS.proteinG),
        fatG: nutrientValue(food, NUTRIENT_IDS.fatG),
        carbsG: nutrientValue(food, NUTRIENT_IDS.carbsG),
        sugarG: nutrientValue(food, NUTRIENT_IDS.sugarG),
        fiberG: nutrientValue(food, NUTRIENT_IDS.fiberG),
        sodiumMg: nutrientValue(food, NUTRIENT_IDS.sodiumMg),
        containsGluten: inferContainsGluten(food.description),
        containsLactose: inferContainsLactose(food.description),
        sourceUrl: `https://fdc.nal.usda.gov/food-details/${food.fdcId}/nutrients`,
      },
      create: {
        fdcId: food.fdcId,
        name: food.description,
        foodGroupId,
        kcal: nutrientValue(food, NUTRIENT_IDS.kcal),
        proteinG: nutrientValue(food, NUTRIENT_IDS.proteinG),
        fatG: nutrientValue(food, NUTRIENT_IDS.fatG),
        carbsG: nutrientValue(food, NUTRIENT_IDS.carbsG),
        sugarG: nutrientValue(food, NUTRIENT_IDS.sugarG),
        fiberG: nutrientValue(food, NUTRIENT_IDS.fiberG),
        sodiumMg: nutrientValue(food, NUTRIENT_IDS.sodiumMg),
        containsGluten: inferContainsGluten(food.description),
        containsLactose: inferContainsLactose(food.description),
        source: "usda_fdc",
        sourceUrl: `https://fdc.nal.usda.gov/food-details/${food.fdcId}/nutrients`,
      },
    });

    const allergenSlugs = inferAllergenSlugsFromName(food.description);
    await prisma.ingredientAllergen.deleteMany({ where: { ingredientId: ingredient.id } });
    for (const slug of allergenSlugs) {
      const allergenId = allergenIdBySlug.get(slug);
      if (!allergenId) continue;
      await prisma.ingredientAllergen.create({
        data: { ingredientId: ingredient.id, allergenId },
      });
    }

    imported++;
    if (imported % 200 === 0) console.log(`  ...${imported}/${selected.length}`);
  }

  console.log(`Imported ${imported} ingredients.`);

  await assignIngredientGroups();
}

// Recomputes the variant-grouping tree (see IngredientGroup's schema comment
// and HANDOVER D18) from every ingredient currently in the table — not just
// the ones just imported — so this stays correct on repeat/partial runs.
// Idempotent: upserts groups by their deterministic slug, and reconciles any
// ingredient whose group membership changed since the last run (including
// clearing groupId for a group that no longer has 2+ members).
async function assignIngredientGroups() {
  const allIngredients = await prisma.ingredient.findMany({
    select: { id: true, name: true, ingredientGroupId: true },
  });
  const computed = computeIngredientGroups(allIngredients);

  const desiredGroupIdByIngredientId = new Map<string, string>();
  for (const { name, memberIds } of computed) {
    const group = await prisma.ingredientGroup.upsert({
      where: { slug: slugify(name) },
      update: { name },
      create: { slug: slugify(name), name },
    });
    for (const id of memberIds) desiredGroupIdByIngredientId.set(id, group.id);
  }

  let reassigned = 0;
  for (const ingredient of allIngredients) {
    const desired = desiredGroupIdByIngredientId.get(ingredient.id) ?? null;
    if (ingredient.ingredientGroupId === desired) continue;
    await prisma.ingredient.update({
      where: { id: ingredient.id },
      data: { ingredientGroupId: desired },
    });
    reassigned++;
  }

  console.log(
    `Grouped ingredients into ${computed.length} variant groups (${desiredGroupIdByIngredientId.size} ingredients grouped, ${reassigned} group memberships changed this run).`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
