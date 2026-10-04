export interface ProgressCatalogEntry {
  readonly schemaVersion: number;
  readonly contentVersion: number;
  readonly stepIds: readonly string[];
}

export type ProgressCatalogDefinition = Readonly<Record<string, ProgressCatalogEntry>>;

function nonNegativeInteger(value: number, field: string, lessonId: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new TypeError(`${field} for ${lessonId} must be a non-negative integer.`);
  }
}

export class ProgressCatalog {
  readonly #entries: ReadonlyMap<string, ProgressCatalogEntry>;

  constructor(definition: ProgressCatalogDefinition) {
    const entries = new Map<string, ProgressCatalogEntry>();
    for (const [lessonId, entry] of Object.entries(definition)) {
      if (lessonId.trim().length === 0) throw new TypeError("Lesson IDs must be non-empty.");
      nonNegativeInteger(entry.schemaVersion, "schemaVersion", lessonId);
      nonNegativeInteger(entry.contentVersion, "contentVersion", lessonId);
      if (entry.stepIds.length === 0) throw new TypeError(`stepIds for ${lessonId} must be non-empty.`);
      if (entry.stepIds.some((stepId) => stepId.trim().length === 0)) {
        throw new TypeError(`Step IDs for ${lessonId} must be non-empty.`);
      }
      if (new Set(entry.stepIds).size !== entry.stepIds.length) {
        throw new TypeError(`Step IDs for ${lessonId} must be unique.`);
      }
      entries.set(lessonId, Object.freeze({
        schemaVersion: entry.schemaVersion,
        contentVersion: entry.contentVersion,
        stepIds: Object.freeze([...entry.stepIds]),
      }));
    }
    this.#entries = entries;
  }

  get(lessonId: string): ProgressCatalogEntry | undefined {
    return this.#entries.get(lessonId);
  }
}

export const productionProgressCatalog = new ProgressCatalog({
  "stage-01-lesson-01": {
    schemaVersion: 1,
    contentVersion: 1,
    stepIds: ["intro", "string", "air", "checkpoint", "complete"],
  },
  "stage-01-lesson-02": {
    schemaVersion: 1,
    contentVersion: 1,
    stepIds: ["intro", "string", "repeats", "frequency", "loudness", "guitar", "checkpoint", "complete"],
  },
  "stage-01-lesson-03": {
    schemaVersion: 1,
    contentVersion: 1,
    stepIds: ["intro", "length", "tension", "density", "model", "checkpoint", "complete"],
  },
});
