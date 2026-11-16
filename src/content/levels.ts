/*
  Mirror Maze levels. Every map is hand-built (no random generation) and
  proven solvable by tests/maze.test.ts, which also proves that each level
  needs the mirror flip, needs every gate, and never traps the player.
*/

export interface LevelHint {
  at: [number, number];
  text: string;
}

export interface LevelDef {
  id: 'maze1' | 'maze2' | 'maze3' | 'mazeX';
  title: string;
  subtitle: string;
  map: string[];
  /** gate digit -> question id */
  gates: Record<string, string>;
  /** secret NPC (H) question id */
  secret?: string;
  reverso: string[];
  intro: string;
  hints: LevelHint[];
  theme: 'workshop' | 'factory' | 'tower';
}

const FROZEN_WORKSHOP = [
  '####################',
  '#T....#~~~~#......T#',
  '#..S..#~~~~#.......#',
  '#.....M====B...M...#',
  '#.*...#~~~~#.......#',
  '#R....#~~~~#..*....#',
  '#######~~~~####A####',
  '#g....#....#..C....#',
  '#.X...2....1.......#',
  '#.....#.*..#.....*.#',
  '#T...F#....#.....g.#',
  '####################',
];

const L1_HINTS: LevelHint[] = [
  { at: [5, 3], text: 'Step onto the glowing mirror and press R to reverse reality.' },
  { at: [12, 3], text: 'Gold doors open only in Reality A-B. Cyan doors open only in Mirror B-A.' },
  { at: [14, 7], text: 'Checkpoint lit. If anything goes wrong, you restart here.' },
  { at: [12, 8], text: 'Walk into the χ gate to answer its chiasmus.' },
];

export const LEVELS: Record<LevelDef['id'], LevelDef> = {
  maze1: {
    id: 'maze1',
    title: 'The Frozen Workshop',
    subtitle: 'Level 1 of 3',
    map: FROZEN_WORKSHOP,
    gates: { '1': 'protect', '2': 'cocoa' },
    reverso: [
      'Hello! I’m Reverso. I speak only in reversals. In reversals only, I speak.',
      'Gold doors open in A-B; in B-A, open the cyan.',
      'Stand on a mirror and press R. The world flips, and so do the doors.',
    ],
    intro: 'Move with WASD or the arrow keys. Walk into gates, levers, and reindeer to interact.',
    hints: L1_HINTS,
    theme: 'workshop',
  },
  mazeX: {
    id: 'mazeX',
    title: 'The Frozen Workshop',
    subtitle: 'Classroom Quick Play',
    map: FROZEN_WORKSHOP,
    gates: { '1': 'protect', '2': 'memorable' },
    reverso: [
      'Hello! I’m Reverso. I speak only in reversals. In reversals only, I speak.',
      'Gold doors open in A-B; in B-A, open the cyan.',
    ],
    intro: 'Move with WASD or the arrow keys. Stand on a glowing mirror and press R to flip reality.',
    hints: L1_HINTS,
    theme: 'workshop',
  },
  maze2: {
    id: 'maze2',
    title: 'The Upside-Down Gift Factory',
    subtitle: 'Level 2 of 3',
    map: [
      '########################',
      '#S....g#g....#.*.X.#####',
      '#......#..L..#.....#####',
      '#.c..o.#.....#..g..#####',
      '#......#..*..#.....#####',
      '###P#####^^^###2########',
      '#......#.....#.....#.Q.#',
      '#.C....1C...vl..C..#...#',
      '#......#..M..#.....h.H.#',
      '#R.*...#.....#..M..#...#',
      '#g....T#g...g#T...g#.K.#',
      '########################',
    ],
    gates: { '1': 'toys', '2': 'happy' },
    secret: 'hoops',
    reverso: [
      'In A-B, the gingerbread guards the north; the east, in B-A, the gingerbread guards.',
      'Push the gift onto the plate, and the plate opens the door. Wait, that’s not a reversal. I’m so embarrassed.',
      'Cracked walls are solid in A-B. In B-A, the solid walls crack.',
    ],
    intro: 'Gift boxes can be pushed. Get one onto the pressure plate. Press Backspace to reset a room.',
    hints: [
      { at: [8, 7], text: 'Gingerbread is dangerous in one reality and harmless in the other. Faint outlines show where it will appear.' },
      { at: [11, 7], text: 'This door is wired to a lever somewhere in the factory.' },
      { at: [18, 8], text: 'That wall has a suspicious crack in it…' },
    ],
    theme: 'factory',
  },
  maze3: {
    id: 'maze3',
    title: 'The Clock Tower of Reversal',
    subtitle: 'Level 3 of 3',
    map: [
      '########################',
      '#O#O##O#O##OXO##O#O#..*#',
      '##O#O##O#O#O2O#O##O#.L.#',
      '#O#O##O#O##OlO#O#O##...#',
      '##O#O##O#O#OAO#O##O#.*.#',
      '############P########B##',
      '#.....#.C...M....*#...R#',
      '#..c..#^^^^^^^^^^^#....#',
      '#.....1.C...M.....B..C.#',
      '#.o...#vvvvvvvvvvv#....#',
      '#.....#.....S.....#...O#',
      '########################',
    ],
    gates: { '1': 'clocks', '2': 'tower' },
    reverso: [
      'Gingerbread above you in A-B; in B-A, below you, gingerbread.',
      'The tower is a clock: tick turns to tock, and tock turns back to tick.',
      'The lever is east. Pull it, and the tower opens its spine.',
    ],
    intro: 'The final climb. A box, a lever, two gates, and the mirror at the top of the tower.',
    hints: [
      { at: [5, 8], text: 'Push the gift box onto the plate to unlock the tower’s spine.' },
      { at: [12, 6], text: 'The spine has four locks: plate, gold door, lever, and the final χ gate.' },
    ],
    theme: 'tower',
  },
};
