-- The theory book's daily email. One row per signed-in person who turned it on; `token` is the secret
-- in their unsubscribe link, so unsubscribing works without signing in.
CREATE TABLE theory_email (
  user_id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  active INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  -- The UTC day (YYYY-MM-DD) of the last email, so a retried cron never sends twice in a day.
  last_sent_on TEXT
);

-- Which cards each person has been sent, and when. New cards go out first; once every card has
-- been sent, the one sent longest ago comes round again, as review.
CREATE TABLE theory_email_sent (
  user_id TEXT NOT NULL,
  card TEXT NOT NULL,
  sent_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, card)
);
