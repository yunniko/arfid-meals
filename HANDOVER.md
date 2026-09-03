# Handover — arfid-meals

Read this before touching the project. Goal and milestone plan live in
`GOALS.md` (G-001). Company-wide standards in `E:\CLAUDE\COMPANY\`.

## Current state

All six of G-001's planned milestones (M1-M6) are done and verified —
see `GOALS.md` for the full record. This goal stays **ACTIVE, not
DONE**, pending explicit Owner sign-off (per OPERATIONS.md's definition
of done), even though the engineering work is complete.

Working end to end: Next.js app scaffold, Prisma schema + migration,
email/password auth, cs/en i18n, a starter ingredient/product database
(2,413 USDA ingredients, 493 Czech Open Food Facts products), a meal
admin (`/admin/meals`, compose from ingredients/products, tags, steps,
safety note) plus public meal browse/detail pages, user profiles with
black/white exclusion lists (`/profile`), meal generation
(`/meals/generate`) that respects those rules, and a real Terms of
Use/Privacy page (`/about`) with the Owner's confirmed identity/contact.
Test coverage: 29 Vitest unit tests (pure business logic — nutrition
totals, allergen/gluten/lactose inference, exclusion compliance) and a
first Playwright e2e suite (a real cross-account core flow, plus a
mobile-viewport regression check).

The `meals` table is intentionally empty — see D11 — waiting on the
Owner to populate it through `/admin/meals`; every milestone that needed
real meal data to verify (M3, M5, M6) used real throwaway meals created
and then deleted through that same admin UI rather than permanent
JulAI-authored seed content.

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

To build and run the production image **locally** (not a real deploy —
see D15): `docker compose --profile app up -d --build`, app at
http://127.0.0.1:30020. `AUTH_SECRET` must be set in `.env` first. Tear
down with `docker compose --profile app stop app migrate && docker
compose --profile app rm -f app migrate` (leaves `db` running for normal
dev).
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

**D11 — M3 built the meal admin UI, but deliberately did not seed real
meal content, despite the original milestone wording ("seed an initial
real set of meals").** The Owner's own D5 decision was explicit: recipe
content is Owner-authored via the admin UI, specifically *not*
JulAI-drafted, to avoid licensing risk and keep ARFID-appropriate framing
under direct Owner control. Populating the database with several
JulAI-invented meals — even simple ones — would have quietly worked
around that decision under cover of "just seeding test data." Instead,
M3 was verified the same way M1 verified its test user and M2 verified
its imports: create real data through the real UI, confirm it behaves
correctly end to end (computed totals, allergen aggregation, admin-gate
enforcement), then delete it. The `meals` table is empty on purpose —
the Owner is expected to populate it for real via `/admin/meals` (set
`ADMIN_EMAIL` in `.env` first, see "How to run" above). If the Owner
would rather JulAI draft a starter set after all, that's a scope change
to ask for explicitly, not something to infer from the original
milestone wording over-riding their own D5 decision.

**D12 — Testing note, not a product decision: JWT sessions outlive a
deleted test user.** Discovered while cleaning up M4's manual test
accounts: sessions use the JWT strategy (`src/auth.ts`, required for the
Credentials provider), so a session cookie stays valid — and the nav bar
still shows as logged in, with whatever role was in the token — even
after the underlying `User` row is deleted directly in Postgres, since
nothing re-checks the DB per request. This is standard NextAuth JWT
behavior, not a bug, and isn't reachable in the real product yet (there's
no user-deletion feature exposed to users). It only bit during manual
testing because cleanup deleted DB rows without also logging out in the
browser. Noting it so a future session doesn't mistake it for an app
defect: when clearing test users mid-session, log out via the UI first
(or expect a stale-looking session until the browser's cookie is
cleared/expires) rather than just deleting the DB row.

**D13 — "Balanced" meal generation means "respects your exclusion list",
not a nutrition-target scoring system.** The product pitch and this
goal's original milestone wording both use the word "balanced", but the
actual, testable acceptance criterion (G-001 #5) is only ever about
exclusion compliance: never suggest a blacklisted item, and for a
whitelist-only profile, suggest only whitelisted items. Inventing target
macro ranges per meal-type tag (e.g. "a dinner should have X g protein")
would require real nutrition-science backing this project doesn't have,
and a number invented without that backing would be worse than no
number at all for a safety-focused app — it would look authoritative
without being trustworthy. So M5 implements exclusion compliance as a
hard filter (`isMealCompliant`), and the generate page's own copy says
plainly that it doesn't check any nutrition target, pointing the user to
the numbers already shown on the meal instead. This is a judgment call,
not an Owner-confirmed decision — worth revisiting explicitly with the
Owner if "balanced" was meant to imply more than this.

One direct consequence of this design: group-based exclusion rules only
match `Ingredient` components, never `Product` ones, because `Product`
(the Open Food Facts tier) has no `foodGroupId` in this schema — see
`componentMatchesRule` in `meal-compliance.ts`. A user who blacklists
"Meat" as a whole group will correctly exclude a meal containing a raw
beef *ingredient*, but not (yet) one containing a branded meat *product*.
Also, since Ingredient-tier data was deliberately imported as raw/base
forms only (see D8), a preparation-qualified rule like "chicken, fried"
can only be checked against the *meal's own text* (name/description/
steps) naming that preparation — there's no per-component "how this was
cooked in this meal" field. Both are real, documented limitations, not
oversights; either could become a real M6+ follow-up if it matters in
practice.

**D14 — Terms/Privacy operator identity and contact were confirmed with
the Owner, not invented.** Before writing `docs/legal/about-terms-privacy.md`,
JulAI asked which contact email to use rather than guessing; the Owner
chose reusing `info@julienika.cz` (the same address already on
when-we-meet's and listing-studio's legal pages). The operator-identity
block (name, "private individual based in the Czech Republic, IČO
pending") is copied verbatim from when-we-meet's own legal doc — same
real operator, same portfolio, not a fresh invention. Two things this
page deliberately does NOT assert, because they'd be guesses rather than
Owner decisions: a minimum-age policy (the doc just says age isn't
verified and a parent/guardian managing an account holds the same
rights/responsibilities), and a finalized business registration address
(marked as pending, matching when-we-meet's own doc). Revisit both
before any real deployment. Also: like when-we-meet/listing-studio, only
the page's chrome (title, back-link, draft banner) is translated into
Czech — the legal body itself stays English-only, since translating
legal text accurately is its own effort with its own accuracy risk, not
something to bundle into a UI-string translation pass.

**D15 — Deploy config (Dockerfile, docker-compose `app`/`migrate`
services) was built and locally verified, but the project has not been
deployed.** Per VALUES.md's Restraint principle, nothing leaves the
workspace without explicit Owner approval — building and running the
production image *locally* is safe (fully reversible, nothing pushed or
exposed), so that part was done proactively. Actually deploying to the
shared VPS (pushing to GitHub, SSH-ing in, the root-owned nginx vhost +
TLS cert steps) was not attempted and needs an explicit go-ahead first,
per OPERATIONS.md's standing escalation rule for anything leaving the
workspace. Port `30020` was picked as the next free slot after
listing-studio (30000) and when-we-meet (30010) per
COMPANY/INFRASTRUCTURE.md's registry — that doc is itself a snapshot, so
its own instructions to re-verify freeness on the live host before
actually deploying still apply; picking the number now didn't require
checking a host this project isn't on yet.

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

**Meal admin & browse**: `src/lib/meal-nutrition.ts` (pure —
`computeMealTotals`, unit-tested) → `src/lib/meal-queries.ts` (Prisma
reads, applies the pure function and unions component allergens) is the
public-facing read path (`/meals`, `/meals/[id]`). `src/lib/require-admin.ts`
gates every route/action under `/admin/meals` and `meal-actions.ts`
(no session → `/login`; wrong role → `notFound()`). `src/lib/meal-actions.ts`
(server actions) + `src/lib/meal-validation.ts` (zod) +
`src/components/admin/meal-form.tsx` (tag checkboxes, steps/safety-note
fields) + `src/components/admin/component-picker.tsx` (client-side
debounced search against the new `/api/search/ingredients` and
`/api/search/products` routes, which just wrap the existing
`nutrition-queries.ts` search functions — same data, no new auth
surface) is the write path. Components are stored as a flat
`MealComponent` list (ingredient XOR product + quantityG); edits
delete-and-recreate the whole list rather than diffing, which is fine at
this scale and keeps the action simple.

**Profiles & exclusion rules**: `src/lib/exclusion-validation.ts` (a zod
discriminated union on `targetType: "group" | "item"`) →
`src/lib/exclusion-actions.ts` (`addExclusionRuleAction`,
`removeExclusionRuleAction` — the latter deletes scoped to
`profile: { userId: session.user.id }`, so ownership is enforced by the
query shape itself, not a separate check) → `src/lib/profile-queries.ts`
(reads) → `/profile` page + `src/components/profile/group-rule-form.tsx`
(server-rendered `<select>`, no client JS needed) +
`item-rule-form.tsx` (client, reuses the same debounced-search pattern as
`component-picker.tsx` but single-select). `registerAction` now creates
a `UserProfile` alongside the `User` row so every account has one from
the start; `requireProfileId()` in `exclusion-actions.ts` upserts one
defensively for any account that predates this (there shouldn't be any
in practice, but costs nothing to be safe).

**Meal generation**: `src/lib/meal-compliance.ts` (pure — `isMealCompliant`,
`componentMatchesRule`, `isInGroupOrDescendant`, unit-tested) is the
safety-facing core. `src/lib/generation-queries.ts` fetches candidate
meals (optionally filtered by type/effort tag), maps each into the plain
shape `meal-compliance.ts` expects, filters by the caller's exclusion
rules, computes nutrition totals for the survivors via the same
`computeMealTotals` M3 already built, and picks one at random — the
random pick lives here rather than in the page component specifically
because calling `Math.random()` inside a Server Component's render body
trips `react-hooks/purity`. `/meals/generate` is a thin presentation
layer over that: reads `type`/`effort` from `searchParams`, renders the
filter form (plain GET, no client JS needed), and shows the picked meal
or one of two distinct empty-state messages (no candidates at all vs.
candidates but none compliant).

**Legal doc & testing**: `docs/legal/about-terms-privacy.md` (markdown,
source of truth) → `src/lib/legal.ts` (`legalDocHtml()`, reads the file
and renders it via `marked`) → `/about` (adds the draft-banner UI and
translated chrome around the rendered HTML). The `Dockerfile` copies
`docs/legal/` into the runtime image alongside the build output — copied
verbatim from when-we-meet's own Dockerfile (which solved this exact
problem first) rather than re-derived; confirmed by actually building
and running the image locally (`docker compose --profile app up -d
--build`, then curling `/about` against the running container) rather
than assumed correct from reading the Dockerfile. `playwright.config.ts` runs the app on
a dedicated port (3100) so e2e never collides with a manually-running
`npm run dev` on 3000; `tests/e2e/core-flow.spec.ts` and
`mobile-viewport.spec.ts` both connect to Postgres directly via the `pg`
package rather than the app's generated Prisma client, because Prisma
7's client output is ESM-only (`import.meta`) and Playwright's test
transform is CJS-based — trying to import `@/lib/prisma` (or the
generated client directly) from an e2e spec fails at load time. Both
specs create uniquely-named fixtures (timestamp-suffixed emails/ids) and
delete them in `afterAll`, verified by hand to leave zero rows behind
across repeated runs.

## Next steps and open questions

- Open: the Owner should populate `/admin/meals` with real content
  whenever convenient — the app is functionally complete but has no real
  meals to show a real user yet.
- Open (D13): is "respects your exclusion list" the right scope for
  "balanced," or did the Owner want an actual nutrition-target scoring
  system? Worth confirming explicitly rather than assuming the narrower
  reading is final.
- Open (D13): group-based exclusion rules don't yet cover Product-tier
  components (no `foodGroupId` on `Product`) — revisit if this turns out
  to matter once real meals include branded products in group-relevant
  categories (e.g. a packaged meat product).
- Open (D14): finalize the operator's business registration address and
  any minimum-age policy before a real deploy — both are placeholders by
  design, not oversights.
- Open: deploy config exists and was verified locally (D15), but nothing
  has been deployed. Actually putting this live needs an explicit Owner
  go-ahead (GitHub push destination, confirming the domain/subdomain,
  and the root-owned nginx vhost + TLS steps the Owner runs directly per
  COMPANY/INFRASTRUCTURE.md) — not something to do unprompted.
- Open: self-service account deletion/data export doesn't exist yet —
  disclosed honestly in the Terms/Privacy page as a known gap rather than
  silently omitted; worth a real feature at some point rather than
  staying a manual (`info@julienika.cz`) process indefinitely.
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
