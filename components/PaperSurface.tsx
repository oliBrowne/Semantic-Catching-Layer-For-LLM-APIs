'use client';

import { useRef } from 'react';
import { gsap } from '@/lib/scroll';
import { useIsomorphicLayoutEffect } from '@/lib/useIsomorphicLayoutEffect';

type PaperSurfaceProps = {
  /** Where along the reel the surface begins to show, in viewports. */
  from: number;
  /** And where it goes back into the dark. */
  to: number;
};

/**
 * The original sheet, found in the dark.
 *
 * Not a card and not a panel: a faint cream light with no edges, so it reads as
 * the surface the letter was written on rather than a container on a webpage.
 */
export default function PaperSurface({ from, to }: PaperSurfaceProps) {
  const surfaceRef = useRef<HTMLDivElement | null>(null);

  useIsomorphicLayoutEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;
    const vh = () => window.innerHeight;

    const ctx = gsap.context(() => {
      gsap.set(surface, { opacity: 0, scale: 1.06 });

      gsap.to(surface, {
        opacity: 1,
        scale: 1,
        ease: 'none',
        scrollTrigger: {
          start: () => vh() * from,
          end: () => vh() * (from + 1.1),
          scrub: 0.8,
          invalidateOnRefresh: true,
        },
      });

      gsap.to(surface, {
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
          start: () => vh() * to,
          end: () => vh() * (to + 1.1),
          scrub: 0.8,
          invalidateOnRefresh: true,
        },
      });
    });

    return () => ctx.revert();
  }, [from, to]);

  return (
    <div className="paper" aria-hidden="true">
      <div ref={surfaceRef} className="paper__sheet">
        <div className="paper__fibre" />
      </div>
    </div>
  );
}
