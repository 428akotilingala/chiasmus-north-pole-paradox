/*
  Pure maze rules, shared by the Phaser scene and the solver tests, so the
  game plays by exactly the rules the solver proves solvable.

  Legend
    #  ice wall              .  floor          ,  ice floor (decor)
    S  start                 X  exit portal    C  checkpoint lantern
    M  mirror pad (R flips reality)            *  sparkle (collectible)
    A  gold door: open in Reality A-B, shut in Mirror B-A
    B  cyan door: open in Mirror B-A, shut in Reality A-B
    ~  chasm                 =  ice bridge, exists only in B-A
    -  bridge, exists only in A-B
    ^  gingerbread hazard, active in A-B      v  glitch hazard, active in B-A
    1-4 chiasmus gate (passable once answered)
    c  gift box (pushable)   o  pressure plate  P  plate door (open while a box sits on a plate)
    L  lever (solid)         l  lever door (open after the lever is pulled)
    h  cracked wall: solid in A-B, open in B-A (secret)
    R  Reverso the reindeer  H  Hoops the elf (secret)
    T  tree  F  fireplace  g  gift pile  O  clock gear  Q  hoop  K  trophy   (solid decor)
*/

export type Reality = 'A' | 'B';
export type Dir = 'up' | 'down' | 'left' | 'right';

export const DIRS: Record<Dir, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

export interface ParsedLevel {
  w: number;
  h: number;
  /** tiles with crates removed (crate cells become floor) */
  tiles: string[][];
  start: [number, number];
  crates: number[];
  plates: number[];
}

export interface DynState {
  reality: Reality;
  lever: boolean;
  crates: Set<number>;
  solved: Set<string>;
}

const SOLID_DECOR = new Set(['#', 'T', 'F', 'g', 'O', 'Q', 'K', 'L', 'R', 'H']);
const CRATE_OK = new Set(['.', ',', 'S', 'o', '*']);

export function parseLevel(map: string[]): ParsedLevel {
  const h = map.length;
  const w = map[0].length;
  const tiles: string[][] = [];
  const crates: number[] = [];
  const plates: number[] = [];
  let start: [number, number] = [1, 1];
  for (let y = 0; y < h; y++) {
    if (map[y].length !== w) throw new Error(`Row ${y} has length ${map[y].length}, expected ${w}`);
    const row: string[] = [];
    for (let x = 0; x < w; x++) {
      let ch = map[y][x];
      if (ch === 'S') start = [x, y];
      if (ch === 'c') {
        crates.push(y * w + x);
        ch = '.';
      }
      if (ch === 'o') plates.push(y * w + x);
      row.push(ch);
    }
    tiles.push(row);
  }
  return { w, h, tiles, start, crates, plates };
}

export function isGate(ch: string): boolean {
  return ch >= '1' && ch <= '4';
}

export function platesPressed(lv: ParsedLevel, st: DynState): boolean {
  return lv.plates.some((p) => st.crates.has(p));
}

/** Is this hazard tile dangerous in the current reality? */
export function hazardActive(ch: string, r: Reality): boolean {
  return (ch === '^' && r === 'A') || (ch === 'v' && r === 'B');
}

/** Can the player stand on this tile? (Hazards count as standable; stepping on an active one triggers an ambush.) */
export function tileOpen(ch: string, lv: ParsedLevel, st: DynState): boolean {
  if (SOLID_DECOR.has(ch)) return false;
  switch (ch) {
    case '~':
      return false;
    case '=':
      return st.reality === 'B';
    case '-':
      return st.reality === 'A';
    case 'A':
      return st.reality === 'A';
    case 'B':
      return st.reality === 'B';
    case 'h':
      return st.reality === 'B';
    case 'P':
      return platesPressed(lv, st);
    case 'l':
      return st.lever;
    default:
      if (isGate(ch)) return st.solved.has(ch);
      return true;
  }
}

export function crateCanEnter(ch: string): boolean {
  return CRATE_OK.has(ch);
}

export type MoveResult =
  | { kind: 'blocked'; reason: 'wall' | 'door' | 'chasm' | 'crate' }
  | { kind: 'gate'; gate: string; x: number; y: number }
  | { kind: 'npc'; who: 'R' | 'H'; x: number; y: number }
  | { kind: 'lever'; x: number; y: number }
  | { kind: 'move'; x: number; y: number; push?: { from: number; to: number } };

/** Decide what happens when the player at (x,y) tries to step in direction d. */
export function tryMove(lv: ParsedLevel, st: DynState, x: number, y: number, d: Dir): MoveResult {
  const [dx, dy] = DIRS[d];
  const nx = x + dx;
  const ny = y + dy;
  if (nx < 0 || ny < 0 || nx >= lv.w || ny >= lv.h) return { kind: 'blocked', reason: 'wall' };
  const ch = lv.tiles[ny][nx];
  if (ch === 'R' || ch === 'H') return { kind: 'npc', who: ch, x: nx, y: ny };
  if (ch === 'L') return { kind: 'lever', x: nx, y: ny };
  if (isGate(ch) && !st.solved.has(ch)) return { kind: 'gate', gate: ch, x: nx, y: ny };
  if (!tileOpen(ch, lv, st)) {
    const reason = ch === '~' || ch === '=' || ch === '-' ? 'chasm' : 'ABPlh'.includes(ch) ? 'door' : 'wall';
    return { kind: 'blocked', reason };
  }
  const idx = ny * lv.w + nx;
  if (st.crates.has(idx)) {
    const bx = nx + dx;
    const by = ny + dy;
    if (bx < 0 || by < 0 || bx >= lv.w || by >= lv.h) return { kind: 'blocked', reason: 'crate' };
    const bidx = by * lv.w + bx;
    const bch = lv.tiles[by][bx];
    if (!crateCanEnter(bch) || st.crates.has(bidx)) return { kind: 'blocked', reason: 'crate' };
    return { kind: 'move', x: nx, y: ny, push: { from: idx, to: bidx } };
  }
  return { kind: 'move', x: nx, y: ny };
}

export function cloneState(st: DynState): DynState {
  return { reality: st.reality, lever: st.lever, crates: new Set(st.crates), solved: new Set(st.solved) };
}
