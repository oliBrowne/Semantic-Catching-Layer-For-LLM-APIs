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
 * The signature.
 *
 * A signature is not handwriting. It is a shape a person has made so many
 * times that it has stopped being letters — which is why this is authored as
 * one long cursive run rather than assembled from the alphabet, and why it
 * needs far more points than a glyph does. Cursive lives in the joins: the
 * upstroke out of one letter is the entry into the next, and the loops have to
 * turn rather than corner.
 *
 * Four strokes, in the order a hand makes them: the capital, the rest of the
 * name in a single unbroken run, the dot over the i put in afterwards as they
 * always are, and a swash that exists only for the pleasure of making it.
 */
export const SIGNATURE_MARK: Mark = {
  viewBox: '4 -180 572 262',
  strokes: [
    // A big, unhurried O, closing just past where it started.
    '165,-118 150,-135 128,-145 104,-147 80,-139 60,-121 46,-95 40,-65 42,-39 52,-18 68,-5 90,0 112,-3 132,-16 147,-38 156,-66 157,-94 150,-118 138,-134 121,-141',
    // l, i, v, e and r without lifting the pen: up into the ascender loop and
    // down through it, then along the baseline and into each letter in turn.
    // The v takes a hook at the top, the e is a closed loop and the r a
    // shoulder, because without those three the whole run reads as humps.
    '170,-4 179,-46 190,-90 202,-130 209,-150 206,-160 197,-156 191,-142 189,-120 190,-88 192,-56 194,-30 198,-12 206,-3 218,-1 230,-8 240,-40 248,-62 252,-40 256,-20 260,-6 268,-1 278,-6 289,-42 299,-68 309,-42 318,-16 324,-5 334,-38 343,-66 352,-62 360,-68 364,-48 368,-33 384,-39 400,-45 396,-60 381,-67 366,-60 358,-41 361,-21 375,-8 391,-7 404,-15 414,-42 421,-63 426,-50 437,-48 447,-55 452,-44 460,-30 472,-16 486,-7 502,-6 516,-12',
    // The dot over the i.
    '246,-83 252,-89',
    // And the swash: one movement, out past the end of the name and back.
    '46,28 96,42 170,50 260,52 350,46 430,34 490,17 523,-4 529,-25 516,-36 497,-29 491,-14',
  ],
  weights: [1.15, 1.0, 0.85, 0.95],
};
