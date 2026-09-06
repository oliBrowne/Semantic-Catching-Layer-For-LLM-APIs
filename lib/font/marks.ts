/**
 * Two drawings that are not letters.
 *
 * Same idea as the alphabet: runs of points the pen passes through, smoothed
 * into beziers and drawn in order. These two are one-offs rather than glyphs,
 * so they live here rather than in the font.
 */

export type Mark = {
  viewBox: string;
  strokes: string[];
  /** Relative weight of each stroke, so the pen presses differently. */
  weights?: number[];
};

/**
 * A heart, drawn the way you would actually draw one: round the outside in one
 * go, back over the left side because the first pass was thin, a little shading
 * where it would fall, and a catch of light on the upper right.
 */
export const HEART: Mark = {
  viewBox: '-14 -8 228 202',
  strokes: [
    // The contour, from the notch at the top all the way round, overrunning
    // slightly where the hand comes back to where it started.
    '100,52 88,31 65,21 43,27 29,47 29,74 41,102 65,132 100,169 135,132 159,102 171,74 171,47 157,27 135,21 112,31 100,52 93,43',
    // The second pass, not quite on top of the first.
    '97,59 83,41 63,33 45,39 35,57 36,79 49,107 73,137 100,167',
    // Shading, following the inside of the lower left edge.
    '45,73 58,97',
    '55,91 70,117',
    '69,111 84,135',
    // And the light on the far lobe.
    '131,37 148,35 161,46 164,61',
  ],
  weights: [1.15, 0.8, 0.62, 0.62, 0.62, 0.55],
};

/**
 * The swash under the signature.
 *
 * The name itself is written in the same hand as the rest of the letter —
 * which is the point: the person who wrote the letter is the person signing
 * it. What makes it a signature rather than a word is this: one long stroke
 * underneath, made in a single movement, that carries past the end of the name
 * and curls back on itself.
 */
export const FLOURISH: Mark = {
  viewBox: '-10 -46 620 96',
  strokes: [
    '14,12 78,32 178,44 300,46 420,38 512,22 568,3 592,-19 579,-34 551,-25',
  ],
  weights: [1],
};
