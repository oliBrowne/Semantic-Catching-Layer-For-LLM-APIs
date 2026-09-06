import { CARDS } from '@/content/letter';
import { buildReel, type Cue } from './reel';

/**
 * Where everything in the piece sits along the reel.
 *
 * Shared by the frame that renders the letter and by the empty strip of scroll
 * that drives it, so the page is exactly as long as the letter needs and not a
 * pixel longer.
 */

/** The opening writes itself before the reader has done anything. */
export const INTRO_SCROLL = 1.15;

const reel = buildReel(CARDS, INTRO_SCROLL);

function find(id: string): Cue {
  const cue = reel.cues.find((entry) => entry.id === id);
  if (!cue) throw new Error(`No card called "${id}" in the letter.`);
  return cue;
}

const end = (cue: Cue) => cue.at + cue.write + cue.hold;

const smileEnd = end(find('smile-3'));
const promiseStart = find('promise-1').at;
const promiseEnd = end(find('promise-3'));

/** Where the cards run out and the ending begins. */
const closing = end(find('declaration-2'));

export const SCHEDULE = {
  cues: reel.cues,
  cue: find,

  /** The dark between the two halves, where the afterimage hangs. */
  ghost: { from: smileEnd, to: promiseStart - 0.5 },

  /** The sheet coming up out of the dark, and going back into it. */
  paper: { from: promiseStart - 1.0, to: promiseEnd + 0.5 },

  /**
   * The ending, which is one composed scene rather than another card: the last
   * sentence, a heart drawn under it, the photograph coming up behind both of
   * them, and a name.
   */
  ending: {
    line: { at: closing, write: 0.85 },
    heart: { from: closing + 1.25, to: closing + 2.7 },
    /** The sentence and the heart let go as the name is written. */
    leave: { from: closing + 5.5, to: closing + 6.1 },
    photo: { band: closing + 2.95, open: closing + 5.6 },
    signature: closing + 6.0,
    flourish: closing + 7.2,
    secret: closing + 8.6,
  },
} as const;

/** Total scroll, in viewports, plus a screen to stand on at the end. */
export const REEL_LENGTH = SCHEDULE.ending.secret + 2.4;
