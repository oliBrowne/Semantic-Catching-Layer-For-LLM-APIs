/**
 * The music.
 *
 * There are two ways to get sound into this, and they are tried in this order.
 * Nothing here can fetch a commercial recording for you, so both of them need
 * something from you first.
 *
 *
 * 1. AUDIO FILES — the good one.
 *
 *    Full songs, in order, looping, for everyone who opens the letter whether
 *    they have a Spotify account or not. Put files in public/music/ named 01
 *    and 02, with any extension a browser plays (m4a, mp3, wav, aac — not ogg,
 *    which iOS refuses).
 *
 *    You need real files, which means a purchase that gives you one: iTunes
 *    Store, Amazon Music, Bandcamp, Qobuz, a CD. A Spotify or Apple Music
 *    subscription does not — those downloads are encrypted and stay inside
 *    their apps.
 *
 *    They can also live somewhere else entirely. Give a track a full https URL
 *    below and it is played from there instead, which keeps a few megabytes of
 *    audio out of the repository and off the critical path.
 *
 *
 * 2. SPOTIFY — the one that needs no files.
 *
 *    Spotify's own embedded player, which is the licensed way to put a
 *    specific track on a page. Paste the track IDs below.
 *
 *    Know what it does before you rely on it: a listener signed in to Spotify
 *    in that browser hears the whole song. Everyone else hears about thirty
 *    seconds. The player is also a visible Spotify widget — small and dimmed
 *    at the bottom of the screen, but there, because Spotify's terms do not
 *    allow it to be hidden.
 *
 *
 * With neither, the piece falls back to a room tone it synthesises for itself.
 * Quiet, wordless, and it needs nothing from anyone.
 */

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export type Track = {
  title: string;
  /** Tried in order; the first that exists is used. */
  sources: string[];
};

/** Whatever you have. The first of these that is actually there gets played. */
const formats = ['m4a', 'mp3', 'wav', 'aac'];

const track = (name: string, title: string, url?: string): Track => ({
  title,
  sources: url ? [url] : formats.map((extension) => `${base}/music/${name}.${extension}`),
});

export const PLAYLIST: Track[] = [
  track('01', 'Cry — Cigarettes After Sex'),
  track('02', 'Y somos novios'),
];

/**
 * Spotify track IDs, in the same order.
 *
 * The ID is the last part of a track link: open.spotify.com/track/<THIS BIT>.
 * Leave one empty and it is skipped; leave both empty and Spotify is not used
 * at all.
 */
export const SPOTIFY_TRACKS: string[] = [
  // Cry — Cigarettes After Sex. Paste the ID from its Spotify link.
  '',
  // Y somos novios, from the link you sent.
  '1DG4eM5tQvuaBSEEO2NSlk',
];

/** Seconds of overlap between one track and the next. */
export const CROSSFADE = 4;

/** How loud the music sits. Low: it is behind the letter, not over it. */
export const VOLUME = 0.42;
