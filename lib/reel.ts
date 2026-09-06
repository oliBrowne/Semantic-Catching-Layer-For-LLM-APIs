/**
 * The reel.
 *
 * The page does not scroll past the letter — the letter is a strip of film and
 * the scrollbar is the projector. Scrolling never moves the frame; it advances
 * the reel inside it.
 *
 * Everything here is measured in viewports of scroll, because that is the unit
 * a thumb actually works in.
 */

export type CardSpec = {
  id: string;
  /** Two or three lines of the letter, read together. */
  lines: string[];
  /** Extra viewports held after the last word, on top of the usual beat. */
  linger?: number;
  /** Overrides the ink-proportional writing length. */
  write?: number;
};

export type Cue = {
  id: string;
  lines: string[];
  /** Where the pen touches down, in viewports from the top of the reel. */
  at: number;
  /** How much scroll the writing takes. */
  write: number;
  /** How much scroll the finished lines are held. */
  hold: number;
  /** How much scroll they take to lift away. */
  exit: number;
};

export type Reel = {
  cues: Cue[];
  /** Total scroll length, in viewports. */
  length: number;
};

/**
 * Scroll per character of ink.
 *
 * This is the single most important number in the piece: it is how far the
 * hand moves for a given movement of the thumb. Holding it constant across
 * every card is what stops a short line racing past and a long one dragging.
 */
const SCROLL_PER_CHARACTER = 0.0125;

/** The beat every card gets after its last word, before it can be let go of. */
const HOLD = 0.42;

/** How long a card takes to lift away, during which the next is already coming. */
const EXIT = 0.34;

/** Empty scroll at the very end, so the last thing does not sit against the stop. */
const TAIL = 0.6;

export function buildReel(specs: CardSpec[], startAt = 0): Reel {
  let at = startAt;
  const cues: Cue[] = [];

  for (const spec of specs) {
    const characters = spec.lines.join(' ').length;
    const write = spec.write ?? Math.max(0.45, characters * SCROLL_PER_CHARACTER);
    const hold = HOLD + (spec.linger ?? 0);

    cues.push({ id: spec.id, lines: spec.lines, at, write, hold, exit: EXIT });

    // The next card begins as this one finishes leaving — overlapping by the
    // last tenth of the fade, which is enough to feel like a handover and not
    // enough for two thoughts to be legible on top of each other at once.
    at += write + hold + EXIT * 0.9;
  }

  return { cues, length: at + EXIT + TAIL };
}

/** Where a cue sits in the reel, as fractions of the whole. */
export function cueRange(cue: Cue, length: number) {
  return {
    writeStart: cue.at / length,
    writeEnd: (cue.at + cue.write) / length,
    exitStart: (cue.at + cue.write + cue.hold) / length,
    exitEnd: (cue.at + cue.write + cue.hold + cue.exit) / length,
  };
}
