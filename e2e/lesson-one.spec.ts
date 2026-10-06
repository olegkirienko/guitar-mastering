import { expect, test, type Page } from "@playwright/test";
import { applicationOrigin, mockAccount } from "./support/mock-account";

async function openLesson(page: Page, reducedMotion: boolean) {
  await page.emulateMedia({ reducedMotion: reducedMotion ? "reduce" : "no-preference" });
  await mockAccount(page);
  await page.goto(`${applicationOrigin}/lessons/01`);
  await page.getByRole("button", { name: "Почати дослід" }).click();
}

async function savePrediction(page: Page, choice: string) {
  await page.getByRole("radio", { name: choice }).check();
  await page.getByRole("button", { name: "Зберегти прогноз" }).click();
}

async function finishStringStaticly(page: Page) {
  await page.getByRole("button", { name: "Наступний кадр" }).click();
  await savePrediction(page, "Звук швидко стихне");
  await page.getByRole("button", { name: "Наступний кадр" }).click();
  await page.getByRole("button", { name: "Зупинити струну" }).click();
}

async function finishAirStaticly(page: Page) {
  await savePrediction(page, "Кожна ділянка трохи рухнеться, а зміна передасться далі");
  for (let index = 0; index < 3; index += 1) await page.getByRole("button", { name: "Далі", exact: true }).click();
  await page.getByRole("button", { name: "Завершити перегляд" }).click();
  await page.getByRole("radio", { name: "Зміна у повітрі" }).check();
  await page.getByRole("button", { name: "Перевірити" }).click();
}

async function openCheckpoint(page: Page) {
  await openLesson(page, true);
  await finishStringStaticly(page);
  await page.getByRole("button", { name: "Дослідити рух у повітрі" }).click();
  await finishAirStaticly(page);
  await page.getByRole("button", { name: "Зібрати шлях звуку" }).click();
}

const chainLinks = ["Струну смикнули — вона коливається", "Коливання штовхають сусіднє повітря", "Зміна у повітрі біжить як звукова хвиля", "Хвиля досягає вуха", "Ми сприймаємо звук"];

async function attach(page: Page, label: string) {
  await page.getByRole("button", { name: label }).click();
}

test("virtual string: pluck, pause, resume, and stop with state labels", async ({ page }) => {
  await openLesson(page, false);
  await expect(page.getByText("Струна поки нерухома, звуку немає.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Пауза" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Продовжити" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Зупинити струну" })).toBeDisabled();
  await expect(page.getByText("Спочатку смикни струну.")).toBeVisible();

  await page.getByRole("button", { name: "Смикнути" }).click();
  await expect(page.getByText("Струна рухається туди-назад; поки вона рухається, звук триває й поступово стихає.")).toBeVisible();
  await expect(page.getByText("Зроби й збережи прогноз, потім смикни струну ще раз.")).toBeVisible();

  await page.getByRole("button", { name: "Пауза" }).click();
  await expect(page.getByText("Показ на паузі: кадр струни зафіксовано.", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Продовжити" }).click();
  await expect(page.getByText("Струна рухається туди-назад; поки вона рухається", { exact: false })).toBeVisible();

  await page.getByRole("button", { name: "Швидкість: 1×" }).click();
  await expect(page.getByRole("button", { name: "Швидкість: повільно" })).toBeVisible();

  await savePrediction(page, "Звук швидко стихне");
  await page.getByRole("button", { name: "Смикнути" }).click();
  await page.getByRole("button", { name: "Зупинити струну" }).click();
  await expect(page.getByText("Струну зупинено — вона повернулася до звичного положення, а звук швидко стихає.")).toBeVisible();
  await expect(page.getByText("Твій прогноз справдився.")).toBeVisible();
  await expect(page.getByText("Струна зупинена й лежить на прямій звичного положення.")).toBeAttached();
  await expect(page.getByRole("button", { name: "Дослідити рух у повітрі" })).toBeVisible();
});

test("virtual string: frame mode with reduced motion", async ({ page }) => {
  await openLesson(page, true);
  await expect(page.getByText("покадровий режим", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Спочатку покажи кадр руху струни.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Попередній кадр" })).toBeDisabled();

  await page.getByRole("button", { name: "Наступний кадр" }).click();
  await expect(page.getByText("Кадр 1 із 3.")).toBeVisible();
  await page.getByRole("button", { name: "Наступний кадр" }).click();
  await expect(page.getByText("Кадр 2 із 3.")).toBeVisible();
  await page.getByRole("button", { name: "Попередній кадр" }).click();
  await expect(page.getByText("Кадр 1 із 3.")).toBeVisible();

  await page.getByRole("radio", { name: "Рухається туди-назад" }).check();
  await page.getByRole("button", { name: "Перевірити" }).click();
  await expect(page.getByText("Так.")).toBeVisible();

  await savePrediction(page, "Звук швидко стихне");
  await page.getByRole("button", { name: "Наступний кадр" }).click();
  await page.getByRole("button", { name: "Зупинити струну" }).click();
  await expect(page.getByText("Струну зупинено", { exact: false })).toBeVisible();
  await expect(page.getByText("Мій прогноз")).toBeVisible();
});

test("propagation lab: prediction, frames with reduced motion, observation, reveal", async ({ page }) => {
  await openLesson(page, true);
  await finishStringStaticly(page);
  await page.getByRole("button", { name: "Дослідити рух у повітрі" }).click();

  await expect(page.getByText("Лабораторія поширення звуку")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Зберегти прогноз" })).toBeDisabled();
  await savePrediction(page, "Кожна ділянка трохи рухнеться, а зміна передасться далі");
  await expect(page.getByText("Прогноз збережено.")).toBeVisible();
  await expect(page.getByText("Лабораторія поширення звуку")).toBeVisible();

  await expect(page.getByText("Кадр 1 із 4.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Назад" })).toBeDisabled();
  await expect(page.locator("#propagation-description")).toHaveText("Струна рухається навколо свого положення спокою.");
  await page.getByRole("button", { name: "Далі", exact: true }).click();
  await expect(page.getByText("Кадр 2 із 4.")).toBeVisible();
  await page.getByRole("button", { name: "Далі", exact: true }).click();
  await page.getByRole("button", { name: "Далі", exact: true }).click();
  await expect(page.getByText("Кадр 4 із 4.")).toBeVisible();
  await expect(page.locator("#propagation-description")).toHaveText("Зміна досягла вуха й трохи рухнула барабанну перетинку.");
  await expect(page.getByRole("radio", { name: "Зміна у повітрі" })).toHaveCount(0);

  await page.getByRole("button", { name: "Завершити перегляд" }).click();
  await expect(page.getByRole("button", { name: "Кадри переглянуто" })).toBeDisabled();
  await page.getByRole("radio", { name: "Смугаста ділянка повітря" }).check();
  await page.getByRole("button", { name: "Перевірити" }).click();
  await expect(page.getByText("Це припущення можна перевірити.")).toBeVisible();
  await expect(page.getByText("Відкриття: звукова хвиля")).toHaveCount(0);
  await page.getByRole("radio", { name: "Зміна у повітрі" }).check();
  await page.getByRole("button", { name: "Перевірити" }).click();
  await expect(page.getByText("Відкриття: звукова хвиля")).toBeVisible();
  await expect(page.getByRole("button", { name: "Зібрати шлях звуку" })).toBeVisible();
});

test("propagation lab: timed run, pause, and stopping the source with reduced motion off", async ({ page }) => {
  await openLesson(page, false);
  await page.getByRole("button", { name: "Смикнути" }).click();
  await savePrediction(page, "Звук швидко стихне");
  await page.getByRole("button", { name: "Смикнути" }).click();
  await page.getByRole("button", { name: "Зупинити струну" }).click();
  await page.getByRole("button", { name: "Дослідити рух у повітрі" }).click();

  await savePrediction(page, "Не впевнений/а");
  await expect(page.locator("#propagation-description")).toHaveText("Струна, корпус, ділянки повітря та вухо перебувають у спокої.");
  await page.getByRole("button", { name: "Відтворити" }).click();
  await page.getByRole("button", { name: "Пауза" }).click();
  await expect(page.getByRole("button", { name: "Продовжити" })).toBeVisible();
  await page.getByRole("button", { name: "Продовжити" }).click();
  await expect(page.getByRole("button", { name: "Зупинити струну" })).toBeEnabled({ timeout: 5000 });
  await page.getByRole("button", { name: "Зупинити струну" }).click();
  await expect(page.getByText("Нові зміни більше не виникають, але вже створена зміна продовжує шлях до вуха.")).toBeVisible();
  await expect(page.locator("#propagation-description")).toHaveText("Струна зупинена. Уже створена зміна завершила шлях до вуха, і система заспокоїлася.", { timeout: 8000 });
  await expect(page.getByRole("radio", { name: "Зміна у повітрі" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Відтворити" })).toBeVisible();
});

test("sound-path checkpoint: the first link is placed, a wrong pick hints, and the chain builds forward", async ({ page }) => {
  await openCheckpoint(page);
  const chain = page.getByRole("list", { name: "Зібраний ланцюг" }).getByRole("listitem");
  await expect(chain).toHaveCount(1);
  await expect(chain.first()).toContainText(chainLinks[0]);

  // The placed link is never offered; the rest follow `initialOrder`.
  await expect(page.getByRole("button", { name: chainLinks[0] })).toHaveCount(0);
  await expect(page.getByRole("group", { name: "Що відбувається далі?" }).getByRole("button")).toHaveText([chainLinks[3], chainLinks[4], chainLinks[1], chainLinks[2]]);

  await attach(page, chainLinks[3]);
  // The hint is local to the link being attached, not to the whole order.
  const feedback = page.getByRole("status").filter({ hasText: "Ще не ця ланка." });
  await expect(feedback).toBeVisible();
  await expect(feedback).toContainText("Що саме штовхає струна одразу після того, як почала коливатися?");
  await expect(page.getByRole("button", { name: "Показати й пояснити" })).toHaveCount(0);
  await expect(chain).toHaveCount(1);

  await attach(page, chainLinks[1]);
  await expect(feedback).toHaveCount(0);
  await expect(chain).toHaveCount(2);
  // Focus moves to the next question, not back to the top of the step.
  await expect(page.getByRole("heading", { name: "Що відбувається далі?" })).toBeFocused();

  for (const label of chainLinks.slice(2)) await attach(page, label);
  await expect(chain).toHaveCount(5);
  await expect(chain).toHaveText(chainLinks.map((label) => new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))));
  const summary = page.getByText("Причинний порядок відновлено.");
  await expect(summary).toBeVisible();
  await expect(summary).toBeFocused();
  await expect(page.getByRole("heading", { name: "Що відбувається далі?" })).toHaveCount(0);

  await page.getByRole("radio", { name: "Сама струна" }).check();
  await page.getByRole("button", { name: "Перевірити", exact: true }).click();
  await expect(page.getByText("Це припущення можна перевірити.")).toBeVisible();
  await expect(page.getByText("Ти пояснив/ла шлях звуку.")).toHaveCount(0);
  await page.getByRole("radio", { name: "Зміна у повітрі — звукова хвиля" }).check();
  await page.getByRole("button", { name: "Перевірити", exact: true }).click();
  await expect(page.getByText("Ти пояснив/ла шлях звуку.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Перейти до підсумку" })).toBeVisible();
});

test("sound-path checkpoint: the link is revealed after two wrong picks on it", async ({ page }) => {
  await openCheckpoint(page);
  await attach(page, chainLinks[3]);
  await expect(page.getByRole("button", { name: "Показати й пояснити" })).toHaveCount(0);
  await attach(page, chainLinks[4]);
  await page.getByRole("button", { name: "Показати й пояснити" }).click();

  // The reveal attaches only the link it explained, and the question moves on.
  const chain = page.getByRole("list", { name: "Зібраний ланцюг" }).getByRole("listitem");
  await expect(chain).toHaveCount(2);
  await expect(chain.nth(1)).toContainText(chainLinks[1]);
  await expect(page.getByRole("heading", { name: "Що відбувається далі?" })).toBeFocused();
  await expect(page.getByRole("button", { name: "Показати й пояснити" })).toHaveCount(0);

  for (const label of chainLinks.slice(2)) await attach(page, label);
  await expect(page.getByText("Ось причинний порядок.")).toBeVisible();
  await expect(page.getByText("Що поширюється від гітари до вуха?")).toBeVisible();
});
