# Put the music here

Two files, named `01` and `02`:

1. `01`: Cry, Cigarettes After Sex
2. `02`: Y somos novios

Any extension a browser plays works: `.m4a`, `.mp3`, `.wav`, `.aac`: and the
player finds whichever is there. Avoid `.ogg`; iOS will not play it.

## Why bother, when Spotify is already wired up

Because of who is listening. Spotify's embedded player gives the whole song to
someone signed in to Spotify in that browser, and about thirty seconds to
everyone else. That is a licensing limit, not a setting: Spotify's servers
decide it based on who is asking, and there is no parameter that changes it.

Files have none of that. Full songs, full quality, no account, no widget on the
screen, no ads, the same for every person who opens the letter.

## Getting the files

It is two songs and about $2.60. You need somewhere that sells you a file
rather than streaming access:

**iTunes Store**: on a Mac, open the Music app, and if there is no "iTunes
Store" in the sidebar turn it on in Settings → General. Search the song, buy
it, and once it downloads right-click the track → Show in Finder. That file is
what you want.

**Amazon Music**: buy the MP3 (not a stream), then Your Digital Orders →
download.

**Bandcamp or Qobuz**: if the record is there, both hand you a plain file in
whatever format you pick.

Then drop both files in this folder and rename them `01` and `02`.

A Spotify or Apple Music **subscription** will not do it. Those downloads are
encrypted and only play inside their own apps, which is the whole reason
"export it from Spotify" is not a thing.

## If you have neither files nor Spotify IDs

It falls back to a room tone it synthesises for itself. Quiet, wordless, needs
nothing from anyone, and nothing errors.

## Size

These files ship with the site. A five-minute track at 128kbps is about 5 MB,
which someone opening this on mobile data has to download before it plays. If
that bothers you, host them somewhere and put the full https URL in
`content/music.ts` instead.
