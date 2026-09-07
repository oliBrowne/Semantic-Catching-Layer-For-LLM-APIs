# Reading the letter aloud

If there is a recording of the poem being read, the letter follows it. Every
word is written at the moment it is spoken, the pauses between lines are the
reader's own, and the music drops underneath the voice. With no recording,
nothing here applies and the piece runs on its own clock exactly as it always
did.

## Adding a reading

1. Record yourself reading the poem, straight through, in the order it appears
   in `content/letter.ts`. Any format a phone produces is fine: m4a, mp3, wav,
   aac. A quiet room matters more than a good microphone.

2. Put it in `public/voice/`, keeping the extension:

   ```
   cp ~/Downloads/reading.m4a public/voice/reading.m4a
   ```

3. Find where every word falls:

   ```
   pip3 install numpy imageio-ffmpeg pocketsphinx
   node --experimental-strip-types tools/dump-poem.mts   # refresh tools/poem.txt
   python3 tools/align-voice.py public/voice/reading.m4a
   ```

   That writes `content/voice.json`, which is what the page reads. Commit both
   it and the recording.

4. `npm run build`. The letter now takes as long as the reading does.

## What the aligner is doing

It is locating known words, not guessing at unknown ones, which is a far easier
and far more accurate job than transcription. The timing is built in layers,
each correct on its own:

- **Silence.** Where a reader stops is in the waveform. Finding it needs no
  model and no training data, and it does not care about an accent.
- **Pace.** A small dynamic program lays the lines against those pauses, using
  the reader's own measured words-per-second, so each line is locked to the
  moment it is spoken.
- **Syllables.** Inside a line, each word gets a share of the time
  proportional to how long it takes to say.

Then real forced alignment is attempted per line against the bundled acoustic
model, and used where it succeeds. If it fails, or the voice is one the model
cannot follow, nothing breaks: the layers underneath have already produced a
complete answer. The run prints how many lines the model placed, so you can
see which is carrying it.

## If a line is in the wrong place

`content/voice.json` is plain, readable JSON: one entry per word with `start`
and `end` in seconds. Nudge a number and rebuild. Nothing regenerates it unless
you run the aligner again.

## Music underneath

While the reading plays, the music is taken down to about a quarter and comes
back up when the voice stops.

Spotify is the exception, and is skipped entirely when a recording exists: its
embedded player exposes no volume control, so a song played through it cannot
be put under a voice, and the two at the same level are neither of them
audible. Supply real audio files in `public/music/` if you want music behind
your voice.
