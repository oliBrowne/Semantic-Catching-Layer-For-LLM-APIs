import { CHAR_ALIASES, GLYPHS, METRICS, SPACE_ADVANCE } from '@/lib/font/strokes';
import { createRng, hashString, range } from '@/lib/rng';
import { overshoot, polylineLength, toBezierPath, type Point } from './path';

export type LaidOutStroke = {
  d: string;
  /** Arc length in design units. Drives how long the pen spends on it. */
  length: number;
  wordIndex: number;
  /** Stroke weight multiplier, standing in for pen pressure. */
  weight: number;
  /** Ink intensity. */
  opacity: number;
};

export type LaidOutWord = {
  index: number;
  text: string;
  /** Which laid-out line the word ended up on, after wrapping. */
  lineIndex: number;
  /** Which line of the *source* text it came from, before wrapping. */
  sourceLineIndex: number;
  /** True when this is the last word of its source line. */
  endsSourceLine: boolean;
  /** True when the word sits on a turnover: a source line that had to wrap. */
  turnover: boolean;
  /** Bounds in viewBox units, for aiming particles and glows at a word. */
  bounds: { x: number; y: number; width: number; height: number };
  strokes: LaidOutStroke[];
};

export type Layout = {
  /** Every stroke in the order the pen draws it. */
  strokes: LaidOutStroke[];
  words: LaidOutWord[];
  lineCount: number;
  viewBox: string;
  /** width / height of the viewBox, so callers can reserve space. */
  aspect: number;
};

export type LayoutOptions = {
  /** Usable width in design units (100 units = one em). */
  maxWidth: number;
  /** Baseline-to-baseline distance, design units. */
  lineHeight?: number;
  letterSpacing?: number;
  wordSpacing?: number;
  /** Forward lean, in degrees. */
  slant?: number;
  /** 0 draws a mechanical, perfectly repeated alphabet. 1 is a human hand. */
  jitter?: number;
  align?: 'left' | 'center';
  seed?: string;
  /**
   * How far a turnover is indented, in design units. Poetry that wraps reads
   * as prose unless the continuation is set apart from a real line break.
   */
  turnoverIndent?: number;
};

const PAD_X = 20;
const PAD_TOP = 34;
const PAD_BOTTOM = 24;

export function layoutText(text: string, options: LayoutOptions): Layout {
  const {
    maxWidth,
    lineHeight = 152,
    letterSpacing = 5,
    wordSpacing = SPACE_ADVANCE,
    slant = 8,
    jitter = 1,
    align = 'left',
    seed = text,
    turnoverIndent = 58,
  } = options;

  const rng = createRng(hashString(seed));
  const slantTan = Math.tan((slant * Math.PI) / 180);

  // 1. Break the source into hard lines, then soft-wrap each to the column.
  const sourceLines = text.split('\n').map((line) => line.trim());
  type Token = { text: string; width: number; sourceLineIndex: number; last: boolean };
  type Line = { tokens: Token[]; turnover: boolean };
  const measured: Line[] = [];

  sourceLines.forEach((source, sourceLineIndex) => {
    if (source === '') {
      measured.push({ tokens: [], turnover: false });
      return;
    }
    const parts = source.split(/\s+/);
    let current: Token[] = [];
    let currentWidth = 0;
    let turnover = false;

    parts.forEach((word, i) => {
      const width = measureWord(word, letterSpacing);
      const token: Token = {
        text: word,
        width,
        sourceLineIndex,
        last: i === parts.length - 1,
      };
      const room = turnover ? maxWidth - turnoverIndent : maxWidth;
      const projected = current.length === 0 ? width : currentWidth + wordSpacing + width;
      if (current.length > 0 && projected > room) {
        measured.push({ tokens: current, turnover });
        turnover = true;
        current = [token];
        currentWidth = width;
      } else {
        current.push(token);
        currentWidth = projected;
      }
    });
    measured.push({ tokens: current, turnover });
  });

  // 2. Place every glyph, wobbling as we go.
  const words: LaidOutWord[] = [];
  const strokes: LaidOutStroke[] = [];
  let widest = 0;
  let wordIndex = 0;

  let baseline = 0;

  measured.forEach((line, lineIndex) => {
    if (lineIndex > 0) {
      // A turnover belongs to the line above it, so it sits closer.
      baseline += line.turnover ? lineHeight * 0.82 : lineHeight;
    }
    if (line.tokens.length === 0) return;

    const indent = line.turnover ? turnoverIndent : 0;
    const lineWidth =
      line.tokens.reduce((sum, w) => sum + w.width, 0) +
      wordSpacing * (line.tokens.length - 1);
    widest = Math.max(widest, lineWidth + indent);

    const startX =
      align === 'center' ? (maxWidth - lineWidth) / 2 : indent;
    // Handwritten lines never sit perfectly level on unruled paper.
    const tilt = Math.tan((range(rng, -0.55, 0.55) * jitter * Math.PI) / 180);
    const waveSeed = range(rng, 0, 100);

    let penX = startX;

    for (const word of line.tokens) {
      const wordStrokes: LaidOutStroke[] = [];
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      const chars = Array.from(word.text);
      chars.forEach((rawChar, charIndex) => {
        const char = CHAR_ALIASES[rawChar] ?? rawChar;
        const glyph = GLYPHS[char];
        if (!glyph) {
          penX += SPACE_ADVANCE + letterSpacing;
          return;
        }

        const scale = 1 + range(rng, -0.05, 0.055) * jitter;
        const rotation = (range(rng, -2.3, 2.3) * jitter * Math.PI) / 180;
        const dx = range(rng, -1.7, 1.7) * jitter;
        const dy = range(rng, -2.3, 2.3) * jitter;
        const wave = Math.sin((penX + waveSeed) * 0.0055) * 2.1 * jitter;
        const drift = (penX - startX) * tilt;

        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        const originX = glyph.advance / 2;
        const originY = -22;

        const place = (px: number, py: number): Point => {
          const sx = (px - originX) * scale;
          const sy = (py - originY) * scale;
          const rx = sx * cos - sy * sin + originX;
          const ry = sx * sin + sy * cos + originY;
          return {
            x: rx - ry * slantTan + penX + dx,
            y: ry + baseline + dy + wave + drift,
          };
        };

        // Pressure and ink density drift a little from letter to letter, and
        // the first letter of a word lands heaviest as the nib touches down.
        const weight =
          (1 + range(rng, -0.09, 0.13) * jitter) * (charIndex === 0 ? 1.06 : 1);
        const opacity = clamp(
          (1 - range(rng, 0, 0.13) * jitter) * (1 - charIndex * 0.005),
          0.72,
          1,
        );

        glyph.strokes.forEach((flat, strokeIndex) => {
          let points: Point[] = [];
          for (let i = 0; i < flat.length; i += 2) {
            points.push(place(flat[i], flat[i + 1]));
          }

          const isFinalStroke = strokeIndex === glyph.strokes.length - 1;
          if (isFinalStroke && points.length > 2 && rng() < 0.09 * jitter) {
            points = overshoot(points, rng, range(rng, 2, 5));
          }

          for (const p of points) {
            if (p.x < minX) minX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.x > maxX) maxX = p.x;
            if (p.y > maxY) maxY = p.y;
          }

          wordStrokes.push({
            d: toBezierPath(points),
            length: Math.max(polylineLength(points), 1.5),
            wordIndex,
            weight,
            opacity,
          });
        });

        penX += glyph.advance + letterSpacing;
      });

      // Trailing letter-spacing does not belong before the word gap.
      penX = penX - letterSpacing + wordSpacing;

      if (wordStrokes.length > 0) {
        words.push({
          index: wordIndex,
          text: word.text,
          lineIndex,
          sourceLineIndex: word.sourceLineIndex,
          endsSourceLine: word.last,
          turnover: line.turnover,
          bounds: { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
          strokes: wordStrokes,
        });
        strokes.push(...wordStrokes);
        wordIndex += 1;
      }
    }
  });

  const viewMinX = -PAD_X;
  const viewMinY = METRICS.ascender - PAD_TOP;
  // The frame is the column itself, so one design unit is always the same
  // number of pixels no matter how short the longest line happens to be.
  const viewWidth = Math.max(maxWidth, widest, 1) + PAD_X * 2;
  const viewHeight =
    baseline + METRICS.descender + PAD_BOTTOM - METRICS.ascender + PAD_TOP;

  return {
    strokes,
    words,
    lineCount: measured.filter((line) => line.tokens.length > 0).length,
    viewBox: `${viewMinX} ${viewMinY} ${round(viewWidth)} ${round(viewHeight)}`,
    aspect: viewWidth / viewHeight,
  };
}

/**
 * The width of the longest source line if nothing wrapped, in design units.
 * Dividing the column width by this gives the type size at which the passage
 * keeps its own line breaks.
 */
export function naturalWidth(
  text: string,
  letterSpacing = 5,
  wordSpacing = SPACE_ADVANCE,
): number {
  let widest = 0;
  for (const line of text.split('\n')) {
    const words = line.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) continue;
    const width =
      words.reduce((sum, word) => sum + measureWord(word, letterSpacing), 0) +
      wordSpacing * (words.length - 1);
    widest = Math.max(widest, width);
  }
  return widest;
}

function measureWord(word: string, letterSpacing: number): number {
  let width = 0;
  const chars = Array.from(word);
  chars.forEach((rawChar) => {
    const char = CHAR_ALIASES[rawChar] ?? rawChar;
    const glyph = GLYPHS[char];
    width += (glyph?.advance ?? SPACE_ADVANCE) + letterSpacing;
  });
  return Math.max(width - letterSpacing, 0);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
