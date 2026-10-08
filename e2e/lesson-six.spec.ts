import { expect, test, type Locator, type Page } from "@playwright/test";
import { applicationOrigin, lessonFiveCompleted, lessonFiveId, lessonFourCompleted, lessonFourId, lessonOneCompleted, lessonOneId, lessonSixId, lessonThreeCompleted, lessonThreeId, lessonTwoCompleted, lessonTwoId, mockAccount } from "./support/mock-account";

type Account = Awaited<ReturnType<typeof mockAccount>>;

const stageOneDone = {
  [lessonOneId]: lessonOneCompleted,
  [lessonTwoId]: lessonTwoCompleted,
  [lessonThreeId]: lessonThreeCompleted,
  [lessonFourId]: lessonFourCompleted,
  [lessonFiveId]: lessonFiveCompleted,
};

function saved(account: Account) {
  return account.progress(lessonSixId) ?? { currentStepId: "intro", completedStepIds: [] as string[], checkpointPassed: false, completedAt: null as string | null };
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

function question(page: Page, text: string) {
  return page.getByRole("group").filter({ hasText: text });
}

async function answer(page: Page, text: string, choice: string) {
  const fieldset = question(page, text);
  await choose(fieldset.getByRole("radio", { name: choice }));
  await press(fieldset.getByRole("button", { name: "Перевірити" }));
}

async function noHorizontalScroll(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
}

test("keeps Lesson 6 closed until Lesson 5 is completed", async ({ page }) => {
  await mockAccount(page, { ...stageOneDone, [lessonFiveId]: { currentStepId: "path", completedStepIds: ["intro"], checkpointPassed: true } });
  for (const path of ["/lessons/06", "/lessons/06/doubler"]) {
    await page.goto(`${applicationOrigin}${path}`);
    await expect(page).toHaveURL(`${applicationOrigin}/course`);
  }
});

test("walks the octave lesson with the keyboard, without audio, with reduced motion, at 320 px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const account = await mockAccount(page, stageOneDone);
  await page.goto(`${applicationOrigin}/lessons/06`);

  // `intro`: infinitely many frequencies; no sound is offered while audio is off.
  await expect(page).toHaveURL(`${applicationOrigin}/lessons/06/intro`);
  await expect(page.getByText("Скільки існує різних частот між 440 і 441 Гц?")).toBeVisible();
  await expect(page.getByRole("button", { name: "Послухати 440" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Далі", exact: true })).toHaveCount(0);
  for (let found = 0; found < 4; found += 1) await press(page.getByRole("button", { name: "Знайти ще одну між ними" }).or(page.getByText("між будь-якими двома частотами є ще одна", { exact: false })).first());
  await expect(page.getByText("440,0625 Гц")).toBeVisible();
  await expect(page.getByText("Звук, якому музика дала власну назву, називають нотою.", { exact: false })).toBeVisible();
  await noHorizontalScroll(page);
  await press(page.getByRole("button", { name: "Далі", exact: true }));
  await expect.poll(() => saved(account).completedStepIds).toEqual(["intro"]);

  // `same-name`: predict first; the cards appear after the answer, and with audio off the answer is enough.
  await expect(page).toHaveURL(`${applicationOrigin}/lessons/06/same-name`);
  await expect(page.getByRole("button", { name: /Послухати 220/ })).toHaveCount(0);
  await answer(page, "Який?", "660 Гц");
  await expect(page.getByText("Три з чотирьох — наче один звук на різній висоті", { exact: false })).toBeVisible();
  await press(page.getByRole("button", { name: "Далі", exact: true }));

  // `doubler`: the prediction gates the buttons; ×3 sounds different; the pattern is found, not read.
  await expect(page.getByTestId("doubler-frequency")).toContainText("440");
  await expect(page.getByRole("button", { name: "×2" })).toBeDisabled();
  await press(page.getByRole("button", { name: "Той самий, лише вищий чи нижчий" }));
  await press(page.getByRole("button", { name: "×2" }));
  await expect(page.getByTestId("doubler-frequency")).toContainText("880");
  await expect(page.getByText("Подвоїш частоту — звук той самий", { exact: false })).toHaveCount(0);
  await press(page.getByRole("button", { name: "Не знаю" }));
  await press(page.getByRole("button", { name: "÷2" }));
  await press(page.getByRole("button", { name: "Не знаю" }));
  await press(page.getByRole("button", { name: "÷2" }));
  await expect(page.getByTestId("doubler-frequency")).toContainText("220");
  await expect(page.getByText("Подвоїш частоту — звук той самий", { exact: false })).toBeVisible();
  await expect.poll(() => saved(account).completedStepIds).toContain("doubler");
  await press(page.getByRole("button", { name: "Не знаю" }));
  await press(page.getByRole("button", { name: "Спробувати ×3" }));
  await expect(page.getByText("це звучить як інший звук", { exact: false })).toBeVisible();
  // The word of the next screen is not used before it.
  expect((await page.locator("body").innerText()).toLowerCase()).not.toContain("октав");
  await noHorizontalScroll(page);
  await press(page.getByRole("button", { name: "Далі", exact: true }));

  // `octave`: the name, the 2:1 rule, then a question that is answered until it is right.
  await expect(page.getByText("220 × 2 = 440 × 2 = 880")).toBeVisible();
  await expect(page.getByText("Такі два звуки називають октавою.", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Далі", exact: true })).toHaveCount(0);
  await answer(page, "Який звук той самий, що й 300 Гц", "900 Гц");
  await expect(page.getByRole("button", { name: "Далі", exact: true })).toHaveCount(0);
  await answer(page, "Який звук той самий, що й 300 Гц", "600 Гц");
  await press(page.getByRole("button", { name: "Далі", exact: true }));

  // `guitar`: the experiment has a no-guitar branch; «Далі» is the only gate.
  await expect(page.getByText("Без гітари:", { exact: false })).toBeVisible();
  await press(page.getByRole("button", { name: "Далі", exact: true }));

  // `checkpoint`: both tasks have to be solved before completion opens.
  await expect(page.getByRole("button", { name: "Далі", exact: true })).toHaveCount(0);
  await answer(page, "Який звук на октаву вище за 330 Гц?", "990 Гц");
  await answer(page, "Який звук на октаву вище за 330 Гц?", "660 Гц");
  await answer(page, "А який звук на октаву нижче за 330 Гц?", "165 Гц");
  await expect(saved(account).checkpointPassed).toBe(false);
  await choose(page.getByRole("checkbox", { name: "300 і 450 Гц" }));
  await press(page.getByRole("button", { name: "Перевірити" }).last());
  await expect(page.getByText("Поки не все", { exact: false })).toBeVisible();
  await expect(saved(account).checkpointPassed).toBe(false);
  await choose(page.getByRole("checkbox", { name: "300 і 450 Гц" }));
  await choose(page.getByRole("checkbox", { name: "200 і 400 Гц" }));
  await choose(page.getByRole("checkbox", { name: "500 і 1000 Гц" }));
  await press(page.getByRole("button", { name: "Перевірити" }).last());
  await expect.poll(() => saved(account)).toMatchObject({ checkpointPassed: true, completedAt: null });
  await noHorizontalScroll(page);
  await press(page.getByRole("button", { name: "Далі", exact: true }));

  // `complete`: only the explicit button finishes the lesson, and the bridge follows it.
  await expect(page.getByText("Наступне питання")).toHaveCount(0);
  await expect(saved(account).completedAt).toBeNull();
  await press(page.getByRole("button", { name: "Завершити урок" }));
  await expect(page.getByTestId("finish-status")).toContainText("Урок завершено.");
  await expect(page.getByText("Між 440 і 880 Гц — безліч частот.", { exact: false })).toBeVisible();
  await expect.poll(() => saved(account).completedAt).not.toBeNull();
  await noHorizontalScroll(page);
});
