import type { Pool } from "pg";
import type { AuthService } from "./auth.ts";

const LESSON_CATALOG = {
  "stage-01-lesson-01": {
    schemaVersion: 1,
    contentVersion: 1,
    stepIds: ["intro", "string", "air", "checkpoint", "complete"],
  },
} as const;

const MAX_PROGRESS_BYTES = 12 * 1024;

export interface LessonProgressValue {
  currentStepId: string;
  completedStepIds: string[];
  checkpointPassed: boolean;
  completedAt: string | null;
}

export interface LessonProgressItem {
  lessonId: string;
  schemaVersion: number;
  contentVersion: number;
  progress: LessonProgressValue;
  revision: number;
  updatedAt: string;
}

export class ProgressError extends Error {
  readonly status: number;
  readonly code: string;
  readonly current?: LessonProgressItem;

  constructor(status: number, code: string, message: string, current?: LessonProgressItem) {
    super(message);
    this.status = status;
    this.code = code;
    this.current = current;
  }
}

type ProgressRow = {
  lesson_id: string;
  schema_version: number;
  content_version: number;
  progress: LessonProgressValue;
  revision: number;
  updated_at: Date | string;
};

function itemFromRow(row: ProgressRow): LessonProgressItem {
  return {
    lessonId: row.lesson_id,
    schemaVersion: row.schema_version,
    contentVersion: row.content_version,
    progress: row.progress,
    revision: row.revision,
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

function catalogEntry(lessonId: string) {
  const entry = LESSON_CATALOG[lessonId as keyof typeof LESSON_CATALOG];
  if (!entry) throw new ProgressError(404, "UNKNOWN_LESSON", "Lesson is not available.");
  return entry;
}

function integer(value: unknown, name: string): number {
  if (!Number.isInteger(value) || (value as number) < 0) {
    throw new ProgressError(422, "INVALID_PROGRESS", `${name} must be a non-negative integer.`);
  }
  return value as number;
}

function validateProgress(body: unknown, lessonId: string) {
  const entry = catalogEntry(lessonId);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ProgressError(422, "INVALID_PROGRESS", "Progress payload is invalid.");
  }
  const record = body as Record<string, unknown>;
  const allowedBodyKeys = new Set(["schemaVersion", "contentVersion", "progress", "baseRevision"]);
  if (Object.keys(record).some((key) => !allowedBodyKeys.has(key))) {
    throw new ProgressError(422, "INVALID_PROGRESS", "Progress payload contains unsupported fields.");
  }
  const schemaVersion = integer(record.schemaVersion, "schemaVersion");
  const contentVersion = integer(record.contentVersion, "contentVersion");
  const baseRevision = integer(record.baseRevision, "baseRevision");
  if (schemaVersion !== entry.schemaVersion || contentVersion !== entry.contentVersion) {
    throw new ProgressError(422, "UNSUPPORTED_PROGRESS_VERSION", "Progress version is not supported.");
  }
  if (!record.progress || typeof record.progress !== "object" || Array.isArray(record.progress)) {
    throw new ProgressError(422, "INVALID_PROGRESS", "Progress value is invalid.");
  }
  const progressRecord = record.progress as Record<string, unknown>;
  const allowedProgressKeys = new Set(["currentStepId", "completedStepIds", "checkpointPassed", "completedAt"]);
  if (Object.keys(progressRecord).some((key) => !allowedProgressKeys.has(key))) {
    throw new ProgressError(422, "INVALID_PROGRESS", "Progress value contains unsupported fields.");
  }
  const steps = entry.stepIds as readonly string[];
  if (typeof progressRecord.currentStepId !== "string" || !steps.includes(progressRecord.currentStepId)) {
    throw new ProgressError(422, "INVALID_PROGRESS", "Current step is invalid.");
  }
  if (!Array.isArray(progressRecord.completedStepIds)
    || progressRecord.completedStepIds.some((step) => typeof step !== "string" || !steps.includes(step))
    || new Set(progressRecord.completedStepIds).size !== progressRecord.completedStepIds.length) {
    throw new ProgressError(422, "INVALID_PROGRESS", "Completed steps are invalid.");
  }
  if (typeof progressRecord.checkpointPassed !== "boolean") {
    throw new ProgressError(422, "INVALID_PROGRESS", "Checkpoint state is invalid.");
  }
  let completedAt: string | null = null;
  if (progressRecord.completedAt !== undefined && progressRecord.completedAt !== null) {
    if (typeof progressRecord.completedAt !== "string" || !Number.isFinite(Date.parse(progressRecord.completedAt))) {
      throw new ProgressError(422, "INVALID_PROGRESS", "Completion time is invalid.");
    }
    completedAt = new Date(progressRecord.completedAt).toISOString();
  }
  const progress: LessonProgressValue = {
    currentStepId: progressRecord.currentStepId,
    completedStepIds: [...progressRecord.completedStepIds] as string[],
    checkpointPassed: progressRecord.checkpointPassed,
    completedAt,
  };
  if (Buffer.byteLength(JSON.stringify(progress)) > MAX_PROGRESS_BYTES) {
    throw new ProgressError(413, "PROGRESS_TOO_LARGE", "Progress payload is too large.");
  }
  return { schemaVersion, contentVersion, baseRevision, progress };
}

export class ProgressService {
  constructor(private readonly pool: Pool, private readonly auth: AuthService) {}

  private async userId(token?: string): Promise<string> {
    const user = await this.auth.session(token);
    if (!user) throw new ProgressError(401, "UNAUTHENTICATED", "Authentication is required.");
    return user.id;
  }

  async list(token?: string): Promise<LessonProgressItem[]> {
    const userId = await this.userId(token);
    const result = await this.pool.query<ProgressRow>(`
      SELECT lesson_id, schema_version, content_version, progress, revision, updated_at
      FROM lesson_progress WHERE user_id = $1 ORDER BY lesson_id
    `, [userId]);
    return result.rows.map(itemFromRow);
  }

  async get(token: string | undefined, lessonId: string): Promise<LessonProgressItem> {
    catalogEntry(lessonId);
    const userId = await this.userId(token);
    const result = await this.pool.query<ProgressRow>(`
      SELECT lesson_id, schema_version, content_version, progress, revision, updated_at
      FROM lesson_progress WHERE user_id = $1 AND lesson_id = $2
    `, [userId, lessonId]);
    if (!result.rows[0]) throw new ProgressError(404, "PROGRESS_NOT_FOUND", "Progress was not found.");
    return itemFromRow(result.rows[0]);
  }

  async put(token: string | undefined, lessonId: string, body: unknown): Promise<LessonProgressItem> {
    const value = validateProgress(body, lessonId);
    const userId = await this.userId(token);
    const parameters = [userId, lessonId, value.schemaVersion, value.contentVersion, JSON.stringify(value.progress), value.baseRevision];
    const result = value.baseRevision === 0
      ? await this.pool.query<ProgressRow>(`
          INSERT INTO lesson_progress(user_id, lesson_id, schema_version, content_version, progress, revision, updated_at)
          VALUES ($1, $2, $3, $4, $5::jsonb, 1, now())
          ON CONFLICT (user_id, lesson_id) DO NOTHING
          RETURNING lesson_id, schema_version, content_version, progress, revision, updated_at
        `, parameters.slice(0, 5))
      : await this.pool.query<ProgressRow>(`
          UPDATE lesson_progress
          SET schema_version = $3, content_version = $4, progress = $5::jsonb,
              revision = revision + 1, updated_at = now()
          WHERE user_id = $1 AND lesson_id = $2 AND revision = $6
          RETURNING lesson_id, schema_version, content_version, progress, revision, updated_at
        `, parameters);
    if (result.rows[0]) return itemFromRow(result.rows[0]);

    const current = await this.pool.query<ProgressRow>(`
      SELECT lesson_id, schema_version, content_version, progress, revision, updated_at
      FROM lesson_progress WHERE user_id = $1 AND lesson_id = $2
    `, [userId, lessonId]);
    throw new ProgressError(409, "REVISION_CONFLICT", "Progress changed on another device.", current.rows[0] ? itemFromRow(current.rows[0]) : undefined);
  }
}
