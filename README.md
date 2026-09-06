# It will always be you.

A cinematic, mobile-first web experience meant to be opened from a QR code
printed inside a handwritten love letter.

It is not a website about a letter. It is the letter, in the dark, being
written again — one stroke at a time, by a hand you cannot see.

---

## What it does

- **The poem is genuinely handwritten.** Every glyph is a pen path, not a font
  outline, so the strokes are drawn in the order and direction a hand would
  move. No typewriter reveal, no per-character fades, no cursor.
- **A stanza is read one line at a time.** Each line is written alone in the
  middle of the screen, held long enough to land, and gone before the next one
  begins — except the last, which stays.
- **Nothing repeats exactly.** Letter size, slant, baseline, pressure and ink
  density all wander, seeded from the words themselves so the same passage
  always has the same quirks.
- **The room reacts.** Dust drifts toward the words as the first stanza closes,
  stops dead on *like yours did*, and a single point of deep red gathers behind
  *my heart will always know you* before scattering into embers.
- **The photograph develops.** One picture, revealed as a band behind the last
  sentence and opened outward only if the reader keeps going.
- **Sound is opt-in and synthesised.** A warm drone, a breath of room tone, an
  occasional distant bell, and the faintest scratch of a nib timed to the
  strokes on screen. Nothing plays until it is asked for; there are no audio
  files to download.

---

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
```

```bash
npm run build        # static export into ./out
npm run typecheck
```

The build is a fully static export, so `out/` can be dropped on any host.

---

## Making it yours

Three things, and nothing else, need changing.

### 1. The photograph

Replace **`public/photo.jpg`** with your picture. Keep the filename — it is
imported directly so the build can size and blur-placeholder it.

Portrait crops work best; it is displayed full-bleed behind the last words.
The file currently in the repository is a placeholder, not a photograph.

### 2. The words

Everything written on screen lives in **`content/letter.ts`**, including the
pauses. Each stanza carries a `holds` map from line index to the extra seconds
that line stays on screen after it is written, on top of the beat every line
gets. That map *is* the pacing of the piece.

```ts
export const EYES = {
  text: ['I have passed by many eyes,', 'but yours were the only ones', …].join('\n'),
  holds: { 1: 1.3 },   // linger on 'but yours were the only ones'
};
```

The three constants at the top of **`components/StanzaReader.tsx`** set the
rhythm underneath that: the beat every line is given, how long a finished line
takes to dissolve, and how much dark there is before the next one starts.

### 3. The last thing

**`components/SecretMessage.tsx`** contains a placeholder panel behind the
*one more thing* link at the very bottom. Put a voice note there:

```tsx
<audio controls src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/voice.m4a`} />
```

…with the recording in `public/`, or simply write a few more sentences.

---

## Putting it behind a QR code

Deploy anywhere static. A GitHub Pages workflow is included at
`.github/workflows/deploy.yml`:

1. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
2. Get this onto `main` — the workflow builds that branch. (Renaming the
   branch under **Settings → Branches** is enough if there is nothing else
   in the repository yet.)
3. The workflow sets `BASE_PATH` to `/<repo-name>` for you, so the published
   URL is `https://<user>.github.io/<repo-name>/`.
4. Generate a QR code for that URL and print it inside the letter.

To serve from a domain root instead, build with `BASE_PATH=` (empty).

Because the URL is unguessable in practice, the page is marked `noindex`. It is
still a public URL — treat it as private-by-obscurity, not as a secret.

---

## How the handwriting works

This is the part worth reading if you want to change how it feels.

**`lib/font/strokes.ts`** — the alphabet. Each glyph is one or more strokes,
each a run of `x,y` points the nib passes through, on a 100-unit em with the
baseline at `y = 0`:

```ts
o: g(52, '40,-30 37,-43 26,-50 14,-45 8,-31 9,-16 17,-4 29,-2 39,-11 42,-25 39,-38 34,-45'),
```

The pen lifts between strokes, exactly as it does on paper. Editing a letter
means moving a few numbers; `/specimen` renders the whole alphabet so you can
see what you did.

**`lib/handwriting/path.ts`** — turns those points into smooth cubic beziers
(so the strokes curve the way a wrist does), estimates their length, and
occasionally lets one overshoot.

**`lib/handwriting/layout.ts`** — sets the passage: measures words, wraps to the
column with a hanging indent so poetry that turns over still reads as poetry,
then jitters every glyph and returns each stroke as an SVG path.

**`components/HandwritingText.tsx`** — draws it. Each path carries
`pathLength="1"`, so a single `stroke-dashoffset` tween from `1` to `0` traces
it exactly, at a speed proportional to its length. Words get a slight speed of
their own, ink darkens and settles as each one lands, and a faint warm bloom
follows the wet nib.

Passages auto-fit: the hand shrinks until the longest written line fits the
column, and only once that would stop being legible does it allow a line to
wrap.

**`components/StanzaReader.tsx`** reads a stanza a line at a time. Every line
is mounted from the start and stacked in a single grid cell, so they all occupy
one place on screen and hand over without anything moving; each is sized to the
longest line of the whole stanza rather than to itself, so the hand does not
change size between them. Mounting them all up front is what lets a cue ask
where a word on a later line is going to be before that line is written — which
is how the ember knows where to gather.

---

## Performance and accessibility

Measured on the built site, iPhone 13 profile, CPU throttled 6x:

| | fast 4G | slow 4G |
|---|---|---|
| first paint | 0.45s | 1.0s |
| **first stroke of ink** | **1.6s** | **3.7s** |

Three things get it there, and they are worth knowing about before changing
anything near them:

- **Nothing is typeset until it is nearly needed.** Building an SVG path for
  every stroke of every word in the letter was the longest blocking task on the
  page. Each passage now waits for its `Scene` to report `near` (within a screen
  of the viewport) before laying itself out.
- **The letter loads separately from the opening.** `components/Letter.tsx` and
  everything it pulls in — ScrollTrigger included — is a dynamic import, because
  none of it is needed for `for you.` to start being written.
- **The opening beat adapts.** The 800ms of black is measured from first paint
  rather than from whenever the script finished, so a slow phone does not spend
  its wait and then wait again.

Two things kept off the main thread on purpose:

- The photograph is uncovered by two black curtains sliding apart on
  `transform`, not by animating a mask. Masking a full-screen element is a
  style recalc and a repaint every frame; this was the heaviest moment in the
  piece and is now roughly half of what it was.
- The room dimming at the end is a real element's `opacity`. It was a custom
  property on `:root`, which invalidates style for the whole document on every
  frame of it.

- Particle count, canvas pixel ratio and the wet-ink glow all scale down on
  weaker devices (`lib/usePerformanceTier.ts`). The glow was measured before it
  was kept: 0.18s of style recalc over ten seconds at 6x throttle, which is
  nothing for what it does to the ink.
- Scene layers are promoted only while they are on screen. Eight full-viewport
  layers held permanently is a lot of memory to ask a phone for.
- `prefers-reduced-motion` replaces the drawing with a calm sequential fade and
  stills the dust entirely — the line-by-line reading, the pacing and every cue
  survive.
- The full text of every passage is in the DOM for screen readers and for
  copy-and-paste, even though the visible letters are vector strokes.
- Sticky stages rather than scripted pins, so iOS Safari's disappearing chrome
  does not make the layout jump.

---

## Layout of the source

```
app/                 shell, global theme, /specimen type sheet
components/          one file per moment of the letter
content/letter.ts    the words and the pauses
lib/font/            the alphabet, as pen strokes
lib/handwriting/     geometry, typesetting
lib/particles/       the dust
lib/audio/           the room
```
