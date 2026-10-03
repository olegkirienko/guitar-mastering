import { expect, test, type Page, type Route } from "@playwright/test";

const applicationOrigin = "http://127.0.0.1:4173";

function json(route: Route, status: number, body: unknown) {
  return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

async function mockGuestSession(page: Page) {
  await page.route("**/api/v1/session", (route) => json(route, 200, { user: null }));
}

test("opens a deep link and keeps the page after a reload", async ({ page }) => {
  await mockGuestSession(page);
  await page.goto(`${applicationOrigin}/lessons/02`);
  await expect(page.getByRole("heading", { name: "Повернімося до відкритого питання" })).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(/\/lessons\/02$/);
  await expect(page.getByRole("heading", { name: "Повернімося до відкритого питання" })).toBeVisible();
});

test("redirects an unknown path to the home page", async ({ page }) => {
  await mockGuestSession(page);
  await page.goto(`${applicationOrigin}/no/such/page`);
  await expect(page).toHaveURL(`${applicationOrigin}/`);
  await expect(page.getByRole("link", { name: "Курс" })).toBeVisible();
});

test("navigates with the header links without a page reload and scrolls to the top", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 600 });
  await mockGuestSession(page);
  await page.goto(`${applicationOrigin}/lessons/01`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.evaluate(() => {
    (window as unknown as { marker: string }).marker = "kept";
    window.scrollTo(0, 400);
  });
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  await page.getByRole("link", { name: "Курс" }).click();
  await expect(page).toHaveURL(`${applicationOrigin}/`);
  expect(await page.evaluate(() => (window as unknown as { marker?: string }).marker)).toBe("kept");
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});
