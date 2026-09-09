import { test, expect } from "@playwright/test";
import { Client } from "pg";
import { randomUUID } from "node:crypto";

// Raw pg client for test fixtures/cleanup, not the app's generated Prisma
// client: Prisma 7's client output is ESM-only (`import.meta`), which
// Playwright's CJS-based test transform can't load directly.
const db = new Client({ connectionString: process.env.DATABASE_URL });

const ADMIN_EMAIL = "e2e-admin@example.com"; // matches playwright.config.ts's ADMIN_EMAIL
const RUN_ID = Date.now();
const USER_EMAIL = `e2e-user-${RUN_ID}@example.com`;
const PASSWORD = "correcthorse123";
// Negative fdcId: guaranteed to never collide with a real USDA FoodData
// Central id, so this fixture is safe to run even against a fully
// imported dev database (see HANDOVER — real import data isn't a
// prerequisite for this suite). Kept well within Postgres int4 range
// (unlike RUN_ID itself, a millisecond timestamp).
const TEST_FDC_ID = -(1000 + (RUN_ID % 1_000_000));
const TEST_INGREDIENT_NAME = `E2E Test Chicken ${RUN_ID}`;
const TEST_MEAL_NAME = `E2E Test Meal ${RUN_ID}`;

test.describe("core flow", () => {
  test.beforeAll(async () => {
    await db.connect();
    await db.query(
      `INSERT INTO ingredients
         (id, name, "fdcId", "kcal", "proteinG", "fatG", "carbsG", "sugarG", "fiberG", "sodiumMg",
          "containsGluten", "containsLactose", source, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, 120, 22, 3, 0, 0, 0, 50, false, false, 'usda_fdc', now(), now())`,
      [randomUUID(), TEST_INGREDIENT_NAME, TEST_FDC_ID],
    );
  });

  test.afterAll(async () => {
    await db.query(
      `DELETE FROM meal_components WHERE "mealId" IN (SELECT id FROM meals WHERE name = $1)`,
      [TEST_MEAL_NAME],
    );
    await db.query(`DELETE FROM meals WHERE name = $1`, [TEST_MEAL_NAME]);
    await db.query(
      `DELETE FROM exclusion_rules WHERE "ingredientId" IN (SELECT id FROM ingredients WHERE "fdcId" = $1)`,
      [TEST_FDC_ID],
    );
    await db.query(`DELETE FROM ingredients WHERE "fdcId" = $1`, [TEST_FDC_ID]);
    await db.query(`DELETE FROM users WHERE email = ANY($1)`, [[ADMIN_EMAIL, USER_EMAIL]]);
    await db.end();
  });

  test("admin creates a meal; a different user excludes its ingredient; generation respects that", async ({
    page,
  }) => {
    // --- Admin registers (first sign-in with ADMIN_EMAIL is promoted) and creates a meal ---
    await page.goto("/register");
    await page.getByLabel("Email").fill(ADMIN_EMAIL);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText(ADMIN_EMAIL)).toBeVisible();

    await page.goto("/admin/meals/new");
    await page.getByLabel("Name").fill(TEST_MEAL_NAME);
    await page.getByLabel("Lunch").check();
    await page.getByPlaceholder("Search by name...").first().fill(TEST_INGREDIENT_NAME);
    await page.getByRole("button", { name: TEST_INGREDIENT_NAME }).click();
    await page.getByRole("button", { name: "Save meal" }).click();
    await expect(page.getByText(TEST_MEAL_NAME)).toBeVisible();

    // The logout button only lives on the home page.
    await page.goto("/");
    await page.getByRole("button", { name: "Logout" }).click();

    // --- A different, regular user registers ---
    await page.goto("/register");
    await page.getByLabel("Email").fill(USER_EMAIL);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText(USER_EMAIL)).toBeVisible();

    // Baseline: no exclusion rules yet, the meal is visible when generating for Lunch.
    await page.goto("/meals/generate?type=LUNCH");
    await expect(page.getByText("1 of 1 meals in the database fit your list.")).toBeVisible();
    await expect(page.getByRole("heading", { name: TEST_MEAL_NAME })).toBeVisible();

    // --- Exclude the ingredient from the profile ---
    await page.goto("/profile");
    const ingredientSearches = page.getByPlaceholder("Search by name...");
    await ingredientSearches.first().fill(TEST_INGREDIENT_NAME);
    await page.getByRole("button", { name: TEST_INGREDIENT_NAME }).click();
    // Three "Add rule" forms exist now (whole group / specific food /
    // exact item — see IngredientGroup, HANDOVER D18); this exercises the
    // third one, the exact-item form.
    await page.getByRole("button", { name: "Add rule" }).nth(2).click();
    await expect(page.getByText(`Blacklist: ${TEST_INGREDIENT_NAME}`)).toBeVisible();

    // Generation must now correctly report zero compliant meals.
    await page.goto("/meals/generate?type=LUNCH");
    await expect(page.getByText("0 of 1 meals in the database fit your list.")).toBeVisible();
    await expect(
      page.getByText("None of the 1 meals in the database fit your current list."),
    ).toBeVisible();
  });
});
