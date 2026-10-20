// Cloudflare Worker entry. One origin serves two things:
//   /api/games…  → the game log in D1: every match played, so playtest feedback can name a game ("game 12, shot 3")
//   everything else → the built client (assets binding, SPA fallback)
// The client keeps the whole match record and sends it in full at each checkpoint (client/src/record.ts),
// so every write is an idempotent replace and a lost request costs nothing.

const MAX_LOG = 256 * 1024;   // a full match is a few KB; this only keeps junk out

interface LogHead { v?: number; app?: string; mode?: string; status?: string; winner?: string | null; summary?: string }

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

/** Parse and sanity-check a posted log. Returns the raw text too, so D1 stores exactly what was sent. */
async function readLog(req: Request): Promise<{ text: string; head: LogHead } | Response> {
  const text = await req.text();
  if (text.length > MAX_LOG) return json({ error: 'log too large' }, 413);
  let head: LogHead;
  try { head = JSON.parse(text); } catch { return json({ error: 'not JSON' }, 400); }
  if (!head || typeof head !== 'object' || head.v !== 1) return json({ error: 'unknown log format' }, 400);
  return { text, head };
}
const cols = (h: LogHead) => [h.app ?? null, h.mode ?? null, h.status ?? null, h.winner ?? null, h.summary ?? null];

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url), path = url.pathname.replace(/\/+$/, '');
    if (!path.startsWith('/api/games')) return json({ error: 'not found' }, 404);
    const idMatch = path.match(/^\/api\/games\/(\d+)$/), id = idMatch ? Number(idMatch[1]) : null;

    // list, newest first: ?before=<id> pages back
    if (path === '/api/games' && req.method === 'GET') {
      const before = Number(url.searchParams.get('before')) || 2 ** 31, limit = Math.min(50, Number(url.searchParams.get('limit')) || 20);
      const { results } = await env.DB.prepare('SELECT id, created_at, updated_at, log FROM games WHERE id < ? ORDER BY id DESC LIMIT ?').bind(before, limit).all();
      return json(results.map(r => ({ id: r.id, created_at: r.created_at, updated_at: r.updated_at, log: JSON.parse(r.log as string) })));
    }
    // a new match: returns its game number
    if (path === '/api/games' && req.method === 'POST') {
      const got = await readLog(req); if (got instanceof Response) return got;
      const row = await env.DB.prepare('INSERT INTO games (app, mode, status, winner, summary, log) VALUES (?, ?, ?, ?, ?, ?) RETURNING id')
        .bind(...cols(got.head), got.text).first<{ id: number }>();
      return json({ id: row!.id });
    }
    if (id !== null && req.method === 'GET') {
      const r = await env.DB.prepare('SELECT id, created_at, updated_at, log FROM games WHERE id = ?').bind(id).first();
      return r ? json({ id: r.id, created_at: r.created_at, updated_at: r.updated_at, log: JSON.parse(r.log as string) }) : json({ error: 'no such game' }, 404);
    }
    // a checkpoint: PUT from the game, POST from navigator.sendBeacon when the page closes
    if (id !== null && (req.method === 'PUT' || req.method === 'POST')) {
      const got = await readLog(req); if (got instanceof Response) return got;
      const res = await env.DB.prepare(`UPDATE games SET app = ?, mode = ?, status = ?, winner = ?, summary = ?, log = ?,
        updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`).bind(...cols(got.head), got.text, id).run();
      return res.meta.changes ? json({ id }) : json({ error: 'no such game' }, 404);
    }
    return json({ error: 'method not allowed' }, 405);
  },
} satisfies ExportedHandler<Env>;
