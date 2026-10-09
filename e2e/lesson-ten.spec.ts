import { expect, test, type Locator, type Page } from "@playwright/test";
import { applicationOrigin, lessonEightCompleted, lessonEightId, lessonFiveCompleted, lessonFiveId, lessonFourCompleted, lessonFourId, lessonNineCompleted, lessonNineId, lessonOneCompleted, lessonOneId, lessonSevenCompleted, lessonSevenId, lessonSixCompleted, lessonSixId, lessonTenId, lessonThreeCompleted, lessonThreeId, lessonTwoCompleted, lessonTwoId, mockAccount } from "./support/mock-account";

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
};

function saved(account: Account) {
  return account.progress(lessonTenId) ?? { currentStepId: "intro", completedStepIds: [] as string[], checkpointPassed: false, completedAt: null as string | null };
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

async function type(field: Locator, text: string) {
  await field.focus();
  await field.press("Control+A");
  await field.pressSequentially(text);
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
const task = (page: Page, text: string) => page.getByRole("listitem").filter({ hasText: text });

test("keeps Lesson 10 closed until Lesson 9 is completed", async ({ page }) => {
  await mockAccount(page, { ...earlierDone, [lessonNineId]: { currentStepId: "guitar", completedStepIds: ["intro"], checkpointPassed: false, completedAt: null } });
  for (const path of ["/lessons/10", "/lessons/10/octave"]) {
    await page.goto(`${applicationOrigin}${path}`);
    await expect(page).toHaveURL(`${applicationOrigin}/course`);
  }
});

test("walks the final lab of Stage II with the keyboard, without audio, at 320 px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const account = await mockAccount(page, earlierDone);
  await page.goto(`${applicationOrigin}/lessons/10`);

  // `intro`: the bridge of lesson 4 and an ungraded prediction.
  await expect(page).toHaveURL(`${applicationOrigin}/lessons/10/intro`);
  await expect(page.getByText("Пройдімо 12 півтонів", { exact: false })).toBeVisible();
  await answer(page, "Що, на твою думку", "Не знаю");
  await noHorizontalScroll(page);
  await press(next(page));
  await expect.poll(() => saved(account).completedStepIds).toEqual(["intro"]);

  // `octave`: a wrong answer, a right one, an out-of-range one and a shown answer.
  await expect(page).toHaveURL(`${applicationOrigin}/lessons/10/octave`);
  await expect(next(page)).toHaveCount(0);
  const first = task(page, "Октава нижче від 330 Гц");
  await type(first.getByLabel("Частота, Гц"), "660");
  await press(first.getByRole("button", { name: "Перевірити" }));
  await expect(first.getByText("подвоєння або поділ навпіл", { exact: false })).toBeVisible();
  await type(first.getByLabel("Частота, Гц"), "165");
  await press(first.getByRole("button", { name: "Перевірити" }));
  await expect(first.getByText("Так.")).toBeVisible();
  const second = task(page, "Октава вище від 330 Гц");
  await type(second.getByLabel("Частота, Гц"), "99999");
  await press(second.getByRole("button", { name: "Перевірити" }));
  await expect(second.getByText("з цього діапазону", { exact: false })).toBeVisible();
  await type(second.getByLabel("Частота, Гц"), "660");
  await press(second.getByRole("button", { name: "Перевірити" }));
  await press(task(page, "Октава вище від 110 Гц").getByRole("button", { name: "Показати відповідь" }));
  await expect(task(page, "Октава вище від 110 Гц").getByText("Відповідь: 220 Гц.")).toBeVisible();
  await noHorizontalScroll(page);
  await press(next(page));

  // `count`: the trap F♭ → G is three semitones.
  await expect(next(page)).toHaveCount(0);
  const answers = [["Від E до A", "5", "2,5"], ["Від C♯ до F", "4", "2"], ["Від B до D", "3", "1,5"]];
  for (const [label, semitones, tones] of answers) {
    const row = task(page, label);
    await type(row.getByRole("textbox", { name: /^Півтонів/ }), semitones);
    await type(row.getByRole("textbox", { name: /^Тонів/ }), tones);
    await press(row.getByRole("button", { name: "Перевірити" }));
    await expect(row.getByText("Так.")).toBeVisible();
  }
  const trap = task(page, "Від F♭ до G");
  await type(trap.getByRole("textbox", { name: /^Півтонів/ }), "2");
  await type(trap.getByRole("textbox", { name: /^Тонів/ }), "1");
  await press(trap.getByRole("button", { name: "Перевірити" }));
  await expect(trap.getByText("Ще ні.", { exact: false })).toBeVisible();
  await type(trap.getByRole("textbox", { name: /^Півтонів/ }), "3");
  await type(trap.getByRole("textbox", { name: /^Тонів/ }), "1,5");
  await press(trap.getByRole("button", { name: "Перевірити" }));
  await expect(trap.getByText("та сама клавіша, що E", { exact: false })).toBeVisible();
  await noHorizontalScroll(page);
  await press(next(page));

  // `gaps`: a wrong pick resets without penalty; the explanation follows the right one.
  await expect(next(page)).toHaveCount(0);
  await press(page.getByRole("button", { name: "C–D", exact: true }));
  await press(page.getByRole("button", { name: "Перевірити", exact: true }));
  await expect(page.getByText("Ще ні.", { exact: false })).toBeVisible();
  await press(page.getByRole("button", { name: "C–D", exact: true }));
  await press(page.getByRole("button", { name: "E–F", exact: true }));
  await press(page.getByRole("button", { name: "B–C", exact: true }));
  await press(page.getByRole("button", { name: "Перевірити", exact: true }));
  await expect(page.getByText("Так, ці дві пари.")).toBeVisible();
  await answer(page, "Чому саме вони?", "Між ними лише один півтон");
  await expect(page.getByText("Пригадай E♯", { exact: false })).toBeVisible();
  await noHorizontalScroll(page);
  await press(next(page));

  // `walk`: twelve named steps from C, one wrong name on the way, then the sentence.
  await expect(next(page)).toHaveCount(0);
  await press(keyButton(page, 0));
  const letter = (name: string) => page.getByRole("group", { name: "Літера" }).getByRole("button", { name, exact: true });
  const sign = (name: string) => page.getByRole("group", { name: "Знак" }).getByRole("button", { name, exact: true });
  const steps: [string, string][] = [["C", "дієз"], ["D", "без знака"], ["D", "дієз"], ["E", "без знака"], ["F", "без знака"], ["F", "дієз"], ["G", "без знака"], ["G", "дієз"], ["A", "без знака"], ["A", "дієз"], ["B", "без знака"], ["C", "без знака"]];
  for (const [index, [name, mark]] of steps.entries()) {
    await press(page.getByRole("button", { name: "Крок вгору" }));
    if (index === 0) {
      await press(letter("D"));
      await press(sign("без знака"));
      await press(page.getByRole("button", { name: "Назвати" }));
      await expect(page.getByText("Ще ні.", { exact: false })).toBeVisible();
    }
    await press(letter(name));
    await press(sign(mark));
    await press(page.getByRole("button", { name: "Назвати" }));
    await expect(page.getByText(/^Так: /)).toBeVisible();
  }
  await expect(page.getByText("Через 12 півтонів — знову C", { exact: false })).toBeVisible();
  await expect(next(page)).toHaveCount(0);
  await answer(page, "Яке речення", "Через 12 півтонів — та сама назва, звук вдвічі вищий.");
  await expect.poll(() => saved(account).completedStepIds).toContain("walk");
  await noHorizontalScroll(page);
  await press(next(page));

  // `guitar`: the no-guitar branch exists; «Далі» is the only gate.
  await expect(page.getByText("Без гітари:", { exact: false })).toBeVisible();
  await press(next(page));

  // `complete`: only the explicit button finishes the stage.
  await expect(page.getByText("Наступне питання")).toHaveCount(0);
  expect(saved(account).completedAt).toBeNull();
  await press(page.getByRole("button", { name: "Завершити етап II" }));
  await expect(page.getByTestId("finish-status")).toContainText("Етап II завершено.");
  await expect(page.getByText("один такий крок", { exact: false })).toBeVisible();
  await expect.poll(() => saved(account).completedAt).not.toBeNull();
  await noHorizontalScroll(page);
});
