import { expect, test, type Page, type Route } from "@playwright/test";

const railway = "http://127.0.0.1:4173";
const pages = "http://127.0.0.1:4174/guitar-mastering/";
const profile = { firstName: null, lastName: null, avatarId: null };
const user = { id: "user-1", username: "Player.One", profile };

function json(route: Route, status: number, body: unknown) {
  return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

async function mockSession(page: Page, value: typeof user | null) {
  await page.route("**/api/v1/session", (route) => json(route, 200, { user: value }));
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

  await page.goto(`${railway}/#/account`);
  await expect(page.getByRole("heading", { name: "Профіль @Player.One" })).toBeVisible();
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
  await page.route("**/api/v1/auth/register", (route) => json(route, 201, { user }));
  await page.route("**/api/v1/auth/logout", (route) => route.fulfill({ status: 204 }));
  await page.route("**/api/v1/auth/login", (route) => json(route, 200, { user }));

  await page.goto(`${railway}/#/account`);
  await page.getByRole("button", { name: "Реєстрація" }).click();
  await page.getByLabel("Ім’я користувача").fill("Player.One");
  await page.getByLabel("Пароль").fill("correct horse guitar");
  await page.getByRole("button", { name: "Створити акаунт" }).click();
  await expect(page.getByRole("heading", { name: "Профіль @Player.One" })).toBeVisible();
  await page.getByRole("button", { name: "Вийти" }).click();
  await page.getByRole("button", { name: "Увійти", exact: true }).click();
  await page.getByLabel("Ім’я користувача").fill("Player.One");
  await page.getByLabel("Пароль").fill("correct horse guitar");
  await page.locator("form").getByRole("button", { name: "Увійти", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Профіль @Player.One" })).toBeVisible();
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

  await page.goto(`${railway}/#/account`);
  await page.getByRole("button", { name: "Видалити акаунт" }).click();
  const confirm = page.getByRole("button", { name: "Підтвердити видалення" });
  await expect(confirm).toBeDisabled();
  await page.getByLabel("Поточний пароль").fill("wrong horse guitar");
  await page.getByRole("checkbox").check();
  await confirm.click();
  await expect(page.getByRole("alert")).toContainText("Невірний пароль");
  await page.getByLabel("Поточний пароль").fill("correct horse guitar");
  await confirm.click();
  await expect(page.getByRole("button", { name: "Реєстрація" })).toBeVisible();
});

test("distinguishes API outage from guest state while lesson access continues", async ({ page }) => {
  await page.route("**/api/v1/session", (route) => route.abort("connectionfailed"));
  await page.goto(`${railway}/#/account`);
  await expect(page.getByText("Сервер тимчасово недоступний")).toBeVisible();
  await page.goto(`${railway}/#/lessons/01`);
  await expect(page.getByText("Що таке звук?", { exact: false }).first()).toBeVisible();
});

test("shows account entry only in the Railway target", async ({ page }) => {
  await mockSession(page, null);
  await page.goto(`${railway}/#/`);
  await expect(page.getByRole("link", { name: "Увійти" })).toBeVisible();
  await page.goto(`${pages}#/account`);
  await expect(page).toHaveURL(/#\/$/);
  await expect(page.getByRole("link", { name: "Увійти" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /Музика/ })).toBeVisible();
});

test("confirms guest progress import, merges it, and reports account sync", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.addInitScript(() => {
    localStorage.setItem("guitar-mastering:stage-01-lesson-01", JSON.stringify({
      currentStepId: "air",
      completedStepIds: ["intro", "string"],
      checkpointPassed: false,
      audioEnabled: true,
      prefersStatic: false,
    }));
  });
  await mockSession(page, user);
  await page.route("**/api/v1/progress/stage-01-lesson-01", async (route) => {
    if (route.request().method() === "GET") {
      return json(route, 200, { item: {
        lessonId: "stage-01-lesson-01", schemaVersion: 1, contentVersion: 1,
        progress: { currentStepId: "string", completedStepIds: ["intro"], checkpointPassed: false, completedAt: null },
        revision: 4, updatedAt: "2026-09-16T00:00:00.000Z",
      } });
    }
    const request = route.request().postDataJSON();
    expect(request).toMatchObject({
      baseRevision: 4,
      progress: { currentStepId: "air", completedStepIds: ["intro", "string"] },
    });
    expect(request.progress).not.toHaveProperty("audioEnabled");
    return json(route, 200, { item: {
      lessonId: "stage-01-lesson-01", ...request, revision: 5, updatedAt: "2026-09-16T00:00:01.000Z",
    } });
  });

  await page.goto(`${railway}/#/lessons/01`);
  await expect(page.getByRole("heading", { name: "Додати прогрес гостя до акаунта?" })).toBeVisible();
  const mergeButton = page.getByRole("button", { name: "Об’єднати прогрес" });
  await mergeButton.focus();
  await mergeButton.press("Enter");
  await expect(page.getByText("Прогрес збережено на цьому пристрої та в акаунті.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Як рух доходить до вуха?" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("merges an optimistic conflict before retrying queued Lesson 1 progress", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("guitar-mastering:user:user-1:stage-01-lesson-01", JSON.stringify({
      currentStepId: "air",
      completedStepIds: ["intro", "string"],
      checkpointPassed: false,
      completedAt: null,
    }));
  });
  await mockSession(page, user);
  let writes = 0;
  await page.route("**/api/v1/progress/stage-01-lesson-01", async (route) => {
    if (route.request().method() === "GET") {
      return json(route, 200, { item: {
        lessonId: "stage-01-lesson-01", schemaVersion: 1, contentVersion: 1,
        progress: { currentStepId: "string", completedStepIds: ["intro"], checkpointPassed: false, completedAt: null },
        revision: 1, updatedAt: "2026-09-16T00:00:00.000Z",
      } });
    }
    writes += 1;
    const request = route.request().postDataJSON();
    if (writes === 1) {
      expect(request.baseRevision).toBe(1);
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
    expect(request).toMatchObject({
      baseRevision: 2,
      progress: { currentStepId: "checkpoint", completedStepIds: ["intro", "string", "air"] },
    });
    return json(route, 200, { item: {
      lessonId: "stage-01-lesson-01", ...request, revision: 3, updatedAt: "2026-09-16T00:00:02.000Z",
    } });
  });

  await page.goto(`${railway}/#/lessons/01`);
  await expect(page.getByText("Прогрес збережено на цьому пристрої та в акаунті.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Збери шлях звуку" })).toBeVisible();
  expect(writes).toBe(2);
});

test("preserves completed guest progress offline when preference storage is corrupt", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.addInitScript(() => {
    localStorage.setItem("guitar-mastering:stage-01-lesson-01", JSON.stringify({
      currentStepId: "complete",
      completedStepIds: ["intro", "string", "air", "checkpoint", "complete"],
      checkpointPassed: true,
      completedAt: "2026-09-16T12:00:00.000Z",
      audioEnabled: true,
      prefersStatic: false,
    }));
    localStorage.setItem("guitar-mastering:lesson-preferences", "{broken");
  });
  await page.route("**/api/v1/session", (route) => route.abort("connectionfailed"));

  await page.goto(`${railway}/#/lessons/01`);
  await expect(page.getByRole("heading", { name: "Урок завершено" })).toBeVisible();
  await page.getByRole("button", { name: "Показувати покадрово" }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("guitar-mastering:stage-01-lesson-01") ?? "{}"))).toMatchObject({
    currentStepId: "complete",
    completedAt: "2026-09-16T12:00:00.000Z",
    prefersStatic: true,
  });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Урок завершено" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("shows pending and error states and retries the latest local account progress", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await mockSession(page, user);
  let releaseFirstSave!: () => void;
  const firstSave = new Promise<void>((resolve) => { releaseFirstSave = resolve; });
  let writes = 0;
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

  await page.goto(`${railway}/#/lessons/01`);
  await expect(page.getByText("Прогрес збережено на цьому пристрої та в акаунті.")).toBeVisible();
  await page.getByRole("button", { name: "Почати дослід" }).click();
  await expect(page.getByText("Збережено на цьому пристрої. Синхронізуємо з акаунтом…")).toBeVisible();
  releaseFirstSave();
  const retry = page.getByRole("button", { name: "Повторити синхронізацію" });
  await expect(retry).toBeVisible();
  await retry.focus();
  await retry.press("Enter");
  await expect(page.getByText("Прогрес збережено на цьому пристрої та в акаунті.")).toBeVisible();
  expect(writes).toBe(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("clears only the confirmed current-user cache and isolates guest and later accounts", async ({ page }) => {
  const secondUser = { ...user, id: "user-2", username: "Player.Two" };
  let currentUser: typeof user | null = user;
  const guestProgress = { currentStepId: "string", completedStepIds: ["intro"], checkpointPassed: false, completedAt: null };
  const firstProgress = { currentStepId: "air", completedStepIds: ["intro", "string"], checkpointPassed: false, completedAt: null };
  const secondProgress = { currentStepId: "complete", completedStepIds: ["intro", "string", "air", "checkpoint", "complete"], checkpointPassed: true, completedAt: "2026-09-16T12:00:00.000Z" };
  await page.addInitScript(({ guest, first, second }) => {
    localStorage.setItem("guitar-mastering:stage-01-lesson-01", JSON.stringify(guest));
    localStorage.setItem("guitar-mastering:user:user-1:stage-01-lesson-01", JSON.stringify(first));
    localStorage.setItem("guitar-mastering:user:user-2:stage-01-lesson-01", JSON.stringify(second));
    const fingerprint = JSON.stringify(guest);
    localStorage.setItem("guitar-mastering:user:user-1:stage-01-lesson-01:guest-import", fingerprint);
    localStorage.setItem("guitar-mastering:user:user-2:stage-01-lesson-01:guest-import", fingerprint);
  }, { guest: guestProgress, first: firstProgress, second: secondProgress });
  await page.route("**/api/v1/session", (route) => json(route, 200, { user: currentUser }));
  await page.route("**/api/v1/auth/logout", (route) => { currentUser = null; return route.fulfill({ status: 204 }); });
  await page.route("**/api/v1/auth/login", (route) => { currentUser = secondUser; return json(route, 200, { user: secondUser }); });
  await page.route("**/api/v1/progress/stage-01-lesson-01", (route) => {
    const progress = currentUser?.id === "user-2" ? secondProgress : firstProgress;
    return json(route, 200, { item: {
      lessonId: "stage-01-lesson-01", schemaVersion: 1, contentVersion: 1,
      progress, revision: 1, updatedAt: "2026-09-16T00:00:00.000Z",
    } });
  });

  await page.goto(`${railway}/#/lessons/01`);
  await expect(page.getByRole("heading", { name: "Як рух доходить до вуха?" })).toBeVisible();
  await page.getByRole("button", { name: "Очистити локальну копію" }).click();
  await expect(page.getByText("Очистити локальну копію прогресу цього акаунта?")).toBeVisible();
  await page.getByRole("button", { name: "Підтвердити очищення" }).click();
  await expect(page.getByRole("status")).toContainText("Локальну копію цього акаунта видалено");
  expect(await page.evaluate(() => ({
    first: localStorage.getItem("guitar-mastering:user:user-1:stage-01-lesson-01"),
    firstDecision: localStorage.getItem("guitar-mastering:user:user-1:stage-01-lesson-01:guest-import"),
    guest: localStorage.getItem("guitar-mastering:stage-01-lesson-01"),
    second: localStorage.getItem("guitar-mastering:user:user-2:stage-01-lesson-01"),
  }))).toMatchObject({ first: null, firstDecision: null, guest: expect.any(String), second: expect.any(String) });

  await page.goto(`${railway}/#/account`);
  await page.getByRole("button", { name: "Вийти" }).click();
  await page.goto(`${railway}/#/lessons/01`);
  await expect(page.getByRole("heading", { name: "Зустріч зі струною" })).toBeVisible();
  await page.goto(`${railway}/#/account`);
  await page.getByLabel("Ім’я користувача").fill("Player.Two");
  await page.getByLabel("Пароль").fill("correct horse guitar");
  await page.locator("form").getByRole("button", { name: "Увійти", exact: true }).click();
  await page.goto(`${railway}/#/lessons/01`);
  await expect(page.getByRole("heading", { name: "Урок завершено" })).toBeVisible();
});
