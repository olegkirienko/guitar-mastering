import { expect, test, type Page } from "@playwright/test";
import { applicationOrigin, json, lessonOneCompleted, lessonOneId, lessonTwoId, mockAccount } from "./support/mock-account";

// Lesson 2 opens once Lesson 1 is completed.
async function signIn(page: Page, lessonTwo?: Parameters<typeof mockAccount>[1][string]) {
  return mockAccount(page, { [lessonOneId]: lessonOneCompleted, ...(lessonTwo ? { [lessonTwoId]: lessonTwo } : {}) });
}

type Account = Awaited<ReturnType<typeof mockAccount>>;

// The progress the mocked server holds now; saves are asynchronous, so read it through expect.poll.
function saved(account: Account) {
  return account.progress(lessonTwoId) ?? { currentStepId: "intro", completedStepIds: [] as string[], checkpointPassed: false, completedAt: null as string | null };
}

async function noHorizontalScroll(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
}

test("completes screens 0–1 through the virtual string at 320 px and resumes after reload", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  const account = await signIn(page);
  await page.goto(`${applicationOrigin}/lessons/02`);

  await expect(page.getByRole("heading", { name: "Повернімося до відкритого питання" })).toBeVisible();
  await expect(page.getByText("Крок 1 із 5")).toBeVisible();
  await page.getByRole("button", { name: "Немає гітари — відкрити віртуальну струну" }).click();

  await expect(page.getByRole("heading", { name: "Одна струна — два звуки" })).toBeFocused();
  await expect(page.getByRole("figure", { name: "Перша струна у двох станах" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Відкрита перша струна" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Та сама струна, притиснута пальцем між двома металевими поріжками ближче до корпусу" })).toBeVisible();
  const pressed = page.getByRole("button", { name: "Притиснути й смикнути" });
  await expect(pressed).toBeDisabled();
  await expect(page.getByText("Який стан тієї самої струни дав вищий звук", { exact: false })).toHaveCount(0);
  const liveResults = page.getByRole("region", { name: "Віртуальна струна" }).locator('[aria-live="polite"]');
  await expect(liveResults).toHaveCount(1);
  await page.getByRole("button", { name: "Смикнути відкриту" }).click();
  await expect(liveResults).toContainText("Відкрита струна — нижчий результат.");
  await pressed.click();
  await expect(liveResults).toContainText("Притиснута струна — вищий результат.");

  await page.getByRole("radio", { name: "Відкритий" }).check();
  await page.getByRole("button", { name: "Перевірити" }).click();
  await expect.poll(() => saved(account).completedStepIds).toEqual(["intro"]);
  await page.getByRole("radio", { name: "Притиснутий ближче до корпусу" }).check();
  await page.getByRole("button", { name: "Перевірити" }).click();
  await expect(page.getByText("На тій самій струні ми отримали два різні за висотою звуки", { exact: false })).toBeVisible();
  await expect.poll(() => saved(account)).toMatchObject({ currentStepId: "string", completedStepIds: ["intro", "string"] });
  await noHorizontalScroll(page);

  await page.reload();
  await expect(page.getByRole("heading", { name: "Одна струна — два звуки" })).toBeVisible();
  await expect(page.getByText("Який стан тієї самої струни дав вищий звук", { exact: false })).toBeVisible();
});

async function focusIsNotLost(page: Page) {
  expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe("BODY");
}

test("completes the string step on the guitar path with the keyboard only", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  const account = await signIn(page);
  await page.goto(`${applicationOrigin}/lessons/02`);

  const start = page.getByRole("button", { name: "Почати з гітарою" });
  await start.focus();
  await start.press("Enter");
  await expect(page.getByRole("heading", { name: "Одна струна — два звуки" })).toBeFocused();
  await expect(page.getByRole("img", { name: "Та сама струна, притиснута пальцем між двома металевими поріжками ближче до корпусу" })).toBeVisible();
  const guitarCard = page.getByRole("region", { name: "На гітарі" });
  await expect(guitarCard.getByText("Не крути кілки", { exact: false })).toBeVisible();
  const done = page.getByRole("button", { name: "Я послухав/ла обидва стани" });
  await done.focus();
  await done.press("Enter");

  const answer = page.getByRole("radio", { name: "Притиснутий ближче до корпусу" });
  await answer.focus();
  await answer.press("Space");
  const check = page.getByRole("button", { name: "Перевірити" });
  await check.focus();
  await check.press("Enter");
  await expect.poll(() => saved(account).completedStepIds).toEqual(["intro", "string"]);

  await noHorizontalScroll(page);
  const back = page.getByRole("button", { name: "Назад до вступу" });
  await back.focus();
  await back.press("Enter");
  await expect(page.getByRole("heading", { name: "Повернімося до відкритого питання" })).toBeFocused();
});

test("links Lesson 2 from the home page while Lesson 1 still opens Lesson 1", async ({ page }) => {
  await signIn(page);
  await page.goto(`${applicationOrigin}/`);
  await page.getByRole("link", { name: "Чому звуки бувають високими й низькими?", exact: true }).click();
  await expect(page).toHaveURL(/\/lessons\/02\/intro$/);
  await expect(page.getByRole("heading", { name: "Повернімося до відкритого питання" })).toBeVisible();
  await page.goto(`${applicationOrigin}/`);
  await page.getByRole("link", { name: "Що таке звук?", exact: true }).click();
  await expect(page).toHaveURL(/\/lessons\/01\/complete$/);
});

async function seedStep(page: Page, currentStepId: string, completedStepIds: string[]) {
  return signIn(page, { currentStepId, completedStepIds });
}

async function pressButton(page: Page, name: string) {
  const button = page.getByRole("button", { name, exact: true });
  await button.focus();
  await button.press("Enter");
}

async function answer(page: Page, group: string, choice: string) {
  const question = page.getByRole("group", { name: group });
  const radio = question.getByRole("radio", { name: choice });
  await radio.focus();
  await radio.press("Space");
  const check = question.getByRole("button", { name: "Перевірити" });
  await check.focus();
  await check.press("Enter");
}

async function installFakeAudio(page: Page) {
  await page.addInitScript(() => {
    const log: unknown[][] = [];
    (window as unknown as { __audioLog: unknown[][] }).__audioLog = log;
    class Param {
      value = 1;
      constructor(private readonly kind: string) {}
      setValueAtTime(value: number) { this.value = value; log.push([this.kind, value]); return this; }
      exponentialRampToValueAtTime(value: number) { this.value = value; log.push([this.kind, value]); return this; }
      linearRampToValueAtTime(value: number) { this.value = value; log.push([this.kind, value]); return this; }
      cancelScheduledValues() { return this; }
    }
    let nextId = 0;
    class Node { connect<T>(node: T) { return node; } disconnect() {} }
    class Source extends Node {
      id = ++nextId;
      frequency = new Param("frequency");
      type = "sine";
      buffer: unknown = null;
      onended: (() => void) | null = null;
      start() { log.push(["start", this.id]); }
      stop(time: number) { log.push(["stop", this.id, time]); }
    }
    class Gain extends Node { gain = new Param("gain"); }
    class FakeAudioContext {
      state = "suspended";
      currentTime = 0;
      sampleRate = 8000;
      destination = new Node();
      async resume() { this.state = "running"; }
      async close() { this.state = "closed"; }
      createGain() { return new Gain(); }
      createOscillator() { return new Source(); }
      createBufferSource() { return new Source(); }
      createBuffer(_channels: number, length: number) { return { getChannelData: () => new Float32Array(length) }; }
    }
    (window as unknown as { AudioContext: unknown }).AudioContext = FakeAudioContext;
  });
}

test("runs screen 2 step by step with reduced motion and the keyboard only", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const account = await seedStep(page, "repeats", ["intro", "string"]);
  await page.goto(`${applicationOrigin}/lessons/02`);

  await expect(page.getByRole("heading", { name: "Передбач і перевір" })).toBeVisible();
  await expect(page.getByText("Крок 2 із 5")).toBeVisible();
  await expect(page.getByRole("button", { name: "Покадрово: системне" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Запустити обидві доріжки" })).toHaveCount(0);

  await answer(page, "Де повторів буде більше, поки час іде однаково?", "На доріжці B");
  const nextMoment = page.getByRole("button", { name: "Наступний момент" });
  for (let moment = 0; moment < 4; moment += 1) await pressButton(page, "Наступний момент");
  const summary = page.getByRole("table", { name: "Повні повтори за той самий час" });
  await expect(summary.getByRole("cell")).toHaveText(["1", "2"]);
  await expect.poll(() => saved(account).completedStepIds).toEqual(["intro", "string"]);

  for (let moment = 4; moment < 16; moment += 1) await nextMoment.press("Enter");
  await expect(nextMoment).toBeFocused();
  await expect(nextMoment).toBeDisabled();
  await nextMoment.press("Enter");
  await expect(summary.getByRole("cell")).toHaveText(["4", "8"]);
  await pressButton(page, "Показати підсумок");
  await expect(page.getByText("A: 4 повтори; B: 8 повторів; час однаковий.", { exact: false })).toBeVisible();
  await focusIsNotLost(page);
  await expect(page.getByRole("button", { name: "Показати підсумок" })).toBeFocused();
  await expect(page.getByRole("button", { name: "Показати підсумок" })).toBeDisabled();
  await expect.poll(() => saved(account).completedStepIds).toEqual(["intro", "string", "repeats"]);

  await expect(page.getByRole("button", { name: "Показати результат" })).toHaveCount(0);
  await answer(page, "Як звучатиме рух, який повторюється частіше?", "Вище");
  await pressButton(page, "Показати результат");
  await expect(page.getByText("A сприймається нижчим; B — вищим.")).toBeVisible();
  await pressButton(page, "Далі: дамо відкриттю назву");
  await expect(page.getByRole("heading", { name: "Даємо відкриттю назви" })).toBeFocused();
});

test("finishes the animated comparison on one shared timer", async ({ page }) => {
  const account = await seedStep(page, "repeats", ["intro", "string"]);
  await page.goto(`${applicationOrigin}/lessons/02`);

  await answer(page, "Де повторів буде більше, поки час іде однаково?", "Однаково");
  await expect(page.getByRole("button", { name: "Наступний момент" })).toHaveCount(0);
  const runButton = page.getByRole("button", { name: "Запустити обидві доріжки" });
  await runButton.focus();
  await runButton.press("Enter");
  await expect(runButton).toBeDisabled();
  await expect(runButton).toBeFocused();
  await page.waitForTimeout(1500);
  const partway = await page.getByRole("table", { name: "Повні повтори за той самий час" }).getByRole("cell").nth(1).textContent();
  expect(Number(partway)).toBeGreaterThan(0);
  await runButton.press("Enter");
  await expect(runButton).toBeFocused();
  const afterExtraPress = await page.getByRole("table", { name: "Повні повтори за той самий час" }).getByRole("cell").nth(1).textContent();
  expect(Number(afterExtraPress)).toBeGreaterThanOrEqual(Number(partway));
  await expect(page.getByText("A: 4 повтори; B: 8 повторів; час однаковий.", { exact: false })).toBeVisible({ timeout: 10_000 });
  await expect.poll(() => saved(account).completedStepIds).toContain("repeats");
});

test("reveals the names before the lab and checks a predicted change on screen 3", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  const account = await seedStep(page, "frequency", ["intro", "string", "repeats"]);
  await page.goto(`${applicationOrigin}/lessons/02`);

  await expect(page.getByRole("heading", { name: "Змінюй частоту" })).toHaveCount(0);
  const physics = page.getByRole("list", { name: "Що відбувається" });
  const perception = page.getByRole("list", { name: "Що ми сприймаємо" });
  await pressButton(page, "Відкрити наступний рядок");
  await expect(physics.getByRole("listitem")).toHaveText(["Кількість повних коливань за секунду називаємо частотою."]);
  await expect(perception.getByRole("listitem")).toHaveCount(0);
  await pressButton(page, "Відкрити наступний рядок");
  await expect(physics.getByRole("listitem").nth(1)).toContainText("герц, скорочено Гц");
  await expect(perception.getByRole("listitem")).toHaveCount(0);
  await pressButton(page, "Відкрити наступний рядок");
  await expect(perception.getByRole("listitem")).toHaveText(["Те, наскільки високим або низьким ми чуємо звук, називаємо висотою звуку."]);
  await expect(physics.getByRole("listitem")).toHaveCount(2);
  await expect(page.getByText("Більша частота → вищий звук; менша частота → нижчий звук.")).toBeVisible();
  await focusIsNotLost(page);

  const output = page.locator("output");
  await expect(output).toHaveText("220 Гц");
  const lowerButton = page.getByRole("button", { name: "Менше" });
  await expect(lowerButton).toBeDisabled();
  await lowerButton.focus();
  await lowerButton.press("Enter");
  await expect(lowerButton).toBeFocused();
  await expect(output).toHaveText("220 Гц");
  await pressButton(page, "Більше");
  await expect(output).toHaveText("330 Гц");
  const lab = page.getByRole("region", { name: "Змінюй частоту" });
  await expect(lab.getByRole("button", { name: "Перевірити" })).toBeDisabled();
  await expect.poll(() => saved(account).completedStepIds).not.toContain("frequency");
  const higher = lab.getByRole("radio", { name: "вищим" });
  await higher.focus();
  await higher.press("Space");
  await lab.getByRole("button", { name: "Перевірити" }).press("Enter");
  await expect(lab.getByTestId("lab-feedback")).toHaveText("220 → 330: за секунду повторів стало більше, тому звук став вищим.");
  await expect(page.getByRole("slider", { name: "Частота" })).toBeFocused();
  await expect(lab.getByTestId("lab-feedback")).toHaveAttribute("role", "status");
  await expect.poll(() => saved(account).completedStepIds).toContain("frequency");

  const slider = page.getByRole("slider", { name: "Частота" });
  await slider.focus();
  await slider.press("ArrowRight");
  await expect(output).toHaveText("440 Гц");
  await expect(slider).toHaveAttribute("aria-valuetext", "440 Гц");
  const higherButton = page.getByRole("button", { name: "Більше" });
  await higherButton.focus();
  await higherButton.press("Enter");
  await expect(higherButton).toBeFocused();
  await expect(higherButton).toBeDisabled();
  await expect(output).toHaveText("440 Гц");
  await noHorizontalScroll(page);
});

test("separates loudness from pitch on screen 4 without audio", async ({ page }) => {
  const account = await seedStep(page, "loudness", ["intro", "string", "repeats", "frequency"]);
  await page.goto(`${applicationOrigin}/lessons/02`);

  await expect(page.getByText("Перед прослуховуванням зроби гучність пристрою комфортною", { exact: false })).toBeVisible();
  await expect(page.getByText("Частота: 330 Гц")).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Послухати голосніше" })).toHaveCount(0);
  await answer(page, "Ми зробили той самий тон голоснішим. Чи змінилася його висота?", "Так, звук став вищим");
  await expect(page.getByText("Рівень гучності змінився; частота 330 Гц в обох; висота та сама.")).toBeVisible();
  await expect.poll(() => saved(account).completedStepIds).toContain("loudness");
});

test("explains missing and blocked audio and keeps the text path", async ({ page }) => {
  await page.addInitScript(() => { delete (window as unknown as { AudioContext?: unknown }).AudioContext; });
  await signIn(page);
  await page.goto(`${applicationOrigin}/lessons/02`);
  await pressButton(page, "Звук: вимкнено");
  await expect(page.getByText("Звук недоступний у цьому браузері.", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Звук: вимкнено" })).toHaveAttribute("aria-pressed", "false");

  const blocked = await page.context().newPage();
  await blocked.addInitScript(() => {
    class BlockedAudioContext {
      state = "suspended";
      async resume() { throw new DOMException("blocked", "NotAllowedError"); }
      async close() {}
    }
    (window as unknown as { AudioContext: unknown }).AudioContext = BlockedAudioContext;
  });
  await signIn(blocked);
  await blocked.goto(`${applicationOrigin}/lessons/02`);
  await pressButton(blocked, "Звук: вимкнено");
  await expect(blocked.getByText("Браузер не дозволив увімкнути звук.", { exact: false })).toBeVisible();
  await pressButton(blocked, "Немає гітари — відкрити віртуальну струну");
  await expect(blocked.getByRole("heading", { name: "Одна струна — два звуки" })).toBeVisible();
});

test("plays capped tones one at a time and silences them when the tab is hidden", async ({ page }) => {
  await installFakeAudio(page);
  await seedStep(page, "repeats", ["intro", "string"]);
  await page.goto(`${applicationOrigin}/lessons/02`);

  await pressButton(page, "Звук: вимкнено");
  await expect(page.getByRole("button", { name: "Звук: увімкнено" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Показувати покадрово" }).click();
  await answer(page, "Де повторів буде більше, поки час іде однаково?", "На доріжці A");
  await pressButton(page, "Показати підсумок");
  await expect(page.getByRole("button", { name: "Послухати A" })).toHaveCount(0);
  await answer(page, "Як звучатиме рух, який повторюється частіше?", "Не знаю");
  await pressButton(page, "Послухати A");
  await pressButton(page, "Послухати B");
  const log = await page.evaluate(() => (window as unknown as { __audioLog: unknown[][] }).__audioLog);
  const starts = log.filter(([kind]) => kind === "start").map(([, id]) => id);
  expect(starts).toEqual([1, 2]);
  const earlyStopOfFirst = log.findIndex(([kind, id, time]) => kind === "stop" && id === 1 && (time as number) < 0.1);
  const startOfSecond = log.findIndex(([kind, id]) => kind === "start" && id === 2);
  expect(earlyStopOfFirst).toBeGreaterThan(-1);
  expect(earlyStopOfFirst).toBeLessThan(startOfSecond);
  const gains = log.filter(([kind]) => kind === "gain").map(([, value]) => value as number);
  expect(Math.max(...gains)).toBeLessThanOrEqual(0.12);

  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  const afterHide = await page.evaluate(() => (window as unknown as { __audioLog: unknown[][] }).__audioLog);
  expect(afterHide.some(([kind, id, time]) => kind === "stop" && id === 2 && (time as number) < 0.1)).toBe(true);
});

test("offers listening in the lab only for a value that was predicted and checked", async ({ page }) => {
  await installFakeAudio(page);
  await seedStep(page, "frequency", ["intro", "string", "repeats"]);
  await page.goto(`${applicationOrigin}/lessons/02`);

  await pressButton(page, "Звук: вимкнено");
  for (let row = 0; row < 3; row += 1) await pressButton(page, "Відкрити наступний рядок");
  const lab = page.getByRole("region", { name: "Змінюй частоту" });
  await expect(lab.getByRole("button", { name: "Послухати" })).toBeVisible();
  await pressButton(page, "Більше");
  await expect(lab.getByRole("button", { name: "Послухати" })).toHaveCount(0);
  await lab.getByRole("radio", { name: "вищим" }).check();
  await lab.getByRole("button", { name: "Перевірити" }).click();
  await expect(lab.getByRole("button", { name: "Послухати" })).toBeVisible();
});

async function moveCardTo(page: Page, card: string, direction: "Раніше" | "Пізніше", times: number) {
  for (let move = 0; move < times; move += 1) {
    const button = page.getByRole("button", { name: `${direction}: ${card}` });
    await button.focus();
    await button.press("Enter");
    await expect(page.getByRole("button", { name: `${direction}: ${card}` })).toBeFocused();
  }
}

test("completes the whole lesson at 320 px with the keyboard only and no audio", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  const account = await signIn(page);
  await page.goto(`${applicationOrigin}/lessons/02`);

  await pressButton(page, "Показувати покадрово");
  await pressButton(page, "Немає гітари — відкрити віртуальну струну");
  await pressButton(page, "Смикнути відкриту");
  await pressButton(page, "Притиснути й смикнути");
  await answer(page, "Який стан тієї самої струни дав вищий звук: відкритий чи притиснутий ближче до корпусу?", "Притиснутий ближче до корпусу");
  await pressButton(page, "Далі: порахуємо повтори");

  await answer(page, "Де повторів буде більше, поки час іде однаково?", "На доріжці B");
  await pressButton(page, "Показати підсумок");
  await pressButton(page, "Далі: дамо відкриттю назву");

  for (let row = 0; row < 3; row += 1) await pressButton(page, "Відкрити наступний рядок");
  await pressButton(page, "Більше");
  const lab = page.getByRole("region", { name: "Змінюй частоту" });
  const higher = lab.getByRole("radio", { name: "вищим" });
  await higher.focus();
  await higher.press("Space");
  await lab.getByRole("button", { name: "Перевірити" }).press("Enter");
  await pressButton(page, "Далі: висота і гучність");

  await answer(page, "Ми зробили той самий тон голоснішим. Чи змінилася його висота?", "Ні, висота та сама");
  await pressButton(page, "Далі: повернемося до струни");
  await expect(page.getByText("Крок 4 із 5")).toBeVisible();

  await answer(page, "У якому стані коливання мають повторюватися частіше?", "У притиснутому ближче до корпусу");
  await pressButton(page, "Я послухав/ла обидва стани");
  await expect(page.getByText("ще не заповнено")).toHaveCount(2);
  await answer(page, "Притиснута струна звучала вище. Що тепер можна сказати про кількість її коливань за секунду?", "Коливання повторюються частіше — частота більша");
  await expect(page.getByText("ще не заповнено")).toHaveCount(0);
  await pressButton(page, "Далі: перевірка");

  await expect(page.getByText("500 герців — 500 повних коливань за секунду")).toBeAttached();
  await answer(page, "Де за секунду більше повних коливань?", "500 герців");
  await answer(page, "Який звук буде вищим?", "500 герців");
  await moveCardTo(page, "вищий звук", "Пізніше", 2);
  await expect(page.getByTestId("chain-move-status")).toHaveText("«вищий звук» — тепер на місці 3 із 3.");
  await expect(page.getByRole("listitem").filter({ hasText: "1. більше повних коливань за секунду" })).toHaveCount(1);
  await pressButton(page, "Перевірити порядок");
  await expect(page.getByTestId("chain-status")).toBeFocused();
  await expect(page.getByTestId("chain-status")).toContainText("Так: більше повних коливань за секунду → більша частота → вищий звук.");
  await answer(page, "500 герців відтворили тихіше, але число герців не змінили. Що сталося з висотою?", "Лишилася тією самою");
  await expect(page.getByText("Перевірку пройдено.")).toBeVisible();
  await expect.poll(() => saved(account)).toMatchObject({ checkpointPassed: true, completedAt: null });
  await pressButton(page, "Далі: підсумок");

  await expect(page.getByText("Крок 5 із 5")).toBeVisible();
  await pressButton(page, "Завершити урок");
  await expect(page.getByTestId("finish-status")).toBeFocused();
  await expect(page.getByTestId("finish-status")).toContainText("Урок завершено.");
  await expect(page.getByText("Що можна змінити в самій струні", { exact: false })).toBeVisible();
  await expect.poll(() => saved(account).completedStepIds).toEqual(["intro", "string", "repeats", "frequency", "loudness", "guitar", "checkpoint", "complete"]);
  expect(Number.isFinite(Date.parse(saved(account).completedAt ?? ""))).toBe(true);
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  await noHorizontalScroll(page);

  await page.reload();
  await expect(page.getByText("Урок завершено.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Завершити урок" })).toHaveCount(0);
});

test("offers the explanation after repeated wrong orders and still requires the counterexample", async ({ page }) => {
  const account = await seedStep(page, "checkpoint", ["intro", "string", "repeats", "frequency", "loudness", "guitar"]);
  await page.goto(`${applicationOrigin}/lessons/02`);

  await pressButton(page, "Перевірити порядок");
  await expect(page.getByTestId("chain-status")).toContainText("Спочатку назви спостереження, потім фізичну величину, потім те, що ми чуємо.");
  await expect(page.getByText("↓ цей зв’язок правильний")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Показати й пояснити" })).toHaveCount(0);
  await pressButton(page, "Перевірити порядок");
  await pressButton(page, "Показати й пояснити");
  await expect(page.getByTestId("chain-status")).toBeFocused();
  await expect(page.getByTestId("chain-status")).toContainText("Більшу частоту ми чуємо як вищий звук.");
  await expect.poll(() => saved(account).checkpointPassed).toBe(false);

  await answer(page, "500 герців відтворили тихіше, але число герців не змінили. Що сталося з висотою?", "Стала нижчою");
  await expect(page.getByText("Гучність змінилася, але чи змінилося число Гц?").first()).toBeVisible();
  await expect.poll(() => saved(account).checkpointPassed).toBe(false);
  await answer(page, "500 герців відтворили тихіше, але число герців не змінили. Що сталося з висотою?", "Лишилася тією самою");
  await expect.poll(() => saved(account).checkpointPassed).toBe(true);
});

test("applies the discovery on screen 5 through the ready text result", async ({ page }) => {
  const account = await seedStep(page, "guitar", ["intro", "string", "repeats", "frequency", "loudness"]);
  await page.goto(`${applicationOrigin}/lessons/02`);

  await expect(page.getByRole("button", { name: "Не почув/ла різниці" })).toHaveCount(0);
  await answer(page, "У якому стані коливання мають повторюватися частіше?", "Не знаю");
  await expect(page.getByRole("figure", { name: "Перша струна у двох станах" })).toBeVisible();
  await pressButton(page, "Струна дзижчить");
  await expect(page.getByText("Готовий результат: притиснута струна звучить вище, ніж відкрита.")).toBeVisible();
  await answer(page, "Притиснута струна звучала вище. Що тепер можна сказати про кількість її коливань за секунду?", "Кількість коливань не змінилася");
  await expect.poll(() => saved(account).completedStepIds).not.toContain("guitar");
  await answer(page, "Притиснута струна звучала вище. Що тепер можна сказати про кількість її коливань за секунду?", "Коливання повторюються частіше — частота більша");
  await expect(page.getByText("Причину зміни дослідимо окремо.", { exact: false })).toBeVisible();
  await expect.poll(() => saved(account).completedStepIds).toContain("guitar");
});

test("repairs corrupt server progress and keeps a valid completion", async ({ page: completed }) => {
  await signIn(completed, {
    currentStepId: "no-such-step",
    completedStepIds: ["intro", "bogus"],
    checkpointPassed: false,
    completedAt: "2026-09-30T12:00:00.000Z",
  });
  await completed.goto(`${applicationOrigin}/lessons/02`);
  await expect(completed.getByText("Урок завершено.")).toBeVisible();
});
