import type { AllergenSlug } from "@/lib/allergens";

// Name-based allergen/gluten/lactose inference for single-ingredient,
// unprocessed USDA FoodData Central entries (e.g. "Chicken, broilers or
// fryers, breast, meat only, raw"). This is a best-effort heuristic, not an
// authoritative declaration: it is only safe to apply to genuinely
// single-ingredient raw/generic foods, where the description IS the whole
// ingredient — it would NOT be safe applied to a composite or branded
// product, where hidden additives/cross-contamination can exist regardless
// of what the name says. That's exactly why the Product tier (branded,
// Open Food Facts-sourced) uses OFF's own declared `allergens_tags`
// instead of this heuristic (see scripts/import-products.ts). Per G-001
// acceptance criterion 6, the app's safety disclaimer covers the residual
// risk either way.

const GLUTEN_RE =
  /\b(wheat|barley|rye|malt|spelt|farro|triticale|semolina|durum|bulgur|couscous|matzo|seitan)\b/i;
const MILK_RE = /\b(milk|cheese|yogurt|yoghurt|butter|buttermilk|cream|whey|casein|ghee)\b/i;
const EGG_RE = /^egg\b|,\s*egg\b|\beggs?\b/i;
const PEANUT_RE = /\bpeanut/i;
const TREE_NUT_RE =
  /\b(almond|walnut|cashew|pistachio|pecan|hazelnut|macadamia|brazilnut|brazil nut|chestnut|pine ?nut)/i;
const FISH_RE =
  /\b(salmon|tuna|cod|haddock|halibut|trout|mackerel|sardine|anchov|herring|tilapia|catfish|snapper|bass|flounder|sole|perch|pike|carp)\b/i;
const CRUSTACEAN_RE = /\b(shrimp|prawn|crab|lobster|crayfish|crawfish)\b/i;
const MOLLUSC_RE = /\b(clam|mussel|oyster|scallop|squid|octopus|snail|escargot|abalone|whelk)\b/i;
const SOY_RE = /\b(soy(bean)?|tofu|edamame|tempeh|miso)\b/i;
const SESAME_RE = /\bsesame\b/i;
const CELERY_RE = /\bcelery\b/i;
const MUSTARD_RE = /\bmustard\b/i;
const LUPIN_RE = /\blupin/i;
const SULPHITE_RE = /\bsulf?ite/i;

export function inferAllergenSlugsFromName(description: string): AllergenSlug[] {
  const slugs: AllergenSlug[] = [];
  if (GLUTEN_RE.test(description)) slugs.push("gluten");
  if (MILK_RE.test(description)) slugs.push("milk");
  if (EGG_RE.test(description)) slugs.push("eggs");
  if (PEANUT_RE.test(description)) slugs.push("peanuts");
  if (TREE_NUT_RE.test(description)) slugs.push("nuts");
  if (CRUSTACEAN_RE.test(description)) slugs.push("crustaceans");
  else if (MOLLUSC_RE.test(description)) slugs.push("molluscs");
  else if (FISH_RE.test(description)) slugs.push("fish");
  if (SOY_RE.test(description)) slugs.push("soybeans");
  if (SESAME_RE.test(description)) slugs.push("sesame-seeds");
  if (CELERY_RE.test(description)) slugs.push("celery");
  if (MUSTARD_RE.test(description)) slugs.push("mustard");
  if (LUPIN_RE.test(description)) slugs.push("lupin");
  if (SULPHITE_RE.test(description)) slugs.push("sulphur-dioxide-and-sulphites");
  return slugs;
}

export function inferContainsGluten(description: string): boolean {
  return GLUTEN_RE.test(description);
}

export function inferContainsLactose(description: string): boolean {
  return MILK_RE.test(description) && !EGG_RE.test(description);
}
