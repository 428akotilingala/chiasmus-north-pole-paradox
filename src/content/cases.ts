import { lines } from './markup';
import type { CaseRound } from './types';

/*
  Every round has exactly one impostor and three valid examples.
  All statements are original game dialogue (no quotations).
  tests/content.test.ts checks the A/B role order of every statement:
  valid ones must mirror (A-B / B-A); impostors must not.
*/

const SKIN = {
  light: '#f6d1b4',
  peach: '#eab58f',
  tan: '#c48a5c',
  brown: '#8d5638',
  deep: '#5e3826',
};

export const CASES: CaseRound[] = [
  {
    id: 'case1',
    number: 1,
    title: 'The Self-Unwrapping Presents',
    focus: 'Spot the basic A-B / B-A reversal',
    setup:
      'Four elves were near the presents when they started unwrapping themselves. Three speak in true reversals. One only thinks they do.',
    suspects: [
      {
        id: 'tinsel',
        name: 'Tinsel Twinkletoes',
        role: 'Head gift-wrapper. Nervous about everything.',
        look: { skin: SKIN.light, hat: '#E63946', hair: '#c4502d', tunic: '#147D64', collar: '#F7C65F', accessories: ['freckles'] },
        quote: lines('[A:Santa] trusts [B:the elves],', 'and [B:the elves] trust [A:Santa].'),
        pattern: 'A-B / B-A',
        interview: [
          'I-I just think trust should go both ways! Santa trusts us, and we trust him back.',
          'Why is everyone looking at me? I wrap presents. I don’t wrap… lies.',
          'Okay, that sounded suspicious. Forget I said “wrap lies.”',
        ],
        mood: 'nervous',
      },
      {
        id: 'gumdrop',
        name: 'Gumdrop Butterbuns',
        role: 'Cookie department. Thinks the cookies are organizing.',
        look: { skin: SKIN.brown, hat: '#F7C65F', hair: '#22192b', tunic: '#E63946', collar: '#F7FAFC', accessories: ['glasses'] },
        quote: lines('[A:We] don’t forget [B:the cookies],', 'and [B:the cookies] don’t forget [A:us].'),
        pattern: 'A-B / B-A',
        interview: [
          'Every year, we remember the cookies. Now the cookies remember us.',
          'Same two parties, switched places. That isn’t a sentence. That’s a warning.',
          'Last night one of them asked me for milk. Politely.',
        ],
        mood: 'shocked',
      },
      {
        id: 'juniper',
        name: 'Juniper Jinglesworth',
        role: 'Reindeer caretaker. Extremely confident.',
        look: { skin: SKIN.peach, hat: '#147D64', hair: '#f0d27a', tunic: '#9B5DE5', collar: '#69E6F1', accessories: ['scarf'] },
        quote: lines('[A:Santa] feeds [B:the reindeer],', 'and [A:Santa] thanks [B:the reindeer].'),
        pattern: 'A-B / A-B',
        interview: [
          '“Santa” shows up twice. “The reindeer” shows up twice. Two pairs. Pairs are mirrors. Mirrors are chiasmus. Case closed.',
          'Did the words switch places? Why would they switch places? They’re already in great places.',
        ],
        mood: 'smug',
        impostor: true,
      },
      {
        id: 'pinecone',
        name: 'Pinecone O’Frost',
        role: 'Roof safety inspector. Has seen things.',
        look: { skin: SKIN.tan, hat: '#3d6fd6', hair: '#5a3a22', tunic: '#F7C65F', collar: '#E63946', accessories: ['goggles'] },
        quote: lines('Keep [A:the snow] on [B:the roof],', 'not [B:the roof] in [A:the snow].'),
        pattern: 'A-B / B-A',
        interview: [
          'Snow on the roof: festive. Roof in the snow: structural catastrophe.',
          'Same two words, opposite order, completely different building. I put that on a safety poster.',
        ],
        mood: 'idle',
      },
    ],
    authenticId: 'tinsel',
    impostorWhy:
      'Santa and the reindeer both repeat, but they never trade places: Santa stays first, the reindeer stay second. The same order twice is parallelism, not reversal.',
    authenticWhy:
      'Santa and the elves swap places, so the trust runs both ways. The mirror shape lets one sentence show the relationship is mutual.',
    fragment: {
      id: 'A',
      name: 'Structural reversal',
      lesson: 'Chiasmus crosses its parts: A-B becomes B-A. If nothing trades places, it’s only parallelism.',
    },
    badTip: 'Hot tip! Count the repeated words! Most repeated words wins! Most repeated words wins!',
  },
  {
    id: 'case2',
    number: 2,
    title: 'The Repetition Infection',
    focus: 'Chiasmus vs. plain repetition and parallelism',
    setup:
      'Copy-paste sentences are spreading through the workshop. Everyone is repeating things. Only one elf’s sentence has nothing reversed.',
    suspects: [
      {
        id: 'holly',
        name: 'Holly Hollerton',
        role: 'Elf union representative. Wants a nap.',
        look: { skin: SKIN.deep, hat: '#9B5DE5', hair: '#22192b', tunic: '#147D64', collar: '#F7C65F', accessories: ['braids'] },
        quote: lines('Elves should [A:work] to [B:live],', 'not [B:live] to [A:work].'),
        pattern: 'A-B / B-A',
        interview: [
          'It’s about priorities. You work so you can live. You don’t live so you can work.',
          'I flipped it on purpose. The flip is the whole argument. Also, I would like a nap.',
        ],
        mood: 'idle',
      },
      {
        id: 'mistle',
        name: 'Mistle Toby',
        role: 'Definitely a brand-new elf. Has a mustache.',
        look: { skin: SKIN.light, hat: '#E63946', hair: '#e9eef5', tunic: '#22304d', collar: '#F7C65F', accessories: ['mustache', 'shades'] },
        quote: lines('We wrap for [A:the children],', 'we bake for [A:the children],', 'we sing for [A:the children]!'),
        pattern: 'A … A … A',
        interview: [
          'Children, children, CHILDREN. Three times! That’s triple chiasmus. Which is a real thing. Totally real. Totally real.',
          'Reversal? Who needs reversal when you have repetition? Repetition! Repetition!',
          'This mustache is my real mustache.',
        ],
        mood: 'smug',
        impostor: true,
      },
      {
        id: 'sprocket',
        name: 'Sprocket Snowberry',
        role: 'Logistics. Has a clipboard for everything.',
        look: { skin: SKIN.peach, hat: '#69E6F1', hair: '#5a3a22', tunic: '#E63946', collar: '#F7FAFC', accessories: ['clipboard', 'headphones'] },
        quote: lines(
          'You can take [A:the elf] out of [B:the workshop],',
          'but you can’t take [B:the workshop] out of [A:the elf].',
        ),
        pattern: 'A-B / B-A',
        interview: [
          'Elf leaves the workshop: easy. Workshop leaves the elf: impossible. Flip the two and you get the point.',
          'You can’t escape who you are. I’ve tried. It’s on my clipboard.',
        ],
        mood: 'idle',
      },
      {
        id: 'nutmeg',
        name: 'Nutmeg Naughtington',
        role: 'Naughty-list auditor. Unsettlingly calm.',
        look: { skin: SKIN.tan, hat: '#22304d', hair: '#ff8fb1', tunic: '#9B5DE5', collar: '#69E6F1', accessories: ['monocle'] },
        quote: lines('[A:Naughty] can turn [B:nice],', 'and [B:nice] can turn [A:naughty].'),
        pattern: 'A-B / B-A',
        interview: [
          'I audit the list. Naughty becomes nice. Nice becomes naughty.',
          'I’m not threatening anyone. I’m just saying. It goes both ways.',
        ],
        mood: 'smug',
      },
    ],
    authenticId: 'holly',
    impostorWhy:
      '“The children” repeats three times, but nothing ever swaps positions. That’s plain repetition (A … A … A). Saying a word more doesn’t cross anything.',
    authenticWhy:
      'Work and live trade places, and the swap is the argument: living is the goal and working is the means. Reverse the order and you reverse the priority.',
    fragment: {
      id: 'B',
      name: 'Meaningful relationship',
      lesson:
        'A reversal matters when the swap changes the relationship: who acts on whom, what causes what, or which one is the goal.',
    },
    discussion: {
      prompt: 'WHY IS THIS MORE MEMORABLE THAN ORDINARY REPETITION?',
      answer:
        'The listener hears the same two words twice and has to catch the switch. That small surprise packs a whole argument into a balanced, quotable shape, so it sticks.',
    },
    unmask: 'It was Sir Repeats-a-Lot all along!',
  },
  {
    id: 'case3',
    number: 3,
    title: 'The Clock Tower Conspiracy',
    focus: 'Reversed grammar and ideas, not just repeated words',
    setup:
      'The last impostor is a grammar expert. Here, chiasmus can cross grammar or ideas without repeating the same words. Watch the order of the parts.',
    suspects: [
      {
        id: 'cobblestone',
        name: 'Captain Cobblestone',
        role: 'Grammar police. Technically off duty.',
        look: { skin: SKIN.brown, hat: '#3d6fd6', hair: '#e9eef5', tunic: '#22304d', collar: '#F7C65F', accessories: ['cap', 'beard'] },
        quote: lines('We [A:lost] [B:the sleigh],', 'but [B:our hope] we [A:kept].'),
        pattern: 'action-thing / thing-action',
        interview: [
          '“Lost the sleigh”: action, then thing. “Our hope we kept”: thing, then action.',
          'The words don’t repeat. The grammar does, in reverse. Book it.',
        ],
        mood: 'idle',
      },
      {
        id: 'twinkle',
        name: 'Twinkle Ticktock',
        role: 'Clockmaker. Says “tick” instead of “yes.”',
        look: { skin: SKIN.light, hat: '#F7C65F', hair: '#22192b', tunic: '#147D64', collar: '#E63946', accessories: ['glasses', 'bowtie'] },
        quote: lines('[A:By day] [B:we wrap the gifts];', '[B:the carols we sing] [A:by night].'),
        pattern: 'time-action / action-time',
        interview: [
          'Day, then action. Action, then night. Like a clock hand going around and coming back.',
          'Tick.',
        ],
        mood: 'idle',
      },
      {
        id: 'marzipan',
        name: 'Marzipan Mapleton',
        role: 'Weather elf. Forecast: mirrored.',
        look: { skin: SKIN.deep, hat: '#69E6F1', hair: '#f0d27a', tunic: '#E63946', collar: '#F7FAFC', accessories: ['earmuffs'] },
        quote: lines('[A:The workshop] is [B:warm];', '[B:cold] is [A:the tundra].'),
        pattern: 'place-quality / quality-place',
        interview: [
          'Place, then temperature. Temperature, then place. Warm in here, cold out there.',
          'It’s a forecast and a mirror. Two for one.',
        ],
        mood: 'smug',
      },
      {
        id: 'flurry',
        name: 'Flurry Featherfrost',
        role: 'Motivational speaker. Very loud.',
        look: { skin: SKIN.peach, hat: '#E63946', hair: '#c4502d', tunic: '#F7C65F', collar: '#9B5DE5', accessories: ['headband'] },
        quote: lines('[A:Hope] for [B:snow],', 'but [A:prepare] for [B:slush].'),
        pattern: 'action-thing / action-thing',
        interview: [
          'Hope versus prepare! Snow versus slush! It’s FULL of opposites, and opposites are basically reversals. Right? RIGHT?',
          '…Right?',
        ],
        mood: 'nervous',
        impostor: true,
      },
    ],
    authenticId: 'cobblestone',
    impostorWhy:
      'Flurry’s line is full of opposites (antithesis), but both halves run in the same order: action, then thing; action, then thing. Contrast without crossing isn’t chiasmus.',
    authenticWhy:
      'No word repeats, yet the grammar crosses: action-thing, then thing-action. Ending on “kept” lets the sentence finish on what survived, so the loss is answered by resolve.',
    fragment: {
      id: 'C',
      name: 'Rhetorical purpose',
      lesson:
        'Chiasmus can reverse grammar or ideas, not just repeated words. Writers use the crossing to sharpen contrast, show balance, and make an idea stick.',
    },
  },
];

export function getCase(id: string): CaseRound {
  const c = CASES.find((k) => k.id === id);
  if (!c) throw new Error(`Unknown case ${id}`);
  return c;
}
