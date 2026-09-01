import { test, expect, devices } from "@playwright/test";
import { Client } from "pg";

// Just the viewport, not the full iPhone 12 device preset — that preset
// also switches the browser engine to WebKit, which isn't installed by
// default alongside Chromium. The viewport size is what this check
// actually needs.
const MOBILE_VIEWPORT = devices["iPhone 12"].viewport;

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page, path: string) {
  await page.goto(path);
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
}

test.describe("public pages", () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  const PUBLIC_PAGES = ["/", "/login", "/register", "/about", "/ingredients", "/products", "/meals"];
  for (const path of PUBLIC_PAGES) {
    test(`no horizontal overflow on ${path} at a 390px mobile width`, async ({ page }) => {
      await expectNoHorizontalOverflow(page, path);
    });
  }
});

test.describe("authenticated pages", () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  const RUN_ID = Date.now();
  const EMAIL = `e2e-mobile-${RUN_ID}@example.com`;
  const PASSWORD = "correcthorse123";
  const db = new Client({ connectionString: process.env.DATABASE_URL });

  test.beforeAll(async () => {
    await db.connect();
  });

  test.afterAll(async () => {
    await db.query(`DELETE FROM users WHERE email = $1`, [EMAIL]);
    await db.end();
  });

  test("no horizontal overflow on profile, generate, and admin pages", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel("Email").fill(EMAIL);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText(EMAIL)).toBeVisible();

    // Promote to ADMIN directly (independent of the ADMIN_EMAIL env var
    // used elsewhere) and re-authenticate: sessions are JWT-based, so the
    // role embedded in the existing token won't change until a fresh
    // sign-in re-reads the row.
    await db.query(`UPDATE users SET role = 'ADMIN' WHERE email = $1`, [EMAIL]);
    await page.getByRole("button", { name: "Logout" }).click();
    await page.goto("/login");
    await page.getByLabel("Email").fill(EMAIL);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByText(EMAIL)).toBeVisible();

    for (const path of ["/profile", "/meals/generate", "/admin/meals", "/admin/meals/new"]) {
      await expectNoHorizontalOverflow(page, path);
    }
  });
});
