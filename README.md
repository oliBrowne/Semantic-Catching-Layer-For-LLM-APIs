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
pauses. Each passage carries a `holds` map from line index to the extra seconds
the hand rests before starting the next line — that map *is* the pacing of the
piece.

```ts
export const EYES = {
  text: ['I have passed by many eyes,', 'but yours were the only ones', …].join('\n'),
  holds: { 1: 1.3 },   // linger after 'but yours were the only ones'
};
```

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
2. Push to `main`. The workflow sets `BASE_PATH` to `/<repo-name>` for you.
3. Generate a QR code for the published URL and print it inside the letter.

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

---

## Performance and accessibility

- Particle count, canvas pixel ratio and the wet-ink glow all scale down on
  weaker devices (`lib/usePerformanceTier.ts`).
- `prefers-reduced-motion` replaces the drawing with a calm sequential fade and
  stills the dust entirely — the pacing and every cue survive.
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
