import type { Rng } from '@/lib/rng';
import { range } from '@/lib/rng';

export type Point = { x: number; y: number };

/**
 * Convert a run of pen points into a smooth cubic bezier path.
 *
 * Uses a centripetal-ish Catmull-Rom formulation so the curve passes through
 * every authored point. Straight-line interpolation between the same points
 * would give the letters a faceted, connect-the-dots look; the whole illusion
 * depends on the strokes curving the way a wrist does.
 */
export function toBezierPath(points: Point[], tension = 1): string {
  if (points.length === 0) return '';
  if (points.length === 1) {
    // A dot. Draw a hair of a line so the path has length and can be stroked.
    const { x, y } = points[0];
    return `M ${r(x)} ${r(y)} l 0.01 0.01`;
  }
  if (points.length === 2) {
    return `M ${r(points[0].x)} ${r(points[0].y)} L ${r(points[1].x)} ${r(points[1].y)}`;
  }

  const k = tension / 6;
  let d = `M ${r(points[0].x)} ${r(points[0].y)}`;

  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;

    const c1x = p1.x + (p2.x - p0.x) * k;
    const c1y = p1.y + (p2.y - p0.y) * k;
    const c2x = p2.x - (p3.x - p1.x) * k;
    const c2y = p2.y - (p3.y - p1.y) * k;

    d += ` C ${r(c1x)} ${r(c1y)} ${r(c2x)} ${r(c2y)} ${r(p2.x)} ${r(p2.y)}`;
  }

  return d;
}

/** Rough arc length of the polyline, used to pace the writing. */
export function polylineLength(points: Point[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  // Smoothing bows the line out slightly past the straight-segment sum.
  return total * 1.04;
}

/**
 * Let a stroke run slightly past where it should stop.
 *
 * Real pens overshoot on exit strokes, especially at speed. Applied rarely, it
 * is the single cheapest thing that stops the lettering reading as vector art.
 */
export function overshoot(points: Point[], rng: Rng, amount: number): Point[] {
  if (points.length < 2) return points;
  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  const dx = last.x - prev.x;
  const dy = last.y - prev.y;
  const len = Math.hypot(dx, dy) || 1;
  const drift = range(rng, -0.25, 0.25);
  return [
    ...points,
    {
      x: last.x + (dx / len) * amount + drift,
      y: last.y + (dy / len) * amount + drift,
    },
  ];
}

function r(n: number): number {
  return Math.round(n * 100) / 100;
}
