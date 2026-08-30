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
- [ ] M1 — Foundation & data model: Next.js/TS/Prisma/Postgres scaffold
      (Docker), next-auth wired (email+password, Role enum incl. ADMIN),
      next-intl wired (cs/en, cookie-based locale). Core schema: Ingredient,
      Product (country-scoped), Allergen, Meal, MealComponent (links a meal
      to ingredients/products with quantities), MealTag, UserProfile,
      ExclusionRule (group/food/preparation granularity). README/HANDOVER
      stubs in place.
- [ ] M2 — Ingredient + product data import: import pipeline pulling a
      starter set of raw ingredients from USDA FDC (full macro/micronutrient
      detail) and a starter set of Czechia-scoped products from Open Food
      Facts (gluten/lactose/sugar/allergen extraction), both stored with
      source attribution per license. Read-only browse/search UI for both
      (no auth needed to view).
- [ ] M3 — Recipe/meal admin + database: Owner-facing admin UI to compose
      meals from ingredients/products (auto-computed nutrition totals),
      set meal-type and effort tags, add optional step-by-step
      instructions, and set the per-meal safety-disclaimer marker. Seed an
      initial real set of meals covering breakfast/lunch/dinner/snack.
- [ ] M4 — User profiles & exclusion lists: registration/login, profile
      page with black/white list management UI at group/food/preparation
      granularity.
- [ ] M5 — Meal generation: given a profile's exclusions/inclusions,
      generate balanced meal suggestions from the seeded database,
      correctly respecting exclusions at all three granularities.
- [ ] M6 — Legal, polish & testing: Terms & Conditions with the
      safety-reevaluation disclaimer, visible per-item disclaimer marker,
      mobile-viewport pass across all pages, Vitest unit tests
      (exclusion-filtering, meal-generation logic) + Playwright e2e (core
      flow), README/HANDOVER finalized.

**Progress log** (newest first; The Company appends at every stopping point):
- 2026-08-30 — Goal created and planned with the Owner. Scoping questions
  (data source, MVP market/language, recipe content ownership) resolved via
  AskUserQuestion — see Scope decisions above. Stack decision: followed
  portfolio precedent (TypeScript/Next.js/PostgreSQL/Prisma/next-auth/
  next-intl, per listing-studio/when-we-meet) rather than picking cold.
  Not started yet — M1 is next.
