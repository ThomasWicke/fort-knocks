// The game log table (migrations/0001_games.sql), written by the API (worker.ts, local matches) and by the rooms
// (party/room.ts, online matches). One row per match; `log` is the whole record (client/src/record.ts, GameLog).

export interface LogHead { v?: number; app?: string; mode?: string; status?: string; winner?: string | null; summary?: string }
const cols = (h: LogHead) => [h.app ?? null, h.mode ?? null, h.status ?? null, h.winner ?? null, h.summary ?? null];

/** A new row; returns its game number. */
export async function insertGame(db: D1Database, text: string, head: LogHead): Promise<number> {
  const row = await db.prepare('INSERT INTO games (app, mode, status, winner, summary, log) VALUES (?, ?, ?, ?, ?, ?) RETURNING id')
    .bind(...cols(head), text).first<{ id: number }>();
  return row!.id;
}
/** Replace a row's log (every save sends the whole record). False if there's no such game. */
export async function updateGame(db: D1Database, id: number, text: string, head: LogHead): Promise<boolean> {
  const res = await db.prepare(`UPDATE games SET app = ?, mode = ?, status = ?, winner = ?, summary = ?, log = ?,
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`).bind(...cols(head), text, id).run();
  return !!res.meta.changes;
}
