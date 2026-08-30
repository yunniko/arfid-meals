// Imports a starter set of Czechia-scoped market products from Open Food
// Facts (ODbL — see GOALS.md/HANDOVER D2, attribution shown in the UI via
// ProductAttribution) into the Product table.
//
// Uses the search-a-licious API (world.openfoodfacts.org's own bulk-export
// page asks that anyone fetching more than "a few hundred products" use
// the CSV/JSONL export instead of the search API — but that export is the
// *entire* global database (multiple GB), and we specifically want a
// country-filtered slice, so a bounded, rate-limited number of search
// requests is the actual polite option here). Their documented limit is 10
// search requests/minute/IP; REQUEST_DELAY_MS keeps us comfortably under
// that for a one-off import run.
import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { EU_ALLERGENS, type AllergenSlug } from "../src/lib/allergens";

const SEARCH_URL = "https://search.openfoodfacts.org/search";
// TODO before any production/scheduled re-run: replace with a real contact
// per Open Food Facts' API etiquette ("AppName/Version (ContactEmail)") —
// left generic here since this is a one-off dev import, not a live
// integration, and the Owner's email shouldn't go into a third-party
// header without being asked first.
const USER_AGENT = "arfid-meals-import/0.1 (dev, non-production)";
const REQUEST_DELAY_MS = 6_500;
const PAGE_SIZE = 100;
const MAX_PAGES = 15;
const TARGET_COUNT = 500;

type OffProduct = {
  code?: string;
  product_name?: string;
  brands?: string[];
  quantity?: string;
  nutriments?: Record<string, number>;
  allergens_tags?: string[];
};

const OFF_TAG_TO_SLUG = new Map<string, AllergenSlug>(
  EU_ALLERGENS.map((a) => [a.offTag, a.slug]),
);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPage(page: number): Promise<OffProduct[]> {
  const url = new URL(SEARCH_URL);
  url.searchParams.set("q", 'countries_tags:"en:czech-republic"');
  url.searchParams.set("page_size", String(PAGE_SIZE));
  url.searchParams.set("page", String(page));
  // A stable sort key — without one, paginating a relevance-ranked query
  // with no search term is not guaranteed stable across requests, which
  // can duplicate or skip products between pages.
  url.searchParams.set("sort_by", "code");
  url.searchParams.set(
    "fields",
    "code,product_name,brands,quantity,nutriments,allergens_tags",
  );
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`Open Food Facts search failed: HTTP ${res.status}`);
  const body = (await res.json()) as { hits: OffProduct[] };
  return body.hits;
}

function num(nutriments: Record<string, number> | undefined, key: string): number | null {
  const v = nutriments?.[key];
  return typeof v === "number" ? v : null;
}

async function main() {
  const allergens = await prisma.allergen.findMany();
  const allergenIdBySlug = new Map(allergens.map((a) => [a.slug, a.id]));
  if (allergenIdBySlug.size === 0) {
    throw new Error("No allergens found — run `npm run seed:taxonomy` first.");
  }

  let imported = 0;
  for (let page = 1; page <= MAX_PAGES && imported < TARGET_COUNT; page++) {
    console.log(`Fetching page ${page}...`);
    const hits = await fetchPage(page);
    if (hits.length === 0) break;

    for (const hit of hits) {
      if (imported >= TARGET_COUNT) break;
      const kcal = num(hit.nutriments, "energy-kcal_100g");
      // Skip entries missing the two fields the whole point of this tier
      // depends on — a product with no name or no calorie data isn't
      // useful to show a user trying to build a balanced meal. Also skip
      // physically implausible values (max real food is pure fat at ~900
      // kcal/100g) — a handful of real OFF entries turned up at
      // 1,000-24,000 kcal/100g, almost certainly per-serving values
      // mis-entered as per-100g. Safety-relevant data quality issue, not
      // an edge case to shrug off in a nutrition app.
      if (!hit.code || !hit.product_name?.trim() || kcal === null || kcal < 0 || kcal > 900)
        continue;

      const sodiumG = num(hit.nutriments, "sodium_100g");
      // Open Food Facts occasionally lists the same allergen tag twice on
      // one product — dedupe or the ProductAllergen insert below hits its
      // (productId, allergenId) primary key.
      const allergenSlugs = [
        ...new Set(
          (hit.allergens_tags ?? [])
            .map((tag) => OFF_TAG_TO_SLUG.get(tag))
            .filter((slug): slug is AllergenSlug => Boolean(slug)),
        ),
      ];

      const product = await prisma.product.upsert({
        where: { barcode: hit.code },
        update: {
          name: hit.product_name.trim(),
          brand: hit.brands?.[0] ?? null,
          countryCode: "CZ",
          kcal,
          proteinG: num(hit.nutriments, "proteins_100g"),
          fatG: num(hit.nutriments, "fat_100g"),
          carbsG: num(hit.nutriments, "carbohydrates_100g"),
          sugarG: num(hit.nutriments, "sugars_100g"),
          fiberG: num(hit.nutriments, "fiber_100g"),
          sodiumMg: sodiumG === null ? null : sodiumG * 1000,
          containsGluten: (hit.allergens_tags ?? []).includes("en:gluten"),
          containsLactose: (hit.allergens_tags ?? []).includes("en:milk"),
          sourceUrl: `https://world.openfoodfacts.org/product/${hit.code}`,
        },
        create: {
          barcode: hit.code,
          name: hit.product_name.trim(),
          brand: hit.brands?.[0] ?? null,
          countryCode: "CZ",
          kcal,
          proteinG: num(hit.nutriments, "proteins_100g"),
          fatG: num(hit.nutriments, "fat_100g"),
          carbsG: num(hit.nutriments, "carbohydrates_100g"),
          sugarG: num(hit.nutriments, "sugars_100g"),
          fiberG: num(hit.nutriments, "fiber_100g"),
          sodiumMg: sodiumG === null ? null : sodiumG * 1000,
          containsGluten: (hit.allergens_tags ?? []).includes("en:gluten"),
          containsLactose: (hit.allergens_tags ?? []).includes("en:milk"),
          source: "open_food_facts",
          sourceUrl: `https://world.openfoodfacts.org/product/${hit.code}`,
        },
      });

      await prisma.productAllergen.deleteMany({ where: { productId: product.id } });
      for (const slug of allergenSlugs) {
        const allergenId = allergenIdBySlug.get(slug);
        if (!allergenId) continue;
        await prisma.productAllergen.create({ data: { productId: product.id, allergenId } });
      }

      imported++;
    }
    console.log(`  ...${imported}/${TARGET_COUNT} imported so far`);
    if (page < MAX_PAGES) await sleep(REQUEST_DELAY_MS);
  }

  console.log(`Imported ${imported} products.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
