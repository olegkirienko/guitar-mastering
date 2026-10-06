import { expect, test, type Page, type Route } from "@playwright/test";

const applicationOrigin = "http://127.0.0.1:4173";
const profile = { firstName: null, lastName: null, avatarId: null };
const preferences = { audioEnabled: false, prefersStatic: false, theme: "system" as "system" | "light" | "dark" };
const user = { id: "user-1", username: "Player.One", profile, preferences };

function json(route: Route, status: number, body: unknown) {
  return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

async function mockSession(page: Page, value: typeof user | null) {
  await page.route("**/api/v1/session", (route) => json(route, 200, { user: value }));
}

// The course list behind the lesson gate; Lesson 1 needs no earlier lesson.
async function mockCourseList(page: Page) {
  await page.route("**/api/v1/progress", (route) => json(route, 200, { items: [] }));
}

test("restores an authenticated session and updates profile and avatar accessibly at 320 px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await mockSession(page, user);
  let rejectProfile = true;
  await page.route("**/api/v1/profile", async (route) => {
    if (rejectProfile) {
      rejectProfile = false;
      return json(route, 422, { error: { code: "INVALID_FIELDS", message: "Перевір поля.", fields: { avatarId: "Обери доступний аватар." } } });
    }
    const submitted = route.request().postDataJSON();
    return json(route, 200, { profile: submitted });
  });

  await page.goto(`${applicationOrigin}/account`);
  await expect(page.getByRole("heading", { name: "Профіль @Player.One" })).toBeVisible();
  // Below `sm` the name is hidden, but the chevron stays so the avatar still reads as a menu.
  const accountTrigger = page.getByRole("button", { name: "Меню акаунта @Player.One" });
  await expect(accountTrigger.getByText("@Player.One")).toBeHidden();
  await expect(accountTrigger.locator("svg")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Приватність і резервні копії" })).toBeVisible();
  const cedarAvatar = page.getByRole("radio", { name: "Кедр" });
  const oceanAvatar = page.getByRole("radio", { name: "Океан" });
  await cedarAvatar.focus();
  await expect(page.getByText("Кедр").locator("..")).toHaveCSS("box-shadow", /rgb/);
  await cedarAvatar.press("ArrowRight");
  await expect(oceanAvatar).toBeFocused();
  await expect(oceanAvatar).toBeChecked();
  await page.getByLabel("Ім’я (необов’язково)").fill("Леся");
  await page.getByRole("button", { name: "Зберегти профіль" }).click();
  const fieldset = page.getByRole("group", { name: "Аватар застосунку" });
  await expect(fieldset).toHaveAttribute("aria-describedby", "avatar-error");
  await expect(page.locator("#avatar-error")).toHaveText("Обери доступний аватар.");
  await page.getByRole("button", { name: "Зберегти профіль" }).click();
  await expect(page.getByRole("status")).toHaveText("Профіль збережено.");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("supports guest registration, logout, and login", async ({ page }) => {
  await mockSession(page, null);
  await mockCourseList(page);
  await page.route("**/api/v1/progress/stage-01-lesson-01", (route) => json(route, 404, { error: { code: "PROGRESS_NOT_FOUND", message: "Немає." } }));
  await page.route("**/api/v1/auth/register", (route) => json(route, 201, { user }));
  await page.route("**/api/v1/auth/logout", (route) => route.fulfill({ status: 204 }));
  await page.route("**/api/v1/auth/login", (route) => json(route, 200, { user }));

  await page.goto(`${applicationOrigin}/account`);
  await expect(page).toHaveURL(`${applicationOrigin}/auth?next=%2Faccount`);
  await page.getByRole("button", { name: "Реєстрація" }).click();
  await page.getByLabel("Ім’я користувача").fill("Player.One");
  await page.getByLabel("Пароль").fill("correct horse guitar");
  await page.getByRole("button", { name: "Створити акаунт" }).click();
  // Registration always starts Lesson 1, even with a `next`.
  await expect(page).toHaveURL(`${applicationOrigin}/lessons/01/intro`);
  await expect(page.getByRole("heading", { name: "Почнімо з досліду" })).toBeVisible();

  // The header account menu opens the account page and signs out.
  const accountMenu = page.getByRole("button", { name: "Меню акаунта @Player.One" });
  // The trigger reads as a menu: it carries the name and reports whether it is open.
  await expect(accountMenu).toContainText("Player.One");
  await expect(accountMenu).toHaveAttribute("aria-expanded", "false");
  await accountMenu.click();
  await expect(accountMenu).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("menuitem", { name: "Акаунт" }).click();
  await expect(page).toHaveURL(`${applicationOrigin}/account`);
  await accountMenu.press("Enter");
  await page.getByRole("menuitem", { name: "Вийти" }).press("Enter");
  await expect(page).toHaveURL(`${applicationOrigin}/`);
  await page.getByRole("link", { name: "Увійти" }).click();
  await page.getByLabel("Ім’я користувача").fill("Player.One");
  await page.getByLabel("Пароль").fill("correct horse guitar");
  await page.locator("form").getByRole("button", { name: "Увійти", exact: true }).click();
  await expect(page).toHaveURL(`${applicationOrigin}/lessons/01/intro`);
});

test("requires confirmed deletion and keeps failure recoverable", async ({ page }) => {
  await mockSession(page, user);
  let failDelete = true;
  await page.route("**/api/v1/account", (route) => {
    if (failDelete) {
      failDelete = false;
      return json(route, 401, { error: { code: "INVALID_CREDENTIALS", message: "Невірний пароль." } });
    }
    return route.fulfill({ status: 204 });
  });

  await page.goto(`${applicationOrigin}/account`);
  await page.getByRole("button", { name: "Видалити акаунт" }).click();
  const confirm = page.getByRole("button", { name: "Підтвердити видалення" });
  await expect(confirm).toBeDisabled();
  await page.getByLabel("Поточний пароль").fill("wrong horse guitar");
  await page.getByText("Я розумію, що цю дію не можна скасувати.").click();
  await expect(page.getByRole("checkbox")).toBeChecked();
  await confirm.click();
  await expect(page.getByRole("alert")).toContainText("Невірний пароль");
  await page.getByLabel("Поточний пароль").fill("correct horse guitar");
  await confirm.click();
  await expect(page.getByRole("button", { name: "Реєстрація" })).toBeVisible();
});

test("distinguishes API outage from guest state and keeps lessons closed", async ({ page }) => {
  await page.route("**/api/v1/session", (route) => route.abort("connectionfailed"));
  await page.goto(`${applicationOrigin}/account`);
  await expect(page.getByText("Сервер тимчасово недоступний")).toBeVisible();
  await page.goto(`${applicationOrigin}/lessons/01`);
  await expect(page.getByText("Сервер тимчасово недоступний")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Почнімо з досліду" })).toHaveCount(0);
});

test("shows the account entry on the application origin", async ({ page }) => {
  await mockSession(page, null);
  await page.goto(`${applicationOrigin}/`);
  await expect(page.getByRole("link", { name: "Увійти" })).toBeVisible();
});

test("ignores legacy local copies and opens the lesson from server progress only", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  // Copies left by older releases: a guest copy at a later step, an account cache, and preferences.
  await page.addInitScript(() => {
    if (sessionStorage.getItem("seeded")) return;
    sessionStorage.setItem("seeded", "1");
    localStorage.setItem("guitar-mastering:stage-01-lesson-01", JSON.stringify({ currentStepId: "air", completedStepIds: ["intro", "string"], checkpointPassed: false, audioEnabled: true }));
    localStorage.setItem("guitar-mastering:user:user-1:stage-01-lesson-01", JSON.stringify({ currentStepId: "air", completedStepIds: ["intro", "string"], checkpointPassed: false, completedAt: null }));
    localStorage.setItem("guitar-mastering:lesson-preferences", JSON.stringify({ audioEnabled: true, prefersStatic: true }));
  });
  await mockSession(page, user);
  await mockCourseList(page);
  let writes = 0;
  await page.route("**/api/v1/progress/stage-01-lesson-01", async (route) => {
    if (route.request().method() === "GET") {
      return json(route, 200, { item: {
        lessonId: "stage-01-lesson-01", schemaVersion: 1, contentVersion: 1,
        progress: { currentStepId: "string", completedStepIds: ["intro"], checkpointPassed: false, completedAt: null },
        revision: 4, updatedAt: "2026-09-16T00:00:00.000Z",
      } });
    }
    writes += 1;
    return json(route, 500, { error: { code: "UNEXPECTED", message: "No write expected." } });
  });

  await page.goto(`${applicationOrigin}/lessons/01`);
  await expect(page).toHaveURL(`${applicationOrigin}/lessons/01/string`);
  await expect(page.getByRole("heading", { name: "Зустріч зі струною" })).toBeVisible();
  await expect(page.getByText("Прогрес зберігається в акаунті.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Показувати покадрово" })).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByRole("button", { name: "Дослідити рух у повітрі" })).toHaveCount(0);
  expect(writes).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("merges an optimistic conflict before retrying a step open", async ({ page }) => {
  await mockSession(page, user);
  let writes = 0;
  await mockCourseList(page);
  await page.route("**/api/v1/progress/stage-01-lesson-01", async (route) => {
    if (route.request().method() === "GET") {
      return json(route, 200, { item: {
        lessonId: "stage-01-lesson-01", schemaVersion: 1, contentVersion: 1,
        progress: { currentStepId: "air", completedStepIds: ["intro", "string"], checkpointPassed: false, completedAt: null },
        revision: 1, updatedAt: "2026-09-16T00:00:00.000Z",
      } });
    }
    writes += 1;
    const request = route.request().postDataJSON();
    if (writes === 1) {
      expect(request).toMatchObject({ baseRevision: 1, progress: { currentStepId: "string" } });
      return json(route, 409, { error: {
        code: "REVISION_CONFLICT",
        message: "Progress changed on another device.",
        current: {
          lessonId: "stage-01-lesson-01", schemaVersion: 1, contentVersion: 1,
          progress: { currentStepId: "checkpoint", completedStepIds: ["intro", "string", "air"], checkpointPassed: false, completedAt: null },
          revision: 2, updatedAt: "2026-09-16T00:00:01.000Z",
        },
      } });
    }
    // Reach is merged from both copies; the opened step is the latest action and wins.
    expect(request).toMatchObject({
      baseRevision: 2,
      progress: { currentStepId: "string", completedStepIds: ["intro", "string", "air"] },
    });
    return json(route, 200, { item: {
      lessonId: "stage-01-lesson-01", ...request, revision: 3, updatedAt: "2026-09-16T00:00:02.000Z",
    } });
  });

  await page.goto(`${applicationOrigin}/lessons/01/string`);
  await expect(page.getByRole("heading", { name: "Зустріч зі струною" })).toBeVisible();
  await expect.poll(() => writes).toBe(2);
  await expect(page.getByText("Прогрес зберігається в акаунті.")).toBeVisible();
});

test("shows pending and error states and retries the latest unsaved progress", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await mockSession(page, user);
  let releaseFirstSave!: () => void;
  const firstSave = new Promise<void>((resolve) => { releaseFirstSave = resolve; });
  let writes = 0;
  await mockCourseList(page);
  await page.route("**/api/v1/progress/stage-01-lesson-01", async (route) => {
    if (route.request().method() === "GET") {
      return json(route, 200, { item: {
        lessonId: "stage-01-lesson-01", schemaVersion: 1, contentVersion: 1,
        progress: { currentStepId: "intro", completedStepIds: [], checkpointPassed: false, completedAt: null },
        revision: 1, updatedAt: "2026-09-16T00:00:00.000Z",
      } });
    }
    writes += 1;
    if (writes === 1) {
      await firstSave;
      return route.abort("connectionfailed");
    }
    const request = route.request().postDataJSON();
    expect(request).toMatchObject({ baseRevision: 1, progress: { currentStepId: "string", completedStepIds: ["intro"] } });
    return json(route, 200, { item: {
      lessonId: "stage-01-lesson-01", ...request, revision: 2, updatedAt: "2026-09-16T00:00:01.000Z",
    } });
  });

  await page.goto(`${applicationOrigin}/lessons/01`);
  await expect(page.getByText("Прогрес зберігається в акаунті.")).toBeVisible();
  await page.getByRole("button", { name: "Почати дослід" }).click();
  await expect(page.getByText("Зберігаємо прогрес в акаунті…")).toBeVisible();
  releaseFirstSave();
  await expect(page.getByText("Прогрес ще не збережено.", { exact: false })).toBeVisible();
  // The lesson stays usable in memory while the save is pending a retry.
  await expect(page.getByRole("heading", { name: "Зустріч зі струною" })).toBeVisible();
  const retry = page.getByRole("button", { name: "Спробувати зберегти ще раз" });
  await retry.focus();
  await retry.press("Enter");
  await expect(page.getByText("Прогрес зберігається в акаунті.")).toBeVisible();
  expect(writes).toBe(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("shows the unavailable screen when lesson progress cannot load and retries it", async ({ page }) => {
  await mockSession(page, user);
  await mockCourseList(page);
  let failing = true;
  await page.route("**/api/v1/progress/stage-01-lesson-01", (route) => {
    if (failing) return json(route, 500, { error: { code: "INTERNAL_ERROR", message: "Помилка." } });
    return json(route, 404, { error: { code: "PROGRESS_NOT_FOUND", message: "Прогрес не знайдено." } });
  });

  await page.goto(`${applicationOrigin}/lessons/01/intro`);
  await expect(page.getByRole("heading", { name: "Сервер тимчасово недоступний" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Почнімо з досліду" })).toHaveCount(0);
  failing = false;
  await page.getByRole("button", { name: "Спробувати знову" }).click();
  await expect(page.getByRole("heading", { name: "Почнімо з досліду" })).toBeVisible();
});

test("saves lesson preferences on the account, and reverts and announces a failed save", async ({ page }) => {
  await mockSession(page, { ...user, preferences: { audioEnabled: false, prefersStatic: true, theme: "system" } });
  await mockCourseList(page);
  await page.route("**/api/v1/progress/stage-01-lesson-01", (route) => json(route, 404, { error: { code: "PROGRESS_NOT_FOUND", message: "Прогрес не знайдено." } }));
  const saved: unknown[] = [];
  let reject = false;
  await page.route("**/api/v1/preferences", (route) => {
    saved.push(route.request().postDataJSON());
    if (reject) return json(route, 500, { error: { code: "INTERNAL_ERROR", message: "Помилка." } });
    return json(route, 200, { preferences: route.request().postDataJSON() });
  });

  await page.goto(`${applicationOrigin}/lessons/01/intro`);
  const motion = page.getByRole("button", { name: "Показувати рух" });
  await expect(motion).toHaveAttribute("aria-pressed", "true");
  await motion.click();
  await expect(page.getByRole("button", { name: "Показувати покадрово" })).toHaveAttribute("aria-pressed", "false");
  expect(saved).toEqual([{ audioEnabled: false, prefersStatic: false, theme: "system" }]);

  // The audio preference is offered where the sound happens, so the string step carries the switch.
  await page.getByRole("button", { name: "Почати дослід" }).click();
  const audio = page.getByRole("button", { name: "Увімкнути звук" });
  await expect(audio).toHaveAttribute("aria-pressed", "false");

  const notice = page.getByText("Не вдалося зберегти налаштування, тому повернули попереднє. Спробуй ще раз.");
  await expect(notice).toHaveCount(0);
  reject = true;
  await audio.click();
  await expect(notice).toBeVisible();
  await expect(audio).toHaveAttribute("aria-pressed", "false");
  expect(saved).toEqual([{ audioEnabled: false, prefersStatic: false, theme: "system" }, { audioEnabled: true, prefersStatic: false, theme: "system" }]);

  // The next accepted change clears the notice.
  reject = false;
  await audio.click();
  await expect(page.getByRole("button", { name: "Вимкнути звук" })).toHaveAttribute("aria-pressed", "true");
  await expect(notice).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
});

test("shows only the signed-in account's server progress after switching accounts", async ({ page }) => {
  const secondUser = { ...user, id: "user-2", username: "Player.Two" };
  let currentUser: typeof user | null = user;
  const firstProgress = { currentStepId: "air", completedStepIds: ["intro", "string"], checkpointPassed: false, completedAt: null };
  const secondProgress = { currentStepId: "complete", completedStepIds: ["intro", "string", "air", "checkpoint", "complete"], checkpointPassed: true, completedAt: "2026-09-16T12:00:00.000Z" };
  await page.route("**/api/v1/session", (route) => json(route, 200, { user: currentUser }));
  await page.route("**/api/v1/auth/logout", (route) => { currentUser = null; return route.fulfill({ status: 204 }); });
  await page.route("**/api/v1/auth/login", (route) => { currentUser = secondUser; return json(route, 200, { user: secondUser }); });
  await mockCourseList(page);
  await page.route("**/api/v1/progress/stage-01-lesson-01", (route) => {
    const progress = currentUser?.id === "user-2" ? secondProgress : firstProgress;
    return json(route, 200, { item: {
      lessonId: "stage-01-lesson-01", schemaVersion: 1, contentVersion: 1,
      progress, revision: 1, updatedAt: "2026-09-16T00:00:00.000Z",
    } });
  });

  await page.goto(`${applicationOrigin}/lessons/01`);
  await expect(page.getByRole("heading", { name: "Як рух доходить до вуха?" })).toBeVisible();

  await page.goto(`${applicationOrigin}/account`);
  await page.getByRole("button", { name: "Вийти" }).click();
  await expect(page).toHaveURL(`${applicationOrigin}/`);
  await page.goto(`${applicationOrigin}/lessons/01`);
  await expect(page).toHaveURL(`${applicationOrigin}/auth?next=%2Flessons%2F01`);
  await expect(page.getByRole("heading", { name: "Зустріч зі струною" })).toHaveCount(0);
  await page.getByLabel("Ім’я користувача").fill("Player.Two");
  await page.getByLabel("Пароль").fill("correct horse guitar");
  await page.locator("form").getByRole("button", { name: "Увійти", exact: true }).click();
  await expect(page).toHaveURL(/\/lessons\/01\/complete$/);
  await expect(page.getByRole("heading", { name: "Урок завершено" })).toBeVisible();
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
});
