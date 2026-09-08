'use client';

import { useMemo, useRef } from 'react';
import gsap from 'gsap';
import { VINE } from '@/lib/font/marks';
import { polylineLength, toBezierPath, type Point } from '@/lib/handwriting/path';
import { createRng, hashString, range } from '@/lib/rng';
import { useIsomorphicLayoutEffect } from '@/lib/useIsomorphicLayoutEffect';

/** How many tendrils go out. */
const COUNT = 7;

/**
 * Vines, spurring out from wherever the reader touched.
 *
 * One authored tendril, rotated around the point and given a different size,
 * lean and speed each time so no two are the same. They grow out from the
 * centre, hold for a moment, and are gone by the time the first line is
 * written: the whole thing is over inside three seconds.
 */
export default function Vines({ on }: { on: boolean }) {
  const hostRef = useRef<SVGSVGElement | null>(null);

  const tendrils = useMemo(() => {
    const rng = createRng(hashString('vines'));
    const paths = VINE.strokes.map((spec) => {
      const points: Point[] = spec
        .trim()
        .split(/\s+/)
        .map((pair) => {
          const [x, y] = pair.split(',');
          return { x: Number(x), y: Number(y) };
        });
      return { d: toBezierPath(points), length: polylineLength(points) };
    });

    return Array.from({ length: COUNT }, (_, index) => ({
      angle: (360 / COUNT) * index + range(rng, -9, 9),
      scale: range(rng, 0.6, 1.05),
      // Half of them mirrored, so they do not all curl the same way.
      flip: index % 2 === 0 ? 1 : -1,
      delay: index * 0.055 + range(rng, 0, 0.09),
      speed: range(rng, 240, 330),
      paths,
    }));
  }, []);

  useIsomorphicLayoutEffect(() => {
    const host = hostRef.current;
    if (!host || !on) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      tendrils.forEach((tendril, index) => {
        const group = host.querySelector<SVGGElement>(`[data-tendril="${index}"]`);
        if (!group) return;
        const nodes = Array.from(group.querySelectorAll<SVGPathElement>('path'));

        let at = tendril.delay;
        nodes.forEach((node, position) => {
          const duration = Math.max(0.12, tendril.paths[position].length / tendril.speed);
          tl.to(node, { strokeDashoffset: 0, duration, ease: 'power1.out' }, at);
          // The stem runs ahead; the leaves open behind it as it goes.
          at += position === 0 ? duration * 0.45 : duration * 0.3;
        });
      });

      // Grown, held, and gone before the letter starts.
      tl.to(host, { opacity: 0, duration: 1.5, ease: 'power2.in' }, '+=0.55');
    }, host);

    return () => ctx.revert();
  }, [on, tendrils]);

  return (
    <svg
      ref={hostRef}
      className="vines"
      viewBox="-150 -150 300 300"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      {tendrils.map((tendril, index) => (
        <g
          key={index}
          data-tendril={index}
          transform={`rotate(${tendril.angle}) scale(${tendril.scale * tendril.flip}, ${tendril.scale})`}
        >
          {tendril.paths.map((path, position) => (
            <path
              key={position}
              className="vines__stroke"
              d={path.d}
              pathLength={1}
              strokeWidth={1.15 * (VINE.weights?.[position] ?? 1)}
              style={{ strokeDasharray: 1, strokeDashoffset: 1 }}
            />
          ))}
        </g>
      ))}
    </svg>
  );
}
