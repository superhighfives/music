-- The theory book's daily email. One row per signed-in person who turned it on; `token` is the secret
-- in their unsubscribe link, so unsubscribing works without signing in.
CREATE TABLE theory_email (
  user_id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  active INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  -- The UTC day (YYYY-MM-DD) of the last email. The cron runs hourly to retry failures, and this keeps
  -- it to one email a day.
  last_sent_on TEXT,
  -- When they last asked for a preview ("Send one now"), so previews can't be sent in a loop.
  last_preview_at INTEGER
);

-- Which cards each person has been sent, and when. New cards go out first; once every card has
-- been sent, the one sent longest ago comes round again, as review.
CREATE TABLE theory_email_sent (
  user_id TEXT NOT NULL,
  card TEXT NOT NULL,
  sent_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, card)
);
