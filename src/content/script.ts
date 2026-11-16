import type { StepId } from '../state/store';

/* Story panels, presenter notes (two presenters), and the closing lesson. */

export interface IntroPanel {
  who: 'none' | 'santa-alarm' | 'santa-happy' | 'grinch';
  speaker?: string;
  heading?: string;
  text: string;
  list?: string[];
}

export const INTRO: IntroPanel[] = [
  {
    who: 'none',
    heading: 'December 24, 11:57 PM',
    text: 'Three minutes until Christmas. At the North Pole, something has gone very, very backwards.',
  },
  {
    who: 'santa-alarm',
    speaker: 'Santa, over the loudspeaker',
    text: 'ATTENTION, ALL ELVES. THIS IS A GRAMMAR EMERGENCY. I repeat: this is an emergency of grammar.',
  },
  {
    who: 'santa-alarm',
    speaker: 'Santa',
    text: 'Someone stole my Reality Mirror. Without it, everything flips the wrong way:',
    list: [
      'Presents are unwrapping themselves.',
      'Reindeer are riding sleighs.',
      'Cookies are trying to eat Santa.',
      'Snowmen are putting carrots on humans.',
      'Elves are giving Santa a performance review.',
    ],
  },
  {
    who: 'grinch',
    speaker: 'The Syntax Grinch',
    text: 'I took the mirror! No more clever reversals. From now on, everything just repeats. A-A-A-A!',
  },
  {
    who: 'santa-happy',
    speaker: 'Santa',
    text: 'You’re now agents of the N.R.I.D., the North Pole Rhetorical Investigation Department. Find the impostors, recover the mirror fragments, and save Christmas.',
  },
];

export interface Notes {
  time: string;
  p1: string[];
  p2: string[];
  answer?: string;
}

export const NOTES: Record<StepId, Notes> = {
  intro: {
    time: 'Quick Play 0:00–0:30',
    p1: ['Read Santa’s lines in your best panicked Santa voice.', 'Click (or press Enter) to advance each panel.'],
    p2: ['Introduce the mission: “We’re the N.R.I.D. Our job is to find elves misusing reversal.”'],
  },
  briefing: {
    time: 'Quick Play 0:30–1:00',
    p1: ['Ask the class: “What do you notice about where the words go?”'],
    p2: [
      'Define it: chiasmus reverses parallel parts, A-B then B-A.',
      'Point at the X: chiasmus is named after the Greek letter chi (χ).',
      'Antimetabole = the version with the exact same words. Repetition and same-order parallelism are NOT chiasmus.',
    ],
  },
  case1: {
    time: 'Quick Play 1:00–2:00',
    p1: ['Read the four statements aloud, or pick four volunteers to read them in character.', 'Run the vote: “Hands up for A… B… C… D.”'],
    p2: ['Hint if needed: “Which sentence keeps the same order both times?”', 'Turn on Detect reversal to color the A and B parts.'],
    answer: 'Impostor: Juniper Jinglesworth (C). “Santa feeds the reindeer, and Santa thanks the reindeer” is A-B / A-B: parallel, no swap.',
  },
  case2: {
    time: 'Quick Play 2:00–3:00',
    p1: ['“Everyone repeats this time. Find the one where nothing swaps.”'],
    p2: ['After the reveal, ask the discussion question: why is a reversal more memorable than repetition?'],
    answer: 'Impostor: Mistle Toby (B), who is Sir Repeats-a-Lot in disguise. “The children” repeats three times with no reversal (A … A … A).',
  },
  case3: {
    time: 'Adventure only',
    p1: ['“No words repeat here. Watch the grammar instead: what comes first, what comes second.”'],
    p2: ['Explain: chiasmus can reverse grammar or ideas, not only identical words.'],
    answer: 'Impostor: Flurry Featherfrost (D). “Hope for snow, but prepare for slush” is antithesis in the same order (action-thing / action-thing).',
  },
  maze1: {
    time: 'Adventure, about 3 minutes',
    p1: ['Drive: WASD / arrows to move, R on a glowing mirror to flip reality.'],
    p2: ['Explain the mechanic: gold doors open in A-B, cyan in B-A. Flipping reality is chiasmus you can walk through.'],
    answer: 'Gates: “the elves” (A), then “us” (A).',
  },
  maze2: {
    time: 'Adventure, about 4 minutes',
    p1: ['Push the gift box onto the plate. Backspace resets the room if it gets stuck.'],
    p2: ['Secret: flip reality next to the cracked wall in the bottom-right room to find the basketball court.'],
    answer: 'Gates: “the toys play with us” (A), “we’re happy to wrap gifts” (A). Secret: “teams” (A).',
  },
  maze3: {
    time: 'Adventure, about 4 minutes',
    p1: ['Box onto the plate (left room), then flip, pull the lever (right side), flip back, climb the spine.'],
    p2: ['Point out that the clock gate’s answer repeats no words: the grammar crosses instead.'],
    answer: 'Gates: “backward they tick by night” (A), “Christmas is something people create…” (A).',
  },
  mazeX: {
    time: 'Quick Play 3:00–5:30',
    p1: ['Drive, or hand the keyboard to a volunteer. WASD / arrows to move, R on a glowing mirror.'],
    p2: ['Narrate: “Reality A-B, then mirror B-A. The world itself is doing chiasmus.”', 'Each gate pauses the game for a class question.'],
    answer: 'Gates: “the elves” (A), then the memorability question (A).',
  },
  final: {
    time: 'Quick Play 5:30–6:30',
    p1: ['Voice the Syntax Grinch. Lean into the “A-A-A-A!”'],
    p2: ['Let the class tell you where each block goes. Matching pairs go on the outside and the inside.'],
    answer: 'Build: You / Christmas / Christmas / you (or Christmas / you / you / Christmas). Emphasis question: A.',
  },
  ending: {
    time: 'Quick Play 6:30–7:30',
    p2: ['Read the four reasons this game is chiasmus.'],
    p1: ['Deliver the closing line, then point classmates to the Kennedy examples for their organizers.'],
  },
};

export const WHY_POINTS: { title: string; body: string }[] = [
  {
    title: 'The puzzles reverse parallel elements',
    body: 'Every true suspect and every gate crossed A-B into B-A: Santa and the elves, work and live, day and night.',
  },
  {
    title: 'The mirror reverses the world itself',
    body: 'Flipping from Reality A-B to Mirror B-A turned the device into a place you could walk through. Doors that were open closed, and the closed ones opened.',
  },
  {
    title: 'The investigation showed what it is not',
    body: 'Repetition (A-A-A), same-order parallelism (A-B, A-B), and antithesis without a crossing were all impostors.',
  },
  {
    title: 'You built and judged meaningful reversals',
    body: 'The class didn’t just spot the pattern. You explained what each swap emphasizes: mutual trust, priorities, cause and effect, gratitude.',
  },
];

export const CLOSING_LINE = {
  lines: ['We made a game about chiasmus,', 'and chiasmus made the game.'],
};
