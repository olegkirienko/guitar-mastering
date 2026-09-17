exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE users (
      id uuid PRIMARY KEY,
      username text NOT NULL,
      username_normalized text NOT NULL UNIQUE,
      password_hash text NOT NULL,
      created_at timestamptz NOT NULL,
      updated_at timestamptz NOT NULL,
      CONSTRAINT users_username_length CHECK (char_length(username) BETWEEN 3 AND 32),
      CONSTRAINT users_username_normalized_length CHECK (char_length(username_normalized) BETWEEN 3 AND 32),
      CONSTRAINT users_updated_after_created CHECK (updated_at >= created_at)
    );

    CREATE TABLE profiles (
      user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      first_name text,
      last_name text,
      avatar_id text,
      updated_at timestamptz NOT NULL,
      CONSTRAINT profiles_first_name_length CHECK (first_name IS NULL OR char_length(first_name) BETWEEN 1 AND 80),
      CONSTRAINT profiles_last_name_length CHECK (last_name IS NULL OR char_length(last_name) BETWEEN 1 AND 80)
    );

    CREATE TABLE sessions (
      token_hash bytea PRIMARY KEY,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL,
      expires_at timestamptz NOT NULL,
      CONSTRAINT sessions_token_hash_length CHECK (octet_length(token_hash) = 32),
      CONSTRAINT sessions_expiry CHECK (expires_at > created_at)
    );
    CREATE INDEX sessions_user_id_idx ON sessions(user_id);
    CREATE INDEX sessions_expires_at_idx ON sessions(expires_at);

    CREATE TABLE lesson_progress (
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      lesson_id text NOT NULL,
      schema_version integer NOT NULL,
      content_version integer NOT NULL,
      progress jsonb NOT NULL,
      revision integer NOT NULL,
      updated_at timestamptz NOT NULL,
      PRIMARY KEY (user_id, lesson_id),
      CONSTRAINT lesson_progress_schema_version CHECK (schema_version > 0),
      CONSTRAINT lesson_progress_content_version CHECK (content_version > 0),
      CONSTRAINT lesson_progress_revision CHECK (revision > 0),
      CONSTRAINT lesson_progress_object CHECK (jsonb_typeof(progress) = 'object'),
      CONSTRAINT lesson_progress_size CHECK (octet_length(progress::text) <= 12288)
    );

    CREATE TABLE auth_rate_limits (
      action text NOT NULL,
      key_hash bytea NOT NULL,
      window_started_at timestamptz NOT NULL,
      request_count integer NOT NULL,
      expires_at timestamptz NOT NULL,
      PRIMARY KEY (action, key_hash, window_started_at),
      CONSTRAINT auth_rate_limits_count CHECK (request_count > 0),
      CONSTRAINT auth_rate_limits_expiry CHECK (expires_at > window_started_at)
    );
    CREATE INDEX auth_rate_limits_expires_at_idx ON auth_rate_limits(expires_at);
  `);
};

exports.down = false;
