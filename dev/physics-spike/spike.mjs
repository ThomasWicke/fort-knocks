// Phase 6 tech spike: the style-frame fort plus a stress scene in Planck.js, Rapier and Box2D v3.
// Units: 1 cell = 1 m, gravity -10. Run: node spike.mjs
import * as planck from 'planck';
import RAPIER from '@dimforge/rapier2d-compat';
import Box2DFactory from 'box2d3-wasm';
import { performance } from 'node:perf_hooks';
import { createHash } from 'node:crypto';

const DT = 1 / 60;
// density, friction, restitution per material (04-systems weights: card 0.2, domino 0.6, block 1, plushie 0.5, book 3)
const MAT = {
  card: { d: 1.0, f: 0.45, r: 0.02 }, domino: { d: 0.6, f: 0.6, r: 0.05 }, block: { d: 1.0, f: 0.8, r: 0.05 },
  book: { d: 2.0, f: 0.8, r: 0.02 }, plush: { d: 0.5, f: 0.9, r: 0.0 }, marble: { d: 8.0, f: 0.3, r: 0.2 },
};
const CARD_T = 0.12;   // physics thickness of a card; drawn thinner

// ---- the fort from dev/style-frame (x, y = lower-left corner in cells, y up from the rug) ----
function fortPieces(ox = 0) {
  const P = [];
  const box = (x, y, w, h, m) => P.push({ kind: 'box', x: ox + x + w / 2, y: y + h / 2, hw: w / 2, hh: h / 2, a: 0, m });
  box(0, 0, 3, 0.5, 'book'); box(0, 0.5, 3, 0.5, 'book');
  box(0, 1, 1, 1, 'block'); box(2, 1, 1, 1, 'block'); box(0, 2, 3, 0.5, 'book'); box(1, 2.5, 1, 1, 'block');
  // arch: two feet and a lintel, welded as one body would be in the game; here three boxes in one compound
  P.push({ kind: 'compound', x: ox + 4.5, y: 0.5, m: 'block', parts: [[-0.75, -0.2, 0.25, 0.3], [0.75, -0.2, 0.25, 0.3], [0, 0.3, 1, 0.2]] });
  box(3.55, 1, 0.5, 2, 'domino'); box(4.95, 1, 0.5, 2, 'domino');
  box(3.4, 3, 2.2, CARD_T, 'card');
  const tentY = 3 + CARD_T, tentH = 1.37;
  // card tent: ONE rigid piece (two cards joined at the apex). Two loose leaning cards slid apart in every engine.
  const len = Math.hypot(0.75, tentH), lean = Math.atan2(0.75, tentH);
  P.push({ kind: 'compound', x: ox + 4.5, y: tentY + tentH / 2, m: 'card', parts: [[-0.375, 0, CARD_T / 2, len / 2, -lean], [0.375, 0, CARD_T / 2, len / 2, lean]] });
  box(3.5, tentY + tentH, 2, CARD_T, 'card');
  box(6, 0, 2, 1, 'block'); box(8, 0, 2, 1, 'block');
  box(6.4, 1, 0.5, 3, 'book'); box(9.1, 1, 0.5, 3, 'book');
  box(7.3, 1, 1, 1, 'block');
  box(7.05, 2, 1.5, 0.4, 'domino');   // lying domino on the block, triangle on top (the style frame had it the other way round, and it slid off the point)
  P.push({ kind: 'poly', x: ox + 7.8, y: 2.4, pts: [[-0.5, 0], [0.5, 0], [0, 1]], m: 'block' });
  box(6.5, 4, 3, 0.5, 'book');
  // plushies (1 x 1, the physics body; the sprite is drawn bigger)
  box(1, 3.5, 1, 1, 'plush'); box(4, tentY + tentH + CARD_T, 1, 1, 'plush'); box(7.55, 4.5, 1, 1, 'plush');
  return P;
}
const PLUSH_COUNT = 3;
// stress: three forts plus a 14-block tower and a 12-domino row (about 75 bodies)
function stressPieces() {
  const P = [...fortPieces(0), ...fortPieces(14), ...fortPieces(28)];
  for (let i = 0; i < 14; i++) P.push({ kind: 'box', x: 42 + (i % 2) * 0.05, y: 0.5 + i, hw: 0.5, hh: 0.5, a: 0, m: 'block' });
  for (let i = 0; i < 12; i++) P.push({ kind: 'box', x: 46 + i * 1.3, y: 1, hw: 0.25, hh: 1, a: 0, m: 'domino' });
  return P;
}

// ---- engine adapters: build(pieces, transforms?) -> { step, read, addMarble, snapshot? } ----
const engines = {
  async planck() {
    const { World, Vec2, Box, Polygon, Circle, Edge } = planck;
    return (pieces, tf) => {
      const w = new World({ gravity: Vec2(0, -10) });
      w.createBody().createFixture(Edge(Vec2(-100, 0), Vec2(200, 0)), { friction: 0.8 });
      const bodies = pieces.map((p, i) => {
        const [x, y, a] = tf ? tf[i] : [p.x, p.y, p.a || 0], m = MAT[p.m];
        const b = w.createDynamicBody({ position: Vec2(x, y), angle: a });
        const fd = { density: m.d, friction: m.f, restitution: m.r };
        if (p.kind === 'box') b.createFixture(Box(p.hw, p.hh), fd);
        if (p.kind === 'poly') b.createFixture(Polygon(p.pts.map(([px, py]) => Vec2(px, py))), fd);
        if (p.kind === 'compound') for (const [cx, cy, hw, hh, pa = 0] of p.parts) b.createFixture(Box(hw, hh, Vec2(cx, cy), pa), fd);
        return b;
      });
      return {
        step: () => w.step(DT, 8, 3),
        read: () => bodies.map(b => { const q = b.getPosition(); return [q.x, q.y, b.getAngle()]; }),
        addMarble(x, y, vx, vy) { const m = MAT.marble, b = w.createDynamicBody({ position: Vec2(x, y), bullet: true, linearVelocity: Vec2(vx, vy) }); b.createFixture(Circle(0.3), { density: m.d, friction: m.f, restitution: m.r }); },
      };
    };
  },
  async rapier() {
    await RAPIER.init();
    const make = (pieces, tf) => {
      const w = new RAPIER.World({ x: 0, y: -10 }); w.timestep = DT;
      const g = w.createRigidBody(RAPIER.RigidBodyDesc.fixed()); w.createCollider(RAPIER.ColliderDesc.cuboid(150, 0.5).setTranslation(50, -0.5).setFriction(0.8), g);
      const handles = pieces.map((p, i) => {
        const [x, y, a] = tf ? tf[i] : [p.x, p.y, p.a || 0], m = MAT[p.m];
        const b = w.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(x, y).setRotation(a));
        const fin = c => w.createCollider(c.setDensity(m.d).setFriction(m.f).setRestitution(m.r), b);
        if (p.kind === 'box') fin(RAPIER.ColliderDesc.cuboid(p.hw, p.hh));
        if (p.kind === 'poly') fin(RAPIER.ColliderDesc.convexHull(new Float32Array(p.pts.flat())));
        if (p.kind === 'compound') for (const [cx, cy, hw, hh, pa = 0] of p.parts) fin(RAPIER.ColliderDesc.cuboid(hw, hh).setTranslation(cx, cy).setRotation(pa));
        return b.handle;
      });
      return wrap(w, handles);
    };
    const wrap = (w, handles) => ({
      step: () => w.step(),
      read: () => handles.map(h => { const b = w.getRigidBody(h), t = b.translation(); return [t.x, t.y, b.rotation()]; }),
      addMarble(x, y, vx, vy) { const m = MAT.marble, b = w.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(x, y).setLinvel(vx, vy).setCcdEnabled(true)); w.createCollider(RAPIER.ColliderDesc.ball(0.3).setDensity(m.d).setFriction(m.f).setRestitution(m.r), b); },
      snapshot: () => w.takeSnapshot(),
      restore: bytes => wrap(RAPIER.World.restoreSnapshot(bytes), handles),
    });
    return make;
  },
  async box2d3() {
    const B = await Box2DFactory();
    const { b2DefaultWorldDef, b2CreateWorld, b2World_Step, b2DefaultBodyDef, b2CreateBody, b2MakeBox, b2MakeOffsetBox, b2DefaultShapeDef,
      b2CreatePolygonShape, b2Body_GetPosition, b2Body_GetRotation, b2Rot_GetAngle, b2MakeRot, b2Vec2, b2BodyType, b2ComputeHull, b2MakePolygon, b2Circle, b2CreateCircleShape } = B;
    const shapeDef = (m) => { const sd = b2DefaultShapeDef(); sd.density = m.d; const mat = sd.material; mat.friction = m.f; mat.restitution = m.r; sd.material = mat; return sd; };
    return (pieces, tf) => {
      const wd = b2DefaultWorldDef(); wd.gravity = new b2Vec2(0, -10);
      const w = b2CreateWorld(wd);
      const gd = b2DefaultBodyDef(); gd.position = new b2Vec2(50, -0.5);
      b2CreatePolygonShape(b2CreateBody(w, gd), shapeDef({ d: 0, f: 0.8, r: 0 }), b2MakeBox(150, 0.5));
      const bodies = pieces.map((p, i) => {
        const [x, y, a] = tf ? tf[i] : [p.x, p.y, p.a || 0], m = MAT[p.m];
        const bd = b2DefaultBodyDef(); bd.type = b2BodyType.b2_dynamicBody; bd.position = new b2Vec2(x, y); bd.rotation = b2MakeRot(a);
        const b = b2CreateBody(w, bd), sd = shapeDef(m);
        if (p.kind === 'box') b2CreatePolygonShape(b, sd, b2MakeBox(p.hw, p.hh));
        if (p.kind === 'poly') b2CreatePolygonShape(b, sd, b2MakePolygon(b2ComputeHull(p.pts.map(([px, py]) => new b2Vec2(px, py))), 0));
        if (p.kind === 'compound') for (const [cx, cy, hw, hh, pa = 0] of p.parts) b2CreatePolygonShape(b, sd, b2MakeOffsetBox(hw, hh, new b2Vec2(cx, cy), b2MakeRot(pa)));
        return b;
      });
      return {
        step: () => b2World_Step(w, DT, 4),
        read: () => bodies.map(b => { const q = b2Body_GetPosition(b); return [q.x, q.y, b2Rot_GetAngle(b2Body_GetRotation(b))]; }),
        addMarble(x, y, vx, vy) {
          const bd = b2DefaultBodyDef(); bd.type = b2BodyType.b2_dynamicBody; bd.position = new b2Vec2(x, y); bd.linearVelocity = new b2Vec2(vx, vy); bd.isBullet = true;
          const c = new b2Circle(); c.radius = 0.3; b2CreateCircleShape(b2CreateBody(w, bd), shapeDef(MAT.marble), c);
        },
      };
    };
  },
};

// ---- measurements ----
const run = (sim, n) => { for (let i = 0; i < n; i++) sim.step(); };
const drift = (a, b) => Math.max(...a.map((t, i) => Math.hypot(t[0] - b[i][0], t[1] - b[i][1]) + Math.abs(t[2] - b[i][2]) * 0.5));
const fallen = (pieces, t) => t.filter((q, i) => q[1] < pieces[i].y - 0.5).length;
const plushOut = (pieces, t) => t.slice(-PLUSH_COUNT).filter(q => q[1] < 0.75).length;   // a plushie on the floor (or rug) is out
const moved = (a, b) => a.filter((t, i) => Math.hypot(t[0] - b[i][0], t[1] - b[i][1]) > 1).length;
const hash = t => createHash('sha1').update(t.flat().map(v => v.toFixed(9)).join(',')).digest('hex').slice(0, 10);
const fmt = v => (typeof v === 'number' ? (Math.abs(v) < 0.001 && v !== 0 ? v.toExponential(1) : +v.toFixed(3)) : v);

const SHOT = [-14, 4, 17, 6.5];   // marble from the launcher side, aimed at the card tower

async function main() {
  const rows = [];
  for (const [name, init] of Object.entries(engines)) {
    const make = await init(), fort = fortPieces(), r = { engine: name };
    // 1. settle: build, run 1 s, then measure how much it still moves over the next 4 s
    let sim = make(fort); run(sim, 60);
    const t1 = sim.read(); run(sim, 240); const t5 = sim.read();
    r['fallen in settle'] = fallen(fort, t5); r['plushies out in settle'] = plushOut(fort, t5); r['drift 1-5 s (cells)'] = drift(t1, t5);
    // 2. reload from transforms (how a settled fort travels to the other phone), then 5 s
    const re = make(fort, t5); const r0 = re.read(); run(re, 300);
    r['reload drift 5 s'] = drift(r0, re.read());
    if (sim.snapshot) { const bytes = sim.snapshot(); const rs = sim.restore(bytes); const s0 = rs.read(); run(rs, 300); r['snapshot drift 5 s'] = drift(s0, rs.read()); r['snapshot bytes'] = bytes.length; }
    // 3. the shot, twice from the same settled state, for destruction and determinism
    const shot = () => { const s = make(fort, t5); s.addMarble(...SHOT); const before = s.read(), times = []; for (let i = 0; i < 480; i++) { const a = performance.now(); s.step(); times.push(performance.now() - a); } const after = s.read(); return { before, after, times }; };
    const A = shot(), Bs = shot();
    r['moved >1 cell'] = moved(A.after, A.before); r['plushies out after shot'] = plushOut(fort, A.after);
    r['same result twice'] = hash(A.after) === hash(Bs.after) ? 'yes' : 'no';
    // 4. cost: stress scene collapse (about 75 bodies, 4 marbles)
    const stress = stressPieces(), st = make(stress);
    run(st, 60);
    for (const ox of [0, 14, 28]) st.addMarble(ox - 14, 4, 17, 6.5);
    st.addMarble(30, 14, 20, 0);
    const ts = []; for (let i = 0; i < 240; i++) { const a = performance.now(); st.step(); ts.push(performance.now() - a); }
    ts.sort((x, y) => x - y);
    r['stress bodies'] = stress.length + 4; r['stress ms/step avg'] = ts.reduce((s, v) => s + v, 0) / ts.length; r['stress ms/step p95'] = ts[Math.floor(ts.length * 0.95)];
    rows.push(r);
  }
  const keys = [...new Set(rows.flatMap(r => Object.keys(r)))];
  for (const k of keys) console.log(k.padEnd(26), ...rows.map(r => String(fmt(r[k] ?? '–')).padStart(12)));
}
if (process.argv[2] === 'debug') debug(); else main();

async function debug() {
  const fort = fortPieces();
  for (const [name, init] of Object.entries(engines)) {
    const make = await init(), sim = make(fort); run(sim, 300); const t = sim.read();
    const f = t.map((q, i) => [i, fort[i].m, fort[i].kind, +(fort[i].y).toFixed(2), +q[1].toFixed(2)]).filter(([i, , , y0, y1]) => y1 < y0 - 0.5);
    console.log(name, JSON.stringify(f));
  }
}
