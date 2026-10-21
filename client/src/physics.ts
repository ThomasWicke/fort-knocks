// The only file that talks to the physics engine (Box2D v3 via box2d3-wasm, compat build).
// Game code sees bodies as numbers and shapes as plain data, so the engine can be swapped (Rapier is the fallback).
import Box2DFactory from 'box2d3-wasm';

export interface Material { density: number; friction: number; restitution: number }
export type Shape =
  | { kind: 'box'; hw: number; hh: number; cx?: number; cy?: number; angle?: number }
  | { kind: 'poly'; pts: [number, number][] }
  | { kind: 'circle'; r: number };
export interface BodySpec {
  x: number; y: number; angle?: number; shapes: Shape[]; mat: Material;
  fixed?: boolean; bullet?: boolean; vx?: number; vy?: number; spin?: number;
  /** Report this body's contacts (World.begins) and hard hits (World.hits). Ammo uses it. */
  events?: boolean;
}
export interface Transform { x: number; y: number; angle: number }

type B2 = Awaited<ReturnType<typeof Box2DFactory>>;
type ShapeId = ReturnType<B2['b2CreatePolygonShape']>;
let B: B2 | null = null;

/** Load the engine. The browser passes the wasm file's URL; Node (the balance harness) finds it by itself. */
export async function initPhysics(wasmUrl?: string): Promise<void> {
  if (B) return;
  B = await Box2DFactory((wasmUrl ? { locateFile: (path: string) => (path.endsWith('.wasm') ? wasmUrl : path) } : {}) as never);
}

export class World {
  private b = B!;
  private world: ReturnType<B2['b2CreateWorld']>;
  private bodies: (ReturnType<B2['b2CreateBody']> | null)[] = [];
  private shapes: ShapeId[][] = [];
  private owner = new Map<number, number>();   // shape index → body number, for contact events
  private listening = new Set<number>();   // bodies with `events`
  /** Contacts that began during the last step, as pairs of body numbers (only pairs with an `events` body). */
  begins: [number, number][] = [];
  /** Hard hits during the last step, with the speed the two bodies approached at (m/s). */
  hits: { a: number; b: number; speed: number }[] = [];

  constructor(gravity = -10) {
    if (!B) throw new Error('initPhysics() first');
    const wd = this.b.b2DefaultWorldDef();
    wd.gravity = new this.b.b2Vec2(0, gravity);
    this.world = this.b.b2CreateWorld(wd);
  }

  add(spec: BodySpec): number {
    const b = this.b, bd = b.b2DefaultBodyDef(), n = this.bodies.length;
    if (!spec.fixed) bd.type = b.b2BodyType.b2_dynamicBody;
    bd.position = new b.b2Vec2(spec.x, spec.y);
    bd.rotation = b.b2MakeRot(spec.angle ?? 0);
    if (spec.vx || spec.vy) bd.linearVelocity = new b.b2Vec2(spec.vx ?? 0, spec.vy ?? 0);
    if (spec.spin) bd.angularVelocity = spec.spin;
    if (spec.bullet) bd.isBullet = true;
    const body = b.b2CreateBody(this.world, bd);
    const sd = b.b2DefaultShapeDef();
    sd.density = spec.mat.density;
    const m = sd.material; m.friction = spec.mat.friction; m.restitution = spec.mat.restitution; sd.material = m;
    if (spec.events) { sd.enableContactEvents = true; sd.enableHitEvents = true; this.listening.add(n); }
    const ids: ShapeId[] = [];
    for (const s of spec.shapes) {
      if (s.kind === 'box') ids.push(b.b2CreatePolygonShape(body, sd, s.cx || s.cy || s.angle
        ? b.b2MakeOffsetBox(s.hw, s.hh, new b.b2Vec2(s.cx ?? 0, s.cy ?? 0), b.b2MakeRot(s.angle ?? 0))
        : b.b2MakeBox(s.hw, s.hh)));
      else if (s.kind === 'poly') ids.push(b.b2CreatePolygonShape(body, sd, b.b2MakePolygon(b.b2ComputeHull(s.pts.map(([x, y]) => new b.b2Vec2(x, y))), 0)));
      else { const c = new b.b2Circle(); c.radius = s.r; ids.push(b.b2CreateCircleShape(body, sd, c)); }
    }
    for (const id of ids) this.owner.set(id.index1, n);
    this.bodies.push(body); this.shapes.push(ids);
    return n;
  }

  remove(id: number): void {
    const body = this.bodies[id];
    if (!body) return;
    for (const s of this.shapes[id]) if (this.owner.get(s.index1) === id) this.owner.delete(s.index1);
    this.listening.delete(id);
    this.b.b2DestroyBody(body); this.bodies[id] = null; this.shapes[id] = [];
  }

  step(dt: number): void {
    this.b.b2World_Step(this.world, dt, 4);
    this.begins = []; this.hits = [];
    if (!this.listening.size) return;
    const ev = this.b.b2World_GetContactEvents(this.world);
    for (let i = 0; i < ev.beginCount; i++) {
      const e = ev.GetBeginEvent(i), a = this.owner.get(e.shapeIdA.index1), c = this.owner.get(e.shapeIdB.index1);
      if (a !== undefined && c !== undefined) this.begins.push([a, c]);
      e.delete();
    }
    for (let i = 0; i < ev.hitCount; i++) {
      const e = ev.GetHitEvent(i), a = this.owner.get(e.shapeIdA.index1), c = this.owner.get(e.shapeIdB.index1);
      if (a !== undefined && c !== undefined) this.hits.push({ a, b: c, speed: e.approachSpeed });
      e.delete();
    }
    ev.delete();
  }

  transform(id: number): Transform {
    const body = this.bodies[id]!;
    const p = this.b.b2Body_GetPosition(body);
    return { x: p.x, y: p.y, angle: this.b.b2Rot_GetAngle(this.b.b2Body_GetRotation(body)) };
  }

  velocity(id: number): { x: number; y: number } {
    const v = this.b.b2Body_GetLinearVelocity(this.bodies[id]!);
    return { x: v.x, y: v.y };
  }
  setVelocity(id: number, vx: number, vy: number, spin?: number): void {
    const body = this.bodies[id]!;
    this.b.b2Body_SetLinearVelocity(body, new this.b.b2Vec2(vx, vy));
    if (spin !== undefined) this.b.b2Body_SetAngularVelocity(body, spin);
  }
  /** Kinematic bodies move at their set velocity and shove everything aside (the spinning top's drill). */
  setKinematic(id: number, on: boolean): void {
    this.b.b2Body_SetType(this.bodies[id]!, on ? this.b.b2BodyType.b2_kinematicBody : this.b.b2BodyType.b2_dynamicBody);
  }
  setTransform(id: number, x: number, y: number, angle: number): void {
    this.b.b2Body_SetTransform(this.bodies[id]!, new this.b.b2Vec2(x, y), this.b.b2MakeRot(angle));
    this.b.b2Body_SetLinearVelocity(this.bodies[id]!, new this.b.b2Vec2(0, 0)); this.b.b2Body_SetAngularVelocity(this.bodies[id]!, 0);
  }
  impulse(id: number, ix: number, iy: number): void { this.b.b2Body_ApplyLinearImpulseToCenter(this.bodies[id]!, new this.b.b2Vec2(ix, iy), true); }
  setFriction(id: number, f: number): void { for (const s of this.shapes[id]) this.b.b2Shape_SetFriction(s, f); }
  mass(id: number): number { return this.b.b2Body_GetMass(this.bodies[id]!); }

  awake(id: number): boolean { const body = this.bodies[id]; return !!body && this.b.b2Body_IsAwake(body); }
  exists(id: number): boolean { return !!this.bodies[id]; }

  destroy(): void { this.b.b2DestroyWorld(this.world); this.bodies = []; this.shapes = []; this.owner.clear(); this.listening.clear(); }
}
