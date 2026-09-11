PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id TEXT PRIMARY KEY NOT NULL,
  username TEXT NOT NULL,
  username_normalized TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  CHECK (length(id) > 0),
  CHECK (length(username) BETWEEN 3 AND 32),
  CHECK (length(username_normalized) BETWEEN 3 AND 32),
  CHECK (length(password_hash) > 0),
  CHECK (updated_at >= created_at)
) STRICT;

CREATE TABLE profiles (
  user_id TEXT PRIMARY KEY NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar_id TEXT,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CHECK (first_name IS NULL OR (length(first_name) BETWEEN 1 AND 80 AND first_name = trim(first_name))),
  CHECK (last_name IS NULL OR (length(last_name) BETWEEN 1 AND 80 AND last_name = trim(last_name))),
  CHECK (avatar_id IS NULL OR length(avatar_id) > 0)
) STRICT;

CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CHECK (length(token_hash) = 64),
  CHECK (expires_at > created_at)
) STRICT;

CREATE INDEX sessions_user_id_idx ON sessions(user_id);
CREATE INDEX sessions_expires_at_idx ON sessions(expires_at);

CREATE TABLE lesson_progress (
  user_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  schema_version INTEGER NOT NULL,
  content_version INTEGER NOT NULL,
  progress_json TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, lesson_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CHECK (length(lesson_id) > 0),
  CHECK (schema_version >= 1),
  CHECK (content_version >= 1),
  CHECK (length(CAST(progress_json AS BLOB)) <= 12288),
  CHECK (revision >= 1)
) STRICT;

CREATE INDEX lesson_progress_updated_at_idx ON lesson_progress(updated_at);
