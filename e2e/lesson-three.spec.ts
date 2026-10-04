import { expect, test, type Page } from "@playwright/test";
import { applicationOrigin, lessonOneCompleted, lessonOneId, lessonThreeId, lessonTwoCompleted, lessonTwoId, mockAccount } from "./support/mock-account";

type Account = Awaited<ReturnType<typeof mockAccount>>;

function saved(account: Account) {
  return account.progress(lessonThreeId) ?? { currentStepId: "intro", completedStepIds: [] as string[], checkpointPassed: false, completedAt: null as string | null };
}

async function noHorizontalScroll(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
}

test("keeps Lesson 3 closed until Lesson 2 is completed", async ({ page }) => {
  await mockAccount(page, { [lessonOneId]: lessonOneCompleted, [lessonTwoId]: { currentStepId: "checkpoint", completedStepIds: ["intro", "string"] } });
  for (const path of ["/lessons/03", "/lessons/03/length"]) {
    await page.goto(`${applicationOrigin}${path}`);
    await expect(page).toHaveURL(`${applicationOrigin}/course`);
  }
});

test("completes intro and the length experiment with the keyboard, without audio, at 320 px, and resumes", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  const account = await mockAccount(page, { [lessonOneId]: lessonOneCompleted, [lessonTwoId]: lessonTwoCompleted });
  await page.goto(`${applicationOrigin}/lessons/03`);

  await expect(page.getByRole("heading", { name: "Повернімося до питання" })).toBeVisible();
  // No factor term appears before its experiment.
  await expect(page.getByText(/(^|[^а-яіїєґ])натяг([^а-яіїєґ]|$)/i)).toHaveCount(0);
  await expect(page.getByText("лінійна густина", { exact: false })).toHaveCount(0);
  const force = page.getByRole("checkbox", { name: "Сила удару" });
  await force.focus();
  await force.press("Space");
  await expect(page.getByText("Сила удару змінює гучність", { exact: false })).toBeVisible();
  const start = page.getByRole("button", { name: "Перевірити дослідом" });
  await start.focus();
  await start.press("Enter");

  await expect(page.getByRole("heading", { name: "Яка частина струни тремтить?" })).toBeFocused();
  await expect.poll(() => saved(account)).toMatchObject({ currentStepId: "length", completedStepIds: ["intro"] });
  await expect(page.getByRole("img", { name: "Притиснута струна: тремтить лише частина від пальця до підставки." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Смикнути струну" })).toHaveCount(0);
  await expect(page.getByRole("radiogroup", { name: "Довжина частини, яка тремтить" })).toHaveCount(0);

  const more = page.getByRole("radio", { name: "Частішими" });
  await more.focus();
  await more.press("Space");
  const check = page.getByRole("button", { name: "Перевірити" });
  await check.focus();
  await check.press("Enter");
  await expect(page.getByText("Прогноз збережено.", { exact: false })).toBeVisible();

  const length = page.getByRole("radiogroup", { name: "Довжина частини, яка тремтить" });
  const tight = page.getByRole("radiogroup", { name: "Наскільки туго натягнута" });
  await expect(tight).toHaveAttribute("aria-disabled", "true");
  await expect(tight.getByText("не змінюємо в цьому досліді")).toBeVisible();
  await expect(page.getByRole("radiogroup", { name: "Скільки важить кожен сантиметр" })).toHaveAttribute("aria-disabled", "true");
  await expect(page.getByText("Частота: 220 Гц")).toBeVisible();
  const table = page.getByRole("table", { name: "Що ми побачили" });
  await expect(table.getByRole("row", { name: "повна довжина 220 Гц" })).toBeVisible();
  await expect(table.getByRole("row", { name: "½ довжини ще не пробували" })).toBeVisible();
  await expect(page.getByText("довжиною частини, що коливається")).toHaveCount(0);

  const full = length.getByRole("radio", { name: "повна довжина" });
  await full.focus();
  await full.press("ArrowDown");
  await expect(length.getByRole("radio", { name: "¾ довжини" })).toBeChecked();
  await expect(page.getByRole("status").filter({ hasText: "293 Гц — частіше, ніж було" })).toBeVisible();
  await expect(page.getByText("довжиною частини, що коливається")).toBeVisible();
  await expect.poll(() => saved(account).completedStepIds).toEqual(["intro", "length"]);
  await page.keyboard.press("ArrowDown");
  await expect(page.getByText("Частота: 440 Гц")).toBeVisible();
  await expect(table.getByRole("row", { name: "½ довжини 440 Гц" })).toBeVisible();
  await noHorizontalScroll(page);

  await page.reload();
  await expect(page.getByRole("heading", { name: "Яка частина струни тремтить?" })).toBeVisible();
  await expect(page.getByText("довжиною частини, що коливається")).toBeVisible();
});
