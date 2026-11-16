import type { Accessory, ElfLook, Expression } from '../content/types';
import { Px, shade, mix } from './px';

/* Procedural 32x32 character portraits and 16x16 maze sprites. All original pixel art. */

export const OUTLINE = '#160f24';
const EYE = '#1b1530';
const WHITE = '#F7FAFC';
const MOUTH = '#7a2233';
const TONGUE = '#ff7b8f';
const BLUSH = '#ff8fa3';

/* ---------------- elf portrait ---------------- */

function elfHat(p: Px, color: string) {
  const dark = shade(color, -0.35);
  const lite = shade(color, 0.25);
  const cone: [number, number, number][] = [
    [1, 21, 25], [2, 18, 24], [3, 16, 23], [4, 14, 22], [5, 12, 21], [6, 11, 21], [7, 10, 21], [8, 9, 22], [9, 8, 23],
  ];
  p.runs(cone, color);
  // shading: right edge darker, a highlight streak on the left
  for (const [y, , b] of cone) {
    p.set(b, y, dark);
    p.set(b - 1, y, dark);
  }
  p.pts([[13, 6], [12, 7], [11, 8], [15, 4], [17, 3]], lite);
  // pompom
  p.disc(26.5, 2.5, 2.2, WHITE);
  p.pts([[27, 4], [28, 3]], '#cfd8e6');
}

function elfTrim(p: Px) {
  p.runs([[10, 7, 24], [11, 7, 24]], WHITE);
  for (let x = 7; x <= 24; x += 2) p.set(x, 12, WHITE);
  p.row(11, 7, 24, WHITE);
  for (let x = 8; x <= 24; x += 3) p.set(x, 11, '#d9e2ef');
}

function face(p: Px, skin: string) {
  const sd = shade(skin, -0.22);
  p.runs(
    [
      [12, 10, 21], [13, 9, 22], [14, 8, 23], [15, 8, 23], [16, 8, 23], [17, 8, 23], [18, 8, 23], [19, 8, 23],
      [20, 8, 23], [21, 8, 23], [22, 9, 22], [23, 10, 21], [24, 12, 19],
    ],
    skin,
  );
  for (let y = 15; y <= 22; y++) p.set(23, y, sd);
  p.pts([[22, 22], [21, 23], [19, 24]], sd);
  // ears
  const ear: [number, number, number][] = [[13, 3, 4], [14, 4, 6], [15, 4, 7], [16, 5, 7], [17, 6, 7], [18, 7, 7]];
  p.runs(ear, skin);
  p.runs(ear.map(([y, a, b]) => [y, 31 - b, 31 - a] as [number, number, number]), skin);
  p.pts([[5, 15], [6, 16], [6, 15]], sd);
  p.pts([[26, 15], [25, 16], [25, 15]], sd);
  // neck
  p.rect(13, 24, 6, 2, sd);
}

function hair(p: Px, color: string) {
  const d = shade(color, -0.3);
  p.runs([[12, 8, 11], [13, 8, 10], [14, 8, 9], [15, 8, 8]], color);
  p.runs([[12, 20, 23], [13, 21, 23], [14, 22, 23], [15, 23, 23]], color);
  p.pts([[12, 13], [13, 13], [15, 13], [18, 13], [19, 13]], color);
  p.pts([[9, 13], [22, 13]], d);
}

function eyes(p: Px, expr: Expression, blink: boolean, browColor: string) {
  if (blink) {
    p.row(17, 11, 13, EYE);
    p.row(17, 18, 20, EYE);
    p.row(14, 11, 13, browColor);
    p.row(14, 18, 20, browColor);
    return;
  }
  switch (expr) {
    case 'shocked':
      p.rect(11, 15, 3, 4, WHITE);
      p.rect(18, 15, 3, 4, WHITE);
      p.rect(12, 16, 1, 2, EYE);
      p.rect(19, 16, 1, 2, EYE);
      p.row(13, 11, 13, browColor);
      p.row(13, 18, 20, browColor);
      break;
    case 'smug':
      p.rect(12, 17, 2, 2, EYE);
      p.rect(18, 17, 2, 2, EYE);
      p.row(16, 11, 14, shade(EYE, 0.25));
      p.row(16, 17, 20, shade(EYE, 0.25));
      p.row(15, 11, 13, browColor);
      p.row(14, 18, 20, browColor);
      break;
    case 'nervous':
    case 'sad':
      p.rect(12, 16, 2, 3, EYE);
      p.rect(18, 16, 2, 3, EYE);
      p.set(12, 16, WHITE);
      p.set(18, 16, WHITE);
      if (expr === 'nervous') {
        p.pts([[11, 15], [12, 14], [13, 14]], browColor);
        p.pts([[20, 15], [19, 14], [18, 14]], browColor);
      } else {
        p.pts([[11, 14], [12, 14], [13, 15]], browColor);
        p.pts([[20, 14], [19, 14], [18, 15]], browColor);
      }
      break;
    default:
      p.rect(12, 16, 2, 3, EYE);
      p.rect(18, 16, 2, 3, EYE);
      p.set(12, 16, WHITE);
      p.set(18, 16, WHITE);
      p.row(14, 11, 13, browColor);
      p.row(14, 18, 20, browColor);
  }
}

function mouth(p: Px, expr: Expression, skin: string) {
  switch (expr) {
    case 'talk':
      p.rect(14, 20, 4, 3, MOUTH);
      p.row(22, 15, 16, TONGUE);
      p.row(20, 14, 17, shade(MOUTH, -0.3));
      break;
    case 'shocked':
      p.rect(14, 20, 4, 4, MOUTH);
      p.rect(15, 21, 2, 2, shade(MOUTH, -0.4));
      break;
    case 'nervous':
      p.pts([[13, 21], [14, 22], [15, 21], [16, 22], [17, 21], [18, 22]], MOUTH);
      break;
    case 'smug':
      p.row(21, 15, 18, MOUTH);
      p.set(19, 20, MOUTH);
      break;
    case 'sad':
      p.row(21, 14, 17, MOUTH);
      p.pts([[13, 22], [18, 22]], MOUTH);
      break;
    default:
      p.row(21, 14, 17, MOUTH);
      p.pts([[13, 20], [18, 20]], MOUTH);
      p.row(22, 15, 16, shade(skin, -0.12));
  }
}

function body(p: Px, tunic: string, collar: string) {
  const d = shade(tunic, -0.3);
  p.runs([[26, 8, 23], [27, 5, 26], [28, 4, 27], [29, 3, 28], [30, 3, 28], [31, 3, 28]], tunic);
  for (let y = 27; y <= 31; y++) {
    p.set(26 - (y === 27 ? 0 : -1), y, d);
    p.set(27, y, d);
    p.set(28, y, d);
  }
  // pointed collar
  p.row(25, 10, 21, collar);
  p.row(26, 9, 22, collar);
  p.pts([[10, 27], [11, 27], [10, 28], [13, 27], [14, 27], [17, 27], [18, 27], [20, 27], [21, 27], [21, 28]], collar);
  p.pts([[15, 29], [16, 29], [15, 31], [16, 31]], '#F7C65F');
}

function accessory(p: Px, a: Accessory, look: ElfLook) {
  switch (a) {
    case 'glasses': {
      const f = '#2a2340';
      for (const x0 of [10, 17]) {
        p.row(15, x0, x0 + 4, f);
        p.row(19, x0, x0 + 4, f);
        p.col(x0, 15, 19, f);
        p.col(x0 + 4, 15, 19, f);
      }
      p.row(16, 15, 16, f);
      break;
    }
    case 'monocle':
      p.ring(19, 17, 2.4, '#F7C65F');
      p.pts([[21, 20], [22, 21], [22, 22], [23, 23], [23, 24]], '#F7C65F');
      break;
    case 'mustache': {
      const c = look.hair;
      p.runs([[19, 11, 20], [20, 10, 13], [20, 18, 21]], c);
      p.pts([[9, 21], [22, 21]], c);
      p.row(19, 15, 16, shade(c, -0.2));
      break;
    }
    case 'shades':
      p.rect(10, 15, 12, 4, '#141022');
      p.pts([[11, 16], [12, 15], [18, 16], [19, 15]], '#69E6F1');
      p.row(15, 8, 9, '#141022');
      p.row(15, 22, 23, '#141022');
      break;
    case 'scarf':
      p.runs([[24, 10, 21], [25, 9, 22]], '#E63946');
      for (let x = 10; x <= 22; x += 3) p.set(x, 25, WHITE);
      p.rect(20, 26, 3, 5, '#E63946');
      p.row(28, 20, 22, WHITE);
      break;
    case 'bowtie':
      p.pts([[13, 25], [14, 25], [14, 26], [13, 27], [18, 25], [17, 25], [17, 26], [18, 27], [15, 26], [16, 26]], '#E63946');
      break;
    case 'headphones':
      p.row(9, 9, 22, '#2a2340');
      p.rect(5, 14, 3, 6, '#2a2340');
      p.rect(24, 14, 3, 6, '#2a2340');
      p.pts([[6, 15], [25, 15]], '#69E6F1');
      break;
    case 'earmuffs':
      p.disc(5.5, 16, 2.6, '#ff8fb1');
      p.disc(25.5, 16, 2.6, '#ff8fb1');
      p.pts([[5, 15], [25, 15]], '#ffd1e0');
      break;
    case 'freckles':
      p.pts([[10, 19], [12, 20], [11, 21], [21, 19], [19, 20], [20, 21]], shade(look.skin, -0.3));
      break;
    case 'beard': {
      const c = look.hair;
      p.runs([[20, 8, 13], [20, 18, 23], [21, 8, 23], [22, 9, 22], [23, 9, 22], [24, 10, 21], [25, 11, 20], [26, 13, 18]], c);
      p.row(21, 14, 17, MOUTH);
      p.pts([[12, 23], [16, 24], [19, 23], [14, 25]], shade(c, -0.18));
      break;
    }
    case 'clipboard':
      p.rect(22, 24, 8, 8, '#8a5a3c');
      p.rect(23, 25, 6, 6, WHITE);
      p.rect(25, 23, 2, 2, '#9aa5b8');
      p.row(27, 24, 27, '#9aa5b8');
      p.row(29, 24, 26, '#9aa5b8');
      break;
    case 'goggles':
      p.row(11, 7, 24, '#4a3a2a');
      p.disc(12, 10.5, 2, '#69E6F1');
      p.disc(19, 10.5, 2, '#69E6F1');
      p.pts([[11, 10], [18, 10]], WHITE);
      break;
    case 'headband':
      p.row(12, 8, 23, '#E63946');
      p.row(13, 8, 23, '#E63946');
      p.row(12, 9, 22, WHITE);
      break;
    case 'crown':
      p.runs([[3, 10, 21], [4, 10, 21], [5, 10, 21]], '#F7C65F');
      p.pts([[10, 2], [10, 1], [13, 2], [13, 1], [15, 2], [16, 2], [15, 0], [16, 0], [16, 1], [15, 1], [18, 2], [18, 1], [21, 2], [21, 1]], '#F7C65F');
      p.pts([[12, 4], [19, 4]], '#E63946');
      p.pts([[15, 4], [16, 4]], '#69E6F1');
      // sash
      for (let i = 0; i < 9; i++) {
        p.set(7 + i * 2, 27 + Math.floor(i / 2), '#F7C65F');
        p.set(8 + i * 2, 27 + Math.floor(i / 2), '#F7C65F');
      }
      break;
    case 'bandaid':
      p.rect(20, 13, 3, 2, '#e8c79a');
      break;
    case 'braids':
      for (const x of [6, 25]) {
        p.rect(x, 18, 2, 9, look.hair);
        p.pts([[x, 21], [x + 1, 24]], shade(look.hair, -0.3));
        p.row(27, x, x + 1, '#F7C65F');
      }
      break;
    case 'cap':
      // police-style cap replaces the elf hat
      break;
    case 'tophat':
      break;
  }
}

function cap(p: Px, color: string) {
  const d = shade(color, -0.3);
  p.runs([[5, 10, 21], [6, 9, 22], [7, 9, 22], [8, 9, 22], [9, 9, 22]], color);
  p.row(10, 7, 24, '#141022');
  p.row(11, 8, 23, '#141022');
  p.rect(15, 6, 2, 2, '#F7C65F');
  p.row(9, 9, 22, d);
}

function tophat(p: Px) {
  const c = '#1c1830';
  p.rect(10, 1, 12, 8, c);
  p.row(7, 10, 21, '#E63946');
  p.row(8, 10, 21, '#E63946');
  p.runs([[9, 7, 24], [10, 6, 25]], c);
  p.col(11, 2, 6, '#3a3456');
}

export function elfPortrait(look: ElfLook, expr: Expression = 'idle', blink = false): Px {
  const p = new Px(32, 32);
  const isCap = look.accessories.includes('cap');
  const isTop = look.accessories.includes('tophat');
  if (isCap) cap(p, look.hat);
  else if (isTop) tophat(p);
  else elfHat(p, look.hat);
  face(p, look.skin);
  if (!isCap && !isTop) elfTrim(p);
  hair(p, look.hair);
  body(p, look.tunic, look.collar);
  p.pts([[10, 20], [11, 20], [20, 20], [21, 20]], mix(look.skin, BLUSH, 0.55));
  eyes(p, expr, blink, shade(look.hair, -0.25));
  mouth(p, expr, look.skin);
  for (const a of look.accessories) accessory(p, a, look);
  if (expr === 'nervous') {
    p.pts([[25, 10], [25, 11], [24, 12], [25, 12], [26, 12], [25, 13]], '#69E6F1');
    p.set(25, 11, WHITE);
  }
  p.outline(OUTLINE);
  return p;
}

/* ---------------- Santa ---------------- */

export function santaPortrait(expr: 'alarm' | 'happy' = 'alarm', blink = false): Px {
  const p = new Px(32, 32);
  const red = '#E63946';
  const skin = '#f2c3a2';
  // hat drooping left
  p.runs([[1, 12, 16], [2, 10, 19], [3, 8, 21], [4, 7, 22], [5, 6, 23], [6, 6, 24], [7, 6, 25]], red);
  p.runs([[2, 6, 9], [3, 5, 7], [4, 4, 6]], red);
  p.disc(3.5, 6, 2.2, WHITE);
  for (const [y, , b] of [[3, 8, 21], [4, 7, 22], [5, 6, 23], [6, 6, 24], [7, 6, 25]] as const) p.set(b, y, shade(red, -0.35));
  p.runs([[8, 5, 26], [9, 5, 26], [10, 6, 25]], WHITE);
  // face
  p.runs([[11, 8, 23], [12, 7, 24], [13, 7, 24], [14, 7, 24], [15, 7, 24], [16, 7, 24], [17, 8, 23]], skin);
  // glasses
  const g = '#F7C65F';
  p.ring(11.5, 14, 2.2, g);
  p.ring(19.5, 14, 2.2, g);
  p.row(14, 14, 17, g);
  if (blink) {
    p.row(14, 10, 12, EYE);
    p.row(14, 19, 21, EYE);
  } else if (expr === 'alarm') {
    p.rect(11, 13, 1, 2, EYE);
    p.rect(19, 13, 1, 2, EYE);
  } else {
    p.pts([[10, 14], [11, 13], [12, 14], [18, 14], [19, 13], [20, 14]], EYE);
  }
  p.row(11, 9, 13, WHITE);
  p.row(11, 18, 22, WHITE);
  // nose and cheeks
  p.rect(15, 15, 2, 2, '#e8828c');
  p.pts([[8, 16], [9, 16], [22, 16], [23, 16]], '#ec9aa5');
  // beard
  p.runs(
    [
      [17, 5, 10], [17, 21, 26], [18, 4, 27], [19, 4, 27], [20, 4, 27], [21, 4, 27], [22, 5, 26], [23, 5, 26],
      [24, 6, 25], [25, 7, 24], [26, 8, 23], [27, 10, 21], [28, 12, 19], [29, 14, 17],
    ],
    WHITE,
  );
  for (let y = 19; y <= 28; y += 2) p.set(9 + (y % 4), y, '#d7e0ec');
  p.pts([[22, 20], [20, 24], [12, 22], [16, 27]], '#d7e0ec');
  // mustache
  p.runs([[17, 11, 20], [18, 9, 13], [18, 18, 22]], '#eef2f8');
  if (expr === 'alarm') {
    p.rect(14, 19, 4, 3, MOUTH);
    p.row(21, 15, 16, TONGUE);
  } else {
    p.row(19, 13, 18, MOUTH);
    p.pts([[12, 18], [19, 18]], MOUTH);
  }
  // coat
  p.runs([[29, 2, 13], [29, 18, 29], [30, 1, 30], [31, 1, 30]], red);
  p.row(30, 14, 17, WHITE);
  p.row(31, 14, 17, WHITE);
  p.outline(OUTLINE);
  return p;
}

/* ---------------- The Syntax Grinch (original villain) ---------------- */

export type GrinchMood = 'grin' | 'shout' | 'dizzy' | 'reformed';

export function grinchPortrait(mood: GrinchMood = 'grin', blink = false): Px {
  const p = new Px(32, 32);
  const skin = '#9B5DE5';
  const sd = '#6c3bb0';
  const fur = '#4b2387';
  const red = '#E63946';
  // spiky fur crest
  p.pts([[9, 6], [10, 5], [11, 6], [13, 4], [14, 3], [15, 5], [18, 3], [19, 4], [20, 6], [22, 5], [23, 6]], fur);
  p.runs([[6, 9, 23], [7, 8, 24]], fur);
  // backwards Santa hat (it leans the wrong way, pompom on the left, trim on top)
  if (mood !== 'reformed') {
    p.runs([[0, 4, 8], [1, 5, 12], [2, 7, 16], [3, 9, 19], [4, 12, 22]], red);
    p.disc(3, 1.5, 1.8, WHITE);
    p.row(5, 14, 24, WHITE);
    p.row(4, 20, 25, WHITE);
  } else {
    p.runs([[1, 17, 21], [2, 14, 23], [3, 12, 24], [4, 10, 25]], red);
    p.disc(26.5, 2, 1.8, WHITE);
    p.runs([[5, 9, 24]], WHITE);
  }
  // head: wide, pointy chin
  p.runs(
    [
      [8, 7, 25], [9, 6, 26], [10, 5, 27], [11, 5, 27], [12, 5, 27], [13, 5, 27], [14, 5, 27], [15, 5, 27],
      [16, 6, 26], [17, 6, 26], [18, 7, 25], [19, 8, 24], [20, 9, 23], [21, 11, 21], [22, 13, 19], [23, 15, 17],
    ],
    skin,
  );
  for (let y = 10; y <= 19; y++) p.set(27 - (y > 15 ? 1 : 0) - (y > 17 ? 1 : 0), y, sd);
  // ears like little bat wings
  p.runs([[9, 2, 4], [10, 1, 4], [11, 2, 4], [12, 3, 4]], skin);
  p.runs([[9, 28, 30], [10, 28, 31], [11, 28, 30], [12, 28, 29]], skin);
  // eyes
  const Y = '#f7e15f';
  if (mood === 'dizzy') {
    p.pts([[10, 11], [12, 11], [11, 12], [10, 13], [12, 13]], EYE);
    p.pts([[20, 11], [22, 11], [21, 12], [20, 13], [22, 13]], EYE);
  } else if (blink) {
    p.row(12, 9, 13, EYE);
    p.row(12, 19, 23, EYE);
  } else {
    p.rect(9, 11, 5, 3, Y);
    p.rect(19, 11, 5, 3, Y);
    p.rect(mood === 'reformed' ? 11 : 12, 11, 2, 3, mood === 'reformed' ? EYE : red);
    p.rect(mood === 'reformed' ? 20 : 19, 11, 2, 3, mood === 'reformed' ? EYE : red);
    if (mood !== 'reformed') {
      p.pts([[8, 9], [9, 9], [10, 10], [11, 10], [12, 10], [13, 10]], fur);
      p.pts([[24, 9], [23, 9], [22, 10], [21, 10], [20, 10], [19, 10]], fur);
    } else {
      p.row(9, 9, 13, fur);
      p.row(9, 19, 23, fur);
    }
  }
  // mouth
  if (mood === 'shout') {
    p.runs([[15, 10, 22], [16, 9, 23], [17, 9, 23], [18, 10, 22], [19, 11, 21], [20, 13, 19]], '#2a0f2e');
    p.row(15, 11, 21, WHITE);
    for (let x = 11; x <= 21; x += 2) p.set(x, 16, WHITE);
    p.row(19, 14, 18, '#ff7b8f');
  } else if (mood === 'dizzy') {
    p.pts([[12, 17], [13, 16], [14, 17], [15, 16], [16, 17], [17, 16], [18, 17], [19, 16], [20, 17]], '#2a0f2e');
  } else if (mood === 'reformed') {
    p.row(17, 12, 20, '#2a0f2e');
    p.pts([[11, 16], [21, 16]], '#2a0f2e');
  } else {
    p.runs([[15, 8, 24], [16, 9, 23], [17, 11, 21]], '#2a0f2e');
    p.row(15, 9, 23, WHITE);
    for (let x = 10; x <= 22; x += 2) p.set(x, 16, WHITE);
  }
  // tuxedo with gold "A" medallion
  p.runs([[23, 6, 13], [23, 19, 26], [24, 3, 28], [25, 2, 29], [26, 1, 30], [27, 1, 30], [28, 1, 30], [29, 1, 30], [30, 1, 30], [31, 1, 30]], '#1c1830');
  p.runs([[24, 13, 18], [25, 14, 17], [26, 14, 17], [27, 15, 16]], WHITE);
  p.disc(16, 29, 2.3, '#F7C65F');
  p.pts([[16, 28], [15, 29], [17, 29], [15, 30], [16, 30], [17, 30]], '#b98426');
  p.outline(OUTLINE);
  return p;
}

/* ---------------- Reverso the reindeer ---------------- */

export function reindeerPortrait(blink = false, talk = false): Px {
  const p = new Px(32, 32);
  const fur = '#8a5a3c';
  const fd = '#6a4029';
  const muzzle = '#d9b38c';
  const antler = '#d8c095';
  // antlers
  p.pts([[8, 0], [8, 1], [9, 2], [9, 3], [10, 4], [10, 5], [11, 6], [11, 7], [6, 2], [7, 3], [5, 1], [12, 3], [12, 2], [13, 1]], antler);
  p.pts([[23, 0], [23, 1], [22, 2], [22, 3], [21, 4], [21, 5], [20, 6], [20, 7], [25, 2], [24, 3], [26, 1], [19, 3], [19, 2], [18, 1]], antler);
  // ears
  p.runs([[10, 4, 9], [11, 5, 9], [12, 7, 9]], fur);
  p.runs([[10, 22, 27], [11, 22, 26], [12, 22, 24]], fur);
  p.pts([[6, 10], [7, 11], [25, 10], [24, 11]], '#f2b8a0');
  // head
  p.runs([[7, 11, 20], [8, 10, 21], [9, 9, 22], [10, 9, 22], [11, 9, 22], [12, 9, 22], [13, 9, 22], [14, 9, 22], [15, 10, 21], [16, 10, 21]], fur);
  p.runs([[17, 10, 21], [18, 9, 22], [19, 9, 22], [20, 9, 22], [21, 10, 21], [22, 11, 20]], muzzle);
  for (let y = 8; y <= 16; y++) p.set(22 - (y < 9 ? 1 : 0), y, fd);
  // eyes
  if (blink) {
    p.row(12, 11, 13, EYE);
    p.row(12, 18, 20, EYE);
  } else {
    p.rect(11, 10, 3, 3, EYE);
    p.rect(18, 10, 3, 3, EYE);
    p.pts([[11, 10], [18, 10]], WHITE);
  }
  // dark nose (not red: this is not anybody's famous reindeer)
  p.rect(14, 17, 4, 3, '#3a2420');
  p.pts([[14, 17]], '#6a4a40');
  p.row(talk ? 21 : 21, 14, 17, '#5a3020');
  if (talk) p.row(22, 15, 16, '#ff7b8f');
  // scarf worn backwards (the tag is in front)
  p.runs([[23, 8, 23], [24, 7, 24], [25, 7, 24]], '#147D64');
  for (let x = 8; x <= 24; x += 3) p.set(x, 24, '#F7C65F');
  p.rect(14, 26, 4, 3, WHITE);
  p.row(27, 15, 16, '#9aa5b8');
  // chest
  p.runs([[26, 6, 13], [26, 18, 25], [27, 5, 26], [28, 4, 27], [29, 4, 27], [30, 4, 27], [31, 4, 27]], fur);
  p.runs([[29, 12, 19], [30, 11, 20], [31, 11, 20]], muzzle);
  p.outline(OUTLINE);
  return p;
}

/* ---------------- maze sprites (16x16) ---------------- */

export type Facing = 'down' | 'up' | 'left' | 'right';

export interface SpriteColors {
  hat: string;
  tunic: string;
  skin: string;
  hair: string;
}

export const PLAYER_COLORS: SpriteColors = { hat: '#E63946', tunic: '#147D64', skin: '#f2c3a2', hair: '#5a3a22' };

export function elfSprite(facing: Facing, frame: 0 | 1 | 2, c: SpriteColors = PLAYER_COLORS, extra?: 'ball'): Px {
  const p = new Px(16, 16);
  const hatD = shade(c.hat, -0.35);
  const sk = c.skin;
  const skD = shade(sk, -0.22);
  const tun = c.tunic;
  const tunD = shade(tun, -0.3);
  const boot = '#3b2a26';
  const gold = '#F7C65F';
  const side = facing === 'left' || facing === 'right';

  // hat
  if (!side) {
    p.runs([[1, 8, 11], [2, 6, 10], [3, 5, 10]], c.hat);
    p.pts([[10, 0], [11, 0]], c.hat);
    p.pts([[10, 2], [10, 3], [11, 1]], hatD);
    p.rect(12, 0, 2, 2, WHITE);
  } else {
    p.runs([[1, 4, 7], [2, 5, 9], [3, 5, 10]], c.hat);
    p.pts([[4, 0], [3, 0]], c.hat);
    p.pts([[9, 2], [10, 3]], hatD);
    p.rect(1, 0, 2, 2, WHITE);
  }
  p.row(4, 4, 11, WHITE);

  // head
  if (facing === 'up') {
    p.runs([[5, 4, 11], [6, 4, 11], [7, 4, 11], [8, 4, 11], [9, 5, 10]], c.hair);
    p.pts([[3, 5], [2, 4], [3, 6], [12, 5], [13, 4], [12, 6]], sk);
  } else if (!side) {
    p.runs([[5, 4, 11], [6, 4, 11], [7, 4, 11], [8, 4, 11], [9, 5, 10]], sk);
    p.pts([[4, 5], [11, 5]], c.hair);
    p.pts([[6, 6], [9, 6]], EYE);
    p.pts([[5, 7], [10, 7]], mix(sk, BLUSH, 0.6));
    p.pts([[7, 8], [8, 8]], skD);
    p.pts([[3, 5], [2, 4], [3, 6], [12, 5], [13, 4], [12, 6]], sk);
  } else {
    p.runs([[5, 5, 11], [6, 5, 12], [7, 5, 12], [8, 5, 11], [9, 6, 10]], sk);
    p.pts([[5, 5], [5, 6], [6, 5]], c.hair);
    p.pts([[4, 5], [3, 4], [4, 6]], sk);
    p.set(10, 6, EYE);
    p.set(10, 7, mix(sk, BLUSH, 0.6));
    p.set(11, 8, skD);
  }

  // body
  if (!side) {
    p.rect(4, 10, 8, 4, tun);
    p.col(11, 10, 13, tunD);
    p.pts([[5, 10], [7, 10], [8, 10], [10, 10]], gold);
    p.row(12, 4, 11, '#2a2340');
    p.rect(7, 12, 2, 1, gold);
    p.pts([[3, 10], [3, 11], [12, 10], [12, 11]], tun);
    p.pts([[3, 12], [12, 12]], sk);
  } else {
    p.rect(5, 10, 6, 4, tun);
    p.col(5, 10, 13, tunD);
    p.row(12, 5, 10, '#2a2340');
    p.set(9, 12, gold);
    p.rect(8, 10, 2, 2, tunD);
    p.set(9, 12, sk);
  }

  // legs (walk cycle)
  const lift = frame === 1 ? 'L' : frame === 2 ? 'R' : '';
  if (!side) {
    p.rect(5, 14, 2, lift === 'L' ? 1 : 2, boot);
    p.rect(9, 14, 2, lift === 'R' ? 1 : 2, boot);
    if (lift !== 'L') p.set(4, 15, boot);
    if (lift !== 'R') p.set(11, 15, boot);
  } else {
    p.rect(6, 14, 2, lift === 'L' ? 1 : 2, boot);
    p.rect(9, 14, 2, lift === 'R' ? 1 : 2, boot);
    if (lift !== 'R') p.set(11, 15, boot);
    if (lift !== 'L') p.set(8, 15, boot);
  }

  if (extra === 'ball') {
    p.disc(13, 12, 1.6, '#f08a3c');
    p.pts([[13, 11], [12, 12], [13, 13]], '#8a3c12');
  }

  p.outline(OUTLINE);
  return facing === 'left' ? p.flipX() : p;
}

export function reindeerSprite(frame: 0 | 1): Px {
  const p = new Px(16, 16);
  const fur = '#8a5a3c';
  const antler = '#d8c095';
  p.pts([[3, 0], [3, 1], [4, 2], [5, 3], [2, 1], [12, 0], [12, 1], [11, 2], [10, 3], [13, 1]], antler);
  p.pts([[3, 4], [4, 4], [11, 4], [12, 4]], fur);
  p.runs([[3, 6, 9], [4, 5, 10], [5, 5, 10], [6, 5, 10], [7, 5, 10], [8, 6, 9], [9, 6, 9]], fur);
  p.runs([[8, 6, 9], [9, 6, 9]], '#d9b38c');
  p.pts([[7, 8], [8, 8]], '#3a2420');
  if (frame === 0) p.pts([[6, 5], [9, 5]], EYE);
  else p.pts([[6, 6], [9, 6]], EYE);
  p.row(10, 4, 11, '#147D64');
  p.set(7, 10, '#F7C65F');
  p.rect(4, 11, 8, 3, fur);
  p.row(13, 5, 10, '#d9b38c');
  p.pts([[5, 14], [5, 15], [10, 14], [10, 15]], '#4a2e1e');
  p.outline(OUTLINE);
  return p;
}
