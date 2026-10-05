import { expect, test, type Page } from "@playwright/test";
import { applicationOrigin, json, mockAccount, user } from "./support/mock-account";

const html = (page: Page) => page.locator("html");
const themeColor = (page: Page) => page.locator('meta[name="theme-color"]');
const mockGuest = (page: Page) => page.route("**/api/v1/session", (route) => json(route, 200, { user: null }));

test("the init script applies a dark system theme before the app bundle runs", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await mockGuest(page);
  // Without the bundle only public/theme-init.js can set the class.
  await page.route("**/*", (route) => {
    const request = route.request();
    return request.resourceType() === "script" && !request.url().endsWith("/theme-init.js") ? route.abort() : route.fallback();
  });
  await page.goto(`${applicationOrigin}/`, { waitUntil: "domcontentloaded" });
  await expect(html(page)).toHaveClass(/\bdark-mode\b/);
  await expect(themeColor(page)).toHaveAttribute("content", "#0a0a0a");
  expect(await page.evaluate(() => document.documentElement.style.colorScheme)).toBe("dark");
});

test("a guest follows the system theme and its changes", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await mockGuest(page);
  await page.goto(`${applicationOrigin}/`);
  await expect(page.getByRole("link", { name: "Гітара з нуля" })).toBeVisible();
  await expect(html(page)).toHaveClass(/\bdark-mode\b/);
  await page.emulateMedia({ colorScheme: "light" });
  await expect(html(page)).not.toHaveClass(/\bdark-mode\b/);
  await expect(themeColor(page)).toHaveAttribute("content", "#fffcf7");
});

test("a signed-in learner's saved theme wins over the system", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await mockAccount(page, {}, { theme: "light" });
  await page.goto(`${applicationOrigin}/account`);
  await expect(page.getByRole("radio", { name: "Світла", exact: true })).toBeChecked();
  await expect(html(page)).not.toHaveClass(/\bdark-mode\b/);
  await expect(themeColor(page)).toHaveAttribute("content", "#fffcf7");
  await page.emulateMedia({ colorScheme: "light" });
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(html(page)).not.toHaveClass(/\bdark-mode\b/);
});

test("the account page saves the theme choice and keeps it across reloads", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await mockAccount(page);
  await page.goto(`${applicationOrigin}/account`);
  const appearance = page.getByRole("radiogroup", { name: "Вигляд" });
  await expect(appearance.getByRole("radio", { name: "Системна" })).toBeChecked();
  await expect(html(page)).not.toHaveClass(/\bdark-mode\b/);

  const saved = page.waitForRequest((request) => request.url().endsWith("/api/v1/preferences"));
  await appearance.locator("label").filter({ hasText: /^Темна$/ }).click();
  expect((await saved).postDataJSON()).toEqual({ ...user.preferences, theme: "dark" });
  await expect(html(page)).toHaveClass(/\bdark-mode\b/);

  await page.reload();
  await expect(appearance.getByRole("radio", { name: "Темна", exact: true })).toBeChecked();
  await expect(html(page)).toHaveClass(/\bdark-mode\b/);
  await expect(themeColor(page)).toHaveAttribute("content", "#0a0a0a");

  await page.emulateMedia({ colorScheme: "dark" });
  await appearance.locator("label").filter({ hasText: /^Світла$/ }).click();
  await expect(html(page)).not.toHaveClass(/\bdark-mode\b/);
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
});

test("a failed theme save switches the choice back and announces it", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await mockAccount(page);
  await page.route("**/api/v1/preferences", (route) => json(route, 500, { error: { code: "INTERNAL_ERROR", message: "Помилка." } }));
  await page.goto(`${applicationOrigin}/account`);
  const appearance = page.getByRole("radiogroup", { name: "Вигляд" });
  await appearance.locator("label").filter({ hasText: /^Темна$/ }).click();
  await expect(page.getByText("Не вдалося зберегти налаштування, тому повернули попереднє. Спробуй ще раз.")).toBeVisible();
  await expect(appearance.getByRole("radio", { name: "Системна" })).toBeChecked();
  await expect(html(page)).not.toHaveClass(/\bdark-mode\b/);
});
