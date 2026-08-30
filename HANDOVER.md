# Handover — arfid-meals

Read this before touching the project. Goal and milestone plan live in
`GOALS.md` (G-001). Company-wide standards in `E:\CLAUDE\COMPANY\`.

## Current state

M1 and M2 are done and verified — see `GOALS.md` G-001 for the full
record. Working: Next.js app scaffold, Prisma schema + migration,
email/password auth, cs/en i18n, and now a real (if starter-sized)
ingredient/product database — 2,413 USDA-sourced raw ingredients and 493
Open-Food-Facts-sourced Czech products, both browsable and searchable at
`/ingredients` and `/products`. Not built yet: recipe/meal admin + seeded
meals (M3), user-facing exclusion-list UI (M4), meal generation (M5), and
the real Terms & Conditions (M6 — `/about` is still a stub carrying just
the safety disclaimer).

## How to run

1. `docker compose up -d db` — starts local Postgres (port 54322).
2. `npm install`
3. `npx prisma migrate dev` — applies the schema (already applied once;
   re-run after pulling schema changes).
4. `npm run dev` — app at http://localhost:3000.

`ADMIN_EMAIL` in `.env` (currently blank) is the email that gets promoted
to `Role.ADMIN` on its first sign-in — set it before registering the
account that should get admin/recipe-authoring access, per D1 in `src/auth.ts`.

To (re-)populate the ingredient/product database: `npm run import:all`
(runs the taxonomy seed, then both importers — see D8/D9 below). Both
importers are idempotent (upsert by `fdcId`/`barcode`), safe to re-run.
The USDA dataset (~210MB unzipped) is cached in `.data/fdc/` after the
first run (gitignored — never commit it) so re-imports don't re-download it.

## Decision record

**D1 — Stack: TypeScript/Next.js/Prisma/Postgres/next-auth/next-intl.**
Chosen over any alternative because both other Company web apps
(`listing-studio`, `when-we-meet`) already use this exact stack, and
STANDARDS.md's tech-stack rule says to minimize spread across the
portfolio when options are roughly equally acceptable. Nothing about this
project's requirements (a relational, multi-entity nutrition/meal domain
with user accounts) argues against it.

**D2 — Two-tier ingredient/product model: generic Ingredient (USDA
FoodData Central) vs. country-scoped Product (Open Food Facts).** The
Owner asked for both "a database of raw ingredients with nutritional value
as detailed as possible" and "products available on the market ... with
country attached" as explicitly separate things. Open Food Facts is a
strong fit for the *product* tier — it already has per-country product
data (`countries_tags`), allergen tags, and nutrition facts, and the Owner
picked it as the backbone in scoping. But raw-ingredient nutrition (e.g.
"chicken breast, raw" per 100g) is largely country-agnostic, and USDA
FoodData Central is public domain (no attribution burden, unlike Open Food
Facts' ODbL) with deeper micronutrient detail than OFF's generic/raw
entries typically carry. This split wasn't itself put to the Owner as a
question — logged here as a JulAI judgment call within the
Owner-approved "Open Food Facts backbone" answer, per OPERATIONS.md
("log significant decisions with rationale"). Revisit if the Owner would
rather single-source everything from Open Food Facts.

**D3 — MVP market: Czechia only, not multi-country.** Owner's explicit
choice (overrode the France+Czechia option offered), to prove the
country-scoping logic works correctly for one real market before adding
more.

**D4 — MVP languages: Czech + English.** Not explicitly asked as its own
question; inferred by JulAI because multilanguage is one of the product's
stated core requirements (not a stretch goal), so the i18n plumbing
(`next-intl`, cookie-based locale, English-fallback deep-merge — same
pattern as `when-we-meet` G-002) needs at least two real languages from M1
to prove itself, rather than being bolted on after the fact as a single-
language app. If the Owner would rather ship Czech-only for MVP and add
English later, this is easy to walk back — nothing in the schema is
locale-count-dependent.

**D5 — Recipe content is Owner-authored via an admin UI, not imported or
JulAI-drafted.** Owner's explicit choice. Avoids any licensing exposure
from importing recipe text/images from elsewhere, and keeps the
ARFID-appropriate framing (simple, low-sensory-complexity options,
accurate safety flagging) under direct Owner control rather than
LLM-drafted content needing a review queue.

**D6 — Safety disclaimer is a first-class UI element, not just ToS
boilerplate.** The Owner explicitly asked for this: "the same should be
marked on meal" (i.e., not only in the Terms & Conditions text, but
visibly on every meal/ingredient/product page). Treating this as an
acceptance criterion (G-001 #6), not an afterthought — this is
health-adjacent content and VALUES.md's Honesty/Quality standards apply
directly.

**D7 — Fixed cs/en locale list, not env-driven.** `src/lib/ui-locales.ts`
hardcodes `["en", "cs"]` rather than reading an env var. Followed
when-we-meet's precedent (a fixed list, chosen there because it needed all
four of its languages at once with no staged rollout) over listing-studio's
env-driven one (which stages languages in over time) — this project's MVP
scope is exactly cs+en with no planned staged rollout, so the simpler
option fits. `DEFAULT_LOCALE = "en"` matches both portfolio precedents (the
English messages file is always the merge base other locales overlay onto)
even though the MVP *market* is Czechia — locale and market are different
axes; a Czech visitor still gets `cs` via the cookie/switcher, English is
just the code's fallback baseline.

**D8 — Ingredient starter set: USDA SR Legacy, filtered by category minus
cooking-method keywords, not a hand-picked list.** SR Legacy (the classic
"USDA National Nutrient Database for Standard Reference", public domain,
no API key) has ~7,800 foods across 24 categories, many with several
cooked/roasted/canned variants per cut. Rather than hand-curate an
arbitrary list of "common ingredients" (arbitrary, and a lot of manual
work for uncertain benefit), the importer takes every food in 13 chosen
"raw ingredient" categories (meats, fish/seafood, dairy+eggs, produce,
grains, legumes, nuts/seeds, fats/oils, spices) whose description doesn't
contain a cooking-method word (cooked/roasted/canned/etc.) — this is a
real, principled, reproducible subset of the actual dataset, not a
subjective pick, and it naturally keeps the generic "raw/base" form of
each food (e.g. "Chicken, broilers or fryers, breast, meat only, raw")
while dropping SR Legacy's many redundant cooked-variant entries. Result:
2,413 ingredients. Foundation Foods (a newer, smaller, more rigorously
tested USDA dataset) was considered and rejected for the *starter* set —
only ~350 foods, too narrow — but is a candidate to layer in later
alongside SR Legacy without any schema change (`Ingredient.fdcId` already
supports either source).

**D9 — Allergen data comes from two different places depending on the
tier, deliberately.** Ingredients (generic, single-food USDA entries) get
their gluten/lactose/allergen flags from `src/lib/food-heuristics.ts`, a
name-based keyword match (e.g. "wheat" → gluten, "milk"/"cheese" →
lactose). This is safe *specifically* because these are single-ingredient
raw foods where the description names the whole thing — there's no hidden
additive a name-based check could miss. Products (branded, Open Food
Facts-sourced) instead use OFF's own crowdsourced `allergens_tags`
directly, never the heuristic — a branded product can contain hidden
allergens a name-based guess would never catch, so an authoritative (if
imperfect, see D10) declared source is the only defensible choice there.
The 14 EU-regulated allergens (`src/lib/allergens.ts`) are the shared
vocabulary between both.

**D10 — Two real data-quality issues found in imported data, handled
differently.** (1) A handful of genuine Open Food Facts entries had
physically impossible calorie values (1,000–24,000 kcal/100g — likely
per-serving values mis-entered as per-100g). Fixed at the source: the
importer now rejects any product with kcal outside [0, 900] (900 ≈ pure
fat, a real physical ceiling), and the 7 bad rows already imported were
deleted. (2) Some real, ordinary dairy products (e.g. a "Cottage Cheese"
entry) have no "en:milk" tag in OFF's `allergens_tags` at all — a genuine
crowdsourcing gap, not something a smarter query can fix. This is a
safety-relevant limitation for an ARFID app, so rather than silently
trusting an empty allergen list, the "no allergens declared" UI copy
(`Nutrition.noAllergens`) was reworded to explicitly say this does not
guarantee the item is allergen-free — the existing safety disclaimer
already covers this class of risk, but the specific empty-list case
deserved its own explicit caveat rather than reading as reassurance.

## How things fit together

**Schema** (`prisma/schema.prisma`): two parallel nutrition sources feed
one `MealComponent` join —
```
Ingredient (USDA FDC, generic)  ─┐
Product (Open Food Facts, CZ)   ─┼─> MealComponent (qty) -> Meal
```
`FoodGroup` is a self-referential tree (`meat -> poultry -> chicken`) that
both `Ingredient` and `ExclusionRule` point into, so a rule can target any
level of the tree. `ExclusionRule` is the single table backing both
black- and white-lists (`ExclusionListType`) at all three granularities
described in G-001: group-only, ingredient/product-only, or
ingredient/product + free-text `preparation`. `Allergen` is a controlled
vocabulary (not free text) joined to both `Ingredient` and `Product`
independently, since the same allergen can appear on either tier.

**Auth**: `src/auth.ts` (Credentials provider, `PrismaAdapter`, JWT
sessions) + `src/lib/auth-actions.ts` (the actual register/login/logout
server actions the forms call) + `src/components/auth/*-form.tsx` (client
form components using `useActionState`). Mirrors listing-studio's shape
minus what this project doesn't need yet (no OAuth providers, no
rate-limiting, no email verification — add if/when abuse or deliverability
actually becomes a problem, not preemptively).

**i18n**: `src/lib/ui-locales.ts` (locale list + merge logic) +
`src/i18n/request.ts` (next-intl config, reads the `locale` cookie) +
`src/lib/locale-actions.ts` (the switcher's server action) +
`src/app/locale-switcher.tsx`/`locale-select.tsx` (server/client split for
the dropdown, in the root layout so it's on every page). `messages/en.json`
is the base; `messages/cs.json` is deep-merged on top so partial
translations never break.

**Data import** (`scripts/`): `seed-taxonomy.ts` must run first (creates
the Allergen and FoodGroup rows the other two scripts look up by slug and
fail loudly without). `import-ingredients.ts` downloads/caches USDA SR
Legacy into `.data/fdc/` then upserts by `fdcId`. `import-products.ts`
paginates the Open Food Facts search API (rate-limited, see D10) and
upserts by `barcode`. Both are plain `tsx` scripts run via npm scripts,
not Next.js API routes — they're one-off/occasional data operations, not
app runtime behavior. Browse/search (`src/lib/nutrition-queries.ts` →
`/ingredients`, `/products` and their `[id]` detail pages) is a thin
read-only layer over the same Prisma models; `src/components/nutrition/*`
holds the shared nutrition-facts table, allergen badge list, and search
form used by both tiers' pages.

## Next steps and open questions

- Next: M3 — recipe/meal admin UI (Owner-only) + a seeded meal database
  built from the ingredients/products now in place.
- Open: final product name/domain (currently just the `arfid-meals`
  codename) — not blocking engineering, but needed before any deploy step.
- Open: what "balanced" means precisely for meal generation (M5) — likely
  needs a simple rule set (e.g. target macro ranges per meal-type tag)
  decided closer to M5 rather than guessed now.
- Open (raised by D10, not resolved): how much should M5's meal generation
  lean on Product-tier allergen data given it can be incomplete? Worth an
  explicit decision before M5 rather than an implicit assumption — e.g.
  should generation prefer Ingredient-tier components (heuristic-derived,
  but complete-by-construction) over Product-tier ones when a user has any
  active exclusion rule, purely to reduce reliance on OFF's gaps?
- Note for later: Foundation Foods (USDA's newer, smaller, more rigorously
  tested dataset) could be layered in alongside SR Legacy without a schema
  change if the ingredient set ever needs to grow (see D8).
