# Put the music here

Two files, named `01` and `02`:

1. `01` — Cry, Cigarettes After Sex
2. `02` — Y somos novios

Any extension a browser plays works — `.m4a`, `.mp3`, `.wav`, `.aac` — and the
player finds whichever is there. Avoid `.ogg`; iOS will not play it.

## Where a file actually comes from

You need a real audio file, which means somewhere that sells you one:

- **iTunes Store**, **Amazon Music** (buy, not stream), **Bandcamp**, **Qobuz**
- a CD you own
- anywhere else you have already bought it

A Spotify or Apple Music subscription does **not** give you one. Those downloads
are encrypted and stay inside their apps, and stream-ripping tools break both
those services' terms and copyright.

If you would rather not commit a few megabytes of audio, host the files
somewhere and put the full https URL in `content/music.ts` instead.

## If you have no files

`content/music.ts` also takes Spotify track IDs, and the piece falls back to
Spotify's own embedded player — the licensed way to put a particular recording
on a page. Two things to know before relying on it: someone signed in to
Spotify in that browser hears the whole song and everyone else hears about
thirty seconds, and the player is a visible Spotify widget, because their terms
do not allow it to be hidden.

## If you have neither

It falls back to a room tone it synthesises for itself. Quiet, wordless, needs
nothing from anyone, and nothing errors.

## Size

These files ship with the site. A five-minute track at 128kbps is about 5 MB,
which someone opening this on mobile data has to download before it plays.
