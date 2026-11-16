/** A piece of a sentence. `role` marks the parallel elements (A / B) that a chiasmus crosses. */
export interface Seg {
  t: string;
  role?: 'A' | 'B' | 'C';
}

/** A statement laid out as lines for the chi diagram. Matching roles get connected across lines. */
export type Lines = Seg[][];

export type Expression = 'idle' | 'talk' | 'nervous' | 'smug' | 'shocked' | 'sad';

export type Accessory =
  | 'glasses'
  | 'monocle'
  | 'tophat'
  | 'mustache'
  | 'shades'
  | 'scarf'
  | 'bowtie'
  | 'headphones'
  | 'earmuffs'
  | 'freckles'
  | 'beard'
  | 'clipboard'
  | 'goggles'
  | 'headband'
  | 'crown'
  | 'bandaid'
  | 'braids'
  | 'cap';

export interface ElfLook {
  skin: string;
  hat: string;
  hair: string;
  tunic: string;
  collar: string;
  accessories: Accessory[];
}

export interface Suspect {
  id: string;
  name: string;
  /** one-line job / personality, shown under the name */
  role: string;
  look: ElfLook;
  /** the suspicious statement */
  quote: Lines;
  /** pattern label revealed after the vote, e.g. "A-B / B-A" */
  pattern: string;
  /** interview lines; some are deliberately misleading */
  interview: string[];
  /** expression used while being interviewed */
  mood: Expression;
  impostor?: boolean;
}

export interface CaseRound {
  id: 'case1' | 'case2' | 'case3';
  number: 1 | 2 | 3;
  title: string;
  /** what this round teaches, shown in the header */
  focus: string;
  /** a short read-aloud setup line */
  setup: string;
  suspects: [Suspect, Suspect, Suspect, Suspect];
  /** the authentic example highlighted in the debrief */
  authenticId: string;
  impostorWhy: string;
  authenticWhy: string;
  fragment: { id: 'A' | 'B' | 'C'; name: string; lesson: string };
  /** optional class discussion question shown in the debrief */
  discussion?: { prompt: string; answer: string };
  /** Sir Repeats-a-Lot's (bad) tip on the evidence board */
  badTip?: string;
  /** identity reveal for a disguised impostor */
  unmask?: string;
}

export interface Option {
  text: string;
  correct?: boolean;
  /** why a wrong option fails (shown when picked) */
  why?: string;
}

export interface Question {
  id: string;
  /** the big class prompt, e.g. "WHICH PHRASE COMPLETES THE REVERSAL?" */
  prompt: string;
  /** the sentence with a blank, or the quote under discussion */
  stem: string;
  options: Option[];
  /** the completed / analysed sentence as chi-diagram lines */
  full: Lines;
  /** what is reversed */
  structure: string;
  /** why the reversal matters / its effect on the audience */
  effect: string;
  /** shown when this question awards something */
  award?: 'fragmentC' | 'lechiasmus';
}
