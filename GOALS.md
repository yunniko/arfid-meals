# Goals — arfid-meals

Owner writes goals here; The Company plans, executes, and logs against them.
Statuses: `DRAFT` (not ready to start) · `ACTIVE` · `BLOCKED` · `DONE`.
Template for a new goal, company-wide numbering, and cross-project conventions
live in `E:\CLAUDE\COMPANY\GOALS.md`.

---

## Active goals

### G-001 · arfid-meals MVP — ACTIVE
- **What:** A mobile-first, multilingual (Czech + English at MVP) web app
  that helps people with ARFID (Avoidant/Restrictive Food Intake Disorder)
  or food intolerances build balanced meals they can actually trust. It has:
  1. A **raw-ingredient database** (generic foods, e.g. "chicken breast,
     raw") with detailed nutrition (macros + key micronutrients), sourced
     from USDA FoodData Central (public domain, country-agnostic per-100g
     values).
  2. A **market-product database** (branded products, e.g. a specific
     yogurt SKU) scoped per country — Czechia at MVP — with nutrition
     facts, sourced from Open Food Facts, explicitly flagging gluten,
     lactose, sugar content, and allergens.
  3. A **meal/recipe database** layered on top of ingredients + products:
     each meal's nutrition is computed from its components, has optional
     step-by-step preparation instructions (some meals need none, e.g. "a
     yogurt"), and carries meal-type tags (breakfast/lunch/dinner/snack —
     multi-select) and effort/difficulty tags (low-effort/easy/hard/fast/
     long — multi-select).
  4. **User profiles** with a personal black/white list at three
     granularities: a whole food group (e.g. "meat"), a specific food
     within a group (e.g. "chicken"), or a specific preparation of a food
     (e.g. "fried chicken").
  5. **Meal generation**: given a user's profile (exclusions/inclusions),
     produce balanced meal suggestions that respect their list.
  6. **Terms & Conditions** with an explicit disclaimer that the user must
     independently reevaluate whether a meal/ingredient is safe for their
     own condition, plus a visible on-page safety-disclaimer marker on
     every meal/ingredient/product (not just buried in the ToS).
  7. An **owner-only admin UI** to author/edit recipes/meals (recipe
     content is hand-authored by the Owner, not imported, to avoid
     licensing risk and keep ARFID-appropriate framing — see decision
     below).
  8. **Mobile-first responsive design**, built as a foundation a later
     native/PWA mobile wrapper can sit on top of (not building the mobile
     app itself in this goal).
- **Why:** People with ARFID or food intolerances need to plan meals that
  are nutritionally balanced *and* safe for them, but existing nutrition
  apps aren't built around exclusion-first, safety-first meal selection —
  they assume the user can eat anything and optimizes from there.
- **Acceptance criteria:**
  1. Ingredient database: a useful starter set of raw ingredients (USDA
     FDC-sourced) browsable/searchable, each showing macro + key
     micronutrient detail per 100g, with source attribution.
  2. Product database: a useful starter set of Czech-market products
     (Open Food Facts-sourced, filtered to Czechia), each showing
     nutrition facts and explicit gluten/lactose/sugar/allergen flags,
     with source attribution.
  3. Meal database: a seeded set of real meals spanning breakfast/lunch/
     dinner/snack, each with computed nutrition totals, meal-type tags,
     effort tags, and optional prep steps; created/edited through an
     admin UI restricted to the Owner's account.
  4. A registered user can build a black/white list at group, specific-food,
     and specific-preparation granularity, and edit it any time.
  5. A registered user can generate meal suggestions that never include
     anything on their blacklist (or, for a whitelist-only user, only
     things on it).
  6. Every meal/ingredient/product page shows a visible safety-disclaimer
     marker; the ToS/legal page states the user must reevaluate safety for
     their own condition themselves.
  7. Works cleanly on a phone-sized viewport (no horizontal overflow,
     usable touch targets) for every page in this list.
  8. Automated tests cover the exclusion-filtering and meal-generation
     logic (unit) and the core create-profile → set exclusions → generate
     meal flow (e2e).
- **Constraints:** no deadline; budget = none (no paid services — USDA FDC
  and Open Food Facts are both free; Open Food Facts is ODbL-licensed and
  requires attribution, recorded wherever its data is shown). Stack:
  TypeScript/Next.js/Prisma/PostgreSQL/next-auth/next-intl, matching
  `listing-studio`/`when-we-meet` per STANDARDS.md "minimize spread". MVP
  market = Czechia; MVP languages = Czech + English (architecture supports
  adding more later, not built now). Project codename `arfid-meals` is a
  working name — branding/domain to be finalized by the Owner later, not
  blocking engineering work.

**Scope decisions** (clarified with Owner 2026-08-30, via AskUserQuestion):
  - Data source: Open Food Facts backbone for the country-scoped *product*
    database. JulAI additionally chose USDA FoodData Current (FDC) as the
    source for the generic *raw-ingredient* tier specifically, since raw
    ingredient nutrition is largely country-agnostic and FDC is public
    domain (no attribution burden) with strong micronutrient detail — this
    two-tier ingredient/product split wasn't itself asked about, logged
    here as a JulAI judgment call per OPERATIONS.md.
  - MVP market: Czechia only (Owner's own answer, overriding the
    France+Czech option offered).
  - MVP languages: Czech + English. Not explicitly asked; inferred by
    JulAI because multilanguage is a stated core requirement of the
    product (not a later nice-to-have), so the i18n architecture needs to
    prove itself with at least two real languages from M1 rather than
    being retrofitted later. Revisit with the Owner if this is wrong.
  - Recipe content: Owner authors/edits meals directly via an admin UI
    (not JulAI-drafted, not imported) — zero licensing risk, full control
    over ARFID-appropriate framing.

**Milestones** (filled in by The Company during planning):
- [x] M1 — Foundation & data model: Next.js/TS/Prisma/Postgres scaffold
      (Docker), next-auth wired (email+password, Role enum incl. ADMIN),
      next-intl wired (cs/en, cookie-based locale). Core schema: Ingredient,
      Product (country-scoped), Allergen, FoodGroup, Meal, MealComponent
      (links a meal to ingredients/products with quantities), MealTypeTag/
      MealEffortTag, UserProfile, ExclusionRule (group/food/preparation
      granularity). ✔ 2026-08-30. Verified: full register → auto sign-in →
      redirect flow driven in a real browser, confirmed the actual Postgres
      row (email, hashed password, `termsAcceptedAt` set); logout; login
      with a wrong password (translated error shown) then the correct one
      (session restored); cookie-driven locale switch confirmed via raw SSR
      fetch in both `en` and `cs` (Chrome's own auto-translate corrupted
      on-screen screenshots mid-session, same known issue as when-we-meet's
      HANDOVER — worked around by verifying via curl/DB instead of
      screenshots). `tsc --noEmit`, `eslint`, and `next build` all clean.
      Test user cleaned up from the database afterward. Git initialized,
      first commit made (secrets/generated Prisma client confirmed
      gitignored before committing).
- [x] M2 — Ingredient + product data import: import pipeline pulling a
      starter set of raw ingredients from USDA FDC (full macro/micronutrient
      detail) and a starter set of Czechia-scoped products from Open Food
      Facts (gluten/lactose/sugar/allergen extraction), both stored with
      source attribution per license. Read-only browse/search UI for both
      (no auth needed to view). ✔ 2026-08-30. Delivered: `npm run
      seed:taxonomy` (14 EU-regulated allergens + a 15-entry FoodGroup
      tree), `npm run import:ingredients` (2,413 raw ingredients from
      USDA FDC's SR Legacy dataset — a real filtered subset, not a hand-
      picked list; see HANDOVER D8), `npm run import:products` (493
      Czechia-scoped products from Open Food Facts, rate-limited to their
      documented 10 req/min search limit). `/ingredients` and `/products`
      browse+search pages plus per-item detail pages showing full
      macro/micronutrient facts, allergen badges, gluten/lactose flags,
      the safety disclaimer, and source attribution — all translated
      cs/en. 9 new Vitest unit tests for the name-based allergen/gluten/
      lactose inference heuristic (the ingredient tier's only source of
      allergen data, since USDA doesn't provide it — see HANDOVER D9).
      Verified: both import scripts run end-to-end against the real
      external sources (not fixtures) and real DB row counts/spot-checks
      confirmed by hand; browse/search and detail pages driven in a real
      browser in both locales. Found and fixed two real data-quality
      issues along the way (see HANDOVER D10): a handful of Open Food
      Facts entries with physically implausible calorie values (up to
      24,000 kcal/100g — filtered out on import) and Open Food Facts'
      allergen tags being incomplete on some real products (not
      fixable — the "no allergens declared" copy was reworded to stop
      reading as a safety guarantee it isn't). `tsc`, `eslint`, `next
      build`, and the full Vitest suite all clean.
- [x] M3 — Recipe/meal admin + database: Owner-facing admin UI to compose
      meals from ingredients/products (auto-computed nutrition totals),
      set meal-type and effort tags, add optional step-by-step
      instructions, and set the per-meal safety-disclaimer marker. ✔
      2026-08-31/09-01. Delivered `/admin/meals` (list/create/edit/delete,
      `Role.ADMIN`-gated), a search-and-add composer for both ingredients
      and products with live quantity editing, and public `/meals` +
      `/meals/[id]` browse pages showing computed nutrition totals,
      combined allergens across every component, tags, prep steps, and
      the safety disclaimer. Verified end to end in a real browser:
      registered an admin (via a temporary `ADMIN_EMAIL`, reverted after),
      composed a real two-component meal (a USDA ingredient + an Open
      Food Facts product) through the actual UI, confirmed the computed
      total (618.6 kcal) and the "this total is a minimum" flag correctly
      appearing only for fields where a component's data was genuinely
      missing, and confirmed the admin gate's all three branches (no
      session → redirect to `/login`; signed in but not admin → 404;
      admin → full access). Deliberately did NOT seed "an initial real
      set of meals" as originally worded in this milestone's plan — see
      HANDOVER D11 for why, and what was verified instead (create the
      admin UI, prove it works with a throwaway test meal, delete the
      test meal, leave the table empty for the Owner). `tsc`, `eslint`,
      `next build` clean; 14/14 Vitest tests green (5 new, covering
      `computeMealTotals`).
- [x] M4 — User profiles & exclusion lists: registration/login, profile
      page with black/white list management UI at group/food/preparation
      granularity. ✔ 2026-09-01. Every new registration gets a
      `UserProfile` automatically. `/profile` shows the current rule list
      plus two add-forms: one for a whole `FoodGroup` (dropdown, parent
      groups with children indented beneath), one for a specific
      ingredient/product (live search, same picker pattern as the meal
      composer) with an optional free-text preparation qualifier — blank
      covers every preparation, filled in scopes to just that one (the
      exact "exclude meat as a group, or just fried chicken" example from
      the original spec). Verified end to end in a real browser: added a
      whole-group blacklist rule (Meat), confirmed the real DB row and
      the correct hierarchical dropdown rendering; added an
      item+preparation rule (a raw chicken breast ingredient + "fried"),
      confirmed the DB row and the rendered label; removed the group rule
      and confirmed only the item rule remained. `removeExclusionRuleAction`
      scopes its delete to the caller's own profile
      (`profile: { userId: session.user.id }`) so one user can't delete
      another's rule by guessing an id. en/cs message-key parity checked
      programmatically (zero missing/extra keys either direction).
      `tsc`/`eslint`/`next build` clean, full Vitest suite green — no new
      pure logic here worth unit-testing beyond what zod's schema already
      declares; the real correctness surface (DB writes, ownership-scoped
      deletion) was verified live in the browser + DB instead.
- [x] M5 — Meal generation: given a profile's exclusions/inclusions,
      generate meal suggestions from the seeded database, correctly
      respecting exclusions at all three granularities. ✔ 2026-09-01.
      `/meals/generate` (auth-required) picks a random compliant meal,
      with optional meal-type/effort filters and a "try another" link.
      Core compliance logic (`src/lib/meal-compliance.ts`) is pure and
      unit-tested (15 new tests: group-vs-descendant matching, item
      rules with/without a preparation qualifier, whitelist-only
      full-coverage semantics, blacklist+whitelist combined). "Balanced"
      was deliberately scoped down from the original spec's framing —
      see HANDOVER D13 — to mean "respects your list", not a fabricated
      nutrition-target scoring system. Verified live with 3 real
      throwaway meals created via the actual admin UI (created, tested,
      deleted — same pattern as M3): confirmed a whole-group blacklist
      (Meat) correctly excluded both a beef and a chicken meal (2 of 3 →
      1 of 3 compliant); confirmed a preparation-qualified blacklist
      rule ("chicken" + "fried") excluded only the meal whose *steps*
      actually named "fried", not a beef meal containing no chicken at
      all; confirmed the type-tag filter (DINNER) correctly narrowed
      candidates before compliance filtering, and correctly landed on
      the single remaining compliant meal; confirmed the zero-candidates
      case (no meals of a given type) and the zero-compliant-but-some-
      candidates case (an unrelated whitelist rule) both render their
      distinct, correct messages. `tsc`/`eslint`/`next build` clean,
      full Vitest suite green (29 tests).
- [ ] M6 — Legal, polish & testing: Terms & Conditions with the
      safety-reevaluation disclaimer, visible per-item disclaimer marker,
      mobile-viewport pass across all pages, Vitest unit tests
      (exclusion-filtering, meal-generation logic) + Playwright e2e (core
      flow), README/HANDOVER finalized.

**Progress log** (newest first; The Company appends at every stopping point):
- 2026-09-01 — **M5 done and verified.** Built `src/lib/meal-compliance.ts`
  (pure, 15 new unit tests) and `src/lib/generation-queries.ts` (Prisma
  wiring + random pick, moved out of the page component specifically
  because `Math.random()` inside a Server Component's render body trips
  the react-hooks/purity lint rule). `/meals/generate` filters by
  meal-type/effort tag, applies the profile's exclusion rules, and picks
  one compliant meal at random with a "try another" link. Deliberately
  scoped "balanced" down to "respects your exclusion list" rather than
  inventing a nutrition-target scoring formula — see HANDOVER D13.
  Verified against 3 real meals created (and afterward deleted) through
  the actual admin UI: whole-group blacklist, preparation-qualified item
  blacklist, meal-type filtering, and both empty-result branches (no
  candidates at all vs. candidates but none compliant) all confirmed
  live. Full Vitest suite green (29 tests), `tsc`/`eslint`/`next build`
  clean. **Stopping here per OPERATIONS.md milestone checkpoint —
  awaiting Owner review before starting M6** (Terms & Conditions,
  mobile-viewport polish, and full test suite).
- 2026-09-01 — **M4 done and verified.** `UserProfile` now created
  automatically at registration. Built `/profile` with two independent
  add-rule forms (whole food group; specific ingredient/product +
  optional preparation) and a remove action scoped to the caller's own
  profile. Verified live: whole-group blacklist rule, item+preparation
  rule, and rule removal, each cross-checked against real Postgres rows.
  Confirmed en/cs message parity programmatically. `tsc`/`eslint`/
  `next build` clean, full Vitest suite green. **Stopping here per
  OPERATIONS.md milestone checkpoint — awaiting Owner review before
  starting M5** (meal generation from a profile's exclusion rules).
- 2026-09-01 — **M3 done and verified.** Built the meal admin (composer
  with live ingredient/product search via two new `/api/search/*`
  routes, tag checkboxes, optional steps/safety-note fields) and public
  meal browse/detail pages, on top of a new pure `computeMealTotals`
  function (`src/lib/meal-nutrition.ts`) that sums scaled per-100g
  values across a meal's components and explicitly flags which totals
  are undercounts due to missing source data, rather than silently
  treating "unknown" as "zero". `requireAdmin()` gates every admin route
  and action server-side (never trusting the client), verified against
  all three real cases in a browser: no session, wrong role, and admin.
  Followed the create-then-delete verification pattern from M1/M2 rather
  than leaving fake content in the database — see HANDOVER D11 for the
  reasoning tied to the Owner's D5 decision. 5 new Vitest tests (14
  total), full suite green; `tsc`/`eslint`/`next build` clean.
  **Stopping here per OPERATIONS.md milestone checkpoint — awaiting
  Owner review before starting M4** (user profiles & exclusion lists).
- 2026-08-30 — **M2 done and verified.** Built the taxonomy seed
  (`scripts/seed-taxonomy.ts`) and both import pipelines
  (`scripts/import-ingredients.ts`, `scripts/import-products.ts`), then
  ran them for real: 2,413 ingredients (USDA FDC SR Legacy, filtered to
  13 raw/generic food categories minus any cooking-method keyword — see
  HANDOVER D8) and 493 Czech products (Open Food Facts search API,
  rate-limited). Built `src/lib/allergens.ts` (the 14 EU-regulated
  allergens, each mapped to its Open Food Facts tag) and
  `src/lib/food-heuristics.ts` (name-based gluten/lactose/allergen
  inference for the ingredient tier only — HANDOVER D9 explains why
  that's safe for single-ingredient raw foods but would NOT be safe for
  branded products, which is exactly why products use OFF's own declared
  tags instead). Built `/ingredients` and `/products` browse+search pages
  and per-item detail pages (nutrition facts, allergen badges, gluten/
  lactose flags, safety disclaimer, source attribution), linked from a
  new site nav, translated cs/en. Caught two real data-quality problems
  while spot-checking real imported data (not hypothetical — see HANDOVER
  D10): OFF entries with impossible calorie values (fixed: implausible-
  value filter added to the import script, bad rows purged) and OFF's
  allergen tags being incomplete on some genuine dairy products (not
  fixable at the data layer — reworded the "no allergens declared" UI
  copy so it reads as an absence of a positive signal, not a safety
  guarantee). 9 new Vitest unit tests for the heuristic module. `tsc`,
  `eslint`, `next build` clean; full Vitest suite green. **Stopping here
  per OPERATIONS.md milestone checkpoint — awaiting Owner review before
  starting M3** (recipe/meal admin UI + seeded meal database).
- 2026-08-30 — **M1 done and verified.** Scaffolded via `create-next-app`
  matching listing-studio/when-we-meet's exact Next 16.2.10/React 19.2.4
  versions, then added Prisma 7 (client output to `src/generated/prisma`,
  `PrismaPg` adapter), next-auth v5 beta (Credentials provider, JWT
  sessions, admin-bootstrap-by-email pattern copied from listing-studio),
  and next-intl (cs/en, cookie-based locale, English-fallback deep-merge —
  copied from when-we-meet's fixed-locale-list variant rather than
  listing-studio's env-driven one, since there's no staged-rollout need
  here, see HANDOVER D7). Local Postgres via `docker compose up -d db`
  (port 54322, following the registry's per-project-port convention from
  COMPANY/INFRASTRUCTURE.md, not yet a real deploy). Core schema covers
  every entity named in the acceptance criteria; full detail in
  HANDOVER "How things fit together". Built minimal register/login pages
  and an `/about` stub carrying the safety disclaimer early, so the
  footer link isn't dead and AC6 has a first real home before M6 expands
  it into the full ToS. Verified end to end in a real browser (see M1
  checklist above); full suite is just `tsc`/`eslint`/`next build` at this
  stage since there's no business logic yet to unit-test — Vitest/
  Playwright get real specs starting M2 once there's something to test.
  **Stopping here per OPERATIONS.md milestone checkpoint — awaiting Owner
  review before starting M2** (USDA FDC + Open Food Facts import
  pipelines).
- 2026-08-30 — Goal created and planned with the Owner. Scoping questions
  (data source, MVP market/language, recipe content ownership) resolved via
  AskUserQuestion — see Scope decisions above. Stack decision: followed
  portfolio precedent (TypeScript/Next.js/PostgreSQL/Prisma/next-auth/
  next-intl, per listing-studio/when-we-meet) rather than picking cold.
