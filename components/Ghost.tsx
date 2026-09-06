'use client';

import { useRef, useState } from 'react';
import { gsap } from '@/lib/scroll';
import { useIsomorphicLayoutEffect } from '@/lib/useIsomorphicLayoutEffect';
import Passage from './Passage';

type GhostProps = {
  text: string;
  from: number;
  to: number;
};

/**
 * The afterimage.
 *
 * The last words before the dark do not cut away; they hang for a moment the
 * way a bright thing does when you close your eyes, and are gone by the time
 * the paper underneath them starts to show.
 */
export default function Ghost({ text, from, to }: GhostProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);

  useIsomorphicLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const vh = () => window.innerHeight;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        host,
        { opacity: 0.22 },
        {
          opacity: 0,
          ease: 'none',
          scrollTrigger: {
            start: () => vh() * from,
            end: () => vh() * to,
            scrub: 0.8,
            invalidateOnRefresh: true,
            onToggle: (self) => {
              if (self.isActive) setReady(true);
            },
            onRefresh: (self) => {
              if (self.progress > 0) setReady(true);
            },
          },
        },
      );
    });

    return () => ctx.revert();
  }, [from, to]);

  return (
    <div ref={hostRef} className="card ghost" aria-hidden="true">
      <Passage text={text} align="center" size={26} ready={ready} staticInk glow={false} />
    </div>
  );
}
