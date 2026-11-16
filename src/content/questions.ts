import { lines } from './markup';
import type { Question } from './types';

/*
  Chiasmus gates in the Mirror Maze, the secret room puzzle, and the final
  "what does it emphasize" question. Each has exactly one correct option
  (checked in tests/content.test.ts). Wrong options explain why they fail.
*/

export const QUESTIONS: Record<string, Question> = {
  protect: {
    id: 'protect',
    prompt: 'WHICH PHRASE COMPLETES THE REVERSAL?',
    stem: 'The elves protect Christmas, and Christmas protects ____.',
    options: [
      { text: 'the elves', correct: true },
      { text: 'Christmas', why: '“Christmas protects Christmas” repeats B instead of crossing back to A.' },
      { text: 'the reindeer', why: 'A new term breaks the mirror. The sentence has to return to where it started: the elves.' },
      { text: 'the presents', why: 'The presents never appeared in the first half, so nothing reverses.' },
    ],
    full: lines('[A:The elves] protect [B:Christmas],', 'and [B:Christmas] protects [A:the elves].'),
    structure: 'A = the elves, B = Christmas. The second half swaps them, so protection runs both ways.',
    effect:
      'The crossing turns a job description into a partnership: the elves keep Christmas going, and Christmas gives the elves their purpose.',
  },
  cocoa: {
    id: 'cocoa',
    prompt: 'WHICH WORD COMPLETES THE REVERSAL?',
    stem: 'We warm the cocoa, and the cocoa warms ____.',
    options: [
      { text: 'us', correct: true },
      { text: 'the cocoa', why: 'That just repeats B. The first term (we) has to come back at the end.' },
      { text: 'the marshmallows', why: 'Marshmallows are new. A chiasmus returns to its original terms.' },
      { text: 'the workshop', why: 'The workshop was never in the first half, so nothing crosses.' },
    ],
    full: lines('[A:We] warm [B:the cocoa],', 'and [B:the cocoa] warms [A:us].'),
    structure: 'A = we / us, B = the cocoa. “We” returns as “us”: the same idea in a new grammatical role.',
    effect: 'The reversal makes a small kindness feel like a loop: the warmth you give comes back to you.',
  },
  toys: {
    id: 'toys',
    prompt: 'WHICH ENDING COMPLETES THE REVERSAL?',
    stem: 'In the upside-down factory, we don’t play with the toys; ____.',
    options: [
      { text: 'the toys play with us.', correct: true },
      { text: 'we play with the toys.', why: 'Same order as the first half, so nothing crosses. It also contradicts the setup.' },
      { text: 'the toys play with the reindeer.', why: 'B moved to the front, but A never came back. Both terms have to trade places.' },
      { text: 'we play, play, play with the toys.', why: 'Repetition isn’t reversal. Saying it more doesn’t cross anything.' },
    ],
    full: lines('[A:We] don’t play with [B:the toys];', '[B:the toys] play with [A:us].'),
    structure: 'A = we / us, B = the toys. Swapping who plays with whom is the whole joke.',
    effect: 'The reversal dramatizes a power shift: the factory is so broken that the objects are now in control.',
  },
  happy: {
    id: 'happy',
    prompt: 'WHICH ENDING COMPLETES THE REVERSAL?',
    stem: 'We don’t wrap gifts to be happy; ____.',
    options: [
      { text: 'we’re happy to wrap gifts.', correct: true },
      { text: 'we wrap gifts to be happy.', why: 'Same order again: no crossing, and it contradicts the first half.' },
      { text: 'we’re happy to bake cookies.', why: '“Happy” moved, but “wrap gifts” never came back. Only half the mirror.' },
      { text: 'we wrap gifts, wrap gifts, wrap gifts.', why: 'Pure repetition (A-A-A). Nothing trades places.' },
    ],
    full: lines('We don’t [A:wrap gifts] to [B:be happy];', 'we’re [B:happy] to [A:wrap gifts].'),
    structure: 'A = wrap gifts, B = happy. The swap flips cause and effect.',
    effect:
      'The reversal changes what the work means: happiness isn’t the reward for wrapping; it’s the reason the elves wrap at all.',
  },
  clocks: {
    id: 'clocks',
    prompt: 'WHICH ENDING COMPLETES THE REVERSAL?',
    stem: 'By day, the clocks tick forward; ____.',
    options: [
      { text: 'backward they tick by night.', correct: true },
      {
        text: 'by night, the clocks tick backward.',
        why: 'A fine sentence, but it’s parallel: time first, then action, both times. Nothing crosses.',
      },
      { text: 'the clocks tick, tick, tick.', why: 'Repetition, not reversal. The time phrase never returns.' },
      { text: 'by day, the clocks tick forward.', why: 'That repeats the first half word for word.' },
    ],
    full: lines('[A:By day], [B:the clocks tick forward];', '[B:backward they tick] [A:by night].'),
    structure:
      'A = when (by day / by night), B = what the clocks do. No words repeat exactly, but the grammar crosses: time-action, then action-time.',
    effect:
      'The crossed order mirrors the meaning: the night half literally runs backward, so the sentence’s shape acts out the reversal it describes.',
  },
  tower: {
    id: 'tower',
    prompt: 'WHAT DOES THE AUTHOR EMPHASIZE?',
    stem: '“We don’t light the tower because it’s Christmas; it’s Christmas because we light the tower.”',
    options: [
      { text: 'Christmas is something people create through their actions, not just a date on the calendar.', correct: true },
      { text: 'The tower is extremely bright.', why: 'That’s the surface topic, not what the reversal emphasizes.' },
      {
        text: 'Lighting the tower and Christmas have nothing to do with each other.',
        why: 'The reversal ties them together more tightly. It just flips which one causes the other.',
      },
      {
        text: 'Saying “Christmas” twice makes the sentence feel more festive.',
        why: 'Repetition alone isn’t the point. The swap of cause and effect carries the meaning.',
      },
    ],
    full: lines('We don’t [A:light the tower] because [B:it’s Christmas];', '[B:it’s Christmas] because we [A:light the tower].'),
    structure: 'A = light the tower, B = it’s Christmas. The reversal swaps cause and effect.',
    effect: 'Flipping the cause gives the elves agency: the holiday exists because people keep its traditions alive.',
  },
  memorable: {
    id: 'memorable',
    prompt: 'WHY IS THIS MORE MEMORABLE THAN ORDINARY REPETITION?',
    stem: 'Compare “The elves protect Christmas, and Christmas protects the elves” with “The elves protect Christmas, and the elves protect Christmas every day.”',
    options: [
      {
        text: 'The swap makes us notice a two-way relationship, so a whole argument fits in one balanced, quotable sentence.',
        correct: true,
      },
      { text: 'It uses more words, so it takes longer to forget.', why: 'Both versions are about the same length. Length isn’t what makes it stick.' },
      { text: 'Any repeated phrase is memorable, so the reversal doesn’t matter.', why: 'The repetitive version repeats too, and says less. The crossing adds the meaning.' },
      { text: 'It rhymes.', why: 'Neither version rhymes. The power comes from the mirrored structure.' },
    ],
    full: lines('[A:The elves] protect [B:Christmas],', 'and [B:Christmas] protects [A:the elves].'),
    structure: 'A = the elves, B = Christmas. Same two terms, crossed.',
    effect:
      'Balance makes it easy to remember, and the surprise of the swap makes listeners rethink the relationship: protection runs both ways.',
    award: 'fragmentC',
  },
  hoops: {
    id: 'hoops',
    prompt: 'WHICH WORD COMPLETES THE REVERSAL?',
    stem: 'Great teams build great players, and great players build great ____.',
    options: [
      { text: 'teams', correct: true },
      { text: 'players', why: 'That repeats B. The sentence has to cross back to teams.' },
      { text: 'trophies', why: 'Trophies are new. Return to the original term.' },
      { text: 'sneakers', why: 'Fresh sneakers, but no reversal.' },
    ],
    full: lines('Great [A:teams] build great [B:players],', 'and great [B:players] build great [A:teams].'),
    structure: 'A = teams, B = players. Each one builds the other.',
    effect: 'The crossing makes teamwork and talent a loop: neither comes first, and each makes the other better.',
    award: 'lechiasmus',
  },
  finale: {
    id: 'finale',
    prompt: 'WHAT DOES THIS REVERSAL EMPHASIZE?',
    stem: '“You didn’t save Christmas — Christmas saved you.”',
    options: [
      {
        text: 'The relationship runs both ways: the people who protected Christmas were changed by it too.',
        correct: true,
      },
      { text: 'Christmas is more powerful than people, so effort doesn’t matter.', why: 'The first half admits the effort happened. The swap reframes it; it doesn’t erase it.' },
      { text: 'Saying “Christmas” twice makes the sentence longer and more festive.', why: 'Repetition alone isn’t the effect. The crossing of who saves whom is.' },
      { text: 'It’s a contradiction meant to confuse the Syntax Grinch.', why: 'It isn’t a contradiction. Both halves can be true at once, and that’s the point.' },
    ],
    full: lines('[A:You] didn’t save [B:Christmas] —', '[B:Christmas] saved [A:you].'),
    structure: 'A = you, B = Christmas. The second half swaps who does the saving.',
    effect:
      'The audience expects a hero story and gets a mirror instead. The swap turns a victory into gratitude: what we protect also protects us.',
  },
};

export function getQuestion(id: string): Question {
  const q = QUESTIONS[id];
  if (!q) throw new Error(`Unknown question ${id}`);
  return q;
}
