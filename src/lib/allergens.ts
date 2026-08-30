// The 14 EU-regulated allergens (Regulation (EU) No 1169/2011, Annex II) —
// the right list for a Czechia-scoped MVP. `slug` is the stable id used
// everywhere (DB, i18n message keys); `offTag` is the matching Open Food
// Facts `allergens_tags` value, used to map OFF's own declarations
// directly onto our Allergen rows without guessing.
export const EU_ALLERGENS = [
  { slug: "gluten", name: "Cereals containing gluten", offTag: "en:gluten" },
  { slug: "crustaceans", name: "Crustaceans", offTag: "en:crustaceans" },
  { slug: "eggs", name: "Eggs", offTag: "en:eggs" },
  { slug: "fish", name: "Fish", offTag: "en:fish" },
  { slug: "peanuts", name: "Peanuts", offTag: "en:peanuts" },
  { slug: "soybeans", name: "Soybeans", offTag: "en:soybeans" },
  { slug: "milk", name: "Milk (incl. lactose)", offTag: "en:milk" },
  { slug: "nuts", name: "Tree nuts", offTag: "en:nuts" },
  { slug: "celery", name: "Celery", offTag: "en:celery" },
  { slug: "mustard", name: "Mustard", offTag: "en:mustard" },
  { slug: "sesame-seeds", name: "Sesame seeds", offTag: "en:sesame-seeds" },
  {
    slug: "sulphur-dioxide-and-sulphites",
    name: "Sulphur dioxide and sulphites",
    offTag: "en:sulphur-dioxide-and-sulphites",
  },
  { slug: "lupin", name: "Lupin", offTag: "en:lupin" },
  { slug: "molluscs", name: "Molluscs", offTag: "en:molluscs" },
] as const;

export type AllergenSlug = (typeof EU_ALLERGENS)[number]["slug"];
