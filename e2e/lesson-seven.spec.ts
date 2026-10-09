import { expect, test, type Locator, type Page } from "@playwright/test";
import { applicationOrigin, lessonFiveCompleted, lessonFiveId, lessonFourCompleted, lessonFourId, lessonOneCompleted, lessonOneId, lessonSevenId, lessonSixCompleted, lessonSixId, lessonThreeCompleted, lessonThreeId, lessonTwoCompleted, lessonTwoId, mockAccount } from "./support/mock-account";

type Account = Awaited<ReturnType<typeof mockAccount>>;

const earlierDone = {
  [lessonOneId]: lessonOneCompleted,
  [lessonTwoId]: lessonTwoCompleted,
  [lessonThreeId]: lessonThreeCompleted,
  [lessonFourId]: lessonFourCompleted,
  [lessonFiveId]: lessonFiveCompleted,
  [lessonSixId]: lessonSixCompleted,
};

function saved(account: Account) {
  return account.progress(lessonSevenId) ?? { currentStepId: "intro", completedStepIds: [] as string[], checkpointPassed: false, completedAt: null as string | null };
}

// The whole lesson is reachable from the keyboard: nothing here is clicked.
async function press(control: Locator) {
  await control.focus();
  await control.press("Enter");
}

async function choose(radio: Locator) {
  await radio.focus();
  await radio.press("Space");
}

async function answer(page: Page, text: string, choice: string) {
  const fieldset = page.getByRole("group").filter({ hasText: text });
  await choose(fieldset.getByRole("radio", { name: choice, exact: true }));
  await press(fieldset.getByRole("button", { name: "Перевірити" }));
}

async function noHorizontalScroll(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
}

const next = (page: Page) => page.getByRole("button", { name: "Далі", exact: true });
const keyButton = (page: Page, key: number) => page.getByRole("button", { name: new RegExp(`^Клавіша ${key},`) });

test("keeps Lesson 7 closed until Lesson 6 is completed", async ({ page }) => {
  await mockAccount(page, { ...earlierDone, [lessonSixId]: { currentStepId: "guitar", completedStepIds: ["intro"], checkpointPassed: false, completedAt: null } });
  for (const path of ["/lessons/07", "/lessons/07/keys"]) {
    await page.goto(`${applicationOrigin}${path}`);
    await expect(page).toHaveURL(`${applicationOrigin}/course`);
  }
});

test("walks the semitone lesson with the keyboard, without audio, with reduced motion, at 320 px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const account = await mockAccount(page, earlierDone);
  await page.goto(`${applicationOrigin}/lessons/07`);

  // `intro`: a text description instead of sound while audio is off.
  await expect(page).toHaveURL(`${applicationOrigin}/lessons/07/intro`);
  await expect(page.getByRole("button", { name: "Послухати ковзання" })).toHaveCount(0);
  await expect(page.getByText("Ковзання проходить усі значення підряд", { exact: false })).toBeVisible();
  await noHorizontalScroll(page);
  await press(next(page));
  await expect.poll(() => saved(account).completedStepIds).toEqual(["intro"]);

  // `keys`: predict first; the keyboard appears after the answer, and the count is not told in advance.
  await expect(page).toHaveURL(`${applicationOrigin}/lessons/07/keys`);
  await expect(keyButton(page, 12)).toHaveCount(0);
  await answer(page, "Скільки клавіш треба пройти", "Не знаю");
  await expect(keyButton(page, 12)).toBeVisible();
  await expect(next(page)).toHaveCount(0);
  await noHorizontalScroll(page);
  // Arrow keys move between the keys.
  await keyButton(page, 0).focus();
  await keyButton(page, 0).press("ArrowRight");
  await expect(keyButton(page, 1)).toBeFocused();
  await press(keyButton(page, 0));
  await press(keyButton(page, 1));
  await press(keyButton(page, 12));
  // The new words stay unused until their own screen.
  expect((await page.locator("body").innerText()).toLowerCase()).not.toContain("півтон");
  await press(next(page));

  // `steps`: the learner finds 12 by counting; a wrong number is explained and not final.
  await expect(page.getByRole("button", { name: "Програти підряд" })).toHaveCount(0);
  await page.getByLabel("Кількість кроків").fill("8");
  await press(page.getByRole("button", { name: "Перевірити" }));
  await expect(page.getByText("Порахуй ще раз", { exact: false })).toBeVisible();
  await expect(next(page)).toHaveCount(0);
  await page.getByLabel("Кількість кроків").fill("12");
  await press(page.getByRole("button", { name: "Перевірити" }));
  await expect(page.getByText("Так, 12 кроків.")).toBeVisible();
  await expect.poll(() => saved(account).completedStepIds).toContain("steps");
  expect((await page.locator("body").innerText()).toLowerCase()).not.toContain("півтон");
  await press(next(page));

  // `compare`: numbers are opened only after the prediction; the ratio stays constant.
  await expect(page.getByRole("table")).toHaveCount(0);
  await answer(page, "Різниця частот між сусідніми клавішами", "Росте");
  await press(page.getByRole("button", { name: "Показати числа" }));
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.getByText("1,0595").first()).toBeVisible();
  await noHorizontalScroll(page);
  await press(next(page));

  // `semitone`: the words appear here, and the distance is the difference of numbers.
  await expect(page.getByText("називають півтоном", { exact: false })).toBeVisible();
  await press(keyButton(page, 0));
  await press(keyButton(page, 2));
  await expect(page.getByText("Між клавішами 0 і 2: півтонів — 2, тонів — 1.")).toBeVisible();
  await press(keyButton(page, 3));
  await press(keyButton(page, 7));
  await expect(page.getByText("Між клавішами 3 і 7: півтонів — 4, тонів — 2.")).toBeVisible();
  await expect(next(page)).toHaveCount(0);
  await answer(page, "Скільки тонів в октаві?", "12");
  await expect(next(page)).toHaveCount(0);
  await answer(page, "Скільки тонів в октаві?", "6");
  await noHorizontalScroll(page);
  await press(next(page));

  // `deeper`: optional; skipping completes it and opens the rest.
  await expect(page.getByText("Необов’язково")).toBeVisible();
  await press(page.getByRole("button", { name: "Пропустити" }));
  await expect.poll(() => saved(account).completedStepIds).toContain("deeper");

  // `guitar`: the no-guitar branch exists; «Далі» is the only gate.
  await expect(page.getByText("Без гітари:", { exact: false })).toBeVisible();
  await press(next(page));

  // `checkpoint`: all three tasks have to be solved before completion opens.
  await expect(next(page)).toHaveCount(0);
  const check = page.getByRole("button", { name: "Перевірити" });
  await page.getByRole("textbox", { name: "Півтонів", exact: true }).fill("5");
  await page.getByRole("textbox", { name: "Тонів", exact: true }).fill("2,5");
  await press(check.nth(0));
  await page.getByRole("textbox", { name: "Номер клавіші" }).fill("20");
  await press(check.nth(1));
  await expect(page.getByText("Такої клавіші немає", { exact: false })).toBeVisible();
  await page.getByRole("textbox", { name: "Номер клавіші" }).fill("8");
  await press(check.nth(1));
  expect(saved(account).checkpointPassed).toBe(false);
  await page.getByRole("textbox", { name: "Кількість півтонів" }).fill("12");
  await press(check.nth(2));
  await expect.poll(() => saved(account)).toMatchObject({ checkpointPassed: true, completedAt: null });
  await noHorizontalScroll(page);
  await press(next(page));

  // `complete`: only the explicit button finishes the lesson, and the bridge follows it.
  await expect(page.getByText("Наступне питання")).toHaveCount(0);
  await press(page.getByRole("button", { name: "Завершити урок" }));
  await expect(page.getByTestId("finish-status")).toContainText("Урок завершено.");
  await expect(page.getByText("лише сімома літерами", { exact: false })).toBeVisible();
  await expect.poll(() => saved(account).completedAt).not.toBeNull();
  await noHorizontalScroll(page);
});
