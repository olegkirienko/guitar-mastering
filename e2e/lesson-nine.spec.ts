import { expect, test, type Locator, type Page } from "@playwright/test";
import { applicationOrigin, lessonEightCompleted, lessonEightId, lessonFiveCompleted, lessonFiveId, lessonFourCompleted, lessonFourId, lessonNineId, lessonOneCompleted, lessonOneId, lessonSevenCompleted, lessonSevenId, lessonSixCompleted, lessonSixId, lessonThreeCompleted, lessonThreeId, lessonTwoCompleted, lessonTwoId, mockAccount } from "./support/mock-account";

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
};

function saved(account: Account) {
  return account.progress(lessonNineId) ?? { currentStepId: "intro", completedStepIds: [] as string[], checkpointPassed: false, completedAt: null as string | null };
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
const name = (page: Page, spoken: string) => page.getByRole("button", { name: spoken, exact: true });

test("keeps Lesson 9 closed until Lesson 8 is completed", async ({ page }) => {
  await mockAccount(page, { ...earlierDone, [lessonEightId]: { currentStepId: "guitar", completedStepIds: ["intro"], checkpointPassed: false, completedAt: null } });
  for (const path of ["/lessons/09", "/lessons/09/raise"]) {
    await page.goto(`${applicationOrigin}${path}`);
    await expect(page).toHaveURL(`${applicationOrigin}/course`);
  }
});

test("walks the sharps and flats lesson with the keyboard, without audio, at 320 px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const account = await mockAccount(page, earlierDone);
  await page.goto(`${applicationOrigin}/lessons/09`);

  // `intro`: a text description instead of sound; the prediction is not graded and no sign is named yet.
  await expect(page).toHaveURL(`${applicationOrigin}/lessons/09/intro`);
  await expect(page.getByText("дієз", { exact: false })).toHaveCount(1); // only the lesson title in the header
  await answer(page, "Як назвати середній звук", "Не знаю");
  await expect(page.getByText("Літер лише сім", { exact: false })).toBeVisible();
  await noHorizontalScroll(page);
  await press(next(page));
  await expect.poll(() => saved(account).completedStepIds).toEqual(["intro"]);

  // `raise`: a sharp is found by going a semitone up from a white key.
  await expect(page).toHaveURL(`${applicationOrigin}/lessons/09/raise`);
  await press(keyButton(page, 1));
  await expect(page.getByText("Спершу натисни білу клавішу", { exact: false })).toBeVisible();
  await press(keyButton(page, 0));
  await press(keyButton(page, 1));
  await expect(page.getByRole("button", { name: /^Клавіша 1, C-дієз,/ })).toBeVisible();
  await expect(page.getByText("«дієз»", { exact: false })).toBeVisible();
  await press(keyButton(page, 2));
  await press(keyButton(page, 3));
  await press(keyButton(page, 5));
  await press(keyButton(page, 6));
  await press(keyButton(page, 4));
  await expect(page.getByText("Праворуч від E чорної клавіші немає.")).toBeVisible();
  await noHorizontalScroll(page);
  await press(next(page));

  // `lower`: the same key is reached from the other side.
  await expect(keyButton(page, 12)).toHaveCount(0);
  await answer(page, "Що буде, якщо від D", "Не знаю");
  await press(keyButton(page, 2));
  await press(keyButton(page, 1));
  await expect(page.getByRole("button", { name: /^Клавіша 1, C-дієз або D-бемоль,/ })).toBeVisible();
  await noHorizontalScroll(page);
  await press(next(page));

  // `same`: one frequency, then the pairs; a wrong pair resets without penalty.
  await expect(next(page)).toHaveCount(0);
  await answer(page, "Чи звучить D", "Ні, звук той самий");
  await expect(page.getByText("енгармонічними", { exact: false })).toBeVisible();
  await press(name(page, "D-дієз"));
  await press(name(page, "B-бемоль"));
  await expect(page.getByText("Ні: D♯", { exact: false })).toBeVisible();
  for (const [sharp, flat] of [["D-дієз", "E-бемоль"], ["F-дієз", "G-бемоль"], ["G-дієз", "A-бемоль"]]) {
    await press(name(page, sharp));
    await press(name(page, flat));
  }
  await expect(next(page)).toHaveCount(0);
  await press(name(page, "A-дієз"));
  await press(name(page, "B-бемоль"));
  await expect(page.getByText("Усі чотири пари з’єднано.")).toBeVisible();
  await noHorizontalScroll(page);
  await press(next(page));

  // `edges`: E♯ is F; the control question opens the closing beat with ♮.
  await answer(page, "Що буде, якщо піднятися на півтон від E", "Біла клавіша F");
  for (const sign of ["E-дієз", "B-дієз", "F-бемоль", "C-бемоль"]) await press(page.getByRole("button", { name: `Перевірити ${sign}` }));
  await expect(page.getByText("E♯ = F")).toBeVisible();
  await expect(page.getByText("C♭ = B")).toBeVisible();
  await expect(next(page)).toHaveCount(0);
  await answer(page, "відповідає B♯", "C");
  await press(page.getByRole("button", { name: "Прибрати ♯ з C♯" }));
  await expect(page.getByText("C♮ = C", { exact: false }).first()).toBeVisible();
  await expect.poll(() => saved(account).completedStepIds).toContain("edges");
  await press(next(page));

  // `guitar`: the no-guitar branch exists; «Далі» is the only gate.
  await expect(page.getByText("Без гітари:", { exact: false })).toBeVisible();
  await press(next(page));

  // `checkpoint`: all four tasks have to be solved before completion opens.
  await expect(next(page)).toHaveCount(0);
  const names = page.getByRole("region", { name: /Обери всі назви/ });
  await press(names.getByRole("button", { name: "F-дієз", exact: true }));
  await press(names.getByRole("button", { name: "Перевірити" }));
  await expect(names.getByText("Ні:", { exact: false })).toBeVisible();
  await press(names.getByRole("button", { name: "G-бемоль", exact: true }));
  await press(names.getByRole("button", { name: "Перевірити" }));
  await expect(names.getByText("Так:", { exact: false })).toBeVisible();
  const find = page.getByRole("region", { name: /Знайди на клавіатурі/ });
  await press(find.getByRole("button", { name: /^Клавіша 5,/ }));
  await expect(find.getByText("Це клавіша 5.", { exact: false })).toBeVisible();
  await press(find.getByRole("button", { name: /^Клавіша 6,/ }));
  const pairs = page.getByRole("region", { name: /Для кожної пари/ });
  for (const [pair, label] of [["A♯ і B♭", "Один звук"], ["C♯ і E♭", "Різні звуки"], ["D♯ і E♭", "Один звук"]]) {
    await press(pairs.getByRole("group", { name: pair }).getByRole("button", { name: label }));
  }
  expect(saved(account).checkpointPassed).toBe(false);
  await press(pairs.getByRole("group", { name: "G♭ і G♯" }).getByRole("button", { name: "Різні звуки" }));
  expect(saved(account).checkpointPassed).toBe(false);
  await answer(page, "відповідає E♯", "F");
  await expect.poll(() => saved(account)).toMatchObject({ checkpointPassed: true, completedAt: null });
  await noHorizontalScroll(page);
  await press(next(page));

  // `complete`: only the explicit button finishes the lesson, and the bridge follows it.
  await expect(page.getByText("Наступне питання")).toHaveCount(0);
  await press(page.getByRole("button", { name: "Завершити урок" }));
  await expect(page.getByTestId("finish-status")).toContainText("Урок завершено.");
  await expect(page.getByText("Пройдімо 12 півтонів", { exact: false })).toBeVisible();
  await expect.poll(() => saved(account).completedAt).not.toBeNull();
  await noHorizontalScroll(page);
});
