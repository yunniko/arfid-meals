# arfid-meals

A mobile-first, multilingual web app for building balanced meals for people
with ARFID (Avoidant/Restrictive Food Intake Disorder) or food
intolerances. It combines a raw-ingredient database, a country-scoped
market-product database, and a hand-authored meal/recipe database, filtered
through each user's own black/white exclusion list, to generate meals the
user can trust.

`arfid-meals` is a working codename, not a finalized product name/domain.

## Status

M1-M4 done: app scaffold, database schema, email/password auth, cs/en
i18n, a starter ingredient/product database (2,413 USDA ingredients, 493
Czech Open Food Facts products, browsable at `/ingredients`/`/products`),
a meal admin (`/admin/meals`, `Role.ADMIN`-gated) with public `/meals`
browse pages, and user profiles with black/white exclusion lists at
group/food/preparation granularity (`/profile`). The meals table itself
is empty — real meal content is Owner-authored work via the admin UI,
not something JulAI seeds (see HANDOVER D5/D11). See `GOALS.md` (G-001)
for the full milestone plan and `HANDOVER.md` for architecture/decision
notes.

## How to run

1. `docker compose up -d db`
2. `npm install`
3. `npx prisma migrate dev`
4. `npm run import:all` — seeds allergens/food groups and imports the
   ingredient/product data (takes a few minutes; downloads ~200MB once)
5. `npm run dev` — app at http://localhost:3000

See `HANDOVER.md` for the `ADMIN_EMAIL` admin-bootstrap note and more detail.

## Stack

TypeScript, Next.js (App Router), Prisma + PostgreSQL, next-auth, next-intl
(Czech + English at MVP) — matching the `listing-studio`/`when-we-meet`
portfolio pattern per `COMPANY/STANDARDS.md`.
