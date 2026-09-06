/**
 * A tiny seeded PRNG (mulberry32).
 *
 * The imperfections in the handwriting have to be stable: the same word must
 * wobble the same way on every render, or React re-renders and hydration would
 * make the letters twitch. Seeding from the text itself gives each word its own
 * permanent handwriting quirks.
 */
export function createRng(seed: number) {
  let t = seed >>> 0;
  return function next(): number {
    t += 0x6d2b79f5;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export type Rng = ReturnType<typeof createRng>;

/** Random number in [min, max). */
export function range(rng: Rng, min: number, max: number): number {
  return min + rng() * (max - min);
}
