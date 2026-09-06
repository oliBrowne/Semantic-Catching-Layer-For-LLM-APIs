'use client';

import { useRef } from 'react';
import { useIsomorphicLayoutEffect } from '@/lib/useIsomorphicLayoutEffect';
import { gsap } from '@/lib/scroll';

export type EmberPhase = 'dark' | 'kindling' | 'scattered';

type EmberGlowProps = {
  /** Position within the passage, in pixels from its top-left corner. */
  point: { x: number; y: number } | null;
  phase: EmberPhase;
};

/**
 * A single point of deep red light behind one word.
 *
 * Not an icon, not a heart: just the smallest amount of warm colour the piece
 * allows itself, arriving so slowly you are not sure when it started.
 */
export default function EmberGlow({ point, phase }: EmberGlowProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useIsomorphicLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (phase === 'kindling') {
      gsap.fromTo(
        node,
        { opacity: 0, scale: 0.5 },
        { opacity: 1, scale: 1, duration: 4.2, ease: 'sine.inOut' },
      );
    } else if (phase === 'scattered') {
      gsap.to(node, { opacity: 0, scale: 1.5, duration: 3.4, ease: 'power2.out' });
    } else {
      gsap.set(node, { opacity: 0, scale: 0.5 });
    }
  }, [phase]);

  return (
    <div
      ref={ref}
      className="ember"
      aria-hidden="true"
      style={
        point
          ? ({ '--ember-x': `${point.x}px`, '--ember-y': `${point.y}px` } as React.CSSProperties)
          : undefined
      }
    />
  );
}
