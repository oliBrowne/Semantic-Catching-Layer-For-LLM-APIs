# Put the music here

Two files, named exactly:

- `01.m4a` — Cry, Cigarettes After Sex
- `02.m4a` — the second track

They are not in this repository and cannot be: they are commercial recordings.
Use your own copies.

Any format browsers play works — `.m4a` and `.mp3` are the safe choices, `.ogg`
will not play on iOS. If you use a different extension, change the filenames in
`content/music.ts` to match.

With no files here the piece still works: it falls back to the room tone it
synthesises for itself, and nothing errors.

Note that these files ship with the site, so keep an eye on their size — a
five-minute track at 128kbps is about 5 MB, which someone opening this on
mobile data has to download.
