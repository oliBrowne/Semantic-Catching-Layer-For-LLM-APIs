/**
 * The music.
 *
 * These files are NOT in the repository and cannot be — they are commercial
 * recordings, and nothing here can fetch them for you. Put your own copies in
 * public/music/ under these names and the player picks them up; leave them out
 * and the piece falls back to the room tone it synthesises for itself, which
 * is quiet and works with no files at all.
 *
 * Name them 01 and 02 and use any extension a browser plays — m4a, mp3, wav,
 * aac — and the player finds them. Only ogg is a bad idea, because iOS will
 * not play it.
 */

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export type Track = {
  title: string;
  /** Tried in order; the first one that exists is used. */
  sources: string[];
};

/** Whatever you have. The first of these that is actually there gets played. */
const formats = ['m4a', 'mp3', 'wav', 'aac', 'ogg'];

const track = (name: string, title: string): Track => ({
  title,
  sources: formats.map((extension) => `${base}/music/${name}.${extension}`),
});

export const PLAYLIST: Track[] = [
  track('01', 'Cry — Cigarettes After Sex'),
  track('02', 'Y somos novios'),
];

/**
 * Order matters and repeats: when the last track ends it goes back to the
 * first, so the letter is never in silence however long it is left open.
 */

/** Seconds of overlap between one track and the next. */
export const CROSSFADE = 4;

/** How loud the music sits. Low: it is behind the letter, not over it. */
export const VOLUME = 0.42;
