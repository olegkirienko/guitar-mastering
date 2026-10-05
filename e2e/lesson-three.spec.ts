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

async function press(page: Page, name: string, role: "button" | "radio" = "button") {
  const control = page.getByRole(role, { name, exact: true });
  await control.focus();
  await control.press(role === "radio" ? "Space" : "Enter");
}

test("tension and density change one factor each and name it only after the experiment", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  const account = await mockAccount(page, { [lessonOneId]: lessonOneCompleted, [lessonTwoId]: lessonTwoCompleted, [lessonThreeId]: { currentStepId: "length", completedStepIds: ["intro", "length"] } });
  await page.goto(`${applicationOrigin}/lessons/03/length`);
  await press(page, "Далі: наскільки туго?");

  await expect(page.getByRole("heading", { name: "Наскільки туго?" })).toBeFocused();
  await expect(page.getByRole("region", { name: "Дві однакові струни, одну тягнуть сильніше" })).toBeVisible();
  await expect(page.getByText(/(^|[^а-яіїєґ])натяг(ом)?([^а-яіїєґ]|$)/i)).toHaveCount(0);
  await expect(page.getByRole("radiogroup", { name: "Наскільки туго натягнута" })).toHaveCount(0);
  await press(page, "Вона коротша", "radio");
  await press(page, "Перевірити");
  await expect(page.getByText("обидві струни однакової довжини", { exact: false })).toBeVisible();
  await expect(page.getByText("кілки", { exact: false }).first()).toBeVisible();

  await press(page, "Частішими", "radio");
  await page.getByRole("button", { name: "Перевірити" }).nth(1).press("Enter");
  const tight = page.getByRole("radiogroup", { name: "Наскільки туго натягнута" });
  await expect(tight).not.toHaveAttribute("aria-disabled", "true");
  await expect(page.getByRole("radiogroup", { name: "Довжина частини, яка тремтить" })).toHaveAttribute("aria-disabled", "true");
  await expect(page.getByRole("radiogroup", { name: "Скільки важить кожен сантиметр" })).toHaveAttribute("aria-disabled", "true");
  await expect(page.getByText("натягом")).toHaveCount(0);
  const normal = tight.getByRole("radio", { name: "звичайно" });
  await normal.focus();
  await normal.press("ArrowDown");
  await expect(page.getByRole("status").filter({ hasText: "330 Гц — частіше, ніж було" })).toBeVisible();
  await expect(page.getByText("натягом")).toBeVisible();
  await expect.poll(() => saved(account).completedStepIds).toEqual(["intro", "length", "tension"]);
  await noHorizontalScroll(page);
  await press(page, "Далі: товста чи важка?");

  await expect(page.getByRole("heading", { name: "Товста чи важка?" })).toBeFocused();
  await expect(page.getByText("лінійн", { exact: false })).toHaveCount(0);
  await expect(page.getByText("Чесне порівняння")).toHaveCount(0);
  await press(page, "Так", "radio");
  await press(page, "Перевірити");
  await expect(page.getByText("Відрізняється більше ніж одне", { exact: false })).toBeVisible();
  await expect(page.getByRole("region", { name: "Чесне порівняння" })).toBeVisible();

  await press(page, "Легша", "radio");
  await page.getByRole("button", { name: "Перевірити" }).nth(1).press("Enter");
  const weight = page.getByRole("radiogroup", { name: "Скільки важить кожен сантиметр" });
  await expect(page.getByRole("radiogroup", { name: "Довжина частини, яка тремтить" })).toHaveAttribute("aria-disabled", "true");
  await expect(tight).toHaveAttribute("aria-disabled", "true");
  await expect(page.getByText("лінійною густиною")).toHaveCount(0);
  const light = weight.getByRole("radio", { name: "легка" });
  await light.focus();
  await light.press("ArrowDown");
  await expect(page.getByRole("status").filter({ hasText: "147 Гц — рідше, ніж було" })).toBeVisible();
  await expect(page.getByText("лінійною густиною")).toBeVisible();
  await expect.poll(() => saved(account).completedStepIds).toEqual(["intro", "length", "tension", "density"]);
  await noHorizontalScroll(page);
});

test("model lab tests two combined predictions, highlights the last rule, and keeps the formula optional", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  const account = await mockAccount(page, { [lessonOneId]: lessonOneCompleted, [lessonTwoId]: lessonTwoCompleted, [lessonThreeId]: { currentStepId: "density", completedStepIds: ["intro", "length", "tension", "density"] } });
  await page.goto(`${applicationOrigin}/lessons/03/density`);
  await press(page, "Далі: три ручки разом");

  await expect(page.getByRole("heading", { name: "Три ручки однієї струни" })).toBeFocused();
  await expect(page.getByText("f = (1 / 2L) × √(T / μ)")).toBeHidden();
  const [first, second] = [page.getByRole("listitem").filter({ hasText: "Почни з початкової струни" }), page.getByRole("listitem").filter({ hasText: "Знову від початкової струни" })];
  const choose = async (item: typeof first, answer: string) => {
    const radio = item.getByRole("radio", { name: answer, exact: true });
    await radio.focus();
    await radio.press("Space");
    await item.getByRole("button", { name: "Перевірити" }).press("Enter");
  };
  const step = async (group: string, from: string, times: number) => {
    const radio = page.getByRole("radiogroup", { name: group }).getByRole("radio", { name: from, exact: true });
    await radio.focus();
    for (let index = 0; index < times; index += 1) await page.keyboard.press("ArrowDown");
  };

  await choose(first, "Вищим");
  await expect(first.getByText("Встанови в лабораторії", { exact: false })).toBeVisible();
  await step("Довжина частини, що коливається", "повна довжина", 2);
  await step("Натяг", "звичайно", 2);
  await expect(page.getByRole("status").filter({ hasText: "880 Гц — частіше, ніж було" })).toBeVisible();
  await expect(first.getByText("Перевірено: 880 Гц", { exact: false })).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: "щойно змінено" })).toContainText("Більший натяг");
  expect(saved(account).completedStepIds).not.toContain("model");

  await choose(second, "Не зміниться");
  await press(page, "Скинути");
  await expect(page.getByRole("status").filter({ hasText: "220 Гц — початкова струна" })).toBeVisible();
  await step("Натяг", "звичайно", 2);
  await step("Лінійна густина (вага сантиметра)", "легка", 2);
  await expect(page.getByRole("status").filter({ hasText: "220 Гц — рідше, ніж було" })).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: "щойно змінено" })).toContainText("Більша лінійна густина");
  await expect(second.getByText("Перевірено: знову 220 Гц", { exact: false })).toBeVisible();
  await expect.poll(() => saved(account).completedStepIds).toEqual(["intro", "length", "tension", "density", "model"]);
  await expect(page.getByText("f = (1 / 2L) × √(T / μ)")).toBeHidden();
  await noHorizontalScroll(page);
});

test("opens on the course page after Lesson 2 and completes in full with the keyboard, without audio, in reduced motion, at 320 px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const account = await mockAccount(page, { [lessonOneId]: lessonOneCompleted, [lessonTwoId]: lessonTwoCompleted });
  await page.goto(`${applicationOrigin}/course`);
  const card = page.getByRole("region", { name: "Від чого залежить частота струни?" });
  await expect(card).toBeVisible();
  await expect(card.getByText("Після попереднього уроку")).toHaveCount(0);

  await page.goto(`${applicationOrigin}/lessons/03`);
  for (const guess of ["Товщина", "Сила удару"]) {
    const box = page.getByRole("checkbox", { name: guess });
    await box.focus();
    await box.press("Space");
  }
  await press(page, "Перевірити дослідом");
  const step = async (scope: Page | ReturnType<Page["getByRole"]>, group: string, from: string, key: "ArrowDown" | "ArrowUp", times = 1) => {
    const radio = scope.getByRole("radiogroup", { name: group }).getByRole("radio", { name: from, exact: true });
    await radio.focus();
    for (let index = 0; index < times; index += 1) await page.keyboard.press(key);
  };

  await expect(page.getByRole("heading", { name: "Яка частина струни тремтить?" })).toBeFocused();
  await press(page, "Частішими", "radio");
  await press(page, "Перевірити");
  await step(page, "Довжина частини, яка тремтить", "повна довжина", "ArrowDown");
  await press(page, "Далі: наскільки туго?");

  await press(page, "Вона коротша", "radio");
  await press(page, "Перевірити");
  await press(page, "Частішими", "radio");
  await page.getByRole("button", { name: "Перевірити" }).nth(1).press("Enter");
  await step(page, "Наскільки туго натягнута", "звичайно", "ArrowDown");
  await press(page, "Далі: товста чи важка?");

  await press(page, "Так", "radio");
  await press(page, "Перевірити");
  await press(page, "Легша", "radio");
  await page.getByRole("button", { name: "Перевірити" }).nth(1).press("Enter");
  await step(page, "Скільки важить кожен сантиметр", "легка", "ArrowDown");
  await press(page, "Далі: три ручки разом");

  const [first, second] = [page.getByRole("listitem").filter({ hasText: "Почни з початкової струни" }), page.getByRole("listitem").filter({ hasText: "Знову від початкової струни" })];
  for (const [item, answer] of [[first, "Вищим"], [second, "Не зміниться"]] as const) {
    const radio = item.getByRole("radio", { name: answer, exact: true });
    await radio.focus();
    await radio.press("Space");
    await item.getByRole("button", { name: "Перевірити" }).press("Enter");
  }
  await step(page, "Довжина частини, що коливається", "повна довжина", "ArrowDown", 2);
  await step(page, "Натяг", "звичайно", "ArrowDown", 2);
  await press(page, "Скинути");
  await step(page, "Натяг", "звичайно", "ArrowDown", 2);
  await step(page, "Лінійна густина (вага сантиметра)", "легка", "ArrowDown", 2);
  await expect.poll(() => saved(account).completedStepIds).toContain("model");
  await press(page, "Далі: зроби сам");

  await expect(page.getByRole("heading", { name: "Зроби сам і поясни" })).toBeFocused();
  const higher = page.getByRole("region", { name: "Задача 1. Зроби звук вищим, не змінюючи довжину" });
  await expect(higher.getByRole("radiogroup", { name: "Довжина частини, що коливається" })).toHaveAttribute("aria-disabled", "true");
  await expect(higher.getByText("не змінюємо в цій задачі")).toBeVisible();
  await expect(higher.getByText("Частота: 147 Гц")).toBeVisible();
  await expect(higher.getByText("Три правила")).toHaveCount(0);
  const checkHigher = higher.getByRole("button", { name: "Перевірити" });
  await checkHigher.focus();
  await checkHigher.press("Enter");
  await expect(higher.getByRole("status").filter({ hasText: "Частота поки та сама, 147 Гц" })).toBeVisible();
  await step(higher, "Лінійна густина (вага сантиметра)", "важча", "ArrowDown");
  await checkHigher.focus();
  await checkHigher.press("Enter");
  await expect(higher.getByRole("status").filter({ hasText: "Звук став нижчим, а треба вищим" })).toContainText("Більша лінійна густина");
  await step(higher, "Лінійна густина (вага сантиметра)", "найважча", "ArrowUp", 2);
  await expect(higher.getByText("Частота: 220 Гц")).toBeVisible();
  await checkHigher.focus();
  await checkHigher.press("Enter");
  await expect(higher.getByRole("status").filter({ hasText: "Виконано: звук вищий" })).toBeVisible();
  await expect(checkHigher).toBeFocused();

  const lower = page.getByRole("region", { name: "Задача 2. Зроби звук нижчим, не змінюючи натяг" });
  await expect(lower.getByRole("radiogroup", { name: "Натяг" })).toHaveAttribute("aria-disabled", "true");
  await expect(lower.getByText("Частота: 440 Гц")).toBeVisible();
  await step(lower, "Довжина частини, що коливається", "¾ довжини", "ArrowUp");
  const checkLower = lower.getByRole("button", { name: "Перевірити" });
  await checkLower.focus();
  await checkLower.press("Enter");
  await expect(lower.getByRole("status").filter({ hasText: "Виконано: звук нижчий" })).toBeVisible();
  expect(saved(account).checkpointPassed).toBe(false);

  const answer = async (question: string, choice: string) => {
    const group = page.getByRole("group", { name: question });
    const radio = group.getByRole("radio", { name: choice });
    await radio.focus();
    await radio.press("Space");
    await group.getByRole("button", { name: "Перевірити" }).press("Enter");
  };
  await answer("Чому струна, притиснута пальцем", "Бо, притискаючи, ми смикаємо сильніше.");
  await expect(page.getByText("Сила удару змінює гучність, а не висоту", { exact: false })).toBeVisible();
  await answer("Чому струна, притиснута пальцем", "Коливається лише частина від пальця");
  await answer("Що робить кілок", "Змінює натяг");
  await expect(page.getByText("Перевірку пройдено", { exact: false })).toHaveCount(0);
  await answer("Чому три найтовщі", "Обмотка робить кожен сантиметр важчим");
  await expect(page.getByText("Перевірку пройдено", { exact: false })).toBeVisible();
  await expect.poll(() => saved(account).checkpointPassed).toBe(true);
  await noHorizontalScroll(page);
  await press(page, "Далі: підсумок");

  await expect(page.getByRole("heading", { name: "Що ми з’ясували" })).toBeFocused();
  const summary = page.getByRole("region", { name: "Твої здогадки з початку уроку" });
  await expect(summary.getByRole("listitem").filter({ hasText: "Товщина" })).toContainText("підтвердилося");
  await expect(summary.getByRole("listitem").filter({ hasText: "Товщина" })).toContainText("твоя здогадка");
  await expect(summary.getByRole("listitem").filter({ hasText: "Сила удару" })).toContainText("окреме питання");
  await expect(summary.getByRole("listitem").filter({ hasText: "Матеріал" })).toContainText("скільки важить сантиметр");
  await expect(page.getByText("Гітара і піаніно", { exact: false })).toHaveCount(0);
  expect(saved(account).completedAt).toBeNull();
  await press(page, "Завершити урок");
  await expect(page.getByTestId("finish-status")).toBeFocused();
  await expect(page.getByTestId("finish-status")).toContainText("Урок завершено.");
  await expect(page.getByText("Гітара і піаніно можуть звучати на однаковій висоті", { exact: false })).toBeVisible();
  await expect.poll(() => saved(account).completedAt).not.toBeNull();
  expect(saved(account).completedStepIds).toEqual(["intro", "length", "tension", "density", "model", "checkpoint", "complete"]);
  await noHorizontalScroll(page);
  await expect(page.getByRole("link", { name: "До списку уроків" })).toBeVisible();
});
