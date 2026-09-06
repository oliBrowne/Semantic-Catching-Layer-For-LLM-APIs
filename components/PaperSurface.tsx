'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useIsomorphicLayoutEffect } from '@/lib/useIsomorphicLayoutEffect';

type PaperSurfaceProps = {
  /** The letter is on the sheet now. */
  on: boolean;
  /** It is about to be, so start letting it show through the dark. */
  lead: boolean;
};

/**
 * The original sheet, found in the dark.
 *
 * Not a card and not a panel: a faint cream light with no edges, so it reads as
 * the surface the letter was written on rather than a container on a webpage.
 */
export default function PaperSurface({ on, lead }: PaperSurfaceProps) {
  const surfaceRef = useRef<HTMLDivElement | null>(null);

  useIsomorphicLayoutEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;

    // Slow on the way in, because the dark should seem to be thinning rather
    // than something being switched on.
    gsap.to(surface, {
      opacity: on || lead ? 1 : 0,
      scale: on || lead ? 1 : 1.06,
      duration: on || lead ? 5 : 3,
      ease: 'sine.inOut',
    });
  }, [on, lead]);

  return (
    <div className="paper" aria-hidden="true">
      <div ref={surfaceRef} className="paper__sheet" style={{ opacity: 0 }}>
        <div className="paper__fibre" />
      </div>
    </div>
  );
}
