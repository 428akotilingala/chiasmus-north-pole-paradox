import type { Reality } from '../game/logic';
import { OUTLINE } from './characters';
import { Px, shade } from './px';

/* 16x16 maze tiles in two palettes. Reality A-B is a snowy workshop; Mirror B-A is its purple, inverted reflection. */

export interface Pal {
  snowCap: string;
  floor: string;
  floor2: string;
  spark: string;
  wallTop: string;
  wallTop2: string;
  wallFace: string;
  wallDark: string;
  wallLine: string;
  chasm: string;
  star: string;
  ghost: string;
  accent: string;
}

export const PAL: Record<Reality, Pal> = {
  A: {
    snowCap: '#f7fafc',
    floor: '#e3ecf7',
    floor2: '#cbd8ea',
    spark: '#ffffff',
    wallTop: '#a9c2e3',
    wallTop2: '#8aa6cf',
    wallFace: '#4a6fa5',
    wallDark: '#2c4672',
    wallLine: '#6b8fc4',
    chasm: '#0b1220',
    star: '#33466e',
    ghost: 'rgba(16,24,39,0.22)',
    accent: '#F7C65F',
  },
  B: {
    snowCap: '#c9b8ff',
    floor: '#2b1f4d',
    floor2: '#3a2a66',
    spark: '#69E6F1',
    wallTop: '#5a3a9a',
    wallTop2: '#462a80',
    wallFace: '#6b3fb8',
    wallDark: '#3e2275',
    wallLine: '#8a62d6',
    chasm: '#07040f',
    star: '#9B5DE5',
    ghost: 'rgba(105,230,241,0.28)',
    accent: '#69E6F1',
  },
};

const GOLD = '#F7C65F';
const GOLD_D = '#b98426';
const CYAN = '#69E6F1';
const CYAN_D = '#2a9fb0';
const RED = '#E63946';
const RED_D = '#a51f2e';
const GREEN = '#147D64';
const WHITE = '#F7FAFC';

function hash(x: number, y: number) {
  let h = x * 374761393 + y * 668265263;
  h = (h ^ (h >>> 13)) * 1274126177;
  return (h ^ (h >>> 16)) >>> 0;
}

export function floor(r: Reality, variant = 0): Px {
  const c = PAL[r];
  const p = new Px(16, 16);
  p.rect(0, 0, 16, 16, c.floor);
  for (let i = 0; i < 7; i++) {
    const h = hash(i + variant * 31, variant * 7 + i * 3);
    p.set(h % 16, (h >>> 5) % 16, c.floor2);
  }
  if (variant % 3 === 1) p.pts([[4, 5], [11, 11]], c.spark);
  if (variant % 3 === 2) p.pts([[12, 3], [3, 12], [3, 13]], c.floor2);
  return p;
}

export function iceFloor(r: Reality): Px {
  const c = PAL[r];
  const p = floor(r, 0);
  p.rect(1, 1, 14, 14, r === 'A' ? '#d3e8f7' : '#33255c');
  p.pts([[3, 3], [4, 4], [5, 5], [10, 9], [11, 10]], c.spark);
  return p;
}

/** wall seen from above (another wall below it) */
export function wallTop(r: Reality, variant = 0): Px {
  const c = PAL[r];
  const p = new Px(16, 16);
  const hi = shade(c.wallTop, 0.35);
  p.rect(0, 0, 16, 16, c.wallTop);
  // four ice blocks with a bright top-left edge and a dark seam
  for (const [bx, by] of [[0, 0], [8, 0], [0, 8], [8, 8]]) {
    const ox = (bx + (by && variant % 2 ? 4 : 0)) % 16;
    p.row(by, ox, ox + 6, hi);
    p.col(ox, by, by + 6, hi);
    p.row(by + 7, ox, ox + 7, c.wallTop2);
    p.col((ox + 7) % 16, by, by + 7, c.wallTop2);
  }
  return p;
}

/** wall with its brick face showing (floor below it) */
export function wallFace(r: Reality, variant = 0): Px {
  const c = PAL[r];
  const p = new Px(16, 16);
  p.rect(0, 0, 16, 5, c.snowCap);
  p.row(4, 0, 15, shade(c.snowCap, -0.12));
  p.rect(0, 5, 16, 11, c.wallFace);
  p.row(9, 0, 15, c.wallDark);
  p.row(13, 0, 15, c.wallDark);
  const off = variant % 2 ? 4 : 0;
  for (const x of [3 + off, 11 + off]) p.col(x % 16, 5, 8, c.wallDark);
  for (const x of [7 + off, 15]) p.col(x % 16, 10, 12, c.wallDark);
  p.row(5, 0, 15, c.wallLine);
  p.row(15, 0, 15, shade(c.wallDark, -0.2));
  // icicles / snow lip
  p.pts([[2, 5], [2, 6], [9, 5], [13, 5], [13, 6], [13, 7]], c.snowCap);
  return p;
}

export function chasm(r: Reality, edge: boolean, variant = 0): Px {
  const c = PAL[r];
  const p = new Px(16, 16);
  p.rect(0, 0, 16, 16, c.chasm);
  const h = hash(variant, 3);
  p.pts([[h % 16, (h >>> 4) % 16], [(h >>> 8) % 16, (h >>> 12) % 16]], c.star);
  if (edge) {
    p.rect(0, 0, 16, 3, shade(c.wallFace, -0.35));
    p.row(0, 0, 15, c.floor2);
  }
  return p;
}

export function bridge(r: Reality, kind: '=' | '-', present: boolean, edge: boolean): Px {
  const p = chasm(r, edge);
  if (!present) {
    // ghost outline shows where the bridge exists in the other reality
    const g = kind === '=' ? 'rgba(105,230,241,0.45)' : 'rgba(247,198,95,0.45)';
    for (let x = 0; x < 16; x += 2) {
      p.set(x, 3, g);
      p.set(x + 1, 12, g);
    }
    return p;
  }
  const plank = kind === '=' ? CYAN : '#b98a54';
  const pd = kind === '=' ? CYAN_D : '#7a5530';
  p.rect(0, 3, 16, 10, plank);
  for (let x = 3; x < 16; x += 4) p.col(x, 3, 12, pd);
  p.row(3, 0, 15, shade(plank, 0.3));
  p.row(12, 0, 15, pd);
  p.row(13, 0, 15, 'rgba(0,0,0,0.35)');
  return p;
}

function letter(p: Px, ch: 'A' | 'B', x: number, y: number, c: string) {
  const A = ['.##.', '#..#', '####', '#..#', '#..#'];
  const B = ['###.', '#..#', '###.', '#..#', '###.'];
  (ch === 'A' ? A : B).forEach((row, j) => [...row].forEach((v, i) => v === '#' && p.set(x + i, y + j, c)));
}

export function door(r: Reality, which: 'A' | 'B', open: boolean): Px {
  const p = floor(r, 0);
  const main = which === 'A' ? GOLD : CYAN;
  const dark = which === 'A' ? GOLD_D : CYAN_D;
  if (open) {
    // frame marks on the ground
    p.rect(0, 0, 2, 16, dark);
    p.rect(14, 0, 2, 16, dark);
    p.pts([[5, 7], [10, 8]], main);
    return p;
  }
  p.rect(0, 0, 16, 16, dark);
  p.rect(1, 1, 14, 14, main);
  for (const x of [3, 7, 11]) p.col(x, 1, 14, dark);
  p.rect(5, 5, 6, 7, dark);
  letter(p, which, 6, 6, WHITE);
  p.row(1, 1, 14, shade(main, 0.35));
  return p;
}

export function gingerbread(r: Reality, active: boolean): Px {
  const p = floor(r, 2);
  const g = new Px(16, 16);
  const c = '#c46a2f';
  g.disc(8, 4, 3, c);
  g.rect(5, 7, 6, 5, c);
  g.pts([[3, 8], [4, 8], [11, 8], [12, 8], [2, 9], [13, 9]], c);
  g.rect(5, 12, 2, 3, c);
  g.rect(9, 12, 2, 3, c);
  g.pts([[7, 4], [9, 4]], '#160f24');
  g.pts([[7, 6], [8, 5], [9, 6]], WHITE);
  g.pts([[8, 8], [8, 10]], RED);
  g.row(7, 5, 10, WHITE);
  g.pts([[6, 3], [10, 3]], '#160f24'); // angry brows
  g.outline(OUTLINE);
  if (!active) {
    for (let i = 0; i < g.data.length; i++) if (g.data[i]) g.data[i] = (i + Math.floor(i / 16)) % 2 ? PAL[r].ghost : null;
  }
  p.stamp(g);
  return p;
}

export function glitch(r: Reality, active: boolean): Px {
  const p = floor(r, 1);
  const g = new Px(16, 16);
  const c = '#9B5DE5';
  g.runs([[3, 4, 4], [4, 3, 5], [5, 3, 5], [6, 2, 6], [7, 2, 6], [8, 2, 6]], c);
  g.runs([[1, 10, 10], [2, 9, 11], [3, 9, 11], [4, 8, 12], [5, 8, 12], [6, 8, 12], [7, 8, 12], [8, 8, 12]], c);
  g.runs([[9, 1, 14], [10, 2, 13], [11, 3, 12]], '#5b2d99');
  g.pts([[4, 5], [10, 3], [10, 5]], CYAN);
  g.pts([[3, 7], [5, 7], [9, 6], [11, 6]], '#ff5f8f');
  g.outline(OUTLINE);
  if (!active) {
    for (let i = 0; i < g.data.length; i++) if (g.data[i]) g.data[i] = (i + Math.floor(i / 16)) % 2 ? PAL[r].ghost : null;
  }
  p.stamp(g, 0, 2);
  return p;
}

export function mirrorPad(r: Reality, frame: number): Px {
  const p = floor(r, 0);
  const rim = r === 'A' ? GOLD : CYAN;
  const glass = r === 'A' ? '#9fe9f2' : '#c8a2ff';
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      const d = ((x - 7.5) / 6.8) ** 2 + ((y - 7.5) / 6.8) ** 2;
      if (d <= 1) p.set(x, y, d > 0.72 ? rim : glass);
    }
  // moving shine
  const s = (frame % 4) * 2;
  p.pts([[4 + s, 4], [3 + s, 5], [5 + s, 4]], WHITE);
  p.pts([[9, 11], [10, 10]], 'rgba(255,255,255,0.7)');
  p.pts([[7, 0], [8, 0], [7, 15], [8, 15], [0, 7], [15, 8]], r === 'A' ? GOLD_D : CYAN_D);
  return p;
}

export function gate(r: Reality, open: boolean): Px {
  const p = floor(r, 0);
  if (open) {
    p.rect(0, 0, 2, 16, RED_D);
    p.rect(14, 0, 2, 16, RED_D);
    // chi inlay on the floor
    for (let i = 0; i < 9; i++) {
      p.set(4 + i, 4 + i, GOLD_D);
      p.set(12 - i, 4 + i, GOLD_D);
    }
    return p;
  }
  p.rect(0, 0, 16, 16, RED_D);
  p.rect(1, 1, 14, 15, RED);
  p.row(1, 1, 14, '#ff6b75');
  p.rect(2, 2, 12, 12, RED_D);
  // gold chi
  for (let i = 0; i < 8; i++) {
    p.set(4 + i, 4 + i, GOLD);
    p.set(5 + i, 4 + i, GOLD);
    p.set(11 - i, 4 + i, GOLD);
    p.set(10 - i, 4 + i, GOLD);
  }
  p.pts([[3, 3], [12, 3], [3, 12], [12, 12]], GOLD_D);
  return p;
}

export function lantern(r: Reality, lit: boolean, frame: number): Px {
  const p = floor(r, 0);
  if (lit) {
    const glow = 'rgba(247,198,95,0.35)';
    p.disc(7.5, 8, 6, glow);
  }
  p.rect(6, 3, 4, 1, '#2a2340');
  p.rect(5, 4, 6, 7, '#2a2340');
  p.rect(6, 5, 4, 5, lit ? (frame % 2 ? '#ffe9a8' : GOLD) : '#5d6680');
  if (lit) p.rect(7, 6, 2, 3, frame % 2 ? GOLD : '#fff3c8');
  p.rect(4, 11, 8, 2, '#2a2340');
  p.set(7, 2, '#2a2340');
  p.set(8, 2, '#2a2340');
  return p;
}

export function giftBox(color = RED): Px {
  const p = new Px(16, 16);
  const d = shade(color, -0.3);
  p.rect(1, 4, 14, 11, color);
  p.rect(1, 4, 14, 3, shade(color, 0.15));
  p.rect(1, 13, 14, 2, d);
  p.col(14, 4, 14, d);
  p.rect(7, 4, 2, 11, GOLD);
  p.rect(1, 8, 14, 2, GOLD);
  p.pts([[5, 1], [6, 2], [6, 3], [4, 2], [10, 1], [9, 2], [9, 3], [11, 2], [7, 3], [8, 3]], GOLD);
  p.outline(OUTLINE);
  return p;
}

export function plate(r: Reality, pressed: boolean): Px {
  const p = floor(r, 0);
  p.rect(2, 2, 12, 12, pressed ? GOLD : '#8a96b0');
  p.rect(3, 3, 10, 10, pressed ? '#ffe9a8' : '#a7b2c8');
  p.pts([[6, 7], [7, 8], [8, 8], [9, 7], [5, 6], [10, 6], [7, 9], [8, 9]], pressed ? RED : '#6b7690');
  return p;
}

export function plateDoor(r: Reality, open: boolean): Px {
  const p = floor(r, 0);
  if (open) {
    p.pts([[0, 0], [15, 0], [0, 15], [15, 15]], RED);
    p.rect(0, 0, 1, 16, RED_D);
    p.rect(15, 0, 1, 16, RED_D);
    return p;
  }
  p.rect(0, 0, 16, 16, '#5d2a35');
  for (const x of [1, 6, 11]) {
    p.rect(x, 0, 4, 16, WHITE);
    for (let y = 0; y < 16; y += 4) p.rect(x, y, 4, 2, RED);
  }
  return p;
}

export function lever(r: Reality, on: boolean): Px {
  const p = floor(r, 0);
  p.rect(3, 10, 10, 5, '#3a3456');
  p.row(10, 3, 12, '#5d5680');
  const stick: [number, number][] = on
    ? [[8, 9], [9, 8], [10, 7], [11, 6], [12, 5], [12, 4], [11, 3]]
    : [[7, 9], [6, 8], [5, 7], [4, 6], [3, 5], [3, 4], [4, 3]];
  stick.forEach(([x, y], i) => p.set(x, y, i % 2 ? WHITE : RED));
  p.disc(on ? 11 : 4, 3, 1, i2(on));
  p.set(on ? 8 : 7, 12, on ? '#7bff9f' : RED);
  return p;
  function i2(o: boolean) {
    return o ? RED : RED_D;
  }
}

export function leverDoor(r: Reality, open: boolean): Px {
  const p = floor(r, 0);
  if (open) {
    p.rect(0, 0, 1, 16, '#0b5544');
    p.rect(15, 0, 1, 16, '#0b5544');
    return p;
  }
  p.rect(0, 0, 16, 16, '#0b5544');
  p.rect(1, 1, 14, 15, GREEN);
  for (const y of [5, 10]) p.row(y, 1, 14, '#0b5544');
  p.disc(7.5, 3, 1.5, GOLD);
  p.set(7, 5, GOLD_D);
  p.set(8, 5, GOLD_D);
  return p;
}

export function exitPortal(r: Reality, frame: number): Px {
  const p = floor(r, 0);
  const cols = [GOLD, CYAN, WHITE, '#9B5DE5'];
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      const dx = x - 7.5;
      const dy = y - 7.5;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > 7.2) continue;
      const ang = Math.atan2(dy, dx) + frame * 0.6 + d * 0.5;
      const band = Math.floor(((ang / (Math.PI * 2)) * 4 + 8) % 4);
      p.set(x, y, d < 2 ? WHITE : cols[band]);
    }
  return p;
}

export function tree(r: Reality, frame: number): Px {
  const p = floor(r, 1);
  const t = new Px(16, 16);
  const g = '#147D64';
  const gd = '#0b5544';
  t.runs([[1, 7, 8], [2, 6, 9], [3, 5, 10], [4, 6, 9], [5, 4, 11], [6, 3, 12], [7, 5, 10], [8, 3, 12], [9, 2, 13], [10, 1, 14], [11, 2, 13]], g);
  t.pts([[10, 3], [11, 6], [12, 9], [13, 10]], gd);
  t.rect(7, 12, 2, 3, '#6a4029');
  t.set(7, 0, GOLD);
  t.set(8, 0, GOLD);
  const lights: [number, number][] = [[6, 4], [9, 6], [5, 8], [10, 9], [3, 10], [8, 10], [12, 11]];
  const cols = [RED, GOLD, CYAN, WHITE];
  lights.forEach(([x, y], i) => t.set(x, y, cols[(i + frame) % 4]));
  t.outline(OUTLINE);
  p.stamp(t);
  return p;
}

export function fireplace(frame: number): Px {
  const p = new Px(16, 16);
  p.rect(0, 0, 16, 16, '#7a3a2a');
  for (let y = 1; y < 16; y += 3) for (let x = (y % 2) * 2; x < 16; x += 4) p.rect(x, y, 3, 2, '#9a4a36');
  p.rect(0, 0, 16, 3, '#4a2e1e');
  p.rect(3, 6, 10, 10, '#1a0d10');
  const fl = frame % 3;
  p.runs([[15, 4, 11], [14, 5, 10], [13, 5 + (fl === 1 ? 1 : 0), 10], [12, 6, 9 + (fl === 2 ? 1 : 0)], [11, 6 + fl % 2, 8], [10, 7, 8 - (fl === 0 ? 1 : 0)]], '#f08a3c');
  p.runs([[15, 5, 10], [14, 6, 9], [13, 7, 8], [12, 7, 8 - (fl === 1 ? 1 : 0)]], GOLD);
  p.pts([[7, 15], [8, 15], [8, 14]], WHITE);
  // stockings
  p.rect(2, 3, 2, 3, RED);
  p.rect(12, 3, 2, 3, GREEN);
  return p;
}

export function giftPile(r: Reality): Px {
  const p = floor(r, 2);
  const a = giftBox(GREEN);
  const b = giftBox('#9B5DE5');
  const g = new Px(16, 16);
  g.stamp(scaleDown(a), 0, 6);
  g.stamp(scaleDown(b), 7, 7);
  g.stamp(scaleDown(giftBox(RED)), 3, 0);
  p.stamp(g);
  return p;
}

function scaleDown(src: Px): Px {
  const p = new Px(9, 9);
  for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) p.set(x, y, src.get(Math.floor(x * 1.78), Math.floor(y * 1.78)));
  return p;
}

export function gear(r: Reality, frame: number): Px {
  const p = wallTop(r, 3);
  const c = r === 'A' ? '#b98426' : '#8a62d6';
  const cd = r === 'A' ? '#7a5518' : '#5b2d99';
  p.disc(7.5, 7.5, 5, c);
  const teeth = frame % 2 ? [[7, 1], [8, 1], [7, 14], [8, 14], [1, 7], [1, 8], [14, 7], [14, 8]] : [[3, 3], [12, 3], [3, 12], [12, 12], [2, 4], [13, 4], [2, 11], [13, 11]];
  p.pts(teeth as [number, number][], c);
  p.disc(7.5, 7.5, 2, cd);
  p.pts([[7, 7], [8, 8]], r === 'A' ? '#f7e1a0' : '#c8a2ff');
  return p;
}

export function hoop(r: Reality): Px {
  const p = floor(r, 0);
  p.rect(2, 0, 12, 7, WHITE);
  p.rect(5, 2, 6, 4, 'rgba(230,57,70,0)');
  p.row(2, 5, 10, RED);
  p.row(5, 5, 10, RED);
  p.col(5, 2, 5, RED);
  p.col(10, 2, 5, RED);
  p.row(7, 4, 11, '#f08a3c');
  for (let y = 8; y < 13; y++) p.pts([[5 + (y % 2), y], [8, y], [10 - (y % 2), y]], WHITE);
  p.rect(7, 13, 2, 3, '#5d6680');
  return p;
}

export function trophy(r: Reality): Px {
  const p = floor(r, 0);
  const t = new Px(16, 16);
  t.runs([[2, 3, 12], [3, 3, 12], [4, 4, 11], [5, 4, 11], [6, 5, 10], [7, 6, 9], [8, 7, 8], [9, 7, 8], [10, 7, 8]], GOLD);
  t.pts([[2, 3], [1, 4], [1, 5], [2, 6], [13, 3], [14, 4], [14, 5], [13, 6]], GOLD);
  t.rect(5, 11, 6, 2, GOLD_D);
  t.rect(4, 13, 8, 2, '#5d6680');
  t.disc(7.5, 3, 2, '#f08a3c');
  t.pts([[7, 2], [8, 3], [6, 3]], '#8a3c12');
  t.pts([[5, 4], [5, 5]], '#fff3c8');
  t.outline(OUTLINE);
  p.stamp(t);
  return p;
}

export function crackedWall(r: Reality, open: boolean): Px {
  if (open) {
    const p = floor(r, 2);
    p.pts([[2, 13], [3, 13], [12, 2], [13, 3], [13, 2]], PAL[r].wallFace);
    return p;
  }
  const p = wallFace(r, 1);
  p.pts([[8, 6], [7, 7], [8, 8], [9, 9], [8, 10], [7, 11], [7, 12], [8, 13]], '#160f24');
  return p;
}

export function sparkle(frame: number): Px {
  const p = new Px(16, 16);
  const s = frame % 3;
  const c = s === 1 ? WHITE : GOLD;
  p.col(7, 3 - s, 12 + s, c);
  p.row(7, 3 - s, 12 + s, c);
  p.col(8, 4, 11, c);
  p.row(8, 4, 11, c);
  p.pts([[5, 5], [10, 5], [5, 10], [10, 10]], CYAN);
  p.rect(7, 7, 2, 2, WHITE);
  return p;
}

export function footprint(): Px {
  const p = new Px(16, 16);
  p.rect(5, 6, 2, 3, 'rgba(60,80,120,0.35)');
  p.rect(9, 8, 2, 3, 'rgba(60,80,120,0.35)');
  return p;
}
