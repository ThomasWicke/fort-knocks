// The only file that talks to the physics engine (Box2D v3 via box2d3-wasm, compat build).
// Game code sees bodies as numbers and shapes as plain data, so the engine can be swapped (Rapier is the fallback).
import Box2DFactory from 'box2d3-wasm';
import wasmUrl from '../../node_modules/box2d3-wasm/build/dist/es/compat/Box2D.compat.wasm?url';

export interface Material { density: number; friction: number; restitution: number }
export type Shape =
  | { kind: 'box'; hw: number; hh: number; cx?: number; cy?: number; angle?: number }
  | { kind: 'poly'; pts: [number, number][] }
  | { kind: 'circle'; r: number };
export interface BodySpec {
  x: number; y: number; angle?: number; shapes: Shape[]; mat: Material;
  fixed?: boolean; bullet?: boolean; vx?: number; vy?: number;
}
export interface Transform { x: number; y: number; angle: number }

type B2 = Awaited<ReturnType<typeof Box2DFactory>>;
let B: B2 | null = null;

export async function initPhysics(): Promise<void> {
  if (B) return;
  B = await Box2DFactory({ locateFile: (path: string) => (path.endsWith('.wasm') ? wasmUrl : path) } as never);
}

export class World {
  private b = B!;
  private world: ReturnType<B2['b2CreateWorld']>;
  private bodies: (ReturnType<B2['b2CreateBody']> | null)[] = [];

  constructor(gravity = -10) {
    if (!B) throw new Error('initPhysics() first');
    const wd = this.b.b2DefaultWorldDef();
    wd.gravity = new this.b.b2Vec2(0, gravity);
    this.world = this.b.b2CreateWorld(wd);
  }

  add(spec: BodySpec): number {
    const b = this.b, bd = b.b2DefaultBodyDef();
    if (!spec.fixed) bd.type = b.b2BodyType.b2_dynamicBody;
    bd.position = new b.b2Vec2(spec.x, spec.y);
    bd.rotation = b.b2MakeRot(spec.angle ?? 0);
    if (spec.vx || spec.vy) bd.linearVelocity = new b.b2Vec2(spec.vx ?? 0, spec.vy ?? 0);
    if (spec.bullet) bd.isBullet = true;
    const body = b.b2CreateBody(this.world, bd);
    const sd = b.b2DefaultShapeDef();
    sd.density = spec.mat.density;
    const m = sd.material; m.friction = spec.mat.friction; m.restitution = spec.mat.restitution; sd.material = m;
    for (const s of spec.shapes) {
      if (s.kind === 'box') b.b2CreatePolygonShape(body, sd, s.cx || s.cy || s.angle
        ? b.b2MakeOffsetBox(s.hw, s.hh, new b.b2Vec2(s.cx ?? 0, s.cy ?? 0), b.b2MakeRot(s.angle ?? 0))
        : b.b2MakeBox(s.hw, s.hh));
      else if (s.kind === 'poly') b.b2CreatePolygonShape(body, sd, b.b2MakePolygon(b.b2ComputeHull(s.pts.map(([x, y]) => new b.b2Vec2(x, y))), 0));
      else { const c = new b.b2Circle(); c.radius = s.r; b.b2CreateCircleShape(body, sd, c); }
    }
    this.bodies.push(body);
    return this.bodies.length - 1;
  }

  remove(id: number): void {
    const body = this.bodies[id];
    if (body) { this.b.b2DestroyBody(body); this.bodies[id] = null; }
  }

  step(dt: number): void { this.b.b2World_Step(this.world, dt, 4); }

  transform(id: number): Transform {
    const body = this.bodies[id]!;
    const p = this.b.b2Body_GetPosition(body);
    return { x: p.x, y: p.y, angle: this.b.b2Rot_GetAngle(this.b.b2Body_GetRotation(body)) };
  }

  velocity(id: number): { x: number; y: number } {
    const v = this.b.b2Body_GetLinearVelocity(this.bodies[id]!);
    return { x: v.x, y: v.y };
  }

  awake(id: number): boolean { const body = this.bodies[id]; return !!body && this.b.b2Body_IsAwake(body); }

  destroy(): void { this.b.b2DestroyWorld(this.world); this.bodies = []; }
}
