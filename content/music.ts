/**
 * The music.
 *
 * There are two ways to get sound into this, and they are tried in this order.
 * Nothing here can fetch a commercial recording for you, so both of them need
 * something from you first.
 *
 *
 * 1. AUDIO FILES: the good one.
 *
 *    Full songs, in order, looping, for everyone who opens the letter whether
 *    they have a Spotify account or not. Put files in public/music/ named 01
 *    and 02, with any extension a browser plays (m4a, mp3, wav, aac: not ogg,
 *    which iOS refuses).
 *
 *    You need real files, which means a purchase that gives you one: iTunes
 *    Store, Amazon Music, Bandcamp, Qobuz, a CD. A Spotify or Apple Music
 *    subscription does not: those downloads are encrypted and stay inside
 *    their apps.
 *
 *    They can also live somewhere else entirely. Give a track a full https URL
 *    below and it is played from there instead, which keeps a few megabytes of
 *    audio out of the repository and off the critical path.
 *
 *
 * 2. SPOTIFY: the one that needs no files.
 *
 *    Spotify's own embedded player, which is the licensed way to put a
 *    specific track on a page. Paste the track IDs below.
 *
 *    Know what it does before you rely on it. A listener signed in to Spotify
 *    in that browser hears the whole song; everyone else hears about thirty
 *    seconds and then it moves on to the next one. That is a licensing limit
 *    rather than a setting: Spotify's servers decide it from who is asking,
 *    and no parameter here changes it. The player is also a visible Spotify
 *    widget, small and dimmed at the foot of the screen but there, because
 *    their terms do not allow it to be hidden.
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
  track('01', 'Cry, by Cigarettes After Sex'),
  track('02', 'Y somos novios'),
];

/**
 * Spotify track IDs, in the same order.
 *
 * The ID is the last part of a track link: open.spotify.com/track/<THIS BIT>.
 * Leave one empty and it is skipped; leave both empty and Spotify is not used
 * at all.
 */
export const SPOTIFY_TRACKS: string[] = [];

/*
 * Spotify is off by default, and these are the IDs to paste back into the
 * array above if you want to try it:
 *
 *   '3p4hRhMcb6ch8OLtATMaLw'   Cry, by Cigarettes After Sex
 *   '1DG4eM5tQvuaBSEEO2NSlk'   Y somos novios
 *
 * It is off because it mostly does not work, and the ways it fails are all
 * silent:
 *
 *   A phone will not autoplay a cross-origin iframe. iOS Safari never will.
 *   So the embed loads, sits there paused, and the page plays nothing while
 *   looking like it is playing something.
 *
 *   Signed out, a listener gets about thirty seconds of each track. That is
 *   decided by Spotify's servers from who is asking, and no setting here
 *   changes it.
 *
 *   The embed exposes no volume control, so the music cannot be put under a
 *   reading of the poem, and a song and a voice at the same level are neither
 *   of them audible.
 *
 *   The widget has to be visible. Spotify's terms do not allow hiding it.
 *
 * If you do turn it on, the page now gives it six seconds to prove it is
 * making a sound and quietly plays something else if it cannot.
 */

/** Seconds of overlap between one track and the next. */
export const CROSSFADE = 4;

/** How loud the music sits. Low: it is behind the letter, not over it. */
export const VOLUME = 0.42;
