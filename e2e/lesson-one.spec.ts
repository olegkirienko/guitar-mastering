import { expect, test, type Page } from "@playwright/test";

const applicationOrigin = "http://127.0.0.1:4173";

async function openLesson(page: Page, reducedMotion: boolean) {
  await page.emulateMedia({ reducedMotion: reducedMotion ? "reduce" : "no-preference" });
  await page.route("**/api/v1/session", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: null }) }));
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

async function moveLater(page: Page, label: string, times: number) {
  const button = page.getByRole("button", { name: `Перемістити «${label}» пізніше` });
  for (let index = 0; index < times; index += 1) await button.click();
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

test("sound-path checkpoint: wrong order, reorder, check, control question", async ({ page }) => {
  await openCheckpoint(page);
  const items = page.getByRole("listitem").filter({ has: page.getByRole("button", { name: "Раніше" }) });
  await expect(items.first()).toContainText("Хвиля досягає вуха");
  await expect(page.getByRole("button", { name: /Перемістити «.*» раніше/ }).first()).toBeDisabled();

  await page.getByRole("button", { name: "Перевірити порядок" }).click();
  await expect(page.getByText("Знайдено перший розрив.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Показати й пояснити" })).toHaveCount(0);

  await moveLater(page, "Хвиля досягає вуха", 4);
  await expect(page.getByText("Знайдено перший розрив.")).toHaveCount(0);
  await moveLater(page, "Ми сприймаємо звук", 3);
  await expect(items.first()).toContainText("Струну смикнули");
  await page.getByRole("button", { name: "Перевірити порядок" }).click();
  await expect(page.getByText("Причинний порядок відновлено.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Перевірити порядок" })).toHaveCount(0);

  await page.getByRole("radio", { name: "Сама струна" }).check();
  await page.getByRole("button", { name: "Перевірити", exact: true }).click();
  await expect(page.getByText("Це припущення можна перевірити.")).toBeVisible();
  await expect(page.getByText("Ти пояснив/ла шлях звуку.")).toHaveCount(0);
  await page.getByRole("radio", { name: "Зміна у повітрі — звукова хвиля" }).check();
  await page.getByRole("button", { name: "Перевірити", exact: true }).click();
  await expect(page.getByText("Ти пояснив/ла шлях звуку.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Перейти до підсумку" })).toBeVisible();
});

test("sound-path checkpoint: the answer is revealed after two failed checks", async ({ page }) => {
  await openCheckpoint(page);
  await page.getByRole("button", { name: "Перевірити порядок" }).click();
  await page.getByRole("button", { name: "Перевірити порядок" }).click();
  await page.getByRole("button", { name: "Показати й пояснити" }).click();
  await expect(page.getByText("Ось причинний порядок.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Перевірити порядок" })).toHaveCount(0);
  await expect(page.getByText("Що поширюється від гітари до вуха?")).toBeVisible();
});
