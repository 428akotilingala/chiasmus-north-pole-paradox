import { DIRS, parseLevel, tryMove, hazardActive, type Dir, type DynState, type ParsedLevel } from './logic';

/*
  Breadth-first search over the full maze state (position, reality, lever,
  crate positions, answered gates). Used by the tests to prove each level is
  solvable, that it needs the mirror flip, that it needs every gate, and
  that no reachable state can trap the player.
*/

export interface SolveOptions {
  allowFlip?: boolean;
  /** gates that can never be answered */
  blockGates?: string[];
  /** treat plates as always pressed and remove crates (tests door/reality structure alone) */
  ignoreCrates?: boolean;
}

interface Node {
  x: number;
  y: number;
  st: DynState;
}

export type Action = Dir | 'flip' | `answer-${Dir}` | `pull-${Dir}`;

function key(n: Node): string {
  const crates = [...n.st.crates].sort((a, b) => a - b).join(',');
  const gates = [...n.st.solved].sort().join('');
  return `${n.x},${n.y},${n.st.reality},${n.st.lever ? 1 : 0},${crates},${gates}`;
}

function successors(lv: ParsedLevel, n: Node, opts: SolveOptions): { node: Node; action: Action }[] {
  const out: { node: Node; action: Action }[] = [];
  const here = lv.tiles[n.y][n.x];
  if (here === 'X') return out;
  if (here === 'M' && opts.allowFlip !== false) {
    out.push({
      node: { x: n.x, y: n.y, st: { ...n.st, reality: n.st.reality === 'A' ? 'B' : 'A', crates: n.st.crates, solved: n.st.solved } },
      action: 'flip',
    });
  }
  for (const d of Object.keys(DIRS) as Dir[]) {
    const r = tryMove(lv, n.st, n.x, n.y, d);
    if (r.kind === 'gate') {
      if (opts.blockGates?.includes(r.gate)) continue;
      const solved = new Set(n.st.solved);
      solved.add(r.gate);
      out.push({ node: { x: n.x, y: n.y, st: { ...n.st, solved } }, action: `answer-${d}` });
    } else if (r.kind === 'lever') {
      if (!n.st.lever) out.push({ node: { x: n.x, y: n.y, st: { ...n.st, lever: true } }, action: `pull-${d}` });
    } else if (r.kind === 'move') {
      const ch = lv.tiles[r.y][r.x];
      if (hazardActive(ch, n.st.reality)) continue; // stepping here triggers an ambush
      let crates = n.st.crates;
      if (r.push) {
        crates = new Set(crates);
        crates.delete(r.push.from);
        crates.add(r.push.to);
      }
      out.push({ node: { x: r.x, y: r.y, st: { ...n.st, crates } }, action: d });
    }
  }
  return out;
}

export interface SolveResult {
  solved: boolean;
  actions: Action[];
  flips: number;
  steps: number;
  states: number;
  /** reachable states from which the exit can no longer be reached */
  deadStates: number;
  /** positions the player can stand on, per reality */
  visited: { A: number; B: number };
}

export function solveLevel(map: string[], opts: SolveOptions = {}): SolveResult {
  const lv = parseLevel(map);
  if (opts.ignoreCrates) {
    lv.plates.forEach((p) => {
      const x = p % lv.w;
      const y = Math.floor(p / lv.w);
      lv.tiles[y][x] = '.';
    });
    for (const row of lv.tiles) for (let i = 0; i < row.length; i++) if (row[i] === 'P') row[i] = '.';
    lv.crates = [];
    lv.plates = [];
  }
  const start: Node = {
    x: lv.start[0],
    y: lv.start[1],
    st: { reality: 'A', lever: false, crates: new Set(lv.crates), solved: new Set() },
  };
  const startKey = key(start);
  const parent = new Map<string, { prev: string; action: Action } | null>([[startKey, null]]);
  const nodes = new Map<string, Node>([[startKey, start]]);
  const reverse = new Map<string, string[]>();
  const queue: string[] = [startKey];
  const goals: string[] = [];
  const posA = new Set<number>();
  const posB = new Set<number>();
  for (let i = 0; i < queue.length; i++) {
    const k = queue[i];
    const n = nodes.get(k)!;
    (n.st.reality === 'A' ? posA : posB).add(n.y * lv.w + n.x);
    if (lv.tiles[n.y][n.x] === 'X') {
      goals.push(k);
      continue;
    }
    for (const { node, action } of successors(lv, n, opts)) {
      const nk = key(node);
      const rev = reverse.get(nk);
      if (rev) rev.push(k);
      else reverse.set(nk, [k]);
      if (!parent.has(nk)) {
        parent.set(nk, { prev: k, action });
        nodes.set(nk, node);
        queue.push(nk);
      }
    }
  }

  // states that can still reach an exit
  const alive = new Set<string>(goals);
  const back = [...goals];
  for (let i = 0; i < back.length; i++) {
    for (const p of reverse.get(back[i]) ?? []) {
      if (!alive.has(p)) {
        alive.add(p);
        back.push(p);
      }
    }
  }
  const deadStates = queue.length - alive.size;

  if (goals.length === 0) {
    return { solved: false, actions: [], flips: 0, steps: 0, states: queue.length, deadStates, visited: { A: posA.size, B: posB.size } };
  }
  const actions: Action[] = [];
  let cur: string | undefined = goals[0];
  while (cur) {
    const p = parent.get(cur);
    if (!p) break;
    actions.push(p.action);
    cur = p.prev;
  }
  actions.reverse();
  return {
    solved: true,
    actions,
    flips: actions.filter((a) => a === 'flip').length,
    steps: actions.filter((a) => a in DIRS).length,
    states: queue.length,
    deadStates,
    visited: { A: posA.size, B: posB.size },
  };
}
