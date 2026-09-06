/**
 * Generates the stand-in for the photograph.
 *
 * To use your own picture, just overwrite public/photo.jpg — you should never
 * need this. It is kept so the placeholder can be regenerated after someone
 * has replaced it and wants it back: `npm run placeholder`.
 *
 * Uses sharp, which Next installs for image optimisation, so it is not listed
 * as a dependency of its own.
 */
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const WIDTH = 1000;
const HEIGHT = 1400;
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'photo.jpg');

const pixels = Buffer.alloc(WIDTH * HEIGHT * 3);

for (let y = 0; y < HEIGHT; y += 1) {
  for (let x = 0; x < WIDTH; x += 1) {
    const nx = (x / WIDTH - 0.5) * 2;
    const ny = (y / HEIGHT - 0.42) * 2;
    const falloff = Math.max(0, 1 - Math.hypot(nx * 1.05, ny * 0.9));

    // A warm light somewhere off to the left, the rest given over to the dark.
    const glow = Math.pow(falloff, 2.4);
    const drift = 0.5 + 0.5 * Math.sin(nx * 2.1 + ny * 1.3);
    const grain = (Math.random() - 0.5) * 13;

    const base = 10 + glow * 92 * (0.7 + drift * 0.5);
    const i = (y * WIDTH + x) * 3;
    pixels[i] = clamp(base * 1.0 + grain);
    pixels[i + 1] = clamp(base * 0.78 + grain);
    pixels[i + 2] = clamp(base * 0.6 + grain * 0.8);
  }
}

function clamp(v) {
  return Math.max(0, Math.min(255, Math.round(v)));
}

await sharp(pixels, { raw: { width: WIDTH, height: HEIGHT, channels: 3 } })
  .blur(1.4)
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile(OUT);

console.log(`wrote ${OUT}`);
