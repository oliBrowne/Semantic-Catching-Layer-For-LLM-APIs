'use client';

import { useMemo, useRef } from 'react';
import gsap from 'gsap';
import type { Mark } from '@/lib/font/marks';
import { polylineLength, toBezierPath, type Point } from '@/lib/handwriting/path';
import { useIsomorphicLayoutEffect } from '@/lib/useIsomorphicLayoutEffect';

export type DrawnMarkProps = {
  mark: Mark;
  className?: string;
  /** Design units of pen travel per second. Only sets relative pacing when scrubbed. */
  speed?: number;
  strokeWidth?: number;
  /** Build paused and hand the timeline over, so scroll can drive the pen. */
  scrub?: boolean;
  start?: boolean;
  onTimeline?: (timeline: gsap.core.Timeline) => void;
  onComplete?: () => void;
  ariaLabel?: string;
};

/**
 * A drawing that draws itself, on the same terms as the writing does: real pen
 * paths, traced by stroke-dashoffset, in the order a hand would make them.
 */
export default function DrawnMark({
  mark,
  className,
  speed = 220,
  strokeWidth = 3.4,
  scrub = false,
  start = false,
  onTimeline,
  onComplete,
  ariaLabel,
}: DrawnMarkProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const handlers = useRef({ onTimeline, onComplete });
  handlers.current = { onTimeline, onComplete };

  const paths = useMemo(
    () =>
      mark.strokes.map((spec) => {
        const points: Point[] = spec
          .trim()
          .split(/\s+/)
          .map((pair) => {
            const [x, y] = pair.split(',');
            return { x: Number(x), y: Number(y) };
          });
        return { d: toBezierPath(points), length: polylineLength(points) };
      }),
    [mark],
  );

  useIsomorphicLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg || (!start && !scrub)) return;

    const ctx = gsap.context(() => {
      const nodes = Array.from(svg.querySelectorAll<SVGPathElement>('path'));
      const tl = gsap.timeline({
        paused: scrub,
        onComplete: () => handlers.current.onComplete?.(),
      });

      let at = 0;
      nodes.forEach((node, index) => {
        const duration = Math.max(0.12, paths[index].length / speed);
        tl.to(node, { strokeDashoffset: 0, duration, ease: 'none' }, at);
        // The pen lifts between passes, and rests longer before the details.
        at += duration + (index === 0 ? 0.22 : 0.1);
      });

      if (scrub) handlers.current.onTimeline?.(tl);
    }, svg);

    return () => ctx.revert();
  }, [paths, scrub, start, speed]);

  return (
    <svg
      ref={svgRef}
      className={['mark', className].filter(Boolean).join(' ')}
      viewBox={mark.viewBox}
      preserveAspectRatio="xMidYMid meet"
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : 'true'}
    >
      {paths.map((path, index) => (
        <path
          key={index}
          className="mark__stroke"
          d={path.d}
          pathLength={1}
          strokeWidth={strokeWidth * (mark.weights?.[index] ?? 1)}
          style={{ strokeDasharray: 1, strokeDashoffset: 1 }}
        />
      ))}
    </svg>
  );
}
