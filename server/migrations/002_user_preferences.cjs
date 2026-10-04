exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE user_preferences (
      user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      audio_enabled boolean NOT NULL DEFAULT false,
      prefers_static boolean NOT NULL DEFAULT false,
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);
};

exports.down = false;
