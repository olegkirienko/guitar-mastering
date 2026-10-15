import { expect, test, type Locator, type Page } from "@playwright/test";
import { applicationOrigin, lessonEightCompleted, lessonEightId, lessonElevenCompleted, lessonElevenId, lessonFiveCompleted, lessonFiveId, lessonFourCompleted, lessonFourId, lessonNineCompleted, lessonNineId, lessonOneCompleted, lessonOneId, lessonSevenCompleted, lessonSevenId, lessonSixCompleted, lessonSixId, lessonTenCompleted, lessonTenId, lessonThreeCompleted, lessonThreeId, lessonTwelveId, lessonTwoCompleted, lessonTwoId, mockAccount } from "./support/mock-account";

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
  [lessonElevenId]: lessonElevenCompleted,
};

function saved(account: Account) {
  return account.progress(lessonTwelveId) ?? { currentStepId: "intro", completedStepIds: [] as string[], checkpointPassed: false, completedAt: null as string | null };
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
const fret = (page: Page, number: number) => page.getByRole("button", { name: `лад ${number}`, exact: true });
const pair = (page: Page, name: string) => page.getByRole("button", { name, exact: true });

test("keeps Lesson 12 closed until Lesson 11 is completed", async ({ page }) => {
  await mockAccount(page, { ...earlierDone, [lessonElevenId]: { currentStepId: "guitar", completedStepIds: ["intro"], checkpointPassed: false, completedAt: null } });
  for (const path of ["/lessons/12", "/lessons/12/link"]) {
    await page.goto(`${applicationOrigin}${path}`);
    await expect(page).toHaveURL(`${applicationOrigin}/course`);
  }
});

test("walks the open-strings lesson with the keyboard, without audio, at 320 px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const account = await mockAccount(page, earlierDone);
  await page.goto(`${applicationOrigin}/lessons/12`);

  // `intro`: six sounds and a doubt; no name for the set of strings yet.
  await expect(page).toHaveURL(`${applicationOrigin}/lessons/12/intro`);
  await expect(page.getByText("Без звуку:", { exact: false })).toBeVisible();
  await answer(page, "Кроки між сусідніми струнами", "Ні, різні");
  await noHorizontalScroll(page);
  await press(next(page));
  await expect.poll(() => saved(account).completedStepIds).toEqual(["intro"]);

  // `strings`: touch strings, submit an order (a wrong one is allowed).
  await expect(page).toHaveURL(`${applicationOrigin}/lessons/12/strings`);
  await expect(page.getByRole("button", { name: "Струна 6" })).toHaveCount(0);
  await answer(page, "Яка струна звучить вище", "Тонка");
  for (const number of [6, 5, 4]) await press(page.getByRole("button", { name: new RegExp(`^Струна ${number}`) }).first());
  await expect(next(page)).toHaveCount(0);
  await press(page.getByRole("button", { name: "Перевірити порядок" }));
  await expect(page.getByText("Не зовсім.", { exact: false })).toBeVisible();
  await expect(next(page)).toBeVisible();
  await noHorizontalScroll(page);
  await press(next(page));

  // `link`: fret 5 links three pairs, fret 4 the fourth.
  await expect(page).toHaveURL(`${applicationOrigin}/lessons/12/link`);
  await expect(fret(page, 5)).toHaveCount(0);
  await answer(page, "Притисни 6-ту струну", "Лад 5");
  for (const name of ["6→5", "5→4", "4→3"]) {
    await press(pair(page, name));
    await press(fret(page, 5));
    await press(page.getByRole("button", { name: "Порівняти" }));
    await expect(page.getByText("Збіг!", { exact: false })).toBeVisible();
  }
  await expect(next(page)).toHaveCount(0);
  await press(pair(page, "3→2"));
  await press(fret(page, 5));
  await press(page.getByRole("button", { name: "Порівняти" }));
  await expect(page.getByText("притиснута вища", { exact: false })).toBeVisible();
  await press(fret(page, 4));
  await press(page.getByRole("button", { name: "Порівняти" }));
  await expect(page.getByText("Збіг!", { exact: false })).toBeVisible();
  await expect.poll(() => saved(account).completedStepIds).toContain("link");
  await noHorizontalScroll(page);
  await press(next(page));

  // `pattern`: the learner states 5, 5, 5, 4, 5; only then the name appears.
  await expect(page).toHaveURL(`${applicationOrigin}/lessons/12/pattern`);
  await expect(page.getByText("строєм", { exact: false })).toHaveCount(0);
  await answer(page, "Останньою парою", "Лад 5");
  await press(page.getByRole("button", { name: /^Перевірити слухом/ }));
  await answer(page, "Який ряд ладів", "Усюди 5");
  await expect(page.getByText("у парі 3→2 лад 4", { exact: false })).toBeVisible();
  await answer(page, "Який ряд ладів", "5, 5, 5, 4, 5");
  await expect(page.getByText("24 півтони", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("строєм", { exact: false })).toBeVisible();
  await expect.poll(() => saved(account).completedStepIds).toContain("pattern");
  await noHorizontalScroll(page);
  await press(next(page));

  // `guitar`: the no-guitar branch exists; «Далі» is the only gate.
  await expect(page.getByText("Без гітари:", { exact: false })).toBeVisible();
  await press(next(page));

  // `checkpoint`: every question has to be solved before completion opens.
  await expect(next(page)).toHaveCount(0);
  await answer(page, "На якому ладі 4-ї струни", "лад 3");
  await expect(page.getByText("Ні:", { exact: false })).toBeVisible();
  await answer(page, "На якому ладі 4-ї струни", "лад 5");
  await answer(page, "На якому ладі 3-ї струни", "лад 4");
  await answer(page, "На якому ладі 5-ї струни", "лад 5");
  await answer(page, "Яка нота на відкритій 2-й", "B");
  expect(saved(account).checkpointPassed).toBe(false);
  await answer(page, "Чому 1-ша й 6-та", "Між ними 24 півтони — це 2 октави");
  await expect.poll(() => saved(account)).toMatchObject({ checkpointPassed: true, completedAt: null });
  await noHorizontalScroll(page);
  await press(next(page));

  // `complete`: only the explicit button finishes the lesson, and the bridge follows it.
  await expect(page.getByText("Наступне питання")).toHaveCount(0);
  await press(page.getByRole("button", { name: "Завершити урок" }));
  await expect(page.getByTestId("finish-status")).toContainText("Урок завершено.");
  await expect(page.getByText("яка нота на 7-му ладі", { exact: false })).toBeVisible();
  await expect.poll(() => saved(account).completedAt).not.toBeNull();
  await noHorizontalScroll(page);
});
