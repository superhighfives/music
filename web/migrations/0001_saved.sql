-- One JSON value per person and key (see SYNC_KEYS in src/account/saved.ts).
CREATE TABLE saved (
  user_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, key)
);
