import type { CardSpec } from '@/lib/reel';

/**
 * The letter itself.
 *
 * The lines are the ones from the page, grouped into what the reader sees at
 * once — two or three at a time, so a thought arrives whole rather than a line
 * at a time. `linger` is the extra scroll a card is held for before it lets go,
 * and that is where the pacing of the piece lives.
 */

export const OPENING = {
  first: 'for you.',
  second: 'there were some things\nI wanted you to keep.',
};

export const CARDS: CardSpec[] = [
  {
    id: 'eyes-1',
    lines: [
      'I have passed by many eyes,',
      'but yours were the only ones',
      'that felt like a place to stay,',
    ],
    linger: 0.3,
  },
  {
    id: 'eyes-2',
    lines: ['the only ones I ever wanted', 'to be lost in.'],
    linger: 0.55,
  },
  {
    id: 'smile-1',
    lines: ['And then you looked at me and smiled,', 'and something in me knew.'],
    // The longest silence in the piece, and the reason for it.
    linger: 0.85,
  },
  {
    id: 'smile-2',
    lines: ['From that moment on,', 'no other eyes could hold me,'],
  },
  {
    id: 'smile-3',
    lines: ['no other smile could move me', 'like yours did.'],
    linger: 0.7,
  },
  {
    id: 'promise-1',
    lines: [
      'I promise to love you when it feels easy,',
      'and even more when it feels hard.',
    ],
    linger: 0.35,
  },
  {
    id: 'promise-2',
    lines: [
      'I promise to hold you when fear takes over,',
      'and to stay when silence grows between us.',
    ],
    linger: 0.35,
  },
  {
    id: 'promise-3',
    lines: [
      'Even in the moments we do not understand each other,',
      'my heart will always know you.',
    ],
    linger: 0.9,
  },
  {
    id: 'declaration-1',
    lines: ['Here it is,', 'my heart, and it has always been yours.'],
    linger: 0.35,
  },
  {
    id: 'declaration-2',
    lines: [
      'Every day, endlessly, I give it to you again.',
      'In this fleeting life and in every life to come,',
      'my choice will never change.',
    ],
    linger: 0.5,
  },
];

/** The last sentence, which the ending is built around. */
export const FINAL_LINE = 'It will always be you.';

/** Every word in the letter, used to size the hand consistently throughout. */
export const ALL_LINES = CARDS.flatMap((card) => card.lines).join('\n');

/** Where the dark opens onto the sheet the letter was written on. */
export const PAPER_FROM = 'promise-1';
export const PAPER_TO = 'promise-3';

/** The last words of the card the ember gathers behind. */
export const EMBER_CARD = 'promise-3';
/** The card whose closing line stops the room. */
export const STILL_CARD = 'smile-3';
/** The card the dust leans toward. */
export const GATHER_CARD = 'eyes-2';
/** Left behind as an afterimage when the light goes. */
export const GHOST = 'like yours did.';

export const SIGNATURE = {
  first: 'Yours,',
  second: 'Oliver',
};

export const SECRET_LABEL = 'one more thing';

/** Replace with whatever is actually behind it. */
export const SECRET_NOTE = [
  'this is where the last thing goes —',
  'a voice note, or the sentence',
  'that was too quiet to write down.',
].join('\n');
