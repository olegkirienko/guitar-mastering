import { expect, test, type Page, type Route } from "@playwright/test";

const applicationOrigin = "http://127.0.0.1:4173";
const user = { id: "user-1", username: "Player.One", profile: { firstName: null, lastName: null, avatarId: null } };
const guestKey = "guitar-mastering:stage-01-lesson-02";

function json(route: Route, status: number, body: unknown) {
  return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

async function mockSession(page: Page, value: typeof user | null) {
  await page.route("**/api/v1/session", (route) => json(route, 200, { user: value }));
}

async function storedProgress(page: Page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}"), guestKey);
}

async function noHorizontalScroll(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
}

test("completes screens 0–1 through the virtual string at 320 px and resumes after reload", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await mockSession(page, null);
  await page.goto(`${applicationOrigin}/#/lessons/02`);

  await expect(page.getByRole("heading", { name: "Повернімося до відкритого питання" })).toBeVisible();
  await expect(page.getByText("Крок 1 із 5")).toBeVisible();
  await page.getByRole("button", { name: "Немає гітари — відкрити віртуальну струну" }).click();

  await expect(page.getByRole("heading", { name: "Одна струна — два звуки" })).toBeFocused();
  await expect(page.getByRole("figure", { name: "Перша струна у двох станах" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Відкрита перша струна" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Та сама струна, притиснута пальцем між двома металевими поріжками ближче до корпусу" })).toBeVisible();
  const pressed = page.getByRole("button", { name: "Притиснути й смикнути" });
  await expect(pressed).toBeDisabled();
  await expect(page.getByText("Який стан тієї самої струни дав вищий звук", { exact: false })).toHaveCount(0);
  const liveResults = page.getByRole("region", { name: "Віртуальна струна" }).locator('[aria-live="polite"]');
  await expect(liveResults).toHaveCount(1);
  await page.getByRole("button", { name: "Смикнути відкриту" }).click();
  await expect(liveResults).toContainText("Відкрита струна — нижчий результат.");
  await pressed.click();
  await expect(liveResults).toContainText("Притиснута струна — вищий результат.");

  await page.getByRole("radio", { name: "Відкритий" }).check();
  await page.getByRole("button", { name: "Перевірити" }).click();
  expect((await storedProgress(page)).completedStepIds).toEqual(["intro"]);
  await page.getByRole("radio", { name: "Притиснутий ближче до корпусу" }).check();
  await page.getByRole("button", { name: "Перевірити" }).click();
  await expect(page.getByText("На тій самій струні ми отримали два різні за висотою звуки", { exact: false })).toBeVisible();
  expect(await storedProgress(page)).toMatchObject({ currentStepId: "string", completedStepIds: ["intro", "string"] });
  await noHorizontalScroll(page);

  await page.reload();
  await expect(page.getByRole("heading", { name: "Одна струна — два звуки" })).toBeVisible();
  await expect(page.getByText("Який стан тієї самої струни дав вищий звук", { exact: false })).toBeVisible();
});

test("completes the string step on the guitar path with the keyboard only", async ({ page }) => {
  await mockSession(page, null);
  await page.goto(`${applicationOrigin}/#/lessons/02`);

  const start = page.getByRole("button", { name: "Почати з гітарою" });
  await start.focus();
  await start.press("Enter");
  await expect(page.getByRole("heading", { name: "Одна струна — два звуки" })).toBeFocused();
  await expect(page.getByRole("img", { name: "Та сама струна, притиснута пальцем між двома металевими поріжками ближче до корпусу" })).toBeVisible();
  const guitarCard = page.getByRole("region", { name: "На гітарі" });
  await expect(guitarCard.getByText("Не крути кілки", { exact: false })).toBeVisible();
  const done = page.getByRole("button", { name: "Я послухав/ла обидва стани" });
  await done.focus();
  await done.press("Enter");

  const answer = page.getByRole("radio", { name: "Притиснутий ближче до корпусу" });
  await answer.focus();
  await answer.press("Space");
  const check = page.getByRole("button", { name: "Перевірити" });
  await check.focus();
  await check.press("Enter");
  expect((await storedProgress(page)).completedStepIds).toEqual(["intro", "string"]);

  const back = page.getByRole("button", { name: "Назад до вступу" });
  await back.focus();
  await back.press("Enter");
  await expect(page.getByRole("heading", { name: "Повернімося до відкритого питання" })).toBeFocused();
});

test("imports guest Lesson 2 progress into the account without preference fields", async ({ page }) => {
  await page.addInitScript((key) => {
    localStorage.setItem(key, JSON.stringify({
      currentStepId: "string",
      completedStepIds: ["intro", "string"],
      checkpointPassed: false,
      completedAt: null,
      audioEnabled: true,
      prefersStatic: true,
    }));
  }, guestKey);
  await mockSession(page, user);
  const requests: unknown[] = [];
  await page.route("**/api/v1/progress/stage-01-lesson-02", async (route) => {
    if (route.request().method() === "GET") {
      return json(route, 200, { item: {
        lessonId: "stage-01-lesson-02", schemaVersion: 1, contentVersion: 1,
        progress: { currentStepId: "intro", completedStepIds: [], checkpointPassed: false, completedAt: null },
        revision: 2, updatedAt: "2026-09-30T00:00:00.000Z",
      } });
    }
    const request = route.request().postDataJSON();
    requests.push(request);
    return json(route, 200, { item: {
      lessonId: "stage-01-lesson-02", ...request, revision: 3, updatedAt: "2026-09-30T00:00:01.000Z",
    } });
  });

  await page.goto(`${applicationOrigin}/#/lessons/02`);
  await expect(page.getByRole("heading", { name: "Додати прогрес гостя до акаунта?" })).toBeVisible();
  await page.getByRole("button", { name: "Об’єднати прогрес" }).click();
  await expect(page.getByText("Прогрес збережено на цьому пристрої та в акаунті.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Одна струна — два звуки" })).toBeVisible();

  expect(requests.length).toBeGreaterThan(0);
  const last = requests[requests.length - 1] as { schemaVersion: number; baseRevision: number; progress: Record<string, unknown> };
  expect(last).toMatchObject({ schemaVersion: 1, baseRevision: 2, progress: { currentStepId: "string", completedStepIds: ["intro", "string"] } });
  expect(Object.keys(last.progress).sort()).toEqual(["checkpointPassed", "completedAt", "completedStepIds", "currentStepId"]);
});

test("explains unavailable storage and still lets the lesson start", async ({ page }) => {
  await page.addInitScript((key) => {
    const getItem = Storage.prototype.getItem;
    const setItem = Storage.prototype.setItem;
    Storage.prototype.getItem = function (name: string) {
      if (name === key || name === "guitar-mastering:lesson-preferences") throw new DOMException("blocked", "SecurityError");
      return getItem.call(this, name);
    };
    Storage.prototype.setItem = function (name: string, value: string) {
      if (name === key) throw new DOMException("blocked", "SecurityError");
      return setItem.call(this, name, value);
    };
  }, guestKey);
  await mockSession(page, null);
  await page.goto(`${applicationOrigin}/#/lessons/02`);

  await expect(page.getByText("Збереження недоступне — прогрес доступний лише протягом цього сеансу.")).toBeVisible();
  await page.getByRole("button", { name: "Немає гітари — відкрити віртуальну струну" }).click();
  await expect(page.getByRole("heading", { name: "Одна струна — два звуки" })).toBeVisible();
});

test("keeps Lesson 2 unlisted on the home page until the lesson is complete", async ({ page }) => {
  await mockSession(page, null);
  await page.goto(`${applicationOrigin}/#/`);
  await expect(page.getByText("Чому звуки бувають високими й низькими?")).toBeVisible();
  await expect(page.getByRole("link", { name: /Чому звуки бувають високими й низькими/ })).toHaveCount(0);
});
