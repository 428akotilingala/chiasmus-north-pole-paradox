import { describe, expect, it } from 'vitest';
import { LEVELS } from '../src/content/levels';
import { QUESTIONS } from '../src/content/questions';
import { parseLevel } from '../src/game/logic';
import { solveLevel } from '../src/game/solver';

describe.each(Object.values(LEVELS))('$id: $title', (level) => {
  const lv = parseLevel(level.map);

  it('is a closed rectangle with one start and one exit', () => {
    expect(level.map.every((r) => r.length === lv.w)).toBe(true);
    for (let x = 0; x < lv.w; x++) {
      expect(lv.tiles[0][x]).toBe('#');
      expect(lv.tiles[lv.h - 1][x]).toBe('#');
    }
    for (let y = 0; y < lv.h; y++) {
      expect(lv.tiles[y][0]).toBe('#');
      expect(lv.tiles[y][lv.w - 1]).toBe('#');
    }
    expect(level.map.join('').split('S').length - 1).toBe(1);
    expect(level.map.join('').split('X').length - 1).toBe(1);
  });

  it('maps every gate digit to a real question', () => {
    const digits = new Set(level.map.join('').match(/[1-4]/g) ?? []);
    expect([...digits].sort()).toEqual(Object.keys(level.gates).sort());
    for (const q of Object.values(level.gates)) expect(QUESTIONS[q]).toBeDefined();
    if (level.secret) expect(QUESTIONS[level.secret]).toBeDefined();
  });

  it('is solvable', () => {
    const r = solveLevel(level.map);
    expect(r.solved).toBe(true);
    expect(r.flips).toBeGreaterThanOrEqual(2);
    expect(r.visited.A).toBeGreaterThan(5);
    expect(r.visited.B).toBeGreaterThan(5);
  });

  it('cannot be solved without reversing reality', () => {
    expect(solveLevel(level.map, { allowFlip: false }).solved).toBe(false);
  });

  it('cannot be solved without answering every gate', () => {
    for (const g of Object.keys(level.gates)) {
      expect(solveLevel(level.map, { blockGates: [g] }).solved, `gate ${g}`).toBe(false);
    }
  });

  it('never traps the player (door, reality and hazard structure)', () => {
    const r = solveLevel(level.map, { ignoreCrates: true });
    expect(r.solved).toBe(true);
    expect(r.deadStates).toBe(0);
  });

  it('places hints on standable tiles', () => {
    for (const h of level.hints) {
      const ch = lv.tiles[h.at[1]][h.at[0]];
      expect('#TFgOQKLRH~'.includes(ch), `hint at ${h.at} is on "${ch}"`).toBe(false);
    }
  });
});

it('level 2 hides a reachable secret room', () => {
  const lv = parseLevel(LEVELS.maze2.map);
  const hx = lv.tiles.findIndex((row) => row.includes('H'));
  expect(hx).toBeGreaterThan(0);
  // the secret NPC must be next to a tile reachable only through the cracked wall
  const map = LEVELS.maze2.map.map((r) => r.replace('X', '.').replace('H', 'X'));
  // turning H into the exit: reachable means the secret room can be entered
  const fixed = map.map((r) => r);
  expect(solveLevel(fixed).solved).toBe(true);
});
