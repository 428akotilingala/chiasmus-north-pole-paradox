import { writeFileSync } from 'node:fs';
import { it } from 'vitest';
import { LEVELS } from '../src/content/levels';
import { QUESTIONS } from '../src/content/questions';
import { parseLevel } from '../src/game/logic';
import { solveLevel } from '../src/game/solver';

// Writes the solver's solution for each level to e2e/paths.json for the browser playthrough.
// Runs only when EXPORT_PATHS=1 (npm run e2e does this first).
it.runIf(process.env.EXPORT_PATHS === '1')('exports maze solutions for the e2e playthrough', () => {
  const out: Record<string, { actions: string[]; gates: Record<string, number>; secret?: number; start: number[] }> = {};
  for (const l of Object.values(LEVELS)) {
    const r = solveLevel(l.map);
    const gates: Record<string, number> = {};
    for (const [d, q] of Object.entries(l.gates)) gates[d] = QUESTIONS[q].options.findIndex((o) => o.correct);
    out[l.id] = {
      actions: r.actions,
      gates,
      secret: l.secret ? QUESTIONS[l.secret].options.findIndex((o) => o.correct) : undefined,
      start: parseLevel(l.map).start,
    };
  }
  // secret room route in level 2: treat Hoops (H) as the goal; the last move bumps into him
  const secretMap = LEVELS.maze2.map.map((r) => r.replace('X', '.').replace('H', 'X'));
  const sr = solveLevel(secretMap);
  out.maze2secret = { actions: sr.actions, gates: out.maze2.gates, secret: out.maze2.secret, start: out.maze2.start };
  writeFileSync('e2e/paths.json', JSON.stringify(out, null, 1));
});
