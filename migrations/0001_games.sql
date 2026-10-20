-- Every match played on the deployed game, including abandoned and test matches (Thomas, playtest 2).
-- One row per match. The whole record is the JSON in `log` (client/src/record.ts, GameLog); the other columns
-- are copied out of it so the games page and queries don't have to parse every log.
CREATE TABLE games (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,   -- the game number players quote ("game 12")
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  app        TEXT,      -- build that played it (git commit)
  mode       TEXT,      -- 'bot' | 'pass'
  status     TEXT,      -- 'building' | 'siege' | 'done' | 'quit'
  winner     TEXT,      -- 'blue' | 'green' | 'draw'; null until the end
  summary    TEXT,      -- one line for lists, e.g. "Blue 2 – Green 1"
  log        TEXT NOT NULL
);
CREATE INDEX games_created ON games (created_at);
