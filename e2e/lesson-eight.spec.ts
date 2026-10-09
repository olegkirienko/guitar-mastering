import { expect, test, type Locator, type Page } from "@playwright/test";
import { applicationOrigin, lessonEightId, lessonFiveCompleted, lessonFiveId, lessonFourCompleted, lessonFourId, lessonOneCompleted, lessonOneId, lessonSevenCompleted, lessonSevenId, lessonSixCompleted, lessonSixId, lessonThreeCompleted, lessonThreeId, lessonTwoCompleted, lessonTwoId, mockAccount } from "./support/mock-account";

type Account = Awaited<ReturnType<typeof mockAccount>>;

const earlierDone = {
  [lessonOneId]: lessonOneCompleted,
  [lessonTwoId]: lessonTwoCompleted,
  [lessonThreeId]: lessonThreeCompleted,
  [lessonFourId]: lessonFourCompleted,
  [lessonFiveId]: lessonFiveCompleted,
  [lessonSixId]: lessonSixCompleted,
  [lessonSevenId]: lessonSevenCompleted,
};

function saved(account: Account) {
  return account.progress(lessonEightId) ?? { currentStepId: "intro", completedStepIds: [] as string[], checkpointPassed: false, completedAt: null as string | null };
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
const pairButton = (page: Page, from: number, to: number, label: string) => page.getByRole("group", { name: `Клавіші ${from} і ${to}` }).getByRole("button", { name: label });

test("keeps Lesson 8 closed until Lesson 7 is completed", async ({ page }) => {
  await mockAccount(page, { ...earlierDone, [lessonSevenId]: { currentStepId: "guitar", completedStepIds: ["intro"], checkpointPassed: false, completedAt: null } });
  for (const path of ["/lessons/08", "/lessons/08/look"]) {
    await page.goto(`${applicationOrigin}${path}`);
    await expect(page).toHaveURL(`${applicationOrigin}/course`);
  }
});

test("walks the note names lesson with the keyboard, without audio, at 320 px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const account = await mockAccount(page, earlierDone);
  await page.goto(`${applicationOrigin}/lessons/08`);

  // `intro`: a text description instead of sound while audio is off.
  await expect(page).toHaveURL(`${applicationOrigin}/lessons/08/intro`);
  await expect(page.getByRole("button", { name: "Лише білі" })).toHaveCount(0);
  await noHorizontalScroll(page);
  await press(next(page));
  await expect.poll(() => saved(account).completedStepIds).toEqual(["intro"]);

  // `look`: the pattern is seen on the keys; no letters yet.
  await expect(page).toHaveURL(`${applicationOrigin}/lessons/08/look`);
  await keyButton(page, 0).focus();
  await keyButton(page, 0).press("ArrowRight");
  await expect(keyButton(page, 1)).toBeFocused();
  await press(keyButton(page, 1));
  await press(keyButton(page, 6));
  await expect(page.getByText("Біла клавіша ліворуч від пари чорних", { exact: false })).toBeVisible();
  await noHorizontalScroll(page);
  await press(next(page));

  // `pattern`: the keys appear after the prediction; seven whites and four pairs open «Далі».
  await expect(keyButton(page, 12)).toHaveCount(0);
  await answer(page, "Скільки білих клавіш", "Не знаю");
  await expect(next(page)).toHaveCount(0);
  for (const key of [0, 2, 4, 5, 7, 9, 11]) await press(keyButton(page, key));
  await expect(page.getByText("Білих клавіш знайдено: 7.")).toBeVisible();
  await press(pairButton(page, 4, 5, "2 півтони"));
  await expect(page.getByText("Ні: порахуй", { exact: false })).toBeVisible();
  await press(pairButton(page, 4, 5, "1 півтон"));
  await press(pairButton(page, 0, 2, "2 півтони"));
  await press(pairButton(page, 2, 4, "2 півтони"));
  await expect(next(page)).toHaveCount(0);
  await press(pairButton(page, 5, 7, "2 півтони"));
  await expect(page.getByText("2 · 2 · 1 · 2 · 2 · 2 · 1", { exact: false })).toBeVisible();
  await noHorizontalScroll(page);
  await press(next(page));

  // `names`: letters are opened by pressing white keys; black keys stay unnamed.
  await expect(page).toHaveURL(`${applicationOrigin}/lessons/08/names`);
  await press(keyButton(page, 0));
  await expect(page.getByRole("button", { name: /^Клавіша 0, C, біла,/ })).toBeVisible();
  await press(keyButton(page, 1));
  await expect(page.getByText("Назву чорної клавіші дізнаємось у наступному уроці.")).toBeVisible();
  await expect(next(page)).toHaveCount(0);
  await answer(page, "Яка літера йде після B?", "A");
  await expect(next(page)).toHaveCount(0);
  await answer(page, "Яка літера йде після B?", "C");
  await noHorizontalScroll(page);
  await press(next(page));

  // `anchor`: 440 Hz is tied to A, then semitones are counted from it.
  await answer(page, "на 2 півтони вище за A", "B");
  await expect(next(page)).toHaveCount(0);
  await answer(page, "на 5 півтонів вище за A", "D");
  await expect.poll(() => saved(account).completedStepIds).toContain("anchor");
  await press(next(page));

  // `guitar`: the no-guitar branch exists; «Далі» is the only gate.
  await expect(page.getByText("Без гітари:", { exact: false })).toBeVisible();
  await press(next(page));

  // `checkpoint`: all four tasks have to be solved before completion opens.
  await expect(next(page)).toHaveCount(0);
  await answer(page, "Клавіша 7 біла", "G");
  await answer(page, "лише один півтон", "E і F");
  await answer(page, "на 7 півтонів вище за C", "G");
  expect(saved(account).checkpointPassed).toBe(false);
  await answer(page, "на 4 півтони нижче за A", "F");
  await expect.poll(() => saved(account)).toMatchObject({ checkpointPassed: true, completedAt: null });
  await noHorizontalScroll(page);
  await press(next(page));

  // `complete`: only the explicit button finishes the lesson, and the bridge follows it.
  await expect(page.getByText("Наступне питання")).toHaveCount(0);
  await press(page.getByRole("button", { name: "Завершити урок" }));
  await expect(page.getByTestId("finish-status")).toContainText("Урок завершено.");
  await expect(page.getByText("Між C і D є чорна клавіша", { exact: false })).toBeVisible();
  await expect.poll(() => saved(account).completedAt).not.toBeNull();
  await noHorizontalScroll(page);
});
