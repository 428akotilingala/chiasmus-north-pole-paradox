import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { audio } from '../audio/audio';

export type Mode = 'adventure' | 'quick';
export type StepId = 'intro' | 'briefing' | 'case1' | 'case2' | 'case3' | 'maze1' | 'maze2' | 'maze3' | 'mazeX' | 'final' | 'ending';
export type View = 'title' | 'howto' | 'settings' | 'archive' | 'game';
export type Overlay = null | 'pause' | 'settings' | 'archive' | 'chapters';
export type Fragment = 'A' | 'B' | 'C';

export const SEQUENCES: Record<Mode, StepId[]> = {
  adventure: ['intro', 'briefing', 'case1', 'maze1', 'case2', 'maze2', 'case3', 'maze3', 'final', 'ending'],
  quick: ['intro', 'briefing', 'case1', 'case2', 'mazeX', 'final', 'ending'],
};

export const STEP_LABEL: Record<StepId, string> = {
  intro: 'Grammar emergency',
  briefing: 'What is chiasmus?',
  case1: 'Case 1: The Self-Unwrapping Presents',
  case2: 'Case 2: The Repetition Infection',
  case3: 'Case 3: The Clock Tower Conspiracy',
  maze1: 'Maze 1: The Frozen Workshop',
  maze2: 'Maze 2: The Upside-Down Gift Factory',
  maze3: 'Maze 3: The Clock Tower of Reversal',
  mazeX: 'The Mirror Maze',
  final: 'The Reality Mirror',
  ending: 'Why this game is chiasmus',
};

export const ACHIEVEMENTS: Record<string, { name: string; desc: string }> = {
  'first-eject': { name: 'Impostor Ejected', desc: 'Caught your first rhetorical impostor.' },
  unmasked: { name: 'Mustache Removed', desc: 'Unmasked Sir Repeats-a-Lot.' },
  'mirror-walker': { name: 'Mirror Walker', desc: 'Reversed reality 10 times.' },
  lechiasmus: { name: 'LeChiasmus', desc: 'Found the secret court and won the (fake) trophy.' },
  sparkles: { name: 'Sparkle Collector', desc: 'Collected 8 sparkles in the mazes.' },
  reformed: { name: 'A-B-B-A', desc: 'Taught the Syntax Grinch to reverse.' },
  nice: { name: 'Grammatically Nice', desc: 'Finished with the meter at 80 or higher.' },
};

export interface Settings {
  music: boolean;
  sfx: boolean;
  reducedMotion: boolean;
  /** class vote countdown in seconds; 0 = no time pressure */
  timer: 0 | 10 | 20 | 30;
  touch: 'auto' | 'on' | 'off';
}

export interface Progress {
  mode: Mode;
  step: number;
  fragments: Fragment[];
  nice: number;
  achievements: string[];
  /** case id -> class answered correctly */
  results: Record<string, boolean>;
  finalOrder?: 'gratitude' | 'responsibility';
  flips: number;
  sparkles: number;
  startedAt: number;
}

export interface Toast {
  id: number;
  text: string;
  tone: 'info' | 'good' | 'bad' | 'achievement';
}

interface State {
  view: View;
  overlay: Overlay;
  notes: boolean;
  settings: Settings;
  progress: Progress | null;
  toasts: Toast[];
  /** bump to force the current step to remount (restart chapter) */
  stepKey: number;
}

type Action =
  | { type: 'view'; view: View }
  | { type: 'overlay'; overlay: Overlay }
  | { type: 'notes'; open?: boolean }
  | { type: 'settings'; patch: Partial<Settings> }
  | { type: 'start'; mode: Mode }
  | { type: 'continue' }
  | { type: 'next' }
  | { type: 'jump'; step: number }
  | { type: 'restartStep' }
  | { type: 'fragment'; id: Fragment }
  | { type: 'nice'; delta: number }
  | { type: 'achieve'; id: string }
  | { type: 'result'; caseId: string; correct: boolean }
  | { type: 'finalOrder'; order: 'gratitude' | 'responsibility' }
  | { type: 'flip' }
  | { type: 'sparkle' }
  | { type: 'toast'; text: string; tone?: Toast['tone'] }
  | { type: 'dismiss'; id: number }
  | { type: 'quit' }
  | { type: 'resetAll' };

const STORE_KEY = 'chiasmus-npp.v1';

function prefersReducedMotion() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

const defaultSettings = (): Settings => ({ music: true, sfx: true, reducedMotion: prefersReducedMotion(), timer: 10, touch: 'auto' });

function load(): Pick<State, 'settings' | 'progress'> {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      return { settings: { ...defaultSettings(), ...d.settings }, progress: d.progress ?? null };
    }
  } catch {
    /* storage unavailable: run without it */
  }
  return { settings: defaultSettings(), progress: null };
}

let toastId = 1;

function newProgress(mode: Mode): Progress {
  return { mode, step: 0, fragments: [], nice: 50, achievements: [], results: {}, flips: 0, sparkles: 0, startedAt: Date.now() };
}

function withAchievement(p: Progress, id: string, toasts: Toast[]): [Progress, Toast[]] {
  if (p.achievements.includes(id) || !ACHIEVEMENTS[id]) return [p, toasts];
  return [
    { ...p, achievements: [...p.achievements, id] },
    [...toasts, { id: toastId++, text: `Achievement: ${ACHIEVEMENTS[id].name}`, tone: 'achievement' }],
  ];
}

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'view':
      return { ...s, view: a.view, overlay: null };
    case 'overlay':
      return { ...s, overlay: a.overlay };
    case 'notes':
      return { ...s, notes: a.open ?? !s.notes };
    case 'settings':
      return { ...s, settings: { ...s.settings, ...a.patch } };
    case 'start':
      return { ...s, view: 'game', overlay: null, progress: newProgress(a.mode), stepKey: s.stepKey + 1 };
    case 'continue':
      return s.progress ? { ...s, view: 'game', overlay: null, stepKey: s.stepKey + 1 } : s;
    case 'next': {
      if (!s.progress) return s;
      const seq = SEQUENCES[s.progress.mode];
      const step = Math.min(seq.length - 1, s.progress.step + 1);
      return { ...s, progress: { ...s.progress, step }, stepKey: s.stepKey + 1, overlay: null };
    }
    case 'jump': {
      if (!s.progress) return s;
      const seq = SEQUENCES[s.progress.mode];
      const step = Math.max(0, Math.min(seq.length - 1, a.step));
      // jumping ahead: grant the fragments earlier chapters would have given, so the finale still works
      const frags = new Set(s.progress.fragments);
      seq.slice(0, step).forEach((id) => {
        if (id === 'case1') frags.add('A');
        if (id === 'case2') frags.add('B');
        if (id === 'case3' || id === 'mazeX') frags.add('C');
      });
      return {
        ...s,
        view: 'game',
        overlay: null,
        progress: { ...s.progress, step, fragments: [...frags].sort() as Fragment[] },
        stepKey: s.stepKey + 1,
      };
    }
    case 'restartStep':
      return { ...s, overlay: null, stepKey: s.stepKey + 1 };
    case 'fragment': {
      if (!s.progress || s.progress.fragments.includes(a.id)) return s;
      return { ...s, progress: { ...s.progress, fragments: [...s.progress.fragments, a.id].sort() as Fragment[] } };
    }
    case 'nice': {
      if (!s.progress) return s;
      return { ...s, progress: { ...s.progress, nice: Math.max(0, Math.min(100, s.progress.nice + a.delta)) } };
    }
    case 'achieve': {
      if (!s.progress) return s;
      const [progress, toasts] = withAchievement(s.progress, a.id, s.toasts);
      return { ...s, progress, toasts };
    }
    case 'result': {
      if (!s.progress) return s;
      return { ...s, progress: { ...s.progress, results: { ...s.progress.results, [a.caseId]: a.correct } } };
    }
    case 'finalOrder':
      return s.progress ? { ...s, progress: { ...s.progress, finalOrder: a.order } } : s;
    case 'flip': {
      if (!s.progress) return s;
      let progress = { ...s.progress, flips: s.progress.flips + 1 };
      let toasts = s.toasts;
      if (progress.flips >= 10) [progress, toasts] = withAchievement(progress, 'mirror-walker', toasts);
      return { ...s, progress, toasts };
    }
    case 'sparkle': {
      if (!s.progress) return s;
      let progress = { ...s.progress, sparkles: s.progress.sparkles + 1 };
      let toasts = s.toasts;
      if (progress.sparkles >= 8) [progress, toasts] = withAchievement(progress, 'sparkles', toasts);
      return { ...s, progress, toasts };
    }
    case 'toast':
      return { ...s, toasts: [...s.toasts.slice(-3), { id: toastId++, text: a.text, tone: a.tone ?? 'info' }] };
    case 'dismiss':
      return { ...s, toasts: s.toasts.filter((t) => t.id !== a.id) };
    case 'quit':
      return { ...s, view: 'title', overlay: null };
    case 'resetAll':
      return { ...s, progress: null, view: 'title', overlay: null };
  }
}

interface Ctx {
  state: State;
  dispatch: React.Dispatch<Action>;
  step: StepId | null;
  sequence: StepId[];
  next: () => void;
}

const StoreCtx = createContext<Ctx | null>(null);
const NO_STEPS: StepId[] = [];

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    view: 'title' as View,
    overlay: null,
    notes: false,
    toasts: [],
    stepKey: 0,
    ...load(),
  }));

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ settings: state.settings, progress: state.progress }));
    } catch {
      /* ignore */
    }
  }, [state.settings, state.progress]);

  useEffect(() => {
    audio.setMusic(state.settings.music);
    audio.setSfx(state.settings.sfx);
  }, [state.settings.music, state.settings.sfx]);

  const sequence = state.progress ? SEQUENCES[state.progress.mode] : NO_STEPS;
  const step = state.view === 'game' && state.progress ? sequence[state.progress.step] : null;
  const next = useCallback(() => dispatch({ type: 'next' }), []);

  const value = useMemo(() => ({ state, dispatch, step, sequence, next }), [state, step, sequence, next]);
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore(): Ctx {
  const c = useContext(StoreCtx);
  if (!c) throw new Error('useStore outside provider');
  return c;
}
