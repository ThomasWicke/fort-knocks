// Pieces, materials and the test fort. Units: 1 cell = 1 m; x from the rug's left edge, y up from the rug top.
// Numbers are starting values from docs/04-systems.md (weights: card 0.2, domino 0.6, block 1, plushie 0.5, book 3).
import type { BodySpec, Material, Shape } from './physics';

export type PieceType = 'block' | 'long' | 'arch' | 'tri' | 'bookLie' | 'bookStand' | 'domStand' | 'domLie' | 'cardFlat' | 'cardTent' | 'plush';
export type Family = 'card' | 'domino' | 'block' | 'book' | 'plush';
export type Paint = 'toyRed' | 'toyYellow' | 'wood' | 'cream' | 'bookOx' | 'bookMustard' | 'bookPlum';
export type Plushie = 'brumm' | 'hoppel' | 'socke';

export interface Piece {
  type: PieceType;
  x: number; y: number;          // lower-left corner of the piece's box
  w: number; h: number;
  paint?: Paint; sym?: 'circle' | 'triangle' | 'star'; pips?: [number, number]; plush?: Plushie;
}

export const MATERIALS: Record<Family | 'marble' | 'floor', Material> = {
  card: { density: 1.0, friction: 0.45, restitution: 0.02 },
  domino: { density: 0.6, friction: 0.6, restitution: 0.05 },
  block: { density: 1.0, friction: 0.8, restitution: 0.05 },
  book: { density: 2.0, friction: 0.8, restitution: 0.02 },
  plush: { density: 0.5, friction: 0.9, restitution: 0.0 },
  marble: { density: 8.0, friction: 0.3, restitution: 0.2 },
  floor: { density: 0, friction: 0.8, restitution: 0 },
};

export const familyOf = (t: PieceType): Family =>
  t === 'cardFlat' || t === 'cardTent' ? 'card' : t === 'domStand' || t === 'domLie' ? 'domino' : t === 'bookLie' || t === 'bookStand' ? 'book' : t === 'plush' ? 'plush' : 'block';

// Prices from docs/04-systems.md; destruction is measured as a share of what was built.
export const valueOf = (t: PieceType): number =>
  t === 'long' || t === 'arch' ? 3 : familyOf(t) === 'block' ? 2 : familyOf(t) === 'book' ? 3 : familyOf(t) === 'plush' ? 0 : 1;

export const CARD_T = 0.12;   // physics thickness of a card; drawn thinner

// Shapes in body-local coordinates (origin = centre of the piece's box, y up).
export function shapesOf(p: Piece): Shape[] {
  const hw = p.w / 2, hh = p.h / 2;
  switch (p.type) {
    case 'arch':   // two feet and a lintel; the gap approximates the drawn half-circle
      return [{ kind: 'box', hw: 0.275 * hw, hh: 0.225 * p.h, cx: -0.725 * hw, cy: -0.275 * p.h },
              { kind: 'box', hw: 0.275 * hw, hh: 0.225 * p.h, cx: 0.725 * hw, cy: -0.275 * p.h },
              { kind: 'box', hw, hh: 0.275 * p.h, cy: 0.225 * p.h }];
    case 'tri':
      return [{ kind: 'poly', pts: [[-hw, -hh], [hw, -hh], [0, hh]] }];
    case 'cardTent': {   // ONE rigid piece: two cards joined at the top (Phase 6 spike)
      const len = Math.hypot(hw, p.h), lean = Math.atan2(hw, p.h);
      return [{ kind: 'box', hw: CARD_T / 2, hh: len / 2, cx: -hw / 2, angle: -lean },
              { kind: 'box', hw: CARD_T / 2, hh: len / 2, cx: hw / 2, angle: lean }];
    }
    default:
      return [{ kind: 'box', hw, hh }];
  }
}

export function bodyOf(p: Piece, rugX: number): BodySpec {
  return { x: rugX + p.x + p.w / 2, y: p.y + p.h / 2, shapes: shapesOf(p), mat: MATERIALS[familyOf(p.type)] };
}

// The fort from the style frame, with the two fixes the spike found (card tent as one piece; triangle on top of the domino).
export const TEST_FORT: Piece[] = [
  { type: 'bookLie', x: 0, y: 0, w: 3, h: 0.5, paint: 'bookOx' },
  { type: 'bookLie', x: 0, y: 0.5, w: 3, h: 0.5, paint: 'bookMustard' },
  { type: 'block', x: 0, y: 1, w: 1, h: 1, paint: 'toyRed', sym: 'circle' },
  { type: 'block', x: 2, y: 1, w: 1, h: 1, paint: 'wood', sym: 'star' },
  { type: 'bookLie', x: 0, y: 2, w: 3, h: 0.5, paint: 'bookPlum' },
  { type: 'block', x: 1, y: 2.5, w: 1, h: 1, paint: 'cream', sym: 'triangle' },
  { type: 'arch', x: 3.5, y: 0, w: 2, h: 1, paint: 'toyRed' },
  { type: 'domStand', x: 3.55, y: 1, w: 0.5, h: 2, pips: [2, 5] },
  { type: 'domStand', x: 4.95, y: 1, w: 0.5, h: 2, pips: [6, 1] },
  { type: 'cardFlat', x: 3.4, y: 3, w: 2.2, h: CARD_T },
  { type: 'cardTent', x: 3.75, y: 3 + CARD_T, w: 1.5, h: 1.37 },
  { type: 'cardFlat', x: 3.5, y: 3 + CARD_T + 1.37, w: 2, h: CARD_T },
  { type: 'long', x: 6, y: 0, w: 2, h: 1, paint: 'toyYellow', sym: 'circle' },
  { type: 'long', x: 8, y: 0, w: 2, h: 1, paint: 'toyRed', sym: 'star' },
  { type: 'bookStand', x: 6.4, y: 1, w: 0.5, h: 3, paint: 'bookMustard' },
  { type: 'bookStand', x: 9.1, y: 1, w: 0.5, h: 3, paint: 'bookOx' },
  { type: 'block', x: 7.3, y: 1, w: 1, h: 1, paint: 'toyYellow', sym: 'triangle' },
  { type: 'domLie', x: 7.05, y: 2, w: 1.5, h: 0.4, pips: [3, 4] },
  { type: 'tri', x: 7.3, y: 2.4, w: 1, h: 1, paint: 'wood' },
  { type: 'bookLie', x: 6.5, y: 4, w: 3, h: 0.5, paint: 'bookPlum' },
  { type: 'plush', x: 1, y: 3.5, w: 1, h: 1, plush: 'brumm' },
  { type: 'plush', x: 4, y: 3 + 2 * CARD_T + 1.37, w: 1, h: 1, plush: 'hoppel' },
  { type: 'plush', x: 7.55, y: 4.5, w: 1, h: 1, plush: 'socke' },
];
