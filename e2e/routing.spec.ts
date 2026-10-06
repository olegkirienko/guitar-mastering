import { expect, test, type Page } from "@playwright/test";
import { applicationOrigin, json, lessonOneCompleted, lessonOneId, lessonTwoId, mockAccount, user } from "./support/mock-account";

async function mockGuestSession(page: Page) {
  await page.route("**/api/v1/session", (route) => json(route, 200, { user: null }));
}

async function noHorizontalScroll(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
}

test("redirects a guest from protected pages to sign-in without showing lesson content", async ({ page }) => {
  await mockGuestSession(page);
  for (const path of ["/lessons/01/air", "/course", "/account"]) {
    await page.goto(`${applicationOrigin}${path}`);
    await expect(page).toHaveURL(`${applicationOrigin}/auth?next=${encodeURIComponent(path)}`);
    await expect(page.getByRole("heading", { name: "Вхід до курсу" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Як рух доходить до вуха?" })).toHaveCount(0);
  }
});

test("sends the landing call to action to sign-in for a guest", async ({ page }) => {
  await mockGuestSession(page);
  await page.goto(`${applicationOrigin}/`);
  await page.getByRole("link", { name: "Перейти до курсу" }).first().click();
  await expect(page).toHaveURL(`${applicationOrigin}/auth`);
});

test("signs in to the resume path and ignores an unsafe next", async ({ page }) => {
  let signedIn = false;
  await page.route("**/api/v1/session", (route) => json(route, 200, { user: signedIn ? user : null }));
  await page.route("**/api/v1/auth/login", (route) => { signedIn = true; return json(route, 200, { user }); });
  const api = await mockAccount(page, { [lessonOneId]: lessonOneCompleted, [lessonTwoId]: { currentStepId: "string", completedStepIds: ["intro"] } });
  await page.route("**/api/v1/session", (route) => json(route, 200, { user: signedIn ? user : null }));

  await page.goto(`${applicationOrigin}/auth?next=${encodeURIComponent("//evil.example/x")}`);
  await page.getByLabel("Ім’я користувача").fill("Player.One");
  await page.getByLabel("Пароль").fill("correct horse guitar");
  await page.locator("form").getByRole("button", { name: "Увійти", exact: true }).click();
  await expect(page).toHaveURL(`${applicationOrigin}/lessons/02/string`);
  await expect(page.getByRole("heading", { name: "Одна струна — два звуки" })).toBeVisible();
  expect(api.progress(lessonTwoId)?.currentStepId ?? "string").toBe("string");
});

test("redirects a signed-in visitor of the sign-in page and the landing CTA to the resume path", async ({ page }) => {
  await mockAccount(page, { [lessonOneId]: { currentStepId: "air", completedStepIds: ["intro", "string"] } });
  await page.goto(`${applicationOrigin}/auth`);
  await expect(page).toHaveURL(`${applicationOrigin}/lessons/01/air`);
  await page.goto(`${applicationOrigin}/`);
  await expect(page.getByRole("link", { name: "Перейти до курсу" }).first()).toHaveAttribute("href", "/lessons/01/air");
});

test("redirects unknown lessons, unknown steps and unreachable targets without a content flash", async ({ page }) => {
  await mockAccount(page, { [lessonOneId]: { currentStepId: "string", completedStepIds: ["intro"] } });
  await page.goto(`${applicationOrigin}/lessons/99/intro`);
  await expect(page).toHaveURL(`${applicationOrigin}/course`);

  await page.goto(`${applicationOrigin}/lessons/01/no-such-step`);
  await expect(page).toHaveURL(`${applicationOrigin}/lessons/01/string`);

  await page.goto(`${applicationOrigin}/lessons/01/checkpoint`);
  await expect(page).toHaveURL(`${applicationOrigin}/lessons/01/string`);
  await expect(page.getByRole("heading", { name: "Зустріч зі струною" })).toBeVisible();

  // Lesson 2 stays closed until Lesson 1 is completed.
  await page.goto(`${applicationOrigin}/lessons/02/intro`);
  await expect(page).toHaveURL(`${applicationOrigin}/course`);
  await page.goto(`${applicationOrigin}/lessons/01`);
  await expect(page).toHaveURL(`${applicationOrigin}/lessons/01/string`);
});

test("opens a reached step from the course, disables an unreached one, keeps the step on reload, and goes back", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  const api = await mockAccount(page, { [lessonOneId]: { currentStepId: "air", completedStepIds: ["intro", "string"] } });
  await page.goto(`${applicationOrigin}/course`);
  // The lesson cards sit under their stage, which counts the completed lessons.
  const stage = page.getByRole("region", { name: "Етап I · Звук" });
  await expect(stage.getByRole("heading", { name: "Етап I · Звук" })).toBeVisible();
  await expect(stage.getByText("0 з 5 уроків")).toBeVisible();
  const lessonOne = stage.getByRole("list", { name: "Кроки уроку 01" });
  await expect(lessonOne.getByRole("link", { name: /Як рух доходить до вуха\?/ })).toHaveAttribute("aria-current", "step");
  const locked = lessonOne.getByRole("link", { name: /Збери шлях звуку/ });
  await expect(locked).toHaveAttribute("aria-disabled", "true");
  await expect(locked).toHaveAccessibleDescription("Спершу пройди попередній крок");
  await expect(page.getByRole("list", { name: "Кроки уроку 02" }).getByRole("link", { name: /Повернімося/ })).toHaveAttribute("aria-disabled", "true");

  await lessonOne.getByRole("link", { name: /Зустріч зі струною/ }).click();
  await expect(page).toHaveURL(`${applicationOrigin}/lessons/01/string`);
  await expect.poll(() => api.progress(lessonOneId)?.currentStepId).toBe("string");
  await page.reload();
  await expect(page).toHaveURL(`${applicationOrigin}/lessons/01/string`);
  await expect(page.getByRole("heading", { name: "Зустріч зі струною" })).toBeVisible();

  await page.getByRole("navigation", { name: "Кроки уроку" }).getByRole("link", { name: /Почнімо з досліду/ }).click();
  await expect(page).toHaveURL(`${applicationOrigin}/lessons/01/intro`);
  await page.goBack();
  await expect(page).toHaveURL(`${applicationOrigin}/lessons/01/string`);
  await expect(page.getByRole("heading", { name: "Зустріч зі струною" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Кроки уроку" }).getByRole("link", { name: /Зустріч зі струною/ })).toHaveAttribute("aria-current", "step");

  await page.getByRole("link", { name: "Усі уроки" }).click();
  await expect(page).toHaveURL(`${applicationOrigin}/course`);
  await page.getByRole("link", { name: "Продовжити" }).click();
  await expect(page).toHaveURL(`${applicationOrigin}/lessons/01/string`);
});

test("has no horizontal scroll at 320 px on the landing, course and lesson pages", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await mockAccount(page);
  for (const path of ["/", "/course", "/lessons/01/intro"]) {
    await page.goto(`${applicationOrigin}${path}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await noHorizontalScroll(page);
  }
});

test("redirects an unknown path to the home page", async ({ page }) => {
  await mockGuestSession(page);
  await page.goto(`${applicationOrigin}/no/such/page`);
  await expect(page).toHaveURL(`${applicationOrigin}/`);
  await expect(page.getByRole("link", { name: "Курс", exact: true })).toBeVisible();
});

test("navigates with the header links without a page reload and scrolls to the top", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 600 });
  await mockAccount(page);
  await page.goto(`${applicationOrigin}/lessons/01/intro`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.evaluate(() => {
    (window as unknown as { marker: string }).marker = "kept";
    window.scrollTo(0, 400);
  });
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  await page.getByRole("link", { name: "Курс" }).click();
  await expect(page).toHaveURL(`${applicationOrigin}/course`);
  expect(await page.evaluate(() => (window as unknown as { marker?: string }).marker)).toBe("kept");
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});
