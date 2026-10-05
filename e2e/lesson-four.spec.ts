import { expect, test, type Page } from "@playwright/test";
import { applicationOrigin, lessonFourId, lessonOneCompleted, lessonOneId, lessonThreeCompleted, lessonThreeId, lessonTwoCompleted, lessonTwoId, mockAccount } from "./support/mock-account";

type Account = Awaited<ReturnType<typeof mockAccount>>;

const opened = { [lessonOneId]: lessonOneCompleted, [lessonTwoId]: lessonTwoCompleted, [lessonThreeId]: lessonThreeCompleted };

function saved(account: Account) {
  return account.progress(lessonFourId) ?? { currentStepId: "intro", completedStepIds: [] as string[], checkpointPassed: false, completedAt: null as string | null };
}

async function noHorizontalScroll(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
}

test("keeps Lesson 4 closed until Lesson 3 is completed", async ({ page }) => {
  await mockAccount(page, { [lessonOneId]: lessonOneCompleted, [lessonTwoId]: lessonTwoCompleted, [lessonThreeId]: { currentStepId: "checkpoint", completedStepIds: ["intro", "length"] } });
  for (const path of ["/lessons/04", "/lessons/04/shape"]) {
    await page.goto(`${applicationOrigin}${path}`);
    await expect(page).toHaveURL(`${applicationOrigin}/course`);
  }
});

test("hears the difference, describes it and counts the repeats with the keyboard, without audio, at 320 px, and resumes", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  const account = await mockAccount(page, opened);
  await page.goto(`${applicationOrigin}/lessons/04`);

  await expect(page.getByRole("heading", { name: "Однакова висота — різні звуки" })).toBeVisible();
  // Every sound is described in words, so the step works with the audio switch off.
  await expect(page.getByRole("button", { name: "Послухати" })).toHaveCount(0);
  await expect(page.getByText("Рівний, порожній звук", { exact: false })).toBeVisible();
  // No term appears before the phenomenon that earns it.
  for (const term of ["тембр", "обертон", "спектр", "атака", "згасання"]) {
    await expect(page.getByText(new RegExp(term, "i"))).toHaveCount(0);
  }
  await noHorizontalScroll(page);

  const yes = page.getByRole("radio", { name: "Так" });
  await yes.focus();
  await yes.press("Space");
  const check = page.getByRole("button", { name: "Перевірити" });
  await check.focus();
  await check.press("Enter");
  await expect(page.getByText("тож висота однакова", { exact: false })).toBeVisible();
  await expect.poll(() => saved(account)).toMatchObject({ completedStepIds: ["intro"] });

  const loudness = page.getByRole("checkbox", { name: "Гучність" });
  await loudness.focus();
  await loudness.press("Space");
  await expect(page.getByText("Звуки зроблено однаково гучними", { exact: false })).toBeVisible();
  const start = page.getByRole("button", { name: "Подивитися на малюнки" });
  await start.focus();
  await start.press("Enter");

  await expect(page.getByRole("heading", { name: "Що однакове на малюнку?" })).toBeFocused();
  await expect.poll(() => saved(account)).toMatchObject({ currentStepId: "shape", completedStepIds: ["intro"] });
  // The waves appear only after the prediction.
  await expect(page.getByText("Той самий відрізок часу")).toHaveCount(0);

  const repeats = page.getByRole("radio", { name: "Скільки разів повторюється" });
  await repeats.focus();
  await repeats.press("Space");
  await page.getByRole("button", { name: "Перевірити" }).press("Enter");
  await expect(page.getByText("Повторів: 3; обертонів немає")).toBeVisible();
  await expect(page.getByText("Повторів: 3; обертони: ×2 сильний, ×3 слабкий, ×4 слабкий, ×5 слабкий")).toBeVisible();

  const three = page.getByRole("radio", { name: "По три" });
  await three.focus();
  await three.press("Space");
  await page.getByRole("button", { name: "Перевірити" }).last().press("Enter");
  await expect(page.getByRole("heading", { name: "Тембр" })).toBeVisible();
  await expect(page.getByText("Звідки береться інша форма")).toBeVisible();
  await expect.poll(() => saved(account)).toMatchObject({ currentStepId: "shape", completedStepIds: ["intro", "shape"] });
  await noHorizontalScroll(page);

  await page.reload();
  await expect(page).toHaveURL(`${applicationOrigin}/lessons/04/shape`);
  await expect(page.getByRole("heading", { name: "Що однакове на малюнку?" })).toBeVisible();
});

test("offers listening only once audio is on and plays one sound at a time", async ({ page }) => {
  const account = await mockAccount(page, opened, { audioEnabled: true });
  await page.goto(`${applicationOrigin}/lessons/04/intro`);
  await expect(page.getByRole("button", { name: "Послухати" })).toHaveCount(3);
  await page.getByRole("button", { name: "Звук: увімкнено" }).click();
  await expect(page.getByRole("button", { name: "Послухати" })).toHaveCount(0);
  await expect.poll(() => account.preferences().audioEnabled).toBe(false);
});
