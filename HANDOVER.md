# Handover — arfid-meals

Read this before touching the project. Goal and milestone plan live in
`GOALS.md` (G-001). Company-wide standards in `E:\CLAUDE\COMPANY\`.

## Current state

M1 (foundation & data model) is done and verified — see `GOALS.md` G-001
for the full record. Working: Next.js app scaffold, Prisma schema + first
migration, email/password auth (next-auth), cs/en i18n with a working
language switcher, a minimal home/register/login/about flow. Not built yet:
any real ingredient/product/meal data (M2-M3), user-facing exclusion-list
UI (M4), meal generation (M5), and the real Terms & Conditions (M6 — the
`/about` page is a stub carrying just the safety disclaimer for now).

## How to run

1. `docker compose up -d db` — starts local Postgres (port 54322).
2. `npm install`
3. `npx prisma migrate dev` — applies the schema (already applied once;
   re-run after pulling schema changes).
4. `npm run dev` — app at http://localhost:3000.

`ADMIN_EMAIL` in `.env` (currently blank) is the email that gets promoted
to `Role.ADMIN` on its first sign-in — set it before registering the
account that should get admin/recipe-authoring access, per D1 in `src/auth.ts`.

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

## Next steps and open questions

- Next: M2 — USDA FDC + Open Food Facts import pipelines, plus a read-only
  browse/search UI for both tiers.
- Open: final product name/domain (currently just the `arfid-meals`
  codename) — not blocking engineering, but needed before any deploy step.
- Open: exact USDA FDC and Open Food Facts import mechanics (API vs bulk
  data dump, which subset of each to pull) — to be decided during M2.
- Open: what "balanced" means precisely for meal generation (M5) — likely
  needs a simple rule set (e.g. target macro ranges per meal-type tag)
  decided closer to M5 rather than guessed now.
- Note for M2: `Ingredient`/`Product` nutrient fields are all nullable
  (not every source row reports every nutrient) — the import pipeline
  should record `null` rather than `0` for genuinely-missing data, since
  those aren't the same thing for a nutrition app.
