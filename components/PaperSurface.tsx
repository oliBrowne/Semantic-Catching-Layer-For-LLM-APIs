'use client';

import { useEffect, useRef, type MutableRefObject } from 'react';
import { gsap, ScrollTrigger } from '@/lib/scroll';

type PaperSurfaceProps = {
  /** The passage where the surface first emerges out of the dark. */
  from: MutableRefObject<HTMLElement | null>;
  /** The passage it stays under, and fades away with. */
  to: MutableRefObject<HTMLElement | null>;
};

/**
 * The original sheet, found in the dark.
 *
 * Not a card and not a panel: a faint cream light with no edges, so it reads as
 * the surface the letter was written on rather than a container on a webpage.
 */
export default function PaperSurface({ from, to }: PaperSurfaceProps) {
  const surfaceRef = useRef<HTMLDivElement | null>(null);

  // Deliberately not a layout effect: this hangs off passages further down
  // the tree, whose refs are not attached until the whole page has mounted.
  useEffect(() => {
    const surface = surfaceRef.current;
    const start = from.current;
    const end = to.current;
    if (!surface || !start || !end) return;

    const ctx = gsap.context(() => {
      gsap.set(surface, { opacity: 0, scale: 1.06 });

      gsap.to(surface, {
        opacity: 1,
        scale: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: start,
          // Only once the afterimage has gone: the dark is empty for a beat
          // before the surface underneath it starts to show.
          start: () => `top top-=${window.innerHeight * 0.5}`,
          end: () => `top top-=${window.innerHeight * 1.5}`,
          scrub: 1,
        },
      });

      gsap.to(surface, {
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: end,
          start: 'bottom bottom+=90%',
          end: 'bottom bottom',
          scrub: 1,
        },
      });

      ScrollTrigger.refresh();
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
