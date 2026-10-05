import { expect, test, type Locator, type Page } from "@playwright/test";
import { applicationOrigin, lessonFourId, lessonOneCompleted, lessonOneId, lessonThreeCompleted, lessonThreeId, lessonTwoCompleted, lessonTwoId, mockAccount } from "./support/mock-account";

type Account = Awaited<ReturnType<typeof mockAccount>>;

const opened = { [lessonOneId]: lessonOneCompleted, [lessonTwoId]: lessonTwoCompleted, [lessonThreeId]: lessonThreeCompleted };

function saved(account: Account) {
  return account.progress(lessonFourId) ?? { currentStepId: "intro", completedStepIds: [] as string[], checkpointPassed: false, completedAt: null as string | null };
}

// Every choice in the lesson is reachable from the keyboard, and the sticky header
// never gets in the way of one.
async function choose(radio: Locator) {
  await radio.focus();
  await radio.press("Space");
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

test("adds the faster waves, names them and reaches the guitar, with the keyboard, without audio, at 320 px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  const account = await mockAccount(page, { ...opened, [lessonFourId]: { currentStepId: "overtones", completedStepIds: ["intro", "shape"] } });
  await page.goto(`${applicationOrigin}/lessons/04/overtones`);

  await expect(page.getByRole("heading", { name: "Хвилі всередині хвилі" })).toBeVisible();
  // The lab waits for the prediction, and every name waits for the lab.
  await expect(page.getByRole("heading", { name: "Дослід: додай швидші хвилі" })).toHaveCount(0);
  for (const term of ["обертон", "спектр", "атака", "згасання"]) {
    await expect(page.getByText(new RegExp(term, "i"))).toHaveCount(0);
  }

  const samePitch = page.getByRole("radio", { name: "Тієї самої висоти, але іншим" });
  await samePitch.focus();
  await samePitch.press("Space");
  await page.getByRole("button", { name: "Перевірити" }).press("Enter");
  await expect(page.getByRole("heading", { name: "Дослід: додай швидші хвилі" })).toBeVisible();
  // The fundamental is in the picture but has no switch: it is what the pitch is.
  await expect(page.getByText("основна хвиля, звучить завжди")).toBeVisible();
  await expect(page.getByRole("radiogroup", { name: "×1 · 220 Гц" })).toHaveCount(0);
  await expect(page.getByText("Повторів: 3; обертонів немає")).toBeVisible();
  await noHorizontalScroll(page);

  // Each wave is its own single-choice group, so an arrow key changes the level.
  const second = page.getByRole("radiogroup", { name: "×2 · 440 Гц" });
  await second.getByRole("radio", { name: "немає" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(second.getByRole("radio", { name: "сильний" })).toBeChecked();
  await expect(page.getByText("Хвиля ×2: сильний. Висота та сама — 220 Гц.")).toBeVisible();
  // One wave is not the whole experiment: the names are still out of reach.
  await expect(page.getByRole("heading", { name: "Основна частота й обертони" })).toHaveCount(0);

  const third = page.getByRole("radiogroup", { name: "×3 · 660 Гц" });
  await third.getByRole("radio", { name: "немає" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByText("Повторів: 3; обертони: ×2 сильний, ×3 сильний")).toBeVisible();

  await expect(page.getByRole("heading", { name: "Основна частота й обертони" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Звідки обертони в струні?" })).toBeVisible();
  await expect(page.getByText("×2 · 440 Гц — дві половини")).toBeVisible();
  await expect(page.getByText("Ледь торкнись першої струни точно посередині", { exact: false })).toBeVisible();
  await expect.poll(() => saved(account)).toMatchObject({ completedStepIds: ["intro", "shape", "overtones"] });
  await noHorizontalScroll(page);
});

test("names the spectrum after the first change and finishes both predictions, at 320 px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  const account = await mockAccount(page, { ...opened, [lessonFourId]: { currentStepId: "spectrum", completedStepIds: ["intro", "shape", "overtones"] } });
  await page.goto(`${applicationOrigin}/lessons/04/spectrum`);

  await expect(page.getByRole("heading", { name: "Лабораторія звуку" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Спектр", exact: true })).toHaveCount(0);
  // The drawing is decorative, so the same three numbers are in a real table.
  await expect(page.getByRole("columnheader", { name: "Кратність" })).toBeVisible();
  await expect(page.getByRole("rowheader", { name: "×4" })).toBeVisible();

  const fourth = page.getByRole("radiogroup", { name: "×4 · 880 Гц" });
  const fifth = page.getByRole("radiogroup", { name: "×5 · 1100 Гц" });
  // Three levels on one row at 320 px.
  const tops = await fourth.getByRole("radio").evaluateAll((nodes) => nodes.map((node) => Math.round(node.getBoundingClientRect().top)));
  expect(new Set(tops).size).toBe(1);
  await noHorizontalScroll(page);

  // The lab starts as a plucked string, so this is a real change: the name follows it.
  await choose(fourth.getByRole("radio", { name: "сильний" }));
  await expect(page.getByRole("heading", { name: "Спектр", exact: true })).toBeVisible();
  await expect(page.getByText("Обертон ×4: сильний. Висота та сама — 220 Гц.")).toBeVisible();

  await choose(page.getByRole("radio", { name: "Яскравішим, висота та сама" }));
  await page.getByRole("button", { name: "Перевірити" }).first().press("Enter");
  await expect(page.getByText("Постав ×4 і ×5 на «сильний»", { exact: false })).toBeVisible();

  await choose(fifth.getByRole("radio", { name: "сильний" }));
  await expect(page.getByText("Верхні обертони сильніші", { exact: false })).toBeVisible();

  await choose(page.getByRole("radio", { name: "Чистий тон тієї самої висоти" }));
  await page.getByRole("button", { name: "Перевірити" }).last().press("Enter");
  await page.getByRole("button", { name: "чистий тон" }).press("Enter");
  await expect(page.getByText("Лишилася сама основна частота", { exact: false })).toBeVisible();
  await expect.poll(() => saved(account)).toMatchObject({ completedStepIds: ["intro", "shape", "overtones", "spectrum"] });

  await expect(page.getByRole("heading", { name: "Де смикати струну" })).toBeVisible();
  // «Часткові» and «гармоніки» stay folded away until the learner asks for them.
  const deeper = page.getByText("Копнути глибше");
  await expect(page.getByText("гармоніками", { exact: false })).toBeHidden();
  await deeper.focus();
  await deeper.press("Enter");
  await expect(page.getByText("гармоніками", { exact: false })).toBeVisible();
  await noHorizontalScroll(page);
});

test("offers listening only once audio is on and plays one sound at a time", async ({ page }) => {
  const account = await mockAccount(page, opened, { audioEnabled: true });
  await page.goto(`${applicationOrigin}/lessons/04/intro`);
  await expect(page.getByRole("button", { name: "Послухати" })).toHaveCount(3);
  await page.getByRole("button", { name: "Звук: увімкнено" }).click();
  await expect(page.getByRole("button", { name: "Послухати" })).toHaveCount(0);
  await expect.poll(() => account.preferences().audioEnabled).toBe(false);
});
