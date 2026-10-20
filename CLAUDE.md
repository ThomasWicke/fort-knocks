# Fort Knocks

A live 1v1 physics duel for phones, close to classic Angry Birds. Two siblings build forts from the toy box on a rainy afternoon, put their plushies on top and knock each other's fort down with marbles, while the floor is lava. It's made for Thomas and friends: a surprise for the friend who asked for "Angry Birds 1v1".

## Read first
- `docs/00-plan.md`: the phases, the gates and the **decision log**. Read its last entries to know where the project stands.
- `docs/style.md`: the rule set for everything drawn, heard or written. The two layers (real things are clean vector, imagined things are crayon), palette tokens, team colours, type, UI materials, motion and sound.
- The design reasoning, phase by phase: `docs/01-brief.md` (pillars), `02-core-design.md` (match structure, the three modes, hypotheses H1–H9), `03-world-directions.md`, `04-systems.md` (pieces, ammo, scoring, numbers, H10–H14), `05-identity.md`.

## How the work goes
- One phase at a time. Each phase ends at a gate where Thomas decides, and decisions go into the decision log in `docs/00-plan.md`.
- Design theory is named where it decides something (MDA, Schell, Sirlin, Costikyan, Swink, …).

## Art pipeline
- **Code:** pieces, crayon effects, UI and anything else that moves or breaks.
- **Illustrated sprites:** the plushies (and later the room backdrop), in the "drawn, but detailed" key-art style. The style reference is `docs/concept/brand/icon-7-fall-blue.jpg`.
- **Generating art:** Claude runs the Codex CLI on Thomas's ChatGPT login, in isolated runs (`codex exec -i <reference> --ignore-user-config --ephemeral --sandbox read-only`, from an empty scratch folder). Codex saves images to `~/.codex/generated_images/<session>/`.
- **Sprite cutouts:** sprites are generated on a magenta (#FF00FF) background and cut out offline (hue key plus despill). The magenta sources are in `docs/concept/sprites/`, the cutouts in `dev/style-frame/sprites/`.

## Layout
- `docs/`: design documents and concept art (`docs/concept/`).
- `dev/style-frame/`: the Phase 5.3 style frame. A static page; serve the folder over http, because the sprites don't load from file://.

## Infrastructure
- GitHub: `git@github.com:ThomasWicke/fort-knocks.git`.
- Multiplayer (Phase 7): Cloudflare Durable Objects through `partyserver`, as in `../fabricator`. PartyKit's shared zone no longer accepts new projects. Wrangler is logged in to Thomas's Cloudflare account.
