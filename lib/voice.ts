/**
 * The reading, if there is one.
 *
 * When a recording of the poem is present, the letter stops keeping its own
 * time and keeps the reader's: every word is written at the moment it is
 * spoken, and the pauses between lines are the reader's pauses rather than a
 * designer's guess at them. With no recording this module reports nothing and
 * the piece runs exactly as it did before, on its own clock.
 *
 * The timings come from tools/align-voice.py. See tools/README.md.
 */

import { CARDS } from '@/content/letter';
import data from '@/content/voice.json';

export type WordTiming = { start: number; end: number };

type RawWord = { text: string; line: number; start: number; end: number };
type RawVoice = {
  source: string;
  duration: number;
  words: RawWord[];
  lines: { line: number; start: number; end: number }[];
};

const raw = data as unknown as RawVoice;
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const words = raw.words ?? [];

/** Where the recording is, and how long it runs. Null when there isn't one. */
export const READING =
  words.length && raw.source
    ? { src: `${base}/voice/${raw.source}`, duration: raw.duration }
    : null;

export type CardVoice = {
  /** Where this card begins in the recording, in seconds. */
  at: number;
  /** Where the reader leaves it. */
  until: number;
  /** One span per word, in seconds from `at`, in the order they are written. */
  times: WordTiming[];
};

/**
 * The last line of the letter is not on a card; it is spoken over the heart at
 * the end. It is the line after every card line, which is where the aligner
 * put it too.
 */
const FINAL_LINE_INDEX = CARDS.reduce((total, card) => total + card.lines.length, 0);

function spanOf(from: number, to: number): CardVoice | null {
  const own = words.filter((word) => word.line >= from && word.line <= to);
  if (!own.length) return null;
  const at = own[0].start;
  return {
    at,
    until: own[own.length - 1].end,
    times: own.map((word) => ({ start: word.start - at, end: word.end - at })),
  };
}

/** Per card, when it is spoken and how its words fall inside it. */
export const CARD_VOICE: Record<string, CardVoice> = {};
if (words.length) {
  let line = 0;
  for (const card of CARDS) {
    const voice = spanOf(line, line + card.lines.length - 1);
    if (voice) CARD_VOICE[card.id] = voice;
    line += card.lines.length;
  }
}

/** The closing line, spoken alone. */
export const FINAL_VOICE = words.length ? spanOf(FINAL_LINE_INDEX, FINAL_LINE_INDEX) : null;

/**
 * The finale writes the whole poem at once, so each line needs its own spans
 * measured from its own beginning rather than from the top of the recording.
 */
export const LINE_VOICE: (CardVoice | null)[] = words.length
  ? Array.from({ length: FINAL_LINE_INDEX + 1 }, (_, line) => spanOf(line, line))
  : [];

/** The order the cards are spoken in, with the moment each one arrives. */
export const CUES = CARDS.map((card) => ({ id: card.id, voice: CARD_VOICE[card.id] ?? null })).filter(
  (cue): cue is { id: string; voice: CardVoice } => cue.voice !== null,
);
