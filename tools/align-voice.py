"""
Find where every word of the letter falls inside a spoken reading of it.

    python3 tools/align-voice.py public/voice/reading.m4a

Writes content/voice.json: one start and one end per whitespace token,
in exactly the order the renderer lays the words out, so the two sides can be
zipped together by index and can never drift.

How it works, and why it works this way.

The obvious approach is forced alignment against an acoustic model, and that is
what the last pass does. But an acoustic model is the one part of this that can
fail on a particular voice, a particular room or a particular accent, and if it
fails there is nothing to fall back on. So the timing is built in three layers,
each of which is correct on its own and each of which only refines the one
below it:

  1. Silence. Where someone reading aloud stops is not a guess, it is in the
     waveform, and finding it needs no model and no training data. For a poem
     read at a normal pace those pauses fall at the ends of lines.
  2. Pace. Matching the pauses to the lines is a small dynamic program: the
     reader's own words-per-second is measured from the recording, and the
     lines are laid against the pauses so the whole thing fits with the least
     stretching. This is what locks each line to the moment it is spoken.
  3. Syllables. Inside a line, each word is given a share of the line's time
     proportional to how long it takes to say. At the resolution of a pen this
     is very close to the truth.

Then, and only then, real forced alignment is attempted for each line, and its
answer is used where it is confident. If it fails, or the voice is one the
model cannot follow, nothing breaks: the first three layers already produced a
complete and usable answer.
"""

import json
import os
import re
import subprocess
import sys
import wave

import numpy as np
import imageio_ffmpeg
import pocketsphinx

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POEM = os.path.join(ROOT, 'tools', 'poem.txt')
OUT = os.path.join(ROOT, 'content', 'voice.json')

RATE = 16000
HOP = 160                 # 10 ms, which is also the recogniser's frame
FRAME = 0.01
MERGE_GAP = 0.26          # a pause shorter than this is inside a phrase
MIN_CHUNK = 0.14          # anything briefer than this is a click, not a word


def decode(src, dest):
    """Whatever the phone recorded becomes 16 kHz mono PCM."""
    subprocess.run(
        [imageio_ffmpeg.get_ffmpeg_exe(), '-y', '-v', 'error', '-i', src,
         '-ac', '1', '-ar', str(RATE), '-sample_fmt', 's16', dest],
        check=True,
    )


def normalise(token):
    """The dictionary spelling of a written token. Punctuation is silent."""
    return re.sub(r"[^a-z']", '', token.lower())


def syllables(word):
    """Close enough to count time by. Trailing silent e does not get a beat."""
    groups = len(re.findall(r'[aeiouy]+', word))
    if word.endswith('e') and not word.endswith(('le', 'ee', 'ye')) and groups > 1:
        groups -= 1
    return max(1, groups)


def speech_chunks(samples):
    """The stretches of the recording that have someone talking in them."""
    count = len(samples) // HOP
    frames = samples[:count * HOP].astype(np.float32).reshape(count, HOP)
    energy = np.sqrt((frames ** 2).mean(axis=1))

    # A floor taken from the quietest fifth of the recording, so the threshold
    # sits above this room rather than above an assumed one.
    floor = float(np.percentile(energy, 20))
    threshold = max(floor * 3.0 + 1.0, float(energy.max()) * 0.02)
    voiced = energy > threshold

    gap = int(MERGE_GAP / FRAME)
    chunks = []
    index = 0
    while index < count:
        if not voiced[index]:
            index += 1
            continue
        start = index
        quiet = 0
        while index < count and quiet < gap:
            quiet = 0 if voiced[index] else quiet + 1
            index += 1
        end = index - quiet
        if (end - start) * FRAME >= MIN_CHUNK:
            chunks.append((start * FRAME, end * FRAME))
    return chunks


def match(chunks, weights):
    """Lay the lines against the pauses so the whole reading fits with as
    little stretching as possible.

    `weights` is one syllable count per line. Returns, for each line, the span
    of chunks it was heard in. A group of up to four chunks may hold up to four
    lines, which covers both a reader who pauses mid-line and one who runs two
    lines together.
    """
    speech = sum(b - a for a, b in chunks)
    pace = speech / max(1, sum(weights))     # seconds per syllable, measured

    n, m = len(chunks), len(weights)
    INF = float('inf')
    cost = [[INF] * (m + 1) for _ in range(n + 1)]
    back = [[None] * (m + 1) for _ in range(n + 1)]
    cost[0][0] = 0.0

    for i in range(n + 1):
        for j in range(m + 1):
            if cost[i][j] == INF:
                continue
            for a in range(1, 5):
                if i + a > n:
                    break
                heard = sum(chunks[i + k][1] - chunks[i + k][0] for k in range(a))
                for b in range(1, 5):
                    if j + b > m:
                        break
                    expected = sum(weights[j + k] for k in range(b)) * pace
                    # Mismatched groupings are allowed but never preferred.
                    penalty = abs(heard - expected) + 0.35 * (a - 1) + 0.35 * (b - 1)
                    if cost[i][j] + penalty < cost[i + a][j + b]:
                        cost[i + a][j + b] = cost[i][j] + penalty
                        back[i + a][j + b] = (i, j, a, b)

    if cost[n][m] == INF:
        # Nothing fits, so fall back to sharing the whole recording out evenly.
        span = (chunks[0][0], chunks[-1][1]) if chunks else (0.0, 1.0)
        return [[span] for _ in weights]

    spans = [None] * m
    i, j = n, m
    while back[i][j]:
        pi, pj, a, b = back[i][j]
        group = chunks[pi:pi + a]
        total = sum(w for w in weights[pj:pj + b]) or 1
        # Share the group's speech out among its lines by syllable count.
        heard = [c[1] - c[0] for c in group]
        cursor = 0.0
        offset = 0
        for k in range(b):
            want = weights[pj + k] / total * sum(heard)
            taken = []
            while want > 1e-6 and offset < len(group):
                a0, b0 = group[offset]
                left = (b0 - a0) - cursor
                use = min(left, want)
                taken.append((a0 + cursor, a0 + cursor + use))
                cursor += use
                want -= use
                if cursor >= (b0 - a0) - 1e-6:
                    offset += 1
                    cursor = 0.0
            spans[pj + k] = taken or [group[-1]]
        i, j = pi, pj
    return spans


def spread(spans, weights):
    """Give each word a share of its line's speech, proportional to how long
    it takes to say, stepping over the silences inside the line."""
    total = sum(weights) or 1
    lengths = [b - a for a, b in spans]
    heard = sum(lengths) or 1e-6
    out = []
    cursor = 0.0
    index = 0
    for weight in weights:
        want = weight / total * heard
        start = None
        end = None
        while want > 1e-6 and index < len(spans):
            a, b = spans[index]
            left = (b - a) - cursor
            use = min(left, want)
            if start is None:
                start = a + cursor
            cursor += use
            want -= use
            end = a + cursor
            if cursor >= (b - a) - 1e-6:
                index += 1
                cursor = 0.0
        if start is None:
            start = spans[-1][1]
            end = start + 0.08
        out.append((start, max(end, start + 0.05)))
    return out


def refine(decoder, samples, spans, keys):
    """Ask the acoustic model where the words really are. Returns None if it
    cannot follow this voice, which is not an error, only a missed refinement."""
    a = spans[0][0]
    b = spans[-1][1]
    chunk = samples[int(a * RATE):int(b * RATE)]
    if len(chunk) < RATE // 8:
        return None
    try:
        decoder.set_align_text(' '.join(keys))
        decoder.start_utt()
        decoder.process_raw(chunk.tobytes(), full_utt=True)
        decoder.end_utt()
        seg = decoder.seg()
    except Exception:
        return None
    if seg is None:
        return None
    hits = [
        (a + s.start_frame * FRAME, a + s.end_frame * FRAME)
        for s in seg
        if s.word not in ('<sil>', '<s>', '</s>', '[NOISE]', '(NULL)', '')
    ]
    return hits if len(hits) == len(keys) else None


def main():
    if len(sys.argv) < 2:
        sys.exit('usage: align-voice.py <recording>')
    src = sys.argv[1]
    if not os.path.exists(src):
        sys.exit(f'no recording at {src}')

    lines = [l for l in open(POEM, encoding='utf8').read().split('\n') if l.strip()]
    tokens = [[{'text': t, 'key': normalise(t)} for t in line.split() if normalise(t)]
              for line in lines]

    wav = os.path.join(ROOT, 'tools', '.aligned.wav')
    decode(src, wav)
    with wave.open(wav) as w:
        samples = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16)
    duration = len(samples) / RATE
    os.remove(wav)

    chunks = speech_chunks(samples)
    if not chunks:
        sys.exit('that recording sounds like silence all the way through')

    weights = [sum(syllables(t['key']) for t in line) for line in tokens]
    spans = match(chunks, weights)

    model = os.path.join(pocketsphinx.get_model_path(), 'en-us')
    decoder = pocketsphinx.Decoder(pocketsphinx.Config(
        hmm=os.path.join(model, 'en-us'),
        dict=os.path.join(model, 'cmudict-en-us.dict'),
        lm=None, samprate=RATE, beam='1e-60', wbeam='1e-40', pbeam='1e-60',
        logfn=os.devnull,
    ))

    words = []
    refined = 0
    for index, line in enumerate(tokens):
        marks = spread(spans[index], [syllables(t['key']) for t in line])
        heard = refine(decoder, samples, spans[index], [t['key'] for t in line])
        if heard:
            marks = heard
            refined += 1
        for token, (start, end) in zip(line, marks):
            words.append({
                'text': token['text'],
                'line': index,
                'start': round(start, 3),
                'end': round(max(end, start + 0.05), 3),
            })

    line_times = []
    for index in range(len(lines)):
        own = [w for w in words if w['line'] == index]
        if own:
            line_times.append({'line': index, 'start': own[0]['start'], 'end': own[-1]['end']})

    json.dump(
        {'source': os.path.basename(src), 'duration': round(duration, 3),
         'words': words, 'lines': line_times},
        open(OUT, 'w', encoding='utf8'), indent=1,
    )

    speech = sum(b - a for a, b in chunks)
    print(f'{len(words)} words over {duration:.1f}s '
          f'({speech:.1f}s of it speech, in {len(chunks)} phrases)')
    print(f'{refined}/{len(lines)} lines placed by the acoustic model, '
          f'the rest by pause and syllable')
    print(f'first "{words[0]["text"]}" at {words[0]["start"]:.2f}s, '
          f'last "{words[-1]["text"]}" ends at {words[-1]["end"]:.2f}s')
    print(f'wrote {os.path.relpath(OUT, ROOT)}')


if __name__ == '__main__':
    main()
