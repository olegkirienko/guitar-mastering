import { expect, test, type Locator, type Page } from "@playwright/test";
import { applicationOrigin, lessonFiveId, lessonFourCompleted, lessonFourId, lessonOneCompleted, lessonOneId, lessonThreeCompleted, lessonThreeId, lessonTwoCompleted, lessonTwoId, mockAccount } from "./support/mock-account";

type Account = Awaited<ReturnType<typeof mockAccount>>;

const stageDone = {
  [lessonOneId]: lessonOneCompleted,
  [lessonTwoId]: lessonTwoCompleted,
  [lessonThreeId]: lessonThreeCompleted,
  [lessonFourId]: lessonFourCompleted,
};

function saved(account: Account) {
  return account.progress(lessonFiveId) ?? { currentStepId: "intro", completedStepIds: [] as string[], checkpointPassed: false, completedAt: null as string | null };
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

// Each question is its own fieldset, so «Перевірити» is always the one of that question.
function question(page: Page, text: string) {
  return page.getByRole("group").filter({ hasText: text });
}

async function answer(page: Page, text: string, choice: string) {
  const fieldset = question(page, text);
  await choose(fieldset.getByRole("radio", { name: choice }));
  await press(fieldset.getByRole("button", { name: "Перевірити" }));
}

function lab(page: Page, title: string) {
  return page.getByRole("region", { name: title });
}

async function moveLater(page: Page, label: string, times: number) {
  for (let index = 0; index < times; index += 1) {
    await press(page.getByRole("button", { name: `Перемістити «${label}» пізніше` }));
  }
}

async function noHorizontalScroll(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
}

test("keeps Lesson 5 closed until Lesson 4 is completed", async ({ page }) => {
  await mockAccount(page, {
    [lessonOneId]: lessonOneCompleted,
    [lessonTwoId]: lessonTwoCompleted,
    [lessonThreeId]: lessonThreeCompleted,
    [lessonFourId]: { currentStepId: "checkpoint", completedStepIds: ["intro", "shape"], checkpointPassed: true },
  });
  for (const path of ["/lessons/05", "/lessons/05/path"]) {
    await page.goto(`${applicationOrigin}${path}`);
    await expect(page).toHaveURL(`${applicationOrigin}/course`);
  }
});

test("solves the final lab with the keyboard, without audio, with reduced motion, at 320 px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const account = await mockAccount(page, stageDone);
  await page.goto(`${applicationOrigin}/lessons/05`);

  // `intro`: the four tasks are visible from the start, and nothing is checked here.
  await expect(page.getByRole("heading", { name: "Що ти вже вмієш" })).toBeVisible();
  await expect(page.getByText("Нових слів тут не буде", { exact: false })).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: "Підняти висоту звуку" })).toBeVisible();
  // Audio is off by default, so the lesson never offers a sound it cannot play.
  await expect(page.getByRole("button", { name: "Послухати" })).toHaveCount(0);
  await noHorizontalScroll(page);
  await press(page.getByRole("button", { name: "Почати" }));
  await expect.poll(() => saved(account)).toMatchObject({ completedStepIds: ["intro"] });

  // Task 1: the prediction opens the lab, the locked factor is named, and the check
  // refuses an untouched start before accepting a shorter vibrating part.
  await expect(page.getByRole("heading", { name: "Зроби звук вищим, не чіпаючи густину" })).toBeVisible();
  await expect(lab(page, "Задача 1. Зроби звук вищим, не чіпаючи густину")).toHaveCount(0);
  await answer(page, "Скільки чинників лишається", "Два: довжина частини, що коливається, і натяг.");
  const taskOne = lab(page, "Задача 1. Зроби звук вищим, не чіпаючи густину");
  await expect(taskOne).toContainText("Частота: 147 Гц");
  await expect(taskOne.getByText("густина заблокована: струна лишається найважчою")).toBeVisible();
  await expect(taskOne.getByRole("radio", { name: "найважча" })).toBeDisabled();
  await press(taskOne.getByRole("button", { name: "Перевірити" }));
  await expect(taskOne.getByText("Частота поки та сама, 147 Гц", { exact: false })).toBeVisible();
  await choose(taskOne.getByRole("radio", { name: "½ довжини" }));
  await expect(taskOne).toContainText("Частота: 220 Гц");
  await press(taskOne.getByRole("button", { name: "Перевірити" }));
  await expect(page.getByText("Виконано: звук вищий, а густина та сама.")).toBeVisible();
  await expect(page.getByText("Висота зросла, а густина та сама", { exact: false })).toBeVisible();
  await expect.poll(() => saved(account).completedStepIds).toContain("higher");
  await noHorizontalScroll(page);
  await press(page.getByRole("button", { name: "Далі: задача 2" }));

  // Task 2: the other locked factor, and the second of its two routes.
  await answer(page, "Що опустить висоту?", "Відпустити натяг або взяти важчу струну.");
  const taskTwo = lab(page, "Задача 2. Зроби звук нижчим, не чіпаючи довжину");
  await expect(taskTwo).toContainText("Частота: 880 Гц");
  await expect(taskTwo.getByRole("radio", { name: "½ довжини" })).toBeDisabled();
  await choose(taskTwo.getByRole("radio", { name: "важча", exact: true }));
  await expect(taskTwo).toContainText("Частота: 587 Гц");
  await press(taskTwo.getByRole("button", { name: "Перевірити" }));
  await expect(page.getByText("Виконано: звук нижчий, а довжина та сама.")).toBeVisible();
  await expect.poll(() => saved(account).completedStepIds).toContain("lower");
  await press(page.getByRole("button", { name: "Далі: той самий звук" }));

  // Task 3: both sounds are described in words, so the step works with audio off.
  await expect(page.getByRole("heading", { name: "Висота та сама — звук інший" })).toBeVisible();
  await expect(page.getByText("Основна частота обох — 440 Гц.")).toBeVisible();
  await expect(page.getByText("усі чотири обертони сильні", { exact: false })).toBeVisible();
  await answer(page, "Що в цих двох звуках однакове", "Різна гучність.");
  await expect(page.getByText("Гучність тут однакова", { exact: false })).toBeVisible();
  await expect(saved(account).completedStepIds).not.toContain("timbre");
  await answer(page, "Що в цих двох звуках однакове", "Однакова основна частота, тому однакова висота; різний спектр, тому різний тембр.");
  await answer(page, "Що з цього змінює саме висоту?", "Як часто коливається струна: довжина частини, що коливається, натяг і густина.");
  await expect(page.getByText("Висоту задає основна частота.", { exact: false })).toBeVisible();
  await expect.poll(() => saved(account).completedStepIds).toContain("timbre");
  await press(page.getByRole("button", { name: "Далі: шлях звуку" }));

  // Task 4: the chain is rebuilt with the move buttons, then the three questions.
  await expect(page.getByRole("heading", { name: "Поясни шлях" })).toBeVisible();
  await press(page.getByRole("button", { name: "Перевірити порядок" }));
  await expect(page.getByText("Знайдено перший розрив.")).toBeVisible();
  await moveLater(page, "Зміна у повітрі біжить як звукова хвиля", 2);
  await moveLater(page, "Мозок чує звук", 4);
  await moveLater(page, "Зміна у повітрі біжить як звукова хвиля", 1);
  await press(page.getByRole("button", { name: "Перевірити порядок" }));
  await expect(page.getByText("Причинний порядок відновлено.")).toBeVisible();
  await expect(question(page, "У якій ланці вирішується висота?")).toHaveCount(0);
  await answer(page, "Що саме долітає до вуха?", "Зміна у повітрі — звукова хвиля.");
  await expect(page.getByText("Ти зібрав/ла шлях звуку разом із висотою й тембром.")).toBeVisible();
  await answer(page, "У якій ланці вирішується висота?", "На струні: від того, як часто вона коливається.");
  await expect(saved(account).completedStepIds).not.toContain("path");
  await answer(page, "А в якій ланці вирішується тембр?", "Теж на струні: які обертони сильні й як звук починається та згасає.");
  await expect(page.getByText("І висоту, і тембр вирішує струна.", { exact: false })).toBeVisible();
  await expect.poll(() => saved(account)).toMatchObject({ checkpointPassed: true, completedAt: null });
  await noHorizontalScroll(page);
  await press(page.getByRole("button", { name: "Далі: підсумок" }));

  // `complete`: only the explicit button closes Stage I, and the bridge follows it.
  await expect(page.getByRole("heading", { name: "Етап I зібрано" })).toBeVisible();
  await expect(page.getByText("струна → коливання → повітря → звукова хвиля → вухо → мозок")).toBeVisible();
  await expect(page.getByText("Наступне питання")).toHaveCount(0);
  await expect(saved(account).completedAt).toBeNull();
  await press(page.getByRole("button", { name: "Завершити етап I" }));
  await expect(page.getByTestId("finish-status")).toContainText("Етап I завершено.");
  await expect(page.getByText("обидва ці звуки називають однаково — A", { exact: false })).toBeVisible();
  await expect.poll(() => saved(account).completedAt).not.toBeNull();
  await expect.poll(() => saved(account).completedStepIds).toContain("complete");
  await noHorizontalScroll(page);

  // Nothing of Stage II leaked into the lesson, and no unseen word stands in for it.
  const text = await page.locator("body").innerText();
  for (const word of ["нота", "октав", "середовищ", "збуренн"]) expect(text.toLowerCase()).not.toContain(word);
  await press(page.getByRole("link", { name: "До списку уроків" }));
  await expect(page).toHaveURL(`${applicationOrigin}/course`);
});
