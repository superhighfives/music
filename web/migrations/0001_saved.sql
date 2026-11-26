-- One JSON value per person and key (see SYNC_KEYS in src/account/saved.ts). `version` goes up by one
-- on every save; a save names the version it started from, so it can't overwrite a newer one.
CREATE TABLE saved (
  user_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  version INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, key)
);
