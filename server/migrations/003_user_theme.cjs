exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE user_preferences
      ADD COLUMN theme text NOT NULL DEFAULT 'system'
      CHECK (theme IN ('system', 'light', 'dark'));
  `);
};

exports.down = false;
