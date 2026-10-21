# Fort Knocks

A live 1v1 physics duel for phones, close to classic Angry Birds. Two siblings build forts from the toy box on a rainy afternoon, put their plushies on top and knock each other's fort down with marbles, while the floor is lava. It's made for Thomas and friends: a surprise for the friend who asked for "Angry Birds 1v1".

## Read first
- `docs/00-plan.md`: the phases, the gates and the **decision log**. Read its last entries to know where the project stands.
- `docs/style.md`: the rule set for everything drawn, heard or written. The two layers (real things are clean vector, imagined things are crayon), palette tokens, team colours, type, UI materials, motion and sound.
- The design reasoning, phase by phase: `docs/01-brief.md` (pillars), `02-core-design.md` (match structure, the three modes, hypotheses H1–H9), `03-world-directions.md`, `04-systems.md` (pieces, ammo, scoring, numbers, H10–H14), `05-identity.md`.

## How the work goes
- One phase at a time. Each phase ends at a gate where Thomas decides, and decisions go into the decision log in `docs/00-plan.md`.
- **Since 2026-10-21 (Thomas):** Claude builds the rest of Phase 6 (M3–M6) as an MVP at its own judgement, deploying after each step, without waiting for feedback. Thomas then playtests it with a friend, and the game log supplies the data.
- Design theory is named where it decides something (MDA, Schell, Sirlin, Costikyan, Swink, …).

## Art pipeline
- **Code:** pieces, crayon effects, UI and anything else that moves or breaks.
- **Illustrated sprites:** the plushies (and later the room backdrop), in the "drawn, but detailed" key-art style. The style reference is `docs/concept/brand/icon-7-fall-blue.jpg`.
- **Generating art:** Claude runs the Codex CLI on Thomas's ChatGPT login, in isolated runs (`codex exec -i <reference> --ignore-user-config --ephemeral --sandbox read-only`, from an empty scratch folder). Codex saves images to `~/.codex/generated_images/<session>/`.
- **Sprite cutouts:** sprites are generated on a magenta (#FF00FF) background and cut out offline (hue key plus despill), with the ComfyUI venv's Python (`../../local-image-gen/ComfyUI/venv/bin/python`).
  - `dev/art/make_art.py`: room, rug and plushies.
  - `dev/art/make_pieces.py`: the piece sprites, cut to each physics box's exact proportions.
  - Sources: `docs/concept/game-art/`, `docs/concept/pieces/`, `docs/concept/sprites/`. Results: `client/public/art/`.

## Commands
```bash
npm install
npm run dev        # Vite on :5180, host: true, so a phone on the same Wi-Fi can open it
npm run typecheck
npm run build      # -> dist/
npm run deploy     # build, then wrangler deploy -> https://fort-knocks.thomaswi1998.workers.dev
npm run dev:worker # build, local D1, wrangler dev on :8787: the real Worker with the game log, for testing saves and replays
npx wrangler d1 migrations apply fort-knocks --remote   # after adding a file to migrations/
npx wrangler d1 execute fort-knocks --remote --command "SELECT id, created_at, summary FROM games ORDER BY id DESC LIMIT 20"
```
On the Vite dev server and on localhost, `window.__fk` drives the game without a visible tab:
- `__fk.start('bot' | 'pass')`, `__fk.load(i)` (a bot fort into the builder), `__fk.ready()`, `__fk.go()` (pass screens)
- `__fk.fire(pullX, pullY, ammo?)` (pull in cells, max 2), `__fk.tap()` (the ammo's ability), `__fk.hand()`, `__fk.run(seconds)`, `__fk.state()`
- `__fk.sweep(fortIndex, ammo, taped?, tear?)`: fire one ammo type at a hand-made fort over an angle × power grid (balance)
- `__fk.sims(n, rules, knobs?)`: n whole bot-vs-bot matches (wipes, early ends, tiebreaks); `__fk.botFort()`: one generated fort
- `__fk.start('bot' | 'pass', rules?)`, `__fk.host(rules)` (open an online room), `__fk.match()`, `__fk.online()`
- Long sweeps belong in a tab of the built game (`npm run dev:worker`, localhost:8787): the Vite dev server reloads the page on every code change.
- `__fk.log()` (the current game log), `__fk.watch(log)` (replay a log), `__fk.watching()` (replay progress and drift)

The Vite dev server doesn't save games, because it has no API. Built code does: deployed, or `npm run dev:worker` into the local D1.

## Layout
- `client/`: the game (Vite root, two pages: `index.html` the game, `games.html` the past games).
  - `src/physics.ts` is the only file that touches Box2D.
  - `src/fort.ts`: pieces, materials, the toy box, build rules, bot forts. `src/draw.ts`: the grey-box drawing.
  - `src/build.ts`: the build screen. `src/range.ts`: one fort's world and the launcher, stepped deterministically.
  - `src/main.ts`: the match flow, input, replays (`?watch=<id>`). `src/record.ts`: the game log. `src/games.ts`: the past-games page.
  - `src/ammo.ts`: the four ammo types, the schedule, their drawings. `src/fx.ts`: crayon effects. `src/sim.ts`: headless balance sweeps (`__fk.sweep(fort, ammo)` in dev).
  - `src/modes.ts`: the three modes as configurations. `src/repair.ts`: the Siege's repair screen. `src/bot.ts`: the bot's fort builder, aim and taps.
  - `src/art.ts`: the illustrated room, rug and plushie sprites, placed in world coordinates. The images are in `client/public/art/`, made by `dev/art/make_art.py` from `docs/concept/game-art/` and `docs/concept/sprites/`.
- `worker.ts`: the Cloudflare Worker. `/parties/rooms/<code>` are the online rooms, `/api/games` the game log on D1, everything else comes from `dist/`. `migrations/`: the D1 schema.
- `party/`: the online room. `protocol.ts` (the messages, shared with the client), `room.ts` (the Durable Object), `games-db.ts` (game-log writes). `client/src/party.ts` is the phone's side.
- `docs/`: design documents and concept art (`docs/concept/`).
- `dev/style-frame/`: the Phase 5.3 style frame. A static page; serve the folder over http, because the sprites don't load from file://.

## Infrastructure
- GitHub: `git@github.com:ThomasWicke/fort-knocks.git`.
- **Hosting:** a Cloudflare Worker named `fort-knocks` with static assets (`wrangler.jsonc`), at https://fort-knocks.thomaswi1998.workers.dev. Not Pages: wrangler 4.151 folds new Pages projects into Workers, and the Worker is where the rooms go anyway.
- **Game log:** every match on the deployed game is saved in the D1 database `fort-knocks` (binding `DB`, table `games`, one JSON log per match, see `client/src/record.ts`). Thomas quotes game numbers in feedback. Read a game with `wrangler d1 execute … --remote` or `GET /api/games/<id>`, and watch it at `/?watch=<id>`. Replays are exact because the ranges only advance in counted steps (`range.ts`); a replay's end card reports drift.
- **Online rooms:** Durable Objects through `partyserver` in the same Worker (binding `Rooms`, class `FortRoom`), as in `../fabricator`. A room per four-letter code; the game's link is `/r/<code>`. Each phone simulates the fort it attacks and streams snapshots to the owner (`docs/06-prototype.md` §8).
  - Test with two tabs against `npm run dev:worker`. The second tab opens `/r/<code>?as=b`, because tabs of one browser share the device's player id.
  - Wrangler is logged in to Thomas's Cloudflare account.

## Physics
Box2D v3 via `box2d3-wasm` (compat build), behind a small physics interface, with Rapier as the fallback. The reasoning and the measurements are in `docs/06-prototype.md`. `dev/physics-spike/spike.mjs` runs the same fort in all three engines (`node spike.mjs`; `node spike.mjs debug` lists the pieces that fall during the settle).
