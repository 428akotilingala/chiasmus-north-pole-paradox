import { describe, expect, it } from 'vitest';
import { CASES } from '../src/content/cases';
import { isMirror, plain, roleSequence } from '../src/content/markup';
import { QUESTIONS } from '../src/content/questions';
import { INTRO, NOTES } from '../src/content/script';
import { SEQUENCES } from '../src/state/store';

describe('impostor rounds', () => {
  it('has three rounds with four suspects each', () => {
    expect(CASES).toHaveLength(3);
    for (const c of CASES) expect(c.suspects).toHaveLength(4);
  });

  it.each(CASES)('$title has exactly one impostor, never in the same slot twice', (c) => {
    expect(c.suspects.filter((s) => s.impostor)).toHaveLength(1);
  });

  it('puts the impostor in a different position each round', () => {
    const pos = CASES.map((c) => c.suspects.findIndex((s) => s.impostor));
    expect(new Set(pos).size).toBe(3);
  });

  for (const c of CASES) {
    for (const s of c.suspects) {
      it(`${c.id}/${s.id}: ${plain(s.quote)}`, () => {
        const seq = roleSequence(s.quote);
        if (s.impostor) {
          // impostors look like reversal (repeated / parallel parts) but never mirror
          expect(isMirror(seq), `impostor pattern ${seq.join('')}`).toBe(false);
          expect(seq.length).toBeGreaterThanOrEqual(3);
        } else {
          expect(seq, 'valid examples are A-B / B-A').toEqual(['A', 'B', 'B', 'A']);
          expect(isMirror(seq)).toBe(true);
          // each half of the statement holds one A and one B
          expect(s.quote).toHaveLength(2);
          for (const half of s.quote) expect(half.filter((x) => x.role).map((x) => x.role).sort()).toEqual(['A', 'B']);
        }
        expect(s.interview.length).toBeGreaterThan(0);
      });
    }
  }

  it.each(CASES)('$title: debrief points at a real, valid example', (c) => {
    const real = c.suspects.find((s) => s.id === c.authenticId);
    expect(real).toBeDefined();
    expect(real!.impostor).toBeFalsy();
  });

  it('awards fragments A, B, C in order', () => {
    expect(CASES.map((c) => c.fragment.id)).toEqual(['A', 'B', 'C']);
  });
});

describe('questions', () => {
  it.each(Object.values(QUESTIONS))('$id has exactly one correct option and explains every wrong one', (q) => {
    expect(q.options.filter((o) => o.correct)).toHaveLength(1);
    expect(q.options.length).toBeGreaterThanOrEqual(3);
    expect(q.options.length).toBeLessThanOrEqual(4);
    for (const o of q.options) if (!o.correct) expect(o.why, `missing why for "${o.text}"`).toBeTruthy();
    expect(new Set(q.options.map((o) => o.text)).size).toBe(q.options.length);
  });

  it.each(Object.values(QUESTIONS))('$id: the completed sentence is a true A-B / B-A', (q) => {
    expect(roleSequence(q.full)).toEqual(['A', 'B', 'B', 'A']);
    expect(q.structure.length).toBeGreaterThan(20);
    expect(q.effect.length).toBeGreaterThan(20);
  });

  it('fill-in-the-blank stems have a blank', () => {
    for (const q of Object.values(QUESTIONS)) {
      if (q.prompt.includes('COMPLETES')) expect(q.stem).toContain('____');
    }
  });

  it('the completed fill-in answer matches the correct option', () => {
    for (const q of Object.values(QUESTIONS)) {
      if (!q.prompt.includes('COMPLETES')) continue;
      const answer = q.options.find((o) => o.correct)!.text.replace(/[.;]$/, '').toLowerCase();
      expect(plain(q.full).toLowerCase(), q.id).toContain(answer);
    }
  });
});

describe('script', () => {
  it('has presenter notes for every chapter in both modes', () => {
    for (const seq of Object.values(SEQUENCES)) for (const id of seq) expect(NOTES[id], id).toBeDefined();
  });

  it('quick play is short: two cases, one maze', () => {
    const q = SEQUENCES.quick;
    expect(q.filter((s) => s.startsWith('case'))).toHaveLength(2);
    expect(q.filter((s) => s.startsWith('maze'))).toHaveLength(1);
  });

  it('intro has a handful of short panels', () => {
    expect(INTRO.length).toBeLessThanOrEqual(5);
    for (const p of INTRO) expect(p.text.length).toBeLessThan(200);
  });
});
