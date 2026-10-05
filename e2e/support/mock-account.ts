import type { Page, Route } from "@playwright/test";

export const applicationOrigin = "http://127.0.0.1:4173";
export const user = {
  id: "user-1", username: "Player.One",
  profile: { firstName: null, lastName: null, avatarId: null },
  preferences: { audioEnabled: false, prefersStatic: false },
};
export const lessonOneId = "stage-01-lesson-01";
export const lessonTwoId = "stage-01-lesson-02";
export const lessonThreeId = "stage-01-lesson-03";

type Progress = { currentStepId: string; completedStepIds: string[]; checkpointPassed: boolean; completedAt: string | null };
type Preferences = typeof user.preferences;
type Item = { lessonId: string; schemaVersion: number; contentVersion: number; progress: Progress; revision: number; updatedAt: string };

export const lessonOneCompleted: Progress = {
  currentStepId: "complete",
  completedStepIds: ["intro", "string", "air", "checkpoint", "complete"],
  checkpointPassed: true,
  completedAt: "2026-10-01T10:00:00.000Z",
};

export const lessonTwoCompleted: Progress = {
  currentStepId: "complete",
  completedStepIds: ["intro", "string", "repeats", "frequency", "loudness", "guitar", "checkpoint", "complete"],
  checkpointPassed: true,
  completedAt: "2026-10-02T10:00:00.000Z",
};

export function json(route: Route, status: number, body: unknown) {
  return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

// A signed-in session plus in-memory progress (with revisions, like the server's) and preferences APIs.
export async function mockAccount(page: Page, seed: Record<string, Partial<Progress>> = {}, initialPreferences: Partial<Preferences> = {}) {
  let preferences: Preferences = { ...user.preferences, ...initialPreferences };
  const items = new Map<string, Item>();
  let clock = Date.parse("2026-10-02T00:00:00.000Z");
  const tick = () => new Date(clock += 1000).toISOString();
  for (const [lessonId, progress] of Object.entries(seed)) {
    items.set(lessonId, {
      lessonId, schemaVersion: 1, contentVersion: 1, revision: 1, updatedAt: tick(),
      progress: { currentStepId: "intro", completedStepIds: [], checkpointPassed: false, completedAt: null, ...progress },
    });
  }
  const saves: { lessonId: string; body: { baseRevision: number; progress: Progress } }[] = [];

  await page.route("**/api/v1/session", (route) => json(route, 200, { user: { ...user, preferences } }));
  await page.route("**/api/v1/preferences", (route) => {
    preferences = route.request().postDataJSON() as Preferences;
    return json(route, 200, { preferences });
  });
  await page.route("**/api/v1/progress**", (route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/api/v1/progress") return json(route, 200, { items: [...items.values()] });
    const lessonId = decodeURIComponent(pathname.replace("/api/v1/progress/", ""));
    const current = items.get(lessonId);
    if (route.request().method() === "GET") {
      return current
        ? json(route, 200, { item: current })
        : json(route, 404, { error: { code: "PROGRESS_NOT_FOUND", message: "Прогрес не знайдено." } });
    }
    const body = route.request().postDataJSON() as { schemaVersion: number; contentVersion: number; baseRevision: number; progress: Progress };
    saves.push({ lessonId, body });
    if ((current?.revision ?? 0) !== body.baseRevision) {
      return json(route, 409, { error: { code: "REVISION_CONFLICT", message: "Конфлікт.", current } });
    }
    const item: Item = {
      lessonId, schemaVersion: body.schemaVersion, contentVersion: body.contentVersion,
      progress: body.progress, revision: (current?.revision ?? 0) + 1, updatedAt: tick(),
    };
    items.set(lessonId, item);
    return json(route, 200, { item });
  });

  return {
    progress: (lessonId: string) => items.get(lessonId)?.progress,
    preferences: () => preferences,
    saves,
  };
}
