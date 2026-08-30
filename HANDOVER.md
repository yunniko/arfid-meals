# Handover — arfid-meals

Read this before touching the project. Goal and milestone plan live in
`GOALS.md` (G-001). Company-wide standards in `E:\CLAUDE\COMPANY\`.

## Current state

Nothing built yet. Goal G-001 is planned (6 milestones, see `GOALS.md`) but
M1 (foundation scaffold) has not started. This file will grow a "How things
fit together" section once there's real architecture to describe.

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

## How things fit together

Not written yet — no architecture exists. Will cover: schema shape
(Ingredient/Product/Meal/MealComponent/ExclusionRule relationships), the
import pipelines for USDA FDC and Open Food Facts, and how meal generation
applies exclusion rules, once M1–M2 exist.

## Next steps and open questions

- Next: M1 (foundation scaffold + core Prisma schema).
- Open: final product name/domain (currently just the `arfid-meals`
  codename) — not blocking engineering, but needed before any deploy step.
- Open: exact USDA FDC and Open Food Facts import mechanics (API vs bulk
  data dump, which subset of each to pull) — to be decided during M2, not
  M1.
- Open: what "balanced" means precisely for meal generation (M5) — likely
  needs a simple rule set (e.g. target macro ranges per meal-type tag)
  decided closer to M5 rather than guessed now.
