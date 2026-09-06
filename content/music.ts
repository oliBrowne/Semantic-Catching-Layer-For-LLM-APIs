/**
 * The music.
 *
 * These files are NOT in the repository and cannot be — they are commercial
 * recordings, and nothing here can fetch them for you. Put your own copies in
 * public/music/ under these names and the player picks them up; leave them out
 * and the piece falls back to the room tone it synthesises for itself, which
 * is quiet and works with no files at all.
 *
 * Any format a browser plays will do. m4a and mp3 are the safe ones; ogg is
 * not supported on iOS.
 */

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export type Track = { src: string; title: string };

export const PLAYLIST: Track[] = [
  { src: `${base}/music/01.m4a`, title: 'Cry — Cigarettes After Sex' },
  // The second track from the Spotify link. Rename the file to 02.m4a.
  { src: `${base}/music/02.m4a`, title: 'and then' },
];

/** Seconds of overlap between one track and the next. */
export const CROSSFADE = 4;

/** How loud the music sits. Low: it is behind the letter, not over it. */
export const VOLUME = 0.42;
