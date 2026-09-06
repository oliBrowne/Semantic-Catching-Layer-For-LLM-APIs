/**
 * The letter itself.
 *
 * Line breaks are the ones from the page. `holds` maps a line index to the
 * extra seconds the hand rests before starting the next line, which is how the
 * pacing of the piece is tuned: everything else about the writing is physics.
 */

export const OPENING = {
  first: 'for you.',
  second: 'there were some things\nI wanted you to keep.',
};

export const EYES = {
  text: [
    'I have passed by many eyes,',
    'but yours were the only ones',
    'that felt like a place to stay,',
    'the only ones I ever wanted',
    'to be lost in.',
  ].join('\n'),
  holds: { 1: 1.3, 3: 0.35 },
  /** The line the dust leans toward. */
  gatherLine: 4,
};

export const SMILE = {
  text: [
    'And then you looked at me and smiled,',
    'and something in me knew.',
    'From that moment on,',
    'no other eyes could hold me,',
    'no other smile could move me',
    'like yours did.',
  ].join('\n'),
  holds: { 1: 2.2, 2: 0.3, 4: 0.3 },
  /** Where the room stops moving altogether. */
  stillLine: 5,
  /** Left behind as an afterimage when the light goes. */
  ghost: 'like yours did.',
};

export const PROMISE = {
  text: [
    'I promise to love you when it feels easy,',
    'and even more when it feels hard.',
    'I promise to hold you when fear takes over,',
    'and to stay when silence grows between us.',
    'Even in the moments we do not understand each other,',
    'my heart will always know you.',
  ].join('\n'),
  holds: { 1: 1.2, 3: 1.7, 4: 0.4 },
  /** The line the ember gathers behind. */
  emberLine: 5,
};

export const DECLARATION = {
  text: [
    'Here it is,',
    'my heart, and it has always been yours.',
    'Every day, endlessly, I give it to you again.',
    'In this fleeting life and in every life to come,',
    'my choice will never change.',
  ].join('\n'),
  holds: { 0: 0.3, 1: 1.3, 2: 1.3, 3: 0.35 },
};

export const FINAL_LINE = 'It will always be you. ♡';

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
