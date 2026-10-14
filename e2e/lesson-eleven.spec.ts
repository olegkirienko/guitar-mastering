import { expect, test, type Locator, type Page } from "@playwright/test";
import { applicationOrigin, lessonEightCompleted, lessonEightId, lessonElevenId, lessonFiveCompleted, lessonFiveId, lessonFourCompleted, lessonFourId, lessonNineCompleted, lessonNineId, lessonOneCompleted, lessonOneId, lessonSevenCompleted, lessonSevenId, lessonSixCompleted, lessonSixId, lessonTenCompleted, lessonTenId, lessonThreeCompleted, lessonThreeId, lessonTwoCompleted, lessonTwoId, mockAccount } from "./support/mock-account";

type Account = Awaited<ReturnType<typeof mockAccount>>;

const earlierDone = {
  [lessonOneId]: lessonOneCompleted,
  [lessonTwoId]: lessonTwoCompleted,
  [lessonThreeId]: lessonThreeCompleted,
  [lessonFourId]: lessonFourCompleted,
  [lessonFiveId]: lessonFiveCompleted,
  [lessonSixId]: lessonSixCompleted,
  [lessonSevenId]: lessonSevenCompleted,
  [lessonEightId]: lessonEightCompleted,
  [lessonNineId]: lessonNineCompleted,
  [lessonTenId]: lessonTenCompleted,
};

function saved(account: Account) {
  return account.progress(lessonElevenId) ?? { currentStepId: "intro", completedStepIds: [] as string[], checkpointPassed: false, completedAt: null as string | null };
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

async function answer(scope: Page | Locator, text: string, choice: string) {
  const fieldset = scope.getByRole("group").filter({ hasText: text });
  await choose(fieldset.getByRole("radio", { name: choice, exact: true }));
  await press(fieldset.getByRole("button", { name: "Перевірити" }));
}

async function noHorizontalScroll(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
}

const next = (page: Page) => page.getByRole("button", { name: "Далі", exact: true });
const fret = (page: Page, number: number) => page.getByRole("button", { name: new RegExp(`^лад ${number},`) }).first();

test("keeps Lesson 11 closed until Lesson 10 is completed", async ({ page }) => {
  await mockAccount(page, { ...earlierDone, [lessonTenId]: { currentStepId: "guitar", completedStepIds: ["intro"], checkpointPassed: false, completedAt: null } });
  for (const path of ["/lessons/11", "/lessons/11/press"]) {
    await page.goto(`${applicationOrigin}${path}`);
    await expect(page).toHaveURL(`${applicationOrigin}/course`);
  }
});

test("walks the frets lesson with the keyboard, without audio, at 320 px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const account = await mockAccount(page, earlierDone);
  await page.goto(`${applicationOrigin}/lessons/11`);

  // `intro`: the board and a prediction; nothing says what a fret does yet.
  await expect(page).toHaveURL(`${applicationOrigin}/lessons/11/intro`);
  await expect(page.getByText("Без звуку:", { exact: false })).toBeVisible();
  await answer(page, "Що станеться зі звуком", "Стане вищим");
  await noHorizontalScroll(page);
  await press(next(page));
  await expect.poll(() => saved(account).completedStepIds).toEqual(["intro"]);

  // `press`: the learner finds that a fret is a semitone.
  await expect(page).toHaveURL(`${applicationOrigin}/lessons/11/press`);
  await expect(fret(page, 1)).toHaveCount(0);
  await answer(page, "Лад 1 підняв звук", "Підніме ще на такий самий крок");
  await press(fret(page, 1));
  await expect(page.getByText("Півтонів від відкритої струни: 1")).toBeVisible();
  await expect(page.getByText("Що робить кожен наступний лад?")).toHaveCount(0);
  await press(fret(page, 2));
  await answer(page, "Що робить кожен наступний лад?", "Піднімає звук на тон");
  await expect(page.getByText("тон — це два півтони", { exact: false })).toBeVisible();
  await answer(page, "Що робить кожен наступний лад?", "Піднімає звук на півтон");
  await expect(page.getByText("Лад = один півтон.", { exact: false })).toBeVisible();
  await expect.poll(() => saved(account).completedStepIds).toContain("press");
  await noHorizontalScroll(page);
  await press(next(page));

  // `twelve`: fret 12 is the octave, half of the string.
  await expect(page).toHaveURL(`${applicationOrigin}/lessons/11/twelve`);
  await answer(page, "На якому ладі, на твою думку", "На 12-му");
  await press(fret(page, 12));
  await expect(page.getByText("110 Гц → 220 Гц: ×2")).toBeVisible();
  await expect(page.getByText("Звучить 1/2 довжини струни")).toBeVisible();
  await answer(page, "Яка нота на 12-му ладі", "A — та сама, що відкрита, але вища");
  await expect(page.getByText("12-й лад — це октава", { exact: false })).toBeVisible();
  await noHorizontalScroll(page);
  await press(next(page));

  // `explorer`: the whole table opens only after the three predictions.
  await expect(page).toHaveURL(`${applicationOrigin}/lessons/11/explorer`);
  await press(fret(page, 3));
  await expect(page.getByText("131 Гц").first()).toBeVisible();
  await press(page.getByRole("button", { name: "Далі до передбачень" }));
  await expect(page.getByText("Усі ноти ладів")).toHaveCount(0);
  await answer(page, "Яка нота на ладі 3?", "C");
  await press(page.getByRole("button", { name: "Наступне завдання" }));
  await answer(page, "Яка нота на ладі 7?", "E");
  await press(page.getByRole("button", { name: "Наступне завдання" }));
  await expect(next(page)).toHaveCount(0);
  await answer(page, "Яка нота на ладі 10?", "G");
  await expect(page.getByText("Усі ноти ладів")).toBeVisible();
  await expect.poll(() => saved(account).completedStepIds).toContain("explorer");
  await noHorizontalScroll(page);
  await press(next(page));

  // `guitar`: the no-guitar branch exists; «Далі» is the only gate.
  await expect(page.getByText("Без гітари:", { exact: false })).toBeVisible();
  await press(next(page));

  // `checkpoint`: all three tasks have to be solved before completion opens.
  await expect(next(page)).toHaveCount(0);
  await answer(page, "Яка нота на ладі 7", "D");
  await expect(page.getByText("Ні:", { exact: false })).toBeVisible();
  await answer(page, "Яка нота на ладі 7", "E");
  const find = page.getByRole("region", { name: /Завдання 2/ });
  await press(find.getByRole("button", { name: /^лад 4,/ }));
  await press(find.getByRole("button", { name: "Перевірити" }));
  await expect(find.getByText("Лад 4 — це A♯", { exact: false }).or(find.getByText("це C♯", { exact: false }))).toBeVisible();
  await press(find.getByRole("button", { name: /^лад 5,/ }));
  await press(find.getByRole("button", { name: "Перевірити" }));
  await expect(find.getByText("Так:", { exact: false })).toBeVisible();
  expect(saved(account).checkpointPassed).toBe(false);
  await answer(page, "Чому 12-й лад", "Бо це 12 півтонів, тобто октава, а звучна частина вдвічі коротша");
  await expect.poll(() => saved(account)).toMatchObject({ checkpointPassed: true, completedAt: null });
  await noHorizontalScroll(page);
  await press(next(page));

  // `complete`: only the explicit button finishes the lesson, and the bridge follows it.
  await expect(page.getByText("Наступне питання")).toHaveCount(0);
  await press(page.getByRole("button", { name: "Завершити урок" }));
  await expect(page.getByTestId("finish-status")).toContainText("Урок завершено.");
  await expect(page.getByText("на гітарі їх шість", { exact: false })).toBeVisible();
  await expect.poll(() => saved(account).completedAt).not.toBeNull();
  await noHorizontalScroll(page);
});
